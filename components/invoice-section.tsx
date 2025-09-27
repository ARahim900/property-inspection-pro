"use client"

import React, { useState } from 'react'
import type { Invoice } from '@/types'
import { useInvoices } from '@/hooks/use-invoices'
import { InvoiceForm } from './invoice-form'
import { InvoiceList } from './invoice-list'
import { generateInvoicePDF } from '@/lib/pdf/invoice-pdf'

export function InvoiceSection() {
  const { invoices, loading, saveInvoice, deleteInvoice } = useInvoices()
  const [currentView, setCurrentView] = useState<'list' | 'create' | 'edit'>('list')
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  const handleCreateNew = () => {
    setEditingInvoice(null)
    setCurrentView('create')
  }

  const handleEdit = (invoice: Invoice) => {
    setEditingInvoice(invoice)
    setCurrentView('edit')
  }

  const handleSave = async (invoice: Invoice) => {
    setIsSaving(true)
    try {
      await saveInvoice(invoice)
      setCurrentView('list')
      setEditingInvoice(null)
    } catch (error) {
      console.error('Error saving invoice:', error)
      alert('Failed to save invoice. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancel = () => {
    setCurrentView('list')
    setEditingInvoice(null)
  }

  const handleDelete = async (id: string) => {
    try {
      await deleteInvoice(id)
    } catch (error) {
      console.error('Error deleting invoice:', error)
      alert('Failed to delete invoice. Please try again.')
    }
  }

  const handleExportPDF = (invoice: Invoice) => {
    try {
      generateInvoicePDF(invoice)
    } catch (error) {
      console.error('Error generating PDF:', error)
      alert('Failed to generate PDF. Please try again.')
    }
  }

  const getStats = () => {
    const totalInvoices = invoices.length
    const paidAmount = invoices
      .filter(inv => inv.status === 'Paid')
      .reduce((sum, inv) => sum + inv.totalAmount, 0)
    const unpaidAmount = invoices
      .filter(inv => inv.status === 'Unpaid')
      .reduce((sum, inv) => sum + inv.totalAmount, 0)
    const draftCount = invoices.filter(inv => inv.status === 'Draft').length

    return { totalInvoices, paidAmount, unpaidAmount, draftCount }
  }

  const stats = getStats()

  if (currentView === 'create' || currentView === 'edit') {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <InvoiceForm
            invoice={editingInvoice || undefined}
            onSave={handleSave}
            onCancel={handleCancel}
          />
          {isSaving && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-xl">
                <div className="flex items-center gap-3">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                  <span className="text-slate-700 dark:text-slate-300">Saving invoice...</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-100">
                Invoice Management
              </h1>
              <p className="text-slate-600 dark:text-slate-400 mt-1">
                Create, manage, and export professional invoices
              </p>
            </div>
            <button
              onClick={handleCreateNew}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium shadow-sm transition-colors flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
              </svg>
              Create Invoice
            </button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-sm border dark:border-slate-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                    Total Invoices
                  </p>
                  <p className="text-2xl font-bold text-slate-800 dark:text-slate-100">
                    {stats.totalInvoices}
                  </p>
                </div>
                <div className="p-3 bg-blue-100 dark:bg-blue-900/50 rounded-full">
                  <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-sm border dark:border-slate-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                    Paid Amount
                  </p>
                  <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                    OMR {stats.paidAmount.toFixed(2)}
                  </p>
                </div>
                <div className="p-3 bg-green-100 dark:bg-green-900/50 rounded-full">
                  <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-sm border dark:border-slate-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                    Outstanding
                  </p>
                  <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                    OMR {stats.unpaidAmount.toFixed(2)}
                  </p>
                </div>
                <div className="p-3 bg-red-100 dark:bg-red-900/50 rounded-full">
                  <svg className="w-6 h-6 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-sm border dark:border-slate-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                    Draft Invoices
                  </p>
                  <p className="text-2xl font-bold text-slate-600 dark:text-slate-400">
                    {stats.draftCount}
                  </p>
                </div>
                <div className="p-3 bg-slate-100 dark:bg-slate-700 rounded-full">
                  <svg className="w-6 h-6 text-slate-600 dark:text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Invoice List */}
        <InvoiceList
          invoices={invoices}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onExportPDF={handleExportPDF}
          loading={loading}
        />
      </div>
    </div>
  )
}