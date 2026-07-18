import * as Icons from "lucide-react";
import { Link } from "react-router-dom";
import type { Category } from "../types";

export default function CategoryTile({ category }: { category: Category }) {
  const Icon = (Icons as any)[category.icon] || Icons.Wrench;
  return (
    <Link
      to={`/workers/${category.id}`}
      className="group flex flex-col items-center gap-2 rounded-2xl border border-border bg-card p-3 text-center transition-all duration-200 hover:-translate-y-0.5 hover:border-primary hover:bg-primary-light/40 hover:shadow-card"
    >
      <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary-light text-primary transition-transform duration-200 group-hover:scale-105">
        <Icon size={20} />
      </span>
      <span className="text-xs font-medium leading-tight text-ink">{category.name}</span>
    </Link>
  );
}
