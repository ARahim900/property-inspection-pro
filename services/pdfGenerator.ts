import jsPDF from "jspdf"
import type { InspectionData, InspectionArea, InspectionItem, InspectionPhoto } from "../types"

const sanitizeText = (text: string): string => {
  if (!text) return ""
  // Remove or replace problematic characters that jsPDF can't handle
  return text
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F]/g, "") // Remove control characters
    .replace(/[\uFEFF]/g, "") // Remove BOM
    .replace(/[\u200B-\u200D\uFEFF]/g, "") // Remove zero-width characters
    .trim()
}

const formatDate = (dateString: string) => {
  if (!dateString) return "N/A"
  const date = new Date(dateString)
  const timeZoneOffset = date.getTimezoneOffset() * 60000
  const adjustedDate = new Date(date.getTime() + timeZoneOffset)

  return adjustedDate.toLocaleDateString("en-GB", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })
}

const toDataURL = async (url: string): Promise<string | null> => {
  try {
    const response = await fetch(url)
    if (!response.ok) throw new Error(`Failed to fetch image: ${response.statusText}`)
    const blob = await response.blob()
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onloadend = () => resolve(reader.result as string)
      reader.onerror = reject
      reader.readAsDataURL(blob)
    })
  } catch (error) {
    console.warn(`Could not load image ${url}:`, error)
    return null
  }
}

export class WaslaReportGenerator {
  pdf: jsPDF
  pageWidth: number
  pageHeight: number
  margins: { top: number; right: number; bottom: number; left: number }
  contentWidth: number
  currentY: number
  logoBase64: string | null = null
  watermarkBase64: string | null = null

  constructor() {
    this.pdf = new jsPDF({ orientation: "p", unit: "mm", format: "a4" })
    this.pageWidth = this.pdf.internal.pageSize.getWidth()
    this.pageHeight = this.pdf.internal.pageSize.getHeight()
    // Enhanced margins for header and footer
    this.margins = { top: 25, right: 15, bottom: 25, left: 15 }
    this.contentWidth = this.pageWidth - this.margins.left - this.margins.right
    this.currentY = this.margins.top

    try {
      this.pdf.setFont("helvetica", "normal")
    } catch (error) {
      console.warn("Font setup error:", error)
      // Fallback to default font
    }
  }

  async initialize() {
    // Using publicly accessible URLs for logos to avoid CORS issues.
    this.logoBase64 = await toDataURL("https://i.ibb.co/bF9gV3j/wasla-logo.png")
    this.watermarkBase64 = await toDataURL("https://i.ibb.co/bF9gV3j/wasla-logo.png")
  }

  addHeader() {
    if (this.logoBase64) {
      // Using a smaller logo in the header
      this.pdf.addImage(this.logoBase64, "PNG", this.margins.left, 8, 25, 12.5)
    }
    this.pdf.setFont("helvetica", "bold")
    this.pdf.setFontSize(9)
    this.pdf.setTextColor(100, 100, 100)
    this.pdf.text("Property Inspection Report", this.pageWidth - this.margins.right, 15, { align: "right" })

    this.pdf.setDrawColor(220, 220, 220)
    this.pdf.line(this.margins.left, 20, this.pageWidth - this.margins.right, 20)
    this.pdf.setTextColor(0, 0, 0) // Reset text color
  }

  addFooter(pageNum: number, totalPages: number, inspection: InspectionData) {
    const footerY = this.pageHeight - 15
    this.pdf.setDrawColor(220, 220, 220)
    this.pdf.line(this.margins.left, footerY - 3, this.pageWidth - this.margins.right, footerY - 3)

    this.pdf.setFont("helvetica", "normal")
    this.pdf.setFontSize(8)
    this.pdf.setTextColor(100, 100, 100)

    const footerTextLeft = sanitizeText(`${inspection.clientName || "N/A"} | ${inspection.propertyLocation || "N/A"}`)
    const truncatedLeft = this.pdf.splitTextToSize(footerTextLeft, this.contentWidth / 2)[0]
    this.pdf.text(truncatedLeft, this.margins.left, footerY)

    const footerTextRight = `Page ${pageNum} of ${totalPages}`
    this.pdf.text(footerTextRight, this.pageWidth - this.margins.right, footerY, { align: "right" })
    this.pdf.setTextColor(0, 0, 0) // Reset text color
  }

