import { Router } from "express";
import { validate } from "../middleware/validate";
import { requireAuth, requireRole } from "../middleware/auth";
import { createReviewSchema } from "../validators/reviewValidators";
import * as reviewController from "../controllers/reviewController";

const router = Router();

router.post("/", requireAuth, requireRole("customer"), validate(createReviewSchema), reviewController.createReview);
router.get("/worker/:workerId", reviewController.listWorkerReviews);

export default router;
