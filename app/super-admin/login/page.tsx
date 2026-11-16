"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import {
  Shield,
  Lock,
  User,
  ArrowRight,
  AlertCircle,
  Eye,
  EyeOff,
  CheckCircle2,
  ArrowLeft,
  KeyRound
} from "lucide-react"

export default function SuperAdminLoginPage() {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (loading) return
    setError(null)
    setLoading(true)

    try {
      const res = await fetch("/api/super-admin/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password })
      })

      const data = await res.json()
      if (res.ok && data.success) {
        localStorage.setItem("super_admin_user", data.user?.username || username)
        if (data.token) {
          localStorage.setItem("super_admin_token", data.token)
        }
        router.push("/super-admin")
      } else {
        setError(data.error || "Invalid Super Admin credentials")
      }
    } catch {
      setError("Failed to connect to authentication server")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-900 via-slate-950 to-indigo-950 px-4 py-12 text-slate-100">
      <div className="w-full max-w-md">
        
        {/* Brand Card */}
        <div className="overflow-hidden rounded-3xl bg-slate-900/90 p-8 shadow-2xl ring-1 ring-slate-800/80 backdrop-blur-xl">
          
          {/* Header */}
          <div className="flex flex-col items-center text-center">
            <div className="relative mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-tr from-indigo-600 to-blue-500 shadow-lg shadow-indigo-500/25 ring-4 ring-indigo-500/20">
              <Shield className="h-8 w-8 text-white" />
              <span className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 text-[10px] font-black text-white shadow-xs">
                ★
              </span>
            </div>
            
            <span className="rounded-full bg-indigo-500/10 px-3 py-1 text-[11px] font-extrabold uppercase tracking-widest text-indigo-400 ring-1 ring-indigo-500/30">
              Restricted Area
            </span>
            
            <h1 className="mt-3 text-2xl font-black tracking-tight text-white">
              Super Admin Portal
            </h1>
            <p className="mt-1.5 text-xs text-slate-400">
              RD Jeans Factory Master Administration &amp; Dropdown Controls
            </p>
          </div>

          {/* Error Alert */}
          {error && (
            <div className="mt-6 flex items-center gap-2.5 rounded-2xl bg-red-950/40 p-3.5 text-xs font-semibold text-red-300 ring-1 ring-red-500/30 animate-in fade-in duration-200">
              <AlertCircle className="h-4 w-4 shrink-0 text-red-400" />
              <span>{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleLogin} className="mt-6 flex flex-col gap-4">
            
            {/* Username Input */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-300">
                Super Admin Username
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-500" />
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="e.g. AkshayGohel21"
                  className="w-full rounded-2xl border-0 bg-slate-800/80 pl-10 pr-4 py-3 text-sm text-white placeholder:text-slate-500 ring-1 ring-slate-700/80 transition-all focus:bg-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            {/* Password Input */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-300">
                Master Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-500" />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your master password"
                  className="w-full rounded-2xl border-0 bg-slate-800/80 pl-10 pr-11 py-3 text-sm text-white placeholder:text-slate-500 ring-1 ring-slate-700/80 transition-all focus:bg-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-3.5 text-slate-400 hover:text-white"
                  title={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Login Button */}
            <button
              type="submit"
              disabled={loading}
              className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-600 to-blue-600 py-3.5 text-sm font-bold text-white shadow-lg shadow-indigo-600/30 transition-all hover:from-indigo-500 hover:to-blue-500 active:scale-98 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  <span>Verifying Credentials...</span>
                </>
              ) : (
                <>
                  <span>Sign In as Super Admin</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Return Footer */}
          <div className="mt-6 border-t border-slate-800/80 pt-5 text-center">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-slate-200 transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Return to Factory Dashboard</span>
            </Link>
          </div>

        </div>

        {/* Security Note */}
        <p className="mt-4 text-center text-[11px] text-slate-500">
          This portal is reserved for authorized factory administration only.
        </p>

      </div>
    </div>
  )
}
