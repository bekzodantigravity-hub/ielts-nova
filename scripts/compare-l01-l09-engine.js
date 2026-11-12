const fs = require('fs');

const origL01 = fs.readFileSync('C:/Users/user/Downloads/AyuGram Desktop/Full Listening, Volume 5, Test 01 [safarov_english].html', 'utf8');
const origL09 = fs.readFileSync('C:/Users/user/Downloads/AyuGram Desktop/Full Listening, Volume 5, Test 09 [safarov_english].html', 'utf8');

const endL01 = origL01.indexOf('END OF AUTHORING AREA');
const endL09 = origL09.indexOf('END OF AUTHORING AREA');

const engine01 = origL01.substring(endL01);
const engine09 = origL09.substring(endL09);

console.log('engine01 len:', engine01.length, 'engine09 len:', engine09.length);
console.log('Is engine identical in origL01 and origL09?', engine01 === engine09);
if (engine01 !== engine09) {
  let i = 0;
  while (i < engine01.length && i < engine09.length && engine01[i] === engine09[i]) i++;
  console.log('Diff at:', i);
  console.log('e01:', JSON.stringify(engine01.substring(i, i + 100)));
  console.log('e09:', JSON.stringify(engine09.substring(i, i + 100)));
}
