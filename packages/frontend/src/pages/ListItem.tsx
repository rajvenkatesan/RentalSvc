import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createItem, createRentableItem } from "../lib/api";
import { useUser } from "../context/UserContext";
import ImageUpload from "../components/ImageUpload";

type Step = 1 | 2 | 3;

const CATEGORIES = ["Tools", "Electronics", "Sports", "Outdoor", "Kitchen"];
const CONDITIONS = [
  { value: "new", label: "New" },
  { value: "like_new", label: "Like New" },
  { value: "good", label: "Good" },
  { value: "fair", label: "Fair" },
];

export default function ListItem() {
  const navigate = useNavigate();
  const { currentUser } = useUser();
  const [step, setStep] = useState<Step>(1);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Step 1 — Item details
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [condition, setCondition] = useState("good");
  const [images, setImages] = useState<string[]>([]);

  // Step 2 — Rental terms
  const [dailyRate, setDailyRate] = useState("");
  const [weeklyRate, setWeeklyRate] = useState("");
  const [securityDeposit, setSecurityDeposit] = useState("");
  const [minRentalDays, setMinRentalDays] = useState("1");
  const [deliveryOption, setDeliveryOption] = useState("pickup");

  async function handleSubmit() {
    setSubmitting(true);
    setError("");
    try {
      const item = await createItem({
        ownerId: currentUser?.id ?? "",
        title,
        description: description || undefined,
        category,
        condition,
        images: images.length > 0 ? images : undefined,
      });
      await createRentableItem({
        itemId: item.id,
        dailyRate: Number(dailyRate),
        weeklyRate: weeklyRate ? Number(weeklyRate) : undefined,
        securityDeposit: securityDeposit ? Number(securityDeposit) : undefined,
        minRentalDays: Number(minRentalDays),
        deliveryOptions: [deliveryOption],
      });
      navigate("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create listing");
    } finally {
      setSubmitting(false);
    }
  }

  const canAdvanceStep1 = title.trim() && category;
  const canAdvanceStep2 = dailyRate && Number(dailyRate) > 0;

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">List an Item</h1>

      {/* Step indicator */}
      <div className="flex gap-2 mb-8">
        {[1, 2, 3].map((s) => (
          <div
            key={s}
            className={`h-2 flex-1 rounded-full ${
              s <= step ? "bg-indigo-600" : "bg-gray-200"
            }`}
          />
        ))}
      </div>

      {step === 1 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Item Details</h2>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2"
              placeholder="e.g. DeWalt Cordless Drill"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full border border-gray-300 rounded-md px-3 py-2"
              placeholder="Describe the item..."
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
          <button
            onClick={() => setStep(2)}
            disabled={!canAdvanceStep1}
            className="bg-indigo-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-indigo-700 disabled:opacity-50"
          >
            Next: Rental Terms
          </button>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Rental Terms</h2>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Daily Rate ($) *</label>
            <input
              type="number"
              value={dailyRate}
              onChange={(e) => setDailyRate(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2"
              placeholder="29.99"
              min="0"
              step="0.01"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Weekly Rate ($)</label>
            <input
              type="number"
              value={weeklyRate}
              onChange={(e) => setWeeklyRate(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2"
              placeholder="Optional"
              min="0"
              step="0.01"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Security Deposit ($)</label>
            <input
              type="number"
              value={securityDeposit}
              onChange={(e) => setSecurityDeposit(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2"
              placeholder="Optional"
              min="0"
              step="0.01"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Min Rental Days</label>
              <input
                type="number"
                value={minRentalDays}
                onChange={(e) => setMinRentalDays(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2"
                min="1"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Delivery</label>
              <select
                value={deliveryOption}
                onChange={(e) => setDeliveryOption(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 bg-white"
              >
                <option value="pickup">Pickup</option>
                <option value="shipping">Shipping</option>
                <option value="both">Both</option>
              </select>
            </div>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setStep(1)}
              className="border border-gray-300 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-50"
            >
              Back
            </button>
            <button
              onClick={() => setStep(3)}
              disabled={!canAdvanceStep2}
              className="bg-indigo-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-indigo-700 disabled:opacity-50"
            >
              Next: Review
            </button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Review & Publish</h2>
          <div className="bg-gray-50 rounded-lg p-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Title</span>
              <span className="font-medium">{title}</span>
            </div>
            {description && (
              <div className="flex justify-between">
                <span className="text-gray-600">Description</span>
                <span className="font-medium max-w-xs truncate">{description}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-gray-600">Category</span>
              <span className="font-medium">{category}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Condition</span>
              <span className="font-medium capitalize">{condition.replace("_", " ")}</span>
            </div>
            {images.length > 0 && (
              <div className="flex justify-between">
                <span className="text-gray-600">Images</span>
                <span className="font-medium">{images.length} uploaded</span>
              </div>
            )}
            <hr className="my-2" />
            <div className="flex justify-between">
              <span className="text-gray-600">Daily Rate</span>
              <span className="font-medium">${Number(dailyRate).toFixed(2)}</span>
            </div>
            {weeklyRate && (
              <div className="flex justify-between">
                <span className="text-gray-600">Weekly Rate</span>
                <span className="font-medium">${Number(weeklyRate).toFixed(2)}</span>
              </div>
            )}
            {securityDeposit && (
              <div className="flex justify-between">
                <span className="text-gray-600">Security Deposit</span>
                <span className="font-medium">${Number(securityDeposit).toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-gray-600">Min Rental Days</span>
              <span className="font-medium">{minRentalDays}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Delivery</span>
              <span className="font-medium capitalize">{deliveryOption}</span>
            </div>
          </div>
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <div className="flex gap-3">
            <button
              onClick={() => setStep(2)}
              className="border border-gray-300 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-50"
            >
              Back
            </button>
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="bg-indigo-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-indigo-700 disabled:opacity-50"
            >
              {submitting ? "Publishing..." : "Publish Listing"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
