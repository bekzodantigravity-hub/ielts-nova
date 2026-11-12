const fs = require('fs');

const origL01 = fs.readFileSync('C:/Users/user/Downloads/AyuGram Desktop/Full Listening, Volume 5, Test 01 [safarov_english].html', 'utf8');

console.log('origL01 length:', origL01.length);
const scriptIdx = origL01.indexOf('<script>');
console.log('origL01 script starts at:', scriptIdx);
console.log(origL01.substring(scriptIdx, scriptIdx + 500));

const authoringIdx = origL01.indexOf('AUTHORING AREA');
console.log('authoringIdx in origL01:', authoringIdx);
