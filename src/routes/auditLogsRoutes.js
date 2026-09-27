import { Router } from 'express';
import * as controller from '../controllers/auditLogsController.js';
const router = Router();
router.route('/')
    .get(controller.listAuditLogs)
export default router;
