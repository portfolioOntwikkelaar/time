/* Minimal, polished "exo-clock" logic
   - Planet day length adjustable
   - Smooth animation of dot ring showing day progress
   - Toggle between Earth time (unchecked) and Planet time (checked)
*/

const ring = document.getElementById('ring');
const timeDisplay = document.getElementById('timeDisplay');
const dateDisplay = document.getElementById('dateDisplay');
const modeToggle = document.getElementById('modeToggle');
const modeLabel = document.getElementById('modeLabel');
const dayLengthRange = document.getElementById('dayLength');
const timeScaleRange = document.getElementById('timeScale');
const planetNameInput = document.getElementById('planetInput');
const dayLengthLabel = document.getElementById('dayLengthLabel');
const scaleLabel = document.getElementById('scaleLabel');

let DOTS = 48;
const dots = [];
const ringSizePx = Math.min(window.innerWidth*0.6, 420);
const ringRadius = Math.round(ringSizePx / 2.2) + 'px';
ring.style.setProperty('--ring-radius', ringRadius);

// Settings state
const state = {
  dayHours: parseFloat(dayLengthRange.value), // hours per planet day
  timeScale: parseFloat(timeScaleRange.value), // visual acceleration factor
  planetName: planetNameInput.value || 'Kepler-62f',
  planetMode: true
};

// build dot elements
function buildDots() {
  ring.innerHTML = '';
  dots.length = 0;
  DOTS = 48; // fixed density for minimalistic look
  for (let i = 0; i < DOTS; i++) {
    const d = document.createElement('span');
    d.className = 'dot';
    d.style.setProperty('--theta', `${(i / DOTS) * 360}deg`);
    d.dataset.idx = i;
    ring.appendChild(d);
    dots.push(d);
  }
}
buildDots();

// helpers
function pad(n) { return n.toString().padStart(2,'0'); }

function getPlanetTime(now = new Date()) {
  // Earth seconds since UTC midnight
  const utc = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), now.getUTCHours(), now.getUTCMinutes(), now.getUTCSeconds(), now.getUTCMilliseconds());
  // convert to seconds
  const earthSec = utc / 1000;
  // Define planet day length in seconds
  const planetDaySec = state.dayHours * 3600;
  // We'll map earth epoch seconds to planetary time by scaling factor
  // So that 1 earth second = timeScale planetary seconds
  const scale = state.timeScale;
  const planetSeconds = (earthSec * scale) % planetDaySec;
  // compute hour/min/sec
  const h = Math.floor(planetSeconds / 3600);
  const m = Math.floor((planetSeconds % 3600) / 60);
  const s = Math.floor(planetSeconds % 60);
  // day number (count of full planet days since epoch)
  const dayNumber = Math.floor((earthSec * scale) / planetDaySec);
  // year estimate: 400 days per planet-year (arbitrary, portfolio-fiction)
  const year = Math.floor(dayNumber / 400);
  const dayOfYear = dayNumber % 400;
  // fractional progress 0..1
  const progress = (planetSeconds / planetDaySec);
  return { h, m, s, dayNumber, year, dayOfYear, progress };
}

// animate ring: highlight dots up to progress
function renderRing(progress) {
  const active = Math.round(progress * DOTS);
  for (let i = 0; i < DOTS; i++) {
    const d = dots[i];
    const dist = (i <= active) ? (active - i) : (DOTS - i + active);
    const on = (i <= active);
    d.style.opacity = on ? 1 - Math.min(dist*0.04, 0.6) : 0.12;
    // slight scale for recently passed dots for motion illusion
    const scale = on ? 1 + Math.max(0, (1 - dist*0.12)) * 0.18 : 1;
    d.style.transform = `rotate(${(i / DOTS) * 360}deg) translateX(${ringRadius}) translateY(-50%) scale(${scale})`;
    // color shift toward accent near "noon"
    const hueShift = Math.sin((progress * Math.PI * 2) - (i / DOTS)*0.4);
    d.style.filter = `hue-rotate(${hueShift * 10}deg)`;
    d.style.boxShadow = on ? `0 8px 18px rgba(11,18,24,0.45), 0 0 12px rgba(107,231,255,0.09)` : '';
  }
}

// update loop
function tick() {
  const now = new Date();
  // choose mode
  if (!state.planetMode) {
    // Earth time: standard
    const hrs = now.getHours();
    const mins = now.getMinutes();
    const secs = now.getSeconds();
    timeDisplay.textContent = `${pad(hrs)}:${pad(mins)}:${pad(secs)}`;
    const progress = (hrs*3600 + mins*60 + secs) / (24*3600);
    renderRing(progress);
    dateDisplay.textContent = now.toDateString();
  } else {
    // Planet time
    const p = getPlanetTime(now);
    timeDisplay.textContent = `${pad(p.h)}:${pad(p.m)}:${pad(p.s)}`;
    dateDisplay.textContent = `Day ${p.dayOfYear} · Year ${p.year}`;
    renderRing(p.progress);
  }
  requestAnimationFrame(tick);
}
requestAnimationFrame(tick);

// DOM interactions
modeToggle.addEventListener('change', (e) => {
  state.planetMode = e.target.checked;
  modeLabel.textContent = state.planetMode ? 'Planet time' : 'Earth time';
});

dayLengthRange.addEventListener('input', (e) => {
  state.dayHours = parseFloat(e.target.value);
  dayLengthLabel.textContent = `${state.dayHours}h`;
});

timeScaleRange.addEventListener('input', (e) => {
  state.timeScale = parseFloat(e.target.value);
  scaleLabel.textContent = `×${state.timeScale.toFixed(2)}`;
});

planetNameInput.addEventListener('input', (e) => {
  state.planetName = e.target.value || 'Kepler-62f';
  document.getElementById('planetName').textContent = state.planetName;
});

// initial labels
dayLengthLabel.textContent = `${state.dayHours}h`;
scaleLabel.textContent = `×${state.timeScale.toFixed(2)}`;
document.getElementById('planetName').textContent = state.planetName;
modeToggle.checked = true; // default planet time
modeLabel.textContent = 'Planet time';
