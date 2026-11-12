const fs = require('fs');
const mockPath = 'C:/Users/user/Downloads/AyuGram Desktop/Full MockI - week 3 - @Xojaevs.html';
const content = fs.readFileSync(mockPath, 'utf8');

const idx = content.indexOf('function showResults');
console.log(content.slice(idx, idx + 1800));
