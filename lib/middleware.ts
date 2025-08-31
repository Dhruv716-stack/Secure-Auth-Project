import { NextRequest, NextResponse } from 'next/server'
import { verifyJWT, getSessionByToken } from './auth'

export interface AuthenticatedRequest extends NextRequest {
  user?: {
    id: string
    customerId: string
    email: string
  }
}

export async function authenticateRequest(req: NextRequest): Promise<AuthenticatedRequest> {
  const authHeader = req.headers.get('authorization')
  const token = authHeader?.replace('Bearer ', '') || req.cookies.get('auth-token')?.value

  if (!token) {
    throw new Error('No authentication token provided')
  }

  // Verify JWT
  const payload = verifyJWT(token)
  if (!payload) {
    throw new Error('Invalid or expired token')
  }

  // Check if session exists in database
  const session = await getSessionByToken(token)
  if (!session || session.expiresAt < new Date()) {
    throw new Error('Session expired or not found')
  }

  // Add user info to request
  const authenticatedReq = req as AuthenticatedRequest
  authenticatedReq.user = {
    id: payload.userId,
    customerId: payload.customerId,
    email: payload.email
  }

  return authenticatedReq
}

export function withAuth(handler: (req: AuthenticatedRequest) => Promise<NextResponse>) {
  return async (req: NextRequest): Promise<NextResponse> => {
    try {
      const authenticatedReq = await authenticateRequest(req)
      return handler(authenticatedReq)
    } catch (error) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }
  }
} 