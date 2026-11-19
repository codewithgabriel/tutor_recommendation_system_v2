import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { GET } from "../app/api/get_tutors/route.ts";

function lookup(query = "") {
  return GET(new Request(`http://localhost/api/get_tutors${query}`));
}

test("an explicitly empty ID list never reads the tutor catalogue", async (t) => {
  const read = t.mock.method(fs, "readFile", async () => "[]");
  for (const query of ["?ids=", "?ids=%20", "?ids=,%20,"]) {
    const response = await lookup(query);
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), []);
  }
  assert.equal(read.mock.callCount(), 0);
});

test("the catalogue and filtered lookups retain their distinct behaviour", async (t) => {
  const tutors = [{ tutor_id: "t1" }, { tutor_id: "t2" }, { tutor_id: "t3" }];
  t.mock.method(fs, "readFile", async (file, encoding) => {
    assert.equal(file, path.join(process.cwd(), "dataset", "cleaned_tutors.json"));
    assert.equal(encoding, "utf8");
    return JSON.stringify(tutors);
  });
  const cases = [
    ["", tutors],
    ["?ids=t3,%20t1,,t1", [tutors[0], tutors[2]]],
    ["?ids=missing", []],
  ];
  for (const [query, expected] of cases) {
    const response = await lookup(query);
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), expected);
  }
});

test("a missing catalogue remains a server error for a real lookup", async (t) => {
  t.mock.method(fs, "readFile", async () => { throw new Error("Missing file"); });
  t.mock.method(console, "error", () => {});
  const response = await lookup("?ids=t1");
  assert.equal(response.status, 500);
  assert.deepEqual(await response.json(), { error: "Internal server error" });
});
