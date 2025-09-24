import type { InspectionData } from '@/types'
import jsPDF from 'jspdf'
import 'jspdf-autotable'

// Extend jsPDF types for autotable
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF
    lastAutoTable: {
      finalY: number
    }
  }
}

export async function generateWaslaInspectionPDF(inspection: InspectionData): Promise<void> {
  const doc = new jsPDF('p', 'mm', 'a4')
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const margin = 15
  const contentWidth = pageWidth - (margin * 2)
  let currentY = margin

  // Helper function to check page breaks
  const checkPageBreak = (requiredSpace: number = 30): boolean => {
    if (currentY + requiredSpace > pageHeight - 20) {
      doc.addPage()
      currentY = margin
      addPageHeader()
      return true
    }
    return false
  }

  // Add Wasla branding header to each page
  const addPageHeader = () => {
    // Wasla brand colors
    doc.setFillColor(0, 47, 108) // Navy blue
    doc.rect(0, 0, pageWidth, 25, 'F')

    doc.setTextColor(255, 255, 255)
    doc.setFontSize(18)
    doc.setFont(undefined, 'bold')
    doc.text('WASLA REAL ESTATE SOLUTIONS', pageWidth / 2, 10, { align: 'center' })
    doc.setFontSize(10)
    doc.setFont(undefined, 'normal')
    doc.text('وصلة للحلول العقارية', pageWidth / 2, 17, { align: 'center' })
    doc.setTextColor(0, 0, 0)
  }

  // First page header
  addPageHeader()
  currentY = 35

  // Title
  doc.setFontSize(22)
  doc.setFont(undefined, 'bold')
  doc.setTextColor(0, 47, 108)
  doc.text('PROPERTY INSPECTION REPORT', pageWidth / 2, currentY, { align: 'center' })
  currentY += 8
  doc.setFontSize(14)
  doc.text('تقرير فحص العقار', pageWidth / 2, currentY, { align: 'center' })
  doc.setTextColor(0, 0, 0)
  currentY += 15

  // Property Details Box
  doc.setFillColor(245, 247, 250)
  doc.roundedRect(margin, currentY, contentWidth, 50, 3, 3, 'F')

  doc.setFontSize(12)
  doc.setFont(undefined, 'bold')
  currentY += 8

  // Two-column layout for property details
  const leftColumn = margin + 5
  const rightColumn = pageWidth / 2 + 5
  let detailY = currentY

  // Client Name
  doc.text('Client Name:', leftColumn, detailY)
  doc.setFont(undefined, 'normal')
  doc.text(inspection.clientName || 'Not Specified', leftColumn + 30, detailY)

  // Property Location
  doc.setFont(undefined, 'bold')
  doc.text('Property:', rightColumn, detailY)
  doc.setFont(undefined, 'normal')
  const location = inspection.propertyLocation || 'Not Specified'
  const locationLines = doc.splitTextToSize(location, 70)
  doc.text(locationLines[0], rightColumn + 20, detailY)
  detailY += 8

  // Property Type
  doc.setFont(undefined, 'bold')
  doc.text('Type:', leftColumn, detailY)
  doc.setFont(undefined, 'normal')
  doc.text(inspection.propertyType || 'Not Specified', leftColumn + 30, detailY)

  // Inspector
  doc.setFont(undefined, 'bold')
  doc.text('Inspector:', rightColumn, detailY)
  doc.setFont(undefined, 'normal')
  doc.text(inspection.inspectorName || 'Wasla Inspector', rightColumn + 20, detailY)
  detailY += 8

  // Inspection Date
  doc.setFont(undefined, 'bold')
  doc.text('Date:', leftColumn, detailY)
  doc.setFont(undefined, 'normal')
  const inspectionDate = inspection.inspectionDate
    ? new Date(inspection.inspectionDate).toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'long',
        year: 'numeric'
      })
    : new Date().toLocaleDateString('en-GB')
  doc.text(inspectionDate, leftColumn + 30, detailY)

  // Report ID
  doc.setFont(undefined, 'bold')
  doc.text('Report ID:', rightColumn, detailY)
  doc.setFont(undefined, 'normal')
  const reportId = `WASLA-${new Date().getFullYear()}-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`
  doc.text(reportId, rightColumn + 20, detailY)

  currentY = currentY + 52

  // Overview Section (Bilingual)
  checkPageBreak(80)
  doc.setFillColor(0, 47, 108)
  doc.rect(margin, currentY, contentWidth, 8, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(12)
  doc.setFont(undefined, 'bold')
  doc.text('OVERVIEW / نظرة عامة', margin + 3, currentY + 5.5)
  doc.setTextColor(0, 0, 0)
  currentY += 12

  // Dear Client section
  doc.setFontSize(11)
  doc.setFont(undefined, 'normal')
  const overviewText = `Dear ${inspection.clientName || 'Valued Client'},

Thank you for choosing Wasla Real Estate Solutions to carry out the inspection of your property. This report presents the inspection findings and measurements as documented on site on the date of the visit.

Please review the attached report carefully before making your final decision. If you require any further clarification, please feel free to contact us.`

  const overviewLines = doc.splitTextToSize(overviewText, contentWidth)
  doc.text(overviewLines, margin, currentY)
  currentY += overviewLines.length * 5 + 10

  // Contact Information Box
  doc.setFillColor(240, 244, 248)
  doc.roundedRect(margin, currentY, contentWidth, 20, 2, 2, 'F')
  doc.setFontSize(10)
  currentY += 6
  doc.text('Email: info@waslaoman.com', margin + 5, currentY)
  currentY += 5
  doc.text('Mobile: +968 90699799', margin + 5, currentY)
  currentY += 5
  doc.text('Working Hours: 9:00 AM - 5:00 PM', margin + 5, currentY)
  currentY += 12

  // Executive Summary if available
  if (inspection.aiSummary) {
    checkPageBreak(40)
    doc.setFillColor(0, 47, 108)
    doc.rect(margin, currentY, contentWidth, 8, 'F')
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(12)
    doc.setFont(undefined, 'bold')
    doc.text('EXECUTIVE SUMMARY', margin + 3, currentY + 5.5)
    doc.setTextColor(0, 0, 0)
    currentY += 12

    doc.setFontSize(10)
    doc.setFont(undefined, 'normal')
    const summaryLines = doc.splitTextToSize(inspection.aiSummary, contentWidth)
    doc.text(summaryLines, margin, currentY)
    currentY += summaryLines.length * 5 + 10
  }

  // Inspection Findings
  checkPageBreak(30)
  doc.setFillColor(0, 47, 108)
  doc.rect(margin, currentY, contentWidth, 8, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(12)
  doc.setFont(undefined, 'bold')
  doc.text('INSPECTION FINDINGS / نتائج الفحص', margin + 3, currentY + 5.5)
  doc.setTextColor(0, 0, 0)
  currentY += 12

  // Status Legend
  doc.setFontSize(9)
  doc.setFillColor(34, 197, 94)
  doc.circle(margin + 5, currentY, 2, 'F')
  doc.text('Pass / نجح', margin + 10, currentY + 1)

  doc.setFillColor(239, 68, 68)
  doc.circle(margin + 45, currentY, 2, 'F')
  doc.text('Fail / فشل', margin + 50, currentY + 1)

  doc.setFillColor(156, 163, 175)
  doc.circle(margin + 80, currentY, 2, 'F')
  doc.text('N/A / غير مطبق', margin + 85, currentY + 1)
  currentY += 10

  // Prepare data for table format
  let tableData: any[] = []
  let itemCounter = 1

  inspection.areas.forEach(area => {
    // Add area header row
    tableData.push([{
      content: area.name.toUpperCase(),
      colSpan: 5,
      styles: {
        fillColor: [240, 244, 248],
        fontStyle: 'bold',
        fontSize: 11,
        textColor: [0, 47, 108]
      }
    }])

    area.items.forEach(item => {
      const status = item.status || 'N/A'
      const statusColor = status === 'Pass' ? [34, 197, 94] :
                         status === 'Fail' ? [239, 68, 68] : [156, 163, 175]

      tableData.push([
        itemCounter++,
        item.category || '',
        item.point || '',
        {
          content: status,
          styles: { textColor: statusColor, fontStyle: 'bold' }
        },
        item.comments || item.location || '-'
      ])
    })
  })

  // Create inspection items table
  doc.autoTable({
    head: [['#', 'Category', 'Inspection Point', 'Status', 'Comments/Location']],
    body: tableData,
    startY: currentY,
    margin: { left: margin, right: margin },
    theme: 'grid',
    headStyles: {
      fillColor: [0, 47, 108],
      textColor: 255,
      fontSize: 10,
      fontStyle: 'bold'
    },
    bodyStyles: {
      fontSize: 9
    },
    columnStyles: {
      0: { cellWidth: 10 },
      1: { cellWidth: 30 },
      2: { cellWidth: 60 },
      3: { cellWidth: 20 },
      4: { cellWidth: 60 }
    }
  })

  currentY = doc.lastAutoTable.finalY + 10

  // Statistics Summary
  checkPageBreak(40)
  let passCount = 0, failCount = 0, naCount = 0
  inspection.areas.forEach(area => {
    area.items.forEach(item => {
      const status = item.status || 'N/A'
      if (status === 'Pass') passCount++
      else if (status === 'Fail') failCount++
      else naCount++
    })
  })
  const totalItems = passCount + failCount + naCount

  doc.setFillColor(240, 244, 248)
  doc.roundedRect(margin, currentY, contentWidth, 35, 3, 3, 'F')

  doc.setFontSize(12)
  doc.setFont(undefined, 'bold')
  doc.text('INSPECTION STATISTICS', margin + 5, currentY + 8)

  doc.setFontSize(10)
  doc.setFont(undefined, 'normal')
  doc.text(`Total Items Inspected: ${totalItems}`, margin + 5, currentY + 16)

  doc.setTextColor(34, 197, 94)
  doc.text(`Passed: ${passCount}`, margin + 5, currentY + 23)

  doc.setTextColor(239, 68, 68)
  doc.text(`Failed: ${failCount}`, margin + 55, currentY + 23)

  doc.setTextColor(156, 163, 175)
  doc.text(`N/A: ${naCount}`, margin + 100, currentY + 23)

  doc.setTextColor(0, 0, 0)
  if (totalItems > 0) {
    const passRate = Math.round((passCount / (passCount + failCount)) * 100) || 0
    doc.setFont(undefined, 'bold')
    doc.setFontSize(11)
    doc.text(`Overall Pass Rate: ${passRate}%`, margin + 5, currentY + 30)
  }

  // Add new page for disclaimer
  doc.addPage()
  addPageHeader()
  currentY = 35

  // Disclaimer Section
  doc.setFillColor(0, 47, 108)
  doc.rect(margin, currentY, contentWidth, 8, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(12)
  doc.setFont(undefined, 'bold')
  doc.text('IMPORTANT NOTICES / ملاحظات مهمة', margin + 3, currentY + 5.5)
  doc.setTextColor(0, 0, 0)
  currentY += 12

  // Disclaimer points
  const disclaimerSections = [
    {
      title: 'No property is perfect / لا يوجد عقار مثالي',
      content: 'Every building has imperfections or items that are ready for maintenance. This report illuminates the realities of the property to help you make informed decisions.'
    },
    {
      title: 'This report is not an appraisal / هذا التقرير ليس تقييمًا سعريًا',
      content: 'This inspection focuses on the condition and functionality of the property, not its market value.'
    },
    {
      title: 'Maintenance costs are normal / تكاليف الصيانة أمر طبيعي',
      content: 'Property owners should plan to spend around 1% of the total property value in maintenance costs annually.'
    }
  ]

  doc.setFontSize(10)
  disclaimerSections.forEach(section => {
    checkPageBreak(25)
    doc.setFont(undefined, 'bold')
    doc.text(section.title, margin, currentY)
    currentY += 5
    doc.setFont(undefined, 'normal')
    const lines = doc.splitTextToSize(section.content, contentWidth)
    doc.text(lines, margin, currentY)
    currentY += lines.length * 5 + 8
  })

  // Confidentiality Section
  checkPageBreak(40)
  doc.setFillColor(255, 243, 224)
  doc.roundedRect(margin, currentY, contentWidth, 35, 3, 3, 'F')
  doc.setFontSize(11)
  doc.setFont(undefined, 'bold')
  doc.setTextColor(133, 77, 14)
  doc.text('CONFIDENTIALITY / السرية', margin + 5, currentY + 8)
  doc.setFont(undefined, 'normal')
  doc.setFontSize(9)
  doc.setTextColor(0, 0, 0)
  const confidentialityText = 'This inspection report is prepared exclusively for the client and may not be relied upon by any other person. The report may be shared with relevant parties in the transaction but is not intended to benefit them directly or indirectly.'
  const confLines = doc.splitTextToSize(confidentialityText, contentWidth - 10)
  doc.text(confLines, margin + 5, currentY + 15)
  currentY += 45

  // Signature Section
  checkPageBreak(50)
  doc.setFontSize(10)
  doc.setFont(undefined, 'normal')

  // Client signature
  doc.text('Client Name / اسم العميل:', margin, currentY)
  doc.line(margin + 40, currentY, margin + 100, currentY)
  doc.text(inspection.clientName || '', margin + 42, currentY - 1)

  currentY += 10
  doc.text('Signature / التوقيع:', margin, currentY)
  doc.line(margin + 40, currentY, margin + 100, currentY)

  // Inspector signature
  currentY += 10
  doc.text('Prepared by / أعد التقرير:', margin, currentY)
  doc.text(inspection.inspectorName || 'Wasla Inspector', margin + 42, currentY - 1)

  currentY += 10
  doc.text('Date / التاريخ:', margin, currentY)
  doc.text(new Date().toLocaleDateString('en-GB'), margin + 42, currentY - 1)

  // Company Footer
  currentY = pageHeight - 25
  doc.setFillColor(0, 47, 108)
  doc.rect(0, currentY, pageWidth, 25, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(9)
  doc.text('Wasla Property Solutions CR. 1068375', pageWidth / 2, currentY + 8, { align: 'center' })
  doc.text('وصلة للحلول العقارية س.ت 1068375', pageWidth / 2, currentY + 14, { align: 'center' })
  doc.text('www.waslaoman.com | info@waslaoman.com | +968 90699799', pageWidth / 2, currentY + 20, { align: 'center' })

  // Add page numbers to all pages
  const pageCount = doc.internal.getNumberOfPages()
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    doc.setFontSize(8)
    doc.setTextColor(100, 100, 100)
    doc.text(`Page ${i} of ${pageCount}`, pageWidth - margin, pageHeight - 30)
  }

  // Generate filename
  const clientName = inspection.clientName || 'Client'
  const sanitizedName = clientName.replace(/[^a-zA-Z0-9]/g, '_')
  const dateStr = new Date().toISOString().split('T')[0]
  const fileName = `Wasla_Inspection_${sanitizedName}_${dateStr}.pdf`

  // Save the PDF
  doc.save(fileName)
}