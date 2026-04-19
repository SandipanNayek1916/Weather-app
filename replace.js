const fs = require('fs');
let c = fs.readFileSync('app.js', 'utf8');

c = c.replace(/el\(\s*"section",\s*\{\s*className:\s*"([^"]*reveal-card[^"]*)"/g, 'el(ScrollReveal, { as: "section", className: "$1"');

c = c.replace(/el\(\s*"article",\s*\{\s*(key:\s*[^,]+,\s*)?className:\s*"([^"]*reveal-card[^"]*)"/g, 'el(ScrollReveal, { as: "article", $1className: "$2"');

c = c.replace(/el\(\s*"div",\s*\{\s*className:\s*"([^"]*reveal-card[^"]*)"/g, 'el(ScrollReveal, { as: "div", className: "$1"');

fs.writeFileSync('app.js', c);
console.log("Done");
