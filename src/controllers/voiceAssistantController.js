import Groq, { toFile } from 'groq-sdk';
import fs from 'fs';
import path from 'path';

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

const TRANSCRIPTIONS_DIR = path.join(process.cwd(), 'uploads');

if (!fs.existsSync(TRANSCRIPTIONS_DIR)) {
  fs.mkdirSync(TRANSCRIPTIONS_DIR, { recursive: true });
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

/* ============================================================
 *  Controller: Transcription Only
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

    return res.status(200).json({
      success: true,
      text: transcribedText,
      transcriptionFile: path.basename(transcriptionFilePath),
    });

  } catch (error) {
    console.error('Error processing audio transcription:', error);

    return res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء تحويل الصوت إلى نص',
      error: error.message,
    });
  } finally {
    safeUnlink(inputFilePath);
  }
}