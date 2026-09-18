const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const source = fs.readFileSync(
  path.join(__dirname, "..", "public", "js", "tool-modules", "utility-tool.js"),
  "utf8"
);

async function loadUtility() {
  const url = "data:text/javascript;charset=utf-8," + encodeURIComponent(source);
  return import(url);
}

(async () => {
  const { operations } = await loadUtility();
  assert.equal(typeof operations["color-contrast-checker"], "function");
  assert.equal(await operations["color-contrast-checker"]("#000000 #ffffff"), "21.00");

  assert.equal(operations["bmi-calculator"]("70 175"), "22.86");
  assert.throws(() => operations["bmi-calculator"]("70 0"), /Use weight kg and height cm/);

  assert.equal(operations["hex-to-rgb"]("#ff8800"), "rgb(255, 136, 0)");
  assert.equal(operations["rgb-to-hex"]("255 136 0"), "#ff8800");
  assert.equal(operations["percentage-change-calculator"]("100 125"), "25%");
  assert.equal(operations["ratio-calculator"]("20 30"), "2:3");
  assert.equal(operations["gcd-lcm-calculator"]("12 18"), "gcd: 6\\nlcm: 36");

  const random = operations["random-string-generator"]("32");
  assert.equal(random.length, 32);
  assert.match(random, /^[A-Za-z0-9]+$/);

  const password = operations["random-password-generator"]();
  assert.equal(password.length, 20);

  assert.equal(operations["remove-line-breaks"]("a\\n  b"), "a b");
  assert.equal(operations["reading-time-calculator"]("one two three"), "1 min (3 words)");

  console.log("Utility functional tests passed");
})().catch(error => {
  console.error(error);
  process.exit(1);
});
