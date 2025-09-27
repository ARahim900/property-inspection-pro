import type { Invoice } from '@/types'

export interface ValidationError {
  field: string
  message: string
}

export function validateInvoice(invoice: Invoice): ValidationError[] {
  const errors: ValidationError[] = []

  // Required fields validation
  if (!invoice.invoiceNumber.trim()) {
    errors.push({ field: 'invoiceNumber', message: 'Invoice number is required' })
  }

  if (!invoice.clientName.trim()) {
    errors.push({ field: 'clientName', message: 'Client name is required' })
  }

  if (!invoice.clientEmail.trim()) {
    errors.push({ field: 'clientEmail', message: 'Client email is required' })
  } else if (!isValidEmail(invoice.clientEmail)) {
    errors.push({ field: 'clientEmail', message: 'Please enter a valid email address' })
  }

  if (!invoice.clientAddress.trim()) {
    errors.push({ field: 'clientAddress', message: 'Client address is required' })
  }

  if (!invoice.propertyLocation.trim()) {
    errors.push({ field: 'propertyLocation', message: 'Property location is required' })
  }

  if (!invoice.invoiceDate) {
    errors.push({ field: 'invoiceDate', message: 'Invoice date is required' })
  }

  if (!invoice.dueDate) {
    errors.push({ field: 'dueDate', message: 'Due date is required' })
  } else if (new Date(invoice.dueDate) < new Date(invoice.invoiceDate)) {
    errors.push({ field: 'dueDate', message: 'Due date must be after invoice date' })
  }

  // Services validation
  if (invoice.services.length === 0 && (!invoice.propertyArea || invoice.propertyArea <= 0)) {
    errors.push({ field: 'services', message: 'At least one service or property area is required' })
  }

  // Service items validation
  invoice.services.forEach((service, index) => {
    if (!service.description.trim()) {
      errors.push({ 
        field: `services.${index}.description`, 
        message: `Service ${index + 1} description is required` 
      })
    }

    if (service.quantity <= 0) {
      errors.push({ 
        field: `services.${index}.quantity`, 
        message: `Service ${index + 1} quantity must be greater than 0` 
      })
    }

    if (service.unitPrice < 0) {
      errors.push({ 
        field: `services.${index}.unitPrice`, 
        message: `Service ${index + 1} unit price cannot be negative` 
      })
    }
  })

  // Property area validation (if property-based calculation is used)
  if (invoice.propertyArea && invoice.propertyArea <= 0) {
    errors.push({ field: 'propertyArea', message: 'Property area must be greater than 0' })
  }

  // Amount validation
  if (invoice.totalAmount <= 0) {
    errors.push({ field: 'totalAmount', message: 'Total amount must be greater than 0' })
  }

  if (invoice.amountPaid < 0) {
    errors.push({ field: 'amountPaid', message: 'Amount paid cannot be negative' })
  }

  if (invoice.amountPaid > invoice.totalAmount) {
    errors.push({ field: 'amountPaid', message: 'Amount paid cannot exceed total amount' })
  }

  // Configuration validation
  if (invoice.config) {
    if (invoice.config.vatRate < 0 || invoice.config.vatRate > 100) {
      errors.push({ field: 'config.vatRate', message: 'VAT rate must be between 0 and 100' })
    }

    if (invoice.config.residentialRate < 0) {
      errors.push({ field: 'config.residentialRate', message: 'Residential rate cannot be negative' })
    }

    if (invoice.config.commercialRate < 0) {
      errors.push({ field: 'config.commercialRate', message: 'Commercial rate cannot be negative' })
    }
  }

  return errors
}

export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

export function formatValidationErrors(errors: ValidationError[]): string {
  if (errors.length === 0) return ''
  
  if (errors.length === 1) {
    return errors[0].message
  }
  
  return `Please fix the following issues:\n${errors.map(error => `• ${error.message}`).join('\n')}`
}

export function getFieldError(errors: ValidationError[], fieldName: string): string | undefined {
  const error = errors.find(error => error.field === fieldName)
  return error?.message
}

// Utility function to check if invoice is ready for finalization
export function canFinalizeInvoice(invoice: Invoice): boolean {
  const errors = validateInvoice(invoice)
  return errors.length === 0 && invoice.status !== 'Draft'
}

// Utility function to suggest invoice status based on payment
export function suggestInvoiceStatus(invoice: Invoice): Invoice['status'] {
  if (invoice.amountPaid === 0) {
    return 'Unpaid'
  } else if (invoice.amountPaid >= invoice.totalAmount) {
    return 'Paid'
  } else {
    return 'Partial'
  }
}