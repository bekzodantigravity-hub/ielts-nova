const fs = require('fs');

const orig = fs.readFileSync('C:/Users/user/Downloads/AyuGram Desktop/Full Reading, Volume 5, Test 10.html', 'utf8');
const mod = fs.readFileSync('public/tests/reading-v5-t10.html', 'utf8');

// Find all differences outside the end of the file
console.log('Orig total len:', orig.length, 'Mod total len:', mod.length);

// 1. Title
console.log('Orig title:', orig.match(/<title>[\s\S]*?<\/title>/)[0]);
console.log('Mod title:', mod.match(/<title>[\s\S]*?<\/title>/)[0]);

// 2. Extra style
const modStyleMatch = mod.match(/<style>\s*\/\* =+\s*IELTS NOVA[\s\S]*?<\/style>/);
console.log('Nova style length:', modStyleMatch ? modStyleMatch[0].length : 'none');

// 3. Card top
const cardIdxOrig = orig.indexOf('<div class=\"card\">');
const cardIdxMod = mod.indexOf('<div class=\"card\">');
console.log('Orig card snippet:', JSON.stringify(orig.substring(cardIdxOrig, cardIdxOrig + 150)));
console.log('Mod card snippet:', JSON.stringify(mod.substring(cardIdxMod, cardIdxMod + 250)));

// 4. Any other HTML body changes?
// Let's compare the HTML part (between </style> and <script>)
const origHtml = orig.substring(orig.indexOf('</style>') + 8, orig.indexOf('<script>'));
const modHtml = mod.substring(mod.indexOf('</style>', mod.indexOf('IELTS NOVA')) + 8, mod.indexOf('<script src=\"/vendor/jspdf.umd.min.js\">'));

console.log('origHtml len:', origHtml.length, 'modHtml len:', modHtml.length);
