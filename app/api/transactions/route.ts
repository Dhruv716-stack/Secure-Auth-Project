import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyJWT } from '@/lib/auth';
import { spawn } from 'child_process';

function isValidUpiId(upiId: string) {
  // Simple UPI ID validation: username@bank
  return /^[\w.-]+@[\w.-]+$/.test(upiId);
}

export async function POST(req: NextRequest) {
  try {
    // Authenticate user
    const token = req.cookies.get('auth-token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }
    const user = verifyJWT(token);
    if (!user) {
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });
    }

    // Parse request body
    const { amount, upiId, device, lat, lng, category } = await req.json();
    if (!amount || !upiId || !category) {
      return NextResponse.json({ error: 'Amount, UPI ID, and category are required' }, { status: 400 });
    }
    if (!isValidUpiId(upiId)) {
      return NextResponse.json({ error: 'Invalid UPI ID format' }, { status: 400 });
    }
    if (isNaN(Number(amount)) || Number(amount) <= 0) {
      return NextResponse.json({ error: 'Invalid amount' }, { status: 400 });
    }
    // Validate category
    const validCategories = [
      'Food & Dining',
      'Shopping',
      'Transportation',
      'Entertainment',
      'Bills',
    ];
    if (!validCategories.includes(category)) {
      return NextResponse.json({ error: 'Invalid category' }, { status: 400 });
    }

    // Get IP address
    let ip = req.headers.get('x-forwarded-for') || '';
    if (ip === '::1' || ip === '127.0.0.1') ip = '';

    // Lookup location if lat/lng are provided
    let location = 'Unknown';
    if (lat != null && lng != null) {
      try {
        const nominatimRes = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=10&addressdetails=1`, {
          headers: { 'User-Agent': 'CanaraSuraksha/1.0' }
        });
        const nominatim = await nominatimRes.json();
        if (nominatim && nominatim.address) {
          const city = nominatim.address.city || nominatim.address.town || nominatim.address.village || nominatim.address.hamlet || nominatim.address.county || '';
          const country = nominatim.address.country || '';
          location = city && country ? `${city}, ${country}` : country || city || 'Unknown';
        }
      } catch (e) {
        // fallback to IP-based below
      }
    }
    // If still unknown, fallback to IP-based lookup
    if (location === 'Unknown' && ip) {
      try {
        const geoRes = await fetch(`https://ipapi.co/${ip}/json/`);
        const geo = await geoRes.json();
        if (geo && geo.city && geo.country) {
          location = `${geo.city}, ${geo.country}`;
        }
      } catch (e) {
        // fallback to 'Unknown'
      }
    }

    // Simulate transaction status
    const status = 'completed';

    // Store transaction in DB
    const transaction = await prisma.transaction.create({
      data: {
        userId: user.userId,
        customerId: user.customerId,
        type: 'transfer',
        amount: Number(amount),
        description: `Sent to ${upiId}`,
        recipientId: upiId,
        status,
        ip,
        location,
        device: device || 'Unknown Device',
        lat: lat ?? null,
        lng: lng ?? null,
        category, // <-- add category
      },
    });

    // Data validation and type conversion function
    function validateAndConvertInput(input: any) {
      const requiredColumns = {
        device_type: 'string',
        click_events: 'number',
        scroll_events: 'number',
        touch_events: 'number',
        keyboard_events: 'number',
        device_motion: 'number',
        time_on_page: 'number',
        screen_size: 'string',
        browser_info: 'string',
        language: 'string',
        timezone_offset: 'number',
        device_orientation: 'string',
        geolocation_city: 'string',
        transaction_amount: 'number',
        transaction_date: 'string',
        mouse_movement: 'number'
      };

      const validated: any = {};

      for (const [column, expectedType] of Object.entries(requiredColumns)) {
        let value = input[column];

        // Handle missing values
        if (value === undefined || value === null) {
          if (expectedType === 'number') {
            value = 0;
          } else if (expectedType === 'string') {
            value = '';
          }
        } else {
          // Type conversion
          try {
            switch (expectedType) {
              case 'number':
                value = Number(value);
                if (isNaN(value)) {
                  console.warn(`Invalid number for ${column}: ${input[column]}, setting to 0`);
                  value = 0;
                }
                break;
              case 'string':
                value = String(value);
                break;
            }
          } catch (error) {
            console.warn(`Error converting ${column} to ${expectedType}: ${error}`);
            if (expectedType === 'number') {
              value = 0;
            } else if (expectedType === 'string') {
              value = '';
            }
          }
        }

        validated[column] = value;
      }

      return validated;
    }

    // Prepare input for the model with validation and type conversion
    const rawInput = [{
      device_type: device || null,
      click_events: 0,
      scroll_events: 0,
      touch_events: 0,
      keyboard_events: 0,
      device_motion: 0,
      time_on_page: 0,
      screen_size: null,
      browser_info: null,
      language: null,
      timezone_offset: 0,
      device_orientation: null,
      geolocation_city: location && typeof location === 'string' ? location.split(',')[0] : null,
      transaction_amount: Number(amount),
      transaction_date: (transaction.createdAt instanceof Date ? transaction.createdAt : new Date(transaction.createdAt)).toISOString().replace('T', ' ').slice(0, 19),
      mouse_movement: 0
    }];

    const input = rawInput.map(validateAndConvertInput);

    const fs = require('fs');
    const path = require('path');
    const inputPath = path.join(process.cwd(), 'final_production_model', 'single_input.json');
    fs.writeFileSync(inputPath, JSON.stringify(input));
    const py = spawn('python', ['final_production_model/predict_batch.py', inputPath]);
    let output = '';
    for await (const chunk of py.stdout) { output += chunk; }
    await new Promise((resolve) => py.on('close', resolve));
    fs.unlinkSync(inputPath);
    let result = [];
    try {
      result = JSON.parse(output);
    } catch (e) {
      result = [{}];
    }
    // Update transaction with model output
    await prisma.transaction.update({
      where: { id: transaction.id },
      data: {
        riskLevel: result[0]?.risk_level,
        riskReason: result[0]?.risk_reason,
        anomalyScore: result[0]?.anomaly_score,
      },
    });

    // Create a notification for the user
    await prisma.notification.create({
      data: {
        userId: user.userId,
        type: 'success',
        message: `Transaction of ₹${amount} to ${upiId} completed successfully.`,
        read: false,
      }
    });

    return NextResponse.json({ success: true, transaction });
  } catch (error) {
    console.error('Transaction error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    // Authenticate user
    const token = req.cookies.get('auth-token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }
    const user = verifyJWT(token);
    if (!user) {
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });
    }

    // Fetch transactions for this customerId, include category
    const transactions = await prisma.transaction.findMany({
      where: { customerId: user.customerId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        userId: true,
        customerId: true,
        type: true,
        amount: true,
        description: true,
        recipientId: true,
        status: true,
        ip: true,
        location: true,
        device: true,
        lat: true,
        lng: true,
        category: true,
        createdAt: true,
      },
    });
    return NextResponse.json({ transactions });
  } catch (error) {
    console.error('Fetch transactions error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 