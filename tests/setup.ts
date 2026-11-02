import { beforeEach, vi } from 'vitest'

// Set predictable environment variables for test execution
;(process.env as Record<string, string | undefined>).NODE_ENV = 'test'
process.env.SECRET_KEY = 'test_secret_key_for_vitest_unit_testing_minimum_32_characters'
process.env.JWT_SECRET = 'test_secret_key_for_vitest_unit_testing_minimum_32_characters'
process.env.ALGORITHM = 'HS256'
process.env.ACCESS_TOKEN_EXPIRE_MINUTES = '30'

beforeEach(() => {
  vi.clearAllMocks()
})
