import { NextResponse } from 'next/server'
import { ensureDefaultUser } from '@/lib/auth'

export async function GET() {
  await ensureDefaultUser()
  return NextResponse.json({ status: 'healthy', timestamp: new Date().toISOString() })
}
