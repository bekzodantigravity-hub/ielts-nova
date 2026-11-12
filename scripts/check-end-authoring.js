const fs = require('fs');

const modL09 = fs.readFileSync('public/tests/listening-v5-t09.html', 'utf8');

const endAuthoring = modL09.indexOf('END OF AUTHORING AREA');
console.log('endAuthoring in modL09 at:', endAuthoring);
console.log(modL09.substring(endAuthoring - 100, endAuthoring + 600));
