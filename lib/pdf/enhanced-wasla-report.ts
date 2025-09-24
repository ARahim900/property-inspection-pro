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

// Helper to handle Arabic text (using Unicode)
const addFontSupport = (doc: jsPDF) => {
  doc.setFont('helvetica')
}

// Helper to add images to PDF
const addImageToPDF = (doc: jsPDF, base64Data: string, x: number, y: number, width: number, height: number) => {
  try {
    // Check if it's a valid base64 image
    if (base64Data && base64Data.includes('base64,')) {
      // Detect image format from base64 string
      let format = 'JPEG'
      if (base64Data.includes('image/png')) {
        format = 'PNG'
      } else if (base64Data.includes('image/gif')) {
        format = 'GIF'
      } else if (base64Data.includes('image/webp')) {
        format = 'WEBP'
      }

      // Use the addImage method with proper typing
      (doc as any).addImage(base64Data, format, x, y, width, height)
      return true
    }
  } catch (error) {
    console.error('Error adding image to PDF:', error)
  }
  return false
}

export async function generateEnhancedWaslaReport(inspection: InspectionData): Promise<void> {
  try {
    console.log('Starting enhanced PDF generation for inspection:', inspection.id)

    const doc = new jsPDF('p', 'mm', 'a4')
    const pageWidth = 210
    const pageHeight = 297
    const margin = 15
    const contentWidth = pageWidth - (margin * 2)

    // Generate report ID early so it's available throughout
    const reportId = `WASLA-${new Date().getFullYear()}-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`

    addFontSupport(doc)

    // Corporate Colors
    const waslaBlue = [0, 31, 63] as [number, number, number]
    const waslaGold = [218, 165, 32] as [number, number, number]
    const lightBg = [248, 250, 252] as [number, number, number]

    // Track page numbers for footers
    let currentPageNum = 1

    // Helper: Add new page with consistent formatting
    const addNewPage = () => {
    doc.addPage()
    currentPageNum++
    addPageHeader()
    return 45 // Return starting Y position for content
  }

  // Helper: Check if we need a new page
  const checkNewPage = (currentY: number, requiredSpace: number): number => {
    if (currentY + requiredSpace > pageHeight - 25) {
      return addNewPage()
    }
    return currentY
  }

  // Add Header to each page
  const addPageHeader = () => {
    // Header background
    doc.setFillColor(...waslaBlue)
    doc.rect(0, 0, pageWidth, 35, 'F')

    // Gold accent line
    doc.setFillColor(...waslaGold)
    doc.rect(0, 35, pageWidth, 2, 'F')

    // Company Logo placeholder (white circle)
    doc.setFillColor(255, 255, 255)
    doc.circle(25, 18, 10, 'F')
    doc.setFillColor(...waslaGold)
    doc.setFontSize(12)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...waslaBlue)
    doc.text('W', 25, 21, { align: 'center' })

    // Company name
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(20)
    doc.setFont('helvetica', 'bold')
    doc.text('WASLA REAL ESTATE SOLUTIONS', pageWidth / 2, 18, { align: 'center' })

    doc.setFontSize(11)
    doc.setFont('helvetica', 'normal')
    doc.text('وصلة للحلول العقارية', pageWidth / 2, 26, { align: 'center' })

    doc.setTextColor(0, 0, 0)
  }

  // Add Footer to each page
  const addPageFooter = (pageNum: number, totalPages: number) => {
    // Footer background
    doc.setFillColor(...waslaBlue)
    doc.rect(0, pageHeight - 20, pageWidth, 20, 'F')

    doc.setTextColor(255, 255, 255)
    doc.setFontSize(8)

    // Contact info
    doc.text('📧 info@waslaoman.com | 📱 +968 90699799', margin, pageHeight - 12)

    // Company registration
    doc.text('Wasla Property Solutions CR. 1068375', pageWidth / 2, pageHeight - 12, { align: 'center' })
    doc.text('وصلة للحلول العقارية س.ت. 1068375', pageWidth / 2, pageHeight - 6, { align: 'center' })

    // Page number
    doc.text(`Page ${pageNum} of ${totalPages}`, pageWidth - margin, pageHeight - 9, { align: 'right' })

    doc.setTextColor(0, 0, 0)
  }

  // PAGE 1: COVER WITH DISCLAIMER TITLE
  addPageHeader()
  let currentY = 50

  // Main Title
  doc.setFontSize(28)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...waslaBlue)
  doc.text('PROPERTY', pageWidth / 2, currentY, { align: 'center' })
  currentY += 12
  doc.text('INSPECTION REPORT', pageWidth / 2, currentY, { align: 'center' })
  currentY += 10
  doc.setFontSize(18)
  doc.text('تقرير فحص العقار', pageWidth / 2, currentY, { align: 'center' })
  currentY += 20

  // Property Information Card
  doc.setFillColor(...lightBg)
  doc.roundedRect(margin, currentY, contentWidth, 75, 5, 5, 'F')
  doc.setDrawColor(...waslaBlue)
  doc.setLineWidth(1.5)
  doc.roundedRect(margin, currentY, contentWidth, 75, 5, 5, 'S')

  currentY += 12
  const infoStartY = currentY

  // Property Details (Two columns)
  doc.setFontSize(11)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...waslaBlue)

  // Left Column
  doc.text('Client Name / اسم العميل:', margin + 10, currentY)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(0, 0, 0)
  doc.text(inspection.clientName || 'Not Specified', margin + 10, currentY + 6)

  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...waslaBlue)
  doc.text('Property Type / نوع العقار:', margin + 10, currentY + 18)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(0, 0, 0)
  doc.text(inspection.propertyType || 'Not Specified', margin + 10, currentY + 24)

  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...waslaBlue)
  doc.text('Inspection Date / تاريخ الفحص:', margin + 10, currentY + 36)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(0, 0, 0)
  const inspDate = inspection.inspectionDate
    ? new Date(inspection.inspectionDate).toLocaleDateString('en-GB')
    : new Date().toLocaleDateString('en-GB')
  doc.text(inspDate, margin + 10, currentY + 42)

  // Right Column
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...waslaBlue)
  doc.text('Location / الموقع:', pageWidth / 2 + 10, currentY)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(0, 0, 0)
  const location = inspection.propertyLocation || 'Not Specified'
  doc.text(location.substring(0, 30), pageWidth / 2 + 10, currentY + 6)

  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...waslaBlue)
  doc.text('Inspector / المفتش:', pageWidth / 2 + 10, currentY + 18)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(0, 0, 0)
  doc.text(inspection.inspectorName || 'Wasla Inspector', pageWidth / 2 + 10, currentY + 24)

  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...waslaBlue)
  doc.text('Report ID / رقم التقرير:', pageWidth / 2 + 10, currentY + 36)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(0, 0, 0)
  doc.text(reportId, pageWidth / 2 + 10, currentY + 42)

  currentY = infoStartY + 65

  // Important Notice on Cover
  doc.setFillColor(255, 247, 237)
  doc.roundedRect(margin, currentY, contentWidth, 40, 3, 3, 'F')
  doc.setDrawColor(...waslaGold)
  doc.setLineWidth(0.5)
  doc.roundedRect(margin, currentY, contentWidth, 40, 3, 3, 'S')

  doc.setFontSize(10)
  doc.setFont('helvetica', 'italic')
  doc.setTextColor(133, 77, 14)
  const coverNotice = `This report contains important disclaimers, terms, and conditions. Please read the entire report carefully before making any decisions regarding the property.`
  const coverNoticeLines = doc.splitTextToSize(coverNotice, contentWidth - 20)
  doc.text(coverNoticeLines, margin + 10, currentY + 10)

  const coverNoticeAr = `يحتوي هذا التقرير على إخلاء مسؤولية وشروط وأحكام مهمة. يُرجى قراءة التقرير بالكامل بعناية قبل اتخاذ أي قرارات بشأن العقار.`
  const coverNoticeArLines = doc.splitTextToSize(coverNoticeAr, contentWidth - 20)
  doc.text(coverNoticeArLines, margin + 10, currentY + 25)

    // PAGE 2: FULL DISCLAIMER AND OVERVIEW
    doc.addPage()
  currentPageNum++
  addPageHeader()
  currentY = 45

  // Section: DISCLAIMER & OVERVIEW
  doc.setFillColor(...waslaBlue)
  doc.rect(margin, currentY, contentWidth, 12, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.text('OVERVIEW & DISCLAIMER', margin + 5, currentY + 8)
  doc.text('نظرة عامة وإخلاء المسؤولية', pageWidth - margin - 5, currentY + 8, { align: 'right' })
  doc.setTextColor(0, 0, 0)
  currentY += 18

  // Dear Client Letter
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')

  // English Version
  const dearClientEn = `Dear ${inspection.clientName || 'Mr./Ms. Client'},

Thank you for choosing Wasla Real Estate Solutions to carry out the inspection of your property.

This report presents the inspection findings and measurements as documented on site on the date of the visit, and the presence of certain observations is common in property inspections.

Please review the attached report carefully before making your final decision. If you require any further clarification regarding the condition of the property, please feel free to contact us by phone or email between 9:00 a.m. and 5:00 p.m.

Email: info@waslaoman.com
Mobile: +968 90699799`

  const clientLetterLines = doc.splitTextToSize(dearClientEn, contentWidth - 10)
  doc.text(clientLetterLines, margin + 5, currentY)
  currentY += clientLetterLines.length * 4 + 10

  // Arabic Version Box
  doc.setFillColor(248, 250, 252)
  doc.roundedRect(margin, currentY, contentWidth, 55, 3, 3, 'F')
  currentY += 8

  const dearClientAr = `السادة / ${inspection.clientName || 'العميل'} المحترمون،

نشكر لكم اختياركم "وصلة للحلول العقارية" للقيام بفحص العقار الخاص بكم.
يُقدم هذا التقرير نتائج الفحص والقياسات كما تم توثيقها ميدانيًا في تاريخ الزيارة، ووجود بعض الملاحظات يُعد أمر شائع في عمليات الفحص العقاري.

يرجى مراجعة التقرير المرفق بعناية قبل اتخاذ قراركم النهائي، وإذا كنتم بحاجة إلى توضيحات إضافية حول حالة العقار، فلا تترددوا بالتواصل معنا عبر الهاتف أو البريد الإلكتروني من الساعة 9 صباحًا حتى 5 مساءً.

البريد الإلكتروني: info@waslaoman.com
الهاتف: +968 90699799`

  doc.setFontSize(10)
  const clientLetterArLines = doc.splitTextToSize(dearClientAr, contentWidth - 10)
  doc.text(clientLetterArLines, margin + 5, currentY)
  currentY += 52

    // PAGE 3: IMPORTANT NOTICES
    doc.addPage()
  currentPageNum++
  addPageHeader()
  currentY = 45

  // Important Notices Header
  doc.setFillColor(...waslaBlue)
  doc.rect(margin, currentY, contentWidth, 12, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.text('IMPORTANT NOTICES', margin + 5, currentY + 8)
  doc.text('ملاحظات مهمة', pageWidth - margin - 5, currentY + 8, { align: 'right' })
  doc.setTextColor(0, 0, 0)
  currentY += 18

  // Notice 1: No property is perfect
  doc.setFillColor(254, 243, 199)
  doc.roundedRect(margin, currentY, contentWidth, 50, 3, 3, 'F')
  doc.setDrawColor(251, 191, 36)
  doc.setLineWidth(0.5)
  doc.roundedRect(margin, currentY, contentWidth, 50, 3, 3, 'S')

  doc.setFontSize(11)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...waslaBlue)
  doc.text('No property is perfect / لا يوجد عقار مثالي', margin + 5, currentY + 10)

  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(0, 0, 0)
  const notice1 = `Every building has imperfections or items that are ready for maintenance. It's the inspector's task to discover and report these so you can make informed decisions. This report should not be used as a tool to demean property, but rather a way to illuminate the realities of the property.

كل عقار يحتوي على بعض العيوب أو الأجزاء التي تحتاج إلى صيانة. دور المفتش هو تحديد هذه النقاط وتقديمها بوضوح لمساعدتكم في اتخاذ قرارات مستنيرة. هذا التقرير لا يُقصد به التقليل من قيمة العقار، وإنما يهدف إلى توضيح الحالة الواقعية له.`

  const notice1Lines = doc.splitTextToSize(notice1, contentWidth - 10)
  doc.text(notice1Lines, margin + 5, currentY + 18)
  currentY += 55

  // Notice 2: Not an appraisal
  doc.setFillColor(219, 234, 254)
  doc.roundedRect(margin, currentY, contentWidth, 55, 3, 3, 'F')
  doc.setDrawColor(59, 130, 246)
  doc.setLineWidth(0.5)
  doc.roundedRect(margin, currentY, contentWidth, 55, 3, 3, 'S')

  doc.setFontSize(11)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...waslaBlue)
  doc.text('This report is not an appraisal / هذا التقرير ليس تقييمًا سعريًا', margin + 5, currentY + 10)

  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(0, 0, 0)
  const notice2 = `When an appraiser determines worth, only the most obvious conditions of a property are taken into account. Home inspectors focus more on the interests of the prospective buyer; although inspectors must be careful not to make any statements relating to property value, their findings can help buyers understand the true costs of ownership.

عند قيام المثمن بتحديد قيمة العقار، فإنه يأخذ بعين الاعتبار فقط العيوب الظاهرة. أما فاحص العقار، فيركز على مصلحة المشتري المحتمل. ورغم أن المفتش لا يحدد قيمة العقار، إلا أن نتائج الفحص تساعد المشتري في فهم التكاليف الحقيقية لامتلاك العقار.`

  const notice2Lines = doc.splitTextToSize(notice2, contentWidth - 10)
  doc.text(notice2Lines, margin + 5, currentY + 18)
  currentY += 60

  // Notice 3: Maintenance costs
  doc.setFillColor(220, 252, 231)
  doc.roundedRect(margin, currentY, contentWidth, 50, 3, 3, 'F')
  doc.setDrawColor(34, 197, 94)
  doc.setLineWidth(0.5)
  doc.roundedRect(margin, currentY, contentWidth, 50, 3, 3, 'S')

  doc.setFontSize(11)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...waslaBlue)
  doc.text('Maintenance costs are normal / تكاليف الصيانة أمر طبيعي', margin + 5, currentY + 10)

  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(0, 0, 0)
  const notice3 = `Homeowners should plan to spend around 1% of the total value of a property in maintenance costs, annually. (Annual costs of rental property maintenance are often 2%, or more.) If considerably less has been invested, the property will usually show signs of neglect.

ينبغي على مالكي العقارات تخصيص ما يُعادل 1% من قيمة العقار سنويًا لأعمال الصيانة الدورية. أما العقارات المؤجرة فقد تصل النسبة إلى 2% أو أكثر.`

  const notice3Lines = doc.splitTextToSize(notice3, contentWidth - 10)
  doc.text(notice3Lines, margin + 5, currentY + 18)

    // PAGE 4: SCOPE & CONFIDENTIALITY
    doc.addPage()
  currentPageNum++
  addPageHeader()
  currentY = 45

  // SCOPE Header
  doc.setFillColor(...waslaBlue)
  doc.rect(margin, currentY, contentWidth, 12, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.text('SCOPE OF THE INSPECTION', margin + 5, currentY + 8)
  doc.text('نطاق الفحص', pageWidth - margin - 5, currentY + 8, { align: 'right' })
  doc.setTextColor(0, 0, 0)
  currentY += 18

  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  const scopeText = `This report details the outcome of a visual survey of the property detailed in the annexed inspection checklist in order to check the quality of workmanship against applicable standards. It covers both the interior and exterior of the property as well as garden, driveway and garage if relevant. Areas not inspected, for whatever reason, cannot guarantee that these areas are free from defects.

This report was formed as per the client request as a supportive opinion to enable him to have better understanding about property conditions. Our opinion does not study the property value or the engineering of the structure rather it studies the functionality of the property. This report will be listing the property defects supported by images and videos, by showing full study of the standards of property status and functionality including other relevant elements of the property as stated in the checklist.

يوضح هذا التقرير نتيجة الفحص البصري للعقار كما هو مفصل في قائمة الفحص المرفقة، بهدف تقييم جودة التنفيذ مقارنة بالمعايير المعتمدة. يشمل الفحص المناطق الداخلية والخارجية، بالإضافة إلى الحديقة، والممر، والجراج (إن وُجد). كما لا يمكن ضمان خلو المناطق غير المفحوصة من العيوب لأي سببٍ كان.

وقد تم إعداد هذا التقرير بناءً على طلب العميل لتقديم رأي داعم يساعده على فهم حالة العقار بشكل أفضل. رأينا الفني لا يشمل تقييم القيمة السوقية أو التحليل الإنشائي، بل يركز على حالة العقار ووظائفه العامة. كما سيتم سرد العيوب المرصودة بناءً على دراسة كاملة لمعايير الحالة والأداء الوظيفي للعقار مشمولة بالصور والفيديوهات.`

  const scopeLines = doc.splitTextToSize(scopeText, contentWidth - 10)
  doc.text(scopeLines, margin + 5, currentY)
  currentY += scopeLines.length * 4 + 15

  // CONFIDENTIALITY Section
  doc.setFillColor(...waslaBlue)
  doc.rect(margin, currentY, contentWidth, 12, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.text('CONFIDENTIALITY OF THE REPORT', margin + 5, currentY + 8)
  doc.text('سرية التقرير', pageWidth - margin - 5, currentY + 8, { align: 'right' })
  doc.setTextColor(0, 0, 0)
  currentY += 18

  doc.setFillColor(255, 243, 224)
  doc.roundedRect(margin, currentY, contentWidth, 50, 3, 3, 'F')
  doc.setDrawColor(251, 146, 60)
  doc.setLineWidth(0.5)
  doc.roundedRect(margin, currentY, contentWidth, 50, 3, 3, 'S')

  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  const confText = `The inspection report is to be prepared for the Client for the purpose of informing of the major deficiencies in the condition of the subject property and is solely and exclusively for Client's own information and may not be relied upon by any other person. Client may distribute copies of the inspection report to the seller and the real estate agents directly involved in this transaction, but Client and Inspector do not in any way intend to benefit said seller or the real estate agents directly or indirectly through this Agreement or the inspection report.

تم إعداد تقرير الفحص هذا خصيصًا للعميل بغرض إعلامه بالنواقص الجوهرية في حالة العقار محل الفحص، وهو للاستخدام الشخصي فقط ولا يجوز الاعتماد عليه من قبل أي طرف آخر. يجوز للعميل مشاركة نسخة من التقرير مع البائع أو وكلاء العقارات المعنيين بهذه الصفقة، إلا أن كل من العميل والفاحص لا يقصدان من خلال هذا التقرير تحقيق أي منفعة مباشرة أو غير مباشرة لهؤلاء الأطراف.`

  const confLines = doc.splitTextToSize(confText, contentWidth - 10)
  doc.text(confLines, margin + 5, currentY + 8)

    // PAGE 5: INSPECTION FINDINGS
    doc.addPage()
  currentPageNum++
  addPageHeader()
  currentY = 45

  // Inspection Findings Header
  doc.setFillColor(...waslaBlue)
  doc.rect(margin, currentY, contentWidth, 12, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.text('INSPECTION FINDINGS', margin + 5, currentY + 8)
  doc.text('نتائج الفحص', pageWidth - margin - 5, currentY + 8, { align: 'right' })
  doc.setTextColor(0, 0, 0)
  currentY += 18

  // Status Legend
  doc.setFontSize(10)
  doc.setFillColor(34, 197, 94)
  doc.roundedRect(margin, currentY, 35, 8, 2, 2, 'F')
  doc.setTextColor(255, 255, 255)
  doc.text('✓ Pass', margin + 17.5, currentY + 5.5, { align: 'center' })

  doc.setFillColor(239, 68, 68)
  doc.roundedRect(margin + 40, currentY, 35, 8, 2, 2, 'F')
  doc.text('✗ Fail', margin + 57.5, currentY + 5.5, { align: 'center' })

  doc.setFillColor(156, 163, 175)
  doc.roundedRect(margin + 80, currentY, 35, 8, 2, 2, 'F')
  doc.text('— N/A', margin + 97.5, currentY + 5.5, { align: 'center' })

  doc.setTextColor(0, 0, 0)
  currentY += 15

  // Prepare inspection data
  const tableData: any[] = []
  let itemNum = 1
  let totalPass = 0, totalFail = 0, totalNA = 0
  let allPhotos: Array<{base64: string, item: string, area: string}> = []

  inspection.areas.forEach(area => {
    // Area header
    tableData.push([{
      content: area.name.toUpperCase(),
      colSpan: 5,
      styles: {
        fillColor: [240, 245, 250],
        fontStyle: 'bold',
        fontSize: 10,
        textColor: waslaBlue,
        halign: 'center'
      }
    }])

    area.items.forEach(item => {
      const status = item.status || 'N/A'
      if (status === 'Pass') totalPass++
      else if (status === 'Fail') totalFail++
      else totalNA++

      // Collect photos for later display
      if (item.photos && item.photos.length > 0) {
        item.photos.forEach(photo => {
          if (photo.base64) {
            allPhotos.push({
              base64: photo.base64,
              item: item.point || '',
              area: area.name
            })
          }
        })
      }

      const statusColor = status === 'Pass' ? [34, 197, 94] :
                         status === 'Fail' ? [239, 68, 68] : [156, 163, 175]
      const statusSymbol = status === 'Pass' ? '✓' :
                           status === 'Fail' ? '✗' : '—'

      let notes = item.comments || ''
      if (item.location) {
        notes += (notes ? ' | ' : '') + `Location: ${item.location}`
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
        notes || '-'
      ])
    })
  })

  // Create inspection table
  doc.autoTable({
    head: [['#', 'Category', 'Inspection Point', 'Status', 'Notes']],
    body: tableData,
    startY: currentY,
    margin: { left: margin, right: margin },
    theme: 'striped',
    headStyles: {
      fillColor: waslaBlue,
      textColor: 255,
      fontSize: 9,
      fontStyle: 'bold'
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
      1: { cellWidth: 35 },
      2: { cellWidth: 60 },
      3: { cellWidth: 25, halign: 'center' },
      4: { cellWidth: 50 }
    },
    didDrawPage: function(data: any) {
      if (data.pageNumber > currentPageNum) {
        currentPageNum++
        addPageHeader()
      }
    }
  })

  currentY = doc.lastAutoTable.finalY + 10

    // PHOTOS SECTION (if any)
    if (allPhotos.length > 0) {
    currentY = checkNewPage(currentY, 50)

    // Photos Section Header
    doc.setFillColor(...waslaBlue)
    doc.rect(margin, currentY, contentWidth, 12, 'F')
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(12)
    doc.setFont('helvetica', 'bold')
    doc.text('INSPECTION PHOTOS', margin + 5, currentY + 8)
    doc.text('صور الفحص', pageWidth - margin - 5, currentY + 8, { align: 'right' })
    doc.setTextColor(0, 0, 0)
    currentY += 18

    // Display photos in a grid (2 per row)
    const photoWidth = 85
    const photoHeight = 60
    const photoSpacing = 10
    let photoCol = 0

    for (let i = 0; i < allPhotos.length && i < 6; i++) { // Limit to 6 photos for space
      const photo = allPhotos[i]

      // Check if we need a new page
      if (photoCol === 0) {
        currentY = checkNewPage(currentY, photoHeight + 20)
      }

      const xPos = margin + (photoCol * (photoWidth + photoSpacing))

      // Photo frame
      doc.setDrawColor(200, 200, 200)
      doc.setLineWidth(0.5)
      doc.rect(xPos, currentY, photoWidth, photoHeight, 'S')

      // Try to add the image
      const imageAdded = addImageToPDF(doc, photo.base64, xPos + 1, currentY + 1, photoWidth - 2, photoHeight - 2)

      if (!imageAdded) {
        // If image fails, add placeholder
        doc.setFillColor(245, 245, 245)
        doc.rect(xPos + 1, currentY + 1, photoWidth - 2, photoHeight - 2, 'F')
        doc.setFontSize(8)
        doc.setTextColor(150, 150, 150)
        doc.text('Image Not Available', xPos + photoWidth/2, currentY + photoHeight/2, { align: 'center' })
      }

      // Photo caption
      doc.setFontSize(7)
      doc.setTextColor(0, 0, 0)
      doc.text(`${photo.area} - ${photo.item}`, xPos, currentY + photoHeight + 4)

      photoCol++
      if (photoCol === 2) {
        photoCol = 0
        currentY += photoHeight + 15
      }
    }

    if (photoCol === 1) {
      currentY += photoHeight + 15
    }

    if (allPhotos.length > 6) {
      doc.setFontSize(9)
      doc.setFont('helvetica', 'italic')
      doc.setTextColor(100, 100, 100)
      doc.text(`+ ${allPhotos.length - 6} more photos available in full report`, margin, currentY)
      currentY += 10
    }
  }

    // SUMMARY STATISTICS
    currentY = checkNewPage(currentY, 60)

  doc.setFillColor(...waslaBlue)
  doc.rect(margin, currentY, contentWidth, 12, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.text('INSPECTION SUMMARY', margin + 5, currentY + 8)
  doc.text('ملخص الفحص', pageWidth - margin - 5, currentY + 8, { align: 'right' })
  doc.setTextColor(0, 0, 0)
  currentY += 18

  // Summary Cards
  const cardWidth = 55
  const cardHeight = 35
  const totalItems = totalPass + totalFail + totalNA
  const passRate = totalItems > 0 ? Math.round((totalPass / (totalPass + totalFail)) * 100) || 0 : 0

  // Total Items Card
  doc.setFillColor(...lightBg)
  doc.roundedRect(margin, currentY, cardWidth, cardHeight, 3, 3, 'F')
  doc.setDrawColor(...waslaBlue)
  doc.roundedRect(margin, currentY, cardWidth, cardHeight, 3, 3, 'S')
  doc.setFontSize(9)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...waslaBlue)
  doc.text('Total Items', margin + cardWidth/2, currentY + 10, { align: 'center' })
  doc.text('إجمالي البنود', margin + cardWidth/2, currentY + 15, { align: 'center' })
  doc.setFontSize(20)
  doc.text(totalItems.toString(), margin + cardWidth/2, currentY + 27, { align: 'center' })

  // Pass Rate Card
  const passRateColor = passRate >= 80 ? [34, 197, 94] :
                       passRate >= 60 ? [251, 191, 36] : [239, 68, 68]
  doc.setFillColor(...lightBg)
  doc.roundedRect(margin + cardWidth + 7.5, currentY, cardWidth, cardHeight, 3, 3, 'F')
  doc.setDrawColor(...passRateColor)
  doc.setLineWidth(2)
  doc.roundedRect(margin + cardWidth + 7.5, currentY, cardWidth, cardHeight, 3, 3, 'S')
  doc.setFontSize(9)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...waslaBlue)
  doc.text('Pass Rate', margin + cardWidth + 7.5 + cardWidth/2, currentY + 10, { align: 'center' })
  doc.text('نسبة النجاح', margin + cardWidth + 7.5 + cardWidth/2, currentY + 15, { align: 'center' })
  doc.setFontSize(20)
  doc.setTextColor(...passRateColor)
  doc.text(`${passRate}%`, margin + cardWidth + 7.5 + cardWidth/2, currentY + 27, { align: 'center' })

  // Photos Count Card
  doc.setFillColor(...lightBg)
  doc.roundedRect(margin + (cardWidth + 7.5) * 2, currentY, cardWidth, cardHeight, 3, 3, 'F')
  doc.setDrawColor(...waslaBlue)
  doc.setLineWidth(0.5)
  doc.roundedRect(margin + (cardWidth + 7.5) * 2, currentY, cardWidth, cardHeight, 3, 3, 'S')
  doc.setFontSize(9)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...waslaBlue)
  doc.text('Photos', margin + (cardWidth + 7.5) * 2 + cardWidth/2, currentY + 10, { align: 'center' })
  doc.text('الصور', margin + (cardWidth + 7.5) * 2 + cardWidth/2, currentY + 15, { align: 'center' })
  doc.setFontSize(20)
  doc.text(allPhotos.length.toString(), margin + (cardWidth + 7.5) * 2 + cardWidth/2, currentY + 27, { align: 'center' })

  currentY += cardHeight + 10

  // Breakdown bar
  doc.setFillColor(240, 248, 255)
  doc.roundedRect(margin, currentY, contentWidth, 20, 3, 3, 'F')
  const barY = currentY + 10
  const barWidth = contentWidth - 20
  const passWidth = totalItems > 0 ? (totalPass / totalItems) * barWidth : 0
  const failWidth = totalItems > 0 ? (totalFail / totalItems) * barWidth : 0
  const naWidth = totalItems > 0 ? (totalNA / totalItems) * barWidth : 0

  doc.setFillColor(34, 197, 94)
  doc.rect(margin + 10, barY - 3, passWidth, 6, 'F')
  doc.setFillColor(239, 68, 68)
  doc.rect(margin + 10 + passWidth, barY - 3, failWidth, 6, 'F')
  doc.setFillColor(156, 163, 175)
  doc.rect(margin + 10 + passWidth + failWidth, barY - 3, naWidth, 6, 'F')

  doc.setFontSize(8)
  doc.setTextColor(0, 0, 0)
  doc.text(`Pass: ${totalPass}`, margin + 10, barY + 7)
  doc.text(`Fail: ${totalFail}`, margin + 70, barY + 7)
  doc.text(`N/A: ${totalNA}`, margin + 120, barY + 7)

    // SIGNATURES PAGE
    doc.addPage()
  currentPageNum++
  addPageHeader()
  currentY = 45

  // Signatures Header
  doc.setFillColor(...waslaBlue)
  doc.rect(margin, currentY, contentWidth, 12, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.text('SIGNATURES & ACKNOWLEDGMENT', margin + 5, currentY + 8)
  doc.text('التوقيعات والإقرار', pageWidth - margin - 5, currentY + 8, { align: 'right' })
  doc.setTextColor(0, 0, 0)
  currentY += 20

  // Signature Boxes
  const sigBoxWidth = (contentWidth - 10) / 2

  // Client Signature
  doc.setFillColor(255, 255, 255)
  doc.setDrawColor(...waslaBlue)
  doc.setLineWidth(1)
  doc.roundedRect(margin, currentY, sigBoxWidth, 60, 3, 3, 'S')

  doc.setFontSize(10)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...waslaBlue)
  doc.text('Client / العميل', margin + 5, currentY + 10)

  doc.setFont('helvetica', 'normal')
  doc.setTextColor(0, 0, 0)
  doc.setFontSize(9)
  doc.text(`Name / الاسم:`, margin + 5, currentY + 20)
  doc.text(inspection.clientName || '________________________', margin + 5, currentY + 28)

  doc.text('Signature / التوقيع:', margin + 5, currentY + 40)
  doc.setDrawColor(200, 200, 200)
  doc.line(margin + 5, currentY + 50, margin + sigBoxWidth - 5, currentY + 50)

  // Inspector Signature
  doc.setDrawColor(...waslaBlue)
  doc.setLineWidth(1)
  doc.roundedRect(pageWidth/2 + 5, currentY, sigBoxWidth, 60, 3, 3, 'S')

  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...waslaBlue)
  doc.text('Prepared by / أعد بواسطة', pageWidth/2 + 10, currentY + 10)

  doc.setFont('helvetica', 'normal')
  doc.setTextColor(0, 0, 0)
  doc.setFontSize(9)
  doc.text(`Name / الاسم:`, pageWidth/2 + 10, currentY + 20)
  doc.text(inspection.inspectorName || 'Wasla Inspector', pageWidth/2 + 10, currentY + 28)

  doc.text('Stamp / الختم:', pageWidth/2 + 10, currentY + 40)

  currentY += 70

  // Date
  doc.setFontSize(10)
  doc.setFont('helvetica', 'bold')
  doc.text(`Date / التاريخ: ${new Date().toLocaleDateString('en-GB')}`, pageWidth / 2, currentY, { align: 'center' })

  currentY += 15

  // Final Statement
  doc.setFillColor(255, 251, 235)
  doc.roundedRect(margin, currentY, contentWidth, 30, 3, 3, 'F')
  doc.setDrawColor(...waslaGold)
  doc.setLineWidth(0.5)
  doc.roundedRect(margin, currentY, contentWidth, 30, 3, 3, 'S')

  doc.setFontSize(9)
  doc.setFont('helvetica', 'italic')
  doc.setTextColor(133, 77, 14)
  doc.text('Property Inspection report is annexed', pageWidth / 2, currentY + 10, { align: 'center' })
  doc.text('مرفق تقرير الفحص العقاري', pageWidth / 2, currentY + 16, { align: 'center' })
  doc.text('Thank you for choosing Wasla Real Estate Solutions', pageWidth / 2, currentY + 22, { align: 'center' })

    // Add footers to all pages
    const totalPages = doc.internal.getNumberOfPages()
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i)
    addPageFooter(i, totalPages)
  }

    // Generate filename
    const clientName = (inspection.clientName || 'Client').replace(/[^a-zA-Z0-9]/g, '_')
  const date = new Date().toISOString().split('T')[0]
  const filename = `WASLA_Report_${clientName}_${date}_${reportId}.pdf`

    // Save the PDF
    doc.save(filename)
    console.log('Enhanced Wasla Report generated successfully:', filename)
  } catch (error) {
    console.error('Error in generateEnhancedWaslaReport:', error)
    if (error instanceof Error) {
      console.error('Error message:', error.message)
      console.error('Error stack:', error.stack)
    }
    throw error
  }
}