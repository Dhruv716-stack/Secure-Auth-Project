import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { prisma } from './prisma'

export interface JWTPayload {
  userId: string
  customerId: string
  email: string
}

export interface UserData {
  customerId: string
  email: string
  password: string
  name?: string
  phone?: string
  profileImage?: string
}

// Password hashing
export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 12
  return bcrypt.hash(password, saltRounds)
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword)
}

// JWT functions
export function generateJWT(payload: JWTPayload): string {
  const secret = process.env.JWT_SECRET!
  const expiresIn = process.env.JWT_EXPIRES_IN || '24h'
  
  return jwt.sign(payload, secret, { expiresIn })
}

export function verifyJWT(token: string): JWTPayload | null {
  try {
    const secret = process.env.JWT_SECRET!
    const decoded = jwt.verify(token, secret) as JWTPayload
    return decoded
  } catch (error) {
    return null
  }
}

// User functions
export async function createUser(userData: UserData) {
  const { customerId, email, password, name, phone, profileImage } = userData
  
  // Check if user already exists
  const existingUser = await prisma.user.findFirst({
    where: {
      OR: [
        { customerId },
        { email }
      ]
    }
  })

  if (existingUser) {
    throw new Error('User with this customer ID or email already exists')
  }

  // Hash password
  const passwordHash = await hashPassword(password)

  // Create user
  const user = await prisma.user.create({
    data: {
      customerId,
      email,
      passwordHash,
      name,
      phone,
      profileImage
    }
  })

  return user
}

export async function authenticateUser(customerId: string, password: string) {
  // Find user by customer ID
  const user = await prisma.user.findUnique({
    where: { customerId }
  })

  if (!user) {
    throw new Error('Invalid customer ID or password')
  }

  // Verify password
  const isValidPassword = await verifyPassword(password, user.passwordHash)
  if (!isValidPassword) {
    throw new Error('Invalid customer ID or password')
  }

  // Update last login
  await prisma.user.update({
    where: { id: user.id },
    data: { lastLogin: new Date() }
  })

  return user
}

export async function getUserById(userId: string) {
  return prisma.user.findUnique({
    where: { id: userId }
  })
}

export async function getUserByCustomerId(customerId: string) {
  return prisma.user.findUnique({
    where: { customerId }
  })
}

// Session management
export async function createSession(userId: string, token: string) {
  const expiresAt = new Date()
  expiresAt.setHours(expiresAt.getHours() + 24) // 24 hours from now

  return prisma.session.create({
    data: {
      userId,
      token,
      expiresAt
    }
  })
}

export async function getSessionByToken(token: string) {
  return prisma.session.findUnique({
    where: { token },
    include: { user: true }
  })
}

export async function deleteSession(token: string) {
  return prisma.session.delete({
    where: { token }
  })
}

export async function cleanupExpiredSessions() {
  return prisma.session.deleteMany({
    where: {
      expiresAt: {
        lt: new Date()
      }
    }
  })
} 