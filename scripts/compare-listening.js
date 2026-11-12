const fs = require('fs');

const origL09 = fs.readFileSync('C:/Users/user/Downloads/AyuGram Desktop/Full Listening, Volume 5, Test 09 [safarov_english].html', 'utf8');
const modL09 = fs.readFileSync('public/tests/listening-v5-t09.html', 'utf8');

console.log('origL09 length:', origL09.length, 'modL09 length:', modL09.length);

// Check styles in modL09
const styles = [...modL09.matchAll(/<style[\s\S]*?<\/style>/gi)];
console.log('modL09 style tags:', styles.length);

// Check scripts in modL09
const scripts = [...modL09.matchAll(/<script[\s\S]*?<\/script>/gi)];
console.log('modL09 script tags:', scripts.length);
scripts.forEach((s, idx) => {
  console.log('Script', idx, 'length:', s[0].length, 'preview:', s[0].substring(0, 80).replace(/\n/g, ' '));
});
