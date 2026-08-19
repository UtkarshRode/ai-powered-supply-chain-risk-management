import { Router } from "express";

import {
  createWarehouse,
  getWarehouses,
  getWarehouseById,
  updateWarehouse,
  deleteWarehouse,
} from "../controllers/warehouse.controller";

import { authenticate } from "../middleware/auth.middleware";
import { authorize } from "../middleware/role.middleware";

const router = Router();

router.post(
  "/",
  authenticate,
  authorize("ADMIN", "MANAGER"),
  createWarehouse
);

router.get(
  "/",
  authenticate,
  getWarehouses
);

router.get(
  "/:id",
  authenticate,
  getWarehouseById
);

router.put(
  "/:id",
  authenticate,
  authorize("ADMIN", "MANAGER"),
  updateWarehouse
);

router.delete(
  "/:id",
  authenticate,
  authorize("ADMIN"),
  deleteWarehouse
);

export default router;