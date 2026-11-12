const fs = require('fs');

const r01 = fs.readFileSync('C:/Users/user/Downloads/AyuGram Desktop/Full Reading, Volume 5, Test 01.html', 'utf8');

// Check structure: how are PASSAGES, QUESTIONS, ANSWERS defined in Reading files?
console.log('r01 length:', r01.length);
const scriptStart = r01.indexOf('<script>');
console.log('Script start:', scriptStart);
console.log(r01.substring(scriptStart, scriptStart + 1500));
