import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyJWT } from '@/lib/auth'

export async function GET(req: NextRequest) {
  try {
    // Get authentication token
    const token = req.cookies.get('auth-token')?.value
    
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify JWT to get user ID
    const payload = verifyJWT(token)
    if (!payload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    // Get cursor data for the current user
    const cursorData = await prisma.cursorData.findMany({
      where: {
        userId: payload.userId,
        action: 'batch' // Only get batch records
      },
      orderBy: {
        timestamp: 'desc'
      },
      take: 10 // Get last 10 records
    })

    return NextResponse.json({
      success: true,
      count: cursorData.length,
      data: cursorData.map(record => ({
        id: record.id,
        timestamp: record.timestamp,
        x: record.x,
        y: record.y,
        cursorArray: record.cursorArray,
        cursorCount: Array.isArray(record.cursorArray) ? record.cursorArray.length : 0
      }))
    })

  } catch (error) {
    console.error('Error fetching cursor data:', error)
    return NextResponse.json(
      { error: 'Failed to fetch cursor data' },
      { status: 500 }
    )
  }
} 