// app/api/gemini/route.ts
import { GoogleGenerativeAI } from "@google/generative-ai";

export async function POST(req: Request) {
  const apiKey = process.env.GEMINI_API_KEY;
  const  { prompt }  : any = await req.json();

  if (!apiKey) {
    return Response.json({ error: "Missing API key" }, { status: 500 });
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

  const result = await model.generateContent(prompt);
  const reason = result.response.text();
  console.log("result is: "  , reason)
  return Response.json({ reason  });
}
