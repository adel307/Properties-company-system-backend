📋 قائمة الملفات المطلوبة ومكان إضافتها
أولاً: الباك إند (backend)

    src/ai/tools/definitions.js

        الوظيفة: تعريف الـ Functions/Tools التي يستطيع الذكاء الاصطناعي استدعاءها (مثل: البحث عن الموظفين، إضافة/تعديل الموردين أو عقار، جلب إحصائيات الديون، وتوجيه واجهة المستخدم).

    src/ai/tools/handlers.js

        الوظيفة: الربط التنفيذي (Execution mapping). يأخذ اسم الـ Function والـ Arguments التي اختارها الـ AI، وينفّذ الاستدعاء الفعلي للـ APIs / Prisma Controller الداخلية ويجلب البيانات من DB.

    src/ai/agentService.js

        الوظيفة: المحرك الرئيسي للـ AI (Agent Orchestrator) الذي يتلقى النص المحول من الصوت، يرسله لنموذج الذكاء الاصطناعي (مثل OpenAI أو Gemini)، يعالج طلبات الـ Function Calling، ينفذ الأدوات المحددة، ثم يصيغ الرد النهائي + أي أسرار أو أفعال للفرونت إند (UI_NAVIGATE).

    src/controllers/aiController.js

        الوظيفة: استقبال الطلب (سواء الصوت أو النص المترجم) والربط بين الـ Audio/STT والـ Agent Service وتقديم الـ JSON Response.

    src/routes/aiRoutes.js

        الوظيفة: المسار الذي سيتم ربطه في src/app.js (مثل /api/ai/process).

ثانياً: الفرونت إند (frontend / Next.js)

    lib/api/ai.ts

        الوظيفة: الـ Client Layer لإرسال التسجيل الصوتي أو النص إلى الباك إند واستقبال استجابة الـ AI Agent.

    components/ai/VoiceAgentWidget.jsx

        الوظيفة: واجهة المستخدم لتسجيل الصوت وإرساله، واستقبال الـ Response والتفاعل مع أفعال الـ UI (التوجيه لـ URLs مختلفة عبر useRouter).

🚀 الملف رقم (1): src/ai/tools/definitions.js

هذا هو الملف الأول للبدء في بنائه. قم بإضافته في المسار: src/ai/tools/definitions.js داخل مشروع الباك إند.
JavaScript

/**
 * src/ai/tools/definitions.js
 * تعريف الأدوات (Tools/Functions) المتاحة للـ AI Agent
 */

export const agentTools = [
  // 1. أداة توجيه واجهة المستخدم (Change Frontend Page)
  {
    name: 'navigate_ui',
    description: 'توجيه المستخدم إلى صفحة محددة في التطبيق حسب طلبه.',
    parameters: {
      type: 'OBJECT',
      properties: {
        route: {
          type: 'STRING',
          description: 'المسار المراد الانتقال إليه مثل: /, /employees, /suppliers, /materials, /expenses, /audit-logs',
        },
      },
      required: ['route'],
    },
  },

  // 2. أداة جلب أو البحث عن العقارات
  {
    name: 'get_properties',
    description: 'جلب قائمة العقارات مع إمكانية التصفية والبحث.',
    parameters: {
      type: 'OBJECT',
      properties: {
        search: { type: 'STRING', description: 'البحث باسم العقار أو العنوان' },
        status: { type: 'STRING', description: 'حالة العقار: completed أو under_construction' },
        page: { type: 'NUMBER', description: 'رقم الصفحة' },
        limit: { type: 'NUMBER', description: 'عدد العناصر في الصفحة' },
      },
    },
  },

  // 3. أداة إضافة عقار جديد
  {
    name: 'create_property',
    description: 'إنشاء عقار جديد في النظام.',
    parameters: {
      type: 'OBJECT',
      properties: {
        name: { type: 'STRING', description: 'اسم العقار' },
        address: { type: 'STRING', description: 'عنوان العقار' },
        status: { type: 'STRING', description: 'completed أو under_construction' },
        floorsNumber: { type: 'NUMBER', description: 'عدد الأدوار' },
        area: { type: 'NUMBER', description: 'المساحة بالمتر المربع' },
        startedIn: { type: 'STRING', description: 'تاريخ البداية (YYYY-MM-DD)' },
        endedIn: { type: 'STRING', description: 'تاريخ الانتهاء متوقع/فعلي (YYYY-MM-DD)' },
      },
      required: ['name'],
    },
  },

  // 4. أداة جلب استعلامات الموردين والديون
  {
    name: 'get_suppliers_summary',
    description: 'جلب قائمة الموردين أو إجمالي الديون المستحقة للموردين.',
    parameters: {
      type: 'OBJECT',
      properties: {
        has_debt: { type: 'BOOLEAN', description: 'تحديد ما إذا كنا نريد فقط الموردين الذين لهم ديون مستحقة' },
        search: { type: 'STRING', description: 'اسم المورد للبحث' },
      },
    },
  },

  // 5. أداة تسجيل مصروف جديد
  {
    name: 'create_expense',
    description: 'تسجيل مصروف يومي جديد في النظام.',
    parameters: {
      type: 'OBJECT',
      properties: {
        sender: { type: 'STRING', description: 'اسم الراسل / القائم بالصرف' },
        amount: { type: 'NUMBER', description: 'المبلغ المصروف' },
        expenseCategoryId: { type: 'STRING', description: 'ID تصنيف المصروف' },
        expenseDate: { type: 'STRING', description: 'تاريخ الصرف (YYYY-MM-DD)' },
        paidTo: { type: 'STRING', description: 'الجهة أو الشخص المستلم للمبلغ' },
        paymentMethod: { type: 'STRING', description: 'CASH, credit_card, BANK_TRANSFER, CHECK, PETTY_CASH' },
        notes: { type: 'STRING', description: 'ملاحظات إضافية' },
      },
      required: ['amount', 'sender'],
    },
  },

  // 6. أداة البحث عن الموظفين
  {
    name: 'get_employees',
    description: 'البحث وجلب قائمة الموظفين وتفاصيلهم.',
    parameters: {
      type: 'OBJECT',
      properties: {
        search: { type: 'STRING', description: 'اسم الموظف أو رقم الهاتف' },
        page: { type: 'NUMBER', description: 'رقم الصفحة' },
      },
    },
  },
];

قم بإضافة هذا الملف أولاً، وعندما تجهز، أبلغني لننطلق إلى الملف رقم (2): src/ai/tools/handlers.js لربط هذه الدوال بقاعدة البيانات مباشرةً عبر Prisma و Express Controllers!