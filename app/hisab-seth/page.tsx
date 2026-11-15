"use client"

import { useEffect, useState, useMemo, Suspense } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import {
  ArrowLeft,
  Calculator,
  Scissors,
  CheckCircle2,
  Clock,
  Layers,
  Archive,
  Search,
  Plus,
  Printer,
  Download,
  Upload,
  FileText,
  Copy,
  Check,
  Cloud,
  ExternalLink,
  RefreshCw,
  Trash2,
  Wallet,
  AlertCircle,
  FileSpreadsheet,
  X,
  CreditCard,
  Building2,
  Receipt,
  RotateCcw,
  Sparkles,
  Calendar,
  UserCheck
} from "lucide-react"
import {
  fetchSethHisabOverview,
  fetchSethHisabs,
  createSethHisab,
  addSethHisabPayment,
  deleteSethHisab,
  updateLotStitchingStatus,
  type SethHisabRecord
} from "@/lib/employee-store"

function SethHisabContent() {
  const searchParams = useSearchParams()
  const initialSethId = searchParams.get("seth_id") || ""

  const [mounted, setMounted] = useState(false)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<"work" | "ready" | "history">("work")

  // Data state
  const [overview, setOverview] = useState<any>(null)
  const [hisabRecords, setHisabRecords] = useState<SethHisabRecord[]>([])

  // Filters
  const [selectedSethId, setSelectedSethId] = useState<string>(initialSethId)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")

  // New Hisab Dialog state
  const [isNewHisabOpen, setIsNewHisabOpen] = useState(false)
  const [hisabSethId, setHisabSethId] = useState<string>("")
  const [hisabDate, setHisabDate] = useState<string>(new Date().toISOString().split("T")[0])
  const [selectedLotIds, setSelectedLotIds] = useState<number[]>([])
  const [globalRate, setGlobalRate] = useState<string>("45")
  const [lotRates, setLotRates] = useState<Record<number, string>>({})
  const [extraCharges, setExtraCharges] = useState<string>("0")
  const [extraChargesNotes, setExtraChargesNotes] = useState<string>("")
  const [deductions, setDeductions] = useState<string>("0")
  const [deductionsNotes, setDeductionsNotes] = useState<string>("")
  const [paidAmount, setPaidAmount] = useState<string>("0")
  const [paymentMethod, setPaymentMethod] = useState<string>("Cash")
  const [handledBy, setHandledBy] = useState<string>("Akshaybhai")
  const [hisabNotes, setHisabNotes] = useState<string>("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Payment dialog state
  const [paymentModalRecord, setPaymentModalRecord] = useState<SethHisabRecord | null>(null)
  const [payAmount, setPayAmount] = useState<string>("")
  const [payDate, setPayDate] = useState<string>(new Date().toISOString().split("T")[0])
  const [payMethod, setPayMethod] = useState<string>("Cash")
  const [payHandledBy, setPayHandledBy] = useState<string>("Akshaybhai")
  const [payNotes, setPayNotes] = useState<string>("")

  // Slip modal state
  const [slipModalRecord, setSlipModalRecord] = useState<SethHisabRecord | null>(null)

  // Export & Import states
  const [isExporting, setIsExporting] = useState(false)
  const [isImportModalOpen, setIsImportModalOpen] = useState(false)
  const [importFile, setImportFile] = useState<File | null>(null)
  const [importPreview, setImportPreview] = useState<any[]>([])
  const [isImporting, setIsImporting] = useState(false)
  const [importStatus, setImportStatus] = useState<{ success?: boolean; message?: string } | null>(null)

  // Google Sheets state
  const [isSheetsModalOpen, setIsSheetsModalOpen] = useState(false)
  const [sheetsWebhookUrl, setSheetsWebhookUrl] = useState("")
  const [sheetsAutoSync, setSheetsAutoSync] = useState(true)
  const [sheetsScriptCode, setSheetsScriptCode] = useState("")
  const [sheetsStatus, setSheetsStatus] = useState<any>(null)
  const [isTestingSheets, setIsTestingSheets] = useState(false)
  const [testResult, setTestResult] = useState<{ success?: boolean; message?: string } | null>(null)
  const [isSyncingAll, setIsSyncingAll] = useState(false)
  const [syncAllResult, setSyncAllResult] = useState<string | null>(null)
  const [copiedScript, setCopiedScript] = useState(false)

  const loadSheetsSettings = async () => {
    try {
      const res = await fetch("/api/google-sheets")
      const json = await res.json()
      if (json.success && json.data) {
        setSheetsWebhookUrl(json.data.webhook_url || "")
        setSheetsAutoSync(json.data.auto_sync_enabled ?? true)
        setSheetsScriptCode(json.data.script_code || "")
        setSheetsStatus(json.data)
      }
    } catch (e) {
      console.error("Failed to load Google Sheets config:", e)
    }
  }

  // Load Data
  const loadData = async () => {
    setLoading(true)
    try {
      const ov = await fetchSethHisabOverview(selectedSethId || undefined)
      setOverview(ov)
      const hisabs = await fetchSethHisabs({
        sethId: selectedSethId || undefined,
        search: searchQuery || undefined
      })
      setHisabRecords(hisabs)
    } catch (err) {
      console.error("Error loading Seth Hisab data:", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    setMounted(true)
    loadData()
    loadSheetsSettings()
  }, [selectedSethId])

  // Filtered lots for the current Seth / search query
  const filteredLots = useMemo(() => {
    if (!overview?.lots) return []
    let list = overview.lots

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      list = list.filter(
        (l: any) =>
          l.lot_number?.toLowerCase().includes(q) ||
          l.roll_number?.toLowerCase().includes(q) ||
          l.seth_name?.toLowerCase().includes(q) ||
          l.fabric_type?.toLowerCase().includes(q)
      )
    }

    if (statusFilter === "ready") {
      list = list.filter((l: any) => l.is_stitching_completed && !l.is_settled)
    } else if (statusFilter === "in_stitching") {
      list = list.filter((l: any) => !l.is_stitching_completed && !l.is_settled)
    } else if (statusFilter === "settled") {
      list = list.filter((l: any) => l.is_settled)
    }

    return list
  }, [overview, searchQuery, statusFilter])

  // Filtered rolls
  const filteredRolls = useMemo(() => {
    if (!overview?.rolls) return []
    return overview.rolls
  }, [overview])

  // Open "Make Hisab" modal for a specific Seth (or preselecting lot)
  const handleOpenNewHisab = (preselectedLot?: any) => {
    const sId = preselectedLot?.seth_id ? String(preselectedLot.seth_id) : selectedSethId || (overview?.seths?.[0]?.id ? String(overview.seths[0].id) : "")
    setHisabSethId(sId)
    setHisabDate(new Date().toISOString().split("T")[0])
    setExtraCharges("0")
    setExtraChargesNotes("")
    setDeductions("0")
    setDeductionsNotes("")
    setPaidAmount("0")
    setPaymentMethod("Cash")
    setHandledBy("Akshaybhai")
    setHisabNotes("")

    if (preselectedLot) {
      setSelectedLotIds([preselectedLot.cutting_id || preselectedLot.id])
    } else {
      // Auto-select all ready lots for this Seth
      const sethNum = Number(sId)
      const readyForSeth = (overview?.readyLots || []).filter((l: any) => l.seth_id === sethNum)
      setSelectedLotIds(readyForSeth.map((l: any) => l.cutting_id || l.id))
    }

    setIsNewHisabOpen(true)
  }

  // Available lots for the selected Seth in modal
  const lotsAvailableForHisab = useMemo(() => {
    if (!overview?.lots || !hisabSethId) return []
    const sId = Number(hisabSethId)
    // Return all lots belonging to this seth that are not yet settled
    return overview.lots.filter((l: any) => l.seth_id === sId && !l.is_settled)
  }, [overview, hisabSethId])

  // Toggle lot selection in hisab modal
  const toggleLotSelection = (lotId: number) => {
    setSelectedLotIds((prev) =>
      prev.includes(lotId) ? prev.filter((id) => id !== lotId) : [...prev, lotId]
    )
  }

  const selectAllLots = () => {
    if (selectedLotIds.length === lotsAvailableForHisab.length) {
      setSelectedLotIds([])
    } else {
      setSelectedLotIds(lotsAvailableForHisab.map((l: any) => l.cutting_id || l.id))
    }
  }

  // Calculate live totals for the new hisab modal
  const modalCalculations = useMemo(() => {
    const selectedLots = lotsAvailableForHisab.filter((l: any) =>
      selectedLotIds.includes(l.cutting_id || l.id)
    )

    const totalPieces = selectedLots.reduce((sum: number, l: any) => sum + (Number(l.piece_count) || 0), 0)
    const totalMeters = selectedLots.reduce((sum: number, l: any) => sum + (Number(l.meter_used) || 0), 0)
    const avgConsumption = totalPieces > 0 ? Number((totalMeters / totalPieces).toFixed(2)) : 0

    const gRate = parseFloat(globalRate) || 0
    let stitchingAmount = 0

    const lotsWithAmount = selectedLots.map((l: any) => {
      const rate = lotRates[l.cutting_id || l.id] !== undefined ? parseFloat(lotRates[l.cutting_id || l.id]) || 0 : gRate
      const amt = Number(l.piece_count) * rate
      stitchingAmount += amt
      return {
        ...l,
        rate,
        amount: amt
      }
    })

    const extra = parseFloat(extraCharges) || 0
    const deduct = parseFloat(deductions) || 0
    const grossTotal = Math.max(0, stitchingAmount + extra - deduct)
    const paid = parseFloat(paidAmount) || 0
    const balance = Math.max(0, grossTotal - paid)

    return {
      selectedLots: lotsWithAmount,
      totalPieces,
      totalMeters,
      avgConsumption,
      stitchingAmount,
      extra,
      deduct,
      grossTotal,
      paid,
      balance
    }
  }, [lotsAvailableForHisab, selectedLotIds, globalRate, lotRates, extraCharges, deductions, paidAmount])

  // Save new Hisab
  const handleSaveHisab = async (e: React.FormEvent) => {
    e.preventDefault()
    if (isSubmitting) return

    if (!hisabSethId) {
      alert("Please select a Seth client")
      return
    }

    if (modalCalculations.selectedLots.length === 0) {
      alert("Please select at least one cutting lot to include in this Hisab")
      return
    }

    setIsSubmitting(true)
    try {
      const payload = {
        seth_id: Number(hisabSethId),
        hisab_date: hisabDate,
        lots: modalCalculations.selectedLots.map((l: any) => ({
          cutting_id: l.cutting_id || l.id,
          lot_number: l.lot_number,
          cutting_date: l.cutting_date,
          roll_id: l.roll_id,
          roll_number: l.roll_number,
          fabric_type: l.fabric_type,
          meter_used: l.meter_used,
          piece_count: l.piece_count,
          stitching_status: l.stitching_status,
          rate_per_piece: l.rate,
          amount: l.amount,
          average: l.average
        })),
        extra_charges: modalCalculations.extra,
        extra_charges_notes: extraChargesNotes.trim() || null,
        deductions: modalCalculations.deduct,
        deductions_notes: deductionsNotes.trim() || null,
        paid_amount: modalCalculations.paid,
        payment_method: paymentMethod,
        handled_by: handledBy.trim() || "Akshaybhai",
        notes: hisabNotes.trim() || null
      }

      const res = await createSethHisab(payload)
      if (res) {
        setIsNewHisabOpen(false)
        await loadData()
        setSlipModalRecord(res)
      } else {
        alert("Failed to generate Hisab. Please check the fields and try again.")
      }
    } catch (err: any) {
      alert(err.message || "Error generating Hisab")
    } finally {
      setIsSubmitting(false)
    }
  }

  // Quick Action: Mark stitching complete
  const handleMarkStitchingComplete = async (lot: any) => {
    const confirm = window.confirm(
      `Mark stitching complete for Lot #${lot.lot_number} (${lot.piece_count} pcs)? This will make it ready for Seth Hisab.`
    )
    if (!confirm) return

    try {
      const res = await updateLotStitchingStatus(lot.cutting_id || lot.id, "Ready")
      if (res.success) {
        await loadData()
      } else {
        alert("Could not update stitching status: " + res.detail)
      }
    } catch (err: any) {
      alert("Error: " + err.message)
    }
  }

  // Handle Record Payment
  const handleOpenPaymentModal = (record: SethHisabRecord) => {
    setPaymentModalRecord(record)
    setPayAmount(record.balance_amount.toString())
    setPayDate(new Date().toISOString().split("T")[0])
    setPayMethod(record.payment_method || "Cash")
    setPayHandledBy(record.handled_by || "Akshaybhai")
    setPayNotes("")
  }

  const handleSavePayment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!paymentModalRecord || isSubmitting) return

    const amt = parseFloat(payAmount)
    if (isNaN(amt) || amt <= 0) {
      alert("Please enter a valid payment amount")
      return
    }

    setIsSubmitting(true)
    try {
      const res = await addSethHisabPayment(paymentModalRecord.id, {
        payment_date: payDate,
        amount: amt,
        payment_method: payMethod,
        handled_by: payHandledBy,
        notes: payNotes
      })

      if (res.success) {
        setPaymentModalRecord(null)
        await loadData()
      } else {
        alert(res.detail || "Payment recording failed")
      }
    } catch (err: any) {
      alert("Error: " + err.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Handle Delete Hisab
  const handleDeleteHisab = async (record: SethHisabRecord) => {
    const confirm = window.confirm(
      `Are you sure you want to delete Hisab #${record.hisab_number}? This will unlink cutting lots and restore them to unbilled status.`
    )
    if (!confirm) return

    try {
      const res = await deleteSethHisab(record.id)
      if (res.success) {
        await loadData()
      } else {
        alert(res.detail || "Failed to delete hisab")
      }
    } catch (err: any) {
      alert("Error: " + err.message)
    }
  }

  // Handle Export
  const handleExport = async (format: "excel" | "csv" = "excel") => {
    setIsExporting(true)
    try {
      const params = new URLSearchParams()
      params.append("format", format)
      if (selectedSethId) params.append("seth_id", selectedSethId)
      if (searchQuery) params.append("search", searchQuery)
      if (statusFilter !== "all") params.append("status", statusFilter)

      const res = await fetch(`/api/hisab-seth/export?${params.toString()}`)
      if (!res.ok) {
        throw new Error("Failed to export data")
      }

      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      const dateStr = new Date().toISOString().split("T")[0]
      a.download = format === "excel" ? `RD_Jeans_Seth_Hisab_${dateStr}.xlsx` : `Seth_Hisab_Export_${dateStr}.csv`
      document.body.appendChild(a)
      a.click()
      a.remove()
      window.URL.revokeObjectURL(url)
    } catch (err: any) {
      alert("Export failed: " + err.message)
    } finally {
      setIsExporting(false)
    }
  }

  // Handle Import File Selection & Preview
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null
    setImportFile(file)
    setImportStatus(null)
    setImportPreview([])

    if (!file) return

    if (file.name.toLowerCase().endsWith(".csv")) {
      const reader = new FileReader()
      reader.onload = (event) => {
        const text = event.target?.result as string
        if (text) {
          const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0)
          if (lines.length > 1) {
            const headers = lines[0].split(",").map((h) => h.trim().replace(/^"|"$/g, ""))
            const previewRows = lines.slice(1, 6).map((line) => {
              const cells = line.split(",").map((c) => c.trim().replace(/^"|"$/g, ""))
              const row: any = {}
              headers.forEach((h, idx) => {
                row[h] = cells[idx] || ""
              })
              return row
            })
            setImportPreview(previewRows)
          }
        }
      }
      reader.readAsText(file)
    }
  }

  // Handle Import Submission
  const handleUploadImport = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!importFile || isImporting) return

    setIsImporting(true)
    setImportStatus(null)

    try {
      const formData = new FormData()
      formData.append("file", importFile)

      const res = await fetch("/api/hisab-seth/import", {
        method: "POST",
        body: formData
      })
      const data = await res.json()

      if (data.success) {
        setImportStatus({
          success: true,
          message: `Successfully imported ${data.importedCount || 0} Seth Hisab record(s)!`
        })
        await loadData()
        setTimeout(() => {
          setIsImportModalOpen(false)
          setImportFile(null)
          setImportPreview([])
          setImportStatus(null)
        }, 1500)
      } else {
        setImportStatus({
          success: false,
          message: data.detail || "Import failed. Please check your file format."
        })
      }
    } catch (err: any) {
      setImportStatus({
        success: false,
        message: err.message || "Network error during import"
      })
    } finally {
      setIsImporting(false)
    }
  }

  // Handle Save Google Sheets Config
  const handleSaveSheetsConfig = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const res = await fetch("/api/google-sheets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          webhook_url: sheetsWebhookUrl.trim(),
          auto_sync_enabled: sheetsAutoSync
        })
      })
      const json = await res.json()
      if (json.success) {
        setSheetsStatus(json.data)
        setTestResult({ success: true, message: "Settings saved successfully!" })
      }
    } catch (err: any) {
      setTestResult({ success: false, message: err.message || "Failed to save settings" })
    }
  }

  // Handle Test Connection
  const handleTestSheets = async () => {
    setIsTestingSheets(true)
    setTestResult(null)
    try {
      const res = await fetch("/api/google-sheets/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ webhook_url: sheetsWebhookUrl.trim() })
      })
      const json = await res.json()
      setTestResult(json)
    } catch (err: any) {
      setTestResult({ success: false, message: err.message || "Test request failed" })
    } finally {
      setIsTestingSheets(false)
    }
  }

  // Handle Sync All Records to Sheets
  const handleSyncAllToSheets = async () => {
    setIsSyncingAll(true)
    setSyncAllResult(null)
    try {
      const res = await fetch("/api/google-sheets/sync-all", { method: "POST" })
      const json = await res.json()
      if (json.success) {
        setSyncAllResult(`✓ ${json.message}`)
        await loadSheetsSettings()
      } else {
        setSyncAllResult(`❌ ${json.message || "Bulk sync failed"}`)
      }
    } catch (err: any) {
      setSyncAllResult(`❌ Error: ${err.message}`)
    } finally {
      setIsSyncingAll(false)
    }
  }

  // Handle Copy Apps Script Code
  const handleCopyScript = () => {
    if (sheetsScriptCode) {
      navigator.clipboard.writeText(sheetsScriptCode)
      setCopiedScript(true)
      setTimeout(() => setCopiedScript(false), 2000)
    }
  }

  if (!mounted) {
    return (
      <main className="min-h-screen bg-background">
        <div className="mx-auto max-w-2xl px-5 py-6">
          <div className="h-8 w-48 animate-pulse rounded bg-muted" />
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-background text-foreground pb-24">
      <div className="mx-auto flex max-w-2xl flex-col gap-6 px-4 py-5 md:px-5 md:py-6">

        {/* Top Header */}
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="flex h-10 w-10 items-center justify-center rounded-full bg-card shadow-sm ring-1 ring-border/60 transition-transform active:scale-90 hover:bg-muted"
            >
              <ArrowLeft className="h-5 w-5 text-foreground" />
            </Link>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
                <span>Hisab Seth</span>
                <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary">
                  Job Settlement
                </span>
              </h1>
              <p className="text-xs text-muted-foreground">Cutting, stitching completion & roll settlement</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 md:gap-2">
            {/* Import Button */}
            <button
              onClick={() => setIsImportModalOpen(true)}
              className="flex items-center gap-1 rounded-full bg-card px-3 py-2 text-xs font-bold text-foreground ring-1 ring-border/70 hover:bg-muted active:scale-95 shadow-xs transition-all"
              title="Import past hisab data from Excel or CSV"
            >
              <Upload className="h-3.5 w-3.5 text-primary" />
              <span className="hidden sm:inline">Import</span>
            </button>

            {/* Export Dropdown / Buttons */}
            <button
              onClick={() => handleExport("excel")}
              disabled={isExporting}
              className="flex items-center gap-1 rounded-full bg-card px-3 py-2 text-xs font-bold text-foreground ring-1 ring-border/70 hover:bg-muted active:scale-95 shadow-xs transition-all"
              title="Export all hisab data to Excel (.xlsx)"
            >
              <Download className="h-3.5 w-3.5 text-emerald-600" />
              <span className="hidden sm:inline">{isExporting ? "Exporting..." : "Export"}</span>
            </button>

            {/* Google Sheets Sync Button */}
            <button
              onClick={() => {
                setIsSheetsModalOpen(true)
                loadSheetsSettings()
              }}
              className={`flex items-center gap-1.5 rounded-full px-3 py-2 text-xs font-bold transition-all active:scale-95 shadow-xs ${
                sheetsWebhookUrl
                  ? "bg-emerald-50 text-emerald-800 ring-1 ring-emerald-600/30 dark:bg-emerald-950/40 dark:text-emerald-300"
                  : "bg-card text-foreground ring-1 ring-border/70 hover:bg-muted"
              }`}
              title="Real-time Google Sheet Sync & Live Backup"
            >
              <Cloud className="h-3.5 w-3.5 text-emerald-600" />
              <span className="hidden sm:inline">Google Sheets</span>
              {sheetsWebhookUrl && <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />}
            </button>

            {/* New Hisab */}
            <button
              onClick={() => handleOpenNewHisab()}
              className="flex items-center gap-1.5 rounded-full bg-primary px-3.5 py-2 text-xs font-bold text-primary-foreground shadow-sm transition-all hover:opacity-95 active:scale-95"
            >
              <Plus className="h-4 w-4" />
              <span>New Hisab</span>
            </button>
          </div>
        </header>

        {/* Top Summary Banner */}
        <div className="relative overflow-hidden rounded-[26px] bg-gradient-to-br from-primary via-primary/95 to-primary/85 p-5 text-primary-foreground shadow-lg shadow-primary/15">
          <div className="flex justify-between items-start">
            <div>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-primary-foreground/20 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary-foreground">
                <Calculator className="h-3 w-3" />
                Factory Work & Settlement
              </span>
              <p className="text-2xl font-black tracking-tight mt-2">
                ₹{(overview?.summary?.totalHisabsAmount || 0).toLocaleString("en-IN")}
              </p>
              <p className="text-xs text-primary-foreground/80 font-medium">Total Seth Hisab Billed</p>
            </div>

            <div className="text-right">
              <span className="inline-block rounded-lg bg-primary-foreground/15 px-2.5 py-1 text-xs font-black">
                {overview?.summary?.readyLotsCount || 0} Lots Ready
              </span>
              <p className="text-[10px] text-primary-foreground/75 mt-1 font-semibold">
                Stitching Finished
              </p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 border-t border-primary-foreground/20 pt-4 mt-4 text-center">
            <div className="text-left">
              <p className="text-[10px] font-bold uppercase text-primary-foreground/70">In Stitching</p>
              <p className="text-sm font-extrabold mt-0.5">{overview?.summary?.inStitchingCount || 0} lots</p>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase text-primary-foreground/70">Settled Lots</p>
              <p className="text-sm font-extrabold mt-0.5">{overview?.summary?.settledLotsCount || 0} lots</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-bold uppercase text-primary-foreground/70">Balance Due</p>
              <p className="text-sm font-extrabold mt-0.5 text-amber-200">
                ₹{(overview?.summary?.totalHisabsBalance || 0).toLocaleString("en-IN")}
              </p>
            </div>
          </div>
        </div>

        {/* Seth Filter & Search Bar */}
        <div className="flex flex-col gap-2.5">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search Lot #, Roll #, Seth, or Fabric..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-2xl bg-card py-2.5 pl-10 pr-4 text-xs font-medium text-foreground ring-1 ring-border/60 shadow-xs focus:outline-none focus:ring-2 focus:ring-primary"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            <select
              value={selectedSethId}
              onChange={(e) => setSelectedSethId(e.target.value)}
              className="rounded-2xl bg-card py-2.5 px-3 text-xs font-bold text-foreground ring-1 ring-border/60 shadow-xs focus:outline-none focus:ring-2 focus:ring-primary max-w-[150px]"
            >
              <option value="">All Seths</option>
              {(overview?.seths || []).map((s: any) => (
                <option key={s.id} value={String(s.id)}>
                  {s.seth_name}
                </option>
              ))}
            </select>
          </div>

          {/* Quick status filters */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {[
              { id: "all", label: "All Items" },
              { id: "ready", label: `Ready for Hisab (${overview?.summary?.readyLotsCount || 0})` },
              { id: "in_stitching", label: `In Stitching (${overview?.summary?.inStitchingCount || 0})` },
              { id: "settled", label: `Settled (${overview?.summary?.settledLotsCount || 0})` }
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setStatusFilter(f.id)}
                className={`rounded-full px-3 py-1 text-[11px] font-bold whitespace-nowrap transition-all ${
                  statusFilter === f.id
                    ? "bg-foreground text-background shadow-xs"
                    : "bg-card text-muted-foreground ring-1 ring-border/60 hover:text-foreground"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-border/80 gap-1 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <button
            onClick={() => setActiveTab("work")}
            className={`pb-2.5 px-3.5 text-xs font-bold border-b-2 transition-all whitespace-nowrap ${
              activeTab === "work"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            Seth Work & Stitching
          </button>
          <button
            onClick={() => setActiveTab("ready")}
            className={`pb-2.5 px-3.5 text-xs font-bold border-b-2 transition-all whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === "ready"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <span>Ready for Hisab</span>
            {(overview?.summary?.readyLotsCount || 0) > 0 && (
              <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-emerald-600 px-1 text-[9px] font-black text-white">
                {overview?.summary?.readyLotsCount}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab("history")}
            className={`pb-2.5 px-3.5 text-xs font-bold border-b-2 transition-all whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === "history"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <span>Hisab Bills & Slips</span>
            <span className="text-[10px] text-muted-foreground font-semibold">({hisabRecords.length})</span>
          </button>
        </div>

        {/* TAB 1: Seth Work & Stitching */}
        {activeTab === "work" && (
          <section className="flex flex-col gap-6">

            {/* Rolls Section */}
            <div>
              <div className="flex justify-between items-center mb-2.5">
                <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <Archive className="h-3.5 w-3.5" />
                  <span>Seth Rolls & Fabric Inventory ({filteredRolls.length})</span>
                </h3>
                <Link href="/rolls" className="text-[11px] font-bold text-primary hover:underline">
                  Manage Rolls
                </Link>
              </div>

              {filteredRolls.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-2xl bg-card py-6 px-4 text-center ring-1 ring-border/60">
                  <Archive className="h-6 w-6 text-muted-foreground/60 mb-1" />
                  <p className="text-xs font-bold text-foreground">No Fabric Rolls Found</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    Add rolls received from Seth in Roll Inventory
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                  {filteredRolls.slice(0, 6).map((r: any) => (
                    <div
                      key={r.id}
                      className="rounded-2xl bg-card p-3.5 ring-1 ring-border/60 shadow-xs flex flex-col justify-between gap-2"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-xs font-black text-foreground">Roll: {r.roll_number}</p>
                          <p className="text-[10px] text-muted-foreground font-semibold">
                            {r.seth_name} • {r.fabric_type}
                          </p>
                        </div>
                        <span
                          className={`rounded-full px-2 py-0.5 text-[9px] font-extrabold ${
                            r.status === "Completed"
                              ? "bg-muted text-muted-foreground"
                              : r.status === "Partially Used"
                              ? "bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-400"
                              : "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400"
                          }`}
                        >
                          {r.status || "Available"}
                        </span>
                      </div>

                      <div className="grid grid-cols-3 gap-1 border-t border-border/50 pt-2 text-[10px]">
                        <div>
                          <span className="text-muted-foreground">Received</span>
                          <p className="font-bold text-foreground">{r.received_meter}m</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Used</span>
                          <p className="font-bold text-foreground">{r.used_meter}m</p>
                        </div>
                        <div className="text-right">
                          <span className="text-muted-foreground">Remaining</span>
                          <p className="font-black text-primary">{r.remaining_meter}m</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Cutting & Stitching Lots Section */}
            <div>
              <div className="flex justify-between items-center mb-2.5">
                <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <Scissors className="h-3.5 w-3.5" />
                  <span>Cutting & Stitching Lots ({filteredLots.length})</span>
                </h3>
                <Link href="/cutting" className="text-[11px] font-bold text-primary hover:underline">
                  New Cutting
                </Link>
              </div>

              {filteredLots.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-2xl bg-card py-8 px-4 text-center ring-1 ring-border/60">
                  <Scissors className="h-8 w-8 text-muted-foreground/60 mb-2" />
                  <p className="text-sm font-bold text-foreground">No Cutting Lots Found</p>
                  <p className="text-xs text-muted-foreground mt-1 max-w-xs">
                    Create cutting entries for this Seth to track stitching and make Hisab settlements.
                  </p>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {filteredLots.map((lot: any) => (
                    <div
                      key={lot.cutting_id || lot.id}
                      className="rounded-2xl bg-card p-4 ring-1 ring-border/60 shadow-xs flex flex-col gap-3 transition-all hover:ring-border"
                    >
                      {/* Lot Header */}
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-sm font-extrabold text-foreground">
                              Lot #{lot.lot_number}
                            </h4>
                            <span className="text-[11px] text-muted-foreground font-semibold">
                              ({lot.cutting_date})
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground font-semibold mt-0.5">
                            {lot.seth_name} • Roll: {lot.roll_number} ({lot.fabric_type})
                          </p>
                        </div>

                        {/* Status Badge */}
                        <div>
                          {lot.is_settled ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-purple-100 dark:bg-purple-950/40 px-2.5 py-0.5 text-[10px] font-extrabold text-purple-700 dark:text-purple-300 ring-1 ring-purple-600/20">
                              <CheckCircle2 className="h-3 w-3" />
                              Settled ({lot.hisab_number})
                            </span>
                          ) : lot.is_stitching_completed ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 dark:bg-emerald-950/40 px-2.5 py-0.5 text-[10px] font-extrabold text-emerald-700 dark:text-emerald-300 ring-1 ring-emerald-600/20">
                              <CheckCircle2 className="h-3 w-3" />
                              Stitching Complete (Ready for Hisab)
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 dark:bg-blue-950/40 px-2.5 py-0.5 text-[10px] font-extrabold text-blue-700 dark:text-blue-300 ring-1 ring-blue-600/20">
                              <Clock className="h-3 w-3" />
                              In Stitching ({lot.stitching_status})
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Yield Metrics */}
                      <div className="grid grid-cols-4 gap-2 rounded-xl bg-muted/40 p-2.5 text-center text-[11px]">
                        <div>
                          <p className="text-[9px] uppercase font-bold text-muted-foreground">Meter Cut</p>
                          <p className="font-bold text-foreground mt-0.5">{lot.meter_used} m</p>
                        </div>
                        <div>
                          <p className="text-[9px] uppercase font-bold text-muted-foreground">Cut Pieces</p>
                          <p className="font-bold text-foreground mt-0.5">{lot.piece_count} pcs</p>
                        </div>
                        <div>
                          <p className="text-[9px] uppercase font-bold text-muted-foreground">Stitched</p>
                          <p className="font-bold text-emerald-600 mt-0.5">
                            {lot.is_stitching_completed ? lot.piece_count : lot.finished_pieces || lot.stitching_pieces || 0} pcs
                          </p>
                        </div>
                        <div>
                          <p className="text-[9px] uppercase font-bold text-muted-foreground">Average</p>
                          <p className="font-bold text-primary mt-0.5">
                            {lot.average ? `${lot.average} m/pc` : "-"}
                          </p>
                        </div>
                      </div>

                      {/* Action Bar */}
                      <div className="flex items-center justify-between border-t border-border/50 pt-2.5">
                        <span className="text-[10px] text-muted-foreground">
                          {lot.is_settled
                            ? "Included in Seth settlement hisab"
                            : lot.is_stitching_completed
                            ? "Ready to make hisab bill"
                            : "Stitching work in progress on sewing floor"}
                        </span>

                        <div className="flex items-center gap-2">
                          {!lot.is_settled && !lot.is_stitching_completed && (
                            <button
                              onClick={() => handleMarkStitchingComplete(lot)}
                              className="rounded-lg bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-1 text-[11px] font-extrabold text-emerald-700 dark:text-emerald-300 ring-1 ring-emerald-600/30 hover:bg-emerald-100 transition-all active:scale-95"
                            >
                              ✓ Complete Stitching
                            </button>
                          )}

                          {!lot.is_settled && (
                            <button
                              onClick={() => handleOpenNewHisab(lot)}
                              className="rounded-lg bg-primary px-3 py-1 text-[11px] font-bold text-primary-foreground shadow-xs hover:opacity-95 transition-all active:scale-95 flex items-center gap-1"
                            >
                              <Calculator className="h-3 w-3" />
                              <span>Make Hisab</span>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
        )}

        {/* TAB 2: Ready for Hisab */}
        {activeTab === "ready" && (
          <section className="flex flex-col gap-4">
            <div className="rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/20 p-4 ring-1 ring-emerald-600/20 text-xs">
              <p className="font-bold text-emerald-900 dark:text-emerald-200 flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                <span>Ready for Hisab Settlement</span>
              </p>
              <p className="text-muted-foreground mt-1">
                The cutting lots below have completed all stitching and are ready to be billed to the Seth. You can generate a single combined bill or bill lot-by-lot.
              </p>
            </div>

            {(overview?.readyLots || []).length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-2xl bg-card py-12 px-4 text-center ring-1 ring-border/60">
                <CheckCircle2 className="h-10 w-10 text-muted-foreground/50 mb-2" />
                <p className="text-sm font-bold text-foreground">No Lots Pending Hisab</p>
                <p className="text-xs text-muted-foreground mt-1 max-w-sm">
                  All completed cutting lots have either already been settled, or are still in stitching.
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {(overview?.readyLots || []).map((lot: any) => (
                  <div
                    key={lot.cutting_id || lot.id}
                    className="rounded-2xl bg-card p-4 ring-1 ring-border/60 shadow-xs flex flex-col gap-3"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-extrabold text-foreground">Lot #{lot.lot_number}</h4>
                          <span className="rounded-full bg-emerald-100 dark:bg-emerald-950 px-2 py-0.5 text-[9px] font-black text-emerald-700 dark:text-emerald-300">
                            Stitching Complete
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground font-semibold mt-0.5">
                          {lot.seth_name} • Roll: {lot.roll_number} ({lot.fabric_type})
                        </p>
                      </div>

                      <button
                        onClick={() => handleOpenNewHisab(lot)}
                        className="rounded-xl bg-primary px-3 py-1.5 text-xs font-bold text-primary-foreground shadow-xs hover:opacity-95 active:scale-95 flex items-center gap-1"
                      >
                        <Calculator className="h-3.5 w-3.5" />
                        <span>Settle Lot</span>
                      </button>
                    </div>

                    <div className="grid grid-cols-3 gap-2 rounded-xl bg-muted/40 p-2 text-center text-xs">
                      <div>
                        <span className="text-[10px] text-muted-foreground font-bold">Cut Pieces</span>
                        <p className="font-extrabold text-foreground mt-0.5">{lot.piece_count} pcs</p>
                      </div>
                      <div>
                        <span className="text-[10px] text-muted-foreground font-bold">Fabric Used</span>
                        <p className="font-extrabold text-foreground mt-0.5">{lot.meter_used} m</p>
                      </div>
                      <div>
                        <span className="text-[10px] text-muted-foreground font-bold">Average</span>
                        <p className="font-extrabold text-primary mt-0.5">
                          {lot.average ? `${lot.average} m/pc` : "-"}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {/* TAB 3: Hisab Bills & Slips */}
        {activeTab === "history" && (
          <section className="flex flex-col gap-3">
            {hisabRecords.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-2xl bg-card py-12 px-4 text-center ring-1 ring-border/60">
                <Receipt className="h-10 w-10 text-muted-foreground/50 mb-2" />
                <p className="text-sm font-bold text-foreground">No Seth Hisab Bills Generated Yet</p>
                <p className="text-xs text-muted-foreground mt-1 max-w-sm">
                  Click &quot;New Hisab&quot; to calculate stitching charges and create your first Seth settlement slip.
                </p>
                <button
                  onClick={() => handleOpenNewHisab()}
                  className="mt-4 rounded-full bg-primary px-4 py-2 text-xs font-bold text-primary-foreground shadow-sm hover:opacity-95 active:scale-95"
                >
                  Create First Hisab
                </button>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between rounded-2xl bg-card p-3 ring-1 ring-border/60 shadow-xs">
                  <span className="text-xs font-bold text-foreground">
                    {hisabRecords.length} Settlement Bills Recorded
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleExport("excel")}
                      disabled={isExporting}
                      className="flex items-center gap-1.5 rounded-xl bg-muted/60 px-2.5 py-1 text-xs font-bold text-foreground hover:bg-muted transition-all active:scale-95"
                      title="Download Excel spreadsheet"
                    >
                      <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-600" />
                      <span>Excel (.xlsx)</span>
                    </button>
                    <button
                      onClick={() => handleExport("csv")}
                      disabled={isExporting}
                      className="flex items-center gap-1.5 rounded-xl bg-muted/60 px-2.5 py-1 text-xs font-bold text-foreground hover:bg-muted transition-all active:scale-95"
                      title="Download CSV spreadsheet"
                    >
                      <Download className="h-3.5 w-3.5 text-primary" />
                      <span>CSV</span>
                    </button>
                  </div>
                </div>

                {hisabRecords.map((hisab) => (
                <div
                  key={hisab.id}
                  className="rounded-2xl bg-card p-4 ring-1 ring-border/60 shadow-xs flex flex-col gap-3 transition-all hover:ring-border"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-black text-foreground">
                          {hisab.hisab_number}
                        </span>
                        <span
                          className={`rounded-full px-2 py-0.5 text-[9px] font-black ${
                            hisab.payment_status === "Paid"
                              ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400"
                              : hisab.payment_status === "Partially Paid"
                              ? "bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-400"
                              : "bg-red-100 text-red-800 dark:bg-red-950/40 dark:text-red-400"
                          }`}
                        >
                          {hisab.payment_status}
                        </span>
                      </div>
                      <p className="text-xs font-extrabold text-foreground mt-0.5">{hisab.seth_name}</p>
                      <p className="text-[10px] text-muted-foreground font-medium">
                        {hisab.hisab_date} • Handled by {hisab.handled_by}
                      </p>
                    </div>

                    <div className="text-right">
                      <p className="text-base font-black text-foreground">
                        ₹{hisab.total_amount.toLocaleString("en-IN")}
                      </p>
                      <p className="text-[10px] font-semibold text-muted-foreground">
                        {hisab.total_pieces} pcs • {hisab.lots?.length || 0} Lots
                      </p>
                    </div>
                  </div>

                  {/* Financial Breakdown */}
                  <div className="grid grid-cols-3 gap-2 rounded-xl bg-muted/40 p-2.5 text-center text-[11px]">
                    <div>
                      <p className="text-[9px] uppercase font-bold text-muted-foreground">Stitching Rate</p>
                      <p className="font-bold text-foreground mt-0.5">
                        ₹{hisab.lots?.[0]?.rate_per_piece || 0}/pc
                      </p>
                    </div>
                    <div>
                      <p className="text-[9px] uppercase font-bold text-muted-foreground">Paid Amount</p>
                      <p className="font-bold text-emerald-600 mt-0.5">
                        ₹{hisab.paid_amount.toLocaleString("en-IN")}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-[9px] uppercase font-bold text-muted-foreground">Balance Due</p>
                      <p
                        className={`font-black mt-0.5 ${
                          hisab.balance_amount > 0 ? "text-amber-600" : "text-foreground"
                        }`}
                      >
                        ₹{hisab.balance_amount.toLocaleString("en-IN")}
                      </p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-between border-t border-border/50 pt-2.5">
                    <button
                      onClick={() => setSlipModalRecord(hisab)}
                      className="flex items-center gap-1.5 rounded-lg bg-card px-3 py-1.5 text-xs font-bold text-foreground ring-1 ring-border/60 hover:bg-muted active:scale-95"
                    >
                      <Printer className="h-3.5 w-3.5 text-primary" />
                      <span>Print Slip</span>
                    </button>

                    <div className="flex items-center gap-2">
                      {hisab.balance_amount > 0 && (
                        <button
                          onClick={() => handleOpenPaymentModal(hisab)}
                          className="flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-700 active:scale-95"
                        >
                          <Wallet className="h-3.5 w-3.5" />
                          <span>Pay Balance</span>
                        </button>
                      )}

                      <button
                        onClick={() => handleDeleteHisab(hisab)}
                        className="rounded-lg p-1.5 text-muted-foreground hover:bg-red-50 hover:text-red-600 active:scale-95"
                        title="Delete Hisab"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </>
          )}
          </section>
        )}

      </div>

      {/* ========================================================================= */}
      {/* MODAL 1: MAKE NEW SETH HISAB                                             */}
      {/* ========================================================================= */}
      {isNewHisabOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs overflow-y-auto">
          <div className="relative w-full max-w-xl max-h-[92vh] overflow-y-auto rounded-3xl bg-card p-5 md:p-6 shadow-2xl ring-1 ring-border flex flex-col gap-5">

            {/* Header */}
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div>
                <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                  <Calculator className="h-5 w-5 text-primary" />
                  <span>Generate Seth Hisab</span>
                </h3>
                <p className="text-xs text-muted-foreground">Calculate cutting, stitching job-work & settlement</p>
              </div>
              <button
                onClick={() => setIsNewHisabOpen(false)}
                className="rounded-full p-1.5 text-muted-foreground hover:bg-muted"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSaveHisab} className="flex flex-col gap-4">

              {/* Step 1: Seth & Date */}
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-muted-foreground">Select Seth Client</label>
                  <select
                    value={hisabSethId}
                    onChange={(e) => {
                      setHisabSethId(e.target.value)
                      setSelectedLotIds([])
                    }}
                    required
                    className="rounded-xl bg-background p-2.5 text-xs font-bold text-foreground ring-1 ring-border focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="">Select a Seth</option>
                    {(overview?.seths || []).map((s: any) => (
                      <option key={s.id} value={String(s.id)}>
                        {s.seth_name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-muted-foreground">Hisab Date</label>
                  <input
                    type="date"
                    value={hisabDate}
                    onChange={(e) => setHisabDate(e.target.value)}
                    required
                    className="rounded-xl bg-background p-2.5 text-xs font-bold text-foreground ring-1 ring-border focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                  </input>
                </div>
              </div>

              {/* Step 2: Lot Selection */}
              <div className="flex flex-col gap-2">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-bold text-muted-foreground flex items-center gap-1.5">
                    <span>Select Completed Cutting Lots</span>
                    <span className="text-[10px] text-primary font-black">
                      ({selectedLotIds.length} of {lotsAvailableForHisab.length} selected)
                    </span>
                  </label>

                  {lotsAvailableForHisab.length > 0 && (
                    <button
                      type="button"
                      onClick={selectAllLots}
                      className="text-[11px] font-bold text-primary hover:underline"
                    >
                      {selectedLotIds.length === lotsAvailableForHisab.length ? "Deselect All" : "Select All"}
                    </button>
                  )}
                </div>

                {lotsAvailableForHisab.length === 0 ? (
                  <div className="rounded-xl bg-muted/30 p-4 text-center text-xs text-muted-foreground">
                    No unbilled cutting lots found for this Seth.
                  </div>
                ) : (
                  <div className="max-h-48 overflow-y-auto rounded-xl ring-1 ring-border/70 p-2 flex flex-col gap-1.5 bg-background/50">
                    {lotsAvailableForHisab.map((l: any) => {
                      const id = l.cutting_id || l.id
                      const isSelected = selectedLotIds.includes(id)
                      return (
                        <div
                          key={id}
                          onClick={() => toggleLotSelection(id)}
                          className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition-all text-xs ${
                            isSelected
                              ? "bg-primary/10 ring-1 ring-primary/40 text-foreground"
                              : "bg-card hover:bg-muted/50 text-muted-foreground"
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => {}}
                              className="h-4 w-4 rounded text-primary focus:ring-primary pointer-events-none"
                            />
                            <div>
                              <p className="font-extrabold text-foreground">
                                Lot #{l.lot_number}{" "}
                                <span className="font-normal text-[10px] text-muted-foreground">
                                  ({l.cutting_date})
                                </span>
                              </p>
                              <p className="text-[10px] text-muted-foreground">
                                Roll: {l.roll_number} • {l.meter_used}m used • {l.piece_count} pcs
                              </p>
                            </div>
                          </div>

                          <div className="text-right">
                            <span
                              className={`rounded-full px-2 py-0.5 text-[9px] font-black ${
                                l.is_stitching_completed
                                  ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300"
                                  : "bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300"
                              }`}
                            >
                              {l.is_stitching_completed ? "Ready" : "In Stitching"}
                            </span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>

              {/* Step 3: Stitching Rate & Job Work */}
              <div className="grid grid-cols-2 gap-3 rounded-2xl bg-muted/30 p-3 ring-1 ring-border/50">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-foreground">Job Work / Stitching Rate (₹/pc)</label>
                  <input
                    type="number"
                    step="0.5"
                    value={globalRate}
                    onChange={(e) => setGlobalRate(e.target.value)}
                    required
                    placeholder="e.g. 45"
                    className="rounded-xl bg-background p-2 text-xs font-extrabold text-foreground ring-1 ring-border focus:ring-2 focus:ring-primary"
                  />
                  <span className="text-[10px] text-muted-foreground">Applied per piece to selected lots</span>
                </div>

                <div className="flex flex-col justify-center text-right">
                  <p className="text-[10px] uppercase font-bold text-muted-foreground">Stitching Amount</p>
                  <p className="text-lg font-black text-primary">
                    ₹{modalCalculations.stitchingAmount.toLocaleString("en-IN")}
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    {modalCalculations.totalPieces} pcs @ ₹{globalRate}/pc
                  </p>
                </div>
              </div>

              {/* Step 4: Extras & Deductions */}
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-[11px] font-bold text-muted-foreground">Extra Charges (Washing / Trims ₹)</label>
                  <input
                    type="number"
                    value={extraCharges}
                    onChange={(e) => setExtraCharges(e.target.value)}
                    placeholder="0"
                    className="rounded-xl bg-background p-2 text-xs font-bold text-foreground ring-1 ring-border focus:ring-2 focus:ring-primary"
                  />
                  <input
                    type="text"
                    value={extraChargesNotes}
                    onChange={(e) => setExtraChargesNotes(e.target.value)}
                    placeholder="e.g. Washing @ ₹10/pc"
                    className="rounded-lg bg-background px-2 py-1 text-[10px] text-muted-foreground ring-1 ring-border"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[11px] font-bold text-muted-foreground">Deductions / Shortage (₹)</label>
                  <input
                    type="number"
                    value={deductions}
                    onChange={(e) => setDeductions(e.target.value)}
                    placeholder="0"
                    className="rounded-xl bg-background p-2 text-xs font-bold text-foreground ring-1 ring-border focus:ring-2 focus:ring-primary"
                  />
                  <input
                    type="text"
                    value={deductionsNotes}
                    onChange={(e) => setDeductionsNotes(e.target.value)}
                    placeholder="e.g. Fabric defect cut"
                    className="rounded-lg bg-background px-2 py-1 text-[10px] text-muted-foreground ring-1 ring-border"
                  />
                </div>
              </div>

              {/* Step 5: Advance & Payment */}
              <div className="rounded-2xl bg-card p-3 ring-1 ring-border/80 flex flex-col gap-2.5">
                <div className="flex justify-between items-center text-xs font-extrabold">
                  <span className="text-muted-foreground">Gross Bill Total:</span>
                  <span className="text-base font-black text-foreground">
                    ₹{modalCalculations.grossTotal.toLocaleString("en-IN")}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-muted-foreground">Advance / Paid Now</label>
                    <input
                      type="number"
                      value={paidAmount}
                      onChange={(e) => setPaidAmount(e.target.value)}
                      placeholder="0"
                      className="rounded-xl bg-background p-2 text-xs font-bold text-emerald-600 ring-1 ring-border focus:ring-2 focus:ring-primary"
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-muted-foreground">Payment Method</label>
                    <select
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="rounded-xl bg-background p-2 text-xs font-bold text-foreground ring-1 ring-border focus:ring-2 focus:ring-primary"
                    >
                      <option value="Cash">Cash</option>
                      <option value="Bank Transfer">Bank Transfer</option>
                      <option value="GPay / UPI">GPay / UPI</option>
                      <option value="Cheque">Cheque</option>
                    </select>
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-muted-foreground">Handled By</label>
                    <input
                      type="text"
                      value={handledBy}
                      onChange={(e) => setHandledBy(e.target.value)}
                      placeholder="Akshaybhai"
                      className="rounded-xl bg-background p-2 text-xs font-bold text-foreground ring-1 ring-border focus:ring-2 focus:ring-primary"
                    />
                  </div>
                </div>

                <div className="flex justify-between items-center border-t border-border/50 pt-2 text-xs">
                  <span className="font-bold text-muted-foreground">Remaining Balance Due:</span>
                  <span
                    className={`font-black ${
                      modalCalculations.balance > 0 ? "text-amber-600" : "text-emerald-600"
                    }`}
                  >
                    ₹{modalCalculations.balance.toLocaleString("en-IN")}
                  </span>
                </div>
              </div>

              {/* Notes */}
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-muted-foreground">Remarks / Bill Notes</label>
                <input
                  type="text"
                  value={hisabNotes}
                  onChange={(e) => setHisabNotes(e.target.value)}
                  placeholder="e.g. Size 30-36 batch finished work"
                  className="rounded-xl bg-background p-2 text-xs text-foreground ring-1 ring-border focus:ring-2 focus:ring-primary"
                />
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-2 border-t border-border pt-3">
                <button
                  type="button"
                  onClick={() => setIsNewHisabOpen(false)}
                  className="rounded-xl px-4 py-2 text-xs font-bold text-muted-foreground hover:bg-muted"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || modalCalculations.selectedLots.length === 0}
                  className="rounded-xl bg-primary px-5 py-2.5 text-xs font-bold text-primary-foreground shadow-sm hover:opacity-95 disabled:opacity-50 active:scale-95 flex items-center gap-1.5"
                >
                  <Calculator className="h-4 w-4" />
                  <span>{isSubmitting ? "Generating..." : "Save & Generate Hisab"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: PRINTABLE HISAB SLIP                                            */}
      {/* ========================================================================= */}
      {slipModalRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs overflow-y-auto">
          <div className="relative w-full max-w-lg rounded-3xl bg-card p-6 shadow-2xl ring-1 ring-border flex flex-col gap-4 text-foreground max-h-[92vh] overflow-y-auto">

            {/* Actions Bar (hidden when printing) */}
            <div className="flex justify-between items-center border-b border-border pb-3 print:hidden">
              <span className="text-xs font-black uppercase text-muted-foreground">
                Seth Hisab Statement
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="flex items-center gap-1.5 rounded-full bg-primary px-3.5 py-1.5 text-xs font-bold text-primary-foreground shadow-xs hover:opacity-95 active:scale-95"
                >
                  <Printer className="h-3.5 w-3.5" />
                  <span>Print Slip</span>
                </button>
                <button
                  onClick={() => setSlipModalRecord(null)}
                  className="rounded-full p-1.5 text-muted-foreground hover:bg-muted"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Printable Content Area */}
            <div id="hisab-printable-slip" className="flex flex-col gap-4 p-2 bg-card">
              {/* Slip Header */}
              <div className="text-center border-b border-dashed border-border/80 pb-3">
                <h2 className="text-xl font-black tracking-tight text-foreground">AKSHAY RD JEANS</h2>
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest mt-0.5">
                  Denim Garment Manufacturing & Job Work
                </p>
                <p className="text-[10px] text-muted-foreground">Ahmedabad, Gujarat</p>
                <div className="mt-2 inline-block rounded-full bg-primary/10 px-3 py-0.5 text-xs font-black text-primary">
                  SETH HISAB SLIP
                </div>
              </div>

              {/* Bill Details */}
              <div className="grid grid-cols-2 gap-2 text-xs border-b border-border/60 pb-3">
                <div>
                  <p className="text-[9px] uppercase font-bold text-muted-foreground">Seth Client</p>
                  <p className="font-extrabold text-foreground text-sm">{slipModalRecord.seth_name}</p>
                </div>
                <div className="text-right">
                  <p className="text-[9px] uppercase font-bold text-muted-foreground">Hisab Number</p>
                  <p className="font-mono font-black text-foreground">{slipModalRecord.hisab_number}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{slipModalRecord.hisab_date}</p>
                </div>
              </div>

              {/* Lots & Fabric Breakdown Table */}
              <div className="flex flex-col gap-1">
                <p className="text-[10px] font-black uppercase text-muted-foreground">Lots & Cutting Detail</p>
                <table className="w-full text-left text-[11px] border-collapse">
                  <thead>
                    <tr className="border-b border-border/70 text-[9px] uppercase text-muted-foreground">
                      <th className="py-1">Lot / Roll</th>
                      <th className="py-1 text-center">Meters</th>
                      <th className="py-1 text-center">Pieces</th>
                      <th className="py-1 text-right">Rate</th>
                      <th className="py-1 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(slipModalRecord.lots || []).map((l, idx) => (
                      <tr key={idx} className="border-b border-border/40">
                        <td className="py-1.5 font-bold text-foreground">
                          #{l.lot_number}
                          <span className="block text-[9px] font-normal text-muted-foreground">
                            {l.roll_number} ({l.fabric_type})
                          </span>
                        </td>
                        <td className="py-1.5 text-center text-foreground">{l.meter_used}m</td>
                        <td className="py-1.5 text-center font-bold text-foreground">{l.piece_count}</td>
                        <td className="py-1.5 text-right text-foreground">₹{l.rate_per_piece}</td>
                        <td className="py-1.5 text-right font-extrabold text-foreground">
                          ₹{l.amount.toLocaleString("en-IN")}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Totals Summary */}
              <div className="rounded-xl bg-muted/30 p-3 flex flex-col gap-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Pieces Cut & Stitched:</span>
                  <span className="font-extrabold text-foreground">{slipModalRecord.total_pieces} pcs</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Fabric Consumed:</span>
                  <span className="font-bold text-foreground">
                    {slipModalRecord.total_meter_used} m ({slipModalRecord.average_consumption} m/pc)
                  </span>
                </div>
                <div className="flex justify-between border-t border-border/40 pt-1">
                  <span className="text-muted-foreground">Stitching Charges:</span>
                  <span className="font-extrabold text-foreground">
                    ₹{slipModalRecord.stitching_amount.toLocaleString("en-IN")}
                  </span>
                </div>

                {slipModalRecord.extra_charges > 0 && (
                  <div className="flex justify-between text-emerald-600">
                    <span>
                      + Extra Charges {slipModalRecord.extra_charges_notes ? `(${slipModalRecord.extra_charges_notes})` : ""}:
                    </span>
                    <span className="font-bold">+₹{slipModalRecord.extra_charges.toLocaleString("en-IN")}</span>
                  </div>
                )}

                {slipModalRecord.deductions > 0 && (
                  <div className="flex justify-between text-red-600">
                    <span>
                      - Deductions {slipModalRecord.deductions_notes ? `(${slipModalRecord.deductions_notes})` : ""}:
                    </span>
                    <span className="font-bold">-₹{slipModalRecord.deductions.toLocaleString("en-IN")}</span>
                  </div>
                )}

                <div className="flex justify-between border-t border-border pt-1.5 text-sm font-black text-foreground">
                  <span>Gross Total Bill:</span>
                  <span>₹{slipModalRecord.total_amount.toLocaleString("en-IN")}</span>
                </div>

                <div className="flex justify-between text-emerald-600 font-bold">
                  <span>Less: Advance / Paid ({slipModalRecord.payment_method}):</span>
                  <span>-₹{slipModalRecord.paid_amount.toLocaleString("en-IN")}</span>
                </div>

                <div className="flex justify-between border-t border-dashed border-border pt-2 text-base font-black">
                  <span className="text-foreground">Net Balance Due:</span>
                  <span className={slipModalRecord.balance_amount > 0 ? "text-amber-600" : "text-emerald-600"}>
                    ₹{slipModalRecord.balance_amount.toLocaleString("en-IN")}
                  </span>
                </div>
              </div>

              {/* Footer Signatures */}
              <div className="grid grid-cols-2 gap-4 border-t border-dashed border-border pt-4 mt-2 text-[10px]">
                <div>
                  <p className="text-muted-foreground font-semibold">Prepared By:</p>
                  <p className="font-bold text-foreground mt-4">{slipModalRecord.handled_by}</p>
                </div>
                <div className="text-right">
                  <p className="text-muted-foreground font-semibold">Authorized Signatory:</p>
                  <p className="font-bold text-foreground mt-4">For AKSHAY RD JEANS</p>
                </div>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: RECORD PAYMENT                                                  */}
      {/* ========================================================================= */}
      {paymentModalRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="relative w-full max-w-sm rounded-3xl bg-card p-5 shadow-2xl ring-1 ring-border flex flex-col gap-4 text-foreground">
            <div className="flex items-center justify-between border-b border-border pb-2.5">
              <div>
                <h3 className="text-sm font-bold text-foreground">Record Seth Payment</h3>
                <p className="text-[10px] text-muted-foreground">
                  Hisab #{paymentModalRecord.hisab_number} ({paymentModalRecord.seth_name})
                </p>
              </div>
              <button
                onClick={() => setPaymentModalRecord(null)}
                className="rounded-full p-1 text-muted-foreground hover:bg-muted"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSavePayment} className="flex flex-col gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-bold text-muted-foreground">Payment Amount (₹)</label>
                <input
                  type="number"
                  step="1"
                  value={payAmount}
                  onChange={(e) => setPayAmount(e.target.value)}
                  required
                  className="rounded-xl bg-background p-2.5 text-sm font-black text-foreground ring-1 ring-border focus:ring-2 focus:ring-primary"
                />
                <span className="text-[10px] text-muted-foreground">
                  Outstanding balance: ₹{paymentModalRecord.balance_amount.toLocaleString("en-IN")}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-muted-foreground">Date</label>
                  <input
                    type="date"
                    value={payDate}
                    onChange={(e) => setPayDate(e.target.value)}
                    required
                    className="rounded-xl bg-background p-2 text-xs font-bold text-foreground ring-1 ring-border"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-muted-foreground">Method</label>
                  <select
                    value={payMethod}
                    onChange={(e) => setPayMethod(e.target.value)}
                    className="rounded-xl bg-background p-2 text-xs font-bold text-foreground ring-1 ring-border"
                  >
                    <option value="Cash">Cash</option>
                    <option value="Bank Transfer">Bank Transfer</option>
                    <option value="GPay / UPI">GPay / UPI</option>
                    <option value="Cheque">Cheque</option>
                  </select>
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-muted-foreground">Handled By</label>
                <input
                  type="text"
                  value={payHandledBy}
                  onChange={(e) => setPayHandledBy(e.target.value)}
                  className="rounded-xl bg-background p-2 text-xs font-bold text-foreground ring-1 ring-border"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-muted-foreground">Notes</label>
                <input
                  type="text"
                  value={payNotes}
                  onChange={(e) => setPayNotes(e.target.value)}
                  placeholder="Optional payment notes"
                  className="rounded-xl bg-background p-2 text-xs text-foreground ring-1 ring-border"
                />
              </div>

              <div className="flex items-center justify-end gap-2 border-t border-border pt-3 mt-1">
                <button
                  type="button"
                  onClick={() => setPaymentModalRecord(null)}
                  className="rounded-xl px-3 py-1.5 text-xs font-bold text-muted-foreground"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-emerald-700 active:scale-95"
                >
                  {isSubmitting ? "Saving..." : "Record Payment"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* ========================================================================= */}
      {/* MODAL 4: IMPORT SETH HISAB DATA                                          */}
      {/* ========================================================================= */}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs overflow-y-auto">
          <div className="relative w-full max-w-lg rounded-3xl bg-card p-5 md:p-6 shadow-2xl ring-1 ring-border flex flex-col gap-4 text-foreground max-h-[92vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div>
                <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                  <Upload className="h-5 w-5 text-primary" />
                  <span>Import Seth Hisab Data</span>
                </h3>
                <p className="text-xs text-muted-foreground">
                  Upload past bills or job settlements from an Excel (.xlsx) or CSV file
                </p>
              </div>
              <button
                onClick={() => {
                  setIsImportModalOpen(false)
                  setImportFile(null)
                  setImportPreview([])
                  setImportStatus(null)
                }}
                className="rounded-full p-1.5 text-muted-foreground hover:bg-muted"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Template Download Banner */}
            <div className="flex items-center justify-between rounded-2xl bg-muted/40 p-3.5 ring-1 ring-border/60">
              <div className="flex items-center gap-2.5">
                <FileSpreadsheet className="h-5 w-5 text-emerald-600 shrink-0" />
                <div>
                  <p className="text-xs font-bold text-foreground">Need sample format?</p>
                  <p className="text-[10px] text-muted-foreground">Download sample CSV template with column headers</p>
                </div>
              </div>
              <a
                href="/api/hisab-seth/import"
                download="seth_hisab_import_template.csv"
                className="rounded-xl bg-card px-3 py-1.5 text-xs font-bold text-foreground ring-1 ring-border hover:bg-muted active:scale-95 flex items-center gap-1.5"
              >
                <Download className="h-3.5 w-3.5 text-primary" />
                <span>Template</span>
              </a>
            </div>

            <form onSubmit={handleUploadImport} className="flex flex-col gap-4">
              {/* File Input Box */}
              <div className="flex flex-col items-center justify-center border-2 border-dashed border-border/80 rounded-2xl p-6 text-center hover:border-primary/50 transition-colors bg-background/50">
                <Upload className="h-8 w-8 text-primary mb-2" />
                <label className="cursor-pointer">
                  <span className="text-xs font-extrabold text-primary hover:underline">
                    Click to choose file
                  </span>
                  <span className="text-xs text-muted-foreground"> or drag and drop</span>
                  <input
                    type="file"
                    accept=".csv,.xlsx"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </label>
                <p className="text-[10px] text-muted-foreground mt-1">Supports Excel (.xlsx) and CSV (.csv)</p>
                {importFile && (
                  <div className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
                    <FileText className="h-3.5 w-3.5" />
                    <span>{importFile.name} ({(importFile.size / 1024).toFixed(1)} KB)</span>
                  </div>
                )}
              </div>

              {/* CSV Preview Table */}
              {importPreview.length > 0 && (
                <div className="flex flex-col gap-1.5">
                  <p className="text-[11px] font-bold text-muted-foreground uppercase">
                    Preview (First {importPreview.length} rows)
                  </p>
                  <div className="overflow-x-auto rounded-xl ring-1 ring-border text-[11px] max-h-36">
                    <table className="w-full text-left border-collapse">
                      <thead className="bg-muted/60 text-[9px] uppercase font-bold text-muted-foreground sticky top-0">
                        <tr>
                          <th className="p-1.5">Seth</th>
                          <th className="p-1.5">Date</th>
                          <th className="p-1.5">Lot #</th>
                          <th className="p-1.5">Roll #</th>
                          <th className="p-1.5 text-right">Pcs</th>
                          <th className="p-1.5 text-right">Rate</th>
                        </tr>
                      </thead>
                      <tbody>
                        {importPreview.map((row, idx) => (
                          <tr key={idx} className="border-t border-border/50">
                            <td className="p-1.5 font-bold text-foreground">{row["Seth Name"] || Object.values(row)[0] || "-"}</td>
                            <td className="p-1.5 text-muted-foreground">{row["Hisab Date"] || Object.values(row)[1] || "-"}</td>
                            <td className="p-1.5 text-foreground">{row["Lot Number"] || Object.values(row)[2] || "-"}</td>
                            <td className="p-1.5 text-muted-foreground">{row["Roll Number"] || Object.values(row)[3] || "-"}</td>
                            <td className="p-1.5 text-right font-bold text-foreground">{row["Pieces"] || "-"}</td>
                            <td className="p-1.5 text-right font-bold text-primary">₹{row["Stitching Rate"] || "-"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Status feedback */}
              {importStatus && (
                <div
                  className={`rounded-xl p-3 text-xs font-semibold flex items-center gap-2 ${
                    importStatus.success
                      ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 ring-1 ring-emerald-600/30"
                      : "bg-red-100 text-red-800 dark:bg-red-950/40 dark:text-red-300 ring-1 ring-red-600/30"
                  }`}
                >
                  {importStatus.success ? (
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                  ) : (
                    <AlertCircle className="h-4 w-4 shrink-0 text-red-600" />
                  )}
                  <span>{importStatus.message}</span>
                </div>
              )}

              {/* Modal Actions */}
              <div className="flex items-center justify-end gap-2 border-t border-border pt-3">
                <button
                  type="button"
                  onClick={() => {
                    setIsImportModalOpen(false)
                    setImportFile(null)
                    setImportPreview([])
                    setImportStatus(null)
                  }}
                  className="rounded-xl px-4 py-2 text-xs font-bold text-muted-foreground hover:bg-muted"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!importFile || isImporting}
                  className="rounded-xl bg-primary px-5 py-2 text-xs font-bold text-primary-foreground shadow-sm hover:opacity-95 disabled:opacity-50 active:scale-95 flex items-center gap-1.5"
                >
                  <Upload className="h-3.5 w-3.5" />
                  <span>{isImporting ? "Importing Data..." : "Import Now"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* ========================================================================= */}
      {/* MODAL 5: GOOGLE SHEETS REAL-TIME SYNC CONFIG                             */}
      {/* ========================================================================= */}
      {isSheetsModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs overflow-y-auto">
          <div className="relative w-full max-w-lg rounded-3xl bg-card p-5 md:p-6 shadow-2xl ring-1 ring-border flex flex-col gap-4 text-foreground max-h-[92vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div>
                <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                  <Cloud className="h-5 w-5 text-emerald-600" />
                  <span>Google Sheets Real-Time Sync</span>
                </h3>
                <p className="text-xs text-muted-foreground">
                  Prevent data loss with live cloud backup into your Google Spreadsheet
                </p>
              </div>
              <button
                onClick={() => {
                  setIsSheetsModalOpen(false)
                  setTestResult(null)
                  setSyncAllResult(null)
                }}
                className="rounded-full p-1.5 text-muted-foreground hover:bg-muted"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Status Card */}
            <div className="rounded-2xl bg-muted/40 p-3.5 ring-1 ring-border/60 flex flex-col gap-2.5">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-foreground">Sync Status</span>
                <span
                  className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-black ${
                    sheetsWebhookUrl
                      ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  <span className={`h-2 w-2 rounded-full ${sheetsWebhookUrl ? "bg-emerald-500 animate-pulse" : "bg-muted-foreground"}`} />
                  {sheetsWebhookUrl ? "Live Sync Active" : "Not Configured"}
                </span>
              </div>

              {sheetsStatus?.last_sync_at && (
                <p className="text-[10px] text-muted-foreground">
                  Last Synced: {new Date(sheetsStatus.last_sync_at).toLocaleString("en-IN")} • Total Synced: {sheetsStatus.total_synced || 0}
                </p>
              )}
            </div>

            {/* Configuration Form */}
            <form onSubmit={handleSaveSheetsConfig} className="flex flex-col gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-foreground">Google Apps Script Webhook URL</label>
                <input
                  type="url"
                  value={sheetsWebhookUrl}
                  onChange={(e) => setSheetsWebhookUrl(e.target.value)}
                  placeholder="https://script.google.com/macros/s/.../exec"
                  required
                  className="rounded-xl bg-background p-2.5 text-xs text-foreground ring-1 ring-border focus:ring-2 focus:ring-primary"
                />
                <span className="text-[10px] text-muted-foreground">
                  Paste the Web App deployment URL from your Google Sheet&apos;s Apps Script
                </span>
              </div>

              <div className="flex items-center justify-between rounded-xl bg-background p-2.5 ring-1 ring-border/60">
                <div>
                  <p className="text-xs font-bold text-foreground">Auto Real-Time Sync</p>
                  <p className="text-[10px] text-muted-foreground">Instantly append row when Hisab is saved or paid</p>
                </div>
                <input
                  type="checkbox"
                  checked={sheetsAutoSync}
                  onChange={(e) => setSheetsAutoSync(e.target.checked)}
                  className="h-4 w-4 rounded text-primary focus:ring-primary cursor-pointer"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-1 gap-2">
                <button
                  type="button"
                  onClick={handleTestSheets}
                  disabled={isTestingSheets || !sheetsWebhookUrl}
                  className="flex items-center gap-1.5 rounded-xl bg-card px-3.5 py-2 text-xs font-bold text-foreground ring-1 ring-border hover:bg-muted active:scale-95 disabled:opacity-50 shadow-xs"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${isTestingSheets ? "animate-spin" : ""}`} />
                  <span>{isTestingSheets ? "Testing..." : "Test Connection"}</span>
                </button>

                <button
                  type="submit"
                  className="rounded-xl bg-primary px-4 py-2 text-xs font-bold text-primary-foreground shadow-sm hover:opacity-95 active:scale-95"
                >
                  Save Settings
                </button>
              </div>

              {/* Test Connection Result Feedback */}
              {testResult && (
                <div
                  className={`rounded-xl p-2.5 text-xs font-semibold flex items-center gap-2 ${
                    testResult.success
                      ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 ring-1 ring-emerald-600/30"
                      : "bg-red-100 text-red-800 dark:bg-red-950/40 dark:text-red-300 ring-1 ring-red-600/30"
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

            {/* Bulk Push Existing Records */}
            {sheetsWebhookUrl && (
              <div className="rounded-2xl border border-dashed border-border/80 p-3 flex flex-col gap-2 bg-background/50">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-xs font-bold text-foreground">Sync All Existing Hisabs</p>
                    <p className="text-[10px] text-muted-foreground">Upload all past hisab records to Google Sheet</p>
                  </div>
                  <button
                    onClick={handleSyncAllToSheets}
                    disabled={isSyncingAll}
                    className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-700 active:scale-95 disabled:opacity-50"
                  >
                    <Upload className="h-3.5 w-3.5" />
                    <span>{isSyncingAll ? "Syncing..." : "Sync Hisab Tab"}</span>
                  </button>
                </div>
                {syncAllResult && (
                  <p className="text-xs font-bold text-foreground mt-1">{syncAllResult}</p>
                )}

                <div className="mt-1 pt-2 border-t border-border/50 flex items-center justify-between">
                  <span className="text-[10px] text-muted-foreground">Want to sync employees, rolls, cutting, cash book too?</span>
                  <Link
                    href="/google-sheets"
                    className="text-[10px] font-bold text-primary hover:underline flex items-center gap-1"
                  >
                    <span>Full Factory Sync Hub &rarr;</span>
                  </Link>
                </div>
              </div>
            )}

            {/* Setup Instructions Accordion */}
            <div className="rounded-2xl bg-muted/30 p-3.5 ring-1 ring-border/60 flex flex-col gap-2.5">
              <p className="text-xs font-black uppercase text-foreground">
                How to setup your Google Sheet (2 Minutes)
              </p>
              <ol className="list-decimal list-inside text-[11px] text-muted-foreground flex flex-col gap-1.5 leading-relaxed">
                <li>
                  Open <span className="font-bold text-foreground">Google Sheets</span> and create a new blank sheet.
                </li>
                <li>
                  Click <span className="font-bold text-foreground">Extensions &gt; Apps Script</span> in the top menu.
                </li>
                <li>
                  Delete any existing code, paste the script below, and click <span className="font-bold text-foreground">Save</span>.
                </li>
                <li>
                  Click <span className="font-bold text-foreground">Deploy &gt; New deployment</span>. Select <span className="font-bold text-foreground">Web app</span>.
                </li>
                <li>
                  Set <span className="font-bold text-foreground">Who has access</span> to <span className="font-bold text-primary">Anyone</span>, then click <span className="font-bold text-foreground">Deploy</span>.
                </li>
                <li>
                  Copy the generated <span className="font-bold text-foreground">Web app URL</span> and paste it into the box above!
                </li>
              </ol>

              {/* Code Snippet Box */}
              <div className="mt-1 flex flex-col gap-1.5">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-bold text-muted-foreground">Google Apps Script Code</span>
                  <button
                    onClick={handleCopyScript}
                    className="flex items-center gap-1 rounded-lg bg-card px-2.5 py-1 text-[10px] font-bold text-foreground ring-1 ring-border hover:bg-muted active:scale-95 shadow-xs"
                  >
                    {copiedScript ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3" />}
                    <span>{copiedScript ? "Copied!" : "Copy Script"}</span>
                  </button>
                </div>
                <pre className="max-h-36 overflow-y-auto rounded-xl bg-background p-2.5 text-[10px] font-mono text-muted-foreground ring-1 ring-border/70 select-all leading-tight">
                  {sheetsScriptCode || "Loading Apps Script..."}
                </pre>
              </div>
            </div>

          </div>
        </div>
      )}
    </main>
  )
}

export default function SethHisabPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-background">
          <div className="mx-auto max-w-2xl px-5 py-6">
            <div className="h-8 w-48 animate-pulse rounded bg-muted" />
          </div>
        </main>
      }
    >
      <SethHisabContent />
    </Suspense>
  )
}

