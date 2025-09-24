/**
 * HTML-Based Inspection Report Generator
 * Enhanced with optimized layout, strategic page breaks, and professional formatting
 * Version 2.1 - Professional Layout Optimizations
 */

import type { InspectionData } from '@/types'

export class InspectionReportGenerator {
  private config: {
    company: {
      name: string
      nameAr: string
      registration: string
      email: string
      phone: string
    }
  }

  constructor() {
    this.config = {
      company: {
        name: 'Wasla Property Solutions',
        nameAr: 'وصلة للحلول العقارية',
        registration: 'CR. 1068375',
        email: 'info@waslaoman.com',
        phone: '+968 90699799'
      }
    }
  }

  // Main generation function
  async generateReport(inspectionData: InspectionData, options: { autoPrint?: boolean } = {}) {
    try {
      const reportData = this.processInspectionData(inspectionData)
      const htmlContent = await this.buildCompleteHTML(reportData)

      const reportWindow = window.open('', '_blank', 'width=1200,height=800')
      if (!reportWindow) {
        throw new Error('Failed to open report window. Please allow popups.')
      }

      reportWindow.document.write(htmlContent)
      reportWindow.document.close()

      setTimeout(() => {
        reportWindow.focus()
        if (options.autoPrint !== false) {
          reportWindow.print()
        }
      }, 1000)

      return { success: true, html: htmlContent, window: reportWindow }
    } catch (error: any) {
      console.error('Report generation failed:', error)
      throw new Error(`Failed to generate report: ${error.message}`)
    }
  }

  // Process inspection data
  private processInspectionData(data: InspectionData) {
    const processed = {
      reference: `WSL-${Date.now().toString().slice(-6)}`,
      date: this.formatDate(data.inspectionDate || new Date().toISOString()),
      client: data.clientName || 'Client',
      propertyType: this.formatPropertyType(data.propertyType || ''),
      location: data.propertyLocation || 'Property Location',
      inspector: data.inspectorName || 'Inspector',
      affectedAreas: [] as any[],
      recommendations: [] as string[],
      totalPass: 0,
      totalFail: 0,
      totalNA: 0
    }

    if (data.areas && Array.isArray(data.areas)) {
      data.areas.forEach(area => {
        const affectedItems: any[] = []
        const areaPhotos: any[] = []

        if (area.items && Array.isArray(area.items)) {
          area.items.forEach(item => {
            // Count statistics
            if (item.status === 'Pass') processed.totalPass++
            else if (item.status === 'Fail') processed.totalFail++
            else processed.totalNA++

            const hasIssue = item.status === 'Fail'
            const hasComments = item.comments && item.comments !== 'No additional comments'
            const hasPhotos = item.photos && item.photos.length > 0

            if (hasIssue || hasComments || hasPhotos) {
              affectedItems.push({
                name: item.point || item.category || 'Inspection Point',
                status: item.status || 'N/A',
                comments: item.comments || '',
                location: item.location || ''
              })

              if (item.photos && Array.isArray(item.photos)) {
                item.photos.forEach(photo => {
                  if (photo.base64) {
                    areaPhotos.push({
                      base64: photo.base64,
                      caption: `${item.point || item.category}: ${item.comments || 'Inspection photo'}`
                    })
                  }
                })
              }
            }
          })
        }

        if (affectedItems.length > 0) {
          processed.affectedAreas.push({
            name: area.name || 'Inspection Area',
            items: affectedItems,
            photos: areaPhotos
          })
        }
      })
    }

    // Generate default recommendations if none exist
    if (processed.affectedAreas.length > 0) {
      processed.recommendations = this.generateDefaultRecommendations(processed.affectedAreas)
    }

    return processed
  }

  // Build complete HTML with enhanced layout
  private async buildCompleteHTML(data: any) {
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Inspection Report - ${data.client}</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Cairo:wght@400;700&display=swap" rel="stylesheet">
    <style>
        body {
            font-family: 'Inter', sans-serif;
            font-size: 11pt;
            line-height: 1.4;
        }

        .font-cairo {
            font-family: 'Cairo', sans-serif;
        }

        /* Enhanced watermark */
        .watermark-container {
            position: relative;
        }
        .watermark-container::before {
            content: "WASLA";
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%) rotate(-45deg);
            font-size: 8rem;
            color: rgba(0, 0, 0, 0.03);
            font-weight: 800;
            z-index: 0;
            pointer-events: none;
            white-space: nowrap;
        }

