import { getMongoDb } from '../mongodb'
import { CashBookService } from './cashbook'

export class DashboardService {
  static async getMetrics() {
    const db = await getMongoDb()

    const sumField = async (colName: string, fieldName: string): Promise<number> => {
      const res = await db.collection(colName).aggregate([
        { $group: { _id: null, total: { $sum: `$${fieldName}` } } }
      ]).toArray()
      return res[0]?.total || 0
    }

    const [
      activeEmpCount,
      totalUpad,
      totalSalary,
      activeRollsCount,
      totalPiecesCut,
      totalExpenses,
      totalIncome,
      recentActivities,
      cashSummary
    ] = await Promise.all([
      db.collection('employees').countDocuments({ status: 'Active' }),
      sumField('upad_records', 'amount'),
      sumField('salaries', 'paid_amount'),
      db.collection('rolls').countDocuments({ status: { $ne: 'Completed' } }),
      sumField('cutting_entries', 'piece_count'),
      sumField('expenses', 'amount'),
      sumField('incomes', 'amount'),
      db.collection('cash_book_ledger').find({}).sort({ id: -1 }).limit(10).toArray(),
      CashBookService.getDashboardSummary()
    ])

    return {
      total_employees: activeEmpCount,
      total_upad: totalUpad,
      total_salary: totalSalary,
      active_rolls: activeRollsCount,
      total_pieces_cut: totalPiecesCut,
      total_expenses: totalExpenses,
      total_income: totalIncome,
      cash_summary: cashSummary,
      recent_activities: recentActivities.map(({ _id, ...rest }) => rest)
    }
  }
}
