const fs = require('fs');

const r10 = fs.readFileSync('public/tests/reading-v5-t10.html', 'utf8');

// Find all occurrences of novaSync or nova in r10
const matches = [...r10.matchAll(/nova[A-Za-z0-9_]*/g)];
const unique = [...new Set(matches.map(m => m[0]))];
console.log('Nova identifiers in r10:', unique);

// Where are they called in the original code?
unique.forEach(name => {
  let pos = 0;
  const calls = [];
  while ((pos = r10.indexOf(name, pos)) !== -1) {
    if (pos < 128759) {
      calls.push(pos);
    }
    pos += name.length;
  }
  if (calls.length > 0) {
    console.log(`Called before bridge (${name}):`, calls.length, 'times');
    calls.forEach(p => {
      console.log('   snippet:', JSON.stringify(r10.substring(p - 40, p + 60)));
    });
  }
});
