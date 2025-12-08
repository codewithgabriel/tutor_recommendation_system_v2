import fs from "fs";
import path from "path";
import { connect } from "@lancedb/lancedb";
import { fileURLToPath } from "url";
import { OllamaEmbeddings } from "@langchain/ollama";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// for embedding
const embeddings = new OllamaEmbeddings({
  model: "nomic-embed-text",
  baseUrl: "http://localhost:11434",
});

// path declaration
const DATA_DIR = path.resolve(__dirname, "../dataset");
const STUDENTS_FILE = path.join(DATA_DIR, "cleaned_students.json");
const VECTOR_DB_DIR = path.resolve(__dirname, "../vector_db");


// extract features and concatenate
function concatStudentFeatures(student: any): string {
  const parts: string[] = [];

  if (student.languages_with_levels) {
    for (const [lang, level] of Object.entries(student.languages_with_levels)) {
      parts.push(`${lang} ${level}`);
    }
  }

  if (Array.isArray(student.learning_goals)) {
    parts.push(...student.learning_goals);
  }

  if (student.learning_style) {
    parts.push(`learning style ${student.learning_style}`);
  }

  if (student.session_preference) {
    parts.push(`session ${student.session_preference}`);
  }

  return parts.join(" ");
}


// recommend tutors for all students
async function recommendTutors() {
  const students = JSON.parse(
    fs.readFileSync(STUDENTS_FILE, "utf8")
  );

  const db = await connect(VECTOR_DB_DIR);
  const table = await db.openTable("tutors");

  const TOP_K = 5;

  for (const student of students) {
    const queryText = concatStudentFeatures(student);
    const queryVector = await embeddings.embedQuery(queryText);

    // vector search + structured filters
    const results = await table
      .search(queryVector)
      .where(
        `rate_per_hour >= ${student.budget_min}
         AND rate_per_hour <= ${student.budget_max}
         AND session_preference = '${student.session_preference}'`
      )
      .limit(TOP_K)
      .toArray();

    console.log(`\n Student: ${student.fullname}`);
    console.log("Recommended tutors:");

    results.forEach((tutor: any, idx: number) => {
      console.log(
        `${idx + 1}. ${tutor.fullname} | $${tutor.rate_per_hour}/hr | rating: ${tutor.rating}`
      );
    });
  }
}

recommendTutors().catch(err => {
  console.error("Recommendation error:", err);
});
