const fs = require('fs');
const path = 'C:/Users/user/Downloads/AyuGram Desktop';

console.log('=== LISTENING TOPICS ===');
for (let i = 1; i <= 10; i++) {
  const pad = String(i).padStart(2, '0');
  const filename = `Full Listening, Volume 5, Test ${pad} [safarov_english].html`;
  const content = fs.readFileSync(`${path}/${filename}`, 'utf8');
  
  // Extract topics from PARTS
  const partsMatch = content.match(/const PARTS\s*=\s*(\[[\s\S]*?\]);\s*(?:const ANSWERS|function|\/\*)/);
  if (partsMatch) {
    try {
      const parts = eval(partsMatch[1]);
      const topics = parts.map(p => p.topic || p.label);
      console.log(`L${pad}:`, JSON.stringify(topics));
    } catch (e) {
      // regex fallback
      const topics = [...content.matchAll(/topic:\s*["']([^"']+)["']/g)].map(m => m[1]);
      console.log(`L${pad} (regex):`, JSON.stringify(topics));
    }
  }
}

console.log('=== READING TOPICS ===');
for (let i = 1; i <= 10; i++) {
  const pad = String(i).padStart(2, '0');
  const filename = `Full Reading, Volume 5, Test ${pad}.html`;
  const full = `${path}/${filename}`;
  if (fs.existsSync(full)) {
    const content = fs.readFileSync(full, 'utf8');
    const p1 = content.match(/1:\{title:["']([^"']+)["']/);
    const p2 = content.match(/2:\{title:["']([^"']+)["']/);
    const p3 = content.match(/3:\{title:["']([^"']+)["']/);
    console.log(`R${pad}:`, JSON.stringify([p1 ? p1[1] : '', p2 ? p2[1] : '', p3 ? p3[1] : '']));
  }
}
