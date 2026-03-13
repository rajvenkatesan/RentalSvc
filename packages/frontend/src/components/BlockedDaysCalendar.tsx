import { useEffect, useState } from "react";
import {
  fetchBlockedDays,
  createBlockedDay,
  deleteBlockedDay,
  type BlockedDay,
} from "../lib/api";

interface BlockedDaysCalendarProps {
  rentableItemId: string;
  isOwner: boolean;
}

export default function BlockedDaysCalendar({ rentableItemId, isOwner }: BlockedDaysCalendarProps) {
  const [blockedDays, setBlockedDays] = useState<BlockedDay[]>([]);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState("");

  function loadBlockedDays() {
    fetchBlockedDays(rentableItemId)
      .then(setBlockedDays)
      .catch(() => {})
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    loadBlockedDays();
  }, [rentableItemId]);

  async function handleAdd() {
    if (!startDate || !endDate) return;
    setAdding(true);
    setError("");
    try {
      await createBlockedDay(rentableItemId, startDate, endDate);
      setStartDate("");
      setEndDate("");
      loadBlockedDays();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add blocked days");
    } finally {
      setAdding(false);
    }
  }

  async function handleDelete(id: string) {
    try {
      await deleteBlockedDay(id);
      setBlockedDays((prev) => prev.filter((d) => d.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete");
    }
  }

  const today = new Date().toISOString().split("T")[0];

  if (loading) return null;

  return (
    <div className="mt-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-3">Blocked Dates</h3>

      {blockedDays.length === 0 && !isOwner ? (
        <p className="text-sm text-gray-500">No blocked dates.</p>
      ) : (
        <>
          {blockedDays.length > 0 && (
            <ul className="space-y-2 mb-4">
              {blockedDays.map((bd) => (
                <li
                  key={bd.id}
                  className="flex items-center justify-between bg-red-50 border border-red-200 rounded-md px-3 py-2 text-sm"
                >
                  <span>
                    {new Date(bd.startDate).toLocaleDateString()} &ndash;{" "}
                    {new Date(bd.endDate).toLocaleDateString()}
                    {bd.reason && (
                      <span className="text-gray-500 ml-2">({bd.reason})</span>
                    )}
                  </span>
                  {isOwner && (
                    <button
                      onClick={() => handleDelete(bd.id)}
                      className="text-red-600 hover:text-red-800 text-xs font-medium ml-2"
                    >
                      Remove
                    </button>
                  )}
                </li>
              ))}
            </ul>
          )}

          {isOwner && (
            <div className="flex gap-2 items-end flex-wrap">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Start</label>
                <input
                  type="date"
                  value={startDate}
                  min={today}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="border border-gray-300 rounded-md px-2 py-1 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">End</label>
                <input
                  type="date"
                  value={endDate}
                  min={startDate || today}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="border border-gray-300 rounded-md px-2 py-1 text-sm"
                />
              </div>
              <button
                onClick={handleAdd}
                disabled={!startDate || !endDate || adding}
                className="bg-red-600 text-white px-3 py-1 rounded-md text-sm font-medium hover:bg-red-700 disabled:opacity-50"
              >
                {adding ? "Adding..." : "Block Dates"}
              </button>
            </div>
          )}
        </>
      )}

      {error && <p className="text-sm text-red-500 mt-2">{error}</p>}
    </div>
  );
}
