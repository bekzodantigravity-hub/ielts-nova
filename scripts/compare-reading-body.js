const fs = require('fs');

const orig = fs.readFileSync('C:/Users/user/Downloads/AyuGram Desktop/Full Reading, Volume 5, Test 10.html', 'utf8');
const mod = fs.readFileSync('public/tests/reading-v5-t10.html', 'utf8');

const origBody = orig.substring(orig.indexOf('<body>'), orig.indexOf('<script>'));
const modBody = mod.substring(mod.indexOf('<body>'), mod.indexOf('<script>'));

console.log('origBody len:', origBody.length, 'modBody len:', modBody.length);

// Let's print the landing card differences
const origCard = origBody.substring(origBody.indexOf('<div class=\"card\">'), origBody.indexOf('</div>\n  <div class=\"type-row\">'));
const modCard = modBody.substring(modBody.indexOf('<div class=\"card\">'), modBody.indexOf('</div>\n  <div class=\"type-row\">'));

console.log('=== ORIG CARD ===\n', origCard);
console.log('=== MOD CARD ===\n', modCard);

// Let's check topbar
const origTb = origBody.substring(origBody.indexOf('<div class=\"topbar\">'), origBody.indexOf('<div class=\"topbar\">') + 500);
const modTb = modBody.substring(modBody.indexOf('<div class=\"topbar\">'), modBody.indexOf('<div class=\"topbar\">') + 500);

console.log('=== ORIG TOPBAR ===\n', origTb);
console.log('=== MOD TOPBAR ===\n', modTb);
