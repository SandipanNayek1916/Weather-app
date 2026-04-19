import React from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div style={{ background: 'rgba(0,0,0,0.8)', padding: '12px', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: 'white' }}>
        <p style={{ margin: '0 0 8px 0', color: '#8b96a5' }}>{label}</p>
        <p style={{ margin: 0, fontWeight: 'bold' }}>
          Temp: {payload[0].value}°C
        </p>
        <p style={{ margin: 0, color: '#3b82f6' }}>
          Rain: {payload[1].value}%
        </p>
      </div>
    );
  }
  return null;
};

export default function WeatherCharts({ hourly }) {
  if (!hourly) return null;

  // Format Recharts data (next 24 hours only)
  const data = hourly.time.slice(0, 24).map((time, index) => ({
    time: new Date(time).toLocaleTimeString([], { hour: 'numeric' }),
    temp: hourly.temperature_2m[index],
    rain: hourly.precipitation_probability[index]
  }));

  return (
    <div style={{ width: '100%', height: '300px', margin: '32px 0' }}>
      <h3 style={{ color: 'var(--text-faint, #8b96a5)', marginBottom: '16px', fontSize: '14px', textTransform: 'uppercase', letterSpacing: '1px' }}>24-Hour Trends</h3>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="colorTemp" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="var(--accent-color, #eab308)" stopOpacity={0.8}/>
              <stop offset="95%" stopColor="var(--accent-color, #eab308)" stopOpacity={0}/>
            </linearGradient>
            <linearGradient id="colorRain" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <XAxis dataKey="time" stroke="var(--text-faint)" tick={{ fill: 'var(--text-faint)', fontSize: 12 }} axisLine={false} tickLine={false} />
          <YAxis yAxisId="left" stroke="var(--text-faint)" tick={{ fill: 'var(--text-faint)', fontSize: 12 }} axisLine={false} tickLine={false} />
          <YAxis yAxisId="right" orientation="right" hide />
          <Tooltip content={<CustomTooltip />} />
          <Area yAxisId="left" type="monotone" dataKey="temp" stroke="var(--accent-color, #eab308)" strokeWidth={3} fillOpacity={1} fill="url(#colorTemp)" />
          <Area yAxisId="right" type="monotone" dataKey="rain" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorRain)" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
