import type { StorageAdapter } from "./types.js";
import { createSqliteAdapter } from "./sqliteAdapter.js";

let instance: StorageAdapter | null = null;

export function getStorage(): StorageAdapter {
  if (!instance) {
    const backend = process.env.STORAGE_BACKEND ?? "sqlite";

    switch (backend) {
      case "sqlite":
        instance = createSqliteAdapter();
        break;
      default:
        throw new Error(`Unknown storage backend: ${backend}`);
    }
  }
  return instance;
}

export type { StorageAdapter } from "./types.js";
