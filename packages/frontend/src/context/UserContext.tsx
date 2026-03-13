import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import { setApiUserId } from "../lib/api";

interface CurrentUser {
  id: string;
  username: string;
  displayName: string;
}

interface UserContextValue {
  currentUser: CurrentUser | null;
  setCurrentUser: (user: CurrentUser) => void;
  clearCurrentUser: () => void;
}

const UserContext = createContext<UserContextValue | null>(null);

const STORAGE_KEY = "rentalsvc_current_user";

export function UserProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUserState] = useState<CurrentUser | null>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const user = JSON.parse(stored) as CurrentUser;
        setApiUserId(user.id);
        return user;
      }
    } catch {
      // ignore corrupt localStorage
    }
    return null;
  });

  useEffect(() => {
    try {
      if (currentUser) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(currentUser));
        setApiUserId(currentUser.id);
      } else {
        localStorage.removeItem(STORAGE_KEY);
        setApiUserId(null);
      }
    } catch {
      // localStorage may not be available in some environments
    }
  }, [currentUser]);

  function setCurrentUser(user: CurrentUser) {
    setCurrentUserState(user);
  }

  function clearCurrentUser() {
    setCurrentUserState(null);
  }

  return (
    <UserContext.Provider value={{ currentUser, setCurrentUser, clearCurrentUser }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser(): UserContextValue {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error("useUser must be used within a UserProvider");
  return ctx;
}
