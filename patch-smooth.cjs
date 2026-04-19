const fs = require('fs');

let c = fs.readFileSync('src/App.jsx', 'utf8');

c = c.replace(/useEffect\(function trackPointer\(\) \{[\s\S]*?\}, \[\]\);/m, `useEffect(function trackPointer() {
    function handleMove(event) {
      const x = event.clientX;
      const y = event.clientY;
      
      // Update DOM perfectly at screen refresh rate bypassing React
      document.documentElement.style.setProperty('--mouse-x', x + 'px');
      document.documentElement.style.setProperty('--mouse-y', y + 'px');
      document.documentElement.style.setProperty('--parallax-x', (((x / window.innerWidth) - 0.5) * 28) + 'px');
      document.documentElement.style.setProperty('--parallax-y', (((y / window.innerHeight) - 0.5) * 20) + 'px');

      setCursorState(state => {
        if (!state.visible) return { visible: true };
        return state;
      });

      if (!sparkleTimerRef.current) {
        const nextId = sparkleIdRef.current;
        sparkleIdRef.current += 1;
        setSparkles(function addSparkle(items) {
          return items.concat(createSparkle(nextId, x, y)).slice(-14);
        });
        sparkleTimerRef.current = window.setTimeout(function releaseSparkle() {
          sparkleTimerRef.current = null;
        }, 72);
      }
    }

    function handleLeave() {
      setCursorState(state => ({ visible: false }));
    }

    window.addEventListener("pointermove", handleMove);
    window.addEventListener("pointerleave", handleLeave);

    return function cleanup() {
      window.removeEventListener("pointermove", handleMove);
      window.removeEventListener("pointerleave", handleLeave);
      if (sparkleTimerRef.current) clearTimeout(sparkleTimerRef.current);
    };
  }, []);`);

c = c.replace(/function CursorEffects\(props\) \{[\s\S]*?\}\)/m, `function CursorEffects(props) {
  return el(
    "div",
    { className: "cursor-layer", "aria-hidden": "true" },
    el("div", {
      className: props.visible ? "cursor-core cursor-visible" : "cursor-core",
      style: { transform: "translate3d(var(--mouse-x), var(--mouse-y), 0)" }
    }),
    el("div", {
      className: props.visible ? "cursor-halo cursor-visible" : "cursor-halo",
      style: { transform: "translate3d(var(--mouse-x), var(--mouse-y), 0)" }
    }),
    props.sparkles.map(function mapSparkle(item) {
      return el("div", {
        key: item.id,
        className: "cursor-sparkle",
        style: {
          transform: \`translate3d(\$\{item.x\}px, \$\{item.y\}px, 0) scale(\$\{item.scale\})\`,
          opacity: 0,
        },
      });
    })
  );
}`);

c = c.replace(/pointer: cursorState\.visible[\s\S]*?: \{ x: 0, y: 0 \},/m, `pointer: cursorState.visible
        ? { x: 0, y: 0 } // Overridden by CSS vars in AmbientBackground now
        : { x: 0, y: 0 },`);

c = c.replace(/style: \{\n\s*"--cloud-speed": cloudDuration,\n\s*"--cloud-opacity": cloudOpacity,\n\s*"--stars-visibility": starVisibility,\n\s*"--pointer-x": \`\$\{props\.pointer\.x\}px\`,\n\s*"--pointer-y": \`\$\{props\.pointer\.y\}px\`,\n\s*\}/m, `style: {
        "--cloud-speed": cloudDuration,
        "--cloud-opacity": cloudOpacity,
        "--stars-visibility": starVisibility,
        "--pointer-x": "var(--parallax-x, 0px)",
        "--pointer-y": "var(--parallax-y, 0px)",
      }`);

fs.writeFileSync('src/App.jsx', c);
console.log('App patched');
