import { Router } from "express";
import { validate } from "../middleware/validate";
import { requireAuth, requireRole } from "../middleware/auth";
import { setUserActiveSchema, processWithdrawalSchema, creditWalletSchema } from "../validators/adminValidators";
import * as adminController from "../controllers/adminController";

const router = Router();

router.use(requireAuth, requireRole("admin"));

router.get("/dashboard", adminController.getDashboardStats);
router.get("/analytics", adminController.getAnalytics);
router.get("/users", adminController.listUsers);
router.patch("/users/:id/active", validate(setUserActiveSchema), adminController.setUserActive);
router.post("/customers/:id/wallet-credit", validate(creditWalletSchema), adminController.creditCustomerWallet);
router.get("/workers", adminController.listWorkersAdmin);
router.get("/withdrawals", adminController.listWithdrawals);
router.patch("/withdrawals/:id", validate(processWithdrawalSchema), adminController.processWithdrawal);

export default router;
