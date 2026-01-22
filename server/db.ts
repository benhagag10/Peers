import { createClient, type Client } from '@libsql/client';
import dotenv from 'dotenv';

dotenv.config();

let db: Client;

export function getDb(): Client {
  if (!db) {
    const url = process.env.TURSO_DATABASE_URL;
    const authToken = process.env.TURSO_AUTH_TOKEN;

    if (!url) {
      throw new Error('TURSO_DATABASE_URL environment variable is required');
    }

    db = createClient({
      url,
      authToken,
    });
  }
  return db;
}

export async function initializeDatabase(): Promise<void> {
  const client = getDb();

  // Create people table
  await client.execute(`
    CREATE TABLE IF NOT EXISTS people (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      affiliation TEXT,
      photo_url TEXT,
      peeps TEXT,
      stream TEXT,
      interests TEXT,
      position_x REAL NOT NULL,
      position_y REAL NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )
  `);

  // Create links table
  await client.execute(`
    CREATE TABLE IF NOT EXISTS links (
      id TEXT PRIMARY KEY,
      source_id TEXT NOT NULL,
      target_id TEXT NOT NULL,
      description TEXT NOT NULL,
      type TEXT NOT NULL,
      url TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (source_id) REFERENCES people(id) ON DELETE CASCADE,
      FOREIGN KEY (target_id) REFERENCES people(id) ON DELETE CASCADE
    )
  `);

  // Create feature_requests table
  await client.execute(`
    CREATE TABLE IF NOT EXISTS feature_requests (
      id TEXT PRIMARY KEY,
      author_name TEXT,
      request_text TEXT NOT NULL,
      created_at TEXT NOT NULL
    )
  `);

  // Create indexes for better query performance
  await client.execute(`
    CREATE INDEX IF NOT EXISTS idx_links_source ON links(source_id)
  `);

  await client.execute(`
    CREATE INDEX IF NOT EXISTS idx_links_target ON links(target_id)
  `);

  console.log('Database initialized successfully');
}

// Helper to convert database row to FeatureRequest object
export function rowToFeatureRequest(row: Record<string, unknown>): {
  id: string;
  authorName: string | null;
  requestText: string;
  createdAt: string;
} {
  return {
    id: row.id as string,
    authorName: row.author_name as string | null,
    requestText: row.request_text as string,
    createdAt: row.created_at as string,
  };
}

// Helper to convert database row to Person object
export function rowToPerson(row: Record<string, unknown>): {
  id: string;
  name: string;
  affiliation?: string;
  photoUrl?: string;
  peeps?: string;
  stream?: string;
  interests?: string[];
  position: { x: number; y: number };
  createdAt: string;
  updatedAt: string;
} {
  return {
    id: row.id as string,
    name: row.name as string,
    affiliation: row.affiliation as string | undefined,
    photoUrl: row.photo_url as string | undefined,
    peeps: row.peeps as string | undefined,
    stream: row.stream as string | undefined,
    interests: row.interests ? JSON.parse(row.interests as string) : undefined,
    position: {
      x: row.position_x as number,
      y: row.position_y as number,
    },
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

// Helper to convert database row to Link object
export function rowToLink(row: Record<string, unknown>): {
  id: string;
  sourceId: string;
  targetId: string;
  description: string;
  type: string;
  url?: string;
  createdAt: string;
  updatedAt: string;
} {
  return {
    id: row.id as string,
    sourceId: row.source_id as string,
    targetId: row.target_id as string,
    description: row.description as string,
    type: row.type as string,
    url: row.url as string | undefined,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}
