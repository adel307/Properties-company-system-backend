export const agentTools = [
  // ==========================================
  // 1. أداة التوجيه والتنقل بالواجهة (Frontend Navigation)
  // ==========================================
  {
    name: 'navigate_ui',
    description: 'توجيه المستخدم إلى صفحة محددة في تطبيق لوحة التحكم حسب طلبه.',
    parameters: {
      type: 'OBJECT',
      properties: {
        route: {
          type: 'STRING',
          description: 'المسار المراد الانتقال إليه مثل: /, /employees, /suppliers, /properties, /materials, /expenses, /apartments, /audit-logs',
        },
      },
      required: ['route'],
    },
  },

  // ==========================================
  // 2. إدارة العقارات (Properties)
  // ==========================================
  {
    name: 'get_properties',
    description: 'جلب قائمة العقارات مع التصفية والفرز والبحث المتقدم.',
    parameters: {
      type: 'OBJECT',
      properties: {
        search: { type: 'STRING', description: 'البحث باسم العقار أو العنوان' },
        status: { type: 'STRING', description: 'حالة العقار: completed أو under_construction' },
        min_area: { type: 'NUMBER', description: 'الحد الأدنى للمساحة' },
        max_area: { type: 'NUMBER', description: 'الحد الأقصى للمساحة' },
        started_after: { type: 'STRING', description: 'العقارات التي بدأت بعد تاريخ معين (YYYY-MM-DD)' },
        ended_before: { type: 'STRING', description: 'العقارات التي انتهت قبل تاريخ معين (YYYY-MM-DD)' },
        sort_by: { type: 'STRING', description: 'الفرز حسب: name, started_in, ended_in, floors_number, apartments_number, area' },
        page: { type: 'NUMBER', description: 'رقم الصفحة' },
        limit: { type: 'NUMBER', description: 'عدد العناصر في الصفحة' },
      },
    },
  },
  {
    name: 'get_property',
    description: 'جلب تفاصيل عقار محدد بواسطة معرف UUID.',
    parameters: {
      type: 'OBJECT',
      properties: {
        id: { type: 'STRING', description: 'معرف العقار (UUID)' },
      },
      required: ['id'],
    },
  },
  {
    name: 'get_property_employees',
    description: 'جلب قائمة الموظفين المرتبطين بعقار معين أدوارهم.',
    parameters: {
      type: 'OBJECT',
      properties: {
        id: { type: 'STRING', description: 'معرف العقار (UUID)' },
      },
      required: ['id'],
    },
  },
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
        endedIn: { type: 'STRING', description: 'تاريخ الانتهاء (YYYY-MM-DD)' },
      },
      required: ['name'],
    },
  },
  {
    name: 'update_property',
    description: 'تحديث بيانات عقار حالي.',
    parameters: {
      type: 'OBJECT',
      properties: {
        id: { type: 'STRING', description: 'معرف العقار (UUID)' },
        name: { type: 'STRING', description: 'اسم العقار' },
        address: { type: 'STRING', description: 'عنوان العقار' },
        status: { type: 'STRING', description: 'completed أو under_construction' },
        floorsNumber: { type: 'NUMBER', description: 'عدد الأدوار' },
        area: { type: 'NUMBER', description: 'المساحة بالمتر المربع' },
        startedIn: { type: 'STRING', description: 'تاريخ البداية (YYYY-MM-DD)' },
        endedIn: { type: 'STRING', description: 'تاريخ الانتهاء (YYYY-MM-DD)' },
      },
      required: ['id'],
    },
  },
  {
    name: 'delete_property',
    description: 'حذف عقار من النظام.',
    parameters: {
      type: 'OBJECT',
      properties: {
        id: { type: 'STRING', description: 'معرف العقار (UUID)' },
      },
      required: ['id'],
    },
  },

  // ==========================================
  // 3. إدارة الموظفين (Employees)
  // ==========================================
  {
    name: 'get_employees',
    description: 'البحث وجلب قائمة الموظفين وتفاصيلهم.',
    parameters: {
      type: 'OBJECT',
      properties: {
        search: { type: 'STRING', description: 'اسم الموظف أو رقم الهاتف' },
        sort_by: { type: 'STRING', description: 'معيار الفرز (افتراضي: name)' },
        page: { type: 'NUMBER', description: 'رقم الصفحة' },
        limit: { type: 'NUMBER', description: 'عدد العناصر بالصفحة' },
      },
    },
  },
  {
    name: 'get_employee',
    description: 'جلب بيانات موظف محدد بمعرفه.',
    parameters: {
      type: 'OBJECT',
      properties: {
        id: { type: 'STRING', description: 'معرف الموظف (UUID)' },
      },
      required: ['id'],
    },
  },
  {
    name: 'create_employee',
    description: 'إضافة موظف جديد للنظام.',
    parameters: {
      type: 'OBJECT',
      properties: {
        name: { type: 'STRING', description: 'اسم الموظف' },
        salary: { type: 'NUMBER', description: 'الراتب' },
        experienceYears: { type: 'NUMBER', description: 'سنوات الخبرة' },
        age: { type: 'NUMBER', description: 'العمر' },
        phone: { type: 'STRING', description: 'رقم الهاتف' },
      },
      required: ['name'],
    },
  },
  {
    name: 'update_employee',
    description: 'تعديل بيانات موظف.',
    parameters: {
      type: 'OBJECT',
      properties: {
        id: { type: 'STRING', description: 'معرف الموظف (UUID)' },
        name: { type: 'STRING', description: 'اسم الموظف' },
        salary: { type: 'NUMBER', description: 'الراتب' },
        experienceYears: { type: 'NUMBER', description: 'سنوات الخبرة' },
        age: { type: 'NUMBER', description: 'العمر' },
        phone: { type: 'STRING', description: 'رقم الهاتف' },
      },
      required: ['id'],
    },
  },
  {
    name: 'delete_employee',
    description: 'حذف موظف من النظام.',
    parameters: {
      type: 'OBJECT',
      properties: {
        id: { type: 'STRING', description: 'معرف الموظف (UUID)' },
      },
      required: ['id'],
    },
  },

  // ==========================================
  // 4. إدارة الموردين والديون (Suppliers & Debts)
  // ==========================================
  {
    name: 'get_suppliers',
    description: 'جلب قائمة الموردين مع إمكانية الفلترة بحجم الديون والفرز.',
    parameters: {
      type: 'OBJECT',
      properties: {
        search: { type: 'STRING', description: 'اسم المورد للبحث' },
        has_debt: { type: 'BOOLEAN', description: 'تحديد ما إذا كنا نريد فقط الموردين الذين لهم ديون مستحقة (as_dept)' },
        sort_by: { type: 'STRING', description: 'الفرز (الافتراضي: name)' },
        page: { type: 'NUMBER', description: 'رقم الصفحة' },
        limit: { type: 'NUMBER', description: 'عدد العناصر' },
      },
    },
  },
  {
    name: 'get_suppliers_total_debt',
    description: 'جلب إجمالي الديون المستحقة لكافة الموردين من الـ View المسماة v_suppliers_with_debt.',
    parameters: {
      type: 'OBJECT',
      properties: {},
    },
  },
  {
    name: 'get_suppliers_details',
    description: 'جلب التفاصيل الكاملة للموردين والمواد الموردة والمبالغ المتبقية عبر v_supplier_materials.',
    parameters: {
      type: 'OBJECT',
      properties: {},
    },
  },
  {
    name: 'get_supplier',
    description: 'جلب بيانات مورد معين بمعرفه الخاص.',
    parameters: {
      type: 'OBJECT',
      properties: {
        id: { type: 'STRING', description: 'معرف المورد (UUID)' },
      },
      required: ['id'],
    },
  },
  {
    name: 'get_supplier_total_debt_by_id',
    description: 'جلب إجمالي الديون المستحقة لمورد معين فقط عبر المعرف الخاص به.',
    parameters: {
      type: 'OBJECT',
      properties: {
        id: { type: 'STRING', description: 'معرف المورد (UUID)' },
      },
      required: ['id'],
    },
  },
  {
    name: 'create_supplier',
    description: 'إضافة مورد جديد.',
    parameters: {
      type: 'OBJECT',
      properties: {
        name: { type: 'STRING', description: 'اسم المورد' },
      },
      required: ['name'],
    },
  },
  {
    name: 'update_supplier',
    description: 'تعديل بيانات مورد.',
    parameters: {
      type: 'OBJECT',
      properties: {
        id: { type: 'STRING', description: 'معرف المورد (UUID)' },
        name: { type: 'STRING', description: 'اسم المورد' },
      },
      required: ['id', 'name'],
    },
  },
  {
    name: 'delete_supplier',
    description: 'حذف مورد.',
    parameters: {
      type: 'OBJECT',
      properties: {
        id: { type: 'STRING', description: 'معرف المورد (UUID)' },
      },
      required: ['id'],
    },
  },

  // ==========================================
  // 5. إدارة مواد البناء (Materials)
  // ==========================================
  {
    name: 'get_materials',
    description: 'جلب قائمة مواد البناء والمستلزمات.',
    parameters: {
      type: 'OBJECT',
      properties: {
        page: { type: 'NUMBER', description: 'رقم الصفحة' },
        limit: { type: 'NUMBER', description: 'عدد العناصر' },
      },
    },
  },
  {
    name: 'get_material',
    description: 'جلب تفاصيل شحنة أو مادة بناء معينة.',
    parameters: {
      type: 'OBJECT',
      properties: {
        id: { type: 'STRING', description: 'معرف المادة (UUID)' },
      },
      required: ['id'],
    },
  },
  {
    name: 'create_material',
    description: 'تسجيل توريد مادة جديدة وإسنادها لمورد وعقار.',
    parameters: {
      type: 'OBJECT',
      properties: {
        name: { type: 'STRING', description: 'اسم المادة (مثل: إسمنت، حديد)' },
        totalPrice: { type: 'NUMBER', description: 'الإجمالي' },
        paidPrice: { type: 'NUMBER', description: 'المبلغ المدفوع' },
        status: { type: 'STRING', description: 'حالة الدفع: paid أو as_dept' },
        quantity: { type: 'NUMBER', description: 'الكمية' },
        arriveDate: { type: 'STRING', description: 'تاريخ الوصول (YYYY-MM-DD)' },
        paymentDate: { type: 'STRING', description: 'تاريخ الاستحقاق (افتراضي بعد شهر)' },
        supplierId: { type: 'STRING', description: 'معرف المورد (UUID)' },
        propertyId: { type: 'STRING', description: 'معرف العقار (UUID)' },
      },
      required: ['name', 'totalPrice', 'supplierId', 'propertyId'],
    },
  },
  {
    name: 'update_material',
    description: 'تعديل بيانات توريد مادة.',
    parameters: {
      type: 'OBJECT',
      properties: {
        id: { type: 'STRING', description: 'معرف المادة (UUID)' },
        name: { type: 'STRING', description: 'اسم المادة' },
        totalPrice: { type: 'NUMBER', description: 'الإجمالي' },
        paidPrice: { type: 'NUMBER', description: 'المبلغ المدفوع' },
        status: { type: 'STRING', description: 'حالة الدفع: paid أو as_dept' },
        quantity: { type: 'NUMBER', description: 'الكمية' },
        arriveDate: { type: 'STRING', description: 'تاريخ الوصول' },
        paymentDate: { type: 'STRING', description: 'تاريخ الاستحقاق' },
      },
      required: ['id'],
    },
  },
  {
    name: 'delete_material',
    description: 'حذف سجل مادة بناء.',
    parameters: {
      type: 'OBJECT',
      properties: {
        id: { type: 'STRING', description: 'معرف المادة (UUID)' },
      },
      required: ['id'],
    },
  },

  // ==========================================
  // 6. إدارة المصروفات اليومية والتصنيفات (Expenses & Categories)
  // ==========================================
  {
    name: 'get_expenses',
    description: 'جلب قائمة المصروفات اليومية العامة.',
    parameters: {
      type: 'OBJECT',
      properties: {
        page: { type: 'NUMBER', description: 'رقم الصفحة' },
        limit: { type: 'NUMBER', description: 'عدد العناصر' },
      },
    },
  },
  {
    name: 'get_daily_expenses_ordered_by_date',
    description: 'جلب المصروفات اليومية مرتبة حسب التاريخ عبر DailyExpensesOrderedByDate View، أو التصفية بتاريخ معين.',
    parameters: {
      type: 'OBJECT',
      properties: {
        date: { type: 'STRING', description: 'اختياري: تاريخ محدد لجلب المصروفات الخاصة به (YYYY-MM-DD)' },
      },
    },
  },
  {
    name: 'get_expense',
    description: 'جلب تفاصيل مصروف محدد.',
    parameters: {
      type: 'OBJECT',
      properties: {
        id: { type: 'STRING', description: 'معرف المصروف (UUID)' },
      },
      required: ['id'],
    },
  },
  {
    name: 'create_expense',
    description: 'تسجيل مصروف يومي جديد.',
    parameters: {
      type: 'OBJECT',
      properties: {
        sender: { type: 'STRING', description: 'اسم القائم بالصرف / الراسل' },
        amount: { type: 'NUMBER', description: 'المبلغ المصروف' },
        expenseCategoryId: { type: 'STRING', description: 'معرف تصنيف المصروف (UUID)' },
        expenseDate: { type: 'STRING', description: 'تاريخ الصرف (YYYY-MM-DD)' },
        paidTo: { type: 'STRING', description: 'الجهة أو الشخص المستلم' },
        paymentMethod: { type: 'STRING', description: 'طريقة الدفع: CASH, credit_card, BANK_TRANSFER, CHECK, PETTY_CASH' },
        receiptNumber: { type: 'STRING', description: 'رقم الإيصال (إجباري فقط في حالة التحويل البنكي أو الـ credit_card)' },
        receiptImageUrl: { type: 'STRING', description: 'رابط صورة الإيصال' },
        approvedBy: { type: 'STRING', description: 'الشخص الذي وافق على الصرف' },
        notes: { type: 'STRING', description: 'ملاحظات إضافية' },
      },
      required: ['sender', 'amount', 'expenseCategoryId'],
    },
  },
  {
    name: 'get_expense_categories',
    description: 'جلب تصنيفات المصروفات.',
    parameters: {
      type: 'OBJECT',
      properties: {},
    },
  },
  {
    name: 'create_expense_category',
    description: 'إضافة تصنيف جديد للمصروفات.',
    parameters: {
      type: 'OBJECT',
      properties: {
        name: { type: 'STRING', description: 'اسم التصنيف' },
      },
      required: ['name'],
    },
  },
  {
    name: 'update_expense_category',
    description: 'تعديل اسم تصنيف مصروفات.',
    parameters: {
      type: 'OBJECT',
      properties: {
        id: { type: 'STRING', description: 'معرف التصنيف (UUID)' },
        name: { type: 'STRING', description: 'الاسم الجديد' },
      },
      required: ['id', 'name'],
    },
  },
  {
    name: 'delete_expense_category',
    description: 'حذف تصنيف مصروفات.',
    parameters: {
      type: 'OBJECT',
      properties: {
        id: { type: 'STRING', description: 'معرف التصنيف (UUID)' },
      },
      required: ['id'],
    },
  },

  // ==========================================
  // 7. إدارة الشقق السكنية (Apartments)
  // ==========================================
  {
    name: 'get_apartments',
    description: 'جلب قائمة الشقق السكنية بالمشروع.',
    parameters: {
      type: 'OBJECT',
      properties: {
        page: { type: 'NUMBER', description: 'رقم الصفحة' },
        limit: { type: 'NUMBER', description: 'عدد العناصر' },
      },
    },
  },
  {
    name: 'get_apartment',
    description: 'جلب تفاصيل شقة سكنية معينة.',
    parameters: {
      type: 'OBJECT',
      properties: {
        id: { type: 'STRING', description: 'معرف الشقة (UUID)' },
      },
      required: ['id'],
    },
  },
  {
    name: 'create_apartment',
    description: 'إضافة شقة جديدة لعقار معين.',
    parameters: {
      type: 'OBJECT',
      properties: {
        propertyId: { type: 'STRING', description: 'معرف العقار التابعة له الشقة (UUID)' },
        floor: { type: 'NUMBER', description: 'رقم الدور' },
        number: { type: 'STRING', description: 'رقم/كود الشقة (مثل: 3A, 4A)' },
      },
      required: ['propertyId', 'floor', 'number'],
    },
  },
  {
    name: 'update_apartment',
    description: 'تعديل تفاصيل شقة سكنية.',
    parameters: {
      type: 'OBJECT',
      properties: {
        id: { type: 'STRING', description: 'معرف الشقة (UUID)' },
        floor: { type: 'NUMBER', description: 'رقم الدور' },
        number: { type: 'STRING', description: 'رقم/كود الشقة (مثل: 3A, 4A)' },
      },
      required: ['id'],
    },
  },
  {
    name: 'delete_apartment',
    description: 'حذف شقة سكنية.',
    parameters: {
      type: 'OBJECT',
      properties: {
        id: { type: 'STRING', description: 'معرف الشقة (UUID)' },
      },
      required: ['id'],
    },
  },
];