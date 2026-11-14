import { getMongoDb } from '../mongodb'
import { CashBookService } from './cashbook'

export class DashboardService {
  static async getMetrics() {
    const db = await getMongoDb()

    const [
      activeEmpCount,
      allUpads,
      allSalaries,
      activeRollsCount,
      allCuts,
      allExpenses,
      allIncomes,
      recentActivities,
      cashSummary
    ] = await Promise.all([
      db.collection('employees').countDocuments({ status: 'Active' }),
      db.collection('upad_records').find({}).toArray(),
      db.collection('salaries').find({}).toArray(),
      db.collection('rolls').countDocuments({ status: { $ne: 'Completed' } }),
      db.collection('cutting_entries').find({}).toArray(),
      db.collection('expenses').find({}).toArray(),
      db.collection('incomes').find({}).toArray(),
      db.collection('cash_book_ledger').find({}).sort({ id: -1 }).limit(10).toArray(),
      CashBookService.getDashboardSummary()
    ])

    const totalUpad = allUpads.reduce((sum, u) => sum + (Number(u.amount) || 0), 0)
    const totalSalary = allSalaries.reduce((sum, s) => sum + (Number(s.paid_amount) || 0), 0)
    const totalPiecesCut = allCuts.reduce((sum, c) => sum + (Number(c.piece_count) || 0), 0)
    const totalExpenses = allExpenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0)
    const totalIncome = allIncomes.reduce((sum, i) => sum + (Number(i.amount) || 0), 0)

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
