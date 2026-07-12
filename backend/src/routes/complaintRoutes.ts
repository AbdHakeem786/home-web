import { Router } from "express";
import { validate } from "../middleware/validate";
import { requireAuth, requireRole } from "../middleware/auth";
import { createComplaintSchema, updateComplaintSchema } from "../validators/complaintValidators";
import * as complaintController from "../controllers/complaintController";

const router = Router();

router.use(requireAuth);

router.post("/", validate(createComplaintSchema), complaintController.createComplaint);
router.get("/mine", complaintController.listMyComplaints);
router.get("/", requireRole("admin"), complaintController.listAllComplaints);
router.patch("/:id", requireRole("admin"), validate(updateComplaintSchema), complaintController.updateComplaint);

export default router;
