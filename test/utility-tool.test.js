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
  assert.equal(operations["gcd-lcm-calculator"]("12 18"), "gcd: 6\nlcm: 36");

  const random = operations["random-string-generator"]("32");
  assert.equal(random.length, 32);
  assert.match(random, /^[A-Za-z0-9]+$/);

  const password = operations["random-password-generator"]();
  assert.equal(password.length, 20);

  assert.equal(operations["remove-line-breaks"]("a\n  b"), "a b");
  assert.equal(operations["reading-time-calculator"]("one two three"), "1 min (3 words)");
  assert.equal(operations["json-stringify"]("{\"a\":1}"), "{\n  \"a\": 1\n}");
  assert.equal(operations["time-duration-calculator"]("23:30,01:15"), "1 hours 45 minutes 0 seconds");
  assert.match(operations["timezone-converter"]("2026-09-18T12:00:00Z Asia/Dhaka"), /2026/);
  assert.throws(() => operations["body-fat-calculator"]("30 35 170"), /waist must be greater/);


  const fixtures = [
    ["simple-interest-calculator","1000 10 2","200"],
    ["percentage-increase-calculator","100 10","110"],
    ["percentage-calculator","200 15","30"],
    ["sum-calculator","1 2 3","6"],
    ["factorial-calculator","5","120"],
    ["prime-checker","17","Prime"],
    ["even-odd-checker","8","Even"],
    ["decimal-to-binary","10","1010"],
    ["binary-to-decimal","1010","10"],
    ["decimal-to-hex","255","ff"],
    ["hex-to-decimal","ff","255"],
    ["celsius-to-fahrenheit","0","32°F"],
    ["fahrenheit-to-celsius","32","0°C"],
    ["kilometers-to-miles","1","0.621371"],
    ["miles-to-kilometers","1","1.60934"],
    ["kilograms-to-pounds","1","2.20462"],
    ["pounds-to-kilograms","1","0.453592"],
    ["meters-to-feet","1","3.28084"],
    ["feet-to-meters","1","0.3048"],
    ["days-to-hours","2","48"],
    ["hours-to-minutes","2","120"],
    ["minutes-to-seconds","2","120"],
  ];
  for (const [id,input,expected] of fixtures) {
    assert.equal(operations[id](input), expected, `fixture failed: ${id}`);
  }


  const textFixtures = [
    ["text-to-uppercase","hello world","HELLO WORLD"],
    ["text-to-lowercase","Hello WORLD","hello world"],
    ["text-reverser","abc","cba"],
    ["remove-extra-spaces","  hello   world  ","hello world"],
    ["remove-duplicate-lines","a\nb\na","a\nb"],
    ["line-counter","a\nb\nc","3"],
    ["sentence-counter","One. Two! Three?","3"],
    ["paragraph-counter","a\n\nb\n\n c","3"],
    ["whitespace-counter","a b\n","3"],
    ["text-to-slug","Hello World!","hello-world"],
    ["url-encoder","hello world","hello%20world"],
    ["url-decoder","hello%20world","hello world"],
    ["json-minifier","{\"a\": 1}","{\"a\":1}"],
    ["json-validator","{\"ok\":true}","Valid JSON"],
    ["number-base-converter","10","decimal: 10\nbinary: 1010\nhex: a"],
    ["days-to-hours","2","48"],
    ["hours-to-minutes","2","120"],
    ["minutes-to-seconds","2","120"]
  ];
  for (const [id,input,expected] of textFixtures) {
    assert.equal(operations[id](input), expected, `text fixture failed: ${id}`);
  }
  assert.equal(await operations["sha1-hash"]("abc"), "a9993e364706816aba3e25717850c26c9cd0d89d");
  assert.equal(await operations["sha512-hash"]("abc"), "ddaf35a193617abacc417349ae20413112e6fa4e89a97ea20a9eeee64b55d39a2192992a274fc1a836ba3c23a3feebbd454d4423643ce80e2a9ac94fa54ca49f");
  assert.equal(operations["json-to-csv"]("[{\"a\":1,\"b\":2}]"), "\"a\",\"b\"\n\"1\",\"2\"");
  assert.equal(operations["csv-to-json"]("a,b\n1,2"), "[\n  {\n    \"a\": \"1\",\n    \"b\": \"2\"\n  }\n]");


  assert.equal(operations["base64-encoder"]("বাংলা 🚀"), "4ZGN4Ka+4KaV4Kaf4KawIPCfmoA=");
  assert.equal(operations["base64-decoder"]("4ZGN4Ka+4KaV4Kaf4KawIPCfmoA="), "বাংলা 🚀");
  assert.equal(operations["title-case-converter"]("hello world"), "Hello World");

  console.log("Utility functional tests passed");
})().catch(error => {
  console.error(error);
  process.exit(1);
});
