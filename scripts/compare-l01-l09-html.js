const fs = require('fs');

const origL01 = fs.readFileSync('C:/Users/user/Downloads/AyuGram Desktop/Full Listening, Volume 5, Test 01 [safarov_english].html', 'utf8');
const origL09 = fs.readFileSync('C:/Users/user/Downloads/AyuGram Desktop/Full Listening, Volume 5, Test 09 [safarov_english].html', 'utf8');

const html01 = origL01.substring(0, origL01.indexOf('<script>'));
const html09 = origL09.substring(0, origL09.indexOf('<script>'));

console.log('html01 len:', html01.length, 'html09 len:', html09.length);
console.log('Is HTML identical before script?', html01 === html09);
if (html01 !== html09) {
  let i = 0;
  while (i < html01.length && i < html09.length && html01[i] === html09[i]) i++;
  console.log('Diff at:', i);
  console.log('h01:', JSON.stringify(html01.substring(i, i + 100)));
  console.log('h09:', JSON.stringify(html09.substring(i, i + 100)));
}