        .content-wrapper {
            position: relative;
            z-index: 1;
        }

        /* Optimized print styles */
        @media print {
            @page {
                size: A4;
                margin: 15mm 20mm;
            }

            body {
                font-size: 10pt;
                line-height: 1.3;
                -webkit-print-color-adjust: exact !important;
                color-adjust: exact !important;
                print-color-adjust: exact !important;
            }

            /* Strategic page breaks */
            .page-break-before {
                page-break-before: always;
            }

            .page-break-after {
                page-break-after: always;
            }

            .page-break-avoid {
                page-break-inside: avoid;
            }

            /* Section grouping */
            .section-group {
                page-break-inside: avoid;
                break-inside: avoid;
            }

            /* Compact spacing */
            .print-compact {
                margin-bottom: 0.5rem !important;
                padding: 0.25rem !important;
            }

            .print-compact-section {
                margin-bottom: 1rem !important;
                padding-bottom: 0.5rem !important;
            }

            /* Table optimizations */
            table {
                font-size: 10pt;
                border-collapse: collapse;
                width: 100%;
            }

            th, td {
                padding: 4px 6px;
                border: 1px solid #ddd;
            }

            /* Hide non-essential elements */
            .print-hide {
                display: none !important;
            }

            /* Ensure headers stay with content */
            h1, h2, h3 {
                page-break-after: avoid;
                margin-bottom: 0.5rem;
            }
        }

        /* Status indicators with better contrast */
        .status-pass {
            background-color: #dcfce7 !important;
            color: #166534 !important;
            border: 1px solid #bbf7d0;
        }

        .status-fail {
            background-color: #fee2e2 !important;
            color: #991b1b !important;
            border: 1px solid #fecaca;
        }

        .status-na {
            background-color: #f3f4f6 !important;
            color: #374151 !important;
            border: 1px solid #d1d5db;
        }
    </style>
</head>
<body class="bg-gray-100">
    ${this.renderCoverPage(data)}
    ${this.renderOverviewPage(data)}
    ${this.renderFindingsPage(data)}
    ${this.renderSignaturePage(data)}
</body>
</html>`
  }

  // Enhanced cover page with strategic breaks
  private renderCoverPage(data: any) {
    return `
    <div class="max-w-4xl mx-auto bg-white shadow-lg watermark-container page-break-after print-compact">
        <div class="content-wrapper p-6">
            <!-- Header Section -->
            <header class="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-4 border-b print-compact">
                <div class="text-left">
                    <h1 class="text-2xl font-bold text-gray-800">Property Inspection Report</h1>
                    <p class="text-sm text-gray-600">Reference: ${data.reference}</p>
                </div>
                <div class="mt-2 sm:mt-0 text-left sm:text-right">
                    <h2 class="text-xl font-bold text-teal-600">WASLA</h2>
                    <p class="text-xs text-gray-500">Property Solutions</p>
                </div>
            </header>

            <!-- Report Summary Table -->
            <section class="mt-6 section-group">
                <h2 class="text-lg font-semibold text-gray-700 border-b pb-2 mb-3">Report Summary</h2>
                <div class="overflow-x-auto">
                    <table class="min-w-full border border-gray-300">
                        <tbody>
                            <tr class="bg-gray-50">
                                <td class="border border-gray-300 px-3 py-2 font-medium text-gray-700">Client</td>
                                <td class="border border-gray-300 px-3 py-2 text-gray-600">${data.client}</td>
                            </tr>
                            <tr>
                                <td class="border border-gray-300 px-3 py-2 font-medium text-gray-700">Property Type</td>
                                <td class="border border-gray-300 px-3 py-2 text-gray-600">${data.propertyType}</td>
                            </tr>
                            <tr class="bg-gray-50">
                                <td class="border border-gray-300 px-3 py-2 font-medium text-gray-700">Location</td>
                                <td class="border border-gray-300 px-3 py-2 text-gray-600">${data.location}</td>
                            </tr>
                            <tr>
                                <td class="border border-gray-300 px-3 py-2 font-medium text-gray-700">Inspector</td>
                                <td class="border border-gray-300 px-3 py-2 text-gray-600">${data.inspector}</td>
                            </tr>
                            <tr class="bg-gray-50">
                                <td class="border border-gray-300 px-3 py-2 font-medium text-gray-700">Inspection Date</td>
                                <td class="border border-gray-300 px-3 py-2 text-gray-600">${data.date}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </section>

