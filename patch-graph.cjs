const fs = require('fs');
let c = fs.readFileSync('src/App.jsx', 'utf8');

if (!c.includes("import { motion } from 'framer-motion';")) {
  c = c.replace(/import \{ LogOut \} from 'lucide-react';/, "import { LogOut, Star } from 'lucide-react';\nimport { motion } from 'framer-motion';");
}

const pathRegex = /el\("path", \{\n\s*d: chartGeom\.pathD,\n\s*className: "trend-line-path",\n\s*style: \{ stroke: config\.color \}\n\s*\}\)/g;
const replacePath = `el(motion.path, {
            d: chartGeom.pathD,
            className: "trend-line-path",
            style: { stroke: config.color },
            initial: { pathLength: 0 },
            whileInView: { pathLength: 1 },
            viewport: { once: true },
            transition: { duration: 2.5, ease: "easeOut" }
          })`;

c = c.replace(pathRegex, replacePath);

fs.writeFileSync('src/App.jsx', c);
console.log('Patched graph animations');
