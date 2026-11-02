import { describe, it, expect } from 'vitest'
import { cn } from '@/lib/utils'

describe('lib/utils.ts cn() utility', () => {
  it('should_merge_classes_cleanly_when_valid_strings_provided', () => {
    // Arrange
    const classA = 'px-2'
    const classB = 'py-1'

    // Act
    const result = cn(classA, classB)

    // Assert
    expect(result).toBe('px-2 py-1')
  })

  it('should_resolve_tailwind_conflict_when_multiple_utilities_overlap', () => {
    // Arrange & Act
    const paddingResult = cn('p-4', 'p-2')
    const colorResult = cn('text-red-500', 'text-blue-500')

    // Assert
    expect(paddingResult).toBe('p-2')
    expect(colorResult).toBe('text-blue-500')
  })

  it('should_handle_falsy_values_when_null_undefined_or_boolean_false_passed', () => {
    // Arrange & Act
    const result = cn('btn', null, undefined, false && 'hidden', true && 'visible')

    // Assert
    expect(result).toBe('btn visible')
  })

  it('should_parse_nested_structures_when_arrays_and_objects_are_provided', () => {
    // Arrange
    const arrayClasses = ['class-a', 'class-b']
    const conditionalObj = { active: true, disabled: false }

    // Act
    const result = cn(arrayClasses, conditionalObj)

    // Assert
    expect(result).toBe('class-a class-b active')
  })

  it('should_return_empty_string_when_called_without_arguments', () => {
    // Act
    const result = cn()

    // Assert
    expect(result).toBe('')
  })

  it('should_handle_boundary_conditions_when_empty_strings_and_empty_arrays_provided', () => {
    // Act
    const result = cn('', [], {}, [null, undefined, ''])

    // Assert
    expect(result).toBe('')
  })
})
