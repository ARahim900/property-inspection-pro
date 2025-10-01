import type { Invoice } from '@/types'

// Extend jsPDF type to include autoTable
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF
  }
}

export async function generateInvoicePDF(invoice: Invoice): Promise<void> {
  // Dynamically import pdf libraries to avoid SSR "window is not defined" errors
  const { default: jsPDF } = await import('jspdf')
  await import('jspdf-autotable')

  const doc = new jsPDF()
  const pageWidth = doc.internal.pageSize.width
  const pageHeight = doc.internal.pageSize.height
  
  // Modern color scheme
  const primaryColor = [59, 130, 246] // Blue-600
  const secondaryColor = [99, 102, 241] // Indigo-600
  const textColor = [51, 65, 85] // Slate-700
  const lightGray = [248, 250, 252] // Slate-50
  
  // Header
  doc.setFillColor(...primaryColor)
  doc.rect(0, 0, pageWidth, 40, 'F')
  
  // Company/Inspector Info (you can customize this)
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(24)
  doc.setFont('helvetica', 'bold')
  doc.text('PROPERTY INSPECTION', 20, 25)
  
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.text('Professional Property Inspection Services', 20, 32)
  
  // Invoice Title and Number
  doc.setTextColor(...textColor)
  doc.setFontSize(20)
  doc.setFont('helvetica', 'bold')
  doc.text('INVOICE', pageWidth - 20, 60, { align: 'right' })
  
  doc.setFontSize(12)
  doc.setFont('helvetica', 'normal')
  doc.text(`Invoice #: ${invoice.invoiceNumber}`, pageWidth - 20, 70, { align: 'right' })
  doc.text(`Date: ${formatDate(invoice.invoiceDate)}`, pageWidth - 20, 78, { align: 'right' })
  doc.text(`Due Date: ${formatDate(invoice.dueDate)}`, pageWidth - 20, 86, { align: 'right' })
  
  // Status badge
  const statusColors: { [key: string]: number[] } = {
    'Paid': [34, 197, 94], // Green
    'Unpaid': [239, 68, 68], // Red
    'Partial': [245, 158, 11], // Yellow
    'Draft': [107, 114, 128], // Gray
  }
  
  const statusColor = statusColors[invoice.status] || statusColors['Draft']
  doc.setFillColor(...statusColor)
  doc.roundedRect(pageWidth - 60, 92, 40, 8, 2, 2, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(8)
  doc.setFont('helvetica', 'bold')
  doc.text(invoice.status.toUpperCase(), pageWidth - 40, 97.5, { align: 'center' })
  
  // Client Information
  doc.setTextColor(...textColor)
  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.text('Bill To:', 20, 60)
  
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  const clientLines = [
    invoice.clientName,
    invoice.clientEmail,
    ...invoice.clientAddress.split('\n')
  ]
  
  clientLines.forEach((line, index) => {
    doc.text(line, 20, 70 + (index * 6))
  })
  
  // Property Information
  if (invoice.propertyLocation) {
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(12)
    doc.text('Property:', 20, 110)
    
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)
    doc.text(invoice.propertyLocation, 20, 120)
    
    if (invoice.propertyType && invoice.propertyArea) {
      doc.text(`Type: ${invoice.propertyType} • Area: ${invoice.propertyArea} m²`, 20, 128)
    }
  }
  
  // Services Table
  const tableStartY = invoice.propertyLocation ? 145 : 120
  
  // Prepare table data
  const tableData = invoice.services.map(service => [
    service.description,
    service.quantity.toString(),
    formatCurrency(service.unitPrice, invoice.config?.currency),
    formatCurrency(service.total, invoice.config?.currency)
  ])
  
  // Add property-based service if applicable
  if (invoice.propertyType && invoice.propertyArea) {
    const rate = invoice.propertyType === 'Residential' 
      ? invoice.config?.residentialRate || 1.5
      : invoice.config?.commercialRate || 2.0
    
    const propertyTotal = invoice.propertyArea * rate
    tableData.push([
      `${invoice.propertyType} Property Inspection (${invoice.propertyArea} m²)`,
      invoice.propertyArea.toString(),
      formatCurrency(rate, invoice.config?.currency),
      formatCurrency(propertyTotal, invoice.config?.currency)
    ])
  }
  
  doc.autoTable({
    startY: tableStartY,
    head: [['Description', 'Quantity', 'Unit Price', 'Total']],
    body: tableData,
    theme: 'grid',
    headStyles: {
      fillColor: primaryColor,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 10
    },
    bodyStyles: {
      fontSize: 9,
      textColor: textColor
    },
    columnStyles: {
      0: { cellWidth: 80 },
      1: { cellWidth: 25, halign: 'center' },
      2: { cellWidth: 35, halign: 'right' },
      3: { cellWidth: 35, halign: 'right' }
    },
    margin: { left: 20, right: 20 }
  })
  
  // Totals
  const finalY = (doc as any).lastAutoTable.finalY + 10
  const totalsX = pageWidth - 90
  
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  
  // Subtotal
  doc.text('Subtotal:', totalsX, finalY)
  doc.text(formatCurrency(invoice.subtotal, invoice.config?.currency), pageWidth - 20, finalY, { align: 'right' })
  
  // VAT
  const vatRate = invoice.config?.vatRate || 5
  doc.text(`VAT (${vatRate}%):`, totalsX, finalY + 8)
  doc.text(formatCurrency(invoice.tax, invoice.config?.currency), pageWidth - 20, finalY + 8, { align: 'right' })
  
  // Total
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(12)
  doc.setDrawColor(...primaryColor)
  doc.line(totalsX, finalY + 15, pageWidth - 20, finalY + 15)
  doc.text('Total:', totalsX, finalY + 25)
  doc.text(formatCurrency(invoice.totalAmount, invoice.config?.currency), pageWidth - 20, finalY + 25, { align: 'right' })
  
  // Notes
  if (invoice.notes) {
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(10)
    doc.text('Notes:', 20, finalY + 45)
    
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    const noteLines = doc.splitTextToSize(invoice.notes, pageWidth - 40)
    doc.text(noteLines, 20, finalY + 55)
  }
  
  // Footer
  const footerY = pageHeight - 30
  doc.setFontSize(8)
  doc.setTextColor(107, 114, 128) // Gray
  doc.text('Thank you for your business!', pageWidth / 2, footerY, { align: 'center' })
  doc.text(`Generated on ${new Date().toLocaleDateString()}`, pageWidth / 2, footerY + 8, { align: 'center' })
  
  // Save the PDF
  doc.save(`Invoice-${invoice.invoiceNumber}.pdf`)
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-GB', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

function formatCurrency(amount: number, currency = 'OMR'): string {
  return `${currency} ${amount.toFixed(2)}`
}