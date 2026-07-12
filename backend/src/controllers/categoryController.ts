import { Request, Response } from "express";
import { Category } from "../models/Category";
import { AppError } from "../utils/AppError";
import { ok, created } from "../utils/apiResponse";

export async function listCategories(req: Request, res: Response): Promise<void> {
  const onlyActive = req.query.all !== "true";
  const filter = onlyActive ? { active: true } : {};
  const categories = await Category.find(filter).sort({ name: 1 });
  ok(res, categories);
}

export async function getCategory(req: Request, res: Response): Promise<void> {
  const category = await Category.findById(req.params.id);
  if (!category) throw AppError.notFound("Category not found");
  ok(res, category);
}

export async function createCategory(req: Request, res: Response): Promise<void> {
  const { name, icon } = req.body;
  const existing = await Category.findOne({ name });
  if (existing) throw AppError.conflict("Category with this name already exists");
  const category = await Category.create({ name, icon });
  created(res, category);
}

export async function updateCategory(req: Request, res: Response): Promise<void> {
  const category = await Category.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!category) throw AppError.notFound("Category not found");
  ok(res, category);
}

export async function deleteCategory(req: Request, res: Response): Promise<void> {
  const category = await Category.findByIdAndUpdate(req.params.id, { active: false }, { new: true });
  if (!category) throw AppError.notFound("Category not found");
  ok(res, { message: "Category deactivated" });
}
