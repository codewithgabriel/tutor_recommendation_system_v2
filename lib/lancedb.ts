import { connect } from "@lancedb/lancedb";
import path from "path";

let db: any;

export async function getDB() {
  if (!db) {
    db = await connect(path.resolve("./vector_db"));
  }
  return db;
}

export async function searchTutors(queryVector: number[], topK = 5) {
  const db = await getDB();
  const table = db.table("tutors");
  const results = await table.search(queryVector, { limit: topK });
  return results;
}
