const fs = require('fs');

const l09 = fs.readFileSync('public/tests/listening-v5-t09.html', 'utf8');

const l09Idx = l09.indexOf('NOVA_TEST_ID');
console.log('l09 script from index 2000 to end:');
console.log(l09.substring(l09Idx + 2000));
