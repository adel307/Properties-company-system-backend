import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { processVoiceOrTextCommand, analyzeStoredAudio } from '../controllers/aiController.js';

const router = express.Router();

const uploadDir = path.join(process.cwd(), 'uploads', 'audio');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// ==========================================
// 1. إعداد Multer
// ==========================================
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname) || '.wav';
    const prefix = file.fieldname === 'audio' ? 'audio' : 'json';
    cb(null, `${prefix}-${uniqueSuffix}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 25 * 1024 * 1024 }, // 25 MB
  fileFilter: (req, file, cb) => {
    // حقل audio → صوت فقط
    if (file.fieldname === 'audio') {
      const allowed = [
        'audio/wav', 'audio/mpeg', 'audio/mp3', 'audio/webm',
        'audio/ogg', 'audio/m4a', 'audio/x-m4a', 'audio/mp4',
      ];
      if (allowed.includes(file.mimetype) || file.mimetype.startsWith('audio/')) {
        return cb(null, true);
      }
      return cb(new Error('صيغة الملف الصوتي غير مدعومة.'));
    }

    // حقل file → JSON فقط
    if (file.fieldname === 'file') {
      const allowed = ['application/json', 'text/json', 'text/plain'];
      if (allowed.includes(file.mimetype)) {
        return cb(null, true);
      }
      return cb(new Error('صيغة ملف JSON غير مدعومة.'));
    }

    cb(null, true);
  },
});

// ==========================================
// 2. Middleware لاستقبال audio + file (اختياريين)
// ==========================================
function optionalMultipartUpload(req, res, next) {
  const contentType = req.headers['content-type'] || '';

  // نصي بحت (JSON) → لا Multer
  if (contentType.includes('application/json')) {
    return next();
  }

  // multipart → Multer مع حقلين: audio و file
  const handler = upload.fields([
    { name: 'audio', maxCount: 1 },
    { name: 'file', maxCount: 1 },
  ]);

  handler(req, res, (err) => {
    if (err) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(413).json({
          success: false,
          message: 'حجم الملف يتجاوز الحد المسموح به (25 ميجابايت).',
        });
      }
      // خطأ fileFilter أو غيره → نمرره للـ controller عبر req.fileError
      req.fileError = err.message;
    }
    next();
  });
}

// ==========================================
// 3. تعريف المسارات
// ==========================================
router.post('/process', optionalMultipartUpload, processVoiceOrTextCommand);

router.post('/analyze-stored-audio', analyzeStoredAudio);

export default router;