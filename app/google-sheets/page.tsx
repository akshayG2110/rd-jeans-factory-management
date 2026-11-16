"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import {
  ArrowLeft,
  Cloud,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  Users,
  HandCoins,
  Building2,
  Calculator,
  Scissors,
  Package,
  Archive,
  Handshake,
  TrendingUp,
  TrendingDown,
  BookOpen,
  BarChart3,
  ExternalLink,
  Layers,
  Database
} from "lucide-react"

interface ModuleItem {
  key: string
  name: string
  sheetName: string
  route: string
  icon: any
  iconBg: string
  iconColor: string
  description: string
  columns: string[]
}

const FACTORY_MODULES: ModuleItem[] = [
  {
    key: "employees",
    name: "Employees",
    sheetName: "Employees",
    route: "/employees",
    icon: Users,
    iconBg: "bg-blue-500/10",
    iconColor: "text-blue-600",
    description: "Staff registry, roles, joining dates & status",
    columns: ["Employee ID", "Employee Name", "Role", "Joining Date", "Status", "Created Date", "Synced At"]
  },
  {
    key: "upad",
    name: "Upad (Advances)",
    sheetName: "Upad",
    route: "/upad",
    icon: HandCoins,
    iconBg: "bg-amber-500/10",
    iconColor: "text-amber-600",
    description: "Employee cash advances, settlements & salary link",
    columns: ["Upad ID", "Date", "Employee Name", "Amount (₹)", "Payment Method", "Handled By", "Status", "Settled In Salary ID", "Settled Date", "Notes", "Synced At"]
  },
  {
    key: "seths",
    name: "Seth (Clients)",
    sheetName: "Seths",
    route: "/seths",
    icon: Building2,
    iconBg: "bg-indigo-500/10",
    iconColor: "text-indigo-600",
    description: "Client directory, contact info, total rolls & meters",
    columns: ["Seth ID", "Seth Name", "Mobile Number", "Address", "Status", "Total Rolls Received", "Total Fabric Meters Received", "Notes", "Synced At"]
  },
  {
    key: "hisab-seth",
    name: "Hisab Seth",
    sheetName: "Seth Hisab",
    route: "/hisab-seth",
    icon: Calculator,
    iconBg: "bg-emerald-500/10",
    iconColor: "text-emerald-600",
    description: "Cutting & roll job settlements, stitching rates & slips",
    columns: ["Hisab Number", "Date", "Seth Client", "Lots Count", "Total Pieces", "Total Fabric (m)", "Average (m/pc)", "Stitching Rate (₹)", "Stitching Amount (₹)", "Extra Charges (₹)", "Deductions (₹)", "Gross Total (₹)", "Paid Amount (₹)", "Balance Due (₹)", "Payment Status", "Payment Method", "Handled By", "Notes", "Synced At"]
  },
  {
    key: "cutting",
    name: "Cutting",
    sheetName: "Cutting",
    route: "/cutting",
    icon: Scissors,
    iconBg: "bg-rose-500/10",
    iconColor: "text-rose-600",
    description: "Cutting lot records, fabric consumption & piece counts",
    columns: ["Cutting ID", "Cutting Date", "Lot Number", "Worker / Cutter", "Seth Client", "Roll Number", "Fabric Type", "Meters Used", "Pieces Cut", "Size", "Pana", "Average (m/pc)", "Sort Number", "Notes", "Synced At"]
  },
  {
    key: "inventory",
    name: "Finished Goods",
    sheetName: "Finished Goods",
    route: "/inventory",
    icon: Package,
    iconBg: "bg-purple-500/10",
    iconColor: "text-purple-600",
    description: "Garment stages: In Stitching, Ready, Dispatched",
    columns: ["ID", "Lot Number", "Seth Client", "Item Name", "Size", "Color Shade", "Total Pieces", "In Stitching", "Finished / Ready", "Rejected", "Dispatched", "Unit Price (₹)", "Status", "Dispatch Date", "Notes", "Synced At"]
  },
  {
    key: "rolls",
    name: "Roll Inventory",
    sheetName: "Rolls",
    route: "/rolls",
    icon: Archive,
    iconBg: "bg-teal-500/10",
    iconColor: "text-teal-600",
    description: "Denim rolls received, meters used & stock in warehouse",
    columns: ["Roll ID", "Entry Date", "Seth Client", "Roll Number", "Short Number", "Fabric Type", "Received Meters", "Used Meters", "Remaining Meters", "Status", "Notes", "Synced At"]
  },
  {
    key: "partners",
    name: "Partners",
    sheetName: "Partners",
    route: "/partners",
    icon: Handshake,
    iconBg: "bg-amber-500/10",
    iconColor: "text-amber-600",
    description: "Partner investments, personal drawings & equity balances",
    columns: ["Partner ID", "Partner Name", "Mobile Number", "Profit Share %", "Opening Balance (₹)", "Current Equity Balance (₹)", "Total Invested (₹)", "Total Drawings (₹)", "Status", "Notes", "Synced At"]
  },
  {
    key: "income",
    name: "Income",
    sheetName: "Income",
    route: "/income",
    icon: TrendingUp,
    iconBg: "bg-emerald-500/10",
    iconColor: "text-emerald-600",
    description: "Daily factory receipts, seth payments & scrap sales",
    columns: ["Income ID", "Income Date", "Source Category", "Party / Source Name", "Amount (₹)", "Payment Method", "Handled By", "Reference Number", "Notes", "Synced At"]
  },
  {
    key: "expense",
    name: "Expenses",
    sheetName: "Expenses",
    route: "/expense",
    icon: TrendingDown,
    iconBg: "bg-red-500/10",
    iconColor: "text-red-600",
    description: "Operational expenditure, repairs, utilities & materials",
    columns: ["Expense ID", "Expense Date", "Expense Category", "Party / Payee Name", "Amount (₹)", "Payment Method", "Handled By", "Reference Number", "Notes", "Synced At"]
  },
  {
    key: "cashbook",
    name: "Cash Book",
    sheetName: "Cash Book",
    route: "/cashbook",
    icon: BookOpen,
    iconBg: "bg-cyan-500/10",
    iconColor: "text-cyan-600",
    description: "Real-time cash ledger running balance & cash reconciliation",
    columns: ["Entry ID", "Date", "Transaction Type", "Party / Particulars", "Payment Method", "Handled By", "Income (₹)", "Expense / Out (₹)", "Running Balance (₹)", "Reference Module", "Notes", "Synced At"]
  },
  {
    key: "reports",
    name: "Reports Summary",
    sheetName: "Reports Summary",
    route: "/reports",
    icon: BarChart3,
    iconBg: "bg-fuchsia-500/10",
    iconColor: "text-fuchsia-600",
    description: "High-level factory KPI dashboard metrics snapshot",
    columns: ["Factory Metric / KPI", "Value", "Operational Details", "Report Generated At"]
  }
]

