const test = require("node:test");
const assert = require("node:assert");
const QB = require("../webapp/model/queryBuilder.js");
global.window = {};
require("../webapp/localService/mockdata.js");
const rows = window.MOCK_SALES;

test("empty filters give empty $filter", () => assert.strictEqual(QB.buildFilter({}), ""));
test("combines filters with and", () =>
  assert.strictEqual(QB.buildFilter({ Region: "EMEA", Material: "M-100", minQuantity: "5" }),
    "Region eq 'EMEA' and Material eq 'M-100' and Quantity ge 5"));
test("quotes are escaped", () => assert.strictEqual(QB.buildFilter({ Material: "O'Neil" }), "Material eq 'O''Neil'"));
test("ignores non numeric min quantity", () => assert.strictEqual(QB.buildFilter({ minQuantity: "abc" }), ""));
test("zero min quantity is kept", () => assert.strictEqual(QB.buildFilter({ minQuantity: "0" }), "Quantity ge 0"));
test("buildQuery sets paging and count", () => {
  const p = new URLSearchParams(QB.buildQuery({ Region: "APAC" }, { top: 10, skip: 20 }));
  assert.strictEqual(p.get("$top"), "10");
  assert.strictEqual(p.get("$skip"), "20");
  assert.strictEqual(p.get("$count"), "true");
  assert.strictEqual(p.get("$filter"), "Region eq 'APAC'");
});
test("mock data has 270 rows", () => assert.strictEqual(rows.length, 270));
test("mock filter by region", () => {
  const r = QB.applyMock(rows, { Region: "EMEA" }, { top: 5, skip: 0 });
  assert.strictEqual(r.count, 90);
  assert.ok(r.value.every((x) => x.Region === "EMEA"));
  assert.strictEqual(r.value.length, 5);
});
test("mock sorted by net value desc", () => {
  const r = QB.applyMock(rows, {}, { top: 3, skip: 0 }).value;
  assert.ok(r[0].NetValue >= r[1].NetValue && r[1].NetValue >= r[2].NetValue);
});
test("mock paging skips", () => {
  const a = QB.applyMock(rows, {}, { top: 2, skip: 0 }).value;
  const b = QB.applyMock(rows, {}, { top: 2, skip: 2 }).value;
  assert.notDeepStrictEqual(a[0], b[0]);
});
test("summarize totals match", () => {
  const s = QB.summarize(rows);
  assert.strictEqual(s.rows, 270);
  assert.strictEqual(s.regions.length, 3);
  const sum = s.regions.reduce((a, r) => a + r.NetValue, 0);
  assert.ok(Math.abs(sum - s.netValue) < 0.05);
});
test("min quantity filter", () => {
  const r = QB.applyMock(rows, { minQuantity: "40" }, { top: 1000 });
  assert.ok(r.all.every((x) => x.Quantity >= 40) && r.count > 0);
});
