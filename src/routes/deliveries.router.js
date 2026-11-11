import { Router } from 'express';
import { getDeliveryById } from '../controllers/deliveries.controller.js';

const router = Router();

router.get('/:id', getDeliveryById);

export default router;
