"use client";

import { GoogleGenerativeAI } from "@google/generative-ai";

const  { GEMINI_API_KEY } = process.env;
console.log(GEMINI_API_KEY) // this is undefined

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY!);

const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

const result = await model.generateContent("Say hello in one sentence.");
console.log(result.response.text());
