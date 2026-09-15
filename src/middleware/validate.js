const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export const validateId = (req, res, next) => uuid.test(req.params.id)
  ? next()
  : res.status(400).json({ error: 'Invalid UUID' });

export function validateRequired(...fields) {
  return (req, res, next) => {
    // 1. التأكد الأول إن الـ body موجود أصلاً
    if (!req.body || typeof req.body !== 'object') {
      return res.status(400).json({ error: 'Request body is missing or invalid' });
    }

    // 2. استخراج الحقول المطلوبة الناقصة أو غير الصحيحة
    const missing = fields.filter((field) => {
      const value = req.body[field];

      // غير موجود تماماً (undefined) أو محدد بـ null
      if (value === undefined || value === null) {
        return true;
      }

      // لو قيمة نصية، بنشيل المسافات وبنتأكد إنها مش فاضية
      if (typeof value === 'string' && value.trim() === '') {
        return true;
      }

      return false;
    });

    // 3. لو فيه حقول ناقصة بنرجع Error، لو كله تمام بنكمل للـ next
    if (missing.length > 0) {
      return res.status(400).json({
        error: 'Missing or empty required fields',
        missingFields: missing
      });
    }

    return next();
  };
}

export function validateBody(allowed) {
  return (req, res, next) => {
    const unknown = Object.keys(req.body).filter((key) => !allowed.includes(key));
    return unknown.length ? res.status(400).json({ error: 'Unknown fields', fields: unknown }) : next();
  };
}
