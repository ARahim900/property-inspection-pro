import type { InspectionData } from '@/types'

export async function generateInspectionPDF(inspection: InspectionData): Promise<void> {
  // Dynamically import jsPDF to avoid SSR issues
  const { default: jsPDF } = await import('jspdf')

  const doc = new jsPDF()
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const margin = 20
  const contentWidth = pageWidth - (margin * 2)
  let yPosition = margin

  // Helper function to add a new page if needed
  const checkPageBreak = (requiredSpace: number = 30) => {
    if (yPosition + requiredSpace > pageHeight - margin) {
      doc.addPage()
      yPosition = margin
      return true
    }
    return false
  }

  // Add company header/logo area
  doc.setFillColor(41, 98, 255)
  doc.rect(0, 0, pageWidth, 40, 'F')

  // Title
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(24)
  doc.setFont(undefined, 'bold')
  doc.text('PROPERTY INSPECTION REPORT', pageWidth / 2, 25, { align: 'center' })
  doc.setFont(undefined, 'normal')

  yPosition = 50

  // Reset text color
  doc.setTextColor(0, 0, 0)

  // Client Information Box
  doc.setFillColor(245, 247, 250)
  doc.rect(margin, yPosition, contentWidth, 45, 'F')

  doc.setFontSize(14)
  doc.setFont(undefined, 'bold')
  doc.text('PROPERTY DETAILS', margin + 5, yPosition + 10)
  doc.setFont(undefined, 'normal')

  doc.setFontSize(11)
  const details = [
    { label: 'Client', value: inspection.clientName || 'N/A' },
    { label: 'Property', value: inspection.propertyLocation || 'N/A' },
    { label: 'Type', value: inspection.propertyType || 'N/A' },
    { label: 'Inspector', value: inspection.inspectorName || 'N/A' },
    { label: 'Date', value: new Date(inspection.inspectionDate).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })}
  ]

  let detailY = yPosition + 20
  details.forEach((detail, index) => {
    if (index % 2 === 0) {
      doc.setFont(undefined, 'bold')
      doc.text(`${detail.label}:`, margin + 5, detailY)
      doc.setFont(undefined, 'normal')
      doc.text(detail.value, margin + 35, detailY)
    } else {
      doc.setFont(undefined, 'bold')
      doc.text(`${detail.label}:`, pageWidth / 2 + 5, detailY)
      doc.setFont(undefined, 'normal')
      doc.text(detail.value, pageWidth / 2 + 35, detailY)
    }
    if (index % 2 === 1) detailY += 8
  })

  yPosition = yPosition + 50

  // AI Summary if available
  if (inspection.aiSummary) {
    checkPageBreak(40)

    doc.setFontSize(14)
    doc.setFont(undefined, 'bold')
    doc.text('EXECUTIVE SUMMARY', margin, yPosition)
    doc.setFont(undefined, 'normal')
    yPosition += 8

    doc.setFontSize(10)
    const summaryLines = doc.splitTextToSize(inspection.aiSummary, contentWidth)
    doc.text(summaryLines, margin, yPosition)
    yPosition += summaryLines.length * 5 + 10
  }

  // Inspection Details Header
  checkPageBreak(20)
  doc.setFontSize(14)
  doc.setFont(undefined, 'bold')
  doc.text('INSPECTION FINDINGS', margin, yPosition)
  doc.setFont(undefined, 'normal')
  yPosition += 10

  // Status Legend
  doc.setFontSize(9)
  doc.setFillColor(34, 197, 94)
  doc.circle(margin + 3, yPosition - 2, 2, 'F')
  doc.text('Pass', margin + 8, yPosition)

  doc.setFillColor(239, 68, 68)
  doc.circle(margin + 33, yPosition - 2, 2, 'F')
  doc.text('Fail', margin + 38, yPosition)

  doc.setFillColor(156, 163, 175)
  doc.circle(margin + 58, yPosition - 2, 2, 'F')
  doc.text('N/A', margin + 63, yPosition)
  yPosition += 10

  // Inspection Areas
  for (const area of inspection.areas) {
    checkPageBreak(30)

    // Area header with background
    doc.setFillColor(59, 130, 246)
    doc.rect(margin, yPosition, contentWidth, 8, 'F')

    doc.setTextColor(255, 255, 255)
    doc.setFontSize(12)
    doc.setFont(undefined, 'bold')
    doc.text(area.name.toUpperCase(), margin + 3, yPosition + 5.5)
    doc.setFont(undefined, 'normal')
    doc.setTextColor(0, 0, 0)
    yPosition += 12

    // Items in the area
    for (const item of area.items) {
      checkPageBreak(20)

      doc.setFontSize(10)

      // Status indicator
      const statusColor = item.status === 'Pass' ? [34, 197, 94] :
                        item.status === 'Fail' ? [239, 68, 68] : [156, 163, 175]
      doc.setFillColor(...statusColor as [number, number, number])
      doc.circle(margin + 3, yPosition - 1.5, 1.5, 'F')

      // Item details
      doc.setFont(undefined, 'bold')
      doc.text(`${item.category}:`, margin + 8, yPosition)
      doc.setFont(undefined, 'normal')

      const itemText = doc.splitTextToSize(item.point, contentWidth - 40)
      doc.text(itemText, margin + 8 + doc.getTextWidth(`${item.category}: `), yPosition)

      // Status text aligned to the right
      doc.setFont(undefined, 'bold')
      doc.setTextColor(...statusColor as [number, number, number])
      doc.text(`[${item.status}]`, pageWidth - margin - 20, yPosition)
      doc.setTextColor(0, 0, 0)
      doc.setFont(undefined, 'normal')

      yPosition += itemText.length * 4 + 2

      // Comments
      if (item.comments && item.comments.trim()) {
        doc.setFontSize(9)
        doc.setTextColor(75, 85, 99)
        const commentLines = doc.splitTextToSize(`Comments: ${item.comments}`, contentWidth - 15)
        doc.text(commentLines, margin + 8, yPosition)
        yPosition += commentLines.length * 4
        doc.setTextColor(0, 0, 0)
      }

      // Location
      if (item.location && item.location.trim()) {
        doc.setFontSize(9)
        doc.setTextColor(75, 85, 99)
        doc.text(`Location: ${item.location}`, margin + 8, yPosition)
        yPosition += 4
        doc.setTextColor(0, 0, 0)
      }

      // Photos indicator
      if (item.photos && item.photos.length > 0) {
        doc.setFontSize(9)
        doc.setTextColor(59, 130, 246)
        doc.text(`📷 ${item.photos.length} photo(s) attached`, margin + 8, yPosition)
        yPosition += 4
        doc.setTextColor(0, 0, 0)
      }

      yPosition += 4
    }
    yPosition += 5
  }

  // Statistics Summary
  checkPageBreak(40)
  yPosition += 10

  doc.setFillColor(245, 247, 250)
  doc.rect(margin, yPosition, contentWidth, 30, 'F')

  doc.setFontSize(12)
  doc.setFont(undefined, 'bold')
  doc.text('INSPECTION STATISTICS', margin + 5, yPosition + 8)
  doc.setFont(undefined, 'normal')

  // Calculate stats
  let passCount = 0, failCount = 0, naCount = 0
  inspection.areas.forEach(area => {
    area.items.forEach(item => {
      if (item.status === 'Pass') passCount++
      else if (item.status === 'Fail') failCount++
      else naCount++
    })
  })
  const totalItems = passCount + failCount + naCount

  doc.setFontSize(10)
  doc.text(`Total Items Inspected: ${totalItems}`, margin + 5, yPosition + 18)

  doc.setTextColor(34, 197, 94)
  doc.text(`Passed: ${passCount}`, margin + 70, yPosition + 18)

  doc.setTextColor(239, 68, 68)
  doc.text(`Failed: ${failCount}`, margin + 110, yPosition + 18)

  doc.setTextColor(156, 163, 175)
  doc.text(`N/A: ${naCount}`, margin + 150, yPosition + 18)

  doc.setTextColor(0, 0, 0)

  if (totalItems > 0) {
    const passRate = Math.round((passCount / totalItems) * 100)
    doc.setFont(undefined, 'bold')
    doc.text(`Pass Rate: ${passRate}%`, margin + 5, yPosition + 25)
    doc.setFont(undefined, 'normal')
  }

  // Add footers to all pages
  const pageCount = doc.internal.getNumberOfPages()
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)

    // Footer line
    doc.setDrawColor(229, 231, 235)
    doc.line(margin, pageHeight - 15, pageWidth - margin, pageHeight - 15)

    // Footer text
    doc.setFontSize(8)
    doc.setTextColor(156, 163, 175)
    doc.text(
      `Page ${i} of ${pageCount}`,
      margin,
      pageHeight - 8
    )
    doc.text(
      `Generated: ${new Date().toLocaleDateString()} | Property Inspector Pro`,
      pageWidth - margin,
      pageHeight - 8,
      { align: 'right' }
    )
  }

  // Generate filename
  const clientNameSanitized = inspection.clientName
    ? inspection.clientName.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase()
    : 'inspection'
  const dateStr = new Date(inspection.inspectionDate).toISOString().split('T')[0]
  const fileName = `${clientNameSanitized}-inspection-${dateStr}.pdf`

  // Save the PDF
  doc.save(fileName)
}