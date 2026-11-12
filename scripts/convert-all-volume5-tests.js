const fs = require('fs');
const path = require('path');

const AYUGRAM_DIR = 'C:/Users/user/Downloads/AyuGram Desktop';
const MOCKS_LISTENING_DIR = 'public/mocks/listening';
const MOCKS_READING_DIR = 'public/mocks/reading';
const TESTS_DIR = 'public/tests';

[MOCKS_LISTENING_DIR, MOCKS_READING_DIR, TESTS_DIR].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Templates
const templateListening = fs.readFileSync('public/tests/listening-v5-t09.html', 'utf8');
const templateReading = fs.readFileSync('public/tests/reading-v5-t10.html', 'utf8');

console.log('=== 1. PROCESSING LISTENING TESTS (1 to 10) ===');

const startMarkerL = '<script>';
const endMarkerL = 'END OF AUTHORING AREA';

for (let i = 1; i <= 10; i++) {
  const pad = String(i).padStart(2, '0');
  const sourceName = `Full Listening, Volume 5, Test ${pad} [safarov_english].html`;
  const sourcePath = path.join(AYUGRAM_DIR, sourceName);
  
  if (!fs.existsSync(sourcePath)) {
    console.error(`ERROR: Source not found: ${sourcePath}`);
    continue;
  }
  
  const origContent = fs.readFileSync(sourcePath, 'utf8');
  const origStart = origContent.indexOf(startMarkerL);
  const origEnd = origContent.indexOf(endMarkerL);
  if (origStart === -1 || origEnd === -1) {
    console.error(`ERROR: Could not locate authoring area in ${sourceName}`);
    continue;
  }
  const authoring = origContent.substring(origStart + startMarkerL.length, origEnd);
  
  const modStart = templateListening.indexOf(startMarkerL);
  const modEnd = templateListening.indexOf(endMarkerL);
  
  let converted = templateListening.substring(0, modStart + startMarkerL.length) +
    authoring +
    templateListening.substring(modEnd);
    
  // Metadata replacements
  converted = converted.replace(/Full Listening — Volume 5, Test \d+/g, `Full Listening — Volume 5, Test ${pad}`);
  converted = converted.replace(/VOL 5 · TEST \d+/g, `VOL 5 · TEST ${pad}`);
  converted = converted.replace(/Listening · Vol\. 5 Test \d+/g, `Listening · Vol. 5 Test ${pad}`);
  converted = converted.replace(/const NOVA_TEST_ID = "[^"]+";/, `const NOVA_TEST_ID = "l-v5-t${i}";`);
  
  // Write to both standard requested path and aliases
  const dest1 = path.join(MOCKS_LISTENING_DIR, sourceName);
  const dest2 = path.join(MOCKS_LISTENING_DIR, `Full Listening, Volume 5, Test ${pad}.html`);
  const dest3 = path.join(TESTS_DIR, `listening-v5-t${pad}.html`);
  const dest4 = path.join(TESTS_DIR, `l-v5-t${i}.html`);
  
  fs.writeFileSync(dest1, converted, 'utf8');
  fs.writeFileSync(dest2, converted, 'utf8');
  fs.writeFileSync(dest3, converted, 'utf8');
  fs.writeFileSync(dest4, converted, 'utf8');
  
  console.log(`✓ Listening Test ${pad}: Saved ${converted.length} bytes (l-v5-t${i})`);
}

console.log('\n=== 2. PROCESSING READING TESTS (1 to 10) ===');

const startMarkerR = '<script>';
const endMarkerR = 'END OF AUTHORING AREA';

for (let i = 1; i <= 10; i++) {
  const pad = String(i).padStart(2, '0');
  const sourceName = `Full Reading, Volume 5, Test ${pad}.html`;
  const sourcePath = path.join(AYUGRAM_DIR, sourceName);
  
  let authoring = '';
  if (i === 9) {
    console.log(`Generating Reading Test 09 from curated Cambridge curriculum...`);
    authoring = fs.readFileSync('scripts/r09-authoring-data.js', 'utf8');
  } else {
    if (!fs.existsSync(sourcePath)) {
      console.error(`ERROR: Source not found: ${sourcePath}`);
      continue;
    }
    const origContent = fs.readFileSync(sourcePath, 'utf8');
    const origStart = origContent.indexOf(startMarkerR);
    const origEnd = origContent.indexOf(endMarkerR);
    if (origStart === -1 || origEnd === -1) {
      console.error(`ERROR: Could not locate authoring area in ${sourceName}`);
      continue;
    }
    authoring = origContent.substring(origStart + startMarkerR.length, origEnd);
  }
  
  const modStart = templateReading.lastIndexOf(startMarkerR);
  const modEnd = templateReading.indexOf(endMarkerR);
  
  let converted = templateReading.substring(0, modStart + startMarkerR.length) +
    authoring +
    templateReading.substring(modEnd);
    
  // Metadata replacements
  converted = converted.replace(/Full Reading — Volume 5, Test \d+/g, `Full Reading — Volume 5, Test ${pad}`);
  converted = converted.replace(/VOL 5 · TEST \d+/g, `VOL 5 · TEST ${pad}`);
  converted = converted.replace(/Reading · Vol\. 5 Test \d+/g, `Reading · Vol. 5 Test ${pad}`);
  converted = converted.replace(/const NOVA_TEST_ID = "[^"]+";/, `const NOVA_TEST_ID = "r-v5-t${i}";`);
  
  const dest1 = path.join(MOCKS_READING_DIR, sourceName);
  const dest2 = path.join(TESTS_DIR, `reading-v5-t${pad}.html`);
  const dest3 = path.join(TESTS_DIR, `r-v5-t${i}.html`);
  
  fs.writeFileSync(dest1, converted, 'utf8');
  fs.writeFileSync(dest2, converted, 'utf8');
  fs.writeFileSync(dest3, converted, 'utf8');
  
  console.log(`✓ Reading Test ${pad}: Saved ${converted.length} bytes (r-v5-t${i})`);
}

console.log('\n=== SUMMARY OF GENERATED FILES ===');
console.log('mocks/listening:', fs.readdirSync(MOCKS_LISTENING_DIR).length, 'files');
console.log('mocks/reading:', fs.readdirSync(MOCKS_READING_DIR).length, 'files');
console.log('tests/ total:', fs.readdirSync(TESTS_DIR).length, 'files');
