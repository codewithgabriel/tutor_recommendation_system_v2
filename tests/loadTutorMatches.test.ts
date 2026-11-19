import assert from "node:assert/strict";
import test from "node:test";
import { loadTutorMatches } from "../lib/loadTutorMatches";
import type { Student } from "../lib/types";

const student: Student = {
  student_id: "s1",
  fullname: "Example Learner",
  about: "",
  languages_with_levels: { English: "fluent" },
  learning_goals: ["Algebra"],
  learning_style: "visual",
  session_preference: "online",
  budget_min: 10,
  budget_max: 30,
  availability: [],
};

test("zero recommendations return no tutors without requesting the catalogue", async (t) => {
  const signal = new AbortController().signal;
  const request = t.mock.method(globalThis, "fetch", async (input: RequestInfo | URL, init?: RequestInit) => {
    assert.equal(input, "/api/recommend");
    assert.equal(init?.method, "POST");
    assert.deepEqual(JSON.parse(String(init?.body)), { student });
    assert.equal(init?.signal, signal);
    return Response.json([]);
  });

  assert.deepEqual(await loadTutorMatches(student, signal), []);
  assert.equal(request.mock.callCount(), 1);
});

test("ranked matches retain their reasons when profiles arrive out of order or are missing", async (t) => {
  const signal = new AbortController().signal;
  const recommendations = [
    { tutor_id: "t2", reason: "Matches the weekly schedule" },
    { tutor_id: "missing", reason: "Unavailable profile" },
    { tutor_id: "t1", reason: "Teaches algebra" },
  ];
  const firstProfile = { tutor_id: "t1", fullname: "First Tutor", rate_per_hour: 20 };
  const secondProfile = { tutor_id: "t2", fullname: "Second Tutor", rate_per_hour: 25 };
  const request = t.mock.method(globalThis, "fetch", async (input: RequestInfo | URL, init?: RequestInit) => {
    if (input === "/api/recommend") return Response.json(recommendations);
    const lookup = new URL(String(input), "http://localhost");
    assert.equal(lookup.pathname, "/api/get_tutors");
    assert.equal(lookup.searchParams.get("ids"), "t2,missing,t1");
    assert.equal(init?.signal, signal);
    return Response.json([firstProfile, secondProfile]);
  });

  assert.deepEqual(await loadTutorMatches(student, signal), [
    { ...secondProfile, reason: recommendations[0].reason },
    { ...firstProfile, reason: recommendations[2].reason },
  ]);
  assert.equal(request.mock.callCount(), 2);
});

test("a recommendation service failure stops before profile lookup", async (t) => {
  const request = t.mock.method(globalThis, "fetch", async () => new Response(null, { status: 503 }));
  await assert.rejects(loadTutorMatches(student, new AbortController().signal), /Recommendation request failed \(503\)/);
  assert.equal(request.mock.callCount(), 1);
});

test("a profile service failure is reported separately from an empty result", async (t) => {
  const request = t.mock.method(globalThis, "fetch", async (input: RequestInfo | URL) => {
    if (input === "/api/recommend") return Response.json([{ tutor_id: "t1", reason: "Teaches algebra" }]);
    return new Response(null, { status: 502 });
  });
  await assert.rejects(loadTutorMatches(student, new AbortController().signal), /Tutor profile request failed \(502\)/);
  assert.equal(request.mock.callCount(), 2);
});
