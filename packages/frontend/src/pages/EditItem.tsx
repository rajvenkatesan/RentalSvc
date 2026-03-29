import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { fetchRentableItem, updateItem, type RentableItem } from "../lib/api";
import { useUser } from "../context/UserContext";
import ImageUpload from "../components/ImageUpload";
import { CATEGORIES } from "../lib/constants";
const CONDITIONS = [
  { value: "new", label: "New" },
  { value: "like_new", label: "Like New" },
  { value: "good", label: "Good" },
  { value: "fair", label: "Fair" },
];

export default function EditItem() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { currentUser } = useUser();

  const [rentable, setRentable] = useState<RentableItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [condition, setCondition] = useState("good");
  const [images, setImages] = useState<string[]>([]);

  useEffect(() => {
    if (!id) return;
    fetchRentableItem(id)
      .then((r) => {
        setRentable(r);
        setTitle(r.item.title);
        setDescription(r.item.description ?? "");
        setCategory(r.item.category);
        setCondition(r.item.condition);
        setImages(r.item.images ?? []);
      })
      .catch(() => setError("Item not found"))
      .finally(() => setLoading(false));
  }, [id]);

  const isOwner = !!(currentUser && rentable && rentable.item.ownerId === currentUser.id);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!rentable) return;
    setSubmitting(true);
    setError("");
    try {
      await updateItem(rentable.item.id, {
        title,
        description: description || undefined,
        category,
        condition,
        images,
      });
      navigate(`/item/${id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update item");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <div className="max-w-2xl mx-auto px-4 py-8 text-gray-500">Loading...</div>;
  if (error && !rentable) return <div className="max-w-2xl mx-auto px-4 py-8 text-red-500">{error}</div>;
  if (!rentable) return null;
  if (!isOwner) return <div className="max-w-2xl mx-auto px-4 py-8 text-red-500">You do not have permission to edit this item.</div>;

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <button
        onClick={() => navigate(`/item/${id}`)}
        className="text-sm text-indigo-600 hover:underline mb-4 inline-block"
      >
        &larr; Back to Item
      </button>

      <h1 className="text-3xl font-bold text-gray-900 mb-6">Edit Item</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 py-2"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="w-full border border-gray-300 rounded-md px-3 py-2"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 bg-white"
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Condition</label>
            <select
              value={condition}
              onChange={(e) => setCondition(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 bg-white"
            >
              {CONDITIONS.map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
          </div>
        </div>

        <ImageUpload images={images} onChange={setImages} />

        {error && <p className="text-red-500 text-sm">{error}</p>}

        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => navigate(`/item/${id}`)}
            className="border border-gray-300 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting || !title.trim()}
            className="bg-indigo-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-indigo-700 disabled:opacity-50"
          >
            {submitting ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </form>
    </div>
  );
}
