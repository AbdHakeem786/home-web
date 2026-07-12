import { useEffect, useState } from "react";
import TopBar from "../../components/ui/TopBar";
import CategoryTile from "../../components/CategoryTile";
import { categoriesApi, type ApiCategory } from "../../api";

export default function Categories() {
  const [categories, setCategories] = useState<ApiCategory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    categoriesApi
      .listCategories()
      .then(setCategories)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <TopBar title="All categories" back />
      <div className="grid grid-cols-3 gap-3 p-4">
        {categories.map((c) => (
          <CategoryTile key={c.id} category={c} />
        ))}
        {!loading && categories.length === 0 && (
          <p className="col-span-3 py-10 text-center text-sm text-ink-muted">No categories available yet.</p>
        )}
      </div>
    </div>
  );
}
