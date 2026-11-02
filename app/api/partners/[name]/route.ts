import { NextResponse } from 'next/server'
import { PartnerService } from '@/lib/services/partners'

export async function GET(request: Request, { params }: { params: Promise<{ name: string }> }) {
  try {
    const { name } = await params
    const isNumeric = /^\d+$/.test(name)

    const partner = isNumeric 
      ? await PartnerService.getById(parseInt(name, 10))
      : await PartnerService.getByName(name)

    if (!partner) {
      // Fallback: if queried as a transaction filter for passbook
      const transactions = await PartnerService.getTransactions(name)
      return NextResponse.json({ success: true, data: transactions })
    }

    return NextResponse.json({ success: true, data: partner })
  } catch (err: any) {
    console.error('GET /api/partners/[name] error:', err)
    return NextResponse.json({ success: false, detail: err.message || 'Server error' }, { status: 500 })
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ name: string }> }) {
  try {
    const { name } = await params
    const isNumeric = /^\d+$/.test(name)

    let partnerId: number | null = isNumeric ? parseInt(name, 10) : null
    if (!partnerId) {
      const p = await PartnerService.getByName(name)
      if (!p) {
        return NextResponse.json({ success: false, detail: 'Partner not found' }, { status: 404 })
      }
      partnerId = p.id
    }

    if (partnerId === null) {
      return NextResponse.json({ success: false, detail: 'Invalid partner identifier' }, { status: 400 })
    }

    const body = await request.json()
    const updated = await PartnerService.update(partnerId, {
      name: body.name,
      mobile_number: body.mobile_number !== undefined ? body.mobile_number : undefined,
      profit_share_percentage: body.profit_share_percentage !== undefined ? parseFloat(body.profit_share_percentage) : undefined,
      opening_balance: body.opening_balance !== undefined ? parseFloat(body.opening_balance) : undefined,
      status: body.status,
      notes: body.notes !== undefined ? body.notes : undefined
    })

    return NextResponse.json({ success: true, data: updated })
  } catch (err: any) {
    console.error('PUT /api/partners/[name] error:', err)
    return NextResponse.json({ success: false, detail: err.message || 'Server error' }, { status: 400 })
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ name: string }> }) {
  try {
    const { name } = await params
    const isNumeric = /^\d+$/.test(name)

    let partnerId: number | null = isNumeric ? parseInt(name, 10) : null
    if (!partnerId) {
      const p = await PartnerService.getByName(name)
      if (!p) {
        return NextResponse.json({ success: false, detail: 'Partner not found' }, { status: 404 })
      }
      partnerId = p.id
    }

    if (partnerId === null) {
      return NextResponse.json({ success: false, detail: 'Invalid partner identifier' }, { status: 400 })
    }

    const deleted = await PartnerService.delete(partnerId)
    return NextResponse.json({ success: true, message: 'Partner deleted successfully', data: deleted })
  } catch (err: any) {
    console.error('DELETE /api/partners/[name] error:', err)
    return NextResponse.json({ success: false, detail: err.message || 'Server error' }, { status: 500 })
  }
}