            <!-- Statistics Summary -->
            <section class="mt-6 section-group">
                <h3 class="text-lg font-semibold text-gray-700 border-b pb-2 mb-3">Inspection Statistics</h3>
                <div class="grid grid-cols-3 gap-4">
                    <div class="bg-green-50 border border-green-200 rounded-lg p-3 text-center">
                        <div class="text-2xl font-bold text-green-600">${data.totalPass}</div>
                        <div class="text-xs text-green-800">Pass</div>
                    </div>
                    <div class="bg-red-50 border border-red-200 rounded-lg p-3 text-center">
                        <div class="text-2xl font-bold text-red-600">${data.totalFail}</div>
                        <div class="text-xs text-red-800">Fail</div>
                    </div>
                    <div class="bg-gray-50 border border-gray-200 rounded-lg p-3 text-center">
                        <div class="text-2xl font-bold text-gray-600">${data.totalNA}</div>
                        <div class="text-xs text-gray-800">N/A</div>
                    </div>
                </div>
            </section>

            <!-- Classification Table -->
            <section class="mt-6 section-group">
                <h3 class="text-lg font-semibold text-gray-700 border-b pb-2 mb-3">Property Classification System</h3>
                <div class="overflow-x-auto">
                    <table class="w-full border-collapse text-center">
                        <thead>
                            <tr class="bg-gray-100">
                                <th class="border border-gray-400 px-2 py-2 font-bold text-sm">Grade</th>
                                <th class="border border-gray-400 px-2 py-2 font-bold text-sm">AAA</th>
                                <th class="border border-gray-400 px-2 py-2 font-bold text-sm">AA</th>
                                <th class="border border-gray-400 px-2 py-2 font-bold text-sm">A</th>
                                <th class="border border-gray-400 px-2 py-2 font-bold text-sm">B</th>
                                <th class="border border-gray-400 px-2 py-2 font-bold text-sm">C</th>
                                <th class="border border-gray-400 px-2 py-2 font-bold text-sm">D</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td class="border border-gray-400 px-2 py-2 font-medium bg-gray-50 text-sm">Description</td>
                                <td class="border border-gray-400 px-2 py-2 text-sm">Excellent</td>
                                <td class="border border-gray-400 px-2 py-2 text-sm">Very Good</td>
                                <td class="border border-gray-400 px-2 py-2 text-sm">Good</td>
                                <td class="border border-gray-400 px-2 py-2 text-sm">Meeting Standards</td>
                                <td class="border border-gray-400 px-2 py-2 text-sm">Acceptable</td>
                                <td class="border border-gray-400 px-2 py-2 text-sm">Requires Maintenance</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </section>
        </div>
    </div>`
  }

  // Enhanced overview page with exact disclaimer content
  private renderOverviewPage(data: any) {
    return `
    <div class="max-w-4xl mx-auto bg-white shadow-lg watermark-container page-break-after print-compact">
        <div class="content-wrapper p-6">
            <!-- Overview Section -->
            <section class="section-group">
                <h2 class="text-xl font-semibold text-gray-700 border-b pb-2 mb-6">OVERVIEW <span class="font-cairo text-gray-600 text-lg">نظرة عامة</span></h2>
                <div class="grid md:grid-cols-2 gap-8">
                    <!-- English Column -->
                    <div class="text-gray-600 space-y-4 print-compact-section">
                        <p class="font-semibold">Dear Mr. ${data.client}</p>
                        <p class="text-sm">Thank you for choosing Wasla Real Estate Solutions to carry out the inspection of your property.</p>
                        <p class="text-sm">This report presents the inspection findings and measurements as documented on site on the date of the visit, and the presence of certain observations is common in property inspections.</p>
                        <p class="text-sm">Please review the attached report carefully before making your final decision. If you require any further clarification regarding the condition of the property, please feel free to contact us by phone or email between 9:00 a.m. and 5:00 p.m.</p>
                        <div class="text-sm space-y-1">
                            <p><strong>Email:</strong> info@waslaoman.com</p>
                            <p><strong>Mobile:</strong> +968 90699799</p>
                        </div>
                    </div>
                    <!-- Arabic Column -->
                    <div class="text-gray-600 space-y-4 text-right font-cairo print-compact-section" dir="rtl">
                        <p class="font-semibold">الأفاضل/ ${data.client} المحترمون</p>
                        <p class="text-sm">نشكر لكم اختياركم "وصلة للحلول العقارية" للقيام بفحص العقار الخاص بكم.</p>
                        <p class="text-sm">يُقدم هذا التقرير نتائج الفحص والقياسات كما تم توثيقها ميدانيًا في تاريخ الزيارة، ووجود بعض الملاحظات يُعد أمر شائع في عمليات الفحص العقاري.</p>
                        <p class="text-sm">يرجى مراجعة التقرير المرفق بعناية قبل اتخاذ قراركم النهائي، و إذا كنتم بحاجة إلى توضيحات إضافية حول حالة العقار، فلا تترددوا بالتواصل معنا عبر الهاتف أو البريد الإلكتروني من الساعة 9 صباحًا حتى 5 مساءً على وسائل التواصل التالية:</p>
                        <div class="text-sm space-y-1">
                            <p><strong>البريد الإلكتروني:</strong> info@waslaoman.com</p>
                            <p><strong>الهاتف:</strong> +968 90699799</p>
                        </div>
                    </div>
                </div>
            </section>

