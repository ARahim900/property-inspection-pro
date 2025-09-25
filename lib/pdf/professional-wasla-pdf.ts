import type { InspectionData } from '@/types'
import jsPDF from 'jspdf'
import 'jspdf-autotable'

declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF
    lastAutoTable: {
      finalY: number
    }
  }
}

// Font for Arabic text support (using built-in fonts)
const addCustomFonts = (doc: jsPDF) => {
  doc.setFont('helvetica')
}

export async function generateProfessionalWaslaPDF(inspection: InspectionData): Promise<void> {
  const doc = new jsPDF('p', 'mm', 'a4')
  const pageWidth = 210
  const pageHeight = 297
  const margin = 20
  const contentWidth = pageWidth - (margin * 2)

  addCustomFonts(doc)

  // Helper function to add header on each page
  const addHeader = () => {
    // Navy blue header background
    doc.setFillColor(0, 31, 63)
    doc.rect(0, 0, pageWidth, 30, 'F')

    // White text for header
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(16)
    doc.setFont('helvetica', 'bold')
    doc.text('WASLA REAL ESTATE SOLUTIONS', pageWidth / 2, 12, { align: 'center' })
    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.text('Property Inspection Report', pageWidth / 2, 20, { align: 'center' })
    doc.setTextColor(0, 0, 0)
  }

  // Add footer function
  const addFooter = (pageNum: number, totalPages: number) => {
    doc.setFillColor(0, 31, 63)
    doc.rect(0, pageHeight - 15, pageWidth, 15, 'F')

    doc.setTextColor(255, 255, 255)
    doc.setFontSize(8)
    doc.text('Wasla Property Solutions CR. 1068375', pageWidth / 2, pageHeight - 10, { align: 'center' })
    doc.text(`Page ${pageNum} of ${totalPages}`, pageWidth / 2, pageHeight - 5, { align: 'center' })
    doc.setTextColor(0, 0, 0)
  }

  // PAGE 1: COVER & OVERVIEW
  addHeader()
  let currentY = 40

  // Title Section
  doc.setFontSize(22)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(0, 31, 63)
  doc.text('PROPERTY INSPECTION REPORT', pageWidth / 2, currentY, { align: 'center' })
  currentY += 15

  // Property Info Box
  doc.setFillColor(240, 245, 250)
  doc.roundedRect(margin, currentY, contentWidth, 60, 3, 3, 'F')
  doc.setDrawColor(0, 31, 63)
  doc.setLineWidth(0.5)
  doc.roundedRect(margin, currentY, contentWidth, 60, 3, 3, 'S')

  currentY += 10
  doc.setFontSize(11)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(0, 0, 0)

  const leftCol = margin + 5
  const rightCol = pageWidth / 2 + 5

  doc.text('Client Name:', leftCol, currentY)
  doc.setFont('helvetica', 'normal')
  doc.text(inspection.clientName || 'Not Specified', leftCol + 30, currentY)

  doc.setFont('helvetica', 'bold')
  doc.text('Property Location:', rightCol, currentY)
  doc.setFont('helvetica', 'normal')
  const location = inspection.propertyLocation || 'Not Specified'
  if (location.length > 30) {
    doc.text(location.substring(0, 30) + '...', rightCol + 35, currentY)
  } else {
    doc.text(location, rightCol + 35, currentY)
  }

  currentY += 10
  doc.setFont('helvetica', 'bold')
  doc.text('Property Type:', leftCol, currentY)
  doc.setFont('helvetica', 'normal')
  doc.text(inspection.propertyType || 'Not Specified', leftCol + 30, currentY)

  doc.setFont('helvetica', 'bold')
  doc.text('Inspector:', rightCol, currentY)
  doc.setFont('helvetica', 'normal')
  doc.text(inspection.inspectorName || 'Wasla Inspector', rightCol + 35, currentY)

  currentY += 10
  doc.setFont('helvetica', 'bold')
  doc.text('Inspection Date:', leftCol, currentY)
  doc.setFont('helvetica', 'normal')
  const inspDate = inspection.inspectionDate
    ? new Date(inspection.inspectionDate).toLocaleDateString('en-GB')
    : new Date().toLocaleDateString('en-GB')
  doc.text(inspDate, leftCol + 30, currentY)

  doc.setFont('helvetica', 'bold')
  doc.text('Report Date:', rightCol, currentY)
  doc.setFont('helvetica', 'normal')
  doc.text(new Date().toLocaleDateString('en-GB'), rightCol + 35, currentY)

  currentY += 10
  doc.setFont('helvetica', 'bold')
  doc.text('Report ID:', leftCol, currentY)
  doc.setFont('helvetica', 'normal')
  const reportId = `WASLA-${new Date().getFullYear()}-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`
  doc.text(reportId, leftCol + 30, currentY)

  currentY += 25

  // OVERVIEW SECTION WITH DISCLAIMER
  doc.setFillColor(0, 31, 63)
  doc.rect(margin, currentY, contentWidth, 8, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.text('OVERVIEW', margin + 3, currentY + 5.5)
  doc.setTextColor(0, 0, 0)
  currentY += 12

  // Dear Client Letter
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  const overviewText = `Dear ${inspection.clientName || 'Valued Client'},

Thank you for choosing Wasla Real Estate Solutions to carry out the inspection of your property. This report presents the inspection findings and measurements as documented on site on the date of the visit, and the presence of certain observations is common in property inspections.

Please review the attached report carefully before making your final decision. If you require any further clarification regarding the condition of the property, please feel free to contact us by phone or email between 9:00 a.m. and 5:00 p.m.

Email: info@waslaoman.com
Mobile: +968 90699799`

  const overviewLines = doc.splitTextToSize(overviewText, contentWidth - 10)
  doc.text(overviewLines, margin, currentY)
  currentY += overviewLines.length * 4 + 10

  // PAGE 2: IMPORTANT NOTICES
  doc.addPage()
  addHeader()
  currentY = 40

  doc.setFillColor(0, 31, 63)
  doc.rect(margin, currentY, contentWidth, 8, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.text('IMPORTANT NOTICES', margin + 3, currentY + 5.5)
  doc.setTextColor(0, 0, 0)
  currentY += 15

  // Notice 1: No property is perfect
  doc.setFontSize(11)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(0, 31, 63)
  doc.text('No property is perfect', margin, currentY)
  doc.setTextColor(0, 0, 0)
  currentY += 5
  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  const notice1 = `Every building has imperfections or items that are ready for maintenance. It's the inspector's task to discover and report these so you can make informed decisions. This report should not be used as a tool to demean property, but rather as a way to illuminate the realities of the property.`
  const notice1Lines = doc.splitTextToSize(notice1, contentWidth - 10)
  doc.text(notice1Lines, margin, currentY)
  currentY += notice1Lines.length * 4 + 8

  // Notice 2: This report is not an appraisal
  doc.setFontSize(11)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(0, 31, 63)
  doc.text('This report is not an appraisal', margin, currentY)
  doc.setTextColor(0, 0, 0)
  currentY += 5
  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  const notice2 = `When an appraiser determines worth, only the most obvious conditions of a property are taken into account to establish a safe loan amount. In effect, the appraiser is representing the interests of the lender. Home inspectors focus more on the interests of the prospective buyer; and, although inspectors must be careful not to make any statements relating to property value, their findings can help buyers more completely understand the true costs of ownership.`
  const notice2Lines = doc.splitTextToSize(notice2, contentWidth - 10)
  doc.text(notice2Lines, margin, currentY)
  currentY += notice2Lines.length * 4 + 8

  // Notice 3: Maintenance costs are normal
  doc.setFontSize(11)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(0, 31, 63)
  doc.text('Maintenance costs are normal', margin, currentY)
  doc.setTextColor(0, 0, 0)
  currentY += 5
  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  const notice3 = `Homeowners should plan to spend around 1% of the total value of a property in maintenance costs, annually. (Annual costs of rental property maintenance are often 2%, or more.) If considerably less than this percentage has been invested during several years preceding an inspection, the property will usually show the obvious signs of neglect; and the new property owners may be required to invest significant time and money to address accumulated maintenance needs.`
  const notice3Lines = doc.splitTextToSize(notice3, contentWidth - 10)
  doc.text(notice3Lines, margin, currentY)
  currentY += notice3Lines.length * 4 + 10

  // SCOPE OF THE INSPECTION
  doc.setFillColor(0, 31, 63)
  doc.rect(margin, currentY, contentWidth, 8, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.text('SCOPE OF THE INSPECTION', margin + 3, currentY + 5.5)
  doc.setTextColor(0, 0, 0)
  currentY += 12

  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  const scopeText = `This report details the outcome of a visual survey of the property detailed in the annexed inspection checklist in order to check the quality of workmanship against applicable standards. It covers both the interior and the exterior of the property as well as garden, driveway and garage if relevant. Areas not inspected, for whatever reason, cannot guarantee that these areas are free from defects. This report was formed as per the client request as a supportive opinion to enable him to have better understanding about property conditions.

Our opinion does not study the property value or the engineering of the structure rather it studies the functionality of the property. This report will be listing the property defects supported by images and videos, by showing full study of the standards of property status and functionality including other relevant elements of the property as stated in the checklist.`
  const scopeLines = doc.splitTextToSize(scopeText, contentWidth - 10)
  doc.text(scopeLines, margin, currentY)
  currentY += scopeLines.length * 4 + 10

  // CONFIDENTIALITY
  doc.setFillColor(255, 243, 224)
  doc.roundedRect(margin, currentY, contentWidth, 35, 3, 3, 'F')
  doc.setDrawColor(255, 193, 7)
  doc.setLineWidth(0.5)
  doc.roundedRect(margin, currentY, contentWidth, 35, 3, 3, 'S')

  doc.setFontSize(11)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(133, 77, 14)
  doc.text('CONFIDENTIALITY OF THE REPORT', margin + 5, currentY + 8)
  doc.setTextColor(0, 0, 0)
  doc.setFontSize(8)
  doc.setFont('helvetica', 'normal')
  const confText = `The inspection report is to be prepared for the Client for the purpose of informing of the major deficiencies in the condition of the subject property and is solely and exclusively for Client's own information and may not be relied upon by any other person.`
  const confLines = doc.splitTextToSize(confText, contentWidth - 15)
  doc.text(confLines, margin + 5, currentY + 15)

  // PAGE 3: INSPECTION FINDINGS
  doc.addPage()
  addHeader()
  currentY = 40

  doc.setFillColor(0, 31, 63)
  doc.rect(margin, currentY, contentWidth, 8, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.text('INSPECTION FINDINGS', margin + 3, currentY + 5.5)
  doc.setTextColor(0, 0, 0)
  currentY += 12

  // Status Legend
  doc.setFontSize(9)
  doc.setFillColor(34, 197, 94)
  doc.circle(margin + 5, currentY, 2, 'F')
  doc.text('Pass', margin + 10, currentY + 1)

  doc.setFillColor(239, 68, 68)
  doc.circle(margin + 35, currentY, 2, 'F')
  doc.text('Fail', margin + 40, currentY + 1)

  doc.setFillColor(156, 163, 175)
  doc.circle(margin + 60, currentY, 2, 'F')
  doc.text('N/A', margin + 65, currentY + 1)
  currentY += 10

  // Prepare inspection data for table
  const tableData: any[] = []
  let itemNum = 1
  let totalPass = 0, totalFail = 0, totalNA = 0
  let photoCount = 0

  inspection.areas.forEach(area => {
    // Area header row
    tableData.push([{
      content: area.name.toUpperCase(),
      colSpan: 6,
      styles: {
        fillColor: [240, 245, 250],
        fontStyle: 'bold',
        fontSize: 11,
        textColor: [0, 31, 63]
      }
    }])

    area.items.forEach(item => {
      const status = item.status || 'N/A'

      // Count statistics
      if (status === 'Pass') totalPass++
      else if (status === 'Fail') totalFail++
      else totalNA++

      // Count photos
      if (item.photos && item.photos.length > 0) {
        photoCount += item.photos.length
      }

      const statusColor = status === 'Pass' ? [34, 197, 94] :
                         status === 'Fail' ? [239, 68, 68] : [156, 163, 175]

      // Comments and location combined
      let notes = ''
      if (item.comments) notes += item.comments
      if (item.location) {
        notes += (notes ? ' | Location: ' : 'Location: ') + item.location
      }
      if (item.photos && item.photos.length > 0) {
        notes += ` | ${item.photos.length} photo(s)`
      }

      tableData.push([
        itemNum++,
        item.category || '',
        item.point || '',
        {
          content: status,
          styles: { textColor: statusColor, fontStyle: 'bold' }
        },
        notes || '-',
        item.photos && item.photos.length > 0 ? 'Yes' : 'No'
      ])
    })
  })

  // Create the inspection table
  doc.autoTable({
    head: [['#', 'Category', 'Inspection Point', 'Status', 'Comments/Location', 'Photos']],
    body: tableData,
    startY: currentY,
    margin: { left: margin, right: margin },
    theme: 'grid',
    headStyles: {
      fillColor: [0, 31, 63],
      textColor: 255,
      fontSize: 10,
      fontStyle: 'bold'
    },
    bodyStyles: {
      fontSize: 8,
      cellPadding: 2
    },
    columnStyles: {
      0: { cellWidth: 10 },
      1: { cellWidth: 30 },
      2: { cellWidth: 55 },
      3: { cellWidth: 20 },
      4: { cellWidth: 50 },
      5: { cellWidth: 15 }
    },
    didDrawPage: function(data: any) {
      // Add headers and footers to table pages
      if (data.pageNumber > 3) {
        addHeader()
      }
    }
  })

  currentY = doc.lastAutoTable.finalY + 10

  // STATISTICS SUMMARY
  if (currentY > pageHeight - 60) {
    doc.addPage()
    addHeader()
    currentY = 40
  }

  doc.setFillColor(240, 248, 255)
  doc.roundedRect(margin, currentY, contentWidth, 45, 3, 3, 'F')
  doc.setDrawColor(0, 31, 63)
  doc.setLineWidth(0.5)
  doc.roundedRect(margin, currentY, contentWidth, 45, 3, 3, 'S')

  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(0, 31, 63)
  doc.text('INSPECTION SUMMARY', margin + 5, currentY + 10)

  const totalItems = totalPass + totalFail + totalNA
  const passRate = totalItems > 0 ? Math.round((totalPass / (totalPass + totalFail)) * 100) || 0 : 0

  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(0, 0, 0)
  doc.text(`Total Items Inspected: ${totalItems}`, margin + 5, currentY + 20)

  doc.setTextColor(34, 197, 94)
  doc.text(`Passed: ${totalPass}`, margin + 5, currentY + 27)

  doc.setTextColor(239, 68, 68)
  doc.text(`Failed: ${totalFail}`, margin + 60, currentY + 27)

  doc.setTextColor(156, 163, 175)
  doc.text(`N/A: ${totalNA}`, margin + 110, currentY + 27)

  doc.setTextColor(0, 31, 63)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(12)
  doc.text(`Overall Pass Rate: ${passRate}%`, margin + 5, currentY + 37)

  if (photoCount > 0) {
    doc.setTextColor(0, 0, 0)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.text(`Total Photos Attached: ${photoCount}`, margin + 100, currentY + 37)
  }

  currentY += 55

  // SIGNATURES PAGE
  if (currentY > pageHeight - 80) {
    doc.addPage()
    addHeader()
    currentY = 40
  }

  doc.setFillColor(0, 31, 63)
  doc.rect(margin, currentY, contentWidth, 8, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.text('SIGNATURES', margin + 3, currentY + 5.5)
  doc.setTextColor(0, 0, 0)
  currentY += 15

  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')

  // Client signature
  doc.text('Client Name:', margin, currentY)
  doc.text(inspection.clientName || '_________________________', margin + 30, currentY)
  currentY += 10

  doc.text('Signature:', margin, currentY)
  doc.text('_________________________', margin + 30, currentY)
  currentY += 15

  // Inspector signature
  doc.text('Prepared by:', margin, currentY)
  doc.text(inspection.inspectorName || 'Wasla Inspector', margin + 30, currentY)
  currentY += 10

  doc.text('Stamp:', margin, currentY)
  currentY += 10

  doc.text('Date:', margin, currentY)
  doc.text(new Date().toLocaleDateString('en-GB'), margin + 30, currentY)

  // Add final notice
  currentY += 20
  doc.setFillColor(255, 243, 224)
  doc.roundedRect(margin, currentY, contentWidth, 20, 3, 3, 'F')
  doc.setFontSize(9)
  doc.setFont('helvetica', 'italic')
  doc.text('Property Inspection report is annexed', margin + 5, currentY + 8)
  doc.text('Thank you for choosing Wasla Real Estate Solutions', margin + 5, currentY + 14)

  // Add footers to all pages
  const pageCount = (doc as any).internal.pages.length - 1
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    addFooter(i, pageCount)
  }

  // Generate filename
  const clientName = (inspection.clientName || 'Client').replace(/[^a-zA-Z0-9]/g, '_')
  const date = new Date().toISOString().split('T')[0]
  const filename = `Wasla_Professional_Inspection_${clientName}_${date}.pdf`

  // Save the PDF
  doc.save(filename)
  console.log('Professional PDF generated successfully:', filename)
}