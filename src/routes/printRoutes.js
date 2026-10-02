import { Router } from 'express';
import { handleSilentPrint } from '../controllers/printController.js'; // تأكد من مسار الكنترولر الصحيح لديك

const router = Router();

/**
 * @route   POST /api/print/silent
 * @desc    توليد ملف PDF من بيانات JSON وإرساله للطابعة مباشرة (Silent Print)
 * @access  Public / Protected (حسب إعدادات الأمان والتصاريح لديك)
 */
router.post('/silent', handleSilentPrint);

export default router;