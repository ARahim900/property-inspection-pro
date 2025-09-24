import type { InspectionData } from '@/types'

export async function generateSimplePDF(inspection: InspectionData): Promise<void> {
  try {
    // Dynamically import jsPDF
    const jsPDF = (await import('jspdf')).default

    const doc = new jsPDF()
    const pageWidth = 210 // A4 width in mm
    const pageHeight = 297 // A4 height in mm
    let y = 20

    // Helper to check for undefined values
    const safe = (value: any, fallback: string = 'N/A') => {
      return value || fallback
    }

    // Title
    doc.setFontSize(20)
    doc.setTextColor(0, 47, 108)
    doc.text('WASLA PROPERTY INSPECTION REPORT', pageWidth / 2, y, { align: 'center' })
    y += 15

    // Property Details
    doc.setFontSize(12)
    doc.setTextColor(0, 0, 0)
    doc.text(`Client: ${safe(inspection.clientName)}`, 20, y)
    y += 8
    doc.text(`Property: ${safe(inspection.propertyLocation)}`, 20, y)
    y += 8
    doc.text(`Type: ${safe(inspection.propertyType)}`, 20, y)
    y += 8
    doc.text(`Inspector: ${safe(inspection.inspectorName)}`, 20, y)
    y += 8
    doc.text(`Date: ${safe(inspection.inspectionDate)}`, 20, y)
    y += 15

    // Contact Info
    doc.setFontSize(10)
    doc.text('Wasla Real Estate Solutions', 20, y)
    y += 5
    doc.text('Email: info@waslaoman.com | Phone: +968 90699799', 20, y)
    y += 10

    // Inspection Items
    doc.setFontSize(14)
    doc.text('Inspection Details', 20, y)
    y += 10

    // Iterate through areas
    if (inspection.areas && inspection.areas.length > 0) {
      for (const area of inspection.areas) {
        // Check page break
        if (y > pageHeight - 30) {
          doc.addPage()
          y = 20
        }

        doc.setFontSize(12)
        doc.setFont(undefined, 'bold')
        doc.text(safe(area.name, 'Area'), 20, y)
        doc.setFont(undefined, 'normal')
        y += 8

        // Items in area
        if (area.items && area.items.length > 0) {
          for (const item of area.items) {
            if (y > pageHeight - 20) {
              doc.addPage()
              y = 20
            }

            doc.setFontSize(10)
            const status = safe(item.status, 'N/A')
            const statusColor = status === 'Pass' ? [0, 128, 0] :
                              status === 'Fail' ? [255, 0, 0] : [128, 128, 128]

            // Item text
            const itemText = `• ${safe(item.category)}: ${safe(item.point)}`
            const textLines = doc.splitTextToSize(itemText, 140)
            doc.text(textLines, 25, y)

            // Status
            doc.setTextColor(...(statusColor as [number, number, number]))
            doc.text(`[${status}]`, 170, y)
            doc.setTextColor(0, 0, 0)

            y += textLines.length * 5 + 3

            // Comments if any
            if (item.comments) {
              doc.setFontSize(9)
              const commentLines = doc.splitTextToSize(`Comments: ${item.comments}`, 130)
              doc.text(commentLines, 30, y)
              y += commentLines.length * 4 + 2
            }
          }
        }
        y += 5
      }
    } else {
      doc.text('No inspection items recorded.', 20, y)
    }

    // Footer
    doc.setFontSize(8)
    doc.text('Wasla Property Solutions CR. 1068375', pageWidth / 2, pageHeight - 10, { align: 'center' })

    // Generate filename
    const clientName = safe(inspection.clientName, 'Client').replace(/[^a-zA-Z0-9]/g, '_')
    const date = new Date().toISOString().split('T')[0]
    const filename = `Wasla_Inspection_${clientName}_${date}.pdf`

    // Save the PDF
    doc.save(filename)
    console.log('PDF saved:', filename)

  } catch (error) {
    console.error('Error in generateSimplePDF:', error)
    throw error
  }
}