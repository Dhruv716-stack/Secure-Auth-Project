import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  try {
    // Test database connection and schema
    const users = await prisma.user.findMany({
      take: 5,
      include: {
        typingPatterns: true
      }
    })

    return NextResponse.json({
      message: 'Database connection successful',
      users: users.map(user => ({
        id: user.id,
        customerId: user.customerId,
        email: user.email,
        hasTypingPattern: user.hasTypingPattern,
        typingPatternsCount: user.typingPatterns.length
      }))
    })

  } catch (error) {
    console.error('Database test error:', error)
    return NextResponse.json({
      error: 'Database test failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { userId, pattern, quality } = body

    // Test creating a typing pattern
    const typingPattern = await prisma.typingPattern.create({
      data: {
        userId,
        pattern: JSON.stringify(pattern),
        quality: quality || 0.5,
        type: 'manual'
      }
    })

    return NextResponse.json({
      message: 'Typing pattern created successfully',
      pattern: typingPattern
    })

  } catch (error) {
    console.error('Create pattern error:', error)
    return NextResponse.json({
      error: 'Failed to create typing pattern',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
} 