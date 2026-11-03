import { NextResponse } from 'next/server'
import { ensureDefaultUser } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    await ensureDefaultUser()
    return NextResponse.json({ status: 'healthy', timestamp: new Date().toISOString() })
  } catch (err: any) {
    return NextResponse.json({ status: 'degraded', warning: err.message, timestamp: new Date().toISOString() })
  }
}
