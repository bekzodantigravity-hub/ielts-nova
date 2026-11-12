const fs = require('fs');

const orig = fs.readFileSync('C:/Users/user/Downloads/AyuGram Desktop/Full Reading, Volume 5, Test 10.html', 'utf8');
const mod = fs.readFileSync('public/tests/reading-v5-t10.html', 'utf8');

// Find differences by chunks
// Check where <style> ends in orig vs mod
const origStyleEnd = orig.indexOf('</style>');
const modStyleEnd = mod.indexOf('</style>');
console.log('Orig first style ends at:', origStyleEnd);
console.log('Mod first style ends at:', modStyleEnd);

// Does mod have second style?
const modSecondStyle = mod.indexOf('<style>', modStyleEnd + 1);
console.log('Mod second style starts at:', modSecondStyle);
const modSecondStyleEnd = mod.indexOf('</style>', modSecondStyle);
console.log('Mod second style ends at:', modSecondStyleEnd);

// Print the second style tag content
console.log('=== SECOND STYLE TAG (first 500 chars) ===');
console.log(mod.substring(modSecondStyle, modSecondStyle + 500));

// Check body in mod
const modBodyStart = mod.indexOf('<body');
const modBodyEnd = mod.indexOf('</body>');
console.log('Mod body start:', modBodyStart, 'end:', modBodyEnd);

// Check what is between body start and <div class="split-view"> or similar
console.log('=== MOD TOPBAR / BODY START (first 1000 chars) ===');
console.log(mod.substring(modBodyStart, modBodyStart + 1000));

// Check script tags in mod
const modLastScript = mod.lastIndexOf('<script');
console.log('=== MOD SCRIPT (last 1500 chars) ===');
console.log(mod.substring(mod.length - 1500));
