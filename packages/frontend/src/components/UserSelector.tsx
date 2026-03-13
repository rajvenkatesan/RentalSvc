import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { fetchUsers, type User } from "../lib/api";
import { useUser } from "../context/UserContext";

export default function UserSelector() {
  const navigate = useNavigate();
  const { currentUser, setCurrentUser } = useUser();
  const [users, setUsers] = useState<User[]>([]);

  useEffect(() => {
    fetchUsers()
      .then(setUsers)
      .catch(() => setUsers([]));
  }, []);

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const value = e.target.value;
    if (value === "__register__") {
      navigate("/register");
      return;
    }
    const user = users.find((u) => u.id === value);
    if (user) {
      setCurrentUser({ id: user.id, username: user.username, displayName: user.displayName });
    }
  }

  return (
    <select
      value={currentUser?.id ?? ""}
      onChange={handleChange}
      className="text-sm border border-gray-300 rounded-md px-2 py-1 text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
    >
      <option value="" disabled>
        Select User
      </option>
      {users.map((u) => (
        <option key={u.id} value={u.id}>
          {u.displayName || u.username}
        </option>
      ))}
      <option value="__register__">+ Register New User</option>
    </select>
  );
}
