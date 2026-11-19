import { expect, test, type Page } from "@playwright/test";
import { buildSync } from "esbuild";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { Student, Tutor } from "../../lib/types";

const here = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(here, "../..");

// Bundle the real client page (not a copy of its logic) so the test exercises
// the same student-switch and request-cancellation code the app ships.
const bundle = buildSync({
  stdin: {
    contents: `
      import React from "react";
      import { createRoot } from "react-dom/client";
      import Home from "./app/page";
      createRoot(document.getElementById("root")).render(React.createElement(Home));
    `,
    resolveDir: projectRoot,
    sourcefile: "browser-test-entry.tsx",
    loader: "tsx",
  },
  bundle: true,
  platform: "browser",
  format: "iife",
  jsx: "automatic",
  target: "es2022",
  write: false,
  define: { "process.env.NODE_ENV": '"development"' },
  alias: { "@": projectRoot },
});

const appJavascript = bundle.outputFiles[0].text;

async function serveApp(page: Page) {
  await page.route("http://localhost:3100/", (route) =>
    route.fulfill({
      contentType: "text/html; charset=utf-8",
      body: `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Tutor Recommendation System</title></head><body><div id="root"></div><script src="/app.js"></script></body></html>`,
    }),
  );
  await page.route("**/app.js", (route) =>
    route.fulfill({ contentType: "text/javascript; charset=utf-8", body: appJavascript }),
  );
}

const studentA: Student = {
  student_id: "student-a",
  fullname: "Student A",
  about: "",
  languages_with_levels: { English: "fluent" },
  learning_goals: ["Algebra"],
  learning_style: "visual",
  session_preference: "online",
  budget_min: 10,
  budget_max: 30,
  availability: [],
};

const studentB: Student = {
  student_id: "student-b",
  fullname: "Student B",
  about: "",
  languages_with_levels: { French: "fluent" },
  learning_goals: ["Geometry"],
  learning_style: "auditory",
  session_preference: "online",
  budget_min: 10,
  budget_max: 30,
  availability: [],
};

const tutorForA: Tutor = {
  tutor_id: "tutor-a",
  fullname: "Tutor For Student A",
  about: "",
  languages_with_levels: { English: "fluent" },
  teaching_specialities: ["Algebra"],
  rate_per_hour: 20,
  session_preference: "online",
  availability: [],
  learning_styles: ["visual"],
  learning_goals: ["Algebra"],
  rating: 5,
};

const tutorForB: Tutor = {
  tutor_id: "tutor-b",
  fullname: "Tutor For Student B",
  about: "",
  languages_with_levels: { French: "fluent" },
  teaching_specialities: ["Geometry"],
  rate_per_hour: 25,
  session_preference: "online",
  availability: [],
  learning_styles: ["auditory"],
  learning_goals: ["Geometry"],
  rating: 4,
};

declare global {
  interface Window {
    __tutorASeen: boolean;
    __releaseTutorAProfiles?: () => void;
  }
}

test.beforeEach(async ({ page }) => {
  // Catch a stale card even if a subsequent render immediately removes it.
  await page.addInitScript((name: string) => {
    window.__tutorASeen = false;
    const observer = new MutationObserver(() => {
      if (document.body?.innerText.includes(name)) window.__tutorASeen = true;
    });
    observer.observe(document, { childList: true, subtree: true, characterData: true });
  }, tutorForA.fullname);

  await serveApp(page);
  await page.route("**/api/get_students", route => route.fulfill({ json: [studentA, studentB] }));
  await page.route("**/api/recommend", route => {
    const { student } = route.request().postDataJSON() as { student: Student };
    const match = student.student_id === studentA.student_id
      ? { tutor_id: tutorForA.tutor_id, reason: "Matches Algebra" }
      : { tutor_id: tutorForB.tutor_id, reason: "Matches Geometry" };
    return route.fulfill({ json: [match] });
  });
  await page.route("**/api/get_tutors?*", route => {
    const ids = new URL(route.request().url()).searchParams.get("ids")?.split(",") ?? [];
    return route.fulfill({ json: [tutorForA, tutorForB].filter(tutor => ids.includes(tutor.tutor_id)) });
  });
});

async function searchFor(page: Page, student: Student) {
  await page.locator("select").selectOption(student.student_id);
  await page.getByRole("button", { name: "Get Recommendations" }).click();
}

async function expectOnlyStudentBTutor(page: Page) {
  await expect(page.getByRole("heading", { name: tutorForB.fullname })).toBeVisible();
  await expect(page.getByRole("heading", { name: tutorForA.fullname })).toHaveCount(0);
  expect(await page.evaluate(() => window.__tutorASeen)).toBe(false);
}

test("switching students cancels the pending recommendation request", async ({ page }) => {
  const started = Promise.withResolvers<void>();
  const release = Promise.withResolvers<void>();
  const handled = Promise.withResolvers<void>();

  await page.route("**/api/recommend", async route => {
    if (route.request().postDataJSON().student.student_id !== studentA.student_id) {
      return route.fallback();
    }
    started.resolve();
    await release.promise;
    try {
      await route.fulfill({ json: [{ tutor_id: tutorForA.tutor_id, reason: "Matches Algebra" }] });
    } finally {
      handled.resolve();
    }
  });

  await page.goto("/");
  await searchFor(page, studentA);
  await started.promise;
  const cancelled = page.waitForEvent("requestfailed", request =>
    new URL(request.url()).pathname === "/api/recommend" &&
    request.postDataJSON().student.student_id === studentA.student_id
  );

  try {
    await searchFor(page, studentB);
    await expectOnlyStudentBTutor(page);
  } finally {
    release.resolve();
  }
  const failedRequest = await cancelled;
  expect(failedRequest.failure()?.errorText).toContain("ERR_ABORTED");
  await handled.promise;
  await expectOnlyStudentBTutor(page);
});

test("a profile read that completes after a student switch cannot replace the new tutor", async ({ page }) => {
  // Finish reading A’s response *before* the switch. Aborting the request can
  // no longer undo it, so the page must also discard the late result.
  await page.addInitScript((tutorId: string) => {
    const readJson = Response.prototype.json;
    Response.prototype.json = async function () {
      const data = await readJson.call(this);
      const url = new URL(this.url);
      if (url.pathname === "/api/get_tutors" && url.searchParams.get("ids") === tutorId) {
        await new Promise<void>(resolve => { window.__releaseTutorAProfiles = resolve; });
      }
      return data;
    };
  }, tutorForA.tutor_id);

  await page.goto("/");
  await searchFor(page, studentA);
  await page.waitForFunction(() => typeof window.__releaseTutorAProfiles === "function");
  await searchFor(page, studentB);
  await expectOnlyStudentBTutor(page);

  await page.evaluate(async () => {
    window.__releaseTutorAProfiles!();
    // Let the released promise settle and React paint any resulting update.
    await new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
  });
  await expectOnlyStudentBTutor(page);
});
