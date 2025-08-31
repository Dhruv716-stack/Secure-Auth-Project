import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import jwt from 'jsonwebtoken';

const USERS_FILE = path.join(process.cwd(), 'users.json');
const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkey';
const JWT_EXPIRES_IN = '24h';

async function readUsers() {
  try {
    const data = await fs.readFile(USERS_FILE, 'utf-8');
    return JSON.parse(data);
  } catch {
    return [];
  }
}

export async function POST(req: NextRequest) {
  const { email, password } = await req.json();
  if (!email || !password) {
    return NextResponse.json({ message: 'Email and password required.' }, { status: 400 });
  }
  const users = await readUsers();
  const user = users.find((u: any) => u.email === email);
  if (!user || user.password !== password) {
    return NextResponse.json({ message: 'Invalid credentials.' }, { status: 401 });
  }
  const token = jwt.sign({ email: user.email, customerId: user.customerId, name: user.name }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
  const res = NextResponse.json({ message: 'Login successful.' });
  res.cookies.set('token', token, { httpOnly: true, sameSite: 'lax', maxAge: 60 * 60 * 24 });
  return res;
} 