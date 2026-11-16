import { NextRequest, NextResponse } from 'next/server'
import { SuperAdminService } from '@/lib/services/super-admin'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const dropdowns = await SuperAdminService.getDropdowns(category || undefined)
    return NextResponse.json({ success: true, data: dropdowns })
  } catch (err: any) {
    console.error('GET /api/super-admin/dropdowns error:', err)
    return NextResponse.json({ success: false, detail: err.message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, category, oldItem, newItem, item, key, label, initialItems } = body

    if (action === 'create_category') {
      const created = await SuperAdminService.createDropdownCategory(key, label, initialItems || [])
      return NextResponse.json({ success: true, data: created, message: `Category "${label}" created successfully` })
    }

    if (action === 'delete_category') {
      await SuperAdminService.deleteDropdownCategory(category)
      return NextResponse.json({ success: true, message: `Category "${category}" deleted` })
    }

    if (action === 'delete_item') {
      const items = await SuperAdminService.deleteDropdownItem(category, item)
      return NextResponse.json({ success: true, data: items, message: `Item removed from ${category}` })
    }

    // Default action: add or update an item
    if (!category || !newItem) {
      return NextResponse.json({ success: false, detail: 'Category and newItem are required' }, { status: 400 })
    }

    const items = await SuperAdminService.updateDropdownItem(category, oldItem || null, newItem)
    return NextResponse.json({
      success: true,
      data: items,
      message: oldItem ? `Updated "${oldItem}" to "${newItem}"` : `Added "${newItem}" to ${category}`
    })
  } catch (err: any) {
    console.error('POST /api/super-admin/dropdowns error:', err)
    return NextResponse.json({ success: false, detail: err.message }, { status: 400 })
  }
}
