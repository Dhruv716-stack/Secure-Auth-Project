import { NextRequest, NextResponse } from 'next/server'
import { createUser, generateJWT, createSession } from '@/lib/auth'
import { spawn } from 'child_process';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { customerId, email, password, name, phone, profileImage, typingPattern } = body

    // Validate required fields
    if (!customerId || !email || !password) {
      return NextResponse.json(
        { error: 'Customer ID, email, and password are required' },
        { status: 400 }
      )
    }

    // Validate customer ID format (you can customize this)
    if (!/^\d{10}$/.test(customerId)) {
      return NextResponse.json(
        { error: 'Customer ID must be exactly 10 digits' },
        { status: 400 }
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Please enter a valid email address' },
        { status: 400 }
      )
    }

    // Validate password strength
    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters long' },
        { status: 400 }
      )
    }

    // Create user
    const user = await createUser({
      customerId,
      email,
      password,
      name,
      phone,
      profileImage
    })

    // Generate JWT token
    const token = generateJWT({
      userId: user.id,
      customerId: user.customerId,
      email: user.email
    })

    // Save typing pattern if provided
    if (typingPattern && typingPattern.pattern && typingPattern.text) {
      const { prisma } = await import('@/lib/prisma')

      // Save pattern to database
      await prisma.typingPattern.create({
        data: {
          userId: user.id,
          pattern: typingPattern.pattern, // Already JSON string from frontend
          quality: typingPattern.quality || 0.5,
          type: 'manual'
        }
      })

      // Update user to indicate they have a typing pattern
      await prisma.user.update({
        where: { id: user.id },
        data: { hasTypingPattern: true }
      })
    }

    // Create session in database
    await createSession(user.id, token)

    // Set HTTP-only cookie
    const response = NextResponse.json(
      {
        message: 'User created successfully',
        user: {
          id: user.id,
          customerId: user.customerId,
          email: user.email,
          name: user.name,
          profileImage: user.profileImage,
          hasTypingPattern: typingPattern ? true : false
        }
      },
      { status: 201 }
    )

    // Set secure cookie
    response.cookies.set('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 24 * 60 * 60 // 24 hours
    })

    // Spawn the batch worker script in the background
    spawn('node', ['scripts/batch_model_cron_v2.js'], { detached: true, stdio: 'ignore' });

    return response

  } catch (error) {
    console.error('Signup error:', error)

    if (error instanceof Error) {
      if (error.message.includes('already exists')) {
        return NextResponse.json(
          { error: error.message },
          { status: 409 }
        )
      }
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 