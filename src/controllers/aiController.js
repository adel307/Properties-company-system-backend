/**
 * src/controllers/aiController.js
 * المتحكم المسؤول عن استقبال الطلبات (صوتية أو نصية)، تحويل الصوت لنص (STT)،
 * والربط مع agentService لتوليد الاستجابات والتحكم بالواجهة إرجاع JSON متكامل.
 */

import fs from 'fs';
import axios from 'axios';
import FormData from 'form-data';
import { processAgentMessage } from '../ai/agentService.js';

// إعداد مفتاح Groq الخاص بتفريغ الصوت (Groq Whisper STT)
const GROQ_API_KEY = process.env.GROQ_API_KEY;

/**
 * وظيفة مساعدة لتحويل الملف الصوتي إلى نص عبر نموذج Groq Whisper (STT)
 * @param {String} filePath - مسار الملف الصوتي المؤقت على الخادم
 * @returns {Promise<String>} النص المترجم تلقائياً
 */
async function transcribeAudioWithGroq(filePath) {
  if (!GROQ_API_KEY) {
    throw new Error('لم يتم ضبط مفتاح GROQ_API_KEY لاستخدام خدمة تحويل الصوت إلى نص (STT).');
  }

  const formData = new FormData();
  formData.append('file', fs.createReadStream(filePath));
  formData.append('model', 'whisper-large-v3-turbo');
  formData.append('language', 'ar');
  formData.append('response_format', 'json');

  const response = await axios.post('https://api.groq.com/openai/v1/audio/transcriptions', formData, {
    headers: {
      ...formData.getHeaders(),
      Authorization: `Bearer ${GROQ_API_KEY}`,
    },
  });

  return response.data?.text || '';
}

/**
 * 1. المعالج الرئيسي لاستقبال الطلب (صوتي أو نصي) والربط مع الـ Agent Service
 * المسار: POST /api/voice-assistant/process
 */
export const processVoiceOrTextCommand = async (req, res) => {
  let tempFilePath = null;

  try {
    let userPrompt = req.body.prompt || '';
    let history = [];

    if (req.body.history) {
      try {
        history = typeof req.body.history === 'string' ? JSON.parse(req.body.history) : req.body.history;
      } catch (parseError) {
        console.warn('تنبيه: تعذر تحليل history المرسل، سيتم اعتباره فارغاً.');
      }
    }

    if (req.file) {
      tempFilePath = req.file.path;
      const transcription = await transcribeAudioWithGroq(tempFilePath);

      if (!transcription || transcription.trim().length === 0) {
        return res.status(400).json({
          success: false,
          message: 'لم نتمكن من التعرف على الصوت المرفق، يرجى المحاولة مرة أخرى بصوت أوضح.',
        });
      }

      userPrompt = transcription.trim();
    }

    if (!userPrompt) {
      return res.status(400).json({
        success: false,
        message: 'يرجى تقديم أمر نصي أو رفع تسجيل صوتي للمعالجة.',
      });
    }

    const agentResult = await processAgentMessage(history, userPrompt);

    if (tempFilePath && fs.existsSync(tempFilePath)) {
      fs.unlinkSync(tempFilePath);
    }

    if (!agentResult.success) {
      return res.status(500).json({
        success: false,
        message: agentResult.error || agentResult.message || 'حدث خطأ أثناء معالجة الطلب عبر المساعد الذكي.',
      });
    }

    return res.status(200).json({
      success: true,
      transcription: userPrompt,
      message: agentResult.message,
      navigation: agentResult.navigation || null,
      history: agentResult.history,
    });
  } catch (error) {
    // تنظيف الملف المؤقت في حالة حدوث استثناء أو خطأ
    if (tempFilePath && fs.existsSync(tempFilePath)) {
      fs.unlinkSync(tempFilePath);
    }

    console.error('خطأ في aiController.processVoiceOrTextCommand:', error.response?.data || error.message);
    return res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء معالجة الطلب الصوتي/النصي.',
      error: error.response?.data || error.message,
    });
  }
};

/**
 * 2. معالجة تحليل التسجيلات الصوتية المخزنة سابقاً
 * المسار: POST /api/analyze-stored-audio
 */
export const analyzeStoredAudio = async (req, res) => {
  try {
    const { audioPath, prompt } = req.body;

    let textToProcess = prompt || '';

    if (audioPath && fs.existsSync(audioPath)) {
      textToProcess = await transcribeAudioWithGroq(audioPath);
    }

    if (!textToProcess) {
      return res.status(400).json({
        success: false,
        message: 'تعذر العثور على نص أو ملف صوتي صالح للتحليل.',
      });
    }

    const agentResult = await processAgentMessage([], textToProcess);

    return res.status(200).json({
      success: true,
      transcription: textToProcess,
      data: agentResult,
    });
  } catch (error) {
    console.error('خطأ في aiController.analyzeStoredAudio:', error);
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