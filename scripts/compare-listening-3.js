const fs = require('fs');

const origL09 = fs.readFileSync('C:/Users/user/Downloads/AyuGram Desktop/Full Listening, Volume 5, Test 09 [safarov_english].html', 'utf8');
const modL09 = fs.readFileSync('public/tests/listening-v5-t09.html', 'utf8');

// Find differences in head
console.log('--- Head Title ---');
const origTitle = origL09.match(/<title>[\s\S]*?<\/title>/)[0];
const modTitle = modL09.match(/<title>[\s\S]*?<\/title>/)[0];
console.log('origTitle:', origTitle);
console.log('modTitle:', modTitle);

// Check if jspdf was added or changed
console.log('Orig jspdf:', origL09.includes('jspdf'));
console.log('Mod jspdf:', modL09.includes('/vendor/jspdf.umd.min.js'));

// Check card top in modL09
const cardTop = modL09.substring(modL09.indexOf('<div class="card">'), modL09.indexOf('<div class="card">') + 600);
console.log('--- modL09 Card Top ---\n', cardTop);

// Check tb in modL09
const tb = modL09.substring(modL09.indexOf('class="tb-left"'), modL09.indexOf('class="tb-left"') + 400);
console.log('--- modL09 tb-left ---\n', tb);

// Check results screen exit in modL09
const resBtn = modL09.substring(modL09.indexOf('novaExit'), modL09.indexOf('novaExit') + 200);
console.log('--- modL09 novaExit calls ---');
let p = 0;
while((p = modL09.indexOf('novaExit', p)) !== -1) {
  console.log(p, JSON.stringify(modL09.substring(p - 30, p + 50)));
  p += 8;
}
