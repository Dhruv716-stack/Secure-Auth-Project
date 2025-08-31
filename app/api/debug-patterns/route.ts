import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const customerId = searchParams.get('customerId')

    if (!customerId) {
      return NextResponse.json({
        error: 'Customer ID is required'
      }, { status: 400 })
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { customerId }
    })

    if (!user) {
      return NextResponse.json({
        error: 'User not found'
      }, { status: 404 })
    }

    // Get typing patterns using raw query
    const patterns = await prisma.$queryRaw`
      SELECT * FROM typing_patterns 
      WHERE user_id = ${user.id} 
      ORDER BY created_at DESC
    `

    return NextResponse.json({
      user: {
        id: user.id,
        customerId: user.customerId,
        email: user.email
      },
      patterns: patterns,
      patternsCount: (patterns as any[]).length
    })

  } catch (error) {
    console.error('Debug patterns error:', error)
    return NextResponse.json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
} 