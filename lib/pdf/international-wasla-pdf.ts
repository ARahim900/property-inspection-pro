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

// Helper to add Arabic font support
const addArabicFontSupport = (doc: jsPDF) => {
  // For now using helvetica, in production you'd add proper Arabic font
  doc.setFont('helvetica')
}

export async function generateInternationalWaslaPDF(inspection: InspectionData): Promise<void> {
  const doc = new jsPDF('p', 'mm', 'a4')
  const pageWidth = 210
  const pageHeight = 297
  const margin = 15
  const contentWidth = pageWidth - (margin * 2)

  addArabicFontSupport(doc)

  // Corporate Colors
  const corporateBlue = [0, 31, 63] as [number, number, number]
  const accentGold = [218, 165, 32] as [number, number, number]
  const lightGray = [245, 245, 245] as [number, number, number]

  // Helper function to add professional header
  const addProfessionalHeader = (pageNum: number) => {
    // Header gradient background
    doc.setFillColor(...corporateBlue)
    doc.rect(0, 0, pageWidth, 35, 'F')

    // Company logo placeholder (you would add actual logo here)
    doc.setFillColor(255, 255, 255)
    doc.circle(25, 17.5, 8, 'F')

    // Company name
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(18)
    doc.setFont('helvetica', 'bold')
    doc.text('WASLA REAL ESTATE SOLUTIONS', pageWidth / 2, 15, { align: 'center' })

    // Tagline
    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.text('وصلة للحلول العقارية', pageWidth / 2, 22, { align: 'center' })
    doc.text('Professional Property Inspection Services', pageWidth / 2, 28, { align: 'center' })

    // Gold accent line
    doc.setFillColor(...accentGold)
    doc.rect(0, 35, pageWidth, 1, 'F')

    doc.setTextColor(0, 0, 0)
  }

  // Helper function to add professional footer
  const addProfessionalFooter = (pageNum: number, totalPages: number) => {
    // Footer background
    doc.setFillColor(...corporateBlue)
    doc.rect(0, pageHeight - 20, pageWidth, 20, 'F')

    // Contact information
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(8)
    doc.setFont('helvetica', 'normal')

    // Left side - Contact
    doc.text('📧 info@waslaoman.com', margin, pageHeight - 14)
    doc.text('📱 +968 90699799', margin, pageHeight - 8)

    // Center - Registration
    doc.text('Wasla Property Solutions CR. 1068375', pageWidth / 2, pageHeight - 11, { align: 'center' })
    doc.text('س ت 1068375 وصلة للحلول العقارية', pageWidth / 2, pageHeight - 6, { align: 'center' })

    // Right side - Page number
    doc.text(`Page ${pageNum} of ${totalPages}`, pageWidth - margin, pageHeight - 11, { align: 'right' })

    doc.setTextColor(0, 0, 0)
  }

  // Helper to create section headers
  const createSectionHeader = (title: string, arabicTitle: string, y: number) => {
    doc.setFillColor(...corporateBlue)
    doc.rect(margin, y, contentWidth, 10, 'F')
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(11)
    doc.setFont('helvetica', 'bold')
    doc.text(title, margin + 5, y + 4)
    doc.text(arabicTitle, pageWidth - margin - 5, y + 7, { align: 'right' })
    doc.setTextColor(0, 0, 0)
    return y + 14
  }

  // PAGE 1: COVER & DISCLAIMER
  addProfessionalHeader(1)
  let currentY = 45

  // Report Title
  doc.setFontSize(24)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...corporateBlue)
  doc.text('PROPERTY INSPECTION REPORT', pageWidth / 2, currentY, { align: 'center' })
  currentY += 8
  doc.setFontSize(16)
  doc.text('تقرير فحص العقار', pageWidth / 2, currentY, { align: 'center' })
  currentY += 15

  // Property Information Card
  doc.setFillColor(...lightGray)
  doc.roundedRect(margin, currentY, contentWidth, 70, 5, 5, 'F')
  doc.setDrawColor(...corporateBlue)
  doc.setLineWidth(1)
  doc.roundedRect(margin, currentY, contentWidth, 70, 5, 5, 'S')

  currentY += 10
  const leftCol = margin + 10
  const rightCol = pageWidth / 2 + 10

  // Bilingual property details
  doc.setFontSize(10)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...corporateBlue)

  // Client Name
  doc.text('Client Name / اسم العميل:', leftCol, currentY)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(0, 0, 0)
  doc.text(inspection.clientName || 'Not Specified', leftCol, currentY + 5)

  // Property Location
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...corporateBlue)
  doc.text('Location / الموقع:', rightCol, currentY)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(0, 0, 0)
  const location = inspection.propertyLocation || 'Not Specified'
  doc.text(location.substring(0, 35), rightCol, currentY + 5)

  currentY += 15

  // Property Type
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...corporateBlue)
  doc.text('Property Type / نوع العقار:', leftCol, currentY)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(0, 0, 0)
  doc.text(inspection.propertyType || 'Not Specified', leftCol, currentY + 5)

  // Inspector
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...corporateBlue)
  doc.text('Inspector / المفتش:', rightCol, currentY)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(0, 0, 0)
  doc.text(inspection.inspectorName || 'Wasla Inspector', rightCol, currentY + 5)

  currentY += 15

  // Dates
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...corporateBlue)
  doc.text('Inspection Date / تاريخ الفحص:', leftCol, currentY)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(0, 0, 0)
  const inspDate = inspection.inspectionDate
    ? new Date(inspection.inspectionDate).toLocaleDateString('en-GB')
    : new Date().toLocaleDateString('en-GB')
  doc.text(inspDate, leftCol, currentY + 5)

  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...corporateBlue)
  doc.text('Report ID / رقم التقرير:', rightCol, currentY)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(0, 0, 0)
  const reportId = `WASLA-${new Date().getFullYear()}-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`
  doc.text(reportId, rightCol, currentY + 5)

  currentY += 30

  // OVERVIEW Section with Bilingual Content
  currentY = createSectionHeader('OVERVIEW', 'نظرة عامة', currentY)

  // Dear Client Letter (Bilingual)
  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')

  // English version
  const overviewTextEn = `Dear ${inspection.clientName || 'Mr./Ms. Client'},

Thank you for choosing Wasla Real Estate Solutions to carry out the inspection of your property.
This report presents the inspection findings and measurements as documented on site on the date of the visit, and the presence of certain observations is common in property inspections.

Please review the attached report carefully before making your final decision. If you require any further clarification regarding the condition of the property, please feel free to contact us by phone or email between 9:00 a.m. and 5:00 p.m.

Email: info@waslaoman.com
Mobile: +968 90699799`

  const overviewLinesEn = doc.splitTextToSize(overviewTextEn, (contentWidth / 2) - 5)
  doc.text(overviewLinesEn, margin, currentY)

  // Arabic version
  const overviewTextAr = `السادة / ${inspection.clientName || 'العميل'} المحترمون،

نشكر لكم اختياركم "وصلة للحلول العقارية" للقيام بفحص العقار الخاص بكم.
يُقدم هذا التقرير نتائج الفحص والقياسات كما تم توثيقها ميدانيًا في تاريخ الزيارة، ووجود بعض الملاحظات يُعد أمر شائع في عمليات الفحص العقاري.

يرجى مراجعة التقرير المرفق بعناية قبل اتخاذ قراركم النهائي، وإذا كنتم بحاجة إلى توضيحات إضافية حول حالة العقار، فلا تترددوا بالتواصل معنا عبر الهاتف أو البريد الإلكتروني من الساعة 9 صباحًا حتى 5 مساءً على:

البريد الإلكتروني: info@waslaoman.com
الهاتف: +968 90699799`

  const overviewLinesAr = doc.splitTextToSize(overviewTextAr, (contentWidth / 2) - 5)
  doc.text(overviewLinesAr, pageWidth / 2 + 5, currentY, { align: 'right' })

  // PAGE 2: IMPORTANT NOTICES (Bilingual)
  doc.addPage()
  addProfessionalHeader(2)
  currentY = 45

  currentY = createSectionHeader('IMPORTANT NOTICES', 'ملاحظات مهمة', currentY)

  // Notice 1: No property is perfect (Bilingual)
  doc.setFillColor(255, 251, 235)
  doc.roundedRect(margin, currentY, contentWidth, 45, 3, 3, 'F')
  doc.setDrawColor(...accentGold)
  doc.setLineWidth(0.5)
  doc.roundedRect(margin, currentY, contentWidth, 45, 3, 3, 'S')

  doc.setFontSize(10)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...corporateBlue)
  doc.text('No property is perfect', margin + 5, currentY + 8)
  doc.text('لا يوجد عقار مثالي', pageWidth - margin - 5, currentY + 8, { align: 'right' })

  doc.setFontSize(8)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(0, 0, 0)

  const notice1En = `Every building has imperfections or items that are ready for maintenance. It's the inspector's task to discover and report these so you can make informed decisions.`
  const notice1LinesEn = doc.splitTextToSize(notice1En, (contentWidth / 2) - 10)
  doc.text(notice1LinesEn, margin + 5, currentY + 15)

  const notice1Ar = `كل عقار يحتوي على بعض العيوب أو الأجزاء التي تحتاج إلى صيانة. دور المفتش هو تحديد هذه النقاط وتقديمها بوضوح لمساعدتكم في اتخاذ قرارات مستنيرة.`
  const notice1LinesAr = doc.splitTextToSize(notice1Ar, (contentWidth / 2) - 10)
  doc.text(notice1LinesAr, pageWidth - margin - 5, currentY + 15, { align: 'right' })

  currentY += 50

  // Notice 2: This report is not an appraisal
  doc.setFillColor(240, 248, 255)
  doc.roundedRect(margin, currentY, contentWidth, 50, 3, 3, 'F')
  doc.setDrawColor(...corporateBlue)
  doc.setLineWidth(0.5)
  doc.roundedRect(margin, currentY, contentWidth, 50, 3, 3, 'S')

  doc.setFontSize(10)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...corporateBlue)
  doc.text('This report is not an appraisal', margin + 5, currentY + 8)
  doc.text('هذا التقرير ليس تقييمًا سعريًا', pageWidth - margin - 5, currentY + 8, { align: 'right' })

  doc.setFontSize(8)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(0, 0, 0)

  const notice2En = `Home inspectors focus on the interests of the prospective buyer; their findings can help buyers understand the true costs of ownership.`
  const notice2LinesEn = doc.splitTextToSize(notice2En, (contentWidth / 2) - 10)
  doc.text(notice2LinesEn, margin + 5, currentY + 15)

  const notice2Ar = `فاحص العقار يركز على مصلحة المشتري المحتمل. نتائج الفحص تساعد المشتري في فهم التكاليف الحقيقية لامتلاك العقار.`
  const notice2LinesAr = doc.splitTextToSize(notice2Ar, (contentWidth / 2) - 10)
  doc.text(notice2LinesAr, pageWidth - margin - 5, currentY + 15, { align: 'right' })

  currentY += 55

  // Notice 3: Maintenance costs
  doc.setFillColor(255, 251, 235)
  doc.roundedRect(margin, currentY, contentWidth, 45, 3, 3, 'F')
  doc.setDrawColor(...accentGold)
  doc.setLineWidth(0.5)
  doc.roundedRect(margin, currentY, contentWidth, 45, 3, 3, 'S')

  doc.setFontSize(10)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...corporateBlue)
  doc.text('Maintenance costs are normal', margin + 5, currentY + 8)
  doc.text('تكاليف الصيانة أمر طبيعي', pageWidth - margin - 5, currentY + 8, { align: 'right' })

  doc.setFontSize(8)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(0, 0, 0)

  const notice3En = `Homeowners should plan to spend around 1% of the total value of a property in maintenance costs, annually.`
  const notice3LinesEn = doc.splitTextToSize(notice3En, (contentWidth / 2) - 10)
  doc.text(notice3LinesEn, margin + 5, currentY + 15)

  const notice3Ar = `ينبغي على مالكي العقارات تخصيص ما يُعادل 1% من قيمة العقار سنويًا لأعمال الصيانة الدورية.`
  const notice3LinesAr = doc.splitTextToSize(notice3Ar, (contentWidth / 2) - 10)
  doc.text(notice3LinesAr, pageWidth - margin - 5, currentY + 15, { align: 'right' })

  // PAGE 3: SCOPE & CONFIDENTIALITY
  doc.addPage()
  addProfessionalHeader(3)
  currentY = 45

  currentY = createSectionHeader('SCOPE OF THE INSPECTION', 'نطاق الفحص', currentY)

  // Scope text (Bilingual)
  doc.setFontSize(8)
  doc.setFont('helvetica', 'normal')

  const scopeTextEn = `This report details the outcome of a visual survey of the property detailed in the annexed inspection checklist in order to check the quality of workmanship against applicable standards. It covers both the interior and exterior of the property as well as garden, driveway and garage if relevant. Areas not inspected, for whatever reason, cannot guarantee that these areas are free from defects.

This report was formed as per the client request as a supportive opinion to enable him to have better understanding about property conditions. Our opinion does not study the property value or the engineering of the structure rather it studies the functionality of the property.`

  const scopeLinesEn = doc.splitTextToSize(scopeTextEn, (contentWidth / 2) - 5)
  doc.text(scopeLinesEn, margin, currentY)

  const scopeTextAr = `يوضح هذا التقرير نتيجة الفحص البصري للعقار كما هو مفصل في قائمة الفحص المرفقة، بهدف تقييم جودة التنفيذ مقارنة بالمعايير المعتمدة. يشمل الفحص المناطق الداخلية والخارجية، بالإضافة إلى الحديقة، والممر، والجراج (إن وُجد). كما لا يمكن ضمان خلو المناطق غير المفحوصة من العيوب لأي سببٍ كان.

وقد تم إعداد هذا التقرير بناءً على طلب العميل لتقديم رأي داعم يساعده على فهم حالة العقار بشكل أفضل. رأينا الفني لا يشمل تقييم القيمة السوقية أو التحليل الإنشائي، بل يركز على حالة العقار ووظائفه العامة.`

  const scopeLinesAr = doc.splitTextToSize(scopeTextAr, (contentWidth / 2) - 5)
  doc.text(scopeLinesAr, pageWidth - margin, currentY, { align: 'right' })

  currentY += Math.max(scopeLinesEn.length, scopeLinesAr.length) * 4 + 15

  // CONFIDENTIALITY Section
  currentY = createSectionHeader('CONFIDENTIALITY OF THE REPORT', 'سرية التقرير', currentY)

  doc.setFillColor(255, 243, 224)
  doc.roundedRect(margin, currentY, contentWidth, 40, 3, 3, 'F')
  doc.setDrawColor(255, 193, 7)
  doc.setLineWidth(0.5)
  doc.roundedRect(margin, currentY, contentWidth, 40, 3, 3, 'S')

  doc.setFontSize(8)
  doc.setFont('helvetica', 'normal')

  const confTextEn = `The inspection report is prepared for the Client for the purpose of informing of the major deficiencies in the condition of the subject property and is solely and exclusively for Client's own information.`
  const confLinesEn = doc.splitTextToSize(confTextEn, (contentWidth / 2) - 10)
  doc.text(confLinesEn, margin + 5, currentY + 8)

  const confTextAr = `تم إعداد تقرير الفحص هذا خصيصًا للعميل بغرض إعلامه بالنواقص الجوهرية في حالة العقار محل الفحص، وهو للاستخدام الشخصي فقط.`
  const confLinesAr = doc.splitTextToSize(confTextAr, (contentWidth / 2) - 10)
  doc.text(confLinesAr, pageWidth - margin - 5, currentY + 8, { align: 'right' })

  // PAGE 4: INSPECTION FINDINGS
  doc.addPage()
  addProfessionalHeader(4)
  currentY = 45

  currentY = createSectionHeader('INSPECTION FINDINGS', 'نتائج الفحص', currentY)

  // Status Legend with icons
  doc.setFontSize(9)

  // Pass indicator
  doc.setFillColor(34, 197, 94)
  doc.roundedRect(margin, currentY, 40, 8, 2, 2, 'F')
  doc.setTextColor(255, 255, 255)
  doc.text('✓ Pass / ناجح', margin + 20, currentY + 5.5, { align: 'center' })

  // Fail indicator
  doc.setFillColor(239, 68, 68)
  doc.roundedRect(margin + 45, currentY, 40, 8, 2, 2, 'F')
  doc.text('✗ Fail / فاشل', margin + 65, currentY + 5.5, { align: 'center' })

  // N/A indicator
  doc.setFillColor(156, 163, 175)
  doc.roundedRect(margin + 90, currentY, 40, 8, 2, 2, 'F')
  doc.text('— N/A / غير منطبق', margin + 110, currentY + 5.5, { align: 'center' })

  doc.setTextColor(0, 0, 0)
  currentY += 15

  // Prepare inspection data for table
  const tableData: any[] = []
  let itemNum = 1
  let totalPass = 0, totalFail = 0, totalNA = 0
  let photoCount = 0

  inspection.areas.forEach(area => {
    // Area header row with bilingual name
    tableData.push([{
      content: `${area.name.toUpperCase()}`,
      colSpan: 6,
      styles: {
        fillColor: [240, 245, 250],
        fontStyle: 'bold',
        fontSize: 10,
        textColor: corporateBlue,
        halign: 'center'
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
      const statusSymbol = status === 'Pass' ? '✓' :
                           status === 'Fail' ? '✗' : '—'

      // Comments and location combined
      let notes = ''
      if (item.comments) notes += item.comments
      if (item.location) {
        notes += (notes ? ' | Location: ' : 'Location: ') + item.location
      }
      if (item.photos && item.photos.length > 0) {
        notes += ` | 📷 ${item.photos.length}`
      }

      tableData.push([
        itemNum++,
        item.category || '',
        item.point || '',
        {
          content: `${statusSymbol} ${status}`,
          styles: { textColor: statusColor, fontStyle: 'bold', halign: 'center' }
        },
        notes || '-',
        item.photos && item.photos.length > 0 ? '📷' : '-'
      ])
    })
  })

  // Create the professional inspection table
  doc.autoTable({
    head: [['#', 'Category', 'Inspection Point', 'Status', 'Observations', '📷']],
    body: tableData,
    startY: currentY,
    margin: { left: margin, right: margin },
    theme: 'striped',
    headStyles: {
      fillColor: corporateBlue,
      textColor: 255,
      fontSize: 9,
      fontStyle: 'bold',
      halign: 'center'
    },
    bodyStyles: {
      fontSize: 8,
      cellPadding: 3
    },
    alternateRowStyles: {
      fillColor: [250, 250, 250]
    },
    columnStyles: {
      0: { cellWidth: 10, halign: 'center' },
      1: { cellWidth: 30 },
      2: { cellWidth: 50 },
      3: { cellWidth: 25, halign: 'center' },
      4: { cellWidth: 55 },
      5: { cellWidth: 10, halign: 'center' }
    },
    didDrawPage: function(data: any) {
      // Add headers and footers to table pages
      if (data.pageNumber > 4) {
        addProfessionalHeader(data.pageNumber)
      }
    }
  })

  currentY = doc.lastAutoTable.finalY + 10

  // EXECUTIVE SUMMARY
  if (currentY > pageHeight - 80) {
    doc.addPage()
    addProfessionalHeader(5)
    currentY = 45
  }

  currentY = createSectionHeader('EXECUTIVE SUMMARY', 'الملخص التنفيذي', currentY)

  // Summary Statistics Cards
  const cardWidth = 55
  const cardHeight = 35
  const cardSpacing = 5
  const totalItems = totalPass + totalFail + totalNA
  const passRate = totalItems > 0 ? Math.round((totalPass / (totalPass + totalFail)) * 100) || 0 : 0

  // Total Inspected Card
  doc.setFillColor(...lightGray)
  doc.roundedRect(margin, currentY, cardWidth, cardHeight, 3, 3, 'F')
  doc.setDrawColor(...corporateBlue)
  doc.setLineWidth(0.5)
  doc.roundedRect(margin, currentY, cardWidth, cardHeight, 3, 3, 'S')
  doc.setFontSize(9)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...corporateBlue)
  doc.text('Total Inspected', margin + cardWidth/2, currentY + 8, { align: 'center' })
  doc.text('إجمالي المفحوص', margin + cardWidth/2, currentY + 13, { align: 'center' })
  doc.setFontSize(18)
  doc.setTextColor(0, 0, 0)
  doc.text(totalItems.toString(), margin + cardWidth/2, currentY + 25, { align: 'center' })

  // Pass Rate Card
  const passRateColor = passRate >= 80 ? [34, 197, 94] :
                       passRate >= 60 ? [251, 191, 36] : [239, 68, 68]
  doc.setFillColor(...lightGray)
  doc.roundedRect(margin + cardWidth + cardSpacing, currentY, cardWidth, cardHeight, 3, 3, 'F')
  doc.setDrawColor(passRateColor[0], passRateColor[1], passRateColor[2])
  doc.setLineWidth(1)
  doc.roundedRect(margin + cardWidth + cardSpacing, currentY, cardWidth, cardHeight, 3, 3, 'S')
  doc.setFontSize(9)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...corporateBlue)
  doc.text('Pass Rate', margin + cardWidth + cardSpacing + cardWidth/2, currentY + 8, { align: 'center' })
  doc.text('نسبة النجاح', margin + cardWidth + cardSpacing + cardWidth/2, currentY + 13, { align: 'center' })
  doc.setFontSize(18)
  doc.setTextColor(passRateColor[0], passRateColor[1], passRateColor[2])
  doc.text(`${passRate}%`, margin + cardWidth + cardSpacing + cardWidth/2, currentY + 25, { align: 'center' })

  // Photos Card
  doc.setFillColor(...lightGray)
  doc.roundedRect(margin + (cardWidth + cardSpacing) * 2, currentY, cardWidth, cardHeight, 3, 3, 'F')
  doc.setDrawColor(...corporateBlue)
  doc.setLineWidth(0.5)
  doc.roundedRect(margin + (cardWidth + cardSpacing) * 2, currentY, cardWidth, cardHeight, 3, 3, 'S')
  doc.setFontSize(9)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...corporateBlue)
  doc.text('Photos Attached', margin + (cardWidth + cardSpacing) * 2 + cardWidth/2, currentY + 8, { align: 'center' })
  doc.text('الصور المرفقة', margin + (cardWidth + cardSpacing) * 2 + cardWidth/2, currentY + 13, { align: 'center' })
  doc.setFontSize(18)
  doc.setTextColor(0, 0, 0)
  doc.text(photoCount.toString(), margin + (cardWidth + cardSpacing) * 2 + cardWidth/2, currentY + 25, { align: 'center' })

  currentY += cardHeight + 15

  // Breakdown Statistics
  doc.setFillColor(240, 248, 255)
  doc.roundedRect(margin, currentY, contentWidth, 30, 3, 3, 'F')

  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(0, 0, 0)

  const breakdownY = currentY + 10
  // Pass
  doc.setFillColor(34, 197, 94)
  doc.rect(margin + 10, breakdownY, 30, 5, 'F')
  doc.text(`Pass: ${totalPass}`, margin + 45, breakdownY + 3.5)

  // Fail
  doc.setFillColor(239, 68, 68)
  doc.rect(margin + 70, breakdownY, 30, 5, 'F')
  doc.text(`Fail: ${totalFail}`, margin + 105, breakdownY + 3.5)

  // N/A
  doc.setFillColor(156, 163, 175)
  doc.rect(margin + 130, breakdownY, 30, 5, 'F')
  doc.text(`N/A: ${totalNA}`, margin + 165, breakdownY + 3.5)

  currentY += 40

  // SIGNATURES PAGE
  if (currentY > pageHeight - 100) {
    doc.addPage()
    addProfessionalHeader((doc as any).internal.pages.length - 1)
    currentY = 45
  }

  currentY = createSectionHeader('SIGNATURES & ACKNOWLEDGMENT', 'التوقيعات والإقرار', currentY)

  // Signature boxes
  doc.setFillColor(255, 255, 255)
  doc.setDrawColor(...corporateBlue)
  doc.setLineWidth(0.5)

  // Client signature box
  doc.roundedRect(margin, currentY, (contentWidth / 2) - 5, 50, 3, 3, 'S')
  doc.setFontSize(9)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...corporateBlue)
  doc.text('Client / العميل', margin + 5, currentY + 8)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(0, 0, 0)
  doc.text(`Name: ${inspection.clientName || '_______________________'}`, margin + 5, currentY + 18)
  doc.text('الاسم: _______________________', margin + 5, currentY + 25)
  doc.text('Signature / التوقيع:', margin + 5, currentY + 35)
  doc.setDrawColor(200, 200, 200)
  doc.line(margin + 35, currentY + 35, margin + (contentWidth/2) - 10, currentY + 35)

  // Inspector signature box
  doc.setDrawColor(...corporateBlue)
  doc.roundedRect(pageWidth/2 + 5, currentY, (contentWidth / 2) - 5, 50, 3, 3, 'S')
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...corporateBlue)
  doc.text('Inspector / المفتش', pageWidth/2 + 10, currentY + 8)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(0, 0, 0)
  doc.text(`Name: ${inspection.inspectorName || 'Wasla Inspector'}`, pageWidth/2 + 10, currentY + 18)
  doc.text('الاسم: مفتش وصلة', pageWidth/2 + 10, currentY + 25)
  doc.text('Stamp / الختم:', pageWidth/2 + 10, currentY + 35)

  currentY += 55

  // Date
  doc.setFontSize(10)
  doc.setFont('helvetica', 'bold')
  doc.text(`Date / التاريخ: ${new Date().toLocaleDateString('en-GB')}`, pageWidth / 2, currentY + 5, { align: 'center' })

  currentY += 15

  // Final acknowledgment
  doc.setFillColor(255, 251, 235)
  doc.roundedRect(margin, currentY, contentWidth, 25, 3, 3, 'F')
  doc.setDrawColor(...accentGold)
  doc.setLineWidth(0.5)
  doc.roundedRect(margin, currentY, contentWidth, 25, 3, 3, 'S')

  doc.setFontSize(9)
  doc.setFont('helvetica', 'italic')
  doc.setTextColor(133, 77, 14)
  doc.text('Property Inspection report is annexed', pageWidth / 2, currentY + 10, { align: 'center' })
  doc.text('مرفق تقرير الفحص العقاري', pageWidth / 2, currentY + 16, { align: 'center' })

  // Add footers to all pages
  const pageCount = (doc as any).internal.pages.length - 1
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    addProfessionalFooter(i, pageCount)
  }

  // Generate filename
  const clientName = (inspection.clientName || 'Client').replace(/[^a-zA-Z0-9]/g, '_')
  const date = new Date().toISOString().split('T')[0]
  const filename = `WASLA_International_Report_${clientName}_${date}_${reportId}.pdf`

  // Save the PDF
  doc.save(filename)
  console.log('International standard PDF generated successfully:', filename)
}