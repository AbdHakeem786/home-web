import { Router } from "express";
import { validate } from "../middleware/validate";
import { requireAuth, requireRole } from "../middleware/auth";
import { withdrawalSchema } from "../validators/walletValidators";
import * as walletController from "../controllers/walletController";

const router = Router();

router.use(requireAuth, requireRole("worker"));

router.get("/summary", walletController.getWalletSummary);
router.get("/transactions", walletController.listMyTransactions);
router.post("/withdraw", validate(withdrawalSchema), walletController.requestWithdrawal);

export default router;
