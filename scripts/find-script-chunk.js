const fs = require('fs');

const r10 = fs.readFileSync('public/tests/reading-v5-t10.html', 'utf8');
const l09 = fs.readFileSync('public/tests/listening-v5-t09.html', 'utf8');

const r10Idx = r10.indexOf('NOVA_TEST_ID');
console.log('r10 NOVA_TEST_ID at index:', r10Idx);
// Let's find previous comment or line
const r10Before = r10.lastIndexOf('/*', r10Idx);
console.log('r10 comment starts at:', r10Before);
console.log(r10.substring(r10Before, r10Idx + 200));

const l09Idx = l09.indexOf('NOVA_TEST_ID');
const l09Before = l09.lastIndexOf('/*', l09Idx);
console.log('l09 NOVA_TEST_ID at index:', l09Idx);
console.log(l09.substring(l09Before, l09Idx + 200));
