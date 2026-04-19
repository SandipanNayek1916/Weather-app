const fs = require('fs');
let c = fs.readFileSync('src/App.jsx', 'utf8');

c = c.replace('const [showLoginModal, setShowLoginModal] = useState(false);', `const [showLoginModal, setShowLoginModal] = useState(false);
  const [darkModeOverride, setDarkModeOverride] = useState(() => JSON.parse(localStorage.getItem('theme_dark')) || false);

  useEffect(() => {
    localStorage.setItem('theme_dark', JSON.stringify(darkModeOverride));
    if (darkModeOverride) {
      document.body.classList.add('dark-mode-override');
    } else {
      document.body.classList.remove('dark-mode-override');
    }
  }, [darkModeOverride]);
`);

const toolsRegex = /el\(\s*"div",\s*\{\s*className:\s*"topbar-tools"\s*\},/g;
const replaceTools = `el("div", { className: "topbar-tools" },
  el("button", { className: "ghost-button topbar-toggle", onClick: () => setDarkModeOverride(!darkModeOverride) }, darkModeOverride ? "☀ Light Mode" : "☾ Dark Mode"),
`;

c = c.replace(toolsRegex, replaceTools);

fs.writeFileSync('src/App.jsx', c);
console.log('Patched DarkMode');
