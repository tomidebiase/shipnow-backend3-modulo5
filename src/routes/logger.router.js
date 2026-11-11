import { Router } from 'express';
import { testLoggerController } from '../controllers/logger.controller.js';

const router = Router();

router.get('/test', testLoggerController);

export default router;
