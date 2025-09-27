"use client"

import React, { useState, useEffect } from 'react'
import type { Invoice, InvoiceServiceItem, Client, PropertyInspectionType, InvoiceConfig } from '@/types'
import { DEFAULT_INVOICE_CONFIG } from '@/constants'
import { useClients } from '@/hooks/use-clients'

import { validateInvoice, formatValidationErrors, getFieldError } from '@/lib/invoice-validation'
import { cn } from '@/lib/utils'

interface InvoiceFormProps {
  invoice?: Invoice
  onSave: (invoice: Invoice) => void
  onCancel: () => void
}

export function InvoiceForm({ invoice, onSave, onCancel }: InvoiceFormProps) {
  const { clients } = useClients()
  const [formData, setFormData] = useState<Invoice>(() => {
    if (invoice) return invoice
    
    const today = new Date()
    const dueDate = new Date(today)
    dueDate.setDate(today.getDate() + 30) // 30 days from today
    
    return {
      id: `inv_${Date.now()}`,
      invoiceNumber: `INV-${Date.now().toString().slice(-6)}`,
      invoiceDate: today.toISOString().split('T')[0],
      dueDate: dueDate.toISOString().split('T')[0],
      clientId: '',
      clientName: '',
      clientAddress: '',
      clientEmail: '',
      propertyLocation: '',
      propertyType: 'Residential',
      propertyArea: 0,
      services: [],
      subtotal: 0,
      tax: 0,
      totalAmount: 0,
      amountPaid: 0,
      status: 'Draft',
      notes: '',

      config: DEFAULT_INVOICE_CONFIG,
    }
  })

  const [selectedClient, setSelectedClient] = useState<Client | null>(null)
  const [isCalculatingFromProperty, setIsCalculatingFromProperty] = useState(false)
  const [validationErrors, setValidationErrors] = useState<ReturnType<typeof validateInvoice>>([])
  const [showValidation, setShowValidation] = useState(false)

  // Update selected client when clientId changes
  useEffect(() => {
    if (formData.clientId) {
      const client = clients.find(c => c.id === formData.clientId)
      setSelectedClient(client || null)
      if (client) {
        setFormData(prev => ({
          ...prev,
          clientName: client.name,
          clientAddress: client.address,
          clientEmail: client.email,
        }))
      }
    }
  }, [formData.clientId, clients])

  // Calculate totals when services, property type, or area changes
  useEffect(() => {
    calculateTotals()
  }, [formData.services, formData.propertyType, formData.propertyArea, isCalculatingFromProperty])

  const calculateTotals = () => {
    let subtotal = 0

    // Calculate from services
    formData.services.forEach(service => {
      subtotal += service.total
    })

    // Add property-based calculation if enabled
    if (isCalculatingFromProperty && formData.propertyArea && formData.propertyType) {
      const rate = formData.propertyType === 'Residential' 
        ? formData.config?.residentialRate || DEFAULT_INVOICE_CONFIG.residentialRate
        : formData.config?.commercialRate || DEFAULT_INVOICE_CONFIG.commercialRate
      
      const propertyTotal = formData.propertyArea * rate
      subtotal += propertyTotal
    }

    const vatRate = (formData.config?.vatRate || DEFAULT_INVOICE_CONFIG.vatRate) / 100
    const tax = subtotal * vatRate
    const totalAmount = subtotal + tax

    setFormData(prev => ({
      ...prev,
      subtotal,
      tax,
      totalAmount,
    }))
  }

  const handleInputChange = (field: keyof Invoice, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleConfigChange = (field: keyof InvoiceConfig, value: any) => {
    setFormData(prev => ({
      ...prev,
      config: { ...prev.config!, [field]: value }
    }))
  }

  const addService = () => {
    const newService: InvoiceServiceItem = {
      id: `service_${Date.now()}`,
      description: '',
      quantity: 1,
      unitPrice: 0,
      total: 0,
    }
    setFormData(prev => ({
      ...prev,
      services: [...prev.services, newService]
    }))
  }

  const updateService = (index: number, field: keyof InvoiceServiceItem, value: any) => {
    const updatedServices = [...formData.services]
    updatedServices[index] = { ...updatedServices[index], [field]: value }
    
    // Recalculate total for this service
    if (field === 'quantity' || field === 'unitPrice') {
      updatedServices[index].total = updatedServices[index].quantity * updatedServices[index].unitPrice
    }
    
    setFormData(prev => ({ ...prev, services: updatedServices }))
  }

  const removeService = (index: number) => {
    setFormData(prev => ({
      ...prev,
      services: prev.services.filter((_, i) => i !== index)
    }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setShowValidation(true)
    
    // Add property-based service if calculating from property
    let finalServices = [...formData.services]
    if (isCalculatingFromProperty && formData.propertyArea && formData.propertyType) {
      const rate = formData.propertyType === 'Residential' 
        ? formData.config?.residentialRate || DEFAULT_INVOICE_CONFIG.residentialRate
        : formData.config?.commercialRate || DEFAULT_INVOICE_CONFIG.commercialRate
      
      const propertyService: InvoiceServiceItem = {
        id: `property_service_${Date.now()}`,
        description: `${formData.propertyType} Property Inspection (${formData.propertyArea} m²)`,
        quantity: formData.propertyArea,
        unitPrice: rate,
        total: formData.propertyArea * rate,
      }
      finalServices.push(propertyService)
    }

    const finalInvoice = {
      ...formData,
      services: finalServices,
    }

    // Validate the invoice
    const errors = validateInvoice(finalInvoice)
    setValidationErrors(errors)

    if (errors.length === 0) {
      onSave(finalInvoice)
    } else {
      // Scroll to top to show validation errors
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  const formatCurrency = (amount: number) => {
    return `${formData.config?.currency || 'OMR'} ${amount.toFixed(2)}`
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-3xl font-bold text-slate-800 dark:text-slate-100 mb-2">
              {invoice ? 'Edit Invoice' : 'Create New Invoice'}
            </h2>
            <p className="text-slate-600 dark:text-slate-400">
              {invoice ? 'Update invoice details and save changes' : 'Fill in the details below to create a professional invoice'}
            </p>
          </div>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onCancel}
              className="px-6 py-2.5 text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg font-medium transition-colors border border-slate-300 dark:border-slate-600"
            >
              Cancel
            </button>
            <button
              type="submit"
              form="invoice-form"
              className="px-8 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium shadow-sm transition-colors flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
              {invoice ? 'Update Invoice' : 'Create Invoice'}
            </button>
          </div>
        </div>
      </div>

      {/* Validation Errors */}
      {showValidation && validationErrors.length > 0 && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <div>
              <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
                Please fix the following issues:
              </h3>
              <ul className="mt-2 text-sm text-red-700 dark:text-red-300 space-y-1">
                {validationErrors.map((error, index) => (
                  <li key={index}>• {error.message}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      <form id="invoice-form" onSubmit={handleSubmit} className="space-y-6">
        {/* Invoice Details */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/50 rounded-lg">
              <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
              Invoice Details
            </h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Invoice Number
              </label>
              <input
                type="text"
                value={formData.invoiceNumber}
                onChange={(e) => handleInputChange('invoiceNumber', e.target.value)}
                className="w-full px-3 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder="INV-001"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Status
              </label>
              <select
                value={formData.status}
                onChange={(e) => handleInputChange('status', e.target.value)}
                className="w-full px-3 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              >
                <option value="Draft">📝 Draft</option>
                <option value="Unpaid">⏳ Unpaid</option>
                <option value="Partial">💰 Partial</option>
                <option value="Paid">✅ Paid</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Invoice Date
              </label>
              <input
                type="date"
                value={formData.invoiceDate}
                onChange={(e) => handleInputChange('invoiceDate', e.target.value)}
                className="w-full px-3 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Due Date
              </label>
              <input
                type="date"
                value={formData.dueDate}
                onChange={(e) => handleInputChange('dueDate', e.target.value)}
                className="w-full px-3 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                required
              />
            </div>
          </div>
        </div>

        {/* Currency and Tax Configuration */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-slate-800 dark:to-slate-700 p-6 rounded-xl border border-blue-100 dark:border-slate-600">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/50 rounded-lg">
              <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
              Currency & Tax Configuration
            </h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Currency
              </label>
              <input
                type="text"
                value={formData.config?.currency || 'OMR'}
                onChange={(e) => handleConfigChange('currency', e.target.value)}
                className="w-full px-3 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                VAT Rate (%)
              </label>
              <input
                type="number"
                step="0.1"
                value={formData.config?.vatRate || 5}
                onChange={(e) => handleConfigChange('vatRate', parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Residential Rate (per m²)
              </label>
              <input
                type="number"
                step="0.1"
                value={formData.config?.residentialRate || 1.5}
                onChange={(e) => handleConfigChange('residentialRate', parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Commercial Rate (per m²)
              </label>
              <input
                type="number"
                step="0.1"
                value={formData.config?.commercialRate || 2.0}
                onChange={(e) => handleConfigChange('commercialRate', parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
            </div>
          </div>
        </div>

        {/* Client Information */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-2 bg-green-100 dark:bg-green-900/50 rounded-lg">
              <svg className="w-5 h-5 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
              Client Information
            </h3>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Select Client
              </label>
              <select
                value={formData.clientId}
                onChange={(e) => handleInputChange('clientId', e.target.value)}
                className="w-full px-3 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                required
              >
                <option value="">Select a client...</option>
                {clients.map(client => (
                  <option key={client.id} value={client.id}>
                    {client.name} - {client.email}
                  </option>
                ))}
              </select>
            </div>

            {selectedClient && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-slate-200 dark:border-slate-600">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Client Name
                  </label>
                  <input
                    type="text"
                    value={formData.clientName}
                    onChange={(e) => handleInputChange('clientName', e.target.value)}
                    className="w-full px-3 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Client Email
                  </label>
                  <input
                    type="email"
                    value={formData.clientEmail}
                    onChange={(e) => handleInputChange('clientEmail', e.target.value)}
                    className="w-full px-3 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                    required
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Client Address
                  </label>
                  <textarea
                    value={formData.clientAddress}
                    onChange={(e) => handleInputChange('clientAddress', e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all resize-none"
                    placeholder="Enter client's full address..."
                    required
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Property Details */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-purple-100 dark:bg-purple-900/50 rounded-lg">
                <svg className="w-5 h-5 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
                Property Details
              </h3>
            </div>
            <label className="flex items-center gap-3 bg-slate-50 dark:bg-slate-700 px-4 py-2 rounded-lg cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-600 transition-colors">
              <input
                type="checkbox"
                checked={isCalculatingFromProperty}
                onChange={(e) => setIsCalculatingFromProperty(e.target.checked)}
                className="w-4 h-4 text-purple-600 bg-white border-slate-300 rounded focus:ring-purple-500 focus:ring-2"
              />
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Auto-calculate from property area
              </span>
            </label>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Property Location
              </label>
              <input
                type="text"
                value={formData.propertyLocation}
                onChange={(e) => handleInputChange('propertyLocation', e.target.value)}
                className="w-full px-3 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                placeholder="Enter property address or location..."
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Property Type
              </label>
              <select
                value={formData.propertyType || 'Residential'}
                onChange={(e) => handleInputChange('propertyType', e.target.value as PropertyInspectionType)}
                className="w-full px-3 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
              >
                <option value="Residential">🏠 Residential</option>
                <option value="Commercial">🏢 Commercial</option>
              </select>
            </div>
          </div>

          {isCalculatingFromProperty && (
            <div className="mt-4 p-4 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Property Area (m²)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.propertyArea || ''}
                    onChange={(e) => handleInputChange('propertyArea', parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                    placeholder="Enter area in square meters"
                  />
                </div>
                <div className="flex items-end">
                  <div className="w-full">
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Rate per m²
                    </label>
                    <div className="px-3 py-2.5 bg-slate-100 dark:bg-slate-600 rounded-lg text-slate-700 dark:text-slate-300 font-medium">
                      {formData.config?.currency || 'OMR'} {formData.propertyType === 'Residential' 
                        ? (formData.config?.residentialRate || DEFAULT_INVOICE_CONFIG.residentialRate).toFixed(2)
                        : (formData.config?.commercialRate || DEFAULT_INVOICE_CONFIG.commercialRate).toFixed(2)}
                    </div>
                  </div>
                </div>
              </div>
              
              {formData.propertyArea && formData.propertyType && (
                <div className="mt-4 p-3 bg-white dark:bg-slate-800 rounded-lg border border-purple-200 dark:border-purple-700">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-slate-600 dark:text-slate-400">
                      Property inspection cost:
                    </span>
                    <span className="text-lg font-bold text-purple-600 dark:text-purple-400">
                      {formatCurrency(
                        formData.propertyArea * (formData.propertyType === 'Residential' 
                          ? formData.config?.residentialRate || DEFAULT_INVOICE_CONFIG.residentialRate
                          : formData.config?.commercialRate || DEFAULT_INVOICE_CONFIG.commercialRate)
                      )}
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Services */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-orange-100 dark:bg-orange-900/50 rounded-lg">
                <svg className="w-5 h-5 text-orange-600 dark:text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
                Services & Items
              </h3>
            </div>
            <button
              type="button"
              onClick={addService}
              className="inline-flex items-center gap-2 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-sm font-medium transition-colors shadow-sm"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
              </svg>
              Add Service
            </button>
          </div>
          
          {formData.services.length === 0 ? (
            <div className="text-center py-8 text-slate-500 dark:text-slate-400">
              <svg className="w-12 h-12 mx-auto mb-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <p>No services added yet. Click "Add Service" to get started.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Header for desktop */}
              <div className="hidden lg:grid lg:grid-cols-12 gap-4 text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide pb-2 border-b border-slate-200 dark:border-slate-600">
                <div className="col-span-5">Description</div>
                <div className="col-span-2 text-center">Quantity</div>
                <div className="col-span-2 text-center">Unit Price</div>
                <div className="col-span-2 text-center">Total</div>
                <div className="col-span-1"></div>
              </div>
              
              {formData.services.map((service, index) => (
                <div key={service.id} className="bg-slate-50 dark:bg-slate-700/50 p-4 rounded-lg border border-slate-200 dark:border-slate-600">
                  {/* Mobile Layout */}
                  <div className="lg:hidden space-y-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Description</label>
                      <input
                        type="text"
                        placeholder="Enter service description..."
                        value={service.description}
                        onChange={(e) => updateService(index, 'description', e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                      />
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Qty</label>
                        <input
                          type="number"
                          placeholder="1"
                          value={service.quantity}
                          onChange={(e) => updateService(index, 'quantity', parseFloat(e.target.value) || 0)}
                          className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Unit Price</label>
                        <input
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          value={service.unitPrice}
                          onChange={(e) => updateService(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                          className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Total</label>
                        <div className="px-3 py-2 bg-slate-100 dark:bg-slate-600 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-300">
                          {formatCurrency(service.total)}
                        </div>
                      </div>
                    </div>
                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={() => removeService(index)}
                        className="inline-flex items-center gap-1 px-3 py-1 text-xs text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        Remove
                      </button>
                    </div>
                  </div>
                  
                  {/* Desktop Layout */}
                  <div className="hidden lg:grid lg:grid-cols-12 gap-4 items-center">
                    <div className="col-span-5">
                      <input
                        type="text"
                        placeholder="Enter service description..."
                        value={service.description}
                        onChange={(e) => updateService(index, 'description', e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                      />
                    </div>
                    <div className="col-span-2">
                      <input
                        type="number"
                        placeholder="1"
                        value={service.quantity}
                        onChange={(e) => updateService(index, 'quantity', parseFloat(e.target.value) || 0)}
                        className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 text-sm text-center focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                      />
                    </div>
                    <div className="col-span-2">
                      <input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        value={service.unitPrice}
                        onChange={(e) => updateService(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                        className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 text-sm text-center focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                      />
                    </div>
                    <div className="col-span-2 text-center">
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                        {formatCurrency(service.total)}
                      </span>
                    </div>
                    <div className="col-span-1 text-center">
                      <button
                        type="button"
                        onClick={() => removeService(index)}
                        className="p-1 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Totals */}
        <div className="bg-gradient-to-r from-slate-50 to-blue-50 dark:from-slate-800 dark:to-slate-700 p-6 rounded-xl border border-slate-200 dark:border-slate-600 shadow-sm">
          <div className="max-w-md ml-auto space-y-4">
            <div className="flex justify-between items-center py-2">
              <span className="text-slate-600 dark:text-slate-400 font-medium">Subtotal:</span>
              <span className="text-lg font-semibold text-slate-800 dark:text-slate-200">
                {formatCurrency(formData.subtotal)}
              </span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-slate-600 dark:text-slate-400 font-medium">
                VAT ({formData.config?.vatRate || 5}%):
              </span>
              <span className="text-lg font-semibold text-slate-800 dark:text-slate-200">
                {formatCurrency(formData.tax)}
              </span>
            </div>
            <div className="border-t-2 border-slate-300 dark:border-slate-600 pt-4">
              <div className="flex justify-between items-center">
                <span className="text-xl font-bold text-slate-800 dark:text-slate-100">Total:</span>
                <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {formatCurrency(formData.totalAmount)}
                </span>
              </div>
            </div>
          </div>
        </div>



        {/* Notes */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-2 bg-slate-100 dark:bg-slate-700 rounded-lg">
              <svg className="w-5 h-5 text-slate-600 dark:text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
              Additional Notes
            </h3>
          </div>
          <textarea
            value={formData.notes || ''}
            onChange={(e) => handleInputChange('notes', e.target.value)}
            rows={4}
            placeholder="Add any additional notes, terms, or special instructions for this invoice..."
            className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-slate-500 focus:border-transparent transition-all resize-none"
          />
        </div>
      </form>
    </div>
  )
}