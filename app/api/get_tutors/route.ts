import fs from "node:fs/promises";
import path from "node:path";
import type { Tutor } from "@/lib/types";

const TUTORS_FILE = path.join(process.cwd(), "dataset", "cleaned_tutors.json");

export async function GET(req: Request) {
  try {
    const idsParam = new URL(req.url).searchParams.get("ids");
    const ids = idsParam?.split(",").map(id => id.trim()).filter(Boolean);
    if (ids?.length === 0) return Response.json([]);

    const tutors: Tutor[] = JSON.parse(
      await fs.readFile(TUTORS_FILE, "utf8")
    );
    if (!ids) return Response.json(tutors);
    const requested = new Set(ids);
    return Response.json(tutors.filter(tutor => requested.has(String(tutor.tutor_id))));
  } catch (err) {
    console.error(err);
    return Response.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
