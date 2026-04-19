const fs = require('fs');
let c = fs.readFileSync('src/App.jsx', 'utf8');

// Replace the array closing we added with a Fragment closing
c = c.replace(/    \),\n    <LoginModal key="login-modal" isOpen=\{showLoginModal\} onClose=\{\(\) => setShowLoginModal\(false\)\} \/>\n  \]\);\n}/, `    )\n      )}\n      <LoginModal key="login-modal" isOpen={showLoginModal} onClose={() => setShowLoginModal(false)} />\n    </React.Fragment>\n  );\n}`);

// Find the return el("div", and wrap it in Frag
let startReturn = c.indexOf('return el(\n    "div",\n    {\n      className: `app-shell');
if (startReturn !== -1) {
  let before = c.substring(0, startReturn);
  let after = c.substring(startReturn + "return ".length);
  c = before + "return (\n    <React.Fragment>\n      {" + after;
}

fs.writeFileSync('src/App.jsx', c);
console.log('Fixed React return block formatting');
