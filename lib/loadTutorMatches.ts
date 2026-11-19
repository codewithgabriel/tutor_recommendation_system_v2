import type { Student, Tutor, TutorRecommendation } from "./types";

export type TutorMatch = Tutor & Pick<TutorRecommendation, "reason">;

export async function loadTutorMatches(student: Student, signal: AbortSignal): Promise<TutorMatch[]> {
  const response = await fetch("/api/recommend", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ student }),
    signal,
  });
  if (!response.ok) throw new Error(`Recommendation request failed (${response.status})`);

  const recommendations: TutorRecommendation[] = await response.json();
  if (recommendations.length === 0) return [];

  const query = new URLSearchParams({ ids: recommendations.map(rec => rec.tutor_id).join(",") });
  const details = await fetch(`/api/get_tutors?${query}`, { signal });
  if (!details.ok) throw new Error(`Tutor profile request failed (${details.status})`);

  const tutors: Tutor[] = await details.json();
  const byId = new Map(tutors.map(tutor => [tutor.tutor_id, tutor]));
  return recommendations.flatMap(({ tutor_id, reason }) => {
    const tutor = byId.get(tutor_id);
    return tutor ? [{ ...tutor, reason }] : [];
  });
}
