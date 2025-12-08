import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { Tutor } from "@/lib/types";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const OUT_DIR = path.resolve(__dirname, "../../../dataset");
const TUTORS_FILE = path.join(OUT_DIR, "cleaned_tutors.json");

export async function GET(req: Request) {
  try {
    const tutors: Tutor[] = JSON.parse(
      fs.readFileSync(TUTORS_FILE, "utf8")
    );

    const { searchParams } = new URL(req.url);
    const idsParam = searchParams.get("ids");

    if (!idsParam) {
      // return all tutors
      return NextResponse.json(tutors);
    }

    const ids = idsParam.split(",");

    const filtered = tutors.filter(t =>
      ids.includes(String(t.tutor_id))
    );

    return NextResponse.json(filtered);
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
