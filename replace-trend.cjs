const fs = require('fs');

let c = fs.readFileSync('src/App.jsx', 'utf8');

c = c.replace(/function TrendSection\(props\) \{[\s\S]*?\n\}/m, `function TrendSection(props) {
  return h(Suspense, { fallback: h('div', { style: { height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#8b96a5' } }, 'Loading Interactive Charts...') },
    h(WeatherCharts, { hourly: props.hourly })
  );
}`);

fs.writeFileSync('src/App.jsx', c);
console.log('Done');
