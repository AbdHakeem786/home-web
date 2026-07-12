import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import { upload } from "../middleware/upload";
import * as uploadController from "../controllers/uploadController";

const router = Router();

router.post("/:type", requireAuth, upload.single("file"), uploadController.uploadFile);

export default router;
