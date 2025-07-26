// Enhanced form validation utilities for Buck AI
import { toast } from '@/hooks/use-toast'

export interface ValidationResult {
  isValid: boolean
  errors: string[]
  warnings: string[]
}

export interface ValidationRule {
  field: string
  required?: boolean
  minLength?: number
  maxLength?: number
  pattern?: RegExp
  custom?: (value: any) => string | null
}

export class FormValidator {
  private rules: ValidationRule[] = []
  private errors: string[] = []
  private warnings: string[] = []

  constructor(rules: ValidationRule[]) {
    this.rules = rules
  }

  validate(data: Record<string, any>): ValidationResult {
    this.errors = []
    this.warnings = []

    for (const rule of this.rules) {
      const value = data[rule.field]
      
      // Required field validation
      if (rule.required && (!value || value.toString().trim() === '')) {
        this.errors.push(`${this.formatFieldName(rule.field)} is required`)
        continue
      }

      // Skip other validations if field is empty and not required
      if (!value || value.toString().trim() === '') continue

      // Length validations
      if (rule.minLength && value.toString().length < rule.minLength) {
        this.errors.push(`${this.formatFieldName(rule.field)} must be at least ${rule.minLength} characters`)
      }

      if (rule.maxLength && value.toString().length > rule.maxLength) {
        this.errors.push(`${this.formatFieldName(rule.field)} must be no more than ${rule.maxLength} characters`)
      }

      // Pattern validation
      if (rule.pattern && !rule.pattern.test(value.toString())) {
        this.errors.push(`${this.formatFieldName(rule.field)} format is invalid`)
      }

      // Custom validation
      if (rule.custom) {
        const customError = rule.custom(value)
        if (customError) {
          this.errors.push(customError)
        }
      }
    }

    return {
      isValid: this.errors.length === 0,
      errors: this.errors,
      warnings: this.warnings
    }
  }

  private formatFieldName(field: string): string {
    return field
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, str => str.toUpperCase())
      .trim()
  }
}

// Predefined validation rules
export const ValidationRules = {
  email: {
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    custom: (value: string) => {
      if (value && !value.includes('@')) return 'Please enter a valid email address'
      return null
    }
  },
  
  phone: {
    pattern: /^[+]?[1-9][\d]{0,15}$/,
    custom: (value: string) => {
      if (value && value.length < 10) return 'Phone number must be at least 10 digits'
      return null
    }
  },
  
  currency: {
    pattern: /^\d+(\.\d{1,2})?$/,
    custom: (value: string) => {
      const num = parseFloat(value)
      if (isNaN(num) || num < 0) return 'Please enter a valid positive amount'
      return null
    }
  },
  
  percentage: {
    custom: (value: string) => {
      const num = parseFloat(value)
      if (isNaN(num) || num < 0 || num > 100) return 'Percentage must be between 0 and 100'
      return null
    }
  },
  
  date: {
    custom: (value: string) => {
      const date = new Date(value)
      if (isNaN(date.getTime())) return 'Please enter a valid date'
      return null
    }
  },
  
  positiveNumber: {
    custom: (value: string) => {
      const num = parseFloat(value)
      if (isNaN(num) || num <= 0) return 'Please enter a positive number'
      return null
    }
  }
}

// Enhanced error handling with user-friendly messages
export const ErrorHandler = {
  showValidationErrors: (errors: string[]) => {
    if (errors.length === 1) {
      toast({
        title: "Validation Error",
        description: errors[0],
        variant: "destructive",
      })
    } else {
      toast({
        title: `${errors.length} Validation Errors`,
        description: errors.slice(0, 3).join(', ') + (errors.length > 3 ? '...' : ''),
        variant: "destructive",
      })
    }
  },

  showDatabaseError: (operation: string, error: any) => {
    console.error(`Database ${operation} error:`, error)
    
    let userMessage = `Failed to ${operation.toLowerCase()}`
    
    if (error?.message?.includes('UNIQUE constraint')) {
      userMessage = 'This record already exists. Please check for duplicates.'
    } else if (error?.message?.includes('NOT NULL constraint')) {
      userMessage = 'Required information is missing. Please fill in all required fields.'
    } else if (error?.message?.includes('FOREIGN KEY constraint')) {
      userMessage = 'This action cannot be completed due to related data dependencies.'
    } else if (error?.message?.includes('authentication')) {
      userMessage = 'Authentication error. Please sign in again.'
    }

    toast({
      title: "Database Error",
      description: userMessage,
      variant: "destructive",
    })
  },

  showSuccess: (operation: string, itemName?: string) => {
    toast({
      title: "Success!",
      description: `${itemName || 'Item'} ${operation.toLowerCase()} successfully`,
      variant: "default",
    })
  }
}

// Form state management utilities
export const FormUtils = {
  sanitizeFormData: (data: Record<string, any>): Record<string, any> => {
    const sanitized: Record<string, any> = {}
    
    for (const [key, value] of Object.entries(data)) {
      if (typeof value === 'string') {
        sanitized[key] = value.trim()
      } else if (typeof value === 'number') {
        sanitized[key] = isNaN(value) ? 0 : value
      } else {
        sanitized[key] = value
      }
    }
    
    return sanitized
  },

  formatCurrency: (amount: number | string): string => {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount
    return isNaN(num) ? '0.00' : num.toFixed(2)
  },

  generateId: (prefix: string): string => {
    const timestamp = Date.now()
    const random = Math.random().toString(36).substring(2, 8)
    return `${prefix}_${timestamp}_${random}`
  }
}