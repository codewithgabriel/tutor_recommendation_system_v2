// "use client";

import { connect } from "@lancedb/lancedb";
import { OllamaEmbeddings } from "@langchain/ollama";
import { Ollama } from "@langchain/ollama";
import { TutorRecommendation } from "../lib/types";
import { concatTextFeatures, normalizeAvailability } from "@/lib/utils";
// import { HfInference } from "@huggingface/inference";
// const hf = new HfInference(process.env.HUGGINGFACE_API_TOKEN);
// const response = await hf.textGeneration({
//   model: "gpt2",
//   inputs: "Hello world",
// });
// console.log(response);

const base = process.env.APP_BASE_URL;

const embeddings = new OllamaEmbeddings({
  model: "nomic-embed-text",
  baseUrl: "http://localhost:11434",
});

const llm = new Ollama({
  model: "TinyLlama", // explanation only
  baseUrl: "http://localhost:11434",
});


const VECTOR_DB_DIR = "./vector_db";
const TABLE_NAME = "tutors";

function concatStudentFeatures(student: any): string {
  const parts: string[] = [];

  if (student.languages_with_levels) {
    for (const [lang, lvl] of Object.entries(student.languages_with_levels)) {
      parts.push(`${lang} ${lvl}`);
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

  if (student.about) {
    parts.push(`about ${student.about}`);
  }

  if (student.availability){ 
    parts.push(`availability ${normalizeAvailability(student.availability)}`)
  }
  return parts.join(" ");
}

export async function recommendTutorsForStudent(
  student: any,
  topK = 5
): Promise<TutorRecommendation[]> {
  const db = await connect(VECTOR_DB_DIR);
  const table = await db.openTable(TABLE_NAME);

  // building semantic query
  const queryText = concatStudentFeatures(student);
  const queryVector = await embeddings.embedQuery(queryText);

  // vector search + hard filters
  const tutors = await table
    .search(queryVector)
    .where(
      `rate_per_hour >= ${student.budget_min}
       AND rate_per_hour <= ${student.budget_max}
       AND session_preference = '${student.session_preference}'`
    )
    .limit(topK)
    .toArray();

  // generating explanations with LLaMA
  const recommendations: TutorRecommendation[] = [];

  for (const tutor of tutors) {
    console.log("generating prompt for " , tutor.fullname)
    
    const prompt = `
        You are a helpful assistant that explains tutor matches to students.

        Based on this student and tutor information, write a 3-sentence explanation for why this tutor is a good match.

        **STUDENT INFORMATION:**
        - Learning Goals: ${student.learning_goals?.join(", ")}
        - Preferred Learning Style: ${student.learning_style}
        - Wants: ${student.session_preference} sessions
        - Student is available at : ${student.availability}

        **TUTOR INFORMATION:**
        - Name: ${tutor.fullname}
        - Hourly Rate: $${tutor.rate_per_hour}
        - Rating: ${tutor.rating ? `${tutor.rating}/5` : 'No rating yet'}
        - Offers: ${tutor.session_preference} sessions
        - Key Availability: ${tutor.availability}

        **INSTRUCTION:**
        Write 3 short, friendly sentences explaining the match. Connect the student's goals and style to what the tutor offers. Mention rate and availability if they fit. Do not talk about how you found this match.

        **EXAMPLE OF GOOD OUTPUT (Follow this structure):**
        This tutor's expertise aligns well with your goal to learn conversational Spanish. Their available times on weekday evenings suit your schedule perfectly. At $25/hour with a 4.8 rating, they offer great value for personalized online lessons.

        **NOW CREATE THE EXPLANATION FOR THIS STUDENT AND TUTOR:**
        `.trim();

    // const reason = await llm.invoke(prompt);
    const res  =  await fetch(`${base}/api/gemini` , {
      method: "POST" ,
      headers: { "Content-Type": "application/json" }, 
      body: JSON.stringify({prompt: prompt})
    })

    const  {reason} : any  = await res.json()
    console.log("reason is" , reason)

    recommendations.push({
      tutor_id: tutor.tutor_id,
      reason: reason,
    });
  }

  return recommendations;
}

// getting student recommendation
// import fs from "fs";
// const students = JSON.parse(
//   fs.readFileSync("./dataset/cleaned_students.json", "utf8")
// );
// const student = students[0];
// const recs = await recommendTutorsForStudent(student);
// console.log(recs);
