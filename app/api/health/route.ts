import { NextResponse } from 'next/server'
import { getMongoDb } from '@/lib/mongodb'
import { ensureDefaultUser } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const hasMongoUri = !!process.env.MONGODB_URI
    if (!hasMongoUri) {
      return NextResponse.json(
        {
          status: 'error',
          error: 'MONGODB_URI is not set in environment variables',
          hasMongoUri: false,
          timestamp: new Date().toISOString()
        },
        { status: 500 }
      )
    }

    const db = await getMongoDb()
    await db.command({ ping: 1 })
    await ensureDefaultUser()

    return NextResponse.json({
      status: 'healthy',
      database: 'connected (MongoDB Atlas)',
      hasMongoUri: true,
      timestamp: new Date().toISOString()
    })
  } catch (err: any) {
    return NextResponse.json(
      {
        status: 'unhealthy',
        error: err.message,
        hasMongoUri: !!process.env.MONGODB_URI,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}
