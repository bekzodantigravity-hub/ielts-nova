const fs = require("fs");
const path = require("path");
const vm = require("vm");

const AYUGRAM_DIR = "C:/Users/user/Downloads/AyuGram Desktop";
const OUT_L_DIR = "public/mocks/listening";
const OUT_R_DIR = "public/mocks/reading";

const tplL = fs.readFileSync(path.join(OUT_L_DIR, "l-v4-t1.html"), "utf8");
const tplR = fs.readFileSync(path.join(OUT_R_DIR, "r-v4-t1.html"), "utf8");

// Locate safe slice markers in Listening template (l-v4-t1.html)
const lConfigIdx = tplL.indexOf("const CONFIG");
const lNovaIdIdx = tplL.indexOf("const NOVA_TEST_ID");
const lNovaStartIdx = tplL.lastIndexOf("/*", lNovaIdIdx);
const lAnswersIdx = tplL.indexOf("const ANSWERS", lNovaIdIdx);
const lEoaIdx = tplL.lastIndexOf("END OF AUTHORING AREA");
const lEoaCommentStart = tplL.lastIndexOf("/*", lEoaIdx);

if (
  lConfigIdx === -1 ||
  lNovaStartIdx === -1 ||
  lAnswersIdx === -1 ||
  lEoaCommentStart === -1
) {
  throw new Error("Could not find expected markers in l-v4-t1.html template");
}

const lNovaBridge = tplL.slice(lNovaStartIdx, lAnswersIdx);

// Locate safe slice markers in Reading template (r-v4-t1.html)
const rHeadingsIdx = tplR.indexOf("const HEADINGS");
const rPassagesIdx = tplR.indexOf("const PASSAGES");
const rAuthStartIdx = Math.min(rHeadingsIdx, rPassagesIdx);
const rEoaIdx = tplR.lastIndexOf("END OF AUTHORING AREA");
const rEoaCommentStart = tplR.lastIndexOf("/*", rEoaIdx);

if (rHeadingsIdx === -1 || rPassagesIdx === -1 || rEoaCommentStart === -1) {
  throw new Error("Could not find expected markers in r-v4-t1.html template");
}

const LISTENING_SOURCES = [
  {
    id: "l-t21",
    num: 21,
    file: "Full CD IELTS Listening \u2013 test 07 [safarov_english].html",
  },
  {
    id: "l-t22",
    num: 22,
    file: "Full CD IELTS Listening \u2013 Test 09 [@safarov_english].html",
  },
  {
    id: "l-t23",
    num: 23,
    file: "Full CD IELTS Listening \u2013 Test 10 [@safarov_english].html",
  },
  {
    id: "l-t24",
    num: 24,
    file: "Full CD IELTS Listening \u2013 Test 11 [@safarov_english].html",
  },
  {
    id: "l-t25",
    num: 25,
    file: "Volume 5, Test 06 Listening Test [@safarov_english].html",
  },
  {
    id: "l-t26",
    num: 26,
    file: "CD IELTS LIstening \u2013 Volume 9, Test 2 [@safarov_english].html",
  },
];

const READING_SOURCES = [
  {
    id: "r-t21",
    num: 21,
    file: "Full CD IELTS Reading \u2013 test 07 [safarov_english].html",
  },
  {
    id: "r-t22",
    num: 22,
    file: "Full CD IELTS Reading \u2013 Test 09 [@safarov_english].html",
  },
  {
    id: "r-t23",
    num: 23,
    file: "Full CD IELTS Reading \u2013 Test 10 [@safarov_english].html",
  },
  {
    id: "r-t24",
    num: 24,
    file: "Full CD IELTS Reading  \u2013 Test 11 [@safarov_english].html",
  },
  {
    id: "r-t25",
    num: 25,
    file: "Volume 1, READING Test 01 [@safarov_english] .html",
  },
  {
    id: "r-t26",
    num: 26,
    file: "Volume 1, READING Test 02 [@safarov_english] .html",
  },
  {
    id: "r-t27",
    num: 27,
    file: "Volume 1, READING Test 03 [@safarov_english] .html",
  },
  {
    id: "r-t28",
    num: 28,
    file: "Volume 1, READING Test 05 [@safarov_english] .html",
  },
  {
    id: "r-t29",
    num: 29,
    file: "Volume 1, READING Test 06 [@safarov_english] .html",
  },
  {
    id: "r-t30",
    num: 30,
    file: "Volume 1, READING Test 07 [@safarov_english] .html",
  },
  {
    id: "r-t31",
    num: 31,
    file: "Volume 1, READING Test 08 [@safarov_english] .html",
  },
  {
    id: "r-t32",
    num: 32,
    file: "Volume 1, READING Test 09 [@safarov_english] .html",
  },
  {
    id: "r-t33",
    num: 33,
    file: "Volume 1, READING Test 10 [@safarov_english] .html",
  },
];

