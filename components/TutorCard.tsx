"use client";
import { Calendar, Star, DollarSign, BookOpen, CheckCircle } from "lucide-react";
import type { TutorMatch } from "@/lib/loadTutorMatches";
import { normalizeAvailability } from "@/lib/utils";


interface TutorCardProps {
  tutor: TutorMatch;
}

export default function TutorCard({ tutor }: TutorCardProps) {
  console.log("Now Rendering...TutorCard")
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-shadow duration-200">

      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">{tutor.fullname}</h2>

      </div>



      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        <div className="space-y-4">

          <div>
            <div className="flex items-center gap-2 text-gray-500 text-sm font-medium mb-2">
              <Star className="w-4 h-4" />
              {tutor.rating ?? 0}  Rating
            </div>

          </div>


          <div>
            <div className="flex items-center gap-2 text-gray-500 text-sm font-medium mb-2">
              <BookOpen className="w-4 h-4" />
              Languages
            </div>
            <div className="flex flex-wrap gap-2">
              {Object.entries(tutor.languages_with_levels).map(([lang, level]) => (
                <span key={lang} className="px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg text-sm font-medium">
                  {lang} ({level})
                </span>
              ))}
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2 text-gray-500 text-sm font-medium mb-2">
              <CheckCircle className="w-4 h-4" />
              Teaching Specialities
            </div>
            <div className="flex flex-wrap gap-2">
              {tutor.teaching_specialities.map((goal, i) => (
                <span key={i} className="px-3 py-1.5 bg-green-50 text-green-700 rounded-lg text-sm">
                  {goal}
                </span>
              ))}
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2 text-gray-500 text-sm font-medium mb-2">
              <DollarSign className="w-4 h-4" />
              Rate per hour ($)
            </div>
            <p className="text-gray-900 font-semibold">
              ${tutor.rate_per_hour}  per hour
            </p>
          </div>

        </div>

        <div className="space-y-4">
          <div>
            <div className="text-gray-500 text-sm font-medium mb-2">Learning Style</div>
            <p className="text-gray-900 font-medium">{tutor.learning_styles}</p>
          </div>

          <div>
            <div className="text-gray-500 text-sm font-medium mb-2">Session Preference</div>
            <p className="text-gray-900 font-medium">{tutor.session_preference}</p>
          </div>

          <div>
            <div className="flex items-center gap-2 text-gray-500 text-sm font-medium mb-2">
              <Calendar className="w-4 h-4" />
              Weekly Availability
            </div>
            <div className="space-y-1">
              {normalizeAvailability(tutor.availability)?.split(";").map((date) => (
                <div key={date} className="text-sm text-gray-700 bg-gray-50 px-3 py-2 rounded-lg">
                  {  date}
                </div>
                
              ))}

              {/* <div className="text-sm text-gray-700 bg-gray-50 px-3 py-2 rounded-lg">
                {normalizeAvailability(tutor.availability)}
              </div> */}
            </div>

          </div>
        </div>
      </div>




      <div className="pt-4 border-t border-gray-100">
        <p className="text-sm text-gray-600 leading-relaxed italic">{tutor.reason}</p>
      </div>
    </div>
  );
}
