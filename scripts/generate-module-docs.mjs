import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const rootDir = path.resolve(__dirname, '..')
const modulesBaseDir = path.join(rootDir, 'docs', 'testing', 'modules')

const moduleDefinitions = [
  {
    id: 'cashbook',
    name: 'Cashbook Ledger & Central Treasury',
    service: 'lib/services/cashbook.ts',
    table: 'cash_book_ledger',
    prefix: 'CSH',
    risk: 'P0 (Critical)',
    description: 'Central transactional ledger tracking factory cash drawer movements, running balance window calculation, and dual-entry synchronization with external modules.',
    invariants: [
      'Running balance for transaction i must equal running balance of (i-1) plus income_amount minus out_amount.',
      'Historical updates or deletions must cascade running balance recalculation across all subsequent entries.',
      'Foreign keys (upad_id, salary_id, seth_payment_id, income_id, expense_id, partner_id) must be accurately linked.'
    ],
    methods: [
      'recalculateBalancesFrom(startId: number, client?: any)',
      'logTransaction(date, type, name, method, inAmt, outAmt, handledBy, refMod, refId, notes, client, fks)',
      'updateByReference(refMod, refId, data, client)',
      'deleteByReference(refMod, refId, client)',
      'getAll(filters)',
      'getSummary(dateFrom?, dateTo?, handledBy?)',
      'createManualEntry(data)'
    ],
    testCases: [
      { id: 'TC-CSH-001', method: 'logTransaction', scenario: 'Log valid cash inflow', outcome: 'Transaction inserted with accurate running balance and reference linkage' },
      { id: 'TC-CSH-002', method: 'logTransaction', scenario: 'Log cash outflow with previous balance', outcome: 'Running balance decremented by out_amount accurately' },
      { id: 'TC-CSH-003', method: 'recalculateBalancesFrom', scenario: 'Recalculate balances after historical edit', outcome: 'Executes SQL window function updating all downstream running balances' },
      { id: 'TC-CSH-004', method: 'updateByReference', scenario: 'Update linked expense outflow amount', outcome: 'Cashbook entry updated and downstream balances recalculated' },
      { id: 'TC-CSH-005', method: 'deleteByReference', scenario: 'Delete linked Upad record', outcome: 'Cashbook entry deleted and downstream balances recalculated' },
      { id: 'TC-CSH-006', method: 'getSummary', scenario: 'Aggregate totals across date range', outcome: 'Returns total_income, total_out, and net_balance correctly' }
    ],
    edgeCases: [
      'Running balance dropping below zero (negative cash balance when expenses exceed cash on hand).',
      'High-value transactions (amounts exceeding ₹1,00,00,000 without integer overflow).',
      'Zero-amount transactions (income = 0 and out = 0) maintaining exact balance.',
      'Two transactions occurring with identical timestamps preserving deterministic sorting by ID.'
    ],
    mocking: 'Mock `query` and `getClient` in `lib/db.ts`. Verify execution of SQL window CTE for running balance and parameter bindings.'
  },
  {
    id: 'salary',
    name: 'Salary & Payroll Settlement',
    service: 'lib/services/salary.ts',
    table: 'salaries',
    prefix: 'SAL',
    risk: 'P0 (Critical)',
    description: 'Monthly worker wage calculation, deduction of active Upad cash advances, partial/full wage payouts, and automated cashbook outflow logging.',
    invariants: [
      'net_payable must strictly equal salary_amount minus total_upad_deducted.',
      'remaining_amount must strictly equal net_payable minus paid_amount.',
      'Settled Upad records must have status transitioned to "Settled" and settled_in_salary_id set to salary.id.',
      'Every salary disbursement must atomically record an outflow transaction in cash_book_ledger for the paid_amount.'
    ],
    methods: [
      'getAll(filters)',
      'getById(id)',
      'create(data)',
      'update(id, data)',
      'delete(id)',
      'getEmployeeSummary(employeeId)'
    ],
    testCases: [
      { id: 'TC-SAL-001', method: 'create', scenario: 'Standard full salary payment with zero Upad', outcome: 'Salary record created with net_payable = salary_amount, cashbook logs outflow' },
      { id: 'TC-SAL-002', method: 'create', scenario: 'Salary payment with multiple Upad deductions', outcome: 'Upads marked Settled, net_payable deducted correctly, paid_amount logged to cashbook' },
      { id: 'TC-SAL-003', method: 'create', scenario: 'Partial salary payment (paid_amount < net_payable)', outcome: 'remaining_amount retains outstanding balance' },
      { id: 'TC-SAL-004', method: 'create', scenario: 'Transaction rollback when cashbook insertion fails', outcome: 'ROLLBACK triggered, no salary created, client connection released' },
      { id: 'TC-SAL-005', method: 'delete', scenario: 'Revert salary payout', outcome: 'Settled Upads reverted to Pending, cashbook entry deleted, salary deleted' },
      { id: 'TC-SAL-006', method: 'getEmployeeSummary', scenario: 'Query historical wage and advance stats', outcome: 'Returns total_earned, total_paid, total_upad_deducted, pending_salary' }
    ],
    edgeCases: [
      'Total Upad advance exceeding monthly base salary (net_payable <= 0).',
      'Zero paid amount (salary finalized but payout deferred to subsequent date).',
      'Worker with inactive status attempting salary generation.',
      'Simultaneous settlement of 10+ Upad records in single monthly payout.'
    ],
    mocking: 'Mock `getClient` in `lib/db.ts`. Mock `BEGIN`, `COMMIT`, `ROLLBACK`, worker lookup, salary INSERT, Upad UPDATE, and cashbook INSERT.'
  },
  {
    id: 'upad',
    name: 'Upad (Worker Cash Advances)',
    service: 'lib/services/upad.ts',
    table: 'upad_records',
    prefix: 'UPD',
    risk: 'P0 (Critical)',
    description: 'Weekly cash advance issuance to factory workers, tracking pending vs settled status, balance aggregation, and cashbook outflow sync.',
    invariants: [
      'Creating an Upad record must atomically log an outflow entry in cash_book_ledger with reference_module="upad".',
      'An Upad record with status="Settled" cannot be modified or deleted without prior salary reversal.',
      'Employee must exist and have Active status when issuing an advance.'
    ],
    methods: [
      'getAll(filters)',
      'getById(id)',
      'create(data)',
      'update(id, data)',
      'delete(id)',
      'getEmployeeSummary(employeeId)'
    ],
    testCases: [
      { id: 'TC-UPD-001', method: 'create', scenario: 'Issue valid cash advance to active worker', outcome: 'Upad record created with Pending status, cashbook outflow logged' },
      { id: 'TC-UPD-002', method: 'create', scenario: 'Attempt to issue advance to non-existent worker', outcome: 'Rejects with employee not found error, rollback executed' },
      { id: 'TC-UPD-003', method: 'update', scenario: 'Update amount on Pending Upad record', outcome: 'Upad updated and linked cashbook outflow adjusted with balance recalculation' },
      { id: 'TC-UPD-004', method: 'update', scenario: 'Attempt to modify already Settled Upad record', outcome: 'Rejects with 400 Bad Request protecting financial audit integrity' },
      { id: 'TC-UPD-005', method: 'delete', scenario: 'Delete Pending Upad record', outcome: 'Upad deleted and linked cashbook transaction removed' },
      { id: 'TC-UPD-006', method: 'getEmployeeSummary', scenario: 'Calculate pending vs settled Upad balance', outcome: 'Returns total_taken, total_settled, and pending_balance accurately' }
    ],
    edgeCases: [
      'Worker taking multiple advances in the same week or on the same calendar day.',
      'Advance amount with decimal paise values (e.g. ₹2,500.50).',
      'Worker changing roles between Upad issuance and month-end salary settlement.'
    ],
    mocking: 'Mock `getClient` and `query` in `lib/db.ts`. Mock worker existence check, upad_records table, and CashBookService sync.'
  },
  {
    id: 'cutting',
    name: 'Cutting Lot Operations & Yield',
    service: 'lib/services/cutting.ts',
    table: 'cutting_entries',
    prefix: 'CUT',
    risk: 'P0 (Critical)',
    description: 'Precision denim piece-cutting entries, roll meter consumption, layer average calculations, and automatic finished goods inventory generation.',
    invariants: [
      'meter_used cannot exceed available remaining meters on the linked roll.',
      'Roll used_meter and remaining_meter must update atomically on every cutting entry.',
      'Roll status must automatically transition to "Partially Used" or "Completed" based on remaining meters.',
      'If piece_count > 0, finished_goods record must be automatically generated.'
    ],
    methods: [
      'getAll(filters)',
      'getById(id)',
      'create(data)',
      'update(id, data)',
      'delete(id)'
    ],
    testCases: [
      { id: 'TC-CUT-001', method: 'create', scenario: 'Log cutting lot consuming partial roll meters', outcome: 'Entry created, roll used_meter updated, status becomes Partially Used' },
      { id: 'TC-CUT-002', method: 'create', scenario: 'Log cutting lot consuming remaining roll meters exactly', outcome: 'Roll remaining_meter becomes 0, status transitions to Completed' },
      { id: 'TC-CUT-003', method: 'create', scenario: 'Attempt cutting exceeding available roll meters', outcome: 'Rejects with validation error, roll unchanged' },
      { id: 'TC-CUT-004', method: 'create', scenario: 'Auto-create finished goods entry for piece count', outcome: 'Finished goods record created with lot_number and total_pieces' },
      { id: 'TC-CUT-005', method: 'update', scenario: 'Modify meter_used on existing lot', outcome: 'Lot updated and roll meters/status recalculated' },
      { id: 'TC-CUT-006', method: 'delete', scenario: 'Delete cutting lot', outcome: 'Lot removed, roll meter restored, status reverted to Available if 0 used' }
    ],
    edgeCases: [
      'Lot consuming exactly 100% of remaining meters (0.00m left).',
      'Fractional meters used (e.g., 34.75 meters).',
      'Zero piece count cutting test entry.',
      'Multiple concurrent cutting entries targeting the same roll.'
    ],
    mocking: 'Mock `getClient` in `lib/db.ts`. Mock rolls query, cutting_entries insert, rolls status update, and finished_goods insert.'
  },
  {
    id: 'rolls',
    name: 'Denim Roll Inventory',
    service: 'lib/services/rolls.ts',
    table: 'rolls',
    prefix: 'ROL',
    risk: 'P0 (Critical)',
    description: 'Raw denim fabric roll inward tracking, short numbers, fabric types, client ownership linkage, and meter balance accounting.',
    invariants: [
      'roll_number must be globally unique across the system.',
      'remaining_meter must equal received_meter minus used_meter.',
      'Initial creation must have used_meter = 0, remaining_meter = received_meter, status = "Available".'
    ],
    methods: [
      'getAll(filters)',
      'getById(id)',
      'create(data)',
      'update(id, data)',
      'delete(id)'
    ],
    testCases: [
      { id: 'TC-ROL-001', method: 'create', scenario: 'Register valid denim fabric roll', outcome: 'Roll created with status Available and remaining_meter = received_meter' },
      { id: 'TC-ROL-002', method: 'create', scenario: 'Attempt duplicate roll_number entry', outcome: 'Rejects with unique constraint violation' },
      { id: 'TC-ROL-003', method: 'getById', scenario: 'Fetch roll details with linked Seth name', outcome: 'Returns roll details joined with seth_name' },
      { id: 'TC-ROL-004', method: 'update', scenario: 'Update roll fabric type or notes', outcome: 'Roll metadata updated successfully' },
      { id: 'TC-ROL-005', method: 'delete', scenario: 'Attempt deleting roll with existing cutting entries', outcome: 'Rejects with foreign key dependency error' },
      { id: 'TC-ROL-006', method: 'getAll', scenario: 'Filter rolls by status and fabric type', outcome: 'Returns filtered list matching query parameters' }
    ],
    edgeCases: [
      'Roll inward with decimal meters (e.g. 102.65 meters).',
      'Roll received with zero meters rejected by validation.',
      'Long roll numbers or special characters in short numbers (e.g. #SH-102/B).'
    ],
    mocking: 'Mock `query` in `lib/db.ts`. Mock rolls table responses and unique constraint errors.'
  },
  {
    id: 'auth',
    name: 'Authentication & Session Security',
    service: 'lib/auth.ts',
    table: 'users',
    prefix: 'AUTH',
    risk: 'P1 (High)',
    description: 'Administrator credential verification, bcrypt password hashing, JWT access token generation and Edge middleware route protection.',
    invariants: [
      'Passwords must always be hashed with bcrypt; plaintext passwords must never be stored.',
      'Access tokens must be signed with SECRET_KEY and expire after configured duration (30 mins).',
      'Unauthenticated requests to protected /api/* endpoints must return 401 Unauthorized.'
    ],
    methods: [
      'hashPassword(password)',
      'verifyPassword(password, storedHash)',
      'generateToken(payload)',
      'verifyToken(token)',
      'getAuthenticatedUser(request)',
      'ensureDefaultUser()'
    ],
    testCases: [
      { id: 'TC-AUTH-001', method: 'hashPassword', scenario: 'Hash clear-text password with bcrypt', outcome: 'Returns standard bcrypt hash starting with $2a$ or $2b$' },
      { id: 'TC-AUTH-002', method: 'verifyPassword', scenario: 'Verify correct password against hash', outcome: 'Returns true for valid password, false for incorrect password' },
      { id: 'TC-AUTH-003', method: 'generateToken', scenario: 'Generate JWT with username and ID payload', outcome: 'Returns valid signed JWT string containing claims' },
      { id: 'TC-AUTH-004', method: 'verifyToken', scenario: 'Verify valid and tampered tokens', outcome: 'Returns decoded payload for valid token, null for tampered token' },
      { id: 'TC-AUTH-005', method: 'getAuthenticatedUser', scenario: 'Extract user from injected headers or cookie', outcome: 'Returns user identity object with id and username' },
      { id: 'TC-AUTH-006', method: 'ensureDefaultUser', scenario: 'Seed default admin if user table empty', outcome: 'Inserts rdjeans123 with bcrypt hash if not present' }
    ],
    edgeCases: [
      'Expired JWT token rejected cleanly by verifyToken.',
      'Null or undefined stored hash passed to verifyPassword returns false safely.',
      'Empty password string rejected.',
      'Middleware token verification in Edge runtime environment.'
    ],
    mocking: 'Mock `query` in `lib/db.ts` for user lookups. Real cryptography testing for bcryptjs and jsonwebtoken.'
  },
  {
    id: 'partners',
    name: 'Partner Equity & Treasury Accounts',
    service: 'lib/services/partners.ts',
    table: 'partners',
    prefix: 'PTN',
    risk: 'P1 (High)',
    description: 'Dual-owner equity passbooks (Rajubhai vs Dhruveshbhai), tracking capital investments, personal drawings, and operational cash handling balance.',
    invariants: [
      'equity_balance = opening_balance + total_invested + total_profit_share - total_drawings.',
      'net_cash_handled = cash_in_handled - cash_out_handled from cashbook ledger entries.',
      'Partner capital movements must update partner equity and sync to cashbook.'
    ],
    methods: [
      'getAll()',
      'getByName(name)',
      'create(data)',
      'update(id, data)',
      'addTransaction(data)',
      'getSummary()'
    ],
    testCases: [
      { id: 'TC-PTN-001', method: 'getAll', scenario: 'Fetch partners with dynamic equity and cash stats', outcome: 'Returns partners with computed invested, drawings, equity, and net cash handled' },
      { id: 'TC-PTN-002', method: 'addTransaction', scenario: 'Record partner capital investment', outcome: 'Transaction logged and synced to cashbook as cash inflow' },
      { id: 'TC-PTN-003', method: 'addTransaction', scenario: 'Record partner personal drawing (withdrawal)', outcome: 'Transaction logged and synced to cashbook as cash outflow' },
      { id: 'TC-PTN-004', method: 'getByName', scenario: 'Fetch specific partner by name', outcome: 'Returns partner details matching name' },
      { id: 'TC-PTN-005', method: 'getSummary', scenario: 'Compute firm-wide partner totals', outcome: 'Aggregates total capital, total drawings, and net equity across all partners' }
    ],
    edgeCases: [
      'Partner drawings exceeding current equity balance (negative equity state).',
      'Zero opening balance with profit share allocations.',
      'Cash handled reconciliation when handled_by has slight case variations.'
    ],
    mocking: 'Mock `query` and `getClient` in `lib/db.ts`. Mock partners, partner_transactions, and cash_book_ledger queries.'
  },
  {
    id: 'employees',
    name: 'Worker & Staff Registry',
    service: 'lib/services/employees.ts',
    table: 'employees',
    prefix: 'EMP',
    risk: 'P2 (Medium)',
    description: 'Factory floor staff registry, worker role classification (Cutting, Stitching, Helpers, Staff), joining dates, and employment status.',
    invariants: [
      'employee_name cannot be empty.',
      'role must belong to designated factory labor tiers.',
      'Deleting worker must be prevented if active Upad advances or cutting entries are linked.'
    ],
    methods: [
      'getAll(search?, role?, status?)',
      'getById(id)',
      'create(data)',
      'update(id, data)',
      'delete(id)'
    ],
    testCases: [
      { id: 'TC-EMP-001', method: 'create', scenario: 'Register new factory worker', outcome: 'Worker created with Active status and joining date' },
      { id: 'TC-EMP-002', method: 'getAll', scenario: 'Filter workers by role and status', outcome: 'Returns filtered list matching role criteria' },
      { id: 'TC-EMP-003', method: 'getById', scenario: 'Fetch worker by ID', outcome: 'Returns worker record or null if not found' },
      { id: 'TC-EMP-004', method: 'update', scenario: 'Deactivate worker status', outcome: 'Worker status set to Inactive' },
      { id: 'TC-EMP-005', method: 'delete', scenario: 'Delete worker with zero history', outcome: 'Worker record removed from database' }
    ],
    edgeCases: [
      'Special characters in employee name or aliases.',
      'Future joining date handling.',
      'Worker search with SQL wildcard characters (% or _).'
    ],
    mocking: 'Mock `query` in `lib/db.ts` for employee table operations.'
  },
  {
    id: 'finished-goods',
    name: 'Finished Goods & Dispatch',
    service: 'lib/services/finished-goods.ts',
    table: 'finished_goods',
    prefix: 'FGD',
    risk: 'P2 (Medium)',
    description: 'Garment manufacturing lifecycle tracking from cutting table through stitching, washing, packing, and client dispatch.',
    invariants: [
      'total_pieces must equal stitching_pieces + finished_pieces + rejected_pieces + dispatched_pieces.',
      'Status transitions must follow factory pipeline: Cut -> In Stitching -> Washing -> Ready -> Dispatched -> Closed.',
      'Dispatched pieces cannot exceed finished pieces count.'
    ],
    methods: [
      'getAll(filters)',
      'getById(id)',
      'create(data)',
      'update(id, data)',
      'updateStatus(id, status, dispatchDate)',
      'delete(id)',
      'getSummary()'
    ],
    testCases: [
      { id: 'TC-FGD-001', method: 'create', scenario: 'Create finished goods lot from cutting', outcome: 'Record created with status Cut and initial piece counts' },
      { id: 'TC-FGD-002', method: 'updateStatus', scenario: 'Advance lot to Dispatched stage', outcome: 'Status updated to Dispatched with dispatch_date recorded' },
      { id: 'TC-FGD-003', method: 'getAll', scenario: 'Filter inventory by Seth and status', outcome: 'Returns matching garment lots' },
      { id: 'TC-FGD-004', method: 'getSummary', scenario: 'Aggregate warehouse stock counts', outcome: 'Returns total_cut, in_stitching, ready_stock, and dispatched_count' }
    ],
    edgeCases: [
      'Zero piece count lot handling.',
      'Rejection rate exceeding 50% of cut pieces.',
      'Dispatching partial lots over multiple shipments.'
    ],
    mocking: 'Mock `query` in `lib/db.ts` for finished_goods, cutting_entries, rolls, and seths.'
  },
  {
    id: 'expenses',
    name: 'Factory Operational Expenses',
    service: 'lib/services/expenses.ts',
    table: 'expenses',
    prefix: 'EXP',
    risk: 'P2 (Medium)',
    description: 'Categorized factory overhead tracking (Rent, Electricity, Machine Maintenance, Transport, Chai/Snacks) and automatic cashbook outflow synchronization.',
    invariants: [
      'Every expense logged must atomically create a cashbook outflow entry with reference_module="expense".',
      'Updating expense amount must update cashbook outflow and trigger running balance recalculation.',
      'Deleting expense must remove corresponding cashbook record.'
    ],
    methods: [
      'getAll(filters)',
      'getById(id)',
      'create(data)',
      'update(id, data)',
      'delete(id)'
    ],
    testCases: [
      { id: 'TC-EXP-001', method: 'create', scenario: 'Record factory overhead expense', outcome: 'Expense created and cashbook outflow logged atomically' },
      { id: 'TC-EXP-002', method: 'update', scenario: 'Update expense category and amount', outcome: 'Expense updated and cashbook entry synchronized' },
      { id: 'TC-EXP-003', method: 'delete', scenario: 'Delete expense receipt', outcome: 'Expense deleted and cashbook transaction removed' },
      { id: 'TC-EXP-004', method: 'getAll', scenario: 'Filter expenses by category and date range', outcome: 'Returns filtered expense list' }
    ],
    edgeCases: [
      'Expense with zero amount.',
      'Expense handled by unknown staff member.',
      'High-volume daily tea/refreshment micro-expenses.'
    ],
    mocking: 'Mock `getClient` in `lib/db.ts`. Mock expenses table and CashBookService sync.'
  },
  {
    id: 'income',
    name: 'Factory Revenue & Incomes',
    service: 'lib/services/income.ts',
    table: 'incomes',
    prefix: 'INC',
    risk: 'P2 (Medium)',
    description: 'Inward money flow tracking (Fabric scrap sales, Seth job-work charges, Machine leasing) and automatic cashbook inflow sync.',
    invariants: [
      'Every income logged must atomically create a cashbook inflow entry with reference_module="income".',
      'Updating income amount must update cashbook inflow and trigger running balance recalculation.',
      'Deleting income must remove corresponding cashbook record.'
    ],
    methods: [
      'getAll(filters)',
      'getById(id)',
      'create(data)',
      'update(id, data)',
      'delete(id)'
    ],
    testCases: [
      { id: 'TC-INC-001', method: 'create', scenario: 'Record scrap fabric revenue', outcome: 'Income created and cashbook inflow logged atomically' },
      { id: 'TC-INC-002', method: 'update', scenario: 'Update income amount', outcome: 'Income updated and cashbook entry synchronized' },
      { id: 'TC-INC-003', method: 'delete', scenario: 'Delete income record', outcome: 'Income deleted and cashbook transaction removed' },
      { id: 'TC-INC-004', method: 'getAll', scenario: 'Filter incomes by source and date range', outcome: 'Returns filtered income list' }
    ],
    edgeCases: [
      'Zero amount income entry.',
      'Payment received via Bank Transfer (NEFT) vs Cash in hand.',
      'Income with long reference / invoice numbers.'
    ],
    mocking: 'Mock `getClient` in `lib/db.ts`. Mock incomes table and CashBookService sync.'
  },
  {
    id: 'seths',
    name: 'Client ("Seth") & Job-Work Management',
    service: 'lib/services/seths.ts',
    table: 'seths',
    prefix: 'STH',
    risk: 'P2 (Medium)',
    description: 'External denim merchant and job-work client registry, roll segregation per client, and job-work payment tracking.',
    invariants: [
      'seth_name must be unique in the system.',
      'Client cannot be deleted if rolls or payments are associated with their profile.',
      'Payment from Seth must log to seth_payments and sync to cashbook ledger.'
    ],
    methods: [
      'getAll(search?, status?)',
      'getById(id)',
      'create(data)',
      'update(id, data)',
      'delete(id)',
      'addPayment(sethId, data)',
      'getPayments(sethId)'
    ],
    testCases: [
      { id: 'TC-STH-001', method: 'create', scenario: 'Register new client profile', outcome: 'Seth profile created with Active status' },
      { id: 'TC-STH-002', method: 'addPayment', scenario: 'Record client job-work payment', outcome: 'Payment recorded in seth_payments and cashbook inflow logged' },
      { id: 'TC-STH-003', method: 'getAll', scenario: 'Search clients by business name', outcome: 'Returns matching client list' },
      { id: 'TC-STH-004', method: 'delete', scenario: 'Attempt to delete client with active rolls', outcome: 'Rejects with dependency error' }
    ],
    edgeCases: [
      'Client with duplicate business name variant.',
      'Client with international or non-standard mobile number.',
      'Multiple payments received on the same invoice.'
    ],
    mocking: 'Mock `query` and `getClient` in `lib/db.ts` for seths and seth_payments.'
  },
  {
    id: 'reports',
    name: 'Reporting & Document Generation Engine',
    service: 'lib/services/reports.ts',
    table: 'multiple',
    prefix: 'REP',
    risk: 'P2 (Medium)',
    description: 'Analytical export engine generating audit-ready reports in CSV (RFC 4180), Excel (.xlsx via ExcelJS), and PDF (via jsPDF and autotable) across 12 business categories.',
    invariants: [
      'CSV exports must be formatted according to RFC 4180 with proper quotation and comma escaping.',
      'Excel exports must produce valid XLSX binary buffers with styled headers and column widths.',
      'PDF exports must generate structured vector documents with page numbering and tables.'
    ],
    methods: [
      'exportData(category, filters)',
      'exportToCSV(rows, category)',
      'exportToExcel(rows, category, filters)',
      'exportToPDF(rows, category, filters)'
    ],
    testCases: [
      { id: 'TC-REP-001', method: 'exportData', scenario: 'Query cashbook category data with date filter', outcome: 'Returns formatted array of ledger transaction rows' },
      { id: 'TC-REP-002', method: 'exportToCSV', scenario: 'Generate CSV string from transaction rows', outcome: 'Returns valid RFC 4180 CSV with headers and escaped commas' },
      { id: 'TC-REP-003', method: 'exportToExcel', scenario: 'Generate Excel XLSX workbook buffer', outcome: 'Returns non-empty Buffer containing styled worksheet' },
      { id: 'TC-REP-004', method: 'exportToPDF', scenario: 'Generate PDF binary document', outcome: 'Returns non-empty Buffer containing PDF document structure' },
      { id: 'TC-REP-005', method: 'exportData', scenario: 'Unknown report category passed', outcome: 'Defaults safely to cashbook or returns empty list' }
    ],
    edgeCases: [
      'Exporting empty dataset (zero rows matched by filter) produces valid document with headers.',
      'Data rows containing double quotes, commas, or newlines in notes column.',
      'Large report export with 5,000+ rows without buffer exhaustion.'
    ],
    mocking: 'Mock `query` in `lib/db.ts`. Mock or verify Buffer output from ExcelJS and jsPDF.'
  },
  {
    id: 'dashboard',
    name: 'Factory KPI Metrics & Analytics',
    service: 'lib/services/dashboard.ts',
    table: 'multiple',
    prefix: 'DSH',
    risk: 'P3 (Normal)',
    description: 'Executive dashboard aggregator synthesizing live worker counts, active rolls, pieces cut, total Upad, monthly salary obligations, and real-time cash balance.',
    invariants: [
      'Metrics must reflect accurate count and sum queries across database tables.',
      'Cash balance in KPI card must exactly match latest cash_book_ledger running balance.',
      'Recent activities must return latest 10 cash transactions in reverse chronological order.'
    ],
    methods: [
      'getMetrics()'
    ],
    testCases: [
      { id: 'TC-DSH-001', method: 'getMetrics', scenario: 'Aggregate factory KPI counters', outcome: 'Returns accurate totals for employees, upad, salary, rolls, pieces, and cash' },
      { id: 'TC-DSH-002', method: 'getMetrics', scenario: 'Zero records in database (clean state)', outcome: 'Returns zeroes without NaN or null pointer crashes' },
      { id: 'TC-DSH-003', method: 'getMetrics', scenario: 'Verify recent activities feed', outcome: 'Returns top 10 latest transactions ordered by ID desc' }
    ],
    edgeCases: [
      'Database containing zero employees, rolls, or transactions.',
      'All rolls in Completed status (active_rolls = 0).',
      'Negative net cash balance reflected accurately in cash summary card.'
    ],
    mocking: 'Mock `query` in `lib/db.ts` for COUNT and SUM aggregations across all 7 core tables.'
  }
]

