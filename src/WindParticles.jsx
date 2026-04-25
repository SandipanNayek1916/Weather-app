import { useEffect, useRef, memo } from 'react';

export default memo(function WindParticles({ speed = 10, direction = 90 }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: true });
    
    canvas.width = canvas.offsetWidth * (window.devicePixelRatio || 1);
    canvas.height = canvas.offsetHeight * (window.devicePixelRatio || 1);
    
    // Scale ctx to match pixel ratio
    ctx.scale(window.devicePixelRatio || 1, window.devicePixelRatio || 1);
    let cssW = canvas.offsetWidth;
    let cssH = canvas.offsetHeight;

    window.addEventListener('resize', () => {
      if (!canvas) return;
      canvas.width = canvas.offsetWidth * (window.devicePixelRatio || 1);
      canvas.height = canvas.offsetHeight * (window.devicePixelRatio || 1);
      ctx.scale(window.devicePixelRatio || 1, window.devicePixelRatio || 1);
      cssW = canvas.offsetWidth;
      cssH = canvas.offsetHeight;
    });

    // Degrees to radians (0 is North/Up, 90 is East/Right)
    // Wait, meteorological wind direction: 0 is wind from North blowing South (down), 90 is from East blowing West.
    // Our canvas math: 0 radians is East, PI/2 is South.
    // Map meteorological degree to radians: dir - 90 deg, then convert. If wind is from 90, it blows left (180 deg).
    const windRad = ((direction - 90) * Math.PI) / 180 + Math.PI;

    const particleCount = Math.min(Math.floor(speed * 3) + 20, 150);
    const speedRatio = Math.max(speed / 10, 0.5);

    const particles = [];
    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * cssW,
        y: Math.random() * cssH,
        length: Math.random() * 20 + 10 * speedRatio,
        speed: (Math.random() * 2 + 1) * speedRatio,
        opacity: Math.random() * 0.4 + 0.1,
      });
    }

    let animationFrameId;

    const render = () => {
      ctx.clearRect(0, 0, cssW, cssH);

      const vx = Math.cos(windRad);
      const vy = Math.sin(windRad);

      particles.forEach(p => {
        // Move particle
        p.x += vx * p.speed;
        p.y += vy * p.speed;

        // Wrap around bounds
        if (p.x < -p.length) p.x = cssW + p.length;
        if (p.x > cssW + p.length) p.x = -p.length;
        if (p.y < -p.length) p.y = cssH + p.length;
        if (p.y > cssH + p.length) p.y = -p.length;

        // Draw particle
        ctx.beginPath();
        const tailX = p.x - vx * p.length;
        const tailY = p.y - vy * p.length;
        
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(tailX, tailY);
        
        ctx.strokeStyle = `rgba(255, 255, 255, ${p.opacity})`;
        ctx.lineWidth = 1.5;
        ctx.lineCap = 'round';
        ctx.stroke();
      });

      animationFrameId = window.requestAnimationFrame(render);
    };

    render();

    return () => {
      window.cancelAnimationFrame(animationFrameId);
    };
  }, [speed, direction]);

  return (
    <canvas 
      ref={canvasRef} 
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 5,
        opacity: 0.8
      }}
    />
  );
});
