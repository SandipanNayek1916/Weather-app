const fs = require('fs');
let c = fs.readFileSync('src/App.jsx', 'utf8');

const toolsRegex = /el\(\s*"div",\s*\{\s*className:\s*"topbar-tools"\s*\},/g;
const replaceTools = `el("div", { className: "topbar-tools" },
  user ? el("button", { className: "ghost-button ghost-button-strong topbar-toggle", onClick: logout }, "Sign Out (" + user.name + ")") : el("button", { className: "ghost-button topbar-toggle", onClick: () => setShowLoginModal(true) }, "Sign In"),
`;

c = c.replace(toolsRegex, replaceTools);

fs.writeFileSync('src/App.jsx', c);
console.log('Patched topbar-tools');
