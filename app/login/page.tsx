"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

export default function LoginPage() {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
      })

      const data = await response.json()

      if (response.ok && data.success) {
        localStorage.setItem("rd_user", JSON.stringify(data.user))
        document.cookie = `rd_user=${data.user.username}; path=/; max-age=86400`
        if (data.user?.token) {
          document.cookie = `rd_token=${data.user.token}; path=/; max-age=86400`
        }
        router.push("/")
      } else {
        const detailMsg = typeof data.detail === "string" ? data.detail : data.detail?.message
        setError(detailMsg || data.message || "Invalid username or password")
      }
    } catch (err) {
      setError("Failed to connect to the authentication service.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 dark:bg-gray-950">
      <div className="w-full max-w-md rounded-3xl bg-white p-8 shadow-xl ring-1 ring-black/5 dark:bg-gray-900 dark:ring-white/5">
        <div className="text-center">
          <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 dark:text-white">
            RD Jeans Login
          </h1>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            Factory Management System
          </p>
        </div>

        <form onSubmit={handleLogin} className="mt-8 space-y-6">
          {error && (
            <div className="rounded-xl bg-red-50 p-4 text-sm text-red-700 dark:bg-red-950/30 dark:text-red-400">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider dark:text-gray-400">
                Username
              </label>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter username"
                className="mt-1 w-full rounded-2xl border-0 bg-gray-100 px-4 py-3.5 text-sm text-gray-900 placeholder:text-gray-400 focus:bg-white focus:ring-2 focus:ring-primary focus:outline-none dark:bg-gray-800 dark:text-white dark:focus:bg-gray-800/80"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider dark:text-gray-400">
                Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                className="mt-1 w-full rounded-2xl border-0 bg-gray-100 px-4 py-3.5 text-sm text-gray-900 placeholder:text-gray-400 focus:bg-white focus:ring-2 focus:ring-primary focus:outline-none dark:bg-gray-800 dark:text-white dark:focus:bg-gray-800/80"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-2xl bg-black py-4 text-sm font-bold text-white transition-all hover:bg-black/90 active:scale-95 disabled:opacity-50 dark:bg-white dark:text-black dark:hover:bg-white/90"
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>
      </div>
    </div>
  )
}
