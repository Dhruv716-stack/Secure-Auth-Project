import { NextRequest, NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import path from 'path'

const USERS_FILE = path.join(process.cwd(), 'users.json')

async function readUsers() {
  try {
    const data = await fs.readFile(USERS_FILE, 'utf-8')
    return JSON.parse(data)
  } catch {
    return []
  }
}

async function writeUsers(users: any[]) {
  await fs.writeFile(USERS_FILE, JSON.stringify(users, null, 2), 'utf-8')
}

export async function POST(req: NextRequest) {
  const { name, email, customerId, password } = await req.json()
  if (!name || !email || !customerId || !password) {
    return NextResponse.json({ message: 'All fields are required.' }, { status: 400 })
  }
  if (password.length < 6) {
    return NextResponse.json({ message: 'Password must be at least 6 characters.' }, { status: 400 })
  }
  const users = await readUsers()
  if (users.find((u: any) => u.customerId === customerId)) {
    return NextResponse.json({ message: 'Customer ID already exists.' }, { status: 400 })
  }
  if (users.find((u: any) => u.email === email)) {
    return NextResponse.json({ message: 'Email already registered.' }, { status: 400 })
  }
  users.push({ name, email, customerId, password })
  await writeUsers(users)
  return NextResponse.json({ message: 'Registration successful.' }, { status: 200 })
} 