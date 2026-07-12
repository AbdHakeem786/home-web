import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import { validate } from "../middleware/validate";
import { subscribePushSchema, unsubscribePushSchema } from "../validators/notificationValidators";
import * as notificationController from "../controllers/notificationController";

const router = Router();

router.get("/vapid-public-key", notificationController.getVapidPublicKey);

router.use(requireAuth);

router.get("/", notificationController.listMyNotifications);
router.patch("/:id/read", notificationController.markAsRead);
router.patch("/read-all", notificationController.markAllAsRead);
router.post("/subscribe", validate(subscribePushSchema), notificationController.subscribePush);
router.post("/unsubscribe", validate(unsubscribePushSchema), notificationController.unsubscribePush);

export default router;
