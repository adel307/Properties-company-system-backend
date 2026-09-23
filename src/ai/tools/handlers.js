import axios from 'axios';

// إعداد كائن axios مع العنوان الأساسي للـ Backend والـ Headers المطلوبة
const API_BASE_URL = process.env.BACKEND_URL || 'http://localhost:8000/api';
const API_KEY = process.env.API_KEY;

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    ...(API_KEY && { 'x-api-key': API_KEY }),
  },
});

// ==========================================
// أدوات معالجة النصوص والـ Fuzzy Matching
// ==========================================

/**
 * تنظيف وتوحيد النصوص العربية والإنجليزية لإلغاء فروق الهمزات والمسافات
 */
const normalizeText = (text) => {
  if (!text) return '';
  return text
    .toString()
    .trim()
    .toLowerCase()
    .replace(/[أإآ]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/ى/g, 'ي')
    .replace(/[\u064B-\u0652]/g, '') // إزالة التشكيل
    .replace(/\s+/g, ' ');
};

/**
 * دالة حساب مدى التشابه (Levenshtein Distance) للمطابقة المرنة جدًا
 */
const getLevenshteinDistance = (a, b) => {
  const matrix = Array.from({ length: a.length + 1 }, () =>
    Array(b.length + 1).fill(0)
  );

  for (let i = 0; i <= a.length; i++) matrix[i][0] = i;
  for (let j = 0; j <= b.length; j++) matrix[0][j] = j;

  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost
      );
    }
  }
  return matrix[a.length][b.length];
};

/**
 * تطبيق البحث المرن على مصفوفة عناصر بناءً على خاصية معينة (مثل name)
 */
const fuzzyFilter = (items, query, key = 'name') => {
  if (!Array.isArray(items) || !query) return items;

  const cleanQuery = normalizeText(query);

  return items.filter((item) => {
    const itemValue = normalizeText(item[key]);
    if (!itemValue) return false;

    // 1. التطابق الجزئي (Sub-string match)
    if (itemValue.includes(cleanQuery) || cleanQuery.includes(itemValue)) {
      return true;
    }

    // 2. تطابق الكلمات الفردية
    const queryWords = cleanQuery.split(' ');
    const itemWords = itemValue.split(' ');
    const hasWordMatch = queryWords.some((qWord) =>
      itemWords.some((iWord) => iWord.includes(qWord) || qWord.includes(iWord))
    );
    if (hasWordMatch) return true;

    // 3. مطابقة المسافة الفاصلة (Levenshtein Distance) للأخطاء الإملائية الشديدة
    const distance = getLevenshteinDistance(itemValue, cleanQuery);
    const maxAllowedDistance = Math.floor(cleanQuery.length * 0.4); // أخطاء تصل لـ 40% من طول الكلمة
    return distance <= maxAllowedDistance;
  });
};

/**
 * استخراج مصفوفة البيانات بغض النظر عن طريقة إرجاع الـ Backend لها
 */
const extractDataArray = (responseData) => {
  if (Array.isArray(responseData)) return responseData;
  if (Array.isArray(responseData?.data)) return responseData.data;
  if (Array.isArray(responseData?.result?.data)) return responseData.result.data;
  return [];
};

