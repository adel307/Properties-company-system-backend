import fs from 'fs';
import path from 'path';
import axios from 'axios';
import FormData from 'form-data';
import { processAgentMessage } from '../ai/agentService.js';

// ==========================================
// 1. الإعدادات والثوابت
// ==========================================
const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GROQ_STT_URL = 'https://api.groq.com/openai/v1/audio/transcriptions';
const GROQ_STT_MODEL = process.env.GROQ_STT_MODEL || 'whisper-large-v3';

const ALLOWED_AUDIO_DIR = path.join(process.cwd(), 'uploads', 'audio');

const MAX_HISTORY_ITEMS = 40;
const MAX_PROMPT_LENGTH = 4000;

// ==========================================
// 2. دوال مساعدة
// ==========================================

async function transcribeAudioWithGroq(filePath) {
  if (!GROQ_API_KEY) {
    throw new Error('لم يتم ضبط مفتاح GROQ_API_KEY لاستخدام خدمة تحويل الصوت إلى نص (STT).');
  }

  const formData = new FormData();
  formData.append('file', fs.createReadStream(filePath));
  formData.append('model', GROQ_STT_MODEL);
  // formData.append('language', 'ar');
  formData.append('response_format', 'json');
  formData.append('prompt', 'هذا التسجيل يحتوي على كلام باللغة العربية والإنجليزية ومصطلحات تقنية مثل UI, Property, Employee, Expense.');

  const response = await axios.post(GROQ_STT_URL, formData, {
    headers: {
      ...formData.getHeaders(),
      Authorization: `Bearer ${GROQ_API_KEY}`,
    },
    maxBodyLength: Infinity,
  });

  return (response.data?.text || '').trim();
}

function safeUnlink(filePath) {
  if (!filePath) return;
  try {
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  } catch (err) {
    console.warn(`[aiController] تعذر حذف الملف المؤقت: ${filePath}`, err.message);
  }
}

function isSafeAudioPath(audioPath) {
  if (!audioPath || typeof audioPath !== 'string') return false;
  const resolved = path.resolve(audioPath);
  const allowed = path.resolve(ALLOWED_AUDIO_DIR);
  return resolved === allowed || resolved.startsWith(allowed + path.sep);
}

function parseHistory(rawHistory) {
  if (!rawHistory) return [];

  let history = rawHistory;

  if (typeof rawHistory === 'string') {
    try {
      history = JSON.parse(rawHistory);
    } catch {
      console.warn('[aiController] تعذر تحليل history كـ JSON.');
      return [];
    }
  }

  if (!Array.isArray(history)) return [];

  const valid = history.filter((item) => {
    return (
      item &&
      typeof item === 'object' &&
      (item.role === 'user' || item.role === 'model') &&
      Array.isArray(item.parts)
    );
  });

  return valid.length > MAX_HISTORY_ITEMS
    ? valid.slice(-MAX_HISTORY_ITEMS)
    : valid;
}

function isValidPrompt(prompt) {
  return (
    typeof prompt === 'string' &&
    prompt.trim().length > 0 &&
    prompt.length <= MAX_PROMPT_LENGTH
  );
}

/**
 * استخراج المدخلات من الطلب.
 * يدعم الآن ملفين: req.files.audio (صوت) و req.files.file (JSON)
 */
async function extractInput(req) {
  let userPrompt = '';
  let history = [];
  let wasAudio = false;

  if (req.files?.file && req.files.file[0]) {
    try {
      const jsonContent = fs.readFileSync(req.files.file[0].path, 'utf-8');
      const parsed = JSON.parse(jsonContent);
      // إذا كان الملف يحتوي على history أو هو نفسه array
      history = parseHistory(parsed.history || parsed);
      safeUnlink(req.files.file[0].path);
    } catch (err) {
      console.warn('[aiController] فشل قراءة ملف JSON:', err.message);
      safeUnlink(req.files.file[0].path);
    }
  }

  // إذا لم يأتِ history من الملف، نأخذه من الحقل النصي
  if (!history.length && req.body?.history) {
    history = parseHistory(req.body.history);
  }

  // 2. إذا وُجد ملف صوتي → STT
  if (req.files?.audio && req.files.audio[0]) {
    wasAudio = true;
    const audioPath = req.files.audio[0].path;
    userPrompt = await transcribeAudioWithGroq(audioPath);
    safeUnlink(audioPath);
  }

  // 3. دمج الـ prompt النصي (سواء مع صوت أو بدونه)
  const textPrompt = req.body?.prompt ? String(req.body.prompt).trim() : '';

  if (textPrompt) {
    userPrompt = userPrompt
      ? `${userPrompt}\n\n[ملاحظة نصية إضافية]: ${textPrompt}`
      : textPrompt;
  }

  return { userPrompt: userPrompt.trim(), history, wasAudio };
}

