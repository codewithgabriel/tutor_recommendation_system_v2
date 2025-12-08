export interface LanguageLevels {
  [language: string]: string;
}

export interface TimeSlot {
  start: string;
  end: string;
}




export interface Tutor {
  tutor_id: string;
  fullname: string;
  about: string;
  languages_with_levels: Record<string, string>;
  teaching_specialities: string[];
  rate_per_hour: number;
  session_preference: string;
  availability: { start: string; end: string }[];
  learning_styles: string[];
  learning_goals: string[];
  rating: number | null;
}

export interface Availability {
  start: string;
  end: string;
}

export interface Student {
  student_id: string;
  fullname: string;
  about: string;
  languages_with_levels: Record<string, string>;
  learning_goals: string[];
  learning_style: string;
  session_preference: string;
  budget_min: number;
  budget_max: number;
  availability: Availability[];
}


export type TutorRecommendation = {
  tutor_id: string;
  // fullname: string;
  // rate_per_hour: number;
  // rating: number;
  // availability: string;
  // session_preference: string;
  reason: string;
};


