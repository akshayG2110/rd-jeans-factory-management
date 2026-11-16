"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import {
  Shield,
  Eye,
  EyeOff,
  Tags,
  Building2,
  Users,
  Database,
  Cloud,
  Download,
  Upload,
  Plus,
  Trash2,
  Edit2,
  Check,
  X,
  AlertCircle,
  CheckCircle2,
  Save,
  Lock,
  Layers,
  LogOut,
  ExternalLink,
  Sliders,
  Sparkles,
  Scissors,
  Package,
  Archive,
  HandCoins,
  TrendingUp,
  TrendingDown,
  BookOpen,
  BarChart3,
  Calculator,
  Handshake,
  Coins,
  KeyRound,
  RefreshCw,
  Phone,
  MapPin,
  FileSpreadsheet,
  Search,
  Filter,
  Activity,
  Power,
  PowerOff
} from "lucide-react"

export default function SuperAdminPortalPage() {
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  const [isAuthenticating, setIsAuthenticating] = useState(true)
  const [activeTab, setActiveTab] = useState<
    "organizations" | "visibility" | "dropdowns" | "profile" | "users" | "backup" | "stats"
  >("organizations")

  // Multi-Organization State
  const [organizations, setOrganizations] = useState<any[]>([])
  const [activeOrgSlug, setActiveOrgSlug] = useState<string>("rd-jeans-main")
  const [isCreateOrgModalOpen, setIsCreateOrgModalOpen] = useState(false)
  const [isEditOrgModalOpen, setIsEditOrgModalOpen] = useState(false)
  const [editingOrg, setEditingOrg] = useState<any>(null)
  const [isSavingOrg, setIsSavingOrg] = useState(false)
  const [orgSearchQuery, setOrgSearchQuery] = useState("")
  const [orgStatusFilter, setOrgStatusFilter] = useState<"all" | "active" | "inactive">("all")
  const [tenantPing, setTenantPing] = useState<Record<string, { latency_ms: number; status: string; loading?: boolean }>>({})
  const [togglingOrgSlug, setTogglingOrgSlug] = useState<string | null>(null)
  const [newOrgForm, setNewOrgForm] = useState({
    name: "",
    slug: "",
    owner_name: "",
    phone: "",
    address: "",
    gstin: "",
    initial_username: "",
    initial_password: "",
    default_stitching_rate: 45,
    default_washing_rate: 5,
    modules: {
      employees: true,
      upad: true,
      seths: true,
      hisab_seth: true,
      cutting: true,
      finished_goods: true,
      rolls: true,
      partners: true,
      income: true,
      expense: true,
      cashbook: true,
      reports: true
    }
  })

  // Master Settings State
  const [settings, setSettings] = useState<any>({
    company_name: "DenimFlow ERP",
    owner_name: "Akshay Gohel",
    phone: "",
    email: "",
    address: "Surat, Gujarat",
    gstin: "",
    currency_symbol: "₹",
    default_stitching_rate: 50,
    default_washing_rate: 5,
    shift_hours: 10,
    module_visibility: {},
    operations: {},
    dropdown_categories: {}
  })

  // Dropdown Master State
  const [selectedCategoryKey, setSelectedCategoryKey] = useState<string>("fabric_types")
  const [newDropdownItem, setNewDropdownItem] = useState("")
  const [editingItemOld, setEditingItemOld] = useState<string | null>(null)
  const [editingItemNew, setEditingItemNew] = useState<string>("")
  const [isNewCategoryModalOpen, setIsNewCategoryModalOpen] = useState(false)
  const [newCategoryKey, setNewCategoryKey] = useState("")
  const [newCategoryLabel, setNewCategoryLabel] = useState("")

  // Staff Users State
  const [currentSuperAdminUser, setCurrentSuperAdminUser] = useState<string>("SuperAdmin")
  const [users, setUsers] = useState<any[]>([])
  const [isUserModalOpen, setIsUserModalOpen] = useState(false)
  const [userModalMode, setUserModalMode] = useState<"create" | "edit">("create")
  const [selectedUser, setSelectedUser] = useState<any>(null)
  const [userSearchQuery, setUserSearchQuery] = useState("")
  const [userStatusFilter, setUserStatusFilter] = useState<"all" | "active" | "inactive">("all")
  const [togglingUserId, setTogglingUserId] = useState<string | number | null>(null)
  const [userForm, setUserForm] = useState({
    username: "",
    password: "",
    display_name: "",
    role: "Operator",
    status: "Active"
  })

  // Database Backup & Stats
  const [stats, setStats] = useState<any>({ total_records: 0, collections: {} })
  const [restoreFile, setRestoreFile] = useState<File | null>(null)
  const [isRestoring, setIsRestoring] = useState(false)
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null)

  // Super Admin Password Update
  const [superAdminNewPass, setSuperAdminNewPass] = useState("")
  const [isUpdatingSuperPass, setIsUpdatingSuperPass] = useState(false)

  // Helper feedback banner
  const showFeedback = (type: "success" | "error", message: string) => {
    setFeedback({ type, message })
    setTimeout(() => {
      setFeedback(null)
    }, 4000)
  }

  // Load Data
  const loadData = async () => {
    try {
      const [settingsRes, usersRes, statsRes, orgsRes] = await Promise.all([
        fetch("/api/super-admin/settings").then((r) => r.json()),
        fetch("/api/super-admin/users").then((r) => r.json()),
        fetch("/api/super-admin/stats").then((r) => r.json()),
        fetch("/api/organizations").then((r) => r.json()).catch(() => ({ success: false }))
      ])

      if (settingsRes.success && settingsRes.data) {
        setSettings(settingsRes.data)
      }
      if (usersRes.success && usersRes.data) {
        setUsers(usersRes.data)
      }
      if (statsRes.success && statsRes.data) {
        setStats(statsRes.data)
      }
      if (orgsRes.success && orgsRes.data) {
        setOrganizations(orgsRes.data.organizations || [])
        if (orgsRes.data.activeSlug) {
          setActiveOrgSlug(orgsRes.data.activeSlug)
        }
      }
    } catch {
      showFeedback("error", "Failed to load super admin settings")
    }
  }

  // Handle Switch Organization from Super Admin
  const handleSwitchOrgFromAdmin = async (slug: string) => {
    try {
      const res = await fetch("/api/organizations/switch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug }),
      })
      const json = await res.json()
      if (json.success) {
        setActiveOrgSlug(slug)
        showFeedback("success", `Switched active organization to "${json.data?.organizationName || slug}"`)
        loadData()
      } else {
        showFeedback("error", json.detail || "Failed to switch organization")
      }
    } catch (e: any) {
      showFeedback("error", e.message)
    }
  }

  // Handle Create Organization
  const handleCreateOrganization = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSavingOrg(true)
    try {
      const res = await fetch("/api/organizations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newOrgForm.name,
          slug: newOrgForm.slug,
          owner_name: newOrgForm.owner_name,
          phone: newOrgForm.phone,
          address: newOrgForm.address,
          gstin: newOrgForm.gstin,
          initial_username: newOrgForm.initial_username,
          initial_password: newOrgForm.initial_password,
          settings: {
            default_stitching_rate: Number(newOrgForm.default_stitching_rate) || 45,
            default_washing_rate: Number(newOrgForm.default_washing_rate) || 5,
          },
          module_visibility: newOrgForm.modules,
        }),
      })
      const json = await res.json()
      if (json.success) {
        showFeedback("success", json.message || "Organization created successfully!")
        setIsCreateOrgModalOpen(false)
        setNewOrgForm({
          name: "",
          slug: "",
          owner_name: "",
          phone: "",
          address: "",
          gstin: "",
          initial_username: "",
          initial_password: "",
          default_stitching_rate: 45,
          default_washing_rate: 5,
          modules: {
            employees: true,
            upad: true,
            seths: true,
            hisab_seth: true,
            cutting: true,
            finished_goods: true,
            rolls: true,
            partners: true,
            income: true,
            expense: true,
            cashbook: true,
            reports: true
          }
        })
        loadData()
      } else {
        showFeedback("error", json.detail || "Failed to create organization")
      }
    } catch (e: any) {
      showFeedback("error", e.message)
    } finally {
      setIsSavingOrg(false)
    }
  }

  // Handle Open Edit Org
  const handleOpenEditOrg = (org: any) => {
    setEditingOrg({
      ...org,
      name: org.name,
      owner_name: org.owner_name || "",
      phone: org.phone || "",
      address: org.address || "",
      gstin: org.gstin || "",
      status: org.status || "Active",
      google_sheets_webhook_url: org.settings?.google_sheets_webhook_url || "",
      default_stitching_rate: org.settings?.default_stitching_rate ?? 45,
      default_washing_rate: org.settings?.default_washing_rate ?? 5,
      module_visibility: {
        ...org.module_visibility,
      },
    })
    setIsEditOrgModalOpen(true)
  }

  // Handle Save Edit Org
  const handleSaveEditOrg = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingOrg) return
    setIsSavingOrg(true)
    try {
      const res = await fetch(`/api/organizations/${editingOrg.slug}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editingOrg.name,
          owner_name: editingOrg.owner_name,
          phone: editingOrg.phone,
          address: editingOrg.address,
          gstin: editingOrg.gstin,
          status: editingOrg.status || "Active",
          settings: {
            default_stitching_rate: Number(editingOrg.default_stitching_rate) || 45,
            default_washing_rate: Number(editingOrg.default_washing_rate) || 5,
            google_sheets_webhook_url: (editingOrg.google_sheets_webhook_url || "").trim(),
          },
          module_visibility: editingOrg.module_visibility,
        }),
      })
      const json = await res.json()
      if (json.success) {
        showFeedback("success", `Organization "${editingOrg.name}" updated successfully!`)
        setIsEditOrgModalOpen(false)
        setEditingOrg(null)
        loadData()
      } else {
        showFeedback("error", json.detail || "Failed to update organization")
      }
    } catch (e: any) {
      showFeedback("error", e.message)
    } finally {
      setIsSavingOrg(false)
    }
  }

  // Handle Delete Org
  const handleDeleteOrg = async (org: any) => {
    if (org.slug === "rd-jeans-main") {
      alert("Cannot delete primary DenimFlow factory organization")
      return
    }
    const confirmName = prompt(
      `CAUTION: This will delete organization "${org.name}" and all its records!\n\nType "${org.slug}" to confirm deletion:`
    )
    if (confirmName !== org.slug) {
      if (confirmName !== null) alert("Organization slug did not match. Deletion cancelled.")
      return
    }

    try {
      const res = await fetch(`/api/organizations/${org.slug}`, { method: "DELETE" })
      const json = await res.json()
      if (json.success) {
        showFeedback("success", json.message || "Organization deleted")
        loadData()
      } else {
        showFeedback("error", json.detail || "Failed to delete organization")
      }
    } catch (e: any) {
      showFeedback("error", e.message)
    }
  }

  // 1-Click Toggle Organization Status (Active <-> Inactive)
  const handleToggleOrgStatus = async (org: any) => {
    if (org.slug === "rd-jeans-main" && org.status === "Active") {
      alert("Notice: Primary DenimFlow factory organization cannot be deactivated as it is the master factory root.")
      return
    }

    const nextStatus = org.status === "Inactive" ? "Active" : "Inactive"
    const prevStatus = org.status || "Active"

    // Instant optimistic UI update
    setTogglingOrgSlug(org.slug)
    setOrganizations((prev) =>
      prev.map((o) => (o.slug === org.slug ? { ...o, status: nextStatus } : o))
    )

    try {
      const res = await fetch(`/api/organizations/${org.slug}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      })
      const json = await res.json()
      if (json.success) {
        showFeedback(
          "success",
          `Organization "${org.name}" is now ${nextStatus === "Active" ? "ACTIVATED (Online)" : "DEACTIVATED (Suspended)"}`
        )
      } else {
        // Rollback on failure
        setOrganizations((prev) =>
          prev.map((o) => (o.slug === org.slug ? { ...o, status: prevStatus } : o))
        )
        showFeedback("error", json.detail || "Failed to update organization status")
      }
    } catch (e: any) {
      // Rollback on failure
      setOrganizations((prev) =>
        prev.map((o) => (o.slug === org.slug ? { ...o, status: prevStatus } : o))
      )
      showFeedback("error", e.message)
    } finally {
      setTogglingOrgSlug(null)
    }
  }

  // Health Ping to Tenant Database
  const handlePingTenant = async (slug: string) => {
    setTenantPing((prev) => ({
      ...prev,
      [slug]: { latency_ms: -1, status: "Testing...", loading: true },
    }))

    try {
      const res = await fetch(`/api/organizations/${slug}/ping`)
      const json = await res.json()
      if (json.success) {
        setTenantPing((prev) => ({
          ...prev,
          [slug]: { latency_ms: json.latency_ms, status: "Live Atlas", loading: false },
        }))
        showFeedback("success", `Pinged "${slug}" DB: ${json.latency_ms}ms latency (Connected)`)
      } else {
        setTenantPing((prev) => ({
          ...prev,
          [slug]: { latency_ms: -1, status: "Unreachable", loading: false },
        }))
        showFeedback("error", `Ping error: ${json.detail || "Tenant database unreachable"}`)
      }
    } catch (e: any) {
      setTenantPing((prev) => ({
        ...prev,
        [slug]: { latency_ms: -1, status: "Failed", loading: false },
      }))
      showFeedback("error", e.message)
    }
  }

  // Verify Super Admin Session
  useEffect(() => {
    setMounted(true)
    const checkAuth = async () => {
      try {
        const savedUser = localStorage.getItem("super_admin_user")
        if (savedUser) setCurrentSuperAdminUser(savedUser)

        const res = await fetch("/api/super-admin/auth/me")
        if (!res.ok) {
          router.push("/super-admin/login")
          return
        }
        const authData = await res.json()
        if (authData.user?.username) {
          setCurrentSuperAdminUser(authData.user.username)
        }
        setIsAuthenticating(false)
        loadData()
      } catch {
        router.push("/super-admin/login")
      }
    }
    checkAuth()
  }, [router])

  // Logout handler
  const handleLogout = () => {
    document.cookie = "super_admin_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT"
    document.cookie = "super_admin_user=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT"
    localStorage.removeItem("super_admin_user")
    localStorage.removeItem("super_admin_token")
    router.push("/super-admin/login")
  }

  // Toggle Module Visibility
  const handleToggleModuleVisibility = async (moduleKey: string) => {
    const current = settings.module_visibility?.[moduleKey] ?? true
    const updatedVisibility = {
      ...settings.module_visibility,
      [moduleKey]: !current
    }
    setSettings({ ...settings, module_visibility: updatedVisibility })

    try {
      const res = await fetch("/api/super-admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ module_visibility: updatedVisibility })
      })
      const json = await res.json()
      if (json.success) {
        showFeedback(
          "success",
          `Module "${moduleKey}" is now ${!current ? "VISIBLE on Dashboard" : "HIDDEN from Dashboard"}`
        )
      }
    } catch {
      showFeedback("error", "Failed to update module visibility")
    }
  }

  // Toggle Operational Safeguard
  const handleToggleOperation = async (opKey: string) => {
    const current = settings.operations?.[opKey] ?? true
    const updatedOperations = {
      ...settings.operations,
      [opKey]: !current
    }
    setSettings({ ...settings, operations: updatedOperations })

    try {
      await fetch("/api/super-admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ operations: updatedOperations })
      })
      showFeedback("success", `Updated setting: ${opKey}`)
    } catch {
      showFeedback("error", "Failed to update setting")
    }
  }

  // Dropdown Master: Save / Edit Item
  const handleSaveDropdownItem = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    const itemValue = editingItemOld ? editingItemNew.trim() : newDropdownItem.trim()
    if (!itemValue) return

    try {
      const res = await fetch("/api/super-admin/dropdowns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category: selectedCategoryKey,
          oldItem: editingItemOld,
          newItem: itemValue
        })
      })
      const json = await res.json()
      if (json.success) {
        showFeedback("success", json.message)
        setNewDropdownItem("")
        setEditingItemOld(null)
        setEditingItemNew("")
        loadData()
      } else {
        showFeedback("error", json.detail || "Error saving item")
      }
    } catch {
      showFeedback("error", "Network error")
    }
  }

  // Dropdown Master: Delete item
  const handleDeleteDropdownItem = async (itemToDelete: string) => {
    if (!confirm(`Delete "${itemToDelete}" from ${selectedCategoryKey}?`)) return
    try {
      const res = await fetch("/api/super-admin/dropdowns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "delete_item",
          category: selectedCategoryKey,
          item: itemToDelete
        })
      })
      const json = await res.json()
      if (json.success) {
        showFeedback("success", `Deleted "${itemToDelete}"`)
        loadData()
      }
    } catch {
      showFeedback("error", "Failed to delete item")
    }
  }

  // Dropdown Master: Create category
  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newCategoryKey.trim() || !newCategoryLabel.trim()) return

    try {
      const res = await fetch("/api/super-admin/dropdowns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "create_category",
          key: newCategoryKey,
          label: newCategoryLabel
        })
      })
      const json = await res.json()
      if (json.success) {
        showFeedback("success", json.message)
        setIsNewCategoryModalOpen(false)
        setSelectedCategoryKey(newCategoryKey.trim().toLowerCase().replace(/[^a-z0-9_]/g, "_"))
        setNewCategoryKey("")
        setNewCategoryLabel("")
        loadData()
      } else {
        showFeedback("error", json.detail || "Failed to create category")
      }
    } catch {
      showFeedback("error", "Network error")
    }
  }

  // Dropdown Master: Delete category
  const handleDeleteCategory = async (catKey: string) => {
    if (!confirm(`WARNING: Are you sure you want to delete the entire category "${catKey}"?`)) return
    try {
      const res = await fetch("/api/super-admin/dropdowns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "delete_category", category: catKey })
      })
      const json = await res.json()
      if (json.success) {
        showFeedback("success", `Category "${catKey}" deleted`)
        setSelectedCategoryKey("fabric_types")
        loadData()
      }
    } catch {
      showFeedback("error", "Failed to delete category")
    }
  }

  // Save Factory Profile Settings
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const res = await fetch("/api/super-admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          company_name: settings.company_name,
          owner_name: settings.owner_name,
          phone: settings.phone,
          address: settings.address,
          default_stitching_rate: Number(settings.default_stitching_rate) || 50,
          default_washing_rate: Number(settings.default_washing_rate) || 5,
          shift_hours: Number(settings.shift_hours) || 10
        })
      })
      const json = await res.json()
      if (json.success) {
        showFeedback("success", "Factory profile and rates updated successfully!")
        loadData()
      }
    } catch {
      showFeedback("error", "Failed to save profile")
    }
  }

  // Save Staff User (Create or Edit)
  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!userForm.username.trim()) return

    try {
      const url =
        userModalMode === "create"
          ? "/api/super-admin/users"
          : `/api/super-admin/users/${selectedUser.id || selectedUser._id}`
      const method = userModalMode === "create" ? "POST" : "PUT"

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(userForm)
      })
      const json = await res.json()
      if (json.success) {
        showFeedback("success", json.message || "User saved")
        setIsUserModalOpen(false)
        loadData()
      } else {
        showFeedback("error", json.detail || "Failed to save user")
      }
    } catch {
      showFeedback("error", "Network error")
    }
  }

  // Delete Staff User
  const handleDeleteUser = async (userId: string, userName: string) => {
    if (!confirm(`Are you sure you want to delete staff account "${userName}"?`)) return
    try {
      const res = await fetch(`/api/super-admin/users/${userId}`, { method: "DELETE" })
      const json = await res.json()
      if (json.success) {
        showFeedback("success", `User "${userName}" deleted`)
        loadData()
      }
    } catch {
      showFeedback("error", "Failed to delete user")
    }
  }

  // 1-Click Toggle Staff User Account Status (Active <-> Inactive)
  const handleToggleUserStatus = async (user: any) => {
    if (user.role === "SuperAdmin") {
      alert("Security Guard: Master Super Admin account cannot be deactivated.")
      return
    }

    const nextStatus = user.status === "Inactive" ? "Active" : "Inactive"
    const prevStatus = user.status || "Active"
    const userId = user.id || user._id

    // Instant optimistic UI update
    setTogglingUserId(userId)
    setUsers((prev) =>
      prev.map((u) => ((u.id || u._id) === userId ? { ...u, status: nextStatus } : u))
    )

    try {
      const res = await fetch(`/api/super-admin/users/${userId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      })
      const json = await res.json()
      if (json.success) {
        showFeedback(
          "success",
          `Staff account @${user.username} is now ${nextStatus === "Active" ? "ACTIVATED" : "DEACTIVATED (Login Disabled)"
          }`
        )
      } else {
        // Rollback on failure
        setUsers((prev) =>
          prev.map((u) => ((u.id || u._id) === userId ? { ...u, status: prevStatus } : u))
        )
        showFeedback("error", json.detail || "Failed to update staff status")
      }
    } catch {
      // Rollback on failure
      setUsers((prev) =>
        prev.map((u) => ((u.id || u._id) === userId ? { ...u, status: prevStatus } : u))
      )
      showFeedback("error", "Failed to update staff status")
    } finally {
      setTogglingUserId(null)
    }
  }

  // Update Master Super Admin Password
  const handleUpdateSuperAdminPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!superAdminNewPass.trim()) return
    setIsUpdatingSuperPass(true)

    try {
      const res = await fetch("/api/super-admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: currentSuperAdminUser,
          password: superAdminNewPass.trim(),
          role: "SuperAdmin",
          status: "Active"
        })
      })
      const json = await res.json()
      if (json.success) {
        showFeedback("success", `Super Admin master password for @${currentSuperAdminUser} updated successfully!`)
        setSuperAdminNewPass("")
      } else {
        showFeedback("error", json.detail || "Failed to update master password")
      }
    } catch {
      showFeedback("error", "Network error")
    } finally {
      setIsUpdatingSuperPass(false)
    }
  }

  // Restore Database Backup
  const handleRestoreDatabase = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!restoreFile) return
    if (!confirm("WARNING: Restoring will overwrite existing records with the backup file data. Continue?")) return

    setIsRestoring(true)
    try {
      const text = await restoreFile.text()
      const json = JSON.parse(text)
      const res = await fetch("/api/super-admin/restore", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(json)
      })
      const result = await res.json()
      if (result.success) {
        showFeedback("success", result.message)
        loadData()
      } else {
        showFeedback("error", result.detail || "Restore failed")
      }
    } catch {
      showFeedback("error", "Invalid JSON backup file")
    } finally {
      setIsRestoring(false)
    }
  }

  if (!mounted || isAuthenticating) {
    return (
      <main className="min-h-screen bg-background flex items-center justify-center text-foreground">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-3 border-primary border-t-transparent" />
          <span className="text-xs font-bold text-muted-foreground">
            Verifying Super Admin Session...
          </span>
        </div>
      </main>
    )
  }

  // Master 12 Modules with their exact icons and theme accents
  const MODULES_LIST = [
    {
      key: "employees",
      name: "Employees",
      desc: "Manage factory staff, masters, cutters, and operators",
      icon: Users,
      iconColor: "text-blue-600 dark:text-blue-400",
      iconBg: "bg-blue-500/10"
    },
    {
      key: "upad",
      name: "Upad (Advances)",
      desc: "Worker cash advances, pending deductions & settlements",
      icon: HandCoins,
      iconColor: "text-amber-600 dark:text-amber-400",
      iconBg: "bg-amber-500/10"
    },
    {
      key: "seths",
      name: "Seth (Clients)",
      desc: "Client trader accounts, contact info & rolls inventory",
      icon: Building2,
      iconColor: "text-indigo-600 dark:text-indigo-400",
      iconBg: "bg-indigo-500/10"
    },
    {
      key: "hisab_seth",
      name: "Hisab Seth",
      desc: "Cutting & roll jobwork settlement billing calculations",
      icon: Calculator,
      iconColor: "text-sky-600 dark:text-sky-400",
      iconBg: "bg-sky-500/10"
    },
    {
      key: "cutting",
      name: "Cutting",
      desc: "Cutting lot registrations, piece counts & roll deductions",
      icon: Scissors,
      iconColor: "text-rose-600 dark:text-rose-400",
      iconBg: "bg-rose-500/10"
    },
    {
      key: "finished_goods",
      name: "Finished Goods",
      desc: "Garment stages: In Stitching, Finished Ready & Dispatched",
      icon: Package,
      iconColor: "text-purple-600 dark:text-purple-400",
      iconBg: "bg-purple-500/10"
    },
    {
      key: "rolls",
      name: "Roll Inventory",
      desc: "Denim rolls received, fabric meters consumed & warehouse stock",
      icon: Archive,
      iconColor: "text-teal-600 dark:text-teal-400",
      iconBg: "bg-teal-500/10"
    },
    {
      key: "partners",
      name: "Partner",
      desc: "Partner capital investments, personal drawings & equity",
      icon: Handshake,
      iconColor: "text-emerald-600 dark:text-emerald-400",
      iconBg: "bg-emerald-500/10"
    },
    {
      key: "income",
      name: "Income",
      desc: "Revenue receipts, stitching collections & scrap sales",
      icon: TrendingUp,
      iconColor: "text-emerald-600 dark:text-emerald-400",
      iconBg: "bg-emerald-500/10"
    },
    {
      key: "expense",
      name: "Expense",
      desc: "Production costs, threads, needles, electricity & rent",
      icon: TrendingDown,
      iconColor: "text-red-600 dark:text-red-400",
      iconBg: "bg-red-500/10"
    },
    {
      key: "cashbook",
      name: "Cash Book",
      desc: "Daily cash balance, inflow & outflow ledger",
      icon: BookOpen,
      iconColor: "text-blue-700 dark:text-blue-300",
      iconBg: "bg-blue-600/10"
    },
    {
      key: "reports",
      name: "Reports",
      desc: "Summaries, monthly financial statements, excel & pdf",
      icon: BarChart3,
      iconColor: "text-violet-600 dark:text-violet-400",
      iconBg: "bg-violet-500/10"
    }
  ]

  // Category Icon Resolver
  const getCategoryIcon = (key: string) => {
    switch (key) {
      case "fabric_types":
        return Archive
      case "expense_categories":
        return TrendingDown
      case "income_sources":
        return TrendingUp
      case "employee_roles":
        return Users
      case "payment_methods":
        return Coins
      case "jeans_sizes":
        return Scissors
      case "colors_shades":
        return Sparkles
      case "units_of_measurement":
        return Sliders
      default:
        return Tags
    }
  }

  const activeCategory = settings.dropdown_categories?.[selectedCategoryKey] || {
    label: selectedCategoryKey,
    items: []
  }

  const showingCount = MODULES_LIST.filter(
    (m) => (settings.module_visibility?.[m.key] ?? true) === true
  ).length

  // Filtered Organizations (Instant client-side performance)
  const filteredOrganizations = organizations.filter((org) => {
    const q = orgSearchQuery.trim().toLowerCase()
    const matchesSearch =
      !q ||
      org.name?.toLowerCase().includes(q) ||
      org.slug?.toLowerCase().includes(q) ||
      org.owner_name?.toLowerCase().includes(q) ||
      org.phone?.toLowerCase().includes(q) ||
      org.database_name?.toLowerCase().includes(q)

    const matchesStatus =
      orgStatusFilter === "all" ||
      (orgStatusFilter === "active" && (org.status || "Active") === "Active") ||
      (orgStatusFilter === "inactive" && org.status === "Inactive")

    return matchesSearch && matchesStatus
  })

  const activeOrgsCount = organizations.filter((o) => (o.status || "Active") === "Active").length
  const inactiveOrgsCount = organizations.filter((o) => o.status === "Inactive").length

  // Filtered Staff Users
  const filteredUsers = users.filter((u) => {
    const q = userSearchQuery.trim().toLowerCase()
    const matchesSearch =
      !q ||
      u.username?.toLowerCase().includes(q) ||
      u.display_name?.toLowerCase().includes(q) ||
      u.role?.toLowerCase().includes(q)

    const matchesStatus =
      userStatusFilter === "all" ||
      (userStatusFilter === "active" && (u.status || "Active") === "Active") ||
      (userStatusFilter === "inactive" && u.status === "Inactive")

    return matchesSearch && matchesStatus
  })

  const activeUsersCount = users.filter((u) => (u.status || "Active") === "Active").length
  const inactiveUsersCount = users.filter((u) => u.status === "Inactive").length

  return (
    <main className="min-h-screen bg-background text-foreground pb-24">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-6 md:px-8 md:py-8">

        {/* ========================================================================= */}
        {/* EXECUTIVE SUPER ADMIN HEADER                                              */}
        {/* ========================================================================= */}
        <header className="flex flex-col gap-4 rounded-3xl bg-card p-5 md:p-6 shadow-sm ring-1 ring-border/70 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="relative flex h-13 w-13 items-center justify-center rounded-2xl bg-gradient-to-tr from-primary to-blue-600 text-white shadow-md shadow-primary/25 ring-2 ring-primary/20">
              <Shield className="h-7 w-7" />
              <span className="absolute -bottom-1 -right-1 flex h-4.5 w-4.5 items-center justify-center rounded-full bg-emerald-500 text-[9px] font-black text-white shadow-xs">
                ✓
              </span>
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl font-black tracking-tight text-foreground md:text-2xl">
                  DenimFlow Control Center
                </h1>
                <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-[11px] font-black text-primary ring-1 ring-primary/20">
                  {currentSuperAdminUser}
                </span>
                <span className="rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                  Master Authority
                </span>
              </div>
              <p className="mt-1 text-xs text-muted-foreground font-medium">
                Super Admin Multi-Organization Cloud, Dropdown Master &amp; Database Backups
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Link
              href="/"
              className="flex items-center gap-1.5 rounded-xl bg-secondary px-3.5 py-2 text-xs font-bold text-secondary-foreground ring-1 ring-border/80 transition-all hover:bg-muted active:scale-95"
              title="Open staff/factory dashboard"
            >
              <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
              <span>Factory Dashboard</span>
            </Link>

            <a
              href="/api/super-admin/backup"
              download
              className="flex items-center gap-1.5 rounded-xl bg-primary/10 px-3.5 py-2 text-xs font-bold text-primary ring-1 ring-primary/30 transition-all hover:bg-primary/20 active:scale-95"
              title="Download entire factory database archive"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Export Backup</span>
            </a>

            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 rounded-xl bg-red-500/10 px-3.5 py-2 text-xs font-bold text-red-600 dark:text-red-400 ring-1 ring-red-500/20 transition-all hover:bg-red-500/20 active:scale-95"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span>Logout</span>
            </button>
          </div>
        </header>

        {/* Global Feedback Banner */}
        {feedback && (
          <div
            className={`flex items-center gap-2.5 rounded-2xl p-4 text-xs font-bold ring-1 animate-in fade-in duration-200 ${feedback.type === "success"
                ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 ring-emerald-500/30"
                : "bg-red-500/10 text-red-700 dark:text-red-300 ring-red-500/30"
              }`}
          >
            {feedback.type === "success" ? (
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
            ) : (
              <AlertCircle className="h-4 w-4 shrink-0 text-red-600 dark:text-red-400" />
            )}
            <span>{feedback.message}</span>
          </div>
        )}

        {/* ========================================================================= */}
        {/* QUICK METRICS OVERVIEW STRIP                                              */}
        {/* ========================================================================= */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="flex flex-col gap-1 rounded-2xl bg-card p-3.5 shadow-xs ring-1 ring-border/70">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Dashboard Modules
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-xl font-black text-foreground">{showingCount} / 12</span>
              <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                Active
              </span>
            </div>
            <span className="text-[10px] text-muted-foreground">Controlled via Show/Hide</span>
          </div>

          <div className="flex flex-col gap-1 rounded-2xl bg-card p-3.5 shadow-xs ring-1 ring-border/70">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Dropdown Categories
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-xl font-black text-foreground">
                {Object.keys(settings.dropdown_categories || {}).length}
              </span>
              <span className="text-[11px] font-semibold text-primary">Master Lists</span>
            </div>
            <span className="text-[10px] text-muted-foreground">Fully customizable</span>
          </div>

          <div className="flex flex-col gap-1 rounded-2xl bg-card p-3.5 shadow-xs ring-1 ring-border/70">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Staff Accounts
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-xl font-black text-foreground">{users.length}</span>
              <span className="text-[11px] font-semibold text-muted-foreground">Operators &amp; Staff</span>
            </div>
            <span className="text-[10px] text-muted-foreground">Active security roles</span>
          </div>

          <div className="flex flex-col gap-1 rounded-2xl bg-card p-3.5 shadow-xs ring-1 ring-border/70">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Database Records
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-xl font-black text-foreground">{stats.total_records || 0}</span>
              <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-600">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Live Atlas
              </span>
            </div>
            <span className="text-[10px] text-muted-foreground">15 MongoDB collections</span>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* SEGMENTED PORTAL NAVIGATION TABS                                         */}
        {/* ========================================================================= */}
        <div className="flex overflow-x-auto gap-1 rounded-2xl bg-muted/80 p-1.5 ring-1 ring-border/70 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <button
            onClick={() => setActiveTab("organizations")}
            className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold whitespace-nowrap transition-all ${activeTab === "organizations"
                ? "bg-card text-foreground shadow-sm ring-1 ring-border/60"
                : "text-muted-foreground hover:text-foreground"
              }`}
          >
            <Building2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            <span>🏢 Organizations Control ({organizations.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("visibility")}
            className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold whitespace-nowrap transition-all ${activeTab === "visibility"
                ? "bg-card text-foreground shadow-sm ring-1 ring-border/60"
                : "text-muted-foreground hover:text-foreground"
              }`}
          >
            <Sliders className="h-4 w-4 text-primary" />
            <span>Dynamic Modules (Show / Hide)</span>
          </button>

          <button
            onClick={() => setActiveTab("dropdowns")}
            className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold whitespace-nowrap transition-all ${activeTab === "dropdowns"
                ? "bg-card text-foreground shadow-sm ring-1 ring-border/60"
                : "text-muted-foreground hover:text-foreground"
              }`}
          >
            <Tags className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
            <span>Dropdown Master</span>
          </button>

          <button
            onClick={() => setActiveTab("profile")}
            className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold whitespace-nowrap transition-all ${activeTab === "profile"
                ? "bg-card text-foreground shadow-sm ring-1 ring-border/60"
                : "text-muted-foreground hover:text-foreground"
              }`}
          >
            <Building2 className="h-4 w-4 text-blue-600" />
            <span>Factory Profile &amp; Rates</span>
          </button>

          <button
            onClick={() => setActiveTab("users")}
            className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold whitespace-nowrap transition-all ${activeTab === "users"
                ? "bg-card text-foreground shadow-sm ring-1 ring-border/60"
                : "text-muted-foreground hover:text-foreground"
              }`}
          >
            <Users className="h-4 w-4 text-amber-600" />
            <span>Staff Accounts</span>
          </button>

          <button
            onClick={() => setActiveTab("backup")}
            className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold whitespace-nowrap transition-all ${activeTab === "backup"
                ? "bg-card text-foreground shadow-sm ring-1 ring-border/60"
                : "text-muted-foreground hover:text-foreground"
              }`}
          >
            <Database className="h-4 w-4 text-emerald-600" />
            <span>Backup &amp; Restore</span>
          </button>

          <button
            onClick={() => setActiveTab("stats")}
            className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold whitespace-nowrap transition-all ${activeTab === "stats"
                ? "bg-card text-foreground shadow-sm ring-1 ring-border/60"
                : "text-muted-foreground hover:text-foreground"
              }`}
          >
            <Layers className="h-4 w-4 text-purple-600" />
            <span>Live DB Health</span>
          </button>
        </div>

        {/* ========================================================================= */}
        {/* TAB 0: MULTI-ORGANIZATION CONTROL PLANE                                  */}
        {/* ========================================================================= */}
        {activeTab === "organizations" && (
          <div className="flex flex-col gap-6">
            {/* Header Banner */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-600 via-teal-700 to-slate-900 p-6 text-white shadow-xl">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <div className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1 text-[10px] font-black uppercase tracking-wider">
                    <Building2 className="h-3 w-3" />
                    <span>Multi-Tenant Architecture</span>
                  </div>
                  <h3 className="text-xl sm:text-2xl font-black tracking-tight mt-2">
                    Organizations &amp; Client Factories
                  </h3>
                  <p className="text-xs text-white/80 mt-1 max-w-xl">
                    Each organization has an isolated physical database on MongoDB Atlas with independent fabric inventory, cutting entries, hisabs, and staff settings.
                  </p>
                  <div className="flex items-center gap-3 mt-3 text-xs font-bold text-white/90">
                    <span className="flex items-center gap-1.5 bg-black/20 px-2.5 py-1 rounded-xl">
                      <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                      Active: {activeOrgsCount}
                    </span>
                    <span className="flex items-center gap-1.5 bg-black/20 px-2.5 py-1 rounded-xl">
                      <span className="h-2 w-2 rounded-full bg-rose-400" />
                      Deactivated: {inactiveOrgsCount}
                    </span>
                    <span className="bg-black/20 px-2.5 py-1 rounded-xl">
                      Total: {organizations.length}
                    </span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => loadData()}
                    className="flex items-center gap-1.5 rounded-2xl bg-white/10 px-3.5 py-2.5 text-xs font-bold text-white hover:bg-white/20 active:scale-95 transition-all"
                    title="Reload live database metrics"
                  >
                    <RefreshCw className="h-3.5 w-3.5" />
                    <span>Refresh</span>
                  </button>
                  <button
                    onClick={() => setIsCreateOrgModalOpen(true)}
                    className="flex items-center gap-2 rounded-2xl bg-white px-4 py-2.5 text-xs font-black text-emerald-950 shadow-md hover:bg-white/95 active:scale-95 transition-all shrink-0"
                  >
                    <Plus className="h-4 w-4 text-emerald-700" />
                    <span>+ Create New Organization</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Advanced Search & Status Filter Toolbar */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 rounded-2xl bg-card p-3 shadow-xs ring-1 ring-border/70">
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  value={orgSearchQuery}
                  onChange={(e) => setOrgSearchQuery(e.target.value)}
                  placeholder="Search organizations by name, slug, owner, phone, database..."
                  className="w-full rounded-xl bg-secondary/60 pl-10 pr-9 py-2 text-xs text-foreground placeholder:text-muted-foreground ring-1 ring-border/50 focus:ring-2 focus:ring-primary focus:outline-hidden"
                />
                {orgSearchQuery && (
                  <button
                    onClick={() => setOrgSearchQuery("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-0.5"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>

              <div className="flex items-center gap-1 bg-muted/60 p-1 rounded-xl shrink-0">
                <button
                  type="button"
                  onClick={() => setOrgStatusFilter("all")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${orgStatusFilter === "all"
                      ? "bg-card text-foreground shadow-xs"
                      : "text-muted-foreground hover:text-foreground"
                    }`}
                >
                  All ({organizations.length})
                </button>
                <button
                  type="button"
                  onClick={() => setOrgStatusFilter("active")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${orgStatusFilter === "active"
                      ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 shadow-xs"
                      : "text-muted-foreground hover:text-foreground"
                    }`}
                >
                  Active ({activeOrgsCount})
                </button>
                <button
                  type="button"
                  onClick={() => setOrgStatusFilter("inactive")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${orgStatusFilter === "inactive"
                      ? "bg-rose-500/15 text-rose-700 dark:text-rose-400 shadow-xs"
                      : "text-muted-foreground hover:text-foreground"
                    }`}
                >
                  Deactivated ({inactiveOrgsCount})
                </button>
              </div>
            </div>

            {/* Empty State */}
            {filteredOrganizations.length === 0 && (
              <div className="flex flex-col items-center justify-center p-12 text-center rounded-3xl bg-card ring-1 ring-border/70">
                <Building2 className="h-10 w-10 text-muted-foreground/40 mb-3" />
                <h4 className="text-sm font-bold text-foreground">No organizations match your filter</h4>
                <p className="text-xs text-muted-foreground mt-1 max-w-sm">
                  {orgSearchQuery
                    ? `No organizations found matching "${orgSearchQuery}". Try clearing your search.`
                    : "No organizations found for the selected status filter."}
                </p>
                {(orgSearchQuery || orgStatusFilter !== "all") && (
                  <button
                    onClick={() => {
                      setOrgSearchQuery("")
                      setOrgStatusFilter("all")
                    }}
                    className="mt-4 rounded-xl bg-secondary px-4 py-2 text-xs font-bold text-secondary-foreground hover:bg-muted"
                  >
                    Reset Filters
                  </button>
                )}
              </div>
            )}

            {/* Organizations Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredOrganizations.map((org: any) => {
                const isActiveWorkspace = org.slug === activeOrgSlug
                const isOrgActive = (org.status || "Active") === "Active"
                const isRoot = org.slug === "rd-jeans-main"
                const ping = tenantPing[org.slug]
                const isToggling = togglingOrgSlug === org.slug

                return (
                  <div
                    key={org.slug}
                    className={`rounded-3xl bg-card p-5 ring-1 shadow-sm flex flex-col justify-between gap-4 transition-all ${!isOrgActive
                        ? "ring-rose-500/30 bg-rose-500/[0.02]"
                        : isActiveWorkspace
                          ? "ring-2 ring-primary"
                          : "ring-border/70 hover:ring-border"
                      }`}
                  >
                    <div>
                      {/* Card Header & Activation Toggle */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div
                            className={`flex h-12 w-12 items-center justify-center rounded-2xl font-black text-base ${!isOrgActive
                                ? "bg-rose-500/10 text-rose-600 dark:text-rose-400"
                                : isActiveWorkspace
                                  ? "bg-primary text-primary-foreground shadow-xs"
                                  : "bg-muted text-foreground"
                              }`}
                          >
                            {org.name.slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <h4 className="font-extrabold text-base text-foreground">{org.name}</h4>
                              {isActiveWorkspace && (
                                <span className="rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[9px] font-black text-emerald-600 dark:text-emerald-400 ring-1 ring-emerald-500/20">
                                  Current Workspace
                                </span>
                              )}
                              {isRoot && (
                                <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[9px] font-black text-primary ring-1 ring-primary/20">
                                  ROOT
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground font-medium mt-0.5">
                              Owner: {org.owner_name || "Akshay Gohel"} • {org.phone || "No phone"}
                            </p>
                          </div>
                        </div>

                        {/* Status Switcher Component */}
                        <div className="flex flex-col items-end gap-1 shrink-0">
                          <div className="flex items-center gap-2">
                            <span
                              className={`rounded-full px-2.5 py-0.5 text-[10px] font-black tracking-wide ${isOrgActive
                                  ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 ring-1 ring-emerald-500/30"
                                  : "bg-rose-500/15 text-rose-700 dark:text-rose-400 ring-1 ring-rose-500/30"
                                }`}
                            >
                              {isOrgActive ? "ACTIVE" : "DEACTIVATED"}
                            </span>

                            {/* 1-Click Status Toggle */}
                            {!isRoot ? (
                              <button
                                type="button"
                                disabled={isToggling}
                                onClick={() => handleToggleOrgStatus(org)}
                                className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full transition-colors duration-200 ease-in-out focus:outline-hidden disabled:opacity-50 ${isOrgActive ? "bg-emerald-600" : "bg-slate-300 dark:bg-slate-700"
                                  }`}
                                title={
                                  isOrgActive
                                    ? "Click to Deactivate this Organization (Suspends workspace access)"
                                    : "Click to Activate this Organization"
                                }
                              >
                                <span
                                  className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out mt-0.5 ${isOrgActive ? "translate-x-4.5" : "translate-x-0.5"
                                    }`}
                                />
                              </button>
                            ) : (
                              <span className="text-[10px] text-muted-foreground font-semibold" title="Root factory is always active">
                                🔒 Locked
                              </span>
                            )}
                          </div>
                          {isToggling && (
                            <span className="text-[9px] text-muted-foreground animate-pulse">Updating...</span>
                          )}
                        </div>
                      </div>

                      {/* Deactivation Banner Notice */}
                      {!isOrgActive && (
                        <div className="mt-3 flex items-center gap-2 rounded-xl bg-rose-500/10 p-2.5 text-xs text-rose-700 dark:text-rose-300 ring-1 ring-rose-500/20">
                          <AlertCircle className="h-4 w-4 shrink-0 text-rose-600 dark:text-rose-400" />
                          <span>
                            <strong>Organization Suspended:</strong> Factory staff and operators cannot log into or select this workspace until reactivated.
                          </span>
                        </div>
                      )}

                      {/* Database Info & Live Ping */}
                      <div className="mt-3 flex items-center justify-between rounded-xl bg-muted/40 px-3 py-2 text-[11px] font-mono text-muted-foreground ring-1 ring-border/50">
                        <span className="truncate mr-2 flex items-center gap-1.5 flex-wrap">
                          <span>DB: <strong className="text-foreground">{org.database_name}</strong></span>
                          {org.settings?.google_sheets_webhook_url ? (
                            <span className="rounded-md bg-emerald-500/10 px-1.5 py-0.2 text-[9px] font-bold text-emerald-600 dark:text-emerald-400">
                              Sheet Linked
                            </span>
                          ) : null}
                        </span>

                        <div className="flex items-center gap-2 shrink-0">
                          {ping ? (
                            <span
                              className={`flex items-center gap-1 text-[10px] font-bold ${ping.latency_ms >= 0
                                  ? "text-emerald-600 dark:text-emerald-400"
                                  : "text-rose-600 dark:text-rose-400"
                                }`}
                            >
                              {ping.latency_ms >= 0 ? (
                                <>
                                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                  <span>{ping.latency_ms}ms Live</span>
                                </>
                              ) : (
                                <span>Offline</span>
                              )}
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handlePingTenant(org.slug)}
                              className="flex items-center gap-1 text-[10px] font-bold text-primary hover:underline"
                              title="Test live database roundtrip latency"
                            >
                              <Activity className="h-3 w-3" />
                              <span>Ping DB</span>
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Live Stats Row */}
                      <div className="mt-3 grid grid-cols-4 gap-1.5 rounded-2xl bg-muted/30 p-2.5 text-center text-xs">
                        <div>
                          <p className="text-[9px] uppercase font-bold text-muted-foreground">Workers</p>
                          <p className="font-extrabold text-foreground mt-0.5">{org.stats?.totalEmployees || 0}</p>
                        </div>
                        <div>
                          <p className="text-[9px] uppercase font-bold text-muted-foreground">Lots</p>
                          <p className="font-extrabold text-foreground mt-0.5">{org.stats?.totalLots || 0}</p>
                        </div>
                        <div>
                          <p className="text-[9px] uppercase font-bold text-muted-foreground">Hisabs</p>
                          <p className="font-extrabold text-foreground mt-0.5">{org.stats?.totalHisabs || 0}</p>
                        </div>
                        <div>
                          <p className="text-[9px] uppercase font-bold text-muted-foreground">Rolls</p>
                          <p className="font-extrabold text-foreground mt-0.5">{org.stats?.totalRolls || 0}</p>
                        </div>
                      </div>
                    </div>

                    {/* Actions Toolbar */}
                    <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border/50 pt-3">
                      <div className="flex flex-wrap items-center gap-2">
                        {isActiveWorkspace ? (
                          <span className="text-xs font-extrabold text-emerald-600 flex items-center gap-1">
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            <span>Active Workspace</span>
                          </span>
                        ) : isOrgActive ? (
                          <button
                            onClick={() => handleSwitchOrgFromAdmin(org.slug)}
                            className="rounded-xl bg-primary px-3.5 py-1.5 text-xs font-bold text-primary-foreground shadow-xs hover:opacity-95 active:scale-95 transition-all"
                          >
                            Switch to this Org
                          </button>
                        ) : (
                          <button
                            onClick={() => handleToggleOrgStatus(org)}
                            className="rounded-xl bg-emerald-600/10 px-3 py-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-400 ring-1 ring-emerald-600/30 hover:bg-emerald-600/20 active:scale-95 transition-all"
                          >
                            Activate to Switch
                          </button>
                        )}

                        <button
                          onClick={() => handleOpenEditOrg(org)}
                          className="rounded-xl bg-card px-3 py-1.5 text-xs font-bold text-foreground ring-1 ring-border/70 hover:bg-muted active:scale-95 transition-all"
                        >
                          Customize &amp; Modules
                        </button>
                      </div>

                      <div className="flex items-center gap-1">
                        <a
                          href={`/api/organizations/${org.slug}/backup`}
                          download
                          className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-bold text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                          title="Download tenant database JSON archive"
                        >
                          <Download className="h-3.5 w-3.5" />
                          <span className="hidden sm:inline">Backup</span>
                        </a>

                        {!isRoot && (
                          <button
                            onClick={() => handleDeleteOrg(org)}
                            className="rounded-lg p-1.5 text-muted-foreground hover:bg-red-50 hover:text-red-600 transition-colors"
                            title="Delete Organization and drop database"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 1: DYNAMIC MODULES (SHOW / HIDE CONTROLS)                             */}
        {/* ========================================================================= */}
        {activeTab === "visibility" && (
          <div className="flex flex-col gap-6">

            {/* 12 Quick Access Modules Section */}
            <div className="flex flex-col gap-4 rounded-3xl bg-card p-6 shadow-sm ring-1 ring-border/70">
              <div className="flex flex-col gap-1 border-b border-border/60 pb-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-base font-black text-foreground flex items-center gap-2">
                    <Sliders className="h-5 w-5 text-primary" />
                    <span>User Dashboard Quick Access Modules (12 Modules)</span>
                  </h2>
                  <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
                    {showingCount} of 12 Showing
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Flip any switch below to instantly show or hide that module on the main staff dashboard.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
                {MODULES_LIST.map((mod) => {
                  const isShowing = settings.module_visibility?.[mod.key] ?? true
                  const Icon = mod.icon

                  return (
                    <div
                      key={mod.key}
                      className={`flex flex-col justify-between gap-3 rounded-2xl p-4 transition-all duration-200 ring-1 ${isShowing
                          ? "bg-card shadow-xs ring-border/80"
                          : "bg-muted/40 opacity-60 ring-border/40"
                        }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${mod.iconBg}`}>
                            <Icon className={`h-5 w-5 ${mod.iconColor}`} />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="text-xs font-extrabold text-foreground">{mod.name}</h3>
                              <span
                                className={`rounded-full px-2 py-0.5 text-[9px] font-black tracking-wide ${isShowing
                                    ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400"
                                    : "bg-muted text-muted-foreground"
                                  }`}
                              >
                                {isShowing ? "SHOWING" : "HIDDEN"}
                              </span>
                            </div>
                            <p className="mt-0.5 text-[11px] text-muted-foreground leading-snug">
                              {mod.desc}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between border-t border-border/60 pt-3">
                        <span className="text-[10px] font-mono text-muted-foreground">
                          route: /{mod.key.replace("_", "-")}
                        </span>

                        {/* iOS-Style Toggle Switch */}
                        <button
                          type="button"
                          onClick={() => handleToggleModuleVisibility(mod.key)}
                          className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full transition-colors duration-200 ease-in-out focus:outline-hidden ${isShowing ? "bg-emerald-600" : "bg-slate-300 dark:bg-slate-700"
                            }`}
                          aria-label={`Toggle ${mod.name}`}
                        >
                          <span
                            className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition duration-200 ease-in-out ${isShowing ? "translate-x-5" : "translate-x-0.5"
                              } mt-0.5`}
                          />
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Operational Safeguards Section */}
            <div className="flex flex-col gap-4 rounded-3xl bg-card p-6 shadow-sm ring-1 ring-border/70">
              <div className="border-b border-border/60 pb-3">
                <h3 className="text-sm font-black text-foreground flex items-center gap-2">
                  <Shield className="h-4 w-4 text-indigo-600" />
                  <span>Factory Operational Automation &amp; Safeguards</span>
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Automate production balance rules and lock records from unauthorized actions.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {[
                  {
                    key: "allow_sheets_sync_button",
                    label: "Display Sheets Sync in Header",
                    desc: "Shows the Google Sheets live sync pill button on the user header"
                  },
                  {
                    key: "allow_upad_advances",
                    label: "Allow Upad Advances Issuance",
                    desc: "Permits cash advances to be recorded on the floor"
                  },
                  {
                    key: "allow_delete_records",
                    label: "Allow Staff to Delete Records",
                    desc: "When off, regular users cannot delete cutting entries or rolls"
                  },
                  {
                    key: "allow_export_excel",
                    label: "Allow Excel & CSV Downloads",
                    desc: "Allows staff to export factory data spreadsheets"
                  }
                ].map((op) => {
                  const enabled = settings.operations?.[op.key] ?? true
                  return (
                    <div
                      key={op.key}
                      className="flex items-center justify-between rounded-2xl bg-secondary/40 p-4 ring-1 ring-border/60"
                    >
                      <div className="pr-4">
                        <p className="text-xs font-bold text-foreground">{op.label}</p>
                        <p className="text-[11px] text-muted-foreground mt-0.5">{op.desc}</p>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleToggleOperation(op.key)}
                        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full transition-colors duration-200 ease-in-out focus:outline-hidden ${enabled ? "bg-emerald-600" : "bg-slate-300 dark:bg-slate-700"
                          }`}
                      >
                        <span
                          className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition duration-200 ease-in-out ${enabled ? "translate-x-5" : "translate-x-0.5"
                            } mt-0.5`}
                        />
                      </button>
                    </div>
                  )
                })}
              </div>
            </div>

          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 2: DROPDOWN MASTER (MANAGE ALL SYSTEM DROPDOWNS)                       */}
        {/* ========================================================================= */}
        {activeTab === "dropdowns" && (
          <div className="flex flex-col gap-6 rounded-3xl bg-card p-6 shadow-sm ring-1 ring-border/70">
            <div className="flex flex-col gap-3 border-b border-border/60 pb-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-base font-black text-foreground flex items-center gap-2">
                  <Tags className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                  <span>Dropdown Master Customization</span>
                </h2>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Add, edit, rename, or delete dropdown options across the entire factory system.
                </p>
              </div>

              <button
                onClick={() => setIsNewCategoryModalOpen(true)}
                className="flex items-center gap-1.5 rounded-xl bg-primary px-3.5 py-2 text-xs font-bold text-primary-foreground shadow-sm hover:opacity-90 active:scale-95 transition-all"
              >
                <Plus className="h-4 w-4" />
                <span>Add Custom Category</span>
              </button>
            </div>

            {/* Category Selector Pills */}
            <div className="flex flex-wrap gap-2">
              {Object.entries(settings.dropdown_categories || {}).map(([catKey, cat]: [string, any]) => {
                const Icon = getCategoryIcon(catKey)
                const isSelected = selectedCategoryKey === catKey

                return (
                  <button
                    key={catKey}
                    onClick={() => {
                      setSelectedCategoryKey(catKey)
                      setEditingItemOld(null)
                      setEditingItemNew("")
                      setNewDropdownItem("")
                    }}
                    className={`flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-bold transition-all ring-1 ${isSelected
                        ? "bg-primary text-primary-foreground ring-primary shadow-sm"
                        : "bg-card text-foreground ring-border/80 hover:bg-muted"
                      }`}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    <span>{cat.label || catKey}</span>
                    <span
                      className={`rounded-full px-2 py-0.2 text-[10px] font-mono font-bold ${isSelected ? "bg-white/20 text-white" : "bg-muted text-muted-foreground"
                        }`}
                    >
                      {(cat.items || []).length}
                    </span>
                  </button>
                )
              })}
            </div>

            {/* Active Category Content Box */}
            <div className="flex flex-col gap-4 rounded-2xl bg-secondary/30 p-5 ring-1 ring-border/60">
              <div className="flex items-center justify-between border-b border-border/60 pb-3">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-extrabold text-foreground">
                    Managing: <span className="text-primary">{activeCategory.label}</span>
                  </h3>
                  <span className="rounded-full bg-secondary px-2.5 py-0.5 text-[10px] font-mono text-muted-foreground">
                    key: {selectedCategoryKey}
                  </span>
                </div>

                {selectedCategoryKey !== "fabric_types" &&
                  selectedCategoryKey !== "expense_categories" &&
                  selectedCategoryKey !== "income_sources" &&
                  selectedCategoryKey !== "employee_roles" &&
                  selectedCategoryKey !== "payment_methods" && (
                    <button
                      onClick={() => handleDeleteCategory(selectedCategoryKey)}
                      className="text-xs font-bold text-red-600 hover:underline"
                    >
                      Delete This Entire Category
                    </button>
                  )}
              </div>

              {/* Add New Item Input */}
              <form onSubmit={handleSaveDropdownItem} className="flex gap-2">
                <input
                  type="text"
                  value={newDropdownItem}
                  onChange={(e) => setNewDropdownItem(e.target.value)}
                  placeholder={`Add new item to "${activeCategory.label}"...`}
                  className="flex-1 rounded-xl border-0 bg-background px-4 py-2.5 text-xs text-foreground placeholder:text-muted-foreground ring-1 ring-border focus:ring-2 focus:ring-primary focus:outline-hidden"
                />
                <button
                  type="submit"
                  disabled={!newDropdownItem.trim()}
                  className="flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2.5 text-xs font-bold text-primary-foreground shadow-sm hover:opacity-90 active:scale-95 disabled:opacity-40"
                >
                  <Plus className="h-4 w-4" />
                  <span>Add Item</span>
                </button>
              </form>

              {/* List of Items Grid */}
              <div className="flex flex-col gap-2 pt-2">
                <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                  Active Items in Category ({(activeCategory.items || []).length})
                </span>

                <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 md:grid-cols-3">
                  {(activeCategory.items || []).map((item: string) => {
                    const isEditing = editingItemOld === item

                    if (isEditing) {
                      return (
                        <div
                          key={item}
                          className="flex items-center gap-1 rounded-xl bg-card p-2 shadow-xs ring-2 ring-primary"
                        >
                          <input
                            type="text"
                            autoFocus
                            value={editingItemNew}
                            onChange={(e) => setEditingItemNew(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") handleSaveDropdownItem()
                              if (e.key === "Escape") setEditingItemOld(null)
                            }}
                            className="flex-1 rounded-lg bg-secondary/80 px-2 py-1 text-xs text-foreground focus:outline-hidden"
                          />
                          <button
                            type="button"
                            onClick={() => handleSaveDropdownItem()}
                            className="rounded-lg bg-emerald-600 p-1.5 text-white hover:bg-emerald-700"
                            title="Save Rename"
                          >
                            <Check className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingItemOld(null)}
                            className="rounded-lg bg-secondary p-1.5 text-muted-foreground hover:text-foreground"
                            title="Cancel"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      )
                    }

                    return (
                      <div
                        key={item}
                        className="flex items-center justify-between rounded-xl bg-card p-2.5 shadow-2xs ring-1 ring-border/70 hover:shadow-xs transition-all"
                      >
                        <span className="text-xs font-semibold text-foreground truncate pr-2">
                          {item}
                        </span>

                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingItemOld(item)
                              setEditingItemNew(item)
                            }}
                            className="rounded-lg p-1 text-muted-foreground hover:bg-muted hover:text-primary transition-colors"
                            title="Rename"
                          >
                            <Edit2 className="h-3 w-3" />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDeleteDropdownItem(item)}
                            className="rounded-lg p-1 text-muted-foreground hover:bg-red-500/10 hover:text-red-600 transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 3: FACTORY PROFILE & BILLING RATES                                    */}
        {/* ========================================================================= */}
        {activeTab === "profile" && (
          <form
            onSubmit={handleSaveProfile}
            className="flex flex-col gap-6 rounded-3xl bg-card p-6 shadow-sm ring-1 ring-border/70"
          >
            <div className="flex items-center justify-between border-b border-border/60 pb-3">
              <div>
                <h2 className="text-base font-black text-foreground flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-blue-600" />
                  <span>Factory Profile &amp; Default Jobwork Rates</span>
                </h2>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Configure company billing identity and default rates for Seth Hisab slips.
                </p>
              </div>

              <button
                type="submit"
                className="flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2.5 text-xs font-bold text-primary-foreground shadow-sm hover:opacity-90 active:scale-95 transition-all"
              >
                <Save className="h-4 w-4" />
                <span>Save Factory Profile</span>
              </button>
            </div>

            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">

              {/* Factory Info Card */}
              <div className="flex flex-col gap-4 rounded-2xl bg-secondary/30 p-5 ring-1 ring-border/60">
                <h3 className="text-xs font-black uppercase tracking-wider text-primary">
                  Factory Business Identity
                </h3>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-muted-foreground">Company / Factory Name</label>
                  <input
                    type="text"
                    required
                    value={settings.company_name || ""}
                    onChange={(e) => setSettings({ ...settings, company_name: e.target.value })}
                    className="rounded-xl border-0 bg-background px-4 py-2.5 text-xs text-foreground ring-1 ring-border focus:ring-2 focus:ring-primary focus:outline-hidden"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-muted-foreground">Owner / Manager Name</label>
                  <input
                    type="text"
                    required
                    value={settings.owner_name || ""}
                    onChange={(e) => setSettings({ ...settings, owner_name: e.target.value })}
                    className="rounded-xl border-0 bg-background px-4 py-2.5 text-xs text-foreground ring-1 ring-border focus:ring-2 focus:ring-primary focus:outline-hidden"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-muted-foreground">Factory Phone / WhatsApp</label>
                  <input
                    type="text"
                    value={settings.phone || ""}
                    onChange={(e) => setSettings({ ...settings, phone: e.target.value })}
                    placeholder="+91 98765 43210"
                    className="rounded-xl border-0 bg-background px-4 py-2.5 text-xs text-foreground ring-1 ring-border focus:ring-2 focus:ring-primary focus:outline-hidden"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-muted-foreground">Factory Location / Address</label>
                  <textarea
                    rows={2}
                    value={settings.address || ""}
                    onChange={(e) => setSettings({ ...settings, address: e.target.value })}
                    className="rounded-xl border-0 bg-background px-4 py-2.5 text-xs text-foreground ring-1 ring-border focus:ring-2 focus:ring-primary focus:outline-hidden resize-none"
                  />
                </div>
              </div>

              {/* Operational Rates Card */}
              <div className="flex flex-col gap-4 rounded-2xl bg-secondary/30 p-5 ring-1 ring-border/60">
                <h3 className="text-xs font-black uppercase tracking-wider text-primary">
                  Default Jobwork Billing Rates
                </h3>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-muted-foreground">
                    Default Stitching Rate (₹ per piece)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-2.5 text-xs font-bold text-muted-foreground">
                      ₹
                    </span>
                    <input
                      type="number"
                      step="0.5"
                      required
                      value={settings.default_stitching_rate ?? 50}
                      onChange={(e) =>
                        setSettings({ ...settings, default_stitching_rate: parseFloat(e.target.value) })
                      }
                      className="w-full rounded-xl border-0 bg-background pl-8 pr-4 py-2.5 text-xs text-foreground ring-1 ring-border focus:ring-2 focus:ring-primary focus:outline-hidden"
                    />
                  </div>
                  <span className="text-[10px] text-muted-foreground">
                    Auto-fills in new Hisab Seth calculation slips.
                  </span>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-muted-foreground">
                    Default Washing Rate (₹ per piece)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-2.5 text-xs font-bold text-muted-foreground">
                      ₹
                    </span>
                    <input
                      type="number"
                      step="0.5"
                      required
                      value={settings.default_washing_rate ?? 5}
                      onChange={(e) =>
                        setSettings({ ...settings, default_washing_rate: parseFloat(e.target.value) })
                      }
                      className="w-full rounded-xl border-0 bg-background pl-8 pr-4 py-2.5 text-xs text-foreground ring-1 ring-border focus:ring-2 focus:ring-primary focus:outline-hidden"
                    />
                  </div>
                  <span className="text-[10px] text-muted-foreground">
                    Standard laundry / wash extra charges.
                  </span>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-muted-foreground">
                    Standard Shift Working Hours
                  </label>
                  <input
                    type="number"
                    value={settings.shift_hours ?? 10}
                    onChange={(e) =>
                      setSettings({ ...settings, shift_hours: parseInt(e.target.value) || 10 })
                    }
                    className="rounded-xl border-0 bg-background px-4 py-2.5 text-xs text-foreground ring-1 ring-border focus:ring-2 focus:ring-primary focus:outline-hidden"
                  />
                  <span className="text-[10px] text-muted-foreground">
                    Used for operator productivity calculations.
                  </span>
                </div>
              </div>

            </div>
          </form>
        )}

        {/* ========================================================================= */}
        {/* TAB 4: STAFF ACCOUNTS & MASTER PASSWORD                                   */}
        {/* ========================================================================= */}
        {activeTab === "users" && (
          <div className="flex flex-col gap-6">

            {/* Master Super Admin Password Change */}
            <div className="flex flex-col gap-4 rounded-3xl bg-card p-6 shadow-sm ring-1 ring-border/70">
              <div className="border-b border-border/60 pb-3">
                <h2 className="text-base font-black text-foreground flex items-center gap-2">
                  <KeyRound className="h-5 w-5 text-indigo-600" />
                  <span>Update Super Admin Master Password ({currentSuperAdminUser})</span>
                </h2>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Update your confidential password. It will be encrypted with bcrypt in MongoDB.
                </p>
              </div>

              <form onSubmit={handleUpdateSuperAdminPassword} className="flex flex-col sm:flex-row gap-3">
                <input
                  type="password"
                  required
                  value={superAdminNewPass}
                  onChange={(e) => setSuperAdminNewPass(e.target.value)}
                  placeholder="Enter new Super Admin password..."
                  className="flex-1 rounded-xl border-0 bg-secondary/80 px-4 py-2.5 text-xs text-foreground placeholder:text-muted-foreground ring-1 ring-border focus:ring-2 focus:ring-primary focus:outline-hidden"
                />
                <button
                  type="submit"
                  disabled={isUpdatingSuperPass || !superAdminNewPass.trim()}
                  className="flex items-center justify-center gap-1.5 rounded-xl bg-primary px-5 py-2.5 text-xs font-bold text-primary-foreground shadow-sm hover:opacity-90 active:scale-95 disabled:opacity-40"
                >
                  <Lock className="h-3.5 w-3.5" />
                  <span>{isUpdatingSuperPass ? "Updating..." : "Update Master Password"}</span>
                </button>
              </form>
            </div>

            {/* Staff Accounts Management */}
            <div className="flex flex-col gap-4 rounded-3xl bg-card p-6 shadow-sm ring-1 ring-border/70">
              <div className="flex flex-col gap-3 border-b border-border/60 pb-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-black text-foreground flex items-center gap-2">
                      <Users className="h-4 w-4 text-amber-600" />
                      <span>Staff Team Accounts &amp; Access Controls</span>
                    </h3>
                    <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-black text-emerald-700 dark:text-emerald-400">
                      {activeUsersCount} Active
                    </span>
                    {inactiveUsersCount > 0 && (
                      <span className="rounded-full bg-rose-500/15 px-2 py-0.5 text-[10px] font-black text-rose-700 dark:text-rose-400">
                        {inactiveUsersCount} Deactivated
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Create and manage staff accounts for cutting masters, managers, cashiers, and floor operators. 1-click toggle to suspend access.
                  </p>
                </div>

                <button
                  onClick={() => {
                    setUserModalMode("create")
                    setUserForm({
                      username: "",
                      password: "",
                      display_name: "",
                      role: "Operator",
                      status: "Active"
                    })
                    setIsUserModalOpen(true)
                  }}
                  className="flex items-center gap-1.5 rounded-xl bg-primary px-3.5 py-2 text-xs font-bold text-primary-foreground shadow-sm hover:opacity-90 active:scale-95 shrink-0"
                >
                  <Plus className="h-4 w-4" />
                  <span>Create Staff Account</span>
                </button>
              </div>

              {/* Staff Search & Filter Toolbar */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input
                    type="text"
                    value={userSearchQuery}
                    onChange={(e) => setUserSearchQuery(e.target.value)}
                    placeholder="Search staff by username, name, or role..."
                    className="w-full rounded-xl bg-secondary/60 pl-10 pr-9 py-2 text-xs text-foreground placeholder:text-muted-foreground ring-1 ring-border/50 focus:ring-2 focus:ring-primary focus:outline-hidden"
                  />
                  {userSearchQuery && (
                    <button
                      onClick={() => setUserSearchQuery("")}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-0.5"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-1 bg-muted/60 p-1 rounded-xl shrink-0">
                  <button
                    type="button"
                    onClick={() => setUserStatusFilter("all")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${userStatusFilter === "all"
                        ? "bg-card text-foreground shadow-xs"
                        : "text-muted-foreground hover:text-foreground"
                      }`}
                  >
                    All ({users.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setUserStatusFilter("active")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${userStatusFilter === "active"
                        ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 shadow-xs"
                        : "text-muted-foreground hover:text-foreground"
                      }`}
                  >
                    Active ({activeUsersCount})
                  </button>
                  <button
                    type="button"
                    onClick={() => setUserStatusFilter("inactive")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${userStatusFilter === "inactive"
                        ? "bg-rose-500/15 text-rose-700 dark:text-rose-400 shadow-xs"
                        : "text-muted-foreground hover:text-foreground"
                      }`}
                  >
                    Deactivated ({inactiveUsersCount})
                  </button>
                </div>
              </div>

              {/* Empty Search State */}
              {filteredUsers.length === 0 && (
                <div className="flex flex-col items-center justify-center p-8 text-center rounded-2xl bg-secondary/20 ring-1 ring-border/50">
                  <Users className="h-8 w-8 text-muted-foreground/40 mb-2" />
                  <p className="text-xs font-bold text-foreground">No staff accounts match your search</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">Try searching for a different username or reset filters.</p>
                  <button
                    onClick={() => {
                      setUserSearchQuery("")
                      setUserStatusFilter("all")
                    }}
                    className="mt-3 rounded-lg bg-secondary px-3 py-1 text-xs font-semibold text-muted-foreground hover:text-foreground"
                  >
                    Clear Filter
                  </button>
                </div>
              )}

              {/* Staff List Grid */}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3">
                {filteredUsers.map((u: any) => {
                  const isSuper = u.role === "SuperAdmin"
                  const isUserActive = (u.status || "Active") === "Active"
                  const userId = u.id || u._id
                  const isToggling = togglingUserId === userId

                  return (
                    <div
                      key={userId || u.username}
                      className={`flex flex-col justify-between gap-3 rounded-2xl p-4 ring-1 shadow-xs transition-all ${!isUserActive
                          ? "bg-rose-500/[0.03] ring-rose-500/30"
                          : "bg-secondary/30 ring-border/60 hover:ring-border"
                        }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-3 min-w-0">
                          <div
                            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-xs font-black ${!isUserActive
                                ? "bg-rose-500/10 text-rose-600 dark:text-rose-400"
                                : "bg-primary/10 text-primary"
                              }`}
                          >
                            {(u.display_name || u.username || "U").substring(0, 2).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <h4 className="text-xs font-bold text-foreground truncate">
                                {u.display_name || u.username}
                              </h4>
                              {isSuper && (
                                <span className="rounded-full bg-primary/20 px-1.5 py-0.2 text-[9px] font-black text-primary shrink-0">
                                  MASTER
                                </span>
                              )}
                            </div>
                            <p className="text-[10px] text-muted-foreground font-mono truncate">
                              @{u.username}
                            </p>
                          </div>
                        </div>

                        {/* Status Switcher & Badge */}
                        <div className="flex flex-col items-end gap-1 shrink-0">
                          <div className="flex items-center gap-1.5">
                            <span
                              className={`rounded-full px-2 py-0.5 text-[9px] font-black ${isUserActive
                                  ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400"
                                  : "bg-rose-500/15 text-rose-700 dark:text-rose-400"
                                }`}
                            >
                              {isUserActive ? "Active" : "Deactivated"}
                            </span>

                            {/* 1-Click User Activation Switch */}
                            {!isSuper && (
                              <button
                                type="button"
                                disabled={isToggling}
                                onClick={() => handleToggleUserStatus(u)}
                                className={`relative inline-flex h-4.5 w-8 shrink-0 cursor-pointer rounded-full transition-colors duration-200 ease-in-out focus:outline-hidden disabled:opacity-50 ${isUserActive ? "bg-emerald-600" : "bg-slate-300 dark:bg-slate-700"
                                  }`}
                                title={
                                  isUserActive
                                    ? "Click to Deactivate account (User will be immediately blocked from logging in)"
                                    : "Click to Activate account"
                                }
                              >
                                <span
                                  className={`pointer-events-none inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out mt-0.5 ${isUserActive ? "translate-x-4" : "translate-x-0.5"
                                    }`}
                                />
                              </button>
                            )}
                          </div>
                          {isToggling && (
                            <span className="text-[8px] text-muted-foreground animate-pulse">Saving...</span>
                          )}
                        </div>
                      </div>

                      {/* Warning notice if deactivated */}
                      {!isUserActive && (
                        <div className="rounded-lg bg-rose-500/10 px-2.5 py-1 text-[10px] font-semibold text-rose-700 dark:text-rose-300">
                          🔒 Login Access Blocked
                        </div>
                      )}

                      <div className="flex items-center justify-between border-t border-border/60 pt-2.5">
                        <span className="rounded-md bg-secondary px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
                          {u.role || "Operator"}
                        </span>

                        {!isSuper && (
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => {
                                setSelectedUser(u)
                                setUserModalMode("edit")
                                setUserForm({
                                  username: u.username,
                                  password: "",
                                  display_name: u.display_name || "",
                                  role: u.role || "Operator",
                                  status: u.status || "Active"
                                })
                                setIsUserModalOpen(true)
                              }}
                              className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
                              title="Edit user details or reset password"
                            >
                              <Edit2 className="h-3.5 w-3.5" />
                            </button>

                            <button
                              onClick={() => handleDeleteUser(userId, u.username)}
                              className="rounded-lg p-1.5 text-muted-foreground hover:bg-red-500/10 hover:text-red-600"
                              title="Delete user account"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 5: BACKUP & DISASTER RECOVERY                                         */}
        {/* ========================================================================= */}
        {activeTab === "backup" && (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">

            {/* Export Backup Card */}
            <div className="flex flex-col gap-4 rounded-3xl bg-card p-6 shadow-sm ring-1 ring-border/70">
              <div className="flex items-center gap-3 border-b border-border/60 pb-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600">
                  <Download className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-foreground">Export Full Database (.json)</h3>
                  <p className="text-xs text-muted-foreground">
                    Complete archive of all 15 MongoDB factory collections
                  </p>
                </div>
              </div>

              <p className="text-xs text-muted-foreground leading-relaxed">
                Download a clean JSON archive containing every cutting record, fabric roll, finished goods lot,
                worker advance, seth hisab, and cash book entry.
              </p>

              <div className="rounded-2xl bg-secondary/40 p-4 text-xs font-medium text-muted-foreground">
                <p className="font-bold text-foreground mb-1">Archived Collections:</p>
                <div className="grid grid-cols-2 gap-1 text-[11px] font-mono">
                  <span>• employees</span>
                  <span>• cutting_entries</span>
                  <span>• rolls</span>
                  <span>• finished_goods</span>
                  <span>• seths</span>
                  <span>• seth_hisabs</span>
                  <span>• upad_records</span>
                  <span>• cash_book_ledger</span>
                  <span>• incomes</span>
                  <span>• expenses</span>
                </div>
              </div>

              <a
                href="/api/super-admin/backup"
                download
                className="mt-auto flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 py-3 text-xs font-bold text-white shadow-sm hover:bg-emerald-700 active:scale-95 transition-all"
              >
                <Download className="h-4 w-4" />
                <span>Download Database JSON Backup</span>
              </a>
            </div>

            {/* Restore Backup Card */}
            <form
              onSubmit={handleRestoreDatabase}
              className="flex flex-col gap-4 rounded-3xl bg-card p-6 shadow-sm ring-1 ring-border/70"
            >
              <div className="flex items-center gap-3 border-b border-border/60 pb-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-500/10 text-red-600">
                  <Upload className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-foreground">Restore from JSON Archive</h3>
                  <p className="text-xs text-muted-foreground">
                    Disaster recovery from a previously exported backup file
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2.5 rounded-2xl bg-amber-500/10 p-3.5 text-xs text-amber-800 dark:text-amber-300 ring-1 ring-amber-500/20">
                <AlertCircle className="h-5 w-5 shrink-0 text-amber-600" />
                <span>
                  <strong>Safety Notice:</strong> Restoring will restore collection data from the uploaded file.
                </span>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-muted-foreground">Select Backup File (.json)</label>
                <input
                  type="file"
                  accept=".json,application/json"
                  onChange={(e) => setRestoreFile(e.target.files?.[0] || null)}
                  className="rounded-xl border-0 bg-secondary/80 p-2 text-xs text-foreground ring-1 ring-border file:mr-3 file:rounded-lg file:border-0 file:bg-primary file:px-3 file:py-1.5 file:text-xs file:font-bold file:text-primary-foreground"
                />
              </div>

              <button
                type="submit"
                disabled={!restoreFile || isRestoring}
                className="mt-auto flex items-center justify-center gap-2 rounded-2xl bg-red-600 py-3 text-xs font-bold text-white shadow-sm hover:bg-red-700 active:scale-95 transition-all disabled:opacity-40"
              >
                <Upload className="h-4 w-4" />
                <span>{isRestoring ? "Restoring Database..." : "Restore Database Now"}</span>
              </button>
            </form>

          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 6: LIVE SYSTEM & DATABASE HEALTH                                      */}
        {/* ========================================================================= */}
        {activeTab === "stats" && (
          <div className="flex flex-col gap-6 rounded-3xl bg-card p-6 shadow-sm ring-1 ring-border/70">
            <div className="flex flex-col gap-2 border-b border-border/60 pb-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-base font-black text-foreground flex items-center gap-2">
                  <Layers className="h-5 w-5 text-purple-600" />
                  <span>MongoDB Atlas Storage Health &amp; Document Counts</span>
                </h2>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Live verified counts across all production collections in MongoDB Atlas.
                </p>
              </div>

              <button
                onClick={loadData}
                className="flex items-center gap-1.5 rounded-xl bg-secondary px-3.5 py-2 text-xs font-bold text-foreground ring-1 ring-border/70 hover:bg-muted active:scale-95"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                <span>Refresh Counts</span>
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
              {Object.entries(stats.collections || {}).map(([colName, count]: [string, any]) => (
                <div
                  key={colName}
                  className="flex flex-col gap-1 rounded-2xl bg-secondary/30 p-3.5 ring-1 ring-border/60 shadow-2xs"
                >
                  <span className="text-[10px] font-mono text-muted-foreground truncate">{colName}</span>
                  <span className="text-lg font-black text-foreground">{count}</span>
                  <span className="text-[9px] text-emerald-600 dark:text-emerald-400 font-bold">
                    ✓ Connected
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>

      {/* ========================================================================= */}
      {/* MODAL: ADD CUSTOM DROPDOWN CATEGORY                                       */}
      {/* ========================================================================= */}
      {isNewCategoryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-3xl bg-card p-6 shadow-2xl ring-1 ring-border">
            <div className="flex items-center justify-between border-b border-border/60 pb-3">
              <h3 className="text-sm font-black text-foreground flex items-center gap-2">
                <Plus className="h-4 w-4 text-primary" />
                <span>Add Custom Dropdown Category</span>
              </h3>
              <button
                onClick={() => setIsNewCategoryModalOpen(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleCreateCategory} className="mt-4 flex flex-col gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-muted-foreground">Category Display Title</label>
                <input
                  type="text"
                  required
                  value={newCategoryLabel}
                  onChange={(e) => {
                    setNewCategoryLabel(e.target.value)
                    setNewCategoryKey(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, "_"))
                  }}
                  placeholder="e.g. Button Brands / Rivet Types"
                  className="rounded-xl border-0 bg-secondary/80 px-4 py-2.5 text-xs text-foreground ring-1 ring-border focus:ring-2 focus:ring-primary focus:outline-hidden"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-muted-foreground">Category Key (Slug)</label>
                <input
                  type="text"
                  required
                  value={newCategoryKey}
                  onChange={(e) => setNewCategoryKey(e.target.value)}
                  placeholder="e.g. button_brands"
                  className="rounded-xl border-0 bg-secondary/80 px-4 py-2.5 text-xs font-mono text-foreground ring-1 ring-border focus:ring-2 focus:ring-primary focus:outline-hidden"
                />
              </div>

              <div className="mt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsNewCategoryModalOpen(false)}
                  className="rounded-xl bg-secondary px-4 py-2 text-xs font-bold text-foreground hover:bg-muted"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-primary px-4 py-2 text-xs font-bold text-primary-foreground hover:opacity-90 shadow-sm"
                >
                  Create Category
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: CREATE / EDIT STAFF USER                                           */}
      {/* ========================================================================= */}
      {isUserModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-3xl bg-card p-6 shadow-2xl ring-1 ring-border">
            <div className="flex items-center justify-between border-b border-border/60 pb-3">
              <h3 className="text-sm font-black text-foreground">
                {userModalMode === "create" ? "Create Staff Account" : "Edit Staff Account"}
              </h3>
              <button
                onClick={() => setIsUserModalOpen(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSaveUser} className="mt-4 flex flex-col gap-3.5">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-muted-foreground">Username</label>
                <input
                  type="text"
                  required
                  disabled={userModalMode === "edit"}
                  value={userForm.username}
                  onChange={(e) => setUserForm({ ...userForm, username: e.target.value })}
                  placeholder="e.g. cutter_ramesh"
                  className="rounded-xl border-0 bg-secondary/80 px-4 py-2.5 text-xs text-foreground ring-1 ring-border focus:ring-2 focus:ring-primary focus:outline-hidden disabled:opacity-50"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-muted-foreground">Full Display Name</label>
                <input
                  type="text"
                  required
                  value={userForm.display_name}
                  onChange={(e) => setUserForm({ ...userForm, display_name: e.target.value })}
                  placeholder="e.g. Ramesh Master"
                  className="rounded-xl border-0 bg-secondary/80 px-4 py-2.5 text-xs text-foreground ring-1 ring-border focus:ring-2 focus:ring-primary focus:outline-hidden"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-muted-foreground">
                  {userModalMode === "create" ? "Initial Password" : "New Password (leave blank to keep)"}
                </label>
                <input
                  type="password"
                  required={userModalMode === "create"}
                  value={userForm.password}
                  onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                  placeholder="••••••••"
                  className="rounded-xl border-0 bg-secondary/80 px-4 py-2.5 text-xs text-foreground ring-1 ring-border focus:ring-2 focus:ring-primary focus:outline-hidden"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-muted-foreground">Access Role</label>
                <select
                  value={userForm.role}
                  onChange={(e) => setUserForm({ ...userForm, role: e.target.value })}
                  className="rounded-xl border-0 bg-secondary/80 px-4 py-2.5 text-xs text-foreground ring-1 ring-border focus:ring-2 focus:ring-primary focus:outline-hidden"
                >
                  <option value="Admin">Admin</option>
                  <option value="Manager">Manager</option>
                  <option value="Cashier">Cashier</option>
                  <option value="Operator">Operator</option>
                  <option value="Viewer">Viewer</option>
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-muted-foreground">Status</label>
                <select
                  value={userForm.status}
                  onChange={(e) => setUserForm({ ...userForm, status: e.target.value })}
                  className="rounded-xl border-0 bg-secondary/80 px-4 py-2.5 text-xs text-foreground ring-1 ring-border focus:ring-2 focus:ring-primary focus:outline-hidden"
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>

              <div className="mt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsUserModalOpen(false)}
                  className="rounded-xl bg-secondary px-4 py-2 text-xs font-bold text-foreground hover:bg-muted"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-primary px-4 py-2 text-xs font-bold text-primary-foreground hover:opacity-90 shadow-sm"
                >
                  Save Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: CREATE NEW ORGANIZATION                                           */}
      {/* ========================================================================= */}
      {isCreateOrgModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-3 sm:p-4 backdrop-blur-xs overflow-y-auto">
          <div className="relative w-full max-w-lg rounded-3xl bg-card p-6 shadow-2xl ring-1 ring-border flex flex-col gap-4 text-foreground max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Building2 className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-foreground">Create New Organization</h3>
                  <p className="text-xs text-muted-foreground">Creates a dedicated, isolated database on Atlas</p>
                </div>
              </div>
              <button
                onClick={() => setIsCreateOrgModalOpen(false)}
                className="rounded-full p-1.5 text-muted-foreground hover:bg-muted"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleCreateOrganization} className="flex flex-col gap-4 text-xs">
              <div className="flex flex-col gap-1">
                <label className="font-bold text-muted-foreground">Organization / Factory Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Shiv Denim Unit 2"
                  value={newOrgForm.name}
                  onChange={(e) => setNewOrgForm({ ...newOrgForm, name: e.target.value })}
                  className="rounded-xl bg-background px-3.5 py-2.5 text-xs text-foreground ring-1 ring-border focus:ring-2 focus:ring-primary"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="font-bold text-muted-foreground">URL Slug (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. shiv-denim"
                    value={newOrgForm.slug}
                    onChange={(e) => setNewOrgForm({ ...newOrgForm, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') })}
                    className="rounded-xl bg-background px-3.5 py-2.5 text-xs text-foreground ring-1 ring-border font-mono"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="font-bold text-muted-foreground">Owner / Manager Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Ramesh Patel"
                    value={newOrgForm.owner_name}
                    onChange={(e) => setNewOrgForm({ ...newOrgForm, owner_name: e.target.value })}
                    className="rounded-xl bg-background px-3.5 py-2.5 text-xs text-foreground ring-1 ring-border"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="font-bold text-muted-foreground">Phone / WhatsApp</label>
                  <input
                    type="text"
                    placeholder="+91 98765 43210"
                    value={newOrgForm.phone}
                    onChange={(e) => setNewOrgForm({ ...newOrgForm, phone: e.target.value })}
                    className="rounded-xl bg-background px-3.5 py-2.5 text-xs text-foreground ring-1 ring-border"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="font-bold text-muted-foreground">GSTIN (Optional)</label>
                  <input
                    type="text"
                    placeholder="24AAAAA0000A1Z5"
                    value={newOrgForm.gstin}
                    onChange={(e) => setNewOrgForm({ ...newOrgForm, gstin: e.target.value.toUpperCase() })}
                    className="rounded-xl bg-background px-3.5 py-2.5 text-xs text-foreground ring-1 ring-border uppercase"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="font-bold text-muted-foreground">Factory Location / Address</label>
                <textarea
                  rows={2}
                  placeholder="GIDC Katargam, Surat, Gujarat"
                  value={newOrgForm.address}
                  onChange={(e) => setNewOrgForm({ ...newOrgForm, address: e.target.value })}
                  className="rounded-xl bg-background px-3.5 py-2 text-xs text-foreground ring-1 ring-border resize-none"
                />
              </div>

              {/* Optional Initial Factory Manager Login */}
              <div className="flex flex-col gap-2 rounded-2xl bg-secondary/40 p-3 ring-1 ring-border/50">
                <div>
                  <h4 className="font-bold text-foreground text-xs">Initial Factory Manager Login (Optional)</h4>
                  <p className="text-[10px] text-muted-foreground">Provision the client factory manager login account immediately</p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1">
                    <label className="font-bold text-muted-foreground">Manager Username</label>
                    <input
                      type="text"
                      placeholder="e.g. shiv_manager"
                      value={newOrgForm.initial_username}
                      onChange={(e) => setNewOrgForm({ ...newOrgForm, initial_username: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '') })}
                      className="rounded-xl bg-background px-3 py-2 text-xs text-foreground ring-1 ring-border font-mono"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="font-bold text-muted-foreground">Initial Password</label>
                    <input
                      type="password"
                      placeholder="e.g. Shiv@123"
                      value={newOrgForm.initial_password}
                      onChange={(e) => setNewOrgForm({ ...newOrgForm, initial_password: e.target.value })}
                      className="rounded-xl bg-background px-3 py-2 text-xs text-foreground ring-1 ring-border"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 rounded-2xl bg-muted/40 p-3 ring-1 ring-border/50">
                <div className="flex flex-col gap-1">
                  <label className="font-bold text-foreground">Default Stitching Rate (₹/pc)</label>
                  <input
                    type="number"
                    step="0.5"
                    value={newOrgForm.default_stitching_rate}
                    onChange={(e) => setNewOrgForm({ ...newOrgForm, default_stitching_rate: Number(e.target.value) })}
                    className="rounded-xl bg-background px-3 py-2 text-xs font-bold text-foreground ring-1 ring-border"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="font-bold text-foreground">Default Washing Rate (₹/pc)</label>
                  <input
                    type="number"
                    step="0.5"
                    value={newOrgForm.default_washing_rate}
                    onChange={(e) => setNewOrgForm({ ...newOrgForm, default_washing_rate: Number(e.target.value) })}
                    className="rounded-xl bg-background px-3 py-2 text-xs font-bold text-foreground ring-1 ring-border"
                  />
                </div>
              </div>

              {/* Module Toggles for this Org */}
              <div className="flex flex-col gap-2">
                <label className="font-black text-foreground uppercase tracking-wider text-[10px]">
                  Enabled Modules for this Organization (12 Modules)
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {Object.entries(newOrgForm.modules).map(([modKey, isEnabled]) => (
                    <label
                      key={modKey}
                      className={`flex items-center gap-2 p-2 rounded-xl border text-[11px] font-bold cursor-pointer transition-all ${isEnabled
                          ? "bg-primary/10 border-primary/40 text-foreground"
                          : "bg-muted/30 border-border text-muted-foreground"
                        }`}
                    >
                      <input
                        type="checkbox"
                        checked={isEnabled}
                        onChange={(e) =>
                          setNewOrgForm({
                            ...newOrgForm,
                            modules: {
                              ...newOrgForm.modules,
                              [modKey]: e.target.checked,
                            },
                          })
                        }
                        className="rounded text-primary focus:ring-primary h-3.5 w-3.5"
                      />
                      <span className="capitalize">{modKey.replace(/_/g, " ")}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 border-t border-border pt-3 mt-1">
                <button
                  type="button"
                  onClick={() => setIsCreateOrgModalOpen(false)}
                  className="rounded-xl px-4 py-2 text-xs font-bold text-muted-foreground hover:bg-muted"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingOrg || !newOrgForm.name.trim()}
                  className="rounded-xl bg-primary px-5 py-2.5 text-xs font-bold text-primary-foreground shadow-sm hover:opacity-95 active:scale-95 disabled:opacity-50"
                >
                  {isSavingOrg ? "Initializing Database..." : "Create & Launch Organization"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: CUSTOMIZE ORGANIZATION & MODULE VISIBILITY                         */}
      {/* ========================================================================= */}
      {isEditOrgModalOpen && editingOrg && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-3 sm:p-4 backdrop-blur-xs overflow-y-auto">
          <div className="relative w-full max-w-lg rounded-3xl bg-card p-6 shadow-2xl ring-1 ring-border flex flex-col gap-4 text-foreground max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div>
                <h3 className="text-base font-extrabold text-foreground">
                  Customize: {editingOrg.name}
                </h3>
                <p className="text-xs text-muted-foreground font-mono">
                  Database: {editingOrg.database_name}
                </p>
              </div>
              <button
                onClick={() => setIsEditOrgModalOpen(false)}
                className="rounded-full p-1.5 text-muted-foreground hover:bg-muted"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEditOrg} className="flex flex-col gap-4 text-xs">
              <div className="flex flex-col gap-1">
                <label className="font-bold text-muted-foreground">Organization Name</label>
                <input
                  type="text"
                  required
                  value={editingOrg.name || ""}
                  onChange={(e) => setEditingOrg({ ...editingOrg, name: e.target.value })}
                  className="rounded-xl bg-background px-3.5 py-2.5 text-xs text-foreground ring-1 ring-border"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="font-bold text-muted-foreground">Owner Name</label>
                  <input
                    type="text"
                    value={editingOrg.owner_name || ""}
                    onChange={(e) => setEditingOrg({ ...editingOrg, owner_name: e.target.value })}
                    className="rounded-xl bg-background px-3 py-2 text-xs text-foreground ring-1 ring-border"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="font-bold text-muted-foreground">Phone</label>
                  <input
                    type="text"
                    value={editingOrg.phone || ""}
                    onChange={(e) => setEditingOrg({ ...editingOrg, phone: e.target.value })}
                    className="rounded-xl bg-background px-3 py-2 text-xs text-foreground ring-1 ring-border"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="font-bold text-muted-foreground">Address</label>
                <textarea
                  rows={2}
                  value={editingOrg.address || ""}
                  onChange={(e) => setEditingOrg({ ...editingOrg, address: e.target.value })}
                  className="rounded-xl bg-background px-3 py-2 text-xs text-foreground ring-1 ring-border resize-none"
                />
              </div>

              {/* Organization Status Toggle */}
              <div className="flex flex-col gap-1 rounded-2xl bg-muted/40 p-3 ring-1 ring-border/50">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-foreground">Operational Status</label>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[9px] font-black ${editingOrg.status === "Inactive"
                        ? "bg-rose-500/15 text-rose-700 dark:text-rose-400 ring-1 ring-rose-500/30"
                        : "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 ring-1 ring-emerald-500/30"
                      }`}
                  >
                    {editingOrg.status || "Active"}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 mt-1">
                  <button
                    type="button"
                    onClick={() => setEditingOrg({ ...editingOrg, status: "Active" })}
                    className={`p-2 rounded-xl text-xs font-bold transition-all ring-1 ${editingOrg.status !== "Inactive"
                        ? "bg-emerald-600 text-white ring-emerald-600 shadow-xs"
                        : "bg-background text-muted-foreground ring-border hover:text-foreground"
                      }`}
                  >
                    ✓ Active (Enabled)
                  </button>
                  <button
                    type="button"
                    disabled={editingOrg.slug === "rd-jeans-main"}
                    onClick={() => {
                      if (editingOrg.slug === "rd-jeans-main") {
                        alert("Primary factory root cannot be deactivated.")
                        return
                      }
                      setEditingOrg({ ...editingOrg, status: "Inactive" })
                    }}
                    className={`p-2 rounded-xl text-xs font-bold transition-all ring-1 disabled:opacity-40 ${editingOrg.status === "Inactive"
                        ? "bg-rose-600 text-white ring-rose-600 shadow-xs"
                        : "bg-background text-muted-foreground ring-border hover:text-foreground"
                      }`}
                  >
                    ✕ Deactivated (Suspended)
                  </button>
                </div>
                <p className="text-[10px] text-muted-foreground mt-1">
                  When deactivated, users cannot switch into or modify this organization workspace.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 rounded-2xl bg-muted/40 p-3 ring-1 ring-border/50">
                <div className="flex flex-col gap-1">
                  <label className="font-bold text-foreground">Stitching Rate (₹/pc)</label>
                  <input
                    type="number"
                    step="0.5"
                    value={editingOrg.default_stitching_rate ?? 45}
                    onChange={(e) => setEditingOrg({ ...editingOrg, default_stitching_rate: Number(e.target.value) })}
                    className="rounded-xl bg-background px-3 py-2 text-xs font-bold text-foreground ring-1 ring-border"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="font-bold text-foreground">Washing Rate (₹/pc)</label>
                  <input
                    type="number"
                    step="0.5"
                    value={editingOrg.default_washing_rate ?? 5}
                    onChange={(e) => setEditingOrg({ ...editingOrg, default_washing_rate: Number(e.target.value) })}
                    className="rounded-xl bg-background px-3 py-2 text-xs font-bold text-foreground ring-1 ring-border"
                  />
                </div>
              </div>

              {/* Dedicated Google Sheets Webhook URL for this Tenant */}
              <div className="flex flex-col gap-1 rounded-2xl bg-secondary/40 p-3 ring-1 ring-border/50">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-foreground flex items-center gap-1.5">
                    <Cloud className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                    <span>Dedicated Google Sheets Webhook URL</span>
                  </label>
                  <span className="text-[10px] text-muted-foreground">Optional</span>
                </div>
                <input
                  type="url"
                  placeholder="https://script.google.com/macros/s/.../exec"
                  value={editingOrg.google_sheets_webhook_url || ""}
                  onChange={(e) => setEditingOrg({ ...editingOrg, google_sheets_webhook_url: e.target.value })}
                  className="rounded-xl bg-background px-3 py-2 text-xs text-foreground ring-1 ring-border font-mono mt-1"
                />
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  Links this organization to its own independent Google Spreadsheet. Data will only sync to this URL.
                </p>
              </div>

              {/* Module Visibility for this Org */}
              <div className="flex flex-col gap-2">
                <label className="font-black text-foreground uppercase tracking-wider text-[10px]">
                  Module Visibility for this Organization
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {Object.entries(editingOrg.module_visibility || {}).map(([modKey, isEnabled]) => (
                    <label
                      key={modKey}
                      className={`flex items-center gap-2 p-2 rounded-xl border text-[11px] font-bold cursor-pointer transition-all ${isEnabled
                          ? "bg-primary/10 border-primary/40 text-foreground"
                          : "bg-muted/30 border-border text-muted-foreground"
                        }`}
                    >
                      <input
                        type="checkbox"
                        checked={Boolean(isEnabled)}
                        onChange={(e) =>
                          setEditingOrg({
                            ...editingOrg,
                            module_visibility: {
                              ...editingOrg.module_visibility,
                              [modKey]: e.target.checked,
                            },
                          })
                        }
                        className="rounded text-primary focus:ring-primary h-3.5 w-3.5"
                      />
                      <span className="capitalize">{modKey.replace(/_/g, " ")}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 border-t border-border pt-3 mt-1">
                <button
                  type="button"
                  onClick={() => setIsEditOrgModalOpen(false)}
                  className="rounded-xl px-4 py-2 text-xs font-bold text-muted-foreground hover:bg-muted"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingOrg}
                  className="rounded-xl bg-primary px-5 py-2.5 text-xs font-bold text-primary-foreground shadow-sm hover:opacity-95 active:scale-95"
                >
                  {isSavingOrg ? "Saving..." : "Save Organization Settings"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </main>
  )
}
