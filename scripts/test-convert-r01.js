const fs = require('fs');

const modR10 = fs.readFileSync('public/tests/reading-v5-t10.html', 'utf8');
const origR01 = fs.readFileSync('C:/Users/user/Downloads/AyuGram Desktop/Full Reading, Volume 5, Test 01.html', 'utf8');

// In origR01, extract authoring area
const startMarker = '<script>';
const endMarker = 'END OF AUTHORING AREA';

const origStart = origR01.indexOf(startMarker);
const origEnd = origR01.indexOf(endMarker);
const authoring01 = origR01.substring(origStart + startMarker.length, origEnd);

console.log('authoring01 length:', authoring01.length);
console.log('Preview of authoring01:', authoring01.substring(0, 300));

// In modR10, find authoring area
const modStart = modR10.lastIndexOf(startMarker); // Note: modR10 has <script src="/vendor/..."> in head, so lastIndexOf
const modEnd = modR10.indexOf(endMarker);

// Assemble new R01
let newR01 = modR10.substring(0, modStart + startMarker.length) +
  authoring01 +
  modR10.substring(modEnd);

// Replace metadata
newR01 = newR01.replace(/Full Reading — Volume 5, Test 10/g, 'Full Reading — Volume 5, Test 01');
newR01 = newR01.replace(/VOL 5 · TEST 10/g, 'VOL 5 · TEST 01');
newR01 = newR01.replace(/Reading · Vol\. 5 Test 10/g, 'Reading · Vol. 5 Test 01');
newR01 = newR01.replace(/const NOVA_TEST_ID = "reading-v5-t10";/, 'const NOVA_TEST_ID = "r-v5-t1";');

console.log('New R01 length:', newR01.length);
console.log('Contains Voynich Manuscript?', newR01.includes('Voynich Manuscript'));
console.log('Contains NOVA_TEST_ID?', newR01.includes('const NOVA_TEST_ID = "r-v5-t1";'));
