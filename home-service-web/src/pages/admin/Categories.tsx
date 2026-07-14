import { useEffect, useState } from "react";
import * as Icons from "lucide-react";
import { Plus, Trash2 } from "lucide-react";
import { categoriesApi, ApiError, type ApiCategory } from "../../api";
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";

export default function AdminCategories() {
  const [categories, setCategories] = useState<ApiCategory[]>([]);
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  function reload() {
    categoriesApi
      .listCategories()
      .then(setCategories)
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    reload();
  }, []);

  async function addCategory() {
    if (!name.trim()) return;
    setError("");
    try {
      const created = await categoriesApi.createCategory({ name: name.trim(), icon: "Settings2" });
      setCategories((c) => [...c, created]);
      setName("");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not add category.");
    }
  }

  async function removeCategory(id: string) {
    setError("");
    try {
      await categoriesApi.deactivateCategory(id);
      setCategories((cs) => cs.filter((x) => x.id !== id));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not remove category.");
    }
  }

  return (
    <div>
      <h1 className="mb-5 font-display text-xl font-bold text-ink">Categories</h1>

      {error && <p className="mb-4 rounded-xl bg-danger-light px-3 py-2.5 text-sm text-danger">{error}</p>}

      <div className="mb-5 flex gap-2">
        <Input id="cat" placeholder="New category name" value={name} onChange={(e) => setName(e.target.value)} className="flex-1" />
        <Button icon={<Plus size={16} />} onClick={addCategory}>Add</Button>
      </div>

      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 md:grid-cols-4">
        {categories.map((c) => {
          const Icon = (Icons as any)[c.icon] || Icons.Wrench;
          return (
            <div key={c.id} className="flex items-center gap-2.5 rounded-xl border border-border bg-card p-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-light text-primary">
                <Icon size={16} />
              </span>
              <span className="flex-1 truncate text-sm text-ink">{c.name}</span>
              <button
                onClick={() => removeCategory(c.id)}
                className="text-ink-muted hover:text-danger"
                aria-label={`Remove ${c.name}`}
              >
                <Trash2 size={14} />
              </button>
            </div>
          );
        })}
        {!loading && categories.length === 0 && (
          <p className="col-span-4 py-10 text-center text-sm text-ink-muted">No categories yet.</p>
        )}
      </div>
    </div>
  );
}
