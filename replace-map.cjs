const fs = require('fs');

let c = fs.readFileSync('src/App.jsx', 'utf8');

c = c.replace(/function MapSection\(props\) \{[\s\S]*?\n\}/m, `function MapSection(props) {
  return el(
    'section',
    { className: 'panel-section glass-card reveal-card', id: 'map-section' },
    h(Suspense, { fallback: h('div', { style: { height: '400px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#8b96a5' } }, 'Loading Geographic Radar...') },
      h(MapOverlay, { lat: props.location?.lat, lon: props.location?.lon, name: props.location?.name })
    )
  );
}`);

fs.writeFileSync('src/App.jsx', c);
console.log('Replaced MapSection natively!');
