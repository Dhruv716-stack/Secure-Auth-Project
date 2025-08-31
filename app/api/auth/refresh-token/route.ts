import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { promises as fs } from 'fs';
import path from 'path';

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
  const token = req.cookies.get('token')?.value;
  if (!token) {
    return NextResponse.json({ message: 'No token provided.' }, { status: 401 });
  }
  try {
    const decoded: any = jwt.verify(token, JWT_SECRET);
    // Optionally, check if user still exists
    const users = await readUsers();
    const user = users.find((u: any) => u.email === decoded.email);
    if (!user) {
      return NextResponse.json({ message: 'User not found.' }, { status: 401 });
    }
    const newToken = jwt.sign({ email: user.email, customerId: user.customerId, name: user.name }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
    const res = NextResponse.json({ message: 'Token refreshed.' });
    res.cookies.set('token', newToken, { httpOnly: true, sameSite: 'lax', maxAge: 60 * 60 * 24 });
    return res;
  } catch {
    return NextResponse.json({ message: 'Invalid or expired token.' }, { status: 401 });
  }
} 