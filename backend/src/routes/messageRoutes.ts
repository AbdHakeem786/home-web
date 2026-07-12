import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import * as messageController from "../controllers/messageController";

const router = Router();

router.get("/:bookingId", requireAuth, messageController.listMessages);

export default router;
