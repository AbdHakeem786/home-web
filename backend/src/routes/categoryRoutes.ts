import { Router } from "express";
import { validate } from "../middleware/validate";
import { requireAuth, requireRole } from "../middleware/auth";
import { createCategorySchema, updateCategorySchema } from "../validators/categoryValidators";
import * as categoryController from "../controllers/categoryController";

const router = Router();

router.get("/", categoryController.listCategories);
router.get("/:id", categoryController.getCategory);
router.post("/", requireAuth, requireRole("admin"), validate(createCategorySchema), categoryController.createCategory);
router.patch("/:id", requireAuth, requireRole("admin"), validate(updateCategorySchema), categoryController.updateCategory);
router.delete("/:id", requireAuth, requireRole("admin"), categoryController.deleteCategory);

export default router;
