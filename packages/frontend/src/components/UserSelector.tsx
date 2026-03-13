import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { fetchUserByUsername } from "../lib/api";
import { useUser } from "../context/UserContext";

export default function UserSelector() {
  const navigate = useNavigate();
  const { currentUser, setCurrentUser, clearCurrentUser } = useUser();
  const [username, setUsername] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = username.trim();
    if (!trimmed) return;

    setError(null);
    setLoading(true);
    try {
      const user = await fetchUserByUsername(trimmed);
      setCurrentUser({ id: user.id, username: user.username, displayName: user.displayName });
      setUsername("");
    } catch {
      setError("not_found");
    } finally {
      setLoading(false);
    }
  }

  if (currentUser) {
    return (
      <div className="flex items-center gap-2 text-sm">
        <span className="text-gray-700">
          Signed in as <span className="font-medium">{currentUser.displayName}</span>
        </span>
        <button
          onClick={clearCurrentUser}
          className="text-indigo-600 hover:text-indigo-800 font-medium"
        >
          Sign Out
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <form onSubmit={handleSignIn} className="flex items-center gap-2">
        <input
          type="text"
          value={username}
          onChange={(e) => {
            setUsername(e.target.value);
            setError(null);
          }}
          placeholder="Username"
          className="text-sm border border-gray-300 rounded-md px-2 py-1 text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 w-36"
        />
        <button
          type="submit"
          disabled={loading || !username.trim()}
          className="text-sm bg-indigo-600 text-white px-3 py-1 rounded-md hover:bg-indigo-700 disabled:opacity-50"
        >
          {loading ? "..." : "Sign In"}
        </button>
      </form>
      {error === "not_found" && (
        <span className="text-sm text-red-600">
          Username not found{" "}
          <button
            onClick={() => navigate("/register")}
            className="text-indigo-600 hover:text-indigo-800 underline"
          >
            Register
          </button>
        </span>
      )}
    </div>
  );
}