            <!-- Disclaimer Sections -->
            <section class="mt-8 section-group">
                <div class="grid md:grid-cols-2 gap-8 text-sm">
                    <!-- No Property is Perfect -->
                    <div class="space-y-4">
                        <div>
                            <h4 class="font-semibold text-gray-800 mb-2">No property is perfect.</h4>
                            <p class="text-gray-600">Every building has imperfections or items that are ready for maintenance. It's the inspector's task to discover and report these so you can make informed decisions. This report should not be used as a tool to demean property, but rather as a way to illuminate the realities of the property.</p>
                        </div>
                    </div>
                    <div class="text-right font-cairo space-y-4" dir="rtl">
                        <div>
                            <h4 class="font-semibold text-gray-800 mb-2">لا يوجد عقار مثالي</h4>
                            <p class="text-gray-600">كل عقار يحتوي على بعض العيوب أو الأجزاء التي تحتاج إلى صيانة. دور المفتش هو تحديد هذه النقاط وتقديمها بوضوح لمساعدتكم في اتخاذ قرارات مستنيرة. هذا التقرير لا يُقصد به التقليل من قيمة العقار، وإنما يهدف إلى توضيح الحالة الواقعية له.</p>
                        </div>
                    </div>
                </div>
            </section>

            <section class="mt-6 section-group">
                <div class="grid md:grid-cols-2 gap-8 text-sm">
                    <!-- Not an Appraisal -->
                    <div class="space-y-4">
                        <div>
                            <h4 class="font-semibold text-gray-800 mb-2">This report is not an appraisal.</h4>
                            <p class="text-gray-600">When an appraiser determines worth, only the most obvious conditions of a property are taken into account to establish a safe loan amount. In effect, the appraiser is representing the interests of the lender. Home inspectors focus more on the interests of the prospective buyer; and, although inspectors must be careful not to make any statements relating to property value, their findings can help buyers more completely understand the true costs of ownership.</p>
                        </div>
                    </div>
                    <div class="text-right font-cairo space-y-4" dir="rtl">
                        <div>
                            <h4 class="font-semibold text-gray-800 mb-2">هذا التقرير ليس تقييمًا سعريًا</h4>
                            <p class="text-gray-600">عند قيام المثمن بتحديد قيمة العقار، فإنه يأخذ بعين الاعتبار فقط العيوب الظاهرة لتقدير مبلغ قرض آمن. بمعنى آخر، فإن المثمن يُمثل مصلحة الجهة المُقرضة. أما فاحص العقار، فيركز على مصلحة المشتري المحتمل. ورغم أن المفتش لا يحدد قيمة العقار، إلا أن نتائج الفحص تساعد المشتري في فهم التكاليف الحقيقية لامتلاك العقار.</p>
                        </div>
                    </div>
                </div>
            </section>