function validateInlineScripts(html, label) {
  const regex = /<script>([\s\S]*?)<\/script>/gi;
  let match;
  let idx = 0;
  while ((match = regex.exec(html)) !== null) {
    idx++;
    new vm.Script(match[1], { filename: `${label}-script-${idx}.js` });
  }
}

console.log("=== CONVERTING LISTENING (21..26) ===");
for (const item of LISTENING_SOURCES) {
  const srcPath = path.join(AYUGRAM_DIR, item.file);
  if (!fs.existsSync(srcPath)) {
    throw new Error(`Missing source file: ${srcPath}`);
  }
  const raw = fs.readFileSync(srcPath, "utf8");
  const rawConfigIdx = raw.indexOf("const CONFIG");
  const rawEoaIdx = raw.lastIndexOf("END OF AUTHORING AREA");
  const rawEoaCommentStart = raw.lastIndexOf("/*", rawEoaIdx);
  if (rawConfigIdx === -1 || rawEoaIdx === -1 || rawEoaCommentStart === -1) {
    throw new Error(`Markers not found in ${item.file}`);
  }

  const rawAuth = raw.slice(rawConfigIdx, rawEoaCommentStart);
  const bridge = lNovaBridge.replace(
    'const NOVA_TEST_ID = "l-v4-t1";',
    `const NOVA_TEST_ID = "${item.id}";`
  );

  let html =
    tplL.slice(0, lConfigIdx) +
    rawAuth +
    "\n" +
    bridge +
    "\n" +
    tplL.slice(lEoaCommentStart);

  html = html
    .replace(/Full Listening — Volume 4, Test 01/g, `Listening — Test ${item.num}`)
    .replace(/Full Listening \(Volume 4, Test 01\)/g, `Listening (Test ${item.num})`)
    .replace(/VOL 4 · TEST 01/g, `TEST ${item.num} · LISTENING`)
    .replace(/Listening · Vol\. 4 Test 01/g, `Listening · Test ${item.num}`);

  validateInlineScripts(html, item.id);
  const outPath = path.join(OUT_L_DIR, `${item.id}.html`);
  fs.writeFileSync(outPath, html, "utf8");
  console.log(`✓ ${item.id}: wrote ${outPath} (${html.length} bytes)`);
}

console.log("\n=== CONVERTING READING (21..33) ===");
for (const item of READING_SOURCES) {
  const srcPath = path.join(AYUGRAM_DIR, item.file);
  if (!fs.existsSync(srcPath)) {
    throw new Error(`Missing source file: ${srcPath}`);
  }
  const raw = fs.readFileSync(srcPath, "utf8");
  const rawHeadingsIdx = raw.indexOf("const HEADINGS");
  const rawPassagesIdx = raw.indexOf("const PASSAGES");
  const rawAuthStartIdx =
    rawHeadingsIdx !== -1 && rawHeadingsIdx < rawPassagesIdx
      ? rawHeadingsIdx
      : rawPassagesIdx;
  const rawEoaIdx = raw.lastIndexOf("END OF AUTHORING AREA");
  const rawEoaCommentStart = raw.lastIndexOf("/*", rawEoaIdx);
  if (rawPassagesIdx === -1 || rawEoaIdx === -1 || rawEoaCommentStart === -1) {
    throw new Error(`Markers not found in ${item.file}`);
  }

  const rawAuth = raw.slice(rawAuthStartIdx, rawEoaCommentStart);
  let html =
    tplR.slice(0, rAuthStartIdx) + rawAuth + "\n" + tplR.slice(rEoaCommentStart);

  html = html
    .replace('const NOVA_TEST_ID = "r-v4-t1";', `const NOVA_TEST_ID = "${item.id}";`)
    .replace(/Full Reading — Volume 4, Test 01/g, `Reading — Test ${item.num}`)
    .replace(/Academic Reading \(Volume 4, Test 01\)/g, `Reading (Test ${item.num})`)
    .replace(/VOL 4 · TEST 01/g, `TEST ${item.num} · READING`)
    .replace(/Academic Reading · Vol\. 4 Test 01/g, `Reading · Test ${item.num}`);

  validateInlineScripts(html, item.id);
  const outPath = path.join(OUT_R_DIR, `${item.id}.html`);
  fs.writeFileSync(outPath, html, "utf8");
  console.log(`✓ ${item.id}: wrote ${outPath} (${html.length} bytes)`);
}
