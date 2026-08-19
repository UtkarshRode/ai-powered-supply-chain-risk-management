import { Router } from "express";

import {
  createCustomer,
  getCustomers,
  getCustomerById,
  updateCustomer,
} from "../controllers/customer.controller";

import { authenticate } from "../middleware/auth.middleware";
import { authorize } from "../middleware/role.middleware";

const router = Router();

router.post(
  "/",
  authenticate,
  authorize("ADMIN", "MANAGER"),
  createCustomer
);

router.get(
  "/",
  authenticate,
  getCustomers
);

router.get(
  "/:id",
  authenticate,
  getCustomerById
);

router.put(
  "/:id",
  authenticate,
  authorize("ADMIN", "MANAGER"),
  updateCustomer
);

export default router;