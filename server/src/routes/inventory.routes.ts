import { Router } from "express";

import {
  createInventory,
  getInventory,
  getInventoryById,
  updateInventory,
  reserveInventory,
  releaseInventory,
} from "../controllers/inventory.controller";

import { authenticate } from "../middleware/auth.middleware";
import { authorize } from "../middleware/role.middleware";

const router = Router();

router.post(
  "/",
  authenticate,
  authorize("ADMIN", "MANAGER"),
  createInventory
);

router.get(
  "/",
  authenticate,
  getInventory
);

router.get(
  "/:id",
  authenticate,
  getInventoryById
);

router.put(
  "/:id",
  authenticate,
  authorize("ADMIN", "MANAGER"),
  updateInventory
);

router.post(
  "/:id/reserve",
  authenticate,
  authorize("ADMIN", "MANAGER"),
  reserveInventory
);

router.post(
  "/:id/release",
  authenticate,
  authorize("ADMIN", "MANAGER"),
  releaseInventory
);

export default router;