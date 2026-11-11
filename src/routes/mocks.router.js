import { Router } from 'express';
import {
  getMockUsers,
  getMockCouriers,
  getMockOrders,
  getMockDeliveries,
  getMockBundle,
  seedMockUsers,
  seedMockBundle
} from '../controllers/mocks.controller.js';

const router = Router();

router.get('/users', getMockUsers);
router.get('/couriers', getMockCouriers);
router.get('/orders', getMockOrders);
router.get('/deliveries', getMockDeliveries);
router.get('/bundle', getMockBundle);
router.post('/seed', seedMockUsers);
router.post('/seed/all', seedMockBundle);

export default router;

