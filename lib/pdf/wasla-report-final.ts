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

export async function generateWaslaFinalReport(inspection: InspectionData): Promise<void> {
  try {
    console.log('Generating Wasla Final Report with disclaimer and photos...')

    const doc = new jsPDF('p', 'mm', 'a4')
    const pageWidth = 210
    const pageHeight = 297
    const margin = 15
    const contentWidth = pageWidth - (margin * 2)

    // Generate report ID that will be used throughout
    const reportId = `WASLA-${new Date().getFullYear()}-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`

    // Colors
    const waslaBlue = [0, 31, 63] as [number, number, number]
    const waslaGold = [218, 165, 32] as [number, number, number]

    let pageNum = 1

    // Helper to add header
    const addHeader = () => {
      doc.setFillColor(...waslaBlue)
      doc.rect(0, 0, pageWidth, 30, 'F')
      doc.setTextColor(255, 255, 255)
      doc.setFontSize(16)
      doc.setFont('helvetica', 'bold')
      doc.text('WASLA REAL ESTATE SOLUTIONS', pageWidth / 2, 12, { align: 'center' })
      doc.setFontSize(10)
      doc.setFont('helvetica', 'normal')
      doc.text('Property Inspection Report - تقرير فحص العقار', pageWidth / 2, 20, { align: 'center' })
      doc.setTextColor(0, 0, 0)
    }

    // Helper to add footer
    const addFooter = (page: number, total: number) => {
      doc.setFillColor(...waslaBlue)
      doc.rect(0, pageHeight - 15, pageWidth, 15, 'F')
      doc.setTextColor(255, 255, 255)
      doc.setFontSize(8)
      doc.text('Wasla Property Solutions CR. 1068375 | وصلة للحلول العقارية س.ت. 1068375', pageWidth / 2, pageHeight - 10, { align: 'center' })
      doc.text(`Page ${page} of ${total}`, pageWidth / 2, pageHeight - 5, { align: 'center' })
      doc.setTextColor(0, 0, 0)
    }

    // PAGE 1: COVER & DISCLAIMER
    addHeader()
    let currentY = 40

    doc.setFontSize(22)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...waslaBlue)
    doc.text('PROPERTY INSPECTION REPORT', pageWidth / 2, currentY, { align: 'center' })
    currentY += 8
    doc.setFontSize(14)
    doc.text('تقرير فحص العقار', pageWidth / 2, currentY, { align: 'center' })
    currentY += 15

    // Property Info Box
    doc.setFillColor(240, 245, 250)
    doc.roundedRect(margin, currentY, contentWidth, 50, 3, 3, 'F')
    doc.setDrawColor(...waslaBlue)
    doc.roundedRect(margin, currentY, contentWidth, 50, 3, 3, 'S')

    currentY += 10
    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(0, 0, 0)

    doc.text(`Client Name / اسم العميل: ${inspection.clientName || 'Not Specified'}`, margin + 5, currentY)
    currentY += 8
    doc.text(`Property Location / الموقع: ${(inspection.propertyLocation || 'Not Specified').substring(0, 50)}`, margin + 5, currentY)
    currentY += 8
    doc.text(`Property Type / نوع العقار: ${inspection.propertyType || 'Not Specified'}`, margin + 5, currentY)
    currentY += 8
    doc.text(`Inspector / المفتش: ${inspection.inspectorName || 'Wasla Inspector'}`, margin + 5, currentY)
    currentY += 8
    const inspDate = inspection.inspectionDate
      ? new Date(inspection.inspectionDate).toLocaleDateString('en-GB')
      : new Date().toLocaleDateString('en-GB')
    doc.text(`Inspection Date / تاريخ الفحص: ${inspDate}`, margin + 5, currentY)
    doc.text(`Report ID / رقم التقرير: ${reportId}`, pageWidth / 2, currentY)

    currentY += 20

    // DISCLAIMER SECTION
    doc.setFillColor(...waslaBlue)
    doc.rect(margin, currentY, contentWidth, 8, 'F')
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(11)
    doc.setFont('helvetica', 'bold')
    doc.text('OVERVIEW & DISCLAIMER / نظرة عامة وإخلاء المسؤولية', margin + 3, currentY + 5.5)
    doc.setTextColor(0, 0, 0)
    currentY += 12

    doc.setFontSize(9)
    doc.setFont('helvetica', 'normal')
    const disclaimerText = `Dear ${inspection.clientName || 'Valued Client'} / السادة ${inspection.clientName || 'العميل'} المحترمون،

Thank you for choosing Wasla Real Estate Solutions to carry out the inspection of your property.
نشكر لكم اختياركم "وصلة للحلول العقارية" للقيام بفحص العقار الخاص بكم.

This report presents the inspection findings and measurements as documented on site on the date of the visit, and the presence of certain observations is common in property inspections.
يُقدم هذا التقرير نتائج الفحص والقياسات كما تم توثيقها ميدانيًا في تاريخ الزيارة، ووجود بعض الملاحظات يُعد أمر شائع في عمليات الفحص العقاري.

Please review the attached report carefully before making your final decision. If you require any further clarification regarding the condition of the property, please feel free to contact us.
يرجى مراجعة التقرير المرفق بعناية قبل اتخاذ قراركم النهائي، وإذا كنتم بحاجة إلى توضيحات إضافية حول حالة العقار، فلا تترددوا بالتواصل معنا.

Contact / للتواصل:
Email / البريد الإلكتروني: info@waslaoman.com
Mobile / الهاتف: +968 90699799`

    const disclaimerLines = doc.splitTextToSize(disclaimerText, contentWidth - 10)
    doc.text(disclaimerLines, margin, currentY)

    // PAGE 2: IMPORTANT NOTICES
    doc.addPage()
    pageNum++
    addHeader()
    currentY = 40

    doc.setFillColor(...waslaBlue)
    doc.rect(margin, currentY, contentWidth, 8, 'F')
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(11)
    doc.setFont('helvetica', 'bold')
    doc.text('IMPORTANT NOTICES / ملاحظات مهمة', margin + 3, currentY + 5.5)
    doc.setTextColor(0, 0, 0)
    currentY += 15

    // Notice boxes
    const notices = [
      {
        title: 'No property is perfect / لا يوجد عقار مثالي',
        content: 'Every building has imperfections or items that are ready for maintenance. It\'s the inspector\'s task to discover and report these so you can make informed decisions. This report should not be used as a tool to demean property, but rather a way to illuminate the realities of the property.\n\nكل عقار يحتوي على بعض العيوب أو الأجزاء التي تحتاج إلى صيانة. دور المفتش هو تحديد هذه النقاط وتقديمها بوضوح لمساعدتكم في اتخاذ قرارات مستنيرة.'
      },
      {
        title: 'This report is not an appraisal / هذا التقرير ليس تقييمًا سعريًا',
        content: 'Home inspectors focus on the interests of the prospective buyer; their findings can help buyers understand the true costs of ownership.\n\nفاحص العقار يركز على مصلحة المشتري المحتمل. نتائج الفحص تساعد المشتري في فهم التكاليف الحقيقية لامتلاك العقار.'
      },
      {
        title: 'Maintenance costs are normal / تكاليف الصيانة أمر طبيعي',
        content: 'Homeowners should plan to spend around 1% of the total value of a property in maintenance costs, annually.\n\nينبغي على مالكي العقارات تخصيص ما يُعادل 1% من قيمة العقار سنويًا لأعمال الصيانة الدورية.'
      }
    ]

    notices.forEach(notice => {
      if (currentY > pageHeight - 60) {
        doc.addPage()
        pageNum++
        addHeader()
        currentY = 40
      }

      doc.setFillColor(255, 251, 235)
      doc.roundedRect(margin, currentY, contentWidth, 45, 3, 3, 'F')
      doc.setDrawColor(...waslaGold)
      doc.roundedRect(margin, currentY, contentWidth, 45, 3, 3, 'S')

      doc.setFontSize(10)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(...waslaBlue)
      doc.text(notice.title, margin + 5, currentY + 8)

      doc.setFontSize(8)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(0, 0, 0)
      const noticeLines = doc.splitTextToSize(notice.content, contentWidth - 10)
      doc.text(noticeLines, margin + 5, currentY + 15)

      currentY += 50
    })

    // PAGE 3: SCOPE & CONFIDENTIALITY
    doc.addPage()
    pageNum++
    addHeader()
    currentY = 40

    doc.setFillColor(...waslaBlue)
    doc.rect(margin, currentY, contentWidth, 8, 'F')
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(11)
    doc.setFont('helvetica', 'bold')
    doc.text('SCOPE OF THE INSPECTION / نطاق الفحص', margin + 3, currentY + 5.5)
    doc.setTextColor(0, 0, 0)
    currentY += 12

    doc.setFontSize(9)
    doc.setFont('helvetica', 'normal')
    const scopeText = `This report details the outcome of a visual survey of the property detailed in the annexed inspection checklist in order to check the quality of workmanship against applicable standards. It covers both the interior and exterior of the property as well as garden, driveway and garage if relevant.

يوضح هذا التقرير نتيجة الفحص البصري للعقار كما هو مفصل في قائمة الفحص المرفقة، بهدف تقييم جودة التنفيذ مقارنة بالمعايير المعتمدة. يشمل الفحص المناطق الداخلية والخارجية.

Our opinion does not study the property value or the engineering of the structure rather it studies the functionality of the property.

رأينا الفني لا يشمل تقييم القيمة السوقية أو التحليل الإنشائي، بل يركز على حالة العقار ووظائفه العامة.`

    const scopeLines = doc.splitTextToSize(scopeText, contentWidth - 10)
    doc.text(scopeLines, margin, currentY)

    currentY += scopeLines.length * 4 + 15

    // CONFIDENTIALITY
    doc.setFillColor(...waslaBlue)
    doc.rect(margin, currentY, contentWidth, 8, 'F')
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(11)
    doc.setFont('helvetica', 'bold')
    doc.text('CONFIDENTIALITY / سرية التقرير', margin + 3, currentY + 5.5)
    doc.setTextColor(0, 0, 0)
    currentY += 12

    doc.setFillColor(255, 243, 224)
    doc.roundedRect(margin, currentY, contentWidth, 35, 3, 3, 'F')
    doc.setDrawColor(251, 146, 60)
    doc.roundedRect(margin, currentY, contentWidth, 35, 3, 3, 'S')

    doc.setFontSize(9)
    doc.setFont('helvetica', 'normal')
    const confText = `The inspection report is prepared for the Client for informing of the major deficiencies in the property condition and is solely for Client's own information.

تم إعداد تقرير الفحص هذا خصيصًا للعميل بغرض إعلامه بالنواقص الجوهرية في حالة العقار، وهو للاستخدام الشخصي فقط.`

    const confLines = doc.splitTextToSize(confText, contentWidth - 10)
    doc.text(confLines, margin + 5, currentY + 8)

    // PAGE 4: INSPECTION FINDINGS
    doc.addPage()
    pageNum++
    addHeader()
    currentY = 40

    doc.setFillColor(...waslaBlue)
    doc.rect(margin, currentY, contentWidth, 8, 'F')
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(11)
    doc.setFont('helvetica', 'bold')
    doc.text('INSPECTION FINDINGS / نتائج الفحص', margin + 3, currentY + 5.5)
    doc.setTextColor(0, 0, 0)
    currentY += 15

    // Prepare table data
    const tableData: any[] = []
    let totalPass = 0, totalFail = 0, totalNA = 0
    const photos: Array<{base64: string, caption: string}> = []

    inspection.areas.forEach(area => {
      // Area header
      tableData.push([{
        content: area.name.toUpperCase(),
        colSpan: 5,
        styles: {
          fillColor: [240, 245, 250],
          fontStyle: 'bold',
          fontSize: 10,
          textColor: waslaBlue
        }
      }])

      area.items.forEach(item => {
        const status = item.status || 'N/A'
        if (status === 'Pass') totalPass++
        else if (status === 'Fail') totalFail++
        else totalNA++

        // Collect photos
        if (item.photos && item.photos.length > 0) {
          item.photos.forEach(photo => {
            if (photo.base64) {
              photos.push({
                base64: photo.base64,
                caption: `${area.name} - ${item.point || 'Item'}`
              })
            }
          })
        }

        const statusColor = status === 'Pass' ? [34, 197, 94] :
                           status === 'Fail' ? [239, 68, 68] : [156, 163, 175]

        let notes = item.comments || ''
        if (item.location) notes += (notes ? ' | ' : '') + `Location: ${item.location}`
        if (item.photos && item.photos.length > 0) notes += ` | Photos: ${item.photos.length}`

        tableData.push([
          item.category || '',
          item.point || '',
          {
            content: status,
            styles: { textColor: statusColor, fontStyle: 'bold' }
          },
          notes || '-',
          item.photos && item.photos.length > 0 ? '✓' : ''
        ])
      })
    })

    // Create table
    doc.autoTable({
      head: [['Category', 'Inspection Point', 'Status', 'Notes', 'Photo']],
      body: tableData,
      startY: currentY,
      margin: { left: margin, right: margin },
      theme: 'grid',
      headStyles: {
        fillColor: waslaBlue,
        textColor: 255,
        fontSize: 9,
        fontStyle: 'bold'
      },
      bodyStyles: {
        fontSize: 8,
        cellPadding: 2
      },
      columnStyles: {
        0: { cellWidth: 35 },
        1: { cellWidth: 60 },
        2: { cellWidth: 20 },
        3: { cellWidth: 55 },
        4: { cellWidth: 10 }
      },
      didDrawPage: function() {
        pageNum++
        addHeader()
      }
    })

    currentY = doc.lastAutoTable.finalY + 10

    // PHOTOS SECTION
    if (photos.length > 0) {
      if (currentY > pageHeight - 50) {
        doc.addPage()
        pageNum++
        addHeader()
        currentY = 40
      }

      doc.setFillColor(...waslaBlue)
      doc.rect(margin, currentY, contentWidth, 8, 'F')
      doc.setTextColor(255, 255, 255)
      doc.setFontSize(11)
      doc.setFont('helvetica', 'bold')
      doc.text('INSPECTION PHOTOS / صور الفحص', margin + 3, currentY + 5.5)
      doc.setTextColor(0, 0, 0)
      currentY += 15

      // Display up to 4 photos
      const maxPhotos = Math.min(photos.length, 4)
      for (let i = 0; i < maxPhotos; i++) {
        if (currentY > pageHeight - 70) {
          doc.addPage()
          pageNum++
          addHeader()
          currentY = 40
        }

        const photo = photos[i]

        // Photo frame
        doc.setDrawColor(200, 200, 200)
        doc.rect(margin, currentY, 80, 60, 'S')

        // Try to add image
        try {
          if (photo.base64 && photo.base64.includes('base64,')) {
            // Detect format
            let format = 'JPEG'
            if (photo.base64.includes('image/png')) format = 'PNG'

            ;(doc as any).addImage(photo.base64, format, margin + 1, currentY + 1, 78, 58)
          }
        } catch (error) {
          console.error('Error adding photo:', error)
          // Add placeholder
          doc.setFillColor(245, 245, 245)
          doc.rect(margin + 1, currentY + 1, 78, 58, 'F')
          doc.setFontSize(8)
          doc.text('Photo Not Available', margin + 40, currentY + 30, { align: 'center' })
        }

        // Caption
        doc.setFontSize(8)
        doc.text(photo.caption, margin, currentY + 64)

        if (i % 2 === 0 && i < maxPhotos - 1) {
          // Move to right column
          const nextPhoto = photos[i + 1]
          doc.setDrawColor(200, 200, 200)
          doc.rect(margin + 90, currentY, 80, 60, 'S')

          try {
            if (nextPhoto.base64 && nextPhoto.base64.includes('base64,')) {
              let format = 'JPEG'
              if (nextPhoto.base64.includes('image/png')) format = 'PNG'
              ;(doc as any).addImage(nextPhoto.base64, format, margin + 91, currentY + 1, 78, 58)
            }
          } catch (error) {
            doc.setFillColor(245, 245, 245)
            doc.rect(margin + 91, currentY + 1, 78, 58, 'F')
            doc.setFontSize(8)
            doc.text('Photo Not Available', margin + 130, currentY + 30, { align: 'center' })
          }

          doc.setFontSize(8)
          doc.text(nextPhoto.caption, margin + 90, currentY + 64)
          i++ // Skip next iteration
        }

        currentY += 70
      }

      if (photos.length > maxPhotos) {
        doc.setFontSize(9)
        doc.setFont('helvetica', 'italic')
        doc.text(`+ ${photos.length - maxPhotos} more photos available in full report`, margin, currentY)
        currentY += 10
      }
    }

    // SUMMARY
    if (currentY > pageHeight - 60) {
      doc.addPage()
      pageNum++
      addHeader()
      currentY = 40
    }

    doc.setFillColor(...waslaBlue)
    doc.rect(margin, currentY, contentWidth, 8, 'F')
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(11)
    doc.setFont('helvetica', 'bold')
    doc.text('INSPECTION SUMMARY / ملخص الفحص', margin + 3, currentY + 5.5)
    doc.setTextColor(0, 0, 0)
    currentY += 15

    doc.setFillColor(240, 248, 255)
    doc.roundedRect(margin, currentY, contentWidth, 35, 3, 3, 'F')

    const totalItems = totalPass + totalFail + totalNA
    const passRate = totalItems > 0 ? Math.round((totalPass / (totalPass + totalFail)) * 100) || 0 : 0

    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.text(`Total Items Inspected / إجمالي البنود المفحوصة: ${totalItems}`, margin + 5, currentY + 10)
    doc.setTextColor(34, 197, 94)
    doc.text(`Pass / ناجح: ${totalPass}`, margin + 5, currentY + 18)
    doc.setTextColor(239, 68, 68)
    doc.text(`Fail / فاشل: ${totalFail}`, margin + 60, currentY + 18)
    doc.setTextColor(156, 163, 175)
    doc.text(`N/A / غير منطبق: ${totalNA}`, margin + 110, currentY + 18)
    doc.setTextColor(...waslaBlue)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(12)
    doc.text(`Overall Pass Rate / نسبة النجاح: ${passRate}%`, margin + 5, currentY + 28)

    currentY += 45

    // SIGNATURES
    if (currentY > pageHeight - 80) {
      doc.addPage()
      pageNum++
      addHeader()
      currentY = 40
    }

    doc.setFillColor(...waslaBlue)
    doc.rect(margin, currentY, contentWidth, 8, 'F')
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(11)
    doc.setFont('helvetica', 'bold')
    doc.text('SIGNATURES / التوقيعات', margin + 3, currentY + 5.5)
    doc.setTextColor(0, 0, 0)
    currentY += 15

    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.text(`Client Name / اسم العميل: ${inspection.clientName || '_______________________'}`, margin, currentY)
    currentY += 10
    doc.text('Signature / التوقيع: _______________________', margin, currentY)
    currentY += 15

    doc.text(`Prepared by / أعد بواسطة: ${inspection.inspectorName || 'Wasla Inspector'}`, margin, currentY)
    currentY += 10
    doc.text('Stamp / الختم:', margin, currentY)
    currentY += 10
    doc.text(`Date / التاريخ: ${new Date().toLocaleDateString('en-GB')}`, margin, currentY)

    currentY += 15
    doc.setFillColor(255, 251, 235)
    doc.roundedRect(margin, currentY, contentWidth, 15, 3, 3, 'F')
    doc.setFontSize(9)
    doc.setFont('helvetica', 'italic')
    doc.text('Property Inspection report is annexed / مرفق تقرير الفحص العقاري', margin + 5, currentY + 6)
    doc.text('Wasla Property Solutions CR. 1068375 / وصلة للحلول العقارية س.ت. 1068375', margin + 5, currentY + 11)

    // Add footers to all pages
    const totalPages = doc.internal.getNumberOfPages()
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i)
      addFooter(i, totalPages)
    }

    // Generate filename
    const clientName = (inspection.clientName || 'Client').replace(/[^a-zA-Z0-9]/g, '_')
    const date = new Date().toISOString().split('T')[0]
    const filename = `WASLA_Report_${clientName}_${date}_${reportId}.pdf`

    // Save
    doc.save(filename)
    console.log('Wasla Final Report generated successfully:', filename)

  } catch (error) {
    console.error('Error generating Wasla Final Report:', error)
    throw error
  }
}