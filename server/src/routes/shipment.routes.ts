import { Router } from "express";

import {
  createShipment,
  getShipments,
  getShipmentById,
  updateShipmentStatus,
} from "../controllers/shipment.controller";

import { authenticate } from "../middleware/auth.middleware";
import { authorize } from "../middleware/role.middleware";

const router = Router();

router.post(
  "/",
  authenticate,
  authorize("ADMIN", "MANAGER"),
  createShipment
);

router.get(
  "/",
  authenticate,
  getShipments
);

router.get(
  "/:id",
  authenticate,
  getShipmentById
);

router.patch(
  "/:id/status",
  authenticate,
  authorize("ADMIN", "MANAGER"),
  updateShipmentStatus
);

export default router;