export default function GoogleSheetsSyncPage() {
  const [mounted, setMounted] = useState(false)
  const [webhookUrl, setWebhookUrl] = useState("")
  const [autoSync, setAutoSync] = useState(true)
  const [lastSyncAt, setLastSyncAt] = useState<string | null>(null)
  const [totalSynced, setTotalSynced] = useState(0)
  const [syncedModules, setSyncedModules] = useState<string[]>([])
  const [scriptCode, setScriptCode] = useState("")
  const [counts, setCounts] = useState<Record<string, number>>({})
  const [organization, setOrganization] = useState({
    name: "DenimFlow Factory",
    slug: "rd-jeans-main",
    database_name: "rd_jeans_factory",
  })

  // Loading & feedback states
  const [isTesting, setIsTesting] = useState(false)
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null)
  const [isSyncingAll, setIsSyncingAll] = useState(false)
  const [syncAllResult, setSyncAllResult] = useState<{ success: boolean; message: string; details?: Record<string, number> } | null>(null)
  const [syncingModule, setSyncingModule] = useState<string | null>(null)
  const [moduleResults, setModuleResults] = useState<Record<string, string>>({})
  const [copiedScript, setCopiedScript] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)

  // Fetch settings & counts on mount
  const loadData = async () => {
    try {
      const res = await fetch("/api/google-sheets")
      const json = await res.json()
      if (json.success && json.data) {
        setWebhookUrl(json.data.webhook_url || "")
        setAutoSync(json.data.auto_sync_enabled !== false)
        setLastSyncAt(json.data.last_sync_at || null)
        setTotalSynced(json.data.total_synced || 0)
        setSyncedModules(json.data.synced_modules || [])
        setScriptCode(json.data.script_code || "")
        if (json.data.counts) {
          setCounts(json.data.counts)
        }
        if (json.data.organization) {
          setOrganization(json.data.organization)
        }
      }
    } catch (err) {
      console.error("Failed to load Google Sheets settings:", err)
    }
  }

  useEffect(() => {
    setMounted(true)
    loadData()
  }, [])

  // Save Config
  const handleSaveSettings = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    setIsSaving(true)
    setSaveSuccess(false)
    try {
      const res = await fetch("/api/google-sheets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          webhook_url: webhookUrl.trim(),
          auto_sync_enabled: autoSync
        })
      })
      const json = await res.json()
      if (json.success) {
        setSaveSuccess(true)
        setTimeout(() => setSaveSuccess(false), 3000)
      }
    } catch (err) {
      console.error("Failed to save settings:", err)
    } finally {
      setIsSaving(false)
    }
  }

  // Test Connection
  const handleTestConnection = async () => {
    setIsTesting(true)
    setTestResult(null)
    try {
      const res = await fetch("/api/google-sheets/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: webhookUrl.trim() })
      })
      const json = await res.json()
      setTestResult(json)
    } catch (err: any) {
      setTestResult({ success: false, message: err.message || "Failed to reach Google Sheets" })
    } finally {
      setIsTesting(false)
    }
  }

  // Sync Entire Factory (All 12 Modules)
  const handleSyncAllFactory = async () => {
    if (!webhookUrl) {
      setTestResult({ success: false, message: "Please configure your Google Apps Script Webhook URL first." })
      return
    }

    setIsSyncingAll(true)
    setSyncAllResult(null)
    try {
      const res = await fetch("/api/google-sheets/sync-all", { method: "POST" })
      const json = await res.json()
      setSyncAllResult(json)
      if (json.success) {
        loadData()
      }
    } catch (err: any) {
      setSyncAllResult({ success: false, message: err.message || "Factory sync encountered an error" })
    } finally {
      setIsSyncingAll(false)
    }
  }

  // Sync a Single Module Tab
  const handleSyncModule = async (moduleKey: string, sheetName: string) => {
    if (!webhookUrl) {
      setTestResult({ success: false, message: "Please configure your Google Apps Script Webhook URL first." })
      return
    }

    setSyncingModule(moduleKey)
    try {
      const res = await fetch(`/api/google-sheets/sync-module?module=${encodeURIComponent(moduleKey)}`, {
        method: "POST"
      })
      const json = await res.json()
      if (json.success) {
        setModuleResults(prev => ({
          ...prev,
          [moduleKey]: `✓ ${json.count} rows synced to "${sheetName}"`
        }))
        loadData()
      } else {
        setModuleResults(prev => ({
          ...prev,
          [moduleKey]: `✕ Error: ${json.message || "Failed"}`
        }))
      }
    } catch (err: any) {
      setModuleResults(prev => ({
        ...prev,
        [moduleKey]: `✕ Error: ${err.message || "Network failed"}`
      }))
    } finally {
      setSyncingModule(null)
    }
  }

  // Copy Script Code
  const handleCopyScript = () => {
    if (scriptCode) {
      navigator.clipboard.writeText(scriptCode)
      setCopiedScript(true)
      setTimeout(() => setCopiedScript(false), 2000)
    }
  }

  if (!mounted) {
    return (
      <main className="min-h-screen bg-background">
        <div className="mx-auto max-w-4xl px-5 py-6">
          <div className="h-8 w-48 animate-pulse rounded bg-muted" />
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-background text-foreground pb-24">
      <div className="mx-auto flex max-w-4xl flex-col gap-6 px-4 py-5 md:px-6 md:py-8">

        {/* Top Header */}
        <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="flex h-10 w-10 items-center justify-center rounded-full bg-card shadow-xs ring-1 ring-border/60 transition-transform active:scale-90 hover:bg-muted"
            >
              <ArrowLeft className="h-5 w-5 text-foreground" />
            </Link>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
                <span>Google Sheets Sync Hub</span>
                <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-700 dark:text-emerald-400">
                  12 Separate Sheets
                </span>
              </h1>
              <p className="text-xs text-muted-foreground">
                Real-time cloud mirror for all Quick Access factory data to prevent data loss
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleSyncAllFactory}
              disabled={isSyncingAll || !webhookUrl}
              className="flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-emerald-700 active:scale-95 disabled:opacity-50 transition-all"
            >
              <RefreshCw className={`h-4 w-4 ${isSyncingAll ? "animate-spin" : ""}`} />
              <span>{isSyncingAll ? "Syncing Entire Factory..." : "Sync Entire Factory (All 12 Sheets)"}</span>
            </button>
          </div>
        </header>

        {/* Active Organization Isolation Notice */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 rounded-2xl bg-card p-4 shadow-xs ring-1 ring-border/70">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground font-black text-sm">
              {organization.name ? organization.name.slice(0, 2).toUpperCase() : "RD"}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-sm font-extrabold text-foreground">{organization.name}</h3>
                <span className="rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[9px] font-black text-emerald-600 dark:text-emerald-400 ring-1 ring-emerald-500/20">
                  Isolated Workspace Sync
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Database: <code className="font-mono text-foreground font-semibold">{organization.database_name}</code> • Only this organization's data is synced to your Google Sheet.
              </p>
            </div>
          </div>
        </div>

        {/* Global Factory Sync Result Banner */}
        {syncAllResult && (
          <div
            className={`rounded-2xl p-4 text-xs font-semibold flex flex-col gap-2 ring-1 ${
              syncAllResult.success
                ? "bg-emerald-50 text-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200 ring-emerald-500/30"
                : "bg-red-50 text-red-900 dark:bg-red-950/40 dark:text-red-200 ring-red-500/30"
            }`}
          >
            <div className="flex items-center gap-2">
              {syncAllResult.success ? (
                <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
              ) : (
                <AlertCircle className="h-5 w-5 text-red-600 shrink-0" />
              )}
              <span className="font-bold">{syncAllResult.message}</span>
            </div>
            {syncAllResult.details && (
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2 mt-1 pt-2 border-t border-emerald-200/50 dark:border-emerald-800/40">
                {Object.entries(syncAllResult.details).map(([sheet, rowCount]) => (
                  <div key={sheet} className="flex flex-col bg-background/60 p-2 rounded-lg text-center">
                    <span className="text-[10px] text-muted-foreground truncate">{sheet}</span>
                    <span className="text-xs font-black text-foreground">{rowCount} rows</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Status Metrics Cards */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-2xl bg-card p-3.5 ring-1 ring-border/60 shadow-xs flex flex-col gap-1">
            <span className="text-[10px] font-bold text-muted-foreground uppercase">Connection Status</span>
            <div className="flex items-center gap-2 mt-0.5">
              <span className={`h-2.5 w-2.5 rounded-full ${webhookUrl ? "bg-emerald-500 animate-pulse" : "bg-muted-foreground"}`} />
              <span className="text-xs font-extrabold text-foreground">
                {webhookUrl ? "Active & Linked" : "Not Configured"}
              </span>
            </div>
          </div>

          <div className="rounded-2xl bg-card p-3.5 ring-1 ring-border/60 shadow-xs flex flex-col gap-1">
            <span className="text-[10px] font-bold text-muted-foreground uppercase">Target Sheets</span>
            <span className="text-base font-black text-foreground">12 Tabs</span>
            <span className="text-[10px] text-muted-foreground">Each module in separate tab</span>
          </div>

          <div className="rounded-2xl bg-card p-3.5 ring-1 ring-border/60 shadow-xs flex flex-col gap-1">
            <span className="text-[10px] font-bold text-muted-foreground uppercase">Auto Real-Time Sync</span>
            <span className={`text-xs font-black ${autoSync ? "text-emerald-600" : "text-muted-foreground"}`}>
              {autoSync ? "Enabled (Live)" : "Disabled"}
            </span>
            <span className="text-[10px] text-muted-foreground">Syncs on create/payment</span>
          </div>

          <div className="rounded-2xl bg-card p-3.5 ring-1 ring-border/60 shadow-xs flex flex-col gap-1">
            <span className="text-[10px] font-bold text-muted-foreground uppercase">Last Factory Sync</span>
            <span className="text-xs font-bold text-foreground truncate">
              {lastSyncAt ? new Date(lastSyncAt).toLocaleString("en-IN") : "Never"}
            </span>
            <span className="text-[10px] text-muted-foreground">{totalSynced} records synced</span>
          </div>
        </div>

        {/* Configuration & Apps Script Accordion */}
        <div className="rounded-3xl bg-card p-5 md:p-6 shadow-sm ring-1 ring-border/60 flex flex-col gap-5">
          <div className="flex items-center justify-between border-b border-border/60 pb-3">
            <div className="flex items-center gap-2.5">
              <Cloud className="h-5 w-5 text-emerald-600" />
              <div>
                <h2 className="text-sm font-bold text-foreground">Google Apps Script Webhook Configuration</h2>
                <p className="text-xs text-muted-foreground">Paste your deployment URL from your Google Spreadsheet</p>
              </div>
            </div>
            {saveSuccess && (
              <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                <Check className="h-3.5 w-3.5" /> Saved!
              </span>
            )}
          </div>

          <form onSubmit={handleSaveSettings} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-foreground">Web App Deployment URL</label>
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="url"
                  value={webhookUrl}
                  onChange={(e) => setWebhookUrl(e.target.value)}
                  placeholder="https://script.google.com/macros/s/.../exec"
                  required
                  className="flex-1 rounded-xl bg-background p-2.5 text-xs text-foreground ring-1 ring-border focus:ring-2 focus:ring-primary"
                />
                <button
                  type="submit"
                  disabled={isSaving}
                  className="rounded-xl bg-primary px-5 py-2.5 text-xs font-bold text-primary-foreground shadow-xs hover:opacity-95 active:scale-95 disabled:opacity-50"
                >
                  {isSaving ? "Saving..." : "Save URL"}
                </button>
              </div>
              <span className="text-[10px] text-muted-foreground">
                Get this URL by clicking <b>Deploy &gt; New deployment &gt; Web app &gt; Anyone</b> in your Google Sheet&apos;s Apps Script.
              </span>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl bg-muted/40 p-3.5 ring-1 ring-border/60">
              <div>
                <p className="text-xs font-bold text-foreground">Auto Real-Time Sync</p>
                <p className="text-[10px] text-muted-foreground">
                  Automatically append row to corresponding sheet when an entry is added or paid in any module
                </p>
              </div>
              <div className="flex items-center gap-3">
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={autoSync}
                    onChange={(e) => {
                      setAutoSync(e.target.checked)
                      fetch("/api/google-sheets", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ auto_sync_enabled: e.target.checked })
                      })
                    }}
                    className="sr-only peer"
                  />
                  <div className="w-10 h-5 bg-muted peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
                </label>

                <button
                  type="button"
                  onClick={handleTestConnection}
                  disabled={isTesting || !webhookUrl}
                  className="flex items-center gap-1.5 rounded-xl bg-card px-3 py-1.5 text-xs font-bold text-foreground ring-1 ring-border hover:bg-muted active:scale-95 disabled:opacity-50 shadow-2xs"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${isTesting ? "animate-spin" : ""}`} />
                  <span>{isTesting ? "Testing..." : "Test Connection"}</span>
                </button>
              </div>
            </div>

            {/* Test Connection Result Feedback */}
            {testResult && (
              <div
                className={`rounded-xl p-3 text-xs font-semibold flex items-center gap-2 ${
                  testResult.success
                    ? "bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 ring-1 ring-emerald-600/30"
                    : "bg-red-50 text-red-800 dark:bg-red-950/40 dark:text-red-300 ring-1 ring-red-600/30"
                }`}
              >
                {testResult.success ? (
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                ) : (
                  <AlertCircle className="h-4 w-4 shrink-0 text-red-600" />
                )}
                <span>{testResult.message}</span>
              </div>
            )}
          </form>

          {/* Quick Setup Instructions Box */}
          <div className="rounded-2xl bg-muted/20 p-4 ring-1 ring-border/50 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase text-foreground">
                Easy 2-Minute Setup for Your Google Spreadsheet
              </span>
              <button
                onClick={handleCopyScript}
                className="flex items-center gap-1.5 rounded-lg bg-card px-3 py-1.5 text-xs font-bold text-foreground ring-1 ring-border hover:bg-muted active:scale-95 shadow-2xs"
              >
                {copiedScript ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                <span>{copiedScript ? "Copied Script!" : "Copy Apps Script Code"}</span>
              </button>
            </div>

            <ol className="list-decimal list-inside text-xs text-muted-foreground flex flex-col gap-1.5 leading-relaxed">
              <li>Open <a href="https://sheets.new" target="_blank" rel="noreferrer" className="font-bold text-foreground underline inline-flex items-center gap-0.5">Google Sheets <ExternalLink className="h-2.5 w-2.5" /></a> and create a new blank spreadsheet.</li>
              <li>Click <b>Extensions &gt; Apps Script</b> in the Google Sheets top menu.</li>
              <li>Delete everything in the script editor and click <b>Copy Apps Script Code</b> above, then paste it in.</li>
              <li>Click <b>Deploy &gt; New deployment</b>. Select <b>Web app</b>.</li>
              <li>Set <i>Who has access</i> to <b>Anyone</b>, then click <b>Deploy</b>.</li>
              <li>Copy the generated <b>Web app URL</b>, paste it in the box above, and click <b>Save URL</b>!</li>
            </ol>

            <pre className="max-h-28 overflow-y-auto rounded-xl bg-background p-2.5 text-[10px] font-mono text-muted-foreground ring-1 ring-border/70 select-all leading-tight">
              {scriptCode || "Loading Apps Script..."}
            </pre>
          </div>
        </div>

        {/* All 12 Modules Multi-Sheet Control Panel */}
        <section className="flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="text-base font-bold text-foreground flex items-center gap-2">
                <Layers className="h-5 w-5 text-primary" />
                <span>Factory Modules &amp; Separate Sheets</span>
              </h2>
              <p className="text-xs text-muted-foreground">
                Each module below is mapped to its own separate tab in your Google Spreadsheet
              </p>
            </div>
            <span className="text-xs font-bold text-muted-foreground">
              Total 12 Quick Access Modules
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {FACTORY_MODULES.map((mod) => {
              const recordCount = counts[mod.key] ?? 0
              const isSyncing = syncingModule === mod.key
              const modStatus = moduleResults[mod.key]
              const isAlreadySynced = syncedModules.includes(mod.sheetName)

              return (
                <div
                  key={mod.key}
                  className="rounded-2xl bg-card p-4 ring-1 ring-border/70 shadow-xs flex flex-col justify-between gap-3 hover:ring-border transition-all"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl ${mod.iconBg}`}>
                        <mod.icon className={`h-5 w-5 ${mod.iconColor}`} />
                      </span>
                      <div>
                        <div className="flex items-center gap-2">
                          <Link href={mod.route} className="text-xs font-extrabold text-foreground hover:underline">
                            {mod.name}
                          </Link>
                          <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-mono font-bold text-muted-foreground">
                            Tab: &quot;{mod.sheetName}&quot;
                          </span>
                        </div>
                        <p className="text-[11px] text-muted-foreground mt-0.5 leading-snug">
                          {mod.description}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Module Footer info & Action */}
                  <div className="flex items-center justify-between pt-2 border-t border-border/50">
                    <div className="flex items-center gap-2">
                      <span className="rounded-lg bg-background px-2 py-1 text-[10px] font-bold text-foreground ring-1 ring-border/60">
                        {recordCount} records
                      </span>
                      <span className="text-[10px] text-muted-foreground">
                        {mod.columns.length} columns
                      </span>
                    </div>

                    <button
                      onClick={() => handleSyncModule(mod.key, mod.sheetName)}
                      disabled={isSyncing || !webhookUrl}
                      className="flex items-center gap-1.5 rounded-xl bg-card px-3 py-1.5 text-xs font-bold text-foreground ring-1 ring-border hover:bg-muted active:scale-95 disabled:opacity-50 shadow-2xs transition-all"
                      title={`Sync ${mod.name} data to tab "${mod.sheetName}"`}
                    >
                      <RefreshCw className={`h-3 w-3 ${isSyncing ? "animate-spin text-primary" : "text-emerald-600"}`} />
                      <span>{isSyncing ? "Syncing..." : "Sync Sheet"}</span>
                    </button>
                  </div>

                  {/* Individual Sync Feedback */}
                  {modStatus && (
                    <p className={`text-[11px] font-bold ${modStatus.startsWith("✓") ? "text-emerald-600" : "text-red-500"}`}>
                      {modStatus}
                    </p>
                  )}
                </div>
              )
            })}
          </div>
        </section>

      </div>
    </main>
  )
}
