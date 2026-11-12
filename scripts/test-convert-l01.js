const fs = require('fs');

const modL09 = fs.readFileSync('public/tests/listening-v5-t09.html', 'utf8');
const origL01 = fs.readFileSync('C:/Users/user/Downloads/AyuGram Desktop/Full Listening, Volume 5, Test 01 [safarov_english].html', 'utf8');

// In origL01, extract authoring area
const startMarker = '<script>';
const endMarker = 'END OF AUTHORING AREA';

const origStart = origL01.indexOf(startMarker);
const origEnd = origL01.indexOf(endMarker);
const authoring01 = origL01.substring(origStart + startMarker.length, origEnd);

console.log('authoring01 length:', authoring01.length);
console.log('Preview of authoring01:', authoring01.substring(0, 300));

// In modL09, find authoring area
const modStart = modL09.indexOf(startMarker);
const modEnd = modL09.indexOf(endMarker);

// Assemble new L01
let newL01 = modL09.substring(0, modStart + startMarker.length) +
  authoring01 +
  modL09.substring(modEnd);

// Replace metadata
newL01 = newL01.replace(/Full Listening — Volume 5, Test 09 \| IELTS Nova/g, 'Full Listening — Volume 5, Test 01 | IELTS Nova');
newL01 = newL01.replace(/VOL 5 · TEST 09/g, 'VOL 5 · TEST 01');
newL01 = newL01.replace(/Listening · Vol\. 5 Test 09/g, 'Listening · Vol. 5 Test 01');
newL01 = newL01.replace(/const NOVA_TEST_ID = "listening-v5-t09";/, 'const NOVA_TEST_ID = "l-v5-t1";');

// Check that it contains all essential things
console.log('New L01 length:', newL01.length);
console.log('Contains Campsites?', newL01.includes('Campsites'));
console.log('Contains NOVA_TEST_ID?', newL01.includes('const NOVA_TEST_ID = "l-v5-t1";'));
