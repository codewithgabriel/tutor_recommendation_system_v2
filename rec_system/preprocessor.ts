import fs from "fs";
import * as Papa from "papaparse";
import path from 'path';
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const TUTORS_CSV = path.resolve(__dirname, "../dataset/tutors_df_raw.csv");
const STUDENTS_CSV = path.resolve(__dirname, "../dataset/students_df_raw.csv");
const OUT_DIR = path.resolve(__dirname, "../dataset");

if (!fs.existsSync(OUT_DIR)) {
  fs.mkdirSync(OUT_DIR, { recursive: true });
}
import { Tutor , Student } from '@/lib/types';
import { parseLanguagesWithLevels  , parseListField  , parseAvailability} from '@/lib/utils';






function cleanTutorRow(row: any): Tutor {
  return {
    tutor_id: row.tutor_id || row.id || "",
    fullname: row.fullname || row.name || "",
    about: row.about || "",
    languages_with_levels: parseLanguagesWithLevels(row.languages_with_levels),
    teaching_specialities: parseListField(row.teaching_specialities),
    rate_per_hour: Number(row.rate_per_hour || row.rate || 0),
    session_preference: (row.session_preference || "both").toLowerCase(),
    availability: parseAvailability(row.availability),
    learning_styles: parseListField(row.learning_style || row.teaching_style),
    learning_goals: parseListField(row.learning_goals || row.subjects),
    rating: row.rating ? Number(row.rating) : null
  };
}

function cleanStudentRow(row: any): Student {
  return {
    student_id: row.student_id || row.id || "",
    fullname: row.fullname || row.name || "",
    about: row.about || "",
    languages_with_levels: parseLanguagesWithLevels(row.languages_with_levels),
    learning_goals: parseListField(row.learning_goals || row.goals),
    learning_style: (row.learning_style || "").toLowerCase(),
    session_preference: (row.session_preference || "online").toLowerCase(),
    budget_min: Number(row.budget_min || 0),
    budget_max: Number(row.budget_max || 9999),
    availability: parseAvailability(row.availability)
  };
}

// -----------------------------
// CSV Loader
// -----------------------------
function csvToJson(filePath: string): Promise<any[]> {
  const csv = fs.readFileSync(filePath, "utf8");

  return new Promise((resolve, reject) => {
    // console.log(Papa)
    Papa.default.parse(csv, {
      header: true,
      skipEmptyLines: true,
      complete: (results: Papa.ParseResult<any>) =>
        resolve(results.data),
      error: (err: any) => reject(err)
    });
  });
}

export async function preproces_tutors_and_students_data() {
  try {
    console.log("Reading CSV files...");

    const tutorsRaw = await csvToJson(TUTORS_CSV);
    console.log(tutorsRaw[0])

    const studentsRaw = await csvToJson(STUDENTS_CSV);

    

    console.log("Cleaning records...");
    const tutors = tutorsRaw.map(cleanTutorRow);
    console.log(tutors[0])

    const students = studentsRaw.map(cleanStudentRow);

    fs.writeFileSync(
      path.join(OUT_DIR, "cleaned_tutors.json"),
      JSON.stringify(tutors, null, 2)
    );

    fs.writeFileSync(
      path.join(OUT_DIR, "cleaned_students.json"),
      JSON.stringify(students, null, 2)
    );

    console.log("Wrote cleaned_tutors.json and cleaned_students.json");
  } catch (err) {
    console.error("Error:", err);
  }
};


preproces_tutors_and_students_data().catch(console.error )