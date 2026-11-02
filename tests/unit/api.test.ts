import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { apiFetch } from '@/lib/api'

describe('lib/api.ts apiFetch client wrapper', () => {
  const originalFetch = global.fetch

  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    global.fetch = originalFetch
  })

  it('should_normalize_legacy_python_urls_when_localhost_port_8000_is_provided', async () => {
    // Arrange
    const mockFetch = vi.fn().mockResolvedValue(new Response(JSON.stringify({ ok: true }), { status: 200 }))
    global.fetch = mockFetch

    // Act
    await apiFetch('http://localhost:8000/employees')

    // Assert
    expect(mockFetch).toHaveBeenCalledWith('/api/employees', expect.any(Object))
  })

  it('should_normalize_ip_port_8000_when_127_0_0_1_is_provided', async () => {
    // Arrange
    const mockFetch = vi.fn().mockResolvedValue(new Response(JSON.stringify({ ok: true }), { status: 200 }))
    global.fetch = mockFetch

    // Act
    await apiFetch('http://127.0.0.1:8000/cutting')

    // Assert
    expect(mockFetch).toHaveBeenCalledWith('/api/cutting', expect.any(Object))
  })

  it('should_prefix_relative_paths_with_api_when_leading_slash_provided', async () => {
    // Arrange
    const mockFetch = vi.fn().mockResolvedValue(new Response(JSON.stringify({ ok: true }), { status: 200 }))
    global.fetch = mockFetch

    // Act
    await apiFetch('/custom-endpoint')

    // Assert
    expect(mockFetch).toHaveBeenCalledWith('/api/custom-endpoint', expect.any(Object))
  })

  it('should_prefix_relative_paths_with_api_slash_when_no_leading_slash_provided', async () => {
    // Arrange
    const mockFetch = vi.fn().mockResolvedValue(new Response(JSON.stringify({ ok: true }), { status: 200 }))
    global.fetch = mockFetch

    // Act
    await apiFetch('inventory/rolls')

    // Assert
    expect(mockFetch).toHaveBeenCalledWith('/api/inventory/rolls', expect.any(Object))
  })

  it('should_preserve_api_paths_as_is_when_already_prefixed_with_api', async () => {
    // Arrange
    const mockFetch = vi.fn().mockResolvedValue(new Response(JSON.stringify({ ok: true }), { status: 200 }))
    global.fetch = mockFetch

    // Act
    await apiFetch('/api/health')

    // Assert
    expect(mockFetch).toHaveBeenCalledWith('/api/health', expect.any(Object))
  })

  it('should_preserve_external_http_urls_when_absolute_remote_url_is_passed', async () => {
    // Arrange
    const mockFetch = vi.fn().mockResolvedValue(new Response(JSON.stringify({ ok: true }), { status: 200 }))
    global.fetch = mockFetch

    // Act
    await apiFetch('https://api.external.com/v1/ping')

    // Assert
    expect(mockFetch).toHaveBeenCalledWith('https://api.external.com/v1/ping', expect.any(Object))
  })

  it('should_throw_unreachable_error_when_failed_to_fetch_network_exception_occurs', async () => {
    // Arrange
    global.fetch = vi.fn().mockRejectedValue(new Error('Failed to fetch'))

    // Act & Assert
    await expect(apiFetch('/api/employees')).rejects.toThrow(
      'The API server is unreachable. Please verify your connection.'
    )
  })

  it('should_throw_generic_network_error_when_socket_disconnects', async () => {
    // Arrange
    global.fetch = vi.fn().mockRejectedValue(new Error('Socket disconnected'))

    // Act & Assert
    await expect(apiFetch('/api/employees')).rejects.toThrow(
      'Network connection failed. Please check your connection.'
    )
  })

  it('should_inject_bearer_token_when_running_in_browser_with_rd_user_in_local_storage', async () => {
    // Arrange
    const mockFetch = vi.fn().mockResolvedValue(new Response(JSON.stringify({ ok: true }), { status: 200 }))
    global.fetch = mockFetch

    const mockStorage: Record<string, string> = {
      rd_user: JSON.stringify({ token: 'test-jwt-token-123' })
    }
    const originalWindow = global.window
    ;(global as any).window = {
      location: { pathname: '/dashboard', href: '' }
    }
    ;(global as any).localStorage = {
      getItem: (key: string) => mockStorage[key] || null,
      removeItem: (key: string) => { delete mockStorage[key] }
    }

    try {
      // Act
      await apiFetch('/api/employees')

      // Assert
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/employees',
        expect.objectContaining({
          headers: expect.any(Object)
        })
      )
    } finally {
      ;(global as any).window = originalWindow
      delete (global as any).localStorage
    }
  })

  it('should_clear_storage_and_redirect_when_receiving_401_in_browser', async () => {
    // Arrange
    const mockFetch = vi.fn().mockResolvedValue(new Response(JSON.stringify({ error: 'unauthorized' }), { status: 401 }))
    global.fetch = mockFetch

    const mockStorage: Record<string, string> = {
      rd_user: JSON.stringify({ token: 'expired-token' })
    }
    const originalWindow = global.window
    const fakeWindow: any = {
      location: { pathname: '/employees', href: '' }
    }
    ;(global as any).window = fakeWindow
    ;(global as any).localStorage = {
      getItem: (key: string) => mockStorage[key] || null,
      removeItem: (key: string) => { delete mockStorage[key] }
    }
    ;(global as any).document = { cookie: '' }

    try {
      // Act
      const res = await apiFetch('/api/employees')

      // Assert
      expect(res.status).toBe(401)
      expect(fakeWindow.location.href).toBe('/login?error=session_expired')
      expect(mockStorage['rd_user']).toBeUndefined()
    } finally {
      ;(global as any).window = originalWindow
      delete (global as any).localStorage
      delete (global as any).document
    }
  })
})
