import Database from "better-sqlite3";
import crypto from "crypto";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import type { StorageAdapter } from "./types.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.resolve(__dirname, "../../../data");
const DB_PATH = path.join(DATA_DIR, "images.db");

function getDb(): Database.Database {
  fs.mkdirSync(DATA_DIR, { recursive: true });

  const db = new Database(DB_PATH);
  db.pragma("journal_mode = WAL");

  db.exec(`
    CREATE TABLE IF NOT EXISTS images (
      id TEXT PRIMARY KEY,
      data BLOB NOT NULL,
      mimetype TEXT NOT NULL,
      originalname TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);

  return db;
}

export function createSqliteAdapter(): StorageAdapter {
  const db = getDb();

  const insertStmt = db.prepare(
    "INSERT INTO images (id, data, mimetype, originalname) VALUES (?, ?, ?, ?)"
  );
  const selectStmt = db.prepare("SELECT data, mimetype FROM images WHERE id = ?");
  const deleteStmt = db.prepare("DELETE FROM images WHERE id = ?");

  return {
    async save(file) {
      const id = crypto.randomUUID();
      insertStmt.run(id, file.buffer, file.mimetype, file.originalname);
      return id;
    },

    async get(id) {
      const row = selectStmt.get(id) as { data: Buffer; mimetype: string } | undefined;
      if (!row) return null;
      return { buffer: Buffer.from(row.data), mimetype: row.mimetype };
    },

    async delete(id) {
      deleteStmt.run(id);
    },
  };
}
