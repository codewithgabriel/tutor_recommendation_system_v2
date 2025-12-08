import { NextResponse } from "next/server";
import fs from 'fs';
import { fileURLToPath } from "url";
import path from 'path';
import { Tutor } from "@/lib/types";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);



const OUT_DIR = path.resolve(__dirname, "../../../dataset");
const TUTORS_FILE = path.join(OUT_DIR, "cleaned_students.json");

export async function GET(req: Request) {
  try {
   const tutors: Tutor[] = JSON.parse(
       fs.readFileSync(TUTORS_FILE, "utf8")
     );
    return NextResponse.json(tutors)
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
