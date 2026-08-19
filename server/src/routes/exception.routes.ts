import { Router } from "express";

import {
  getExceptions,
  getExceptionById,
  resolveException,
  runDetection,
} from "../controllers/exception.controller";

import { authenticate } from "../middleware/auth.middleware";
import { authorize } from "../middleware/role.middleware";

const router = Router();

router.get(
  "/",
  authenticate,
  getExceptions
);

router.post(
  "/detect",
  authenticate,
  authorize("ADMIN", "MANAGER"),
  runDetection
);

router.get(
  "/:id",
  authenticate,
  getExceptionById
);

router.patch(
  "/:id/resolve",
  authenticate,
  authorize("ADMIN", "MANAGER"),
  resolveException
);

export default router;