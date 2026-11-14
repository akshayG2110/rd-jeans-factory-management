import { getMongoDb, getNextSequence } from '../mongodb'

export interface Employee {
  id: number
  employee_name: string
  role: string
  joining_date: string
  status: string
  created_at: string
  updated_at: string
}

export class EmployeeService {
  static async getAll(search?: string, role?: string, status?: string) {
    const db = await getMongoDb()
    const queryFilter: any = {}

    if (search) {
      queryFilter.employee_name = { $regex: search, $options: 'i' }
    }
    if (role) {
      queryFilter.role = role
    }
    if (status) {
      queryFilter.status = status
    }

    const employees = await db
      .collection('employees')
      .find(queryFilter)
      .sort({ id: -1 })
      .toArray()

    return employees.map(({ _id, ...rest }) => rest)
  }

  static async getById(id: number) {
    const db = await getMongoDb()
    const employee = await db.collection('employees').findOne({ id: Number(id) })
    if (!employee) return null
    const { _id, ...rest } = employee
    return rest
  }

  static async create(data: { employee_name: string; role: string; joining_date: string; status?: string }) {
    const db = await getMongoDb()
    const id = await getNextSequence('employees')
    const now = new Date().toISOString()
    const newEmployee = {
      id,
      employee_name: data.employee_name,
      role: data.role,
      joining_date: data.joining_date,
      status: data.status || 'Active',
      created_at: now,
      updated_at: now
    }

    await db.collection('employees').insertOne(newEmployee)
    const { _id, ...rest } = newEmployee as any
    return rest
  }

  static async update(id: number, data: Partial<{ employee_name: string; role: string; joining_date: string; status: string }>) {
    const db = await getMongoDb()
    const numId = Number(id)
    const existing = await db.collection('employees').findOne({ id: numId })
    if (!existing) return null

    const updateFields: any = {
      updated_at: new Date().toISOString()
    }
    if (data.employee_name !== undefined) updateFields.employee_name = data.employee_name
    if (data.role !== undefined) updateFields.role = data.role
    if (data.joining_date !== undefined) updateFields.joining_date = data.joining_date
    if (data.status !== undefined) updateFields.status = data.status

    await db.collection('employees').updateOne({ id: numId }, { $set: updateFields })
    const updated = await db.collection('employees').findOne({ id: numId })
    const { _id, ...rest } = updated as any
    return rest
  }

  static async delete(id: number) {
    const db = await getMongoDb()
    const numId = Number(id)

    // 1. Block deletion if worker has active/unsettled Upad advances
    const activeUpadCount = await db.collection('upad_records').countDocuments({
      employee_id: numId,
      status: { $ne: 'Settled' }
    })
    if (activeUpadCount > 0) {
      throw new Error('Cannot delete worker with outstanding (unsettled) Upad advances. Please settle all advances first or mark worker Inactive.')
    }

    // 2. If worker has cutting entries or salary history, soft-delete
    const [cutCount, salCount] = await Promise.all([
      db.collection('cutting_entries').countDocuments({ employee_id: numId }),
      db.collection('salaries').countDocuments({ employee_id: numId })
    ])

    if (cutCount > 0 || salCount > 0) {
      await db.collection('employees').updateOne(
        { id: numId },
        { $set: { status: 'Inactive', updated_at: new Date().toISOString() } }
      )
      const emp = await db.collection('employees').findOne({ id: numId })
      const { _id, ...rest } = emp as any
      return rest
    }

    // 3. Otherwise safe hard delete
    const empToDelete = await db.collection('employees').findOne({ id: numId })
    if (!empToDelete) return null
    await db.collection('employees').deleteOne({ id: numId })
    const { _id, ...rest } = empToDelete
    return rest
  }
}
