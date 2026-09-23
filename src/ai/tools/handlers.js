/**
 * src/ai/tools/handlers.js
 * ربط وتنفيذ الـ Tools الخاصة بالـ AI Agent مع الـ Backend APIs
 */

import axios from 'axios';

// إعداد كائن axios مع العنوان الأساسي للـ Backend والـ Headers المطلوبة
const API_BASE_URL = process.env.BACKEND_URL || 'http://localhost:8000/api';
const Frontend_BASE_URL = process.env.FRONTEND_URL || 'http://localhost:3000/';
const Backend_BASE_URL = process.env.BACKEND_URL || 'http://localhost:8000/api';

const API_KEY = process.env.API_KEY;

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    ...(API_KEY && { 'x-api-key': API_KEY }),
  },
});

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
    return response.data;
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
    return response.data;
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
    return response.data;
  },

  get_suppliers_total_debt: async () => {
    const response = await apiClient.get('/suppliers/total_debt');
    return response.data;
  },

  get_suppliers_details: async () => {
    const response = await apiClient.get('/suppliers/details');
    return response.data;
  },

  get_supplier_by_id: async ({ id }) => {
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
    return response.data;
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
    return response.data;
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
    throw new Error(`الأداة المحددة "${toolName}" غير مدعومة في Handlers.`);
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