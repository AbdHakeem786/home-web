import { Router } from "express";
import { validate } from "../middleware/validate";
import { requireAuth, requireRole } from "../middleware/auth";
import {
  createBookingSchema,
  updateBookingStatusSchema,
  rescheduleBookingSchema,
  listBookingsSchema,
} from "../validators/bookingValidators";
import * as bookingController from "../controllers/bookingController";

const router = Router();

router.use(requireAuth);

router.post("/", requireRole("customer"), validate(createBookingSchema), bookingController.createBooking);
router.get("/", validate(listBookingsSchema), bookingController.listMyBookings);
router.get("/:id", bookingController.getBooking);
router.patch(
  "/:id/status",
  requireRole("customer", "worker", "admin"),
  validate(updateBookingStatusSchema),
  bookingController.updateBookingStatus
);
router.patch(
  "/:id/reschedule",
  requireRole("customer"),
  validate(rescheduleBookingSchema),
  bookingController.rescheduleBooking
);
router.post("/:id/payment-intent", requireRole("customer"), bookingController.createPaymentIntent);

export default router;
