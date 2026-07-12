import { Router } from "express";
import { validate } from "../middleware/validate";
import { requireAuth, requireRole } from "../middleware/auth";
import {
  listWorkersSchema,
  createWorkerProfileSchema,
  updateWorkerProfileSchema,
  updateLocationSchema,
  updateAvailabilitySchema,
} from "../validators/workerValidators";
import * as workerController from "../controllers/workerController";

const router = Router();

router.get("/", validate(listWorkersSchema), workerController.listWorkers);
router.get("/me", requireAuth, requireRole("worker"), workerController.getMyWorkerProfile);
router.post(
  "/me",
  requireAuth,
  requireRole("worker"),
  validate(createWorkerProfileSchema),
  workerController.createMyWorkerProfile
);
router.patch(
  "/me",
  requireAuth,
  requireRole("worker"),
  validate(updateWorkerProfileSchema),
  workerController.updateMyWorkerProfile
);
router.patch(
  "/me/location",
  requireAuth,
  requireRole("worker"),
  validate(updateLocationSchema),
  workerController.updateMyLocation
);
router.patch(
  "/me/availability",
  requireAuth,
  requireRole("worker"),
  validate(updateAvailabilitySchema),
  workerController.updateMyAvailability
);
router.patch("/:id/verify", requireAuth, requireRole("admin"), workerController.verifyWorker);
router.get("/:id", workerController.getWorkerProfile);

export default router;