for (const mod of moduleDefinitions) {
  const dir = path.join(modulesBaseDir, mod.id)
  fs.mkdirSync(dir, { recursive: true })

  // 1. README.md
  const readmeContent = `# ${mod.name} Module - Testing Specification
**Module ID:** \`${mod.id}\`  
**Target Service:** \`${mod.service}\`  
**Primary Database Table:** \`${mod.table}\`  
**Risk Rating:** \`${mod.risk}\`  

---

## 1. Module Responsibility & Architecture
${mod.description}

### Key Business Invariants:
${mod.invariants.map(inv => `- ${inv}`).join('\n')}

### Target Service Methods:
${mod.methods.map(m => `- \`${m}\``).join('\n')}

---

## 2. Testing Documentation Directory Index
- [UNIT_TESTS.md](file:///d:/Akshay%20RD%20jeans/docs/testing/modules/${mod.id}/UNIT_TESTS.md): Detailed unit testing scope and test suite specification.
- [TEST_CASES.md](file:///d:/Akshay%20RD%20jeans/docs/testing/modules/${mod.id}/TEST_CASES.md): Formal test case catalog with inputs and expected outcomes.
- [EDGE_CASES.md](file:///d:/Akshay%20RD%20jeans/docs/testing/modules/${mod.id}/EDGE_CASES.md): Boundary values, zero/negative inputs, and overflow scenarios.
- [MOCKING.md](file:///d:/Akshay%20RD%20jeans/docs/testing/modules/${mod.id}/MOCKING.md): Database queries, clients, and transactional mock patterns.
- [COVERAGE.md](file:///d:/Akshay%20RD%20jeans/docs/testing/modules/${mod.id}/COVERAGE.md): Code coverage targets and branch enforcement rules.
`
  fs.writeFileSync(path.join(dir, 'README.md'), readmeContent)

  // 2. UNIT_TESTS.md
  const unitTestsContent = `# ${mod.name} - Unit Test Specification
**Document ID:** \`QA-MOD-${mod.prefix}-UNIT\`  
**Target Unit File:** \`tests/unit/services/${mod.id}.service.test.ts\`  

---

## 1. Unit Testing Objectives
The unit test suite for \`${mod.id}\` validates pure business logic, calculations, and transactional integrity in isolation from live database connections.

## 2. Methods Under Test
${mod.methods.map((m, idx) => `### 2.${idx + 1} \`${m}\`
- **Scope**: Verifies algorithmic accuracy, input validation, and expected SQL queries.
- **Mock Dependencies**: \`lib/db.ts\`
- **Isolation Principle**: Pure unit execution with mocked database client.
`).join('\n')}

## 3. Test Lifecycle & Isolation
\`\`\`typescript
import { describe, it, expect, beforeEach, vi } from 'vitest'
import * as db from '@/lib/db'

describe('${mod.name} Unit Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })
})
\`\`\`
`
  fs.writeFileSync(path.join(dir, 'UNIT_TESTS.md'), unitTestsContent)

  // 3. TEST_CASES.md
  const testCasesContent = `# ${mod.name} - Formal Test Cases Catalog
**Document ID:** \`QA-MOD-${mod.prefix}-CASES\`  

---

## 1. Test Case Matrix

| Test ID | Method | Scenario | Expected Outcome | Priority |
| :--- | :--- | :--- | :--- | :---: |
${mod.testCases.map(tc => `| **${tc.id}** | \`${tc.method}\` | ${tc.scenario} | ${tc.outcome} | High |`).join('\n')}

---

## 2. Detailed Test Specifications
${mod.testCases.map(tc => `### ${tc.id}: ${tc.scenario}
- **Target Function**: \`${tc.method}\`
- **Preconditions**: Mock client configured with matching database records.
- **Execution**: Invoke function with scenario parameters.
- **Expected Result**: ${tc.outcome}.
`).join('\n')}
`
  fs.writeFileSync(path.join(dir, 'TEST_CASES.md'), testCasesContent)

  // 4. EDGE_CASES.md
  const edgeCasesContent = `# ${mod.name} - Edge Cases & Boundary Values
**Document ID:** \`QA-MOD-${mod.prefix}-EDGE\`  

---

## 1. Critical Boundary Scenarios
${mod.edgeCases.map((ec, idx) => `### Edge Case ${idx + 1}: ${ec}
- **Boundary Type**: ${idx === 0 ? 'Extreme Boundary / Zero' : idx === 1 ? 'Precision / Overflow' : 'Concurrency / Transition'}
- **Verification Rule**: Must be asserted in test suite with explicit input fixtures.
- **Expected Behavior**: Safe handling without NaN, data truncation, or crash.
`).join('\n')}

## 2. Stress & Precision Invariants
- Verify that numeric amounts preserve two decimal places without floating-point drift.
- Ensure transaction isolation prevents race conditions.
`
  fs.writeFileSync(path.join(dir, 'EDGE_CASES.md'), edgeCasesContent)

  // 5. MOCKING.md
  const mockingContent = `# ${mod.name} - Mocking & Isolation Strategy
**Document ID:** \`QA-MOD-${mod.prefix}-MOCK\`  

---

## 1. Mocking Scope
${mod.mocking}

## 2. Database Adapter Interaction Patterns
For methods executing database queries:
- Intercept \`lib/db.ts\` exports (\`query\`, \`getClient\`, \`pool\`).
- Ensure mock returns valid rows matching schema for \`${mod.table}\`.

\`\`\`typescript
vi.mock('@/lib/db', () => ({
  query: vi.fn(),
  getClient: vi.fn()
}))
\`\`\`

## 3. Transaction Sequence Verification
Where applicable:
1. \`mockClient.query('BEGIN')\`
2. Queries for \`${mod.table}\`
3. Cross-module queries (e.g. \`cash_book_ledger\`)
4. \`mockClient.query('COMMIT')\`
5. \`mockClient.release()\` in finally block.
`
  fs.writeFileSync(path.join(dir, 'MOCKING.md'), mockingContent)

  // 6. COVERAGE.md
  const coverageContent = `# ${mod.name} - Code Coverage Targets
**Document ID:** \`QA-MOD-${mod.prefix}-COV\`  

---

## 1. Quality Gate Targets

| Coverage Metric | Minimum Required Gate | Target Standard |
| :--- | :---: | :---: |
| **Line Coverage** | **90.0%** | **95.0%** |
| **Branch Coverage** | **85.0%** | **90.0%** |
| **Function Coverage** | **90.0%** | **95.0%** |
| **Statement Coverage** | **90.0%** | **95.0%** |

## 2. Critical Branch Coverage Requirements
- Must achieve 100% branch coverage on financial calculations and state transitions.
- Must cover both error rollback branches and happy path commit branches.
`
  fs.writeFileSync(path.join(dir, 'COVERAGE.md'), coverageContent)

  console.log(`✓ Generated 6 test docs for module: ${mod.id}`)
}

console.log('\nAll 14 application modules documented successfully!')
