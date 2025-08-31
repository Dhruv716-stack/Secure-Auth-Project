import { NextRequest, NextResponse } from 'next/server'
import { verifyJWT, getSessionByToken } from '@/lib/auth'

export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get('auth-token')?.value

    if (!token) {
      return NextResponse.json(
        { error: 'No authentication token provided' },
        { status: 401 }
      )
    }

    // Verify JWT
    const payload = verifyJWT(token)
    if (!payload) {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      )
    }

    // Check if session exists in database
    const session = await getSessionByToken(token)
    if (!session || session.expiresAt < new Date()) {
      return NextResponse.json(
        { error: 'Session expired or not found' },
        { status: 401 }
      )
    }

    // Return user information
    return NextResponse.json({
      user: {
        id: session.user.id,
        customerId: session.user.customerId,
        email: session.user.email,
        name: session.user.name,
        phone: session.user.phone,
        accountType: session.user.accountType,
        lastLogin: session.user.lastLogin,
        profileImage: session.user.profileImage
      }
    })

  } catch (error) {
    console.error('Token validation error:', error)
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 