            <section class="mt-6 section-group">
                <div class="grid md:grid-cols-2 gap-8 text-sm">
                    <!-- Maintenance Costs -->
                    <div class="space-y-4">
                        <div>
                            <h4 class="font-semibold text-gray-800 mb-2">Maintenance costs are normal.</h4>
                            <p class="text-gray-600">Homeowners should plan to spend around 1% of the total value of a property in maintenance costs, annually. (Annual costs of rental property maintenance are often 2%, or more.) If considerably less than this percentage has been invested during several years preceding an inspection, the property will usually show the obvious signs of neglect; and the new property owners may be required to invest significant time and money to address accumulated maintenance needs.</p>
                        </div>
                    </div>
                    <div class="text-right font-cairo space-y-4" dir="rtl">
                        <div>
                            <h4 class="font-semibold text-gray-800 mb-2">تكاليف الصيانة أمر طبيعي</h4>
                            <p class="text-gray-600">ينبغي على مالكي العقارات تخصيص ما يُعادل 1% من قيمة العقار سنويًا لأعمال الصيانة الدورية. أما العقارات المؤجرة فقد تصل النسبة إلى 2% أو أكثر. وإذا لم يتم استثمار هذه النسبة على مدى عدة سنوات، فستظهر مؤشرات واضحة على الإهمال، مما يُحتم على المالك الجديد دفع تكاليف كبيرة لاحقًا لمعالجة هذه الإهمالات.</p>
                        </div>
                    </div>
                </div>
            </section>

            <!-- Scope of Inspection -->
            <section class="mt-8 section-group">
                <h3 class="text-lg font-semibold text-gray-700 border-b pb-2 mb-4">SCOPE OF THE INSPECTION: <span class="font-cairo text-gray-600 text-base">نطاق الفحص</span></h3>
                <div class="grid md:grid-cols-2 gap-8 text-sm">
                    <div class="text-gray-600">
                        <p>This report details the outcome of a visual survey of the property detailed in the annexed inspection checklist in order to check the quality of workmanship against applicable standards.</p>
                        <p class="mt-3">It covers both the interior and the exterior of the property as well as garden, driveway and garage if relevant. Areas not inspected, for whatever reason, cannot guarantee that these areas are free from defects.</p>
                        <p class="mt-3">This report was formed as per the client request as a supportive opinion to enable him to have better understanding about property conditions. Our opinion does not study the property value or the engineering of the structure rather it studies the functionality of the property. This report will be listing the property defects supported by images and videos, by showing full study of the standards of property status and functionality including other relevant elements of the property as stated in the checklist.</p>
                    </div>
                    <div class="text-right font-cairo text-gray-600" dir="rtl">
                        <p>يوضح هذا التقرير نتيجة الفحص البصري للعقار كما هو مفصل في قائمة الفحص المرفقة، بهدف تقييم جودة التنفيذ مقارنة بالمعايير المعتمدة.</p>
                        <p class="mt-3">يشمل الفحص المناطق الداخلية والخارجية، بالإضافة إلى الحديقة، والممر، والجراج ( إن وُجد). كما لا يمكن ضمان خلو المناطق غير المفحوصة من العيوب لأي سببٍ كان.</p>
                        <p class="mt-3">وقد تم إعداد هذا التقرير بناءً على طلب العميل لتقديم رأي داعم يساعده على فهم حالة العقار بشكل أفضل. رأينا الفني لا يشمل تقييم القيمة السوقية أو التحليل الإنشائي، بل يركز على حالة العقار ووظائفه العامة. كما سيتم سرد العيوب المرصودة بناءً على دراسة كاملة لمعايير الحالة والأداء الوظيفي للعقار مشمولة بالصور والفيديوهات، إلى جانب العناصر الأخرى ذات الصلة كما هو موضح في قائمة الفحص.</p>
                    </div>
                </div>
            </section>

