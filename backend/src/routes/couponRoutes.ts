import { Router } from "express";
import { validate } from "../middleware/validate";
import { requireAuth, requireRole } from "../middleware/auth";
import { createCouponSchema, updateCouponSchema, validateCouponSchema } from "../validators/couponValidators";
import * as couponController from "../controllers/couponController";

const router = Router();

router.use(requireAuth);

router.post("/validate", validate(validateCouponSchema), couponController.validateCoupon);

router.use(requireRole("admin"));

router.post("/", validate(createCouponSchema), couponController.createCoupon);
router.get("/", couponController.listCoupons);
router.patch("/:id", validate(updateCouponSchema), couponController.updateCoupon);
router.delete("/:id", couponController.deleteCoupon);

export default router;