// ==========================================
// 3. المعالج الرئيسي
// ==========================================

export const processVoiceOrTextCommand = async (req, res) => {
  try {
    // 1. استخراج المدخلات
    let extracted;
    try {
      extracted = await extractInput(req);
    } catch (sttError) {
      console.error('[aiController] خطأ في STT:', sttError.message);
      return res.status(500).json({
        success: false,
        message: 'فشل تحويل الصوت إلى نص. يرجى المحاولة مرة أخرى.',
        error: sttError.message,
      });
    }

    const { userPrompt, history, wasAudio } = extracted;

    // 2. التحقق من وجود نص
    if (!userPrompt) {
      return res.status(400).json({
        success: false,
        message: wasAudio
          ? 'لم نتمكن من التعرف على الصوت المرفق، يرجى المحاولة مرة أخرى بصوت أوضح.'
          : 'يرجى تقديم أمر نصي أو رفع تسجيل صوتي للمعالجة.',
      });
    }

    if (!isValidPrompt(userPrompt)) {
      return res.status(400).json({
        success: false,
        message: `النص طويل جداً أو غير صالح. الحد الأقصى ${MAX_PROMPT_LENGTH} حرف.`,
      });
    }

    // 3. استدعاء الـ Agent
    const agentResult = await processAgentMessage(history, userPrompt);

    // 4. إرجاع النتيجة
    if (!agentResult.success) {
      return res.status(500).json({
        success: false,
        message:
          agentResult.error ||
          agentResult.message ||
          'حدث خطأ أثناء معالجة الطلب عبر المساعد الذكي.',
        transcription: wasAudio ? userPrompt : undefined,
        history: agentResult.history || history,
        navigation: agentResult.navigation || null,
      });
    }

    console.log({
      success: true,
      transcription: wasAudio ? userPrompt : undefined,
      message: agentResult.message,
      navigation: agentResult.navigation || null,
      history: agentResult.history,
    })

    return res.status(200).json({
      success: true,
      transcription: wasAudio ? userPrompt : undefined,
      message: agentResult.message,
      navigation: agentResult.navigation || null,
      history: agentResult.history,
    });
  } catch (error) {
    console.error(
      '[aiController.processVoiceOrTextCommand] خطأ:',
      error.response?.data || error.message
    );

    return res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء معالجة الطلب الصوتي/النصي.',
      error: error.response?.data || error.message,
    });
  }
};

export const analyzeStoredAudio = async (req, res) => {
  try {
    const { audioPath, prompt } = req.body || {};
    const history = parseHistory(req.body?.history);

    let textToProcess = typeof prompt === 'string' ? prompt.trim() : '';

    if (audioPath) {
      if (!isSafeAudioPath(audioPath)) {
        return res.status(400).json({
          success: false,
          message: 'مسار الملف الصوتي غير مسموح به.',
        });
      }

      if (!fs.existsSync(audioPath)) {
        return res.status(404).json({
          success: false,
          message: 'الملف الصوتي غير موجود على الخادم.',
        });
      }

      const transcription = await transcribeAudioWithGroq(audioPath);

      if (transcription) {
        textToProcess = textToProcess
          ? `${transcription}\n\n[ملاحظة نصية إضافية]: ${textToProcess}`
          : transcription;
      }
    }

    if (!textToProcess || !isValidPrompt(textToProcess)) {
      return res.status(400).json({
        success: false,
        message: 'تعذر العثور على نص أو ملف صوتي صالح للتحليل.',
      });
    }

    const agentResult = await processAgentMessage(history, textToProcess);

    if (!agentResult.success) {
      return res.status(500).json({
        success: false,
        message: agentResult.error || agentResult.message,
        transcription: textToProcess,
        history: agentResult.history || history,
        navigation: agentResult.navigation || null,
      });
    }

    return res.status(200).json({
      success: true,
      transcription: textToProcess,
      message: agentResult.message,
      navigation: agentResult.navigation || null,
      history: agentResult.history,
    });
  } catch (error) {
    console.error('[aiController.analyzeStoredAudio] خطأ:', error);
    return res.status(500).json({
      success: false,
      message: 'فشلت عملية تحليل الملف الصوتي المخزن.',
      error: error.message,
    });
  }
};

export default {
  processVoiceOrTextCommand,
  analyzeStoredAudio,
};