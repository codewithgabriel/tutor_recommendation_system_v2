"use client";

import { useState, useEffect, useRef, type ChangeEvent } from "react";
import TutorCard from "../components/TutorCard";
import { Search, Calendar, DollarSign, BookOpen, User, CheckCircle } from "lucide-react";
import type { Student } from '@/lib/types';
import { loadTutorMatches, type TutorMatch } from '@/lib/loadTutorMatches';
import { normalizeAvailability } from '@/lib/utils';

// import { build_tutor_index } from "@/rec_system/build_tutor_index";


type SearchState =
  | { status: "idle" | "loading" | "error" }
  | { status: "complete"; matches: TutorMatch[] };

export default function Home() {
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState<string>("");
  const [search, setSearch] = useState<SearchState>({ status: "idle" });
  const request = useRef<AbortController | null>(null);
  const loading = search.status === "loading";

  const selectedStudent = students.find(s => s.student_id === selectedStudentId);

  function handleChange(ev: ChangeEvent<HTMLSelectElement>) {
    request.current?.abort();
    setSearch({ status: "idle" });
    setSelectedStudentId(ev.target.value);
  }

  function buildTutorIndex() {
    console.log("Building tutor index...");
    // build_tutor_index()
  }

  useEffect(() => {
    fetch("/api/get_students")
      .then(res => res.json())
      .then((data: Student[]) => {
        setStudents(data);
      })
      .catch(err => console.error("Failed to load students:", err));
    return () => request.current?.abort();
  }, []);

  const handleGetRecommendations = async () => {
    if (!selectedStudent) return;

    request.current?.abort();
    const controller = new AbortController();
    request.current = controller;
    setSearch({ status: "loading" });
    try {
      const matches = await loadTutorMatches(selectedStudent, controller.signal);
      if (!controller.signal.aborted) setSearch({ status: "complete", matches });
    } catch (error) {
      if (controller.signal.aborted) return;
      console.error("Could not load tutor matches", error);
      setSearch({ status: "error" });
    }
  };


  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <div className="max-w-5xl mx-auto px-6 py-12">
        {/* Header */}
        {/* <TestGemini /> */}
        <div className="flex items-center justify-between mb-12">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Tutor Recommendation System</h1>
            <p className="text-gray-600">Find the perfect tutor match for your learning journey</p>
          </div>
          <button
            onClick={buildTutorIndex}
            className="px-5 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium shadow-sm"
          >
            Build Index
          </button>
        </div>

        {/* Student Selection Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 mb-8">
          <label className="block text-lg font-semibold text-gray-900 mb-4">
            Select Student
          </label>
          <div className="relative">
            <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <select
              className="w-full pl-12 pr-4 py-3.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white text-gray-900 font-medium cursor-pointer"
              value={selectedStudentId}
              onChange={handleChange}
            >
              <option value="">Choose a student...</option>
              {students.map((s) => (
                <option key={s.student_id} value={s.student_id}>
                  {s.fullname}
                </option>
              ))}
            </select>
            <div className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2">
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
        </div>

        {/* Selected Student Details */}
        {selectedStudent && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 mb-8">

            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">{selectedStudent.fullname}</h2>
              <button
                onClick={handleGetRecommendations}
                disabled={loading}
                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-semibold shadow-md hover:shadow-lg"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Finding Tutors...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <Search className="w-5 h-5" />
                    Get Recommendations
                  </span>
                )}
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <div className="flex items-center gap-2 text-gray-500 text-sm font-medium mb-2">
                    <BookOpen className="w-4 h-4" />
                    Languages
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(selectedStudent.languages_with_levels).map(([lang, level]) => (
                      <span key={lang} className="px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg text-sm font-medium">
                        {lang} ({level})
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="flex items-center gap-2 text-gray-500 text-sm font-medium mb-2">
                    <CheckCircle className="w-4 h-4" />
                    Learning Goals
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {selectedStudent.learning_goals.map((goal, i) => (
                      <span key={i} className="px-3 py-1.5 bg-green-50 text-green-700 rounded-lg text-sm">
                        {goal}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="flex items-center gap-2 text-gray-500 text-sm font-medium mb-2">
                    <DollarSign className="w-4 h-4" />
                    Budget
                  </div>
                  <p className="text-gray-900 font-semibold">
                    ${selectedStudent.budget_min} - ${selectedStudent.budget_max} per hour
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <div className="text-gray-500 text-sm font-medium mb-2">Learning Style</div>
                  <p className="text-gray-900 font-medium">{selectedStudent.learning_style}</p>
                </div>

                <div>
                  <div className="text-gray-500 text-sm font-medium mb-2">Session Preference</div>
                  <p className="text-gray-900 font-medium">{selectedStudent.session_preference}</p>
                </div>

                <div>
                  <div className="flex items-center gap-2 text-gray-500 text-sm font-medium mb-2">
                    <Calendar className="w-4 h-4" />
                    Weekly Availability
                  </div>
                  <div className="space-y-1">
                    {/* {selectedStudent.availability.map((slot, i) => (
                      <div key={i} className="text-sm text-gray-700 bg-gray-50 px-3 py-2 rounded-lg">
                        {slot.start} to {slot.end}
                      </div>
                    ))} */}

                    {normalizeAvailability(selectedStudent.availability)?.split(";").map((date) => (
                      <div key={date} className="text-sm text-gray-700 bg-gray-50 px-3 py-2 rounded-lg">
                        {  date}
                      </div>

                    ))}

                   
                  </div>
                </div>
              </div>
            </div>

          </div>
        )}

        {/* Recommendations */}
        {search.status === "error" && (
          <p role="alert" className="mb-6 text-center text-red-700">
            We couldn’t load tutor recommendations. Select Get Recommendations to try again.
          </p>
        )}
        {search.status === "complete" && search.matches.length === 0 && (
          <p role="status" className="mb-6 text-center text-gray-700">
            No tutors matched {selectedStudent?.fullname}’s search.
          </p>
        )}
        {search.status === "complete" && search.matches.length > 0 && (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Recommended Tutors</h2>
            <div className="grid gap-6">
              {search.matches.map((tutor) => (
                <TutorCard
                  key={tutor.tutor_id}
                  tutor={tutor}
                />
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {!selectedStudent && (
          <div className="text-center py-16">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="w-10 h-10 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Select a Student to Begin</h3>
            <p className="text-gray-600">Choose a student from the dropdown to find their perfect tutor match</p>
          </div>
        )}
      </div>
    </div>
  );
}





// function TestGemini() {
//   useEffect(() => {
//     fetch("/api/gemini", { method: "POST" })
//       .then(res => res.json())
//       .then(data => console.log(data.text));
//   }, []);

//   return <div>Testing Gemini…</div>;
// }
