import { NextResponse } from "next/server";
import { recommendTutorsForStudent } from "@/rec_system/recommend_tutor_for_student";
export const runtime = "nodejs";


export async function POST(req: Request) {
  try {
    const { student } = await req.json();
    if (!student) return NextResponse.json({ error: "Missing student" }, { status: 400 });

    const recommendations = await recommendTutorsForStudent(student, 3);

    return NextResponse.json(recommendations);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}