/**
 * src/routes/aiRoutes.js
 * مسارات API المخصصة لخدمات الذكاء الاصطناعي والمساعد الصوتي
 */

import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { processVoiceOrTextCommand, analyzeStoredAudio } from '../controllers/aiController.js';

const router = express.Router();

// 1. إعداد مجلد التخزين المؤقت للملفات الصوتية المرفوعة
const uploadDir = path.join(process.cwd(), 'uploads', 'audio');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// 2. إعداد مكتبة Multer للتعامل مع رفع الملفات الصوتية
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname) || '.wav';
    cb(null, `audio-${uniqueSuffix}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 25 * 1024 * 1024, // الحد الأقصى لحجم الملف: 25 ميجابايت
  },
});

// ==========================================
// تعريف المسارات (Routes)
// ==========================================

/**
 * @route   POST /api/ai/process (أو /api/voice-assistant/process)
 * @desc    استقبال الطلب (صوتي عبر Multer أو نصي عبر Body) ومعالجته عبر الـ AI Agent
 * @access  Protected / Public (حسب إعدادات authMiddleware في app.js)
 */
router.post('/process', upload.single('audio'), processVoiceOrTextCommand);

/**
 * @route   POST /api/ai/analyze-stored-audio
 * @desc    تحليل ملف صوتي مخزن سابقاً على الخادم
 */
router.post('/analyze-stored-audio', analyzeStoredAudio);

export default router;