            <!-- Confidentiality -->
            <section class="mt-8 section-group">
                <h3 class="text-lg font-semibold text-gray-700 border-b pb-2 mb-4">CONFIDENTIALITY OF THE REPORT: <span class="font-cairo text-gray-600 text-base">سرية التقرير</span></h3>
                <div class="grid md:grid-cols-2 gap-8 text-sm">
                    <div class="text-gray-600">
                        <p>The inspection report is to be prepared for the Client for the purpose of informing of the major deficiencies in the condition of the subject property and is solely and exclusively for Client's own information and may not be relied upon by any other person. Client may distribute copies of the inspection report to the seller and the real estate agents directly involved in this transaction, but Client and Inspector do not in any way intend to benefit said seller or the real estate agents directly or indirectly through this Agreement or the inspection report. In the event that the inspection report has been prepared for the SELLER of the subject property, an authorized representative of Wasla Real Estate Solutions will return to the property, for a fee, to meet with the BUYER for a consultation to provide a better understanding of the reported conditions and answer.</p>
                    </div>
                    <div class="text-right font-cairo text-gray-600" dir="rtl">
                        <p>تم إعداد تقرير الفحص هذا خصيصًا للعميل بغرض إعلامه بالنواقص الجوهرية في حالة العقار محل الفحص، وهو للاستخدام الشخصي فقط ولا يجوز الاعتماد عليه من قبل أي طرف آخر. يجوز للعميل مشاركة نسخة من التقرير مع البائع أو وكلاء العقارات المعنيين بهذه الصفقة، إلا أن كل من العميل والفاحص لا يقصدان من خلال هذا التقرير تحقيق أي منفعة مباشرة أو غير مباشرة لهؤلاء الأطراف. وفي حال تم إعداد هذا التقرير بطلب من البائع، فإن ممثلًا معتمدًا من شركة وصلة لحلول العقار سيعود إلى العقار – مقابل رسوم – لعقد جلسة استشارية مع المشتري بهدف توضيح الملاحظات الواردة في التقرير والإجابة عن استفساراته.</p>
                    </div>
                </div>
            </section>
        </div>
    </div>`
  }

  // Enhanced findings page with color coding and photos
  private renderFindingsPage(data: any) {
    let sectionsHtml = ''

    if (data.affectedAreas && data.affectedAreas.length > 0) {
      data.affectedAreas.forEach((area: any, index: number) => {
        const pageBreakClass = index > 0 && index % 2 === 0 ? 'page-break-before' : ''

        sectionsHtml += `
        <div class="section-group ${pageBreakClass} mb-6">
            <div class="bg-gradient-to-r from-teal-50 to-blue-50 p-3 rounded-lg mb-4">
                <h3 class="text-lg font-bold text-teal-800">${area.name}</h3>
            </div>

            <div class="overflow-x-auto mb-4">
                <table class="min-w-full border border-gray-300">
                    <thead>
                        <tr class="bg-gray-100">
                            <th class="border border-gray-300 px-3 py-2 text-left font-semibold text-xs">Item</th>
                            <th class="border border-gray-300 px-3 py-2 text-center font-semibold text-xs w-20">Status</th>
                            <th class="border border-gray-300 px-3 py-2 text-left font-semibold text-xs">Comments</th>
                        </tr>
                    </thead>
                    <tbody>`

        area.items.forEach((item: any) => {
          const statusClass = item.status === 'Pass' ? 'status-pass' :
                            item.status === 'Fail' ? 'status-fail' : 'status-na'

          sectionsHtml += `
                        <tr class="hover:bg-gray-50">
                            <td class="border border-gray-300 px-3 py-2 text-sm">${item.name}</td>
                            <td class="border border-gray-300 px-3 py-2 text-center">
                                <span class="px-2 py-1 rounded-full text-xs font-medium ${statusClass}">${item.status}</span>
                            </td>
                            <td class="border border-gray-300 px-3 py-2 text-sm">${item.comments || 'No comments'}</td>
                        </tr>`
        })

        sectionsHtml += `
                    </tbody>
                </table>
            </div>`

        // Add photos if any
        if (area.photos && area.photos.length > 0) {
          sectionsHtml += `
            <div class="grid grid-cols-2 gap-3 mb-4">`
          area.photos.forEach((photo: any) => {
            sectionsHtml += `
                <div class="border border-gray-300 rounded-lg overflow-hidden">
                    <img src="${photo.base64}" alt="Inspection photo" class="w-full h-32 object-cover">
                    <div class="p-2 bg-gray-50">
                        <p class="text-xs text-gray-600">${photo.caption}</p>
                    </div>
                </div>`
          })
          sectionsHtml += `</div>`
        }

        sectionsHtml += `</div>`
      })
    } else {
      sectionsHtml = `
        <div class="section-group text-center py-8">
            <div class="bg-green-50 border border-green-200 rounded-lg p-6">
                <h3 class="text-lg font-semibold text-green-800 mb-2">Excellent Condition</h3>
                <p class="text-green-600">No significant issues were identified during this inspection. The property appears to be well-maintained and in good condition.</p>
            </div>
        </div>`
    }

    return `
    <div class="max-w-4xl mx-auto bg-white shadow-lg watermark-container page-break-after print-compact">
        <div class="content-wrapper p-6">
            <section>
                <h2 class="text-xl font-semibold text-gray-700 border-b pb-2 mb-4">Inspection Findings</h2>
                ${sectionsHtml}
            </section>

