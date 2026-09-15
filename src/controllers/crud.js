import prisma from '../db.js';

export const asyncHandler = (handler) => (req, res, next) =>
  Promise.resolve(handler(req, res, next)).catch(next);

// دالة مساعدة لتحويل نصوص التواريخ إلى Date Objects تلقائيًا
function parseDates(data) {
  if (!data || typeof data !== 'object') return data;
  const transformed = { ...data };

  for (const key of Object.keys(transformed)) {
    const value = transformed[key];

    if (typeof value === 'string' && value.trim() === '') {
      transformed[key] = null;
      continue;
    }
    if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}/.test(value)) {
      const parsedDate = new Date(value);
      if (!Number.isNaN(parsedDate.getTime())) {
        transformed[key] = parsedDate;
      }
    }
  }
  return transformed;
}

export function pagination(query) {
  const page = Math.max(
    Number.parseInt(query.page, 10) || 1,
    1
  );

  const limit = Math.min(
    Math.max(Number.parseInt(query.limit, 10) || 20, 1),
    100
  );

  const date = query.date || null;

  const orderByDate = query.orderByDate === 'true';

  return {
    page,
    limit,
    skip: (page - 1) * limit,
    date,
    orderByDate,
  };
}

export function paginated(model, { where = {}, orderBy = { name: 'asc' }, include } = {}) {
  return asyncHandler(async (req, res) => {
    const { page, limit, skip } = pagination(req.query);
    const [data, total] = await prisma.$transaction([
      model.findMany({ where, orderBy, include, skip, take: limit }),
      model.count({ where }),
    ]);
    res.json({ data, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
  });
}

export function byId(model, include) {
  return asyncHandler(async (req, res) => {
    const record = await model.findUnique({ where: { id: req.params.id }, include });
    if (!record) return res.status(404).json({ error: 'Not found' });
    return res.json({ data: record });
  });
}

// تم التحديث: دعم معالجة التواريخ وتخصيص البيانات الممررة
export function create(model, transformData) {
  return asyncHandler(async (req, res) => {
    const payload = transformData ? transformData(req.body) : parseDates(req.body);
    const record = await model.create({ data: payload });
    return res.status(201).json({ data: record });
  });
}

// تم التحديث: دعم معالجة التواريخ وتخصيص البيانات الممررة
export function update(model, transformData) {
  return asyncHandler(async (req, res) => {
    try {
      const payload = transformData ? transformData(req.body) : parseDates(req.body);
      const record = await model.update({
        where: { id: req.params.id },
        data: payload,
      });
      return res.json({ data: record });
    } catch (error) {
      if (error.code === 'P2025') return res.status(404).json({ error: 'Not found' });
      throw error;
    }
  });
}

export function remove(model) {
  return asyncHandler(async (req, res) => {
    try {
      await model.delete({ where: { id: req.params.id } });
      return res.status(204).send();
    } catch (error) {
      if (error.code === 'P2025') return res.status(404).json({ error: 'Not found' });
      throw error;
    }
  });
}