import Groq, { toFile } from 'groq-sdk';
import { GoogleGenAI } from '@google/genai';
import fs from 'fs';
import path from 'path';

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

const TRANSCRIPTIONS_DIR = path.join(process.cwd(), 'uploads');
const AI_RESPONSES_DIR = path.join(process.cwd(), 'results');

if (!fs.existsSync(TRANSCRIPTIONS_DIR)) {
  fs.mkdirSync(TRANSCRIPTIONS_DIR, { recursive: true });
}

if (!fs.existsSync(AI_RESPONSES_DIR)) {
  fs.mkdirSync(AI_RESPONSES_DIR, { recursive: true });
}

function safeUnlink(filePath) {
  if (filePath && fs.existsSync(filePath)) {
    try {
      fs.unlinkSync(filePath);
    } catch (e) {
      console.error(`Failed to delete temporary file ${filePath}:`, e);
    }
  }
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/* ============================================================
 *  Gemini Models — قائمة الموديلات بالترتيب
 *  أول واحد ينجح، هو اللي هيتم استخدام نتيجته.
 * ============================================================ */
const GEMINI_MODELS = [
  'gemini-3.8-flash',
  'gemini-3.7-flash',
  'gemini-3.6-flash',
];

const RETRYABLE_STATUSES = [408, 429, 500, 502, 503, 504];

/**
 * نداء Gemini لموديل واحد مع retry داخلي للأخطاء المؤقتة فقط.
 * لو الموديل فشل نهائيًا، بترمي error عشان الـ fallback يشتغل.
 */
async function callGeminiModel({ model, prompt, maxRetries = 3 }) {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      console.log(
        `[Gemini:${model}] attempt ${attempt + 1}/${maxRetries + 1}`
      );

      const response = await ai.models.generateContent({
        model,
        contents: prompt,
      });

      const text = (response?.text || '').trim();
      if (!text) throw new Error(`[${model}] returned empty response`);

      return text;
    } catch (error) {
      const status = error?.status;
      const isRetryable = RETRYABLE_STATUSES.includes(status);

      // خطأ غير مؤقت (زي 400 أو 404 يعني الموديل نفسه مش موجود)
      // → نرميه فورًا عشان الـ fallback ينقل للموديل اللي بعده.
      if (!isRetryable) {
        throw error;
      }

      // خلصت المحاولات
      if (attempt === maxRetries) {
        console.error(
          `[${model}] failed after ${maxRetries + 1} attempts.`
        );
        throw error;
      }

      const baseDelay = 1000 * 2 ** attempt;
      const jitter = Math.floor(Math.random() * 500);
      const delay = baseDelay + jitter;

      console.warn(
        `[${model}] status ${status}. Retrying in ${delay}ms...`
      );

      await sleep(delay);
    }
  }
}

/**
 * بتلف على كل موديلات Gemini بالترتيب،
 * وأول واحد ينجح ترجع نتيجته،
 * لو كلهم فشلوا ترمي error فيه تفاصيل كل موديل.
 */
async function analyzeWithGeminiFallback(prompt) {
  const errors = [];

  for (const model of GEMINI_MODELS) {
    try {
      console.log(`Trying Gemini model: ${model}`);

      const text = await callGeminiModel({ model, prompt });

      console.log(`✅ Gemini model succeeded: ${model}`);

      return { model, text };
    } catch (error) {
      console.warn(
        `❌ Gemini model "${model}" failed: ${error.message}`
      );
      errors.push({ model, error });
    }
  }

  const finalError = new Error('All Gemini models failed');
  finalError.cause = errors;
  throw finalError;
}

/* ============================================================
 *  Controller
 * ============================================================ */
export async function processAudioAndAnalyze(req, res) {
  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: 'لم يتم رفع أي ملف صوتي',
    });
  }

  const inputFilePath = req.file.path;
  const timestamp = Date.now();

  try {
    const fileStream = await toFile(
      fs.createReadStream(inputFilePath),
      req.file.originalname || 'audio.wav'
    );

    const transcription = await groq.audio.transcriptions.create({
      file: fileStream,
      model: 'whisper-large-v3',
      language: 'ar',
      response_format: 'json',
      temperature: 0.0,
    });

    const transcribedText = (transcription.text || '').trim();

    const transcriptionData = {
      timestamp: new Date(timestamp).toISOString(),
      originalAudioName: req.file.originalname,
      text: transcribedText,
    };

    const transcriptionFilePath = path.join(
      TRANSCRIPTIONS_DIR,
      `transcription_${timestamp}.json`
    );

    fs.writeFileSync(
      transcriptionFilePath,
      JSON.stringify(transcriptionData, null, 2),
      'utf-8'
    );

    const prompt = `
قم بتحليل النص التالي وإرجاع النتيجة بشكل منظم:

${transcribedText}
    `.trim();

    const { model: usedModel, text: analysisResult } =
      await analyzeWithGeminiFallback(prompt);

    const aiResponseData = {
      timestamp: new Date(timestamp).toISOString(),
      transcriptionFile: path.basename(transcriptionFilePath),
      promptText: transcribedText,
      model: usedModel, // ← الموديل اللي رد فعليًا
      analysis: analysisResult,
    };

    const aiResponseFilePath = path.join(
      AI_RESPONSES_DIR,
      `ai_response_${timestamp}.json`
    );

    fs.writeFileSync(
      aiResponseFilePath,
      JSON.stringify(aiResponseData, null, 2),
      'utf-8'
    );

    return res.status(200).json({
      success: true,
      text: transcribedText,
      analysis: analysisResult,
      model: usedModel,
    });
  } catch (error) {
    console.error('Error processing audio and AI analysis:', error);

    if (error.message === 'All Gemini models failed') {
      return res.status(503).json({
        success: false,
        message: 'كل موديلات الذكاء الاصطناعي غير متاحة حاليًا',
        retryable: true,
        details: error.cause?.map((e) => ({
          model: e.model,
          message: e.error.message,
        })),
      });
    }

    if (RETRYABLE_STATUSES.includes(error?.status)) {
      return res.status(error.status).json({
        success: false,
        message: 'خدمة الذكاء الاصطناعي غير متاحة مؤقتًا',
        retryable: true,
      });
    }

    return res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء معالجة الصوت والتحليل',
      error: error.message,
      retryable: false,
    });
  } finally {
    safeUnlink(inputFilePath);
  }
}