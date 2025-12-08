import fs from "fs";
import path from "path";
import { connect } from "@lancedb/lancedb";
import { Tutor } from "../lib/types";
import { fileURLToPath } from "url";
import { OllamaEmbeddings } from "@langchain/ollama";
import {concatTextFeatures , normalizeAvailability , normalizeString  , normalizeNumber } from "@/lib/utils";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const embeddings = new OllamaEmbeddings({
  model: "nomic-embed-text",
  baseUrl: "http://localhost:11434",
});

const OUT_DIR = path.resolve(__dirname, "../dataset");
const TUTORS_FILE = path.join(OUT_DIR, "cleaned_tutors.json");



export async function build_tutor_index() {
  
  const tutors: Tutor[] = JSON.parse(
    fs.readFileSync(TUTORS_FILE, "utf8")
  );

  console.log(`Processing ${tutors.length} tutors...`);

  // prepare embedding texts
  const texts = tutors.map(concatTextFeatures);

  // Batch size tuned for CPU
  const BATCH_SIZE = 16;
  const records: any[] = [];

  const db = await connect(
    path.resolve(__dirname, "../vector_db")
  );

  for (let i = 0; i < texts.length; i += BATCH_SIZE) {
    const batchTexts = texts.slice(i, i + BATCH_SIZE);
    const batchTutors = tutors.slice(i, i + BATCH_SIZE);

    // Batched embeddings
    const vectors = await embeddings.embedDocuments(batchTexts);

    for (let j = 0; j < vectors.length; j++) {
      const tutor = batchTutors[j];
      records.push({
        vector: vectors[j],
        tutor_id: String(tutor.tutor_id),
        fullname: normalizeString(tutor.fullname),
        about: normalizeString(tutor.about),
        rate_per_hour: normalizeNumber(tutor.rate_per_hour),
        availability: normalizeAvailability(tutor.availability),
        rating: normalizeNumber(tutor.rating), // ← NOW SAFE
        session_preference: normalizeString(tutor.session_preference),
      });

    }

    console.log(
      ` Processed ${Math.min(i + BATCH_SIZE, tutors.length)}/${tutors.length}`
    );
  }


  await db.createTable("tutors", records, {
    mode: "overwrite",
  });

  console.log("LanceDB index built locally");
}

// Run
build_tutor_index().catch(err => {
  console.error("Error building LanceDB index:", err);
});
