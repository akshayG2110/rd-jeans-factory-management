import { query } from '../db'
import { CashBookService } from './cashbook'

export class DashboardService {
  static async getMetrics() {
    const empCountRes = await query("SELECT COUNT(*) as count FROM employees WHERE status = 'Active'")
    const totalUpadRes = await query('SELECT COALESCE(SUM(amount), 0) as total FROM upad_records')
    const totalSalaryRes = await query('SELECT COALESCE(SUM(paid_amount), 0) as total FROM salaries')
    const rollsCountRes = await query("SELECT COUNT(*) as count FROM rolls WHERE status != 'Completed'")
    const cuttingPiecesRes = await query('SELECT COALESCE(SUM(piece_count), 0) as total FROM cutting_entries')
    const expensesRes = await query('SELECT COALESCE(SUM(amount), 0) as total FROM expenses')
    const incomeRes = await query('SELECT COALESCE(SUM(amount), 0) as total FROM incomes')

    const cashSummary = await CashBookService.getDashboardSummary()
    const recentActivitiesRes = await query('SELECT * FROM cash_book_ledger ORDER BY id DESC LIMIT 10')

    return {
      total_employees: parseInt(empCountRes.rows[0]?.count || '0', 10),
      total_upad: parseFloat(totalUpadRes.rows[0]?.total || '0.00'),
      total_salary: parseFloat(totalSalaryRes.rows[0]?.total || '0.00'),
      active_rolls: parseInt(rollsCountRes.rows[0]?.count || '0', 10),
      total_pieces_cut: parseInt(cuttingPiecesRes.rows[0]?.total || '0', 10),
      total_expenses: parseFloat(expensesRes.rows[0]?.total || '0.00'),
      total_income: parseFloat(incomeRes.rows[0]?.total || '0.00'),
      cash_summary: cashSummary,
      recent_activities: recentActivitiesRes.rows
    }
  }
}
