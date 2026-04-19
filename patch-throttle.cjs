const fs = require('fs');
let c = fs.readFileSync('src/App.jsx', 'utf8');

const regex = /useEffect\(function trackPointer\(\) \{[\s\S]*?\}, \[\]\);/m;

const replacement = `useEffect(function trackPointer() {
    let lastTime = 0;
    let ticking = false;

    function handleMove(event) {
      const x = event.clientX;
      const y = event.clientY;
      
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const now = Date.now();
          if (now - lastTime > 45) { // ~22fps instead of 120fps
            setCursorState({ x, y, visible: true });
            lastTime = now;
          }

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
          ticking = false;
        });
        ticking = true;
      }
    }

    function handleLeave() {
      setCursorState(function hideCursor(state) {
        return { x: state.x, y: state.y, visible: false };
      });
    }

    window.addEventListener("pointermove", handleMove);
    window.addEventListener("pointerleave", handleLeave);

    return function cleanup() {
      window.removeEventListener("pointermove", handleMove);
      window.removeEventListener("pointerleave", handleLeave);
      if (sparkleTimerRef.current) clearTimeout(sparkleTimerRef.current);
    };
  }, []);`;

c = c.replace(regex, replacement);
fs.writeFileSync('src/App.jsx', c);
console.log('Patched');
