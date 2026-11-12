const fs = require('fs');
const path = 'C:/Users/user/Downloads/AyuGram Desktop';

console.log('--- Inspecting Listening Tests ---');
for (let i = 1; i <= 10; i++) {
  const pad = String(i).padStart(2, '0');
  const filename = `Full Listening, Volume 5, Test ${pad} [safarov_english].html`;
  const full = `${path}/${filename}`;
  if (fs.existsSync(full)) {
    const content = fs.readFileSync(full, 'utf8');
    const hasAuthoring = content.includes('AUTHORING AREA');
    const hasAudio = content.includes('audio:');
    const hasAnswers = content.includes('const ANSWERS =');
    console.log(`L${pad}: size=${content.length}, authoring=${hasAuthoring}, audio=${hasAudio}, answers=${hasAnswers}`);
  } else {
    console.log(`L${pad}: MISSING`);
  }
}

console.log('--- Inspecting Reading Tests ---');
for (let i = 1; i <= 10; i++) {
  const pad = String(i).padStart(2, '0');
  const filename = `Full Reading, Volume 5, Test ${pad}.html`;
  const full = `${path}/${filename}`;
  if (fs.existsSync(full)) {
    const content = fs.readFileSync(full, 'utf8');
    const hasAuthoring = content.includes('AUTHORING AREA');
    const hasPassages = content.includes('const PASSAGES =');
    const hasAnswers = content.includes('const ANSWERS =');
    console.log(`R${pad}: size=${content.length}, authoring=${hasAuthoring}, passages=${hasPassages}, answers=${hasAnswers}`);
  } else {
    console.log(`R${pad}: NOT FOUND IN AYUGRAM (will be generated)`);
  }
}