  addHeadersAndFooters(inspection: InspectionData) {
    const pageCount = this.pdf.getNumberOfPages()
    for (let i = 1; i <= pageCount; i++) {
      this.pdf.setPage(i)
      this.addHeader()
      this.addFooter(i, pageCount, inspection)
    }
  }

  checkPageBreak(requiredSpace = 20) {
    if (this.currentY + requiredSpace > this.pageHeight - this.margins.bottom) {
      this.addPage()
      return true
    }
    return false
  }

  addPage() {
    this.pdf.addPage()
    this.addWatermark()
    this.currentY = this.margins.top
  }

  addWatermark() {
    if (this.watermarkBase64) {
      const watermarkSize = 90
      this.pdf.saveGraphicsState()
      this.pdf.setGState(this.pdf.GState({ opacity: 0.08 }))
      this.pdf.addImage(
        this.watermarkBase64,
        "PNG",
        (this.pageWidth - watermarkSize) / 2,
        (this.pageHeight - watermarkSize) / 2,
        watermarkSize,
        watermarkSize,
      )
      this.pdf.restoreGraphicsState()
    }
  }

  addSectionHeader(englishTitle: string, arabicTitle: string) {
    this.checkPageBreak(15)

    this.pdf.setFillColor(245, 245, 245)
    this.pdf.rect(this.margins.left, this.currentY - 1, this.contentWidth, 8, "F")

    this.pdf.setFontSize(11)
    this.pdf.setFont("helvetica", "bold")
    this.pdf.text(sanitizeText(englishTitle), this.margins.left + 3, this.currentY + 5)
    this.pdf.text(sanitizeText(arabicTitle), this.pageWidth - this.margins.right - 3, this.currentY + 5, {
      align: "right",
    })

    this.currentY += 12
  }

  addTwoColumnText(englishText: string, arabicText: string, options: { isBold?: boolean; fontSize?: number } = {}) {
    const { isBold = false, fontSize = 9 } = options
    const colWidth = (this.contentWidth - 10) / 2
    const leftColX = this.margins.left
    const rightColX = this.pageWidth - this.margins.right

    this.pdf.setFont("helvetica", isBold ? "bold" : "normal")
    this.pdf.setFontSize(fontSize)

    const sanitizedEnglish = sanitizeText(englishText)
    const sanitizedArabic = sanitizeText(arabicText)

    const englishLines = this.pdf.splitTextToSize(sanitizedEnglish, colWidth)
    const arabicLines = this.pdf.splitTextToSize(sanitizedArabic, colWidth)

    const lineHeight = fontSize * 0.4
    const requiredSpace = Math.max(englishLines.length, arabicLines.length) * lineHeight

    this.checkPageBreak(requiredSpace)

    this.pdf.text(englishLines, leftColX, this.currentY, { align: "justify" })
    this.pdf.text(arabicLines, rightColX, this.currentY, { align: "right" })

    this.currentY += requiredSpace + 4
  }

  addAISummary(summary: string) {
    this.addPage()
    this.addSectionHeader("Executive AI Summary", "ملخص الذكاء الاصطناعي")
    this.pdf.setFont("helvetica", "normal")
    this.pdf.setFontSize(10)

    const sanitizedSummary = sanitizeText(summary)
    const summaryLines = this.pdf.splitTextToSize(sanitizedSummary, this.contentWidth)

    this.checkPageBreak(summaryLines.length * 5 + 10)
    this.pdf.text(summaryLines, this.margins.left, this.currentY)
    this.currentY += summaryLines.length * 5 + 5
  }

