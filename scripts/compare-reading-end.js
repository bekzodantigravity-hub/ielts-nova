const fs = require('fs');

const origR01 = fs.readFileSync('C:/Users/user/Downloads/AyuGram Desktop/Full Reading, Volume 5, Test 01.html', 'utf8');
const origR10 = fs.readFileSync('C:/Users/user/Downloads/AyuGram Desktop/Full Reading, Volume 5, Test 10.html', 'utf8');

const endArea01 = origR01.indexOf('END OF AUTHORING AREA');
const endArea10 = origR10.indexOf('END OF AUTHORING AREA');
console.log('endArea01:', endArea01, 'endArea10:', endArea10);

if (endArea01 !== -1 && endArea10 !== -1) {
  const after01 = origR01.substring(endArea01);
  const after10 = origR10.substring(endArea10);
  console.log('after01 len:', after01.length, 'after10 len:', after10.length);
  console.log('Are engines after authoring area identical?', after01 === after10);
  if (after01 !== after10) {
    let i = 0;
    while (i < after01.length && i < after10.length && after01[i] === after10[i]) i++;
    console.log('Diff at:', i);
    console.log('a01:', JSON.stringify(after01.substring(i, i + 100)));
    console.log('a10:', JSON.stringify(after10.substring(i, i + 100)));
  }
} else {
  // Let's check how authoring area ends in Reading
  console.log('Searching for ANSWERS in R01 and R10');
  const ans01 = origR01.indexOf('const ANSWERS =');
  const ans10 = origR10.indexOf('const ANSWERS =');
  console.log('ans01:', ans01, 'ans10:', ans10);
}