export const agentToolHandlers = {
  // ==========================================
  // 1. أداة التوجيه والتنقل بالواجهة (Frontend Navigation)
  // ==========================================
  navigate_ui: async ({ route }) => {
    return {
      success: true,
      action: 'NAVIGATE',
      route,
      message: `تم توجيه الواجهة إلى: ${route}`,
    };
  },

  // ==========================================
  // 2. إدارة العقارات (Properties)
  // ==========================================
  get_properties: async (params) => {
    const response = await apiClient.get('/properties', { params });
    const result = response.data;
    const items = extractDataArray(result);
    const searchQuery = params?.search || params?.name;

    // إذا كان هناك استعلام بحث ولم يُرجع الـ Backend نتائج، نفذ الـ Fuzzy Match
    if (items.length === 0 && searchQuery) {
      const allResponse = await apiClient.get('/properties');
      const allItems = extractDataArray(allResponse.data);
      const matched = fuzzyFilter(allItems, searchQuery, 'name');

      if (matched.length > 0) {
        return { data: matched, pagination: { total: matched.length, page: 1, limit: matched.length, pages: 1 } };
      }
    }

    return result;
  },

  get_property: async ({ id }) => {
    const response = await apiClient.get(`/properties/${id}`);
    return response.data;
  },

  get_property_employees: async ({ id }) => {
    const response = await apiClient.get(`/properties/${id}/employees`);
    return response.data;
  },

  create_property: async (data) => {
    const response = await apiClient.post('/properties', data);
    return response.data;
  },

  update_property: async ({ id, ...data }) => {
    const response = await apiClient.put(`/properties/${id}`, data);
    return response.data;
  },

  delete_property: async ({ id }) => {
    const response = await apiClient.delete(`/properties/${id}`);
    return response.data;
  },

  // ==========================================
  // 3. إدارة الموظفين (Employees)
  // ==========================================
  get_employees: async (params) => {
    const response = await apiClient.get('/employees', { params });
    const result = response.data;
    const items = extractDataArray(result);
    const searchQuery = params?.search || params?.name;

    if (items.length === 0 && searchQuery) {
      const allResponse = await apiClient.get('/employees');
      const allItems = extractDataArray(allResponse.data);
      const matched = fuzzyFilter(allItems, searchQuery, 'name');

      if (matched.length > 0) {
        return { data: matched, pagination: { total: matched.length, page: 1, limit: matched.length, pages: 1 } };
      }
    }

    return result;
  },

  get_employee: async ({ id }) => {
    const response = await apiClient.get(`/employees/${id}`);
    return response.data;
  },

  create_employee: async (data) => {
    const response = await apiClient.post('/employees', data);
    return response.data;
  },

  update_employee: async ({ id, ...data }) => {
    const response = await apiClient.put(`/employees/${id}`, data);
    return response.data;
  },

  delete_employee: async ({ id }) => {
    const response = await apiClient.delete(`/employees/${id}`);
    return response.data;
  },

  // ==========================================
  // 4. إدارة الموردين والديون (Suppliers & Debts)
  // ==========================================
  get_suppliers: async (params) => {
    const response = await apiClient.get('/suppliers', { params });
    const result = response.data;
    const items = extractDataArray(result);
    const searchQuery = params?.search || params?.name;

    if (items.length === 0 && searchQuery) {
      const allResponse = await apiClient.get('/suppliers');
      const allItems = extractDataArray(allResponse.data);
      const matched = fuzzyFilter(allItems, searchQuery, 'name');

      if (matched.length > 0) {
        return { data: matched, pagination: { total: matched.length, page: 1, limit: matched.length, pages: 1 } };
      }
    }

    return result;
  },

  get_suppliers_total_debt: async () => {
    const response = await apiClient.get('/suppliers/total_debt');
    return response.data;
  },

  get_suppliers_details: async () => {
    const response = await apiClient.get('/suppliers/details');
    return response.data;
  },

  get_supplier: async ({ id }) => {
    const response = await apiClient.get(`/suppliers/${id}`);
    return response.data;
  },

  get_supplier_total_debt_by_id: async ({ id }) => {
    const response = await apiClient.get(`/suppliers/${id}/total_debt`);
    return response.data;
  },

  create_supplier: async (data) => {
    const response = await apiClient.post('/suppliers', data);
    return response.data;
  },

  update_supplier: async ({ id, ...data }) => {
    const response = await apiClient.put(`/suppliers/${id}`, data);
    return response.data;
  },

  delete_supplier: async ({ id }) => {
    const response = await apiClient.delete(`/suppliers/${id}`);
    return response.data;
  },

  // ==========================================
  // 5. إدارة مواد البناء (Materials)
  // ==========================================
  get_materials: async (params) => {
    const response = await apiClient.get('/materials', { params });
    const result = response.data;
    const items = extractDataArray(result);
    const searchQuery = params?.search || params?.name;

    if (items.length === 0 && searchQuery) {
      const allResponse = await apiClient.get('/materials');
      const allItems = extractDataArray(allResponse.data);
      const matched = fuzzyFilter(allItems, searchQuery, 'name');

      if (matched.length > 0) {
        return { data: matched, pagination: { total: matched.length, page: 1, limit: matched.length, pages: 1 } };
      }
    }

    return result;
  },

  get_material: async ({ id }) => {
    const response = await apiClient.get(`/materials/${id}`);
    return response.data;
  },

  create_material: async (data) => {
    const response = await apiClient.post('/materials', data);
    return response.data;
  },

  update_material: async ({ id, ...data }) => {
    const response = await apiClient.put(`/materials/${id}`, data);
    return response.data;
  },

  delete_material: async ({ id }) => {
    const response = await apiClient.delete(`/materials/${id}`);
    return response.data;
  },

  // ==========================================
  // 6. إدارة المصروفات اليومية والتصنيفات (Expenses & Categories)
  // ==========================================
  get_expenses: async (params) => {
    const response = await apiClient.get('/expenses', { params });
    return response.data;
  },

  get_daily_expenses_ordered_by_date: async ({ date }) => {
    if (date) {
      const response = await apiClient.get(`/expenses/${date}`);
      return response.data;
    }
    const response = await apiClient.get('/expenses', {
      params: { ordered_by_date: true },
    });
    return response.data;
  },

  get_expense: async ({ id }) => {
    const response = await apiClient.get(`/expenses/${id}`);
    return response.data;
  },

  create_expense: async (data) => {
    const response = await apiClient.post('/expenses', data);
    return response.data;
  },

  get_expense_categories: async () => {
    const response = await apiClient.get('/expense_categories');
    return response.data;
  },

  create_expense_category: async (data) => {
    const response = await apiClient.post('/expense_categories', data);
    return response.data;
  },

  update_expense_category: async ({ id, ...data }) => {
    const response = await apiClient.put(`/expense_categories/${id}`, data);
    return response.data;
  },

  delete_expense_category: async ({ id }) => {
    const response = await apiClient.delete(`/expense_categories/${id}`);
    return response.data;
  },

  // ==========================================
  // 7. إدارة الشقق السكنية (Apartments)
  // ==========================================
  get_apartments: async (params) => {
    const response = await apiClient.get('/apartments', { params });
    const result = response.data;
    const items = extractDataArray(result);
    const searchQuery = params?.search || params?.name || params?.unit_number;

    if (items.length === 0 && searchQuery) {
      const allResponse = await apiClient.get('/apartments');
      const allItems = extractDataArray(allResponse.data);
      const matched = fuzzyFilter(allItems, searchQuery, 'name');

      if (matched.length > 0) {
        return { data: matched, pagination: { total: matched.length, page: 1, limit: matched.length, pages: 1 } };
      }
    }

    return result;
  },

  get_apartment: async ({ id }) => {
    const response = await apiClient.get(`/apartments/${id}`);
    return response.data;
  },

  create_apartment: async (data) => {
    const response = await apiClient.post('/apartments', data);
    return response.data;
  },

  update_apartment: async ({ id, ...data }) => {
    const response = await apiClient.put(`/apartments/${id}`, data);
    return response.data;
  },

  delete_apartment: async ({ id }) => {
    const response = await apiClient.delete(`/apartments/${id}`);
    return response.data;
  },
};

/**
 * تنفيذ الـ Tool المطلوبة تلقائياً بناءً على اسمها والمعاملات القادمة من الـ AI
 */
export async function executeAgentTool(toolName, args) {
  const handler = agentToolHandlers[toolName];

  if (!handler) {
    return { success: false, error: `الأداة "${toolName}" غير مدعومة.` };
  }

  try {
    const result = await handler(args || {});
    return { success: true, result };
  } catch (error) {
    console.error(`خطأ أثناء تنفيذ الأداة [${toolName}]:`, error.response?.data || error.message);
    return {
      success: false,
      error: error.response?.data?.message || error.message || 'حدث خطأ أثناء الاتصال بالـ Backend.',
    };
  }
}