  addFixedDisclaimer(clientName: string) {
    this.addWatermark()
    if (this.logoBase64) {
      this.pdf.addImage(this.logoBase64, "PNG", (this.pageWidth - 60) / 2, this.currentY, 60, 30)
      this.currentY += 35
    }

    this.addSectionHeader("OVERVIEW", "نظرة عامة")
    this.addTwoColumnText(
      `Dear Mr. ${clientName || "________________"}`,
      `الأفاضل/ ${clientName || "________________"} المحترمون`,
      { isBold: true, fontSize: 10 },
    )
    this.addTwoColumnText(
      `Thank you for choosing Wasla Real Estate Solutions to carry out the inspection of your property. This report presents the inspection findings and measurements as documented on site on the date of the visit, and the presence of certain observations is common in property inspections.\n\nPlease review the attached report carefully before making your final decision. If you require any further clarification regarding the condition of the property, please feel free to contact us by phone or email between 9:00 a.m. and 5:00 p.m.\n\nEmail: info@waslaoman.com\nMobile: +968 90699799`,
      `نشكر لكم اختياركم "وصلة للحلول العقارية" للقيام بفحص العقار الخاص بكم. يُقدم هذا التقرير نتائج الفحص والقياسات كما تم توثيقها ميدانيًا في تاريخ الزيارة، ووجود بعض الملاحظات يُعد أمر شائع في عمليات الفحص العقاري.\n\nيرجى مراجعة التقرير المرفق بعناية قبل اتخاذ قراركم النهائي، و إذا كنتم بحاجة إلى توضيحات إضافية حول حالة العقار، فلا تترددوا بالتواصل معنا عبر الهاتف أو البريد الإلكتروني من الساعة 9 صباحًا حتى 5 مساءً على وسائل التواصل التالية:\n\nالبريد الإلكتروني: info@waslaoman.com\nالهاتف: +968 90699799`,
    )

    this.addTwoColumnText("No property is perfect.", "لا يوجد عقار مثالي", { isBold: true })
    this.addTwoColumnText(
      `Every building has imperfections or items that are ready for maintenance. It’s the inspector’s task to discover and report these so you can make informed decisions. This report should not be used as a tool to demean property, but rather as a way to illuminate the realities of the property.`,
      `كل عقار يحتوي على بعض العيوب أو الأجزاء التي تحتاج إلى صيانة. دور المفتش هو تحديد هذه النقاط وتقديمها بوضوح لمساعدتكم في اتخاذ قرارات مستنيرة. هذا التقرير لا يُقصد به التقليل من قيمة العقار، وإنما يهدف إلى توضيح الحالة الواقعية له.`,
    )

    this.addTwoColumnText("This report is not an appraisal.", "هذا التقرير ليس تقييماً سعرياً", { isBold: true })
    this.addTwoColumnText(
      `When an appraiser determines worth, only the most obvious conditions of a property are taken into account to establish a safe loan amount. In effect, the appraiser is representing the interests of the lender. Home inspectors focus more on the interests of the prospective buyer; and, although inspectors must be careful not to make any statements relating to property value, their findings can help buyers more completely understand the true costs of ownership.`,
      `عند قيام المثمن بتحديد قيمة العقار، فإنه يأخذ بعين الاعتبار فقط العيوب الظاهرة لتقدير مبلغ قرض آمن. بمعنى آخر، فإن المثمن يُمثل مصلحة الجهة المُقرضة. أما فاحص العقار، فيركز على مصلحة المشتري المحتمل. ورغم أن المفتش لا يحدد قيمة العقار، إلا أن نتائج الفحص تساعد المشتري في فهم التكاليف الحقيقية لامتلاك العقار.`,
    )

    this.addPage()

    this.addTwoColumnText("Maintenance costs are normal.", "تكاليف الصيانة أمر طبيعي", { isBold: true })
    this.addTwoColumnText(
      `Homeowners should plan to spend around 1% of the total value of a property in maintenance costs, annually. (Annual costs of rental property maintenance are often 2%, or more.) If considerably less than this percentage has been invested during several years preceding an inspection, the property will usually show the obvious signs of neglect; and the new property owners may be required to invest significant time and money to address accumulated maintenance needs.`,
      `ينبغي على مالكي العقارات تخصيص ما يُعادل 1% من قيمة العقار سنويًا لأعمال الصيانة الدورية. أما العقارات المؤجرة فقد تصل النسبة إلى 2% أو أكثر. وإذا لم يتم استثمار هذه النسبة على مدى عدة سنوات، فستظهر مؤشرات واضحة على الإهمال، مما يُحتم على المالك الجديد دفع تكاليف كبيرة لاحقًا لمعالجة هذه الإهمالات.`,
    )

    this.addSectionHeader("SCOPE OF THE INSPECTION", "نطاق الفحص")
    this.addTwoColumnText(
      `This report details the outcome of a visual survey of the property detailed in the annexed inspection checklist in order to check the quality of workmanship against applicable standards. It covers both the interior and the exterior of the property as well as garden, driveway and garage if relevant. Areas not inspected, for whatever reason, cannot guarantee that these areas are free from defects.\n\nThis report was formed as per the client request as a supportive opinion to enable him to have better understanding about property conditions. Our opinion does not study the property value or the engineering of the structure rather it studies the functionality of the property. This report will be listing the property defects supported by images and videos, by showing full study of the standards of property status and functionality including other relevant elements of the property as stated in the checklist.`,
      `يوضح هذا التقرير نتيجة الفحص البصري للعقار كما هو مفصل في قائمة الفحص المرفقة، بهدف تقييم جودة التنفيذ مقارنة بالمعايير المعتمدة. يشمل الفحص المناطق الداخلية والخارجية، بالإضافة إلى الحديقة، والممر، والجراج ( إن وُجد). كما لا يمكن ضمان خلو المناطق غير المفحوصة من العيوب لأي سببٍ كان.\n\nوقد تم إعداد هذا التقرير بناءً على طلب العميل لتقديم رأي داعم يساعده على فهم حالة العقار بشكل أفضل. رأينا الفني لا يشمل تقييم القيمة السوقية أو التحليل الإنشائي، بل يركز على حالة العقار ووظائفه العامة. كما سيتم سرد العيوب المرصودة بناءً على دراسة كاملة لمعايير الحالة والأداء الوظيفي للعقار مشمولة بالصور والفيديوهات، إلى جانب العناصر الأخرى ذات الصلة كما هو موضح في قائمة الفحص.`,
    )

    this.addSectionHeader("CONFIDENTIALITY OF THE REPORT", "سرية التقرير")
    this.addTwoColumnText(
      `The inspection report is to be prepared for the Client for the purpose of informing of the major deficiencies in the condition of the subject property and is solely and exclusively for Client’s own information and may not be relied upon by any other person. Client may distribute copies of the inspection report to the seller and the real estate agents directly involved in this transaction, but Client and Inspector do not in any way intend to benefit said seller or the real estate agents directly or indirectly through this Agreement or the inspection report. In the event that the inspection report has been prepared for the SELLER of the subject property, an authorized representative of Wasla Real Estate Solutions will return to the property, for a fee, to meet with the BUYER for a consultation to provide a better understanding of the reported conditions and answer.`,
      `تم إعداد تقرير الفحص هذا خصيصًا للعميل بغرض إعلامه بالنواقص الجوهرية في حالة العقار محل الفحص، وهو للاستخدام الشخصي فقط ولا يجوز الاعتماد عليه من قبل أي طرف آخر. يجوز للعميل مشاركة نسخة من التقرير مع البائع أو وكلاء العقارات المعنيين بهذه الصفقة، إلا أن كل من العميل والفاحص لا يقصدان من خلال هذا التقرير تحقيق أي منفعة مباشرة أو غير مباشرة لهؤلاء الأطراف. وفي حال تم إعداد هذا التقرير بطلب من البائع، فإن ممثلًا معتمدًا من شركة وصلة لحلول العقار سيعود إلى العقار – مقابل رسوم – لعقد جلسة استشارية مع المشتري بهدف توضيح الملاحظات الواردة في التقرير والإجابة عن استفساراته.`,
    )
  }

