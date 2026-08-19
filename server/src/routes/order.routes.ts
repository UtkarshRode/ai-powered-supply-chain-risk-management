import { Router } from "express";

import {
  createOrder,
  getOrders,
  getOrderById,
  updateOrderStatus,
  getOrderRiskAnalysis,
} from "../controllers/order.controller";

import { authenticate } from "../middleware/auth.middleware";
import { authorize } from "../middleware/role.middleware";

const router = Router();

router.post(
  "/",
  authenticate,
  authorize("ADMIN", "MANAGER"),
  createOrder
);

router.get(
  "/",
  authenticate,
  getOrders
);

// IMPORTANT: keep this before /:id
router.get(
  "/:id/risk",
  authenticate,
  getOrderRiskAnalysis
);

router.get(
  "/:id",
  authenticate,
  getOrderById
);

router.patch(
  "/:id/status",
  authenticate,
  authorize("ADMIN", "MANAGER"),
  updateOrderStatus
);

export default router;