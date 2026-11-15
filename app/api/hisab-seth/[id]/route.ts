import { NextResponse } from 'next/server'
import { SethHisabService } from '@/lib/services/hisab-seth'

interface Props {
  params: Promise<{ id: string }>
}

export async function GET(request: Request, { params }: Props) {
  try {
    const { id } = await params
    const hisab = await SethHisabService.getById(Number(id))
    if (!hisab) {
      return NextResponse.json({ success: false, detail: 'Seth Hisab record not found' }, { status: 404 })
    }
    return NextResponse.json({ success: true, data: hisab })
  } catch (err: any) {
    console.error('GET /api/hisab-seth/[id] error:', err)
    return NextResponse.json(
      { success: false, detail: err.message || 'Server error loading Hisab' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: Request, { params }: Props) {
  try {
    const { id } = await params
    const deleted = await SethHisabService.delete(Number(id))
    if (!deleted) {
      return NextResponse.json({ success: false, detail: 'Hisab record not found' }, { status: 404 })
    }
    return NextResponse.json({ success: true, data: deleted })
  } catch (err: any) {
    console.error('DELETE /api/hisab-seth/[id] error:', err)
    return NextResponse.json(
      { success: false, detail: err.message || 'Server error deleting Hisab' },
      { status: 500 }
    )
  }
}
