import { Router } from "express";

import {
  createSupplier,
  getSuppliers,
  getSupplierById,
  updateSupplier,
  deleteSupplier,
  addSupplierProduct,
  getSupplierProducts,
} from "../controllers/supplier.controller";

import { authenticate } from "../middleware/auth.middleware";
import { authorize } from "../middleware/role.middleware";

const router = Router();

router.post(
  "/",
  authenticate,
  authorize("ADMIN", "MANAGER"),
  createSupplier
);

router.get(
  "/",
  authenticate,
  getSuppliers
);

router.get(
  "/:id",
  authenticate,
  getSupplierById
);

router.put(
  "/:id",
  authenticate,
  authorize("ADMIN", "MANAGER"),
  updateSupplier
);

router.delete(
  "/:id",
  authenticate,
  authorize("ADMIN"),
  deleteSupplier
);

router.post(
  "/:id/products",
  authenticate,
  authorize("ADMIN", "MANAGER"),
  addSupplierProduct
);

router.get(
  "/:id/products",
  authenticate,
  getSupplierProducts
);

export default router;