import { Router } from "express";
import { requireAuth, requireRole } from "../middleware/auth";
import * as customerWalletController from "../controllers/customerWalletController";

const router = Router();

router.use(requireAuth, requireRole("customer"));

router.get("/summary", customerWalletController.getWalletSummary);
router.get("/transactions", customerWalletController.listMyTransactions);

export default router;
