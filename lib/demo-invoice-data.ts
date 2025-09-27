import type { Invoice, InvoiceServiceItem } from '@/types'
import { DEFAULT_INVOICE_CONFIG } from '@/constants'

export function generateDemoInvoices(): Invoice[] {
  const today = new Date()
  const demoInvoices: Invoice[] = []

  // Demo Invoice 1 - Residential Property
  const invoice1: Invoice = {
    id: 'demo_inv_001',
    invoiceNumber: 'INV-2024-001',
    invoiceDate: new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 7 days ago
    dueDate: new Date(today.getTime() + 23 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 23 days from now
    clientId: 'demo_client_001',
    clientName: 'Ahmed Al Farsi',
    clientAddress: 'Villa 123, Al Mouj\nMuscat, Oman',
    clientEmail: 'ahmed.farsi@email.com',
    propertyLocation: 'Villa 123, Al Mouj, Muscat',
    propertyType: 'Residential',
    propertyArea: 350,
    services: [
      {
        id: 'service_001',
        description: 'Comprehensive Property Inspection',
        quantity: 1,
        unitPrice: 150,
        total: 150
      },
      {
        id: 'service_002',
        description: 'Electrical System Audit',
        quantity: 1,
        unitPrice: 100,
        total: 100
      }
    ],
    subtotal: 775, // 150 + 100 + (350 * 1.5)
    tax: 38.75, // 5% of 775
    totalAmount: 813.75,
    amountPaid: 813.75,
    status: 'Paid',
    notes: 'Property inspection completed successfully. All major systems are in good condition.',
    config: DEFAULT_INVOICE_CONFIG
  }

  // Calculate property-based service for invoice 1
  const propertyService1: InvoiceServiceItem = {
    id: 'property_service_001',
    description: 'Residential Property Inspection (350 m²)',
    quantity: 350,
    unitPrice: 1.5,
    total: 525
  }
  invoice1.services.push(propertyService1)

  // Demo Invoice 2 - Commercial Property
  const invoice2: Invoice = {
    id: 'demo_inv_002',
    invoiceNumber: 'INV-2024-002',
    invoiceDate: new Date(today.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 3 days ago
    dueDate: new Date(today.getTime() + 27 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 27 days from now
    clientId: 'demo_client_002',
    clientName: 'Global Investments LLC',
    clientAddress: 'PO Box 500, PC 112\nRuwi, Oman',
    clientEmail: 'contact@globalinvest.com',
    propertyLocation: 'Office Building, Knowledge Oasis Muscat',
    propertyType: 'Commercial',
    propertyArea: 1200,
    services: [
      {
        id: 'service_003',
        description: 'Commercial Property Inspection',
        quantity: 1,
        unitPrice: 300,
        total: 300
      },
      {
        id: 'service_004',
        description: 'Fire Safety System Check',
        quantity: 1,
        unitPrice: 150,
        total: 150
      }
    ],
    subtotal: 2850, // 300 + 150 + (1200 * 2)
    tax: 142.5, // 5% of 2850
    totalAmount: 2992.5,
    amountPaid: 0,
    status: 'Unpaid',
    notes: 'Commercial inspection for office building. Fire safety systems require attention.',
    config: DEFAULT_INVOICE_CONFIG
  }

  // Calculate property-based service for invoice 2
  const propertyService2: InvoiceServiceItem = {
    id: 'property_service_002',
    description: 'Commercial Property Inspection (1200 m²)',
    quantity: 1200,
    unitPrice: 2.0,
    total: 2400
  }
  invoice2.services.push(propertyService2)

  // Demo Invoice 3 - Draft Invoice
  const invoice3: Invoice = {
    id: 'demo_inv_003',
    invoiceNumber: 'INV-2024-003',
    invoiceDate: today.toISOString().split('T')[0],
    dueDate: new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days from now
    clientId: 'demo_client_003',
    clientName: 'Fatima Al Balushi',
    clientAddress: 'Apartment 7B, Qurum Heights\nMuscat, Oman',
    clientEmail: 'fatima.b@email.com',
    propertyLocation: 'Apartment 7B, Qurum Heights',
    propertyType: 'Residential',
    propertyArea: 180,
    services: [
      {
        id: 'service_005',
        description: 'Standard Residential Inspection',
        quantity: 1,
        unitPrice: 150,
        total: 150
      }
    ],
    subtotal: 420, // 150 + (180 * 1.5)
    tax: 21, // 5% of 420
    totalAmount: 441,
    amountPaid: 0,
    status: 'Draft',
    notes: 'Draft invoice for apartment inspection. Awaiting client confirmation.',
    config: DEFAULT_INVOICE_CONFIG
  }

  // Calculate property-based service for invoice 3
  const propertyService3: InvoiceServiceItem = {
    id: 'property_service_003',
    description: 'Residential Property Inspection (180 m²)',
    quantity: 180,
    unitPrice: 1.5,
    total: 270
  }
  invoice3.services.push(propertyService3)

  // Demo Invoice 4 - Partial Payment
  const invoice4: Invoice = {
    id: 'demo_inv_004',
    invoiceNumber: 'INV-2024-004',
    invoiceDate: new Date(today.getTime() - 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 10 days ago
    dueDate: new Date(today.getTime() + 20 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 20 days from now
    clientId: 'demo_client_004',
    clientName: 'Mohammed Al Rashid',
    clientAddress: 'Villa 456, Al Khuwair\nMuscat, Oman',
    clientEmail: 'mohammed.rashid@email.com',
    propertyLocation: 'Villa 456, Al Khuwair',
    propertyType: 'Residential',
    propertyArea: 280,
    services: [
      {
        id: 'service_006',
        description: 'Comprehensive Property Inspection',
        quantity: 1,
        unitPrice: 150,
        total: 150
      },
      {
        id: 'service_007',
        description: 'Plumbing System Check',
        quantity: 1,
        unitPrice: 100,
        total: 100
      },
      {
        id: 'service_008',
        description: 'Re-inspection (Follow-up)',
        quantity: 1,
        unitPrice: 75,
        total: 75
      }
    ],
    subtotal: 745, // 150 + 100 + 75 + (280 * 1.5)
    tax: 37.25, // 5% of 745
    totalAmount: 782.25,
    amountPaid: 400,
    status: 'Partial',
    notes: 'Initial inspection completed. Follow-up inspection scheduled after repairs.',
    config: DEFAULT_INVOICE_CONFIG
  }

  // Calculate property-based service for invoice 4
  const propertyService4: InvoiceServiceItem = {
    id: 'property_service_004',
    description: 'Residential Property Inspection (280 m²)',
    quantity: 280,
    unitPrice: 1.5,
    total: 420
  }
  invoice4.services.push(propertyService4)

  demoInvoices.push(invoice1, invoice2, invoice3, invoice4)
  return demoInvoices
}

export function getDemoInvoiceStats() {
  const invoices = generateDemoInvoices()
  
  const totalInvoices = invoices.length
  const paidAmount = invoices
    .filter(inv => inv.status === 'Paid')
    .reduce((sum, inv) => sum + inv.totalAmount, 0)
  const unpaidAmount = invoices
    .filter(inv => inv.status === 'Unpaid')
    .reduce((sum, inv) => sum + inv.totalAmount, 0)
  const partialAmount = invoices
    .filter(inv => inv.status === 'Partial')
    .reduce((sum, inv) => sum + inv.totalAmount, 0)
  const draftCount = invoices.filter(inv => inv.status === 'Draft').length

  return {
    totalInvoices,
    paidAmount,
    unpaidAmount,
    partialAmount,
    draftCount,
    totalValue: invoices.reduce((sum, inv) => sum + inv.totalAmount, 0)
  }
}