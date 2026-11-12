const fs = require('fs');

const origR01 = fs.readFileSync('C:/Users/user/Downloads/AyuGram Desktop/Full Reading, Volume 5, Test 01.html', 'utf8');
const origR10 = fs.readFileSync('C:/Users/user/Downloads/AyuGram Desktop/Full Reading, Volume 5, Test 10.html', 'utf8');

// In Reading files, where does the authoring block start and end?
// In R01:
console.log('R01 contains AUTHORING AREA?', origR01.includes('AUTHORING AREA'));
console.log('R10 contains AUTHORING AREA?', origR10.includes('AUTHORING AREA'));

// Where does the engine start in Reading files?
// Let's search for functions in reading files like `function setType` or `const S =` or `function renderNav`
const r01EngineIdx = origR01.indexOf('const S =');
const r10EngineIdx = origR10.indexOf('const S =');
console.log('r01 S= at:', r01EngineIdx, 'r10 S= at:', r10EngineIdx);

const engineR01 = origR01.substring(r01EngineIdx);
const engineR10 = origR10.substring(r10EngineIdx);

console.log('engineR01 len:', engineR01.length, 'engineR10 len:', engineR10.length);
console.log('Are engines identical in R01 and R10?', engineR01 === engineR10);
if (engineR01 !== engineR10) {
  let i = 0;
  while (i < engineR01.length && i < engineR10.length && engineR01[i] === engineR10[i]) i++;
  console.log('Diff at:', i);
  console.log('e01:', JSON.stringify(engineR01.substring(i, i + 100)));
  console.log('e10:', JSON.stringify(engineR10.substring(i, i + 100)));
}
