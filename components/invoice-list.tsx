"use client"

import React, { useState } from 'react'
import type { Invoice } from '@/types'
import { cn } from '@/lib/utils'

interface InvoiceListProps {
  invoices: Invoice[]
  onEdit: (invoice: Invoice) => void
  onDelete: (id: string) => void
  onExportPDF: (invoice: Invoice) => void
  loading?: boolean
}

export function InvoiceList({ invoices, onEdit, onDelete, onExportPDF, loading }: InvoiceListProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [sortBy, setSortBy] = useState<'date' | 'amount' | 'client'>('date')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')

  // Filter and sort invoices
  const filteredInvoices = invoices
    .filter(invoice => {
      const matchesSearch = 
        invoice.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        invoice.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        invoice.propertyLocation.toLowerCase().includes(searchTerm.toLowerCase())
      
      const matchesStatus = statusFilter === 'all' || invoice.status === statusFilter
      
      return matchesSearch && matchesStatus
    })
    .sort((a, b) => {
      let comparison = 0
      
      switch (sortBy) {
        case 'date':
          comparison = new Date(a.invoiceDate).getTime() - new Date(b.invoiceDate).getTime()
          break
        case 'amount':
          comparison = a.totalAmount - b.totalAmount
          break
        case 'client':
          comparison = a.clientName.localeCompare(b.clientName)
          break
      }
      
      return sortOrder === 'asc' ? comparison : -comparison
    })

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Paid':
        return 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300'
      case 'Unpaid':
        return 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300'
      case 'Partial':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300'
      case 'Draft':
        return 'bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-300'
      default:
        return 'bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-300'
    }
  }

  const formatCurrency = (amount: number, currency = 'OMR') => {
    return `${currency} ${amount.toFixed(2)}`
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-slate-600 dark:text-slate-400">Loading invoices...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Filters and Search */}
      <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
        <div className="flex items-center gap-2 mb-4">
          <div className="p-2 bg-blue-100 dark:bg-blue-900/50 rounded-lg">
            <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.414A1 1 0 013 6.707V4z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
            Filter & Search
          </h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Search
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-4 w-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                placeholder="Search invoices..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-3 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Status
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            >
              <option value="all">All Statuses</option>
              <option value="Draft">📝 Draft</option>
              <option value="Unpaid">⏳ Unpaid</option>
              <option value="Partial">💰 Partial</option>
              <option value="Paid">✅ Paid</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Sort By
            </label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'date' | 'amount' | 'client')}
              className="w-full px-3 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            >
              <option value="date">📅 Date</option>
              <option value="amount">💰 Amount</option>
              <option value="client">👤 Client</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Order
            </label>
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value as 'asc' | 'desc')}
              className="w-full px-3 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            >
              <option value="desc">⬇️ Newest First</option>
              <option value="asc">⬆️ Oldest First</option>
            </select>
          </div>
        </div>
      </div>

      {/* Invoice Cards */}
      <div className="grid gap-4">
        {filteredInvoices.length === 0 ? (
          <div className="text-center py-12 bg-white dark:bg-slate-800 rounded-lg shadow-sm border dark:border-slate-700">
            <div className="text-slate-400 dark:text-slate-500 mb-2">
              <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <p className="text-slate-600 dark:text-slate-400">
              {searchTerm || statusFilter !== 'all' ? 'No invoices match your filters' : 'No invoices found'}
            </p>
          </div>
        ) : (
          filteredInvoices.map((invoice) => (
            <div
              key={invoice.id}
              className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 hover:shadow-lg hover:border-blue-200 dark:hover:border-blue-700 transition-all duration-200"
            >
              <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-4 mb-6">
                <div className="flex-1">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-3">
                    <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100">
                      {invoice.invoiceNumber}
                    </h3>
                    <span className={cn(
                      'px-3 py-1 rounded-full text-xs font-semibold w-fit',
                      getStatusColor(invoice.status)
                    )}>
                      {invoice.status}
                    </span>
                  </div>
                  <div className="space-y-1">
                    <p className="text-slate-700 dark:text-slate-300 font-medium">
                      {invoice.clientName}
                    </p>
                    <p className="text-slate-500 dark:text-slate-400 text-sm flex items-center gap-1">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      {invoice.propertyLocation}
                    </p>
                  </div>
                </div>
                <div className="text-left lg:text-right">
                  <p className="text-3xl font-bold text-slate-800 dark:text-slate-100 mb-1">
                    {formatCurrency(invoice.totalAmount, invoice.config?.currency)}
                  </p>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    Due: {formatDate(invoice.dueDate)}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                <div className="bg-slate-50 dark:bg-slate-700/50 p-3 rounded-lg">
                  <span className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide">Date</span>
                  <p className="font-semibold text-slate-700 dark:text-slate-300 mt-1">
                    {formatDate(invoice.invoiceDate)}
                  </p>
                </div>
                <div className="bg-slate-50 dark:bg-slate-700/50 p-3 rounded-lg">
                  <span className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide">Services</span>
                  <p className="font-semibold text-slate-700 dark:text-slate-300 mt-1">
                    {invoice.services.length} item{invoice.services.length !== 1 ? 's' : ''}
                  </p>
                </div>
                <div className="bg-slate-50 dark:bg-slate-700/50 p-3 rounded-lg">
                  <span className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide">Subtotal</span>
                  <p className="font-semibold text-slate-700 dark:text-slate-300 mt-1">
                    {formatCurrency(invoice.subtotal, invoice.config?.currency)}
                  </p>
                </div>
                <div className="bg-slate-50 dark:bg-slate-700/50 p-3 rounded-lg">
                  <span className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide">VAT</span>
                  <p className="font-semibold text-slate-700 dark:text-slate-300 mt-1">
                    {formatCurrency(invoice.tax, invoice.config?.currency)}
                  </p>
                </div>
              </div>

              {invoice.propertyType && invoice.propertyArea && (
                <div className="mb-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                  <div className="flex items-center gap-2">
                    <div className="p-1 bg-blue-100 dark:bg-blue-900/50 rounded">
                      <svg className="w-4 h-4 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                    </div>
                    <p className="text-sm font-medium text-blue-800 dark:text-blue-200">
                      Property: {invoice.propertyType} • {invoice.propertyArea} m²
                    </p>
                  </div>
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-2 sm:justify-end">
                <button
                  onClick={() => onExportPDF(invoice)}
                  className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors font-medium"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Export PDF
                </button>
                <button
                  onClick={() => onEdit(invoice)}
                  className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  Edit
                </button>
                <button
                  onClick={() => {
                    if (confirm('Are you sure you want to delete this invoice?')) {
                      onDelete(invoice.id)
                    }
                  }}
                  className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors font-medium"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Summary Stats */}
      {filteredInvoices.length > 0 && (
        <div className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow-sm border dark:border-slate-700">
          <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-3">Summary</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {filteredInvoices.length}
              </p>
              <p className="text-sm text-slate-500 dark:text-slate-500">Total Invoices</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                {formatCurrency(
                  filteredInvoices
                    .filter(inv => inv.status === 'Paid')
                    .reduce((sum, inv) => sum + inv.totalAmount, 0)
                )}
              </p>
              <p className="text-sm text-slate-500 dark:text-slate-500">Paid Amount</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                {formatCurrency(
                  filteredInvoices
                    .filter(inv => inv.status === 'Unpaid')
                    .reduce((sum, inv) => sum + inv.totalAmount, 0)
                )}
              </p>
              <p className="text-sm text-slate-500 dark:text-slate-500">Outstanding</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-600 dark:text-slate-400">
                {formatCurrency(
                  filteredInvoices.reduce((sum, inv) => sum + inv.totalAmount, 0)
                )}
              </p>
              <p className="text-sm text-slate-500 dark:text-slate-500">Total Value</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}