import { describe, it, expect } from 'vitest'
import { modules, factorySummary, recentActivities } from '@/lib/dashboard-data'

describe('lib/dashboard-data.ts static config and schemas', () => {
  it('should_export_all_core_navigation_modules_when_inspected', () => {
    // Arrange
    const expectedModuleNames = [
      'Employees',
      'Upad',
      'Cutting',
      'Roll Inventory',
      'Cash Book',
      'Partner',
      'Reports'
    ]

    // Act
    const moduleNames = modules.map(m => m.name)

    // Assert
    expect(modules).toBeDefined()
    expect(modules.length).toBe(11)
    for (const expected of expectedModuleNames) {
      expect(moduleNames).toContain(expected)
    }
    for (const mod of modules) {
      expect(mod.name).toBeTruthy()
      expect(mod.description).toBeTruthy()
      expect(mod.icon).toBeDefined()
      expect(mod.iconColor).toBeTruthy()
      expect(mod.iconBg).toBeTruthy()
    }
  })

  it('should_provide_default_factory_summary_metrics_when_initialized', () => {
    // Act
    const labels = factorySummary.map(s => s.label)

    // Assert
    expect(factorySummary).toBeDefined()
    expect(factorySummary.length).toBeGreaterThanOrEqual(8)
    expect(labels).toContain('Total Employees')
    expect(labels).toContain('Monthly Salary')
    expect(labels).toContain('Total Upad')
    expect(labels).toContain('Cutting Pieces')
  })

  it('should_export_recent_activities_array_when_accessed', () => {
    // Act & Assert
    expect(Array.isArray(recentActivities)).toBe(true)
  })
})
