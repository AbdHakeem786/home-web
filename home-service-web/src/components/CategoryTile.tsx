import * as Icons from "lucide-react";
import { Link } from "react-router-dom";
import type { Category } from "../types";

export default function CategoryTile({ category }: { category: Category }) {
  const Icon = (Icons as any)[category.icon] || Icons.Wrench;
  return (
    <Link
      to={`/workers/${category.id}`}
      className="flex flex-col items-center gap-2 rounded-2xl border border-border bg-white p-3 text-center transition-colors hover:border-primary hover:bg-primary-light/40"
    >
      <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary-light text-primary">
        <Icon size={20} />
      </span>
      <span className="text-xs font-medium leading-tight text-ink">{category.name}</span>
    </Link>
  );
}
