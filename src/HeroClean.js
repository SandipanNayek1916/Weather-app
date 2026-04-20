const React = { createElement: (tag, props, ...children) => ({ tag, props, children }) };
const el = React.createElement;

function HeroSection(props) {
  const weatherTheme = { theme: 'sunny' };
  const currentDay = { sunrise: [0], sunset: [0] };
  const daylightProgress = 0.5;

  return el(
    "section",
    { className: "hero-grid" },
    el("div", { className: "hero-copy-panel glass-card" },
      el("div", { className: "eyebrow" }, `Live forecast`),
      el("h1", null, "Atmospheric intelligence."),
      el("p", { className: "hero-copy" }, "Precise radar, air quality, and global tracking."),
      el("div", null, "Search"),
      el("div", { className: "hero-subsection" }, "Quick cities")
    ),
    el(
      "div",
      { className: "hero-side-column" },
      el(
        "div", // TiltWrapper dummy
        { className: "hero-tilt-wrap" },
        el(
          "article", // ScrollReveal dummy
          { className: `current-card` },
          el("div", null, "Current weather"),
          el("h2", null, "London"),
          el("p", null, "Updated now"),
          el("div", { className: "temperature-row" }, "20C"),
          el(
            "div",
            { className: "today-range" },
            el("div", null, "High"),
            el("div", null, "Low"),
            el("div", null, "Rain chance")
          )
        )
      )
    ),
    el(
      "div",
      { className: "hero-mini-grid" },
      el("div", { className: "gauge-tilt-wrap" }, "AQI"),
      el("div", { className: "gauge-tilt-wrap" }, "UV"),
      el("div", { className: "mini-panel-tilt-wrap" }, "Daylight"),
      el("div", { className: "mini-panel-tilt-wrap" }, "Outdoor score")
    )
  );
}
