import { Router } from 'express';
import multer from 'multer';
import { processAudioAndAnalyze } from '../controllers/voiceAssistantController.js';

const router = Router();
const upload = multer({ dest: 'uploads/' });

router.post('/process', upload.single('audio'), processAudioAndAnalyze);

export default router;