            <!-- Recommendations Section -->
            ${data.recommendations && data.recommendations.length > 0 ? `
            <section class="section-group mt-6">
                <h3 class="text-lg font-semibold text-gray-700 border-b pb-2 mb-4">Action Items & Recommendations</h3>
                <div class="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-r-lg">
                    <ul class="space-y-2">
                        ${data.recommendations.map((rec: string) => `<li class="flex items-start"><span class="text-yellow-600 mr-2">•</span><span class="text-sm">${rec}</span></li>`).join('')}
                    </ul>
                </div>
            </section>` : ''}
        </div>
    </div>`
  }

  // Enhanced signature page with exact content
  private renderSignaturePage(data: any) {
    return `
    <div class="max-w-4xl mx-auto bg-white shadow-lg watermark-container print-compact">
        <div class="content-wrapper p-6">
            <section class="section-group">
                <div class="grid md:grid-cols-2 gap-8 mb-8">
                    <div>
                        <div class="space-y-6">
                            <div class="flex justify-between border-b border-gray-300 pb-2">
                                <span class="font-medium">Client Name:</span>
                                <span>${data.client}</span>
                            </div>
                            <div class="flex justify-between border-b border-gray-300 pb-2">
                                <span class="font-medium">Signature:</span>
                                <span class="text-gray-400">_________________________</span>
                            </div>
                            <div class="flex justify-between border-b border-gray-300 pb-2">
                                <span class="font-medium">Prepared by:</span>
                                <span>${data.inspector}</span>
                            </div>
                            <div class="flex justify-between border-b border-gray-300 pb-2">
                                <span class="font-medium">Stamp:</span>
                                <span class="text-gray-400">_________________________</span>
                            </div>
                            <div class="flex justify-between border-b border-gray-300 pb-2">
                                <span class="font-medium">Date:</span>
                                <span>${data.date}</span>
                            </div>
                        </div>
                    </div>
                    <div class="text-right font-cairo" dir="rtl">
                        <div class="space-y-6">
                            <div class="flex justify-between border-b border-gray-300 pb-2">
                                <span>${data.client}</span>
                                <span class="font-medium">:اسم العميل</span>
                            </div>
                            <div class="flex justify-between border-b border-gray-300 pb-2">
                                <span class="text-gray-400">_________________________</span>
                                <span class="font-medium">:التوقيع</span>
                            </div>
                            <div class="flex justify-between border-b border-gray-300 pb-2">
                                <span>${data.inspector}</span>
                                <span class="font-medium">:أعد التقرير بواسطة</span>
                            </div>
                            <div class="flex justify-between border-b border-gray-300 pb-2">
                                <span class="text-gray-400">_________________________</span>
                                <span class="font-medium">:الختم</span>
                            </div>
                            <div class="flex justify-between border-b border-gray-300 pb-2">
                                <span>${data.date}</span>
                                <span class="font-medium">:التاريخ</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="text-center mt-8 p-4 bg-gray-50 rounded-lg">
                    <p class="font-medium text-gray-800 mb-2">Property Inspection report is annexed | مرفق تقرير الفحص</p>
                    <p class="text-sm text-gray-600">Wasla Property Solutions CR. 1068375 | وصلة للحلول العقارية س ت 1068375</p>
                </div>
            </section>
        </div>
    </div>`
  }

  // Helper methods
  private formatDate(dateString: string) {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  private formatPropertyType(type: string) {
    const types: { [key: string]: string } = {
      'villa': 'Villa',
      'apartment': 'Apartment',
      'building': 'Building',
      'office': 'Office',
      'Villa': 'Villa',
      'Apartment': 'Apartment',
      'Commercial': 'Commercial',
      'Industrial': 'Industrial'
    }
    return types[type] || type || 'Property'
  }

  private generateDefaultRecommendations(affectedAreas: any[]) {
    const recommendations: string[] = []
    affectedAreas.forEach(area => {
      const failedItems = area.items.filter((item: any) => item.status === 'Fail')
      if (failedItems.length > 0) {
        recommendations.push(`Address ${failedItems.length} identified issue(s) in ${area.name}`)
      }
    })

    if (recommendations.length === 0) {
      recommendations.push('Continue regular maintenance schedule')
    }

    return recommendations
  }
}

// Export function for easy use
export async function generateInspectionReport(inspectionData: InspectionData, options: { autoPrint?: boolean } = {}) {
  const generator = new InspectionReportGenerator()
  return await generator.generateReport(inspectionData, options)
}