  addInspectionDetails(inspection: InspectionData) {
    this.addPage()
    this.pdf.setFontSize(16)
    this.pdf.setFont("helvetica", "bold")
    this.pdf.text("INSPECTION FINDINGS", this.pageWidth / 2, this.currentY, { align: "center" })
    this.currentY += 15

    if (inspection.areas && inspection.areas.length > 0) {
      for (const area of inspection.areas) {
        if (area.items && area.items.length > 0) {
          this.addAreaSection(area)
        }
      }
    } else {
      this.pdf.setFontSize(10)
      this.pdf.setFont("helvetica", "normal")
      this.pdf.text("No inspection items were recorded for this property.", this.margins.left, this.currentY)
      this.currentY += 10
    }
  }

  addAreaSection(area: InspectionArea) {
    this.checkPageBreak(30)
    this.pdf.setFillColor(235, 235, 235)
    this.pdf.rect(this.margins.left, this.currentY, this.contentWidth, 10, "F")
    this.pdf.setFontSize(14)
    this.pdf.setFont("helvetica", "bold")
    this.pdf.text(sanitizeText(area.name), this.margins.left + 5, this.currentY + 7)
    this.currentY += 15

    for (const item of area.items) {
      this.addInspectionItem(item)
    }
  }

  addInspectionItem(item: InspectionItem) {
    this.checkPageBreak(25)

    this.pdf.setFont("helvetica", "bold")
    this.pdf.setFontSize(11)
    const itemTitle = sanitizeText(`• ${item.point || "Inspection Point"}`)
    const itemTitleLines = this.pdf.splitTextToSize(itemTitle, this.contentWidth - 30)
    this.pdf.text(itemTitleLines, this.margins.left + 3, this.currentY)

    const statusColors = { Pass: [0, 150, 0], Fail: [200, 0, 0], "N/A": [100, 100, 100] }
    const color = statusColors[item.status] || [0, 0, 0]
    this.pdf.setTextColor(color[0], color[1], color[2])
    this.pdf.text(sanitizeText(item.status), this.pageWidth - this.margins.right, this.currentY, { align: "right" })
    this.pdf.setTextColor(0, 0, 0)
    this.currentY += itemTitleLines.length * 5 + 2

    this.pdf.setFont("helvetica", "normal")
    this.pdf.setFontSize(9)

    const detailIndent = this.margins.left + 8
    const detailWidth = this.contentWidth - 15

    if (item.location) {
      const lines = this.pdf.splitTextToSize(sanitizeText(`Location: ${item.location}`), detailWidth)
      this.checkPageBreak(lines.length * 4)
      this.pdf.text(lines, detailIndent, this.currentY)
      this.currentY += lines.length * 4
    }
    if (item.comments) {
      const lines = this.pdf.splitTextToSize(sanitizeText(`Comments: ${item.comments}`), detailWidth)
      this.checkPageBreak(lines.length * 4)
      this.pdf.text(lines, detailIndent, this.currentY)
      this.currentY += lines.length * 4
    }

    if (item.photos && item.photos.length > 0) {
      this.addPhotos(item.photos)
    }

    this.currentY += 5
    this.pdf.setDrawColor(230, 230, 230)
    this.pdf.line(this.margins.left, this.currentY, this.pageWidth - this.margins.right, this.currentY)
    this.currentY += 5
  }

  addPhotos(photos: InspectionPhoto[]) {
    const photosPerRow = 2
    const gap = 4
    const photoWidth = (this.contentWidth - (photosPerRow - 1) * gap - 10) / photosPerRow
    const photoHeight = photoWidth * 0.75

    const drawPlaceholder = (x: number, text: string) => {
      const originalFontSize = this.pdf.getFontSize()
      this.pdf.setDrawColor(200, 200, 200)
      this.pdf.rect(x, this.currentY, photoWidth, photoHeight, "S")
      this.pdf.setTextColor(150, 150, 150)
      this.pdf.setFontSize(8)
      this.pdf.text(text, x + photoWidth / 2, this.currentY + photoHeight / 2, { align: "center", baseline: "middle" })
      this.pdf.setTextColor(0, 0, 0) // Reset text color
      this.pdf.setFontSize(originalFontSize) // Reset font size
    }

    for (let i = 0; i < photos.length; i += photosPerRow) {
      this.checkPageBreak(photoHeight + 5)
      const rowPhotos = photos.slice(i, i + photosPerRow)
      rowPhotos.forEach((photo, j) => {
        const x = this.margins.left + 8 + j * (photoWidth + gap)
        if (photo && photo.base64) {
          try {
            this.pdf.addImage(
              `data:image/jpeg;base64,${photo.base64}`,
              "JPEG",
              x,
              this.currentY,
              photoWidth,
              photoHeight,
            )
          } catch (error) {
            console.warn("Failed to add photo:", error)
            drawPlaceholder(x, "[Image Error]")
          }
        } else {
          drawPlaceholder(x, "[Image Not Available]")
        }
      })
      this.currentY += photoHeight + 5
    }
  }

  addSignaturePage(inspection: InspectionData) {
    this.checkPageBreak(80)
    if (this.currentY > this.pageHeight - 90) this.addPage()
    this.currentY = this.pageHeight - 80

    this.pdf.setDrawColor(150, 150, 150)
    this.pdf.line(this.margins.left, this.currentY, this.pageWidth - this.margins.right, this.currentY)
    this.currentY += 10

    const formattedDate = formatDate(inspection.inspectionDate)

    this.addTwoColumnText(
      `Client Name: ${sanitizeText(inspection.clientName || "N/A")}`,
      `اسم العميل: ${sanitizeText(inspection.clientName || "N/A")}`,
    )
    this.addTwoColumnText(`Signature: ______________________`, `التوقيع: ______________________`)
    this.addTwoColumnText(
      `Prepared by: ${sanitizeText(inspection.inspectorName || "N/A")}`,
      `أعد التقرير بواسطة: ${sanitizeText(inspection.inspectorName || "N/A")}`,
    )
    this.addTwoColumnText(`Stamp:`, `الختم:`)
    this.addTwoColumnText(`Date: ${formattedDate}`, `التاريخ: ${formattedDate}`)

    this.currentY += 5
    this.pdf.setFontSize(8)
    this.addTwoColumnText(
      `Property Inspection report is annexed\nWasla Property Solutions CR. 1068375`,
      `مرفق تقرير الفحص\nوصلة للحلول العقارية س ت 1068375`,
    )
  }

  async generateReport(inspection: InspectionData): Promise<jsPDF> {
    console.log("[v0] Starting PDF generation")
    try {
      this.currentY = this.margins.top

      console.log("[v0] Adding fixed disclaimer")
      this.addFixedDisclaimer(sanitizeText(inspection.clientName || "N/A"))

      if (inspection.aiSummary) {
        console.log("[v0] Adding AI summary")
        this.addAISummary(inspection.aiSummary)
      }

      console.log("[v0] Adding inspection details")
      this.addInspectionDetails(inspection)

      console.log("[v0] Adding signature page")
      this.addSignaturePage(inspection)

      console.log("[v0] Adding headers and footers")
      this.addHeadersAndFooters(inspection)

      console.log("[v0] PDF generation completed successfully")
      return this.pdf
    } catch (error) {
      console.error("[v0] PDF generation error:", error)
      throw error
    }
  }
}
