// ============================================================
// PORTFOLIO CONTENT — DE + EN
// ============================================================

// ---- AGE CALCULATION ----

const BIRTHDAY = new Date(2003, 5, 25); // 25. Juni 2003 (Monate 0-basiert)

export function getAge() {
  const today = new Date();
  let age = today.getFullYear() - BIRTHDAY.getFullYear();
  const m = today.getMonth() - BIRTHDAY.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < BIRTHDAY.getDate())) {
    age--;
  }
  return age;
}

// ---- WELCOME ----

const LOGO = [
  { text: '' },
  { text: ' ██╗     ██╗   ██╗██╗███████╗', color: 'green' },
  { text: ' ██║     ██║   ██║██║██╔════╝', color: 'green' },
  { text: ' ██║     ██║   ██║██║███████╗', color: 'green' },
  { text: ' ██║     ██║   ██║██║╚════██║', color: 'green' },
  { text: ' ███████╗╚██████╔╝██║███████║', color: 'green' },
  { text: ' ╚══════╝ ╚═════╝ ╚═╝╚══════╝', color: 'green' },
  { text: '' },
  { text: '' },
];

export const WELCOME_MESSAGE = {
  de: [
    ...LOGO,
    { text: 'Hi, ich bin Luis.', color: 'text' },
    { text: 'IT-Supporter im Job, App-Bastler nach Feierabend.', color: 'text' },
    { text: '' },
    { text: 'Kein Terminal-Fan? Kein Problem — klick einfach', color: 'dim' },
    { text: "unten auf einen Button. Oder tippe 'help'.", color: 'dim' },
    { text: '' },
  ],
  en: [
    ...LOGO,
    { text: "Hi, I'm Luis.", color: 'text' },
    { text: 'IT support by day, app tinkerer by night.', color: 'text' },
    { text: '' },
    { text: 'Not a terminal person? No worries — just click', color: 'dim' },
    { text: "a button below. Or type 'help'.", color: 'dim' },
    { text: '' },
  ],
};

// ---- CANDLESTICK CHART + BITCOIN COIN (decorative, for the about section) ----

// Chart data: a deterministic random walk with a slight upward drift.
// Made-up data, just for the look.
const CHART_CANDLES = 14;
const CHART_HEIGHT = 12;
const CHART_WIDTH = CHART_CANDLES * 2;
// Candles appear one by one, this many ms apart
const CHART_INTRO_STEP_MS = 90;
export const CHART_INTRO_MS = CHART_CANDLES * CHART_INTRO_STEP_MS;

// Small seeded PRNG (mulberry32), so every visitor sees the same chart
let chartSeed = 7;
function chartRandom() {
  chartSeed = (chartSeed + 0x6d2b79f5) | 0;
  let t = Math.imul(chartSeed ^ (chartSeed >>> 15), 1 | chartSeed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

// [open, high, low, close], generated lazily
const chartSeries = [];
function candleAt(i) {
  while (chartSeries.length <= i) {
    const open = chartSeries.length ? chartSeries[chartSeries.length - 1][3] : 100;
    const close = open + (chartRandom() - 0.4) * 8;
    const high = Math.max(open, close) + chartRandom() * 3;
    const low = Math.min(open, close) - chartRandom() * 3;
    chartSeries.push([open, high, low, close]);
  }
  return chartSeries[i];
}

// Chart rows (as colored segments) `elapsed` ms into the build-up animation
export function getChartFrame(elapsed) {
  const count = Math.min(CHART_CANDLES, Math.floor(elapsed / CHART_INTRO_STEP_MS) + 1);
  const candles = Array.from({ length: count }, (_, i) => candleAt(i));

  const max = Math.max(...candles.map((c) => c[1]));
  const min = Math.min(...candles.map((c) => c[2]));
  const toRow = (v) => Math.round(((max - v) / (max - min || 1)) * (CHART_HEIGHT - 1));

  return Array.from({ length: CHART_HEIGHT }, (_, r) => {
    const segments = [];
    const push = (text, color) => {
      const last = segments[segments.length - 1];
      if (last && last.color === color) last.text += text;
      else segments.push({ text, color });
    };
    candles.forEach(([open, high, low, close]) => {
      const color = close >= open ? 'green' : 'red';
      if (r >= toRow(Math.max(open, close)) && r <= toRow(Math.min(open, close))) push('█', color);
      else if (r >= toRow(high) && r <= toRow(low)) push('│', color);
      else push(' ', 'dim');
      push(' ', 'dim');
    });
    push(' '.repeat(CHART_WIDTH - candles.length * 2), 'dim');
    return segments;
  });
}

const COIN = [
  "     .-~~~-.     ",
  "   .'  | |  '.   ",
  '  /  ███████  \\  ',
  ' |   ██    ██  | ',
  ' |   ███████   | ',
  ' |   ██    ██  | ',
  '  \\  ███████  /  ',
  "   '.  | |  .'   ",
  "     '-~~~-'     ",
];
const COIN_WIDTH = COIN[0].length;
// Chart row at which the coin starts
const COIN_OFFSET = 2;

// Squeeze the coin horizontally to fake a 3D rotation (scale 1 = front, 0 = edge-on)
function squashCoin(scale) {
  const c = (COIN_WIDTH - 1) / 2;
  return COIN.map((row) => {
    const left = row.search(/\S/);
    const right = row.trimEnd().length - 1;
    const newLeft = Math.round(c - (c - left) * scale);
    const newRight = Math.round(c + (right - c) * scale);
    const out = Array(COIN_WIDTH).fill(' ');
    for (let x = newLeft + 1; x < newRight; x++) {
      const src = Math.round(c + (x - c) / scale);
      if (src > left && src < right) out[x] = row[src];
    }
    if (newLeft === newRight) {
      out[newLeft] = row[left] === '.' || row[left] === "'" ? row[left] : '│';
    } else {
      out[newLeft] = row[left];
      out[newRight] = row[right];
    }
    return out.join('');
  });
}

// One full spin; frame 0 is the front side
const COIN_SPIN_STEPS = 16;
export const COIN_FRAME_MS = 90;
export const COIN_FRAMES = Array.from({ length: COIN_SPIN_STEPS }, (_, i) =>
  squashCoin(Math.abs(Math.cos((i / COIN_SPIN_STEPS) * 2 * Math.PI)))
);

function buildCandleChart() {
  const rows = [];
  for (let r = 0; r < CHART_HEIGHT; r++) {
    const segments = [{ text: '  ', color: 'dim' }, { text: ' '.repeat(CHART_WIDTH), chartRow: r }];
    const coinRow = r - COIN_OFFSET;
    if (coinRow >= 0 && coinRow < COIN.length) {
      segments.push({ text: '  ', color: 'dim' }, { text: COIN[coinRow], color: 'yellow', coinRow });
    }
    rows.push({ segments });
  }
  rows.push({ text: '  └' + '─'.repeat(CHART_WIDTH), color: 'dim' });
  return rows;
}

const CANDLE_CHART = buildCandleChart();

// ---- ABOUT ----

const ABOUT_ART = `
⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⡿⠿⠿⣿⣿⡿⣿⣿⡿⠿⠿⣿⣽⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿
⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⡿⠛⠉⠁⠀⠀⠀⠙⠄⠀⠀⠀⠀⠀⠀⣏⣀⠁⠐⠻⢿⠛⢿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿
⣿⣿⣿⣿⣿⣿⣿⣿⣟⣁⣀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠁⡏⠀⢀⠈⠠⠀⠀⠓⠍⠙⠛⢿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿
⣿⣿⣿⣟⡻⠟⠋⡽⢋⠁⢠⠄⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢣⠀⠀⠈⠀⠁⡄⠀⠀⠀⠀⠀⠉⠙⠿⢿⣿⣿⣿⣿⣿⣿
⡿⠛⠯⠉⠀⠀⠀⠉⠀⠀⠀⠀⡠⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢀⡀⠀⠀⠀⠀⠀⢠⣀⣀⣀⣾⣿⣿⣿⣿⣿
⠀⠀⠀⠀⠀⠀⠀⠀⠀⢀⠐⠉⠀⠀⠀⠀⠠⢠⡄⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢠⠏⠀⠀⠀⠈⠉⠋⠛⠙⢍⣻⣿⣿⣿⣿⣿
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠈⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣀⠀⢄⠒⠸⠞⣷⠀⡈⡹⣿⢿⣿⣿
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠤⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠲⣾⡆⠘⣿⡄⠃⢤⢄⣿⠖⠁⠀⡹⣤⣿⣿
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢀⣋⣳⣶⣀⡀⢬⢀⣀⣀⣤⣄⠐⠚⠉⠉⠉⢻⣿
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣼⣿⣘⣿⣿⣿⣿⣿⣿⣿⣿⣿⡆⠀⡀⠀⠀⢸⣿
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣠⣴⣤⡀⡀⣀⣤⣶⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣧⣠⣿⡄⠀⠀⢿
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢰⣾⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣧⠀⠀⢈
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢾⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⡿⠿⠿⠿⠿⠿⠛⠿⢿⣿⣿⣿⣿⣿⣿⣿⡇⠂⣾
⡀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠉⠻⣿⣿⣿⣿⣿⣿⣿⣏⠀⠀⠀⣀⣀⣀⣤⣤⣤⣴⣿⣿⣿⣿⣿⣿⣧⡘⣾⣿
⣿⡆⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠈⠙⣿⣿⣿⣿⣿⣿⣿⠿⠛⠛⠿⠿⢿⣿⣿⣿⣿⣿⣿⣿⡟⡿⠿⠟⢹⣿
⣮⡠⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣿⣿⣿⣿⣿⣿⠁⠀⠀⠀⠀⠈⣙⠲⢭⣻⣿⣿⣿⣿⣿⠁⢘⠀⣾⣿
⣟⡡⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢹⣿⣿⣿⣿⣿⡀⠀⠀⠀⠀⠰⣿⣧⣶⣿⣿⣿⣿⣿⣿⠀⢸⣤⣾⣿
⣿⠁⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣾⣿⣿⣿⣿⣿⣧⣄⣀⣀⣶⣾⣿⣿⣿⣿⣿⣿⣿⣿⣿⠀⣼⣿⣿⡾
⣿⡇⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣾⣿⣿⣿⣇
⣿⡇⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣆⠘⠛⣿
⣿⣿⡀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⠀⣠⣿
⣿⣿⠇⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣿⢻⣿⠋⠉⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣷⣿⣿⣿⣿
⣿⣿⣗⡄⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠈⠺⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿
⣿⣿⣿⣽⡀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣾⡇⢻⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿
⣿⣿⣿⣿⣷⡤⡄⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠈⠛⠓⠚⢻⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿
⣿⣿⣿⣧⣿⣉⢹⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣀⣠⣤⣭⣭⣉⣀⢈⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿
⣿⣏⡹⣯⣛⡛⠂⡄⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣀⣻⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿
⣿⣿⡿⠶⣭⣧⣀⢤⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢠⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿
⣿⣾⣿⣆⠉⠳⠈⠙⢂⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢰⢶⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿
⣿⡸⠛⠻⣤⠐⠂⢶⡀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢠⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿
⣿⣧⡦⠀⠀⣉⠀⠀⠇⠄⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠈⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿
⣿⣿⣷⣆⠀⠀⠀⠁⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢬⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿
⣿⣿⣿⣝⠓⠠⠤⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠘⢿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿
⣿⣿⣻⢷⡈⢄⢀⡀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿
⣿⣿⣿⠿⢿⠂⠁⠐⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢸⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿
⣿⣿⣽⣿⠀⠔⠂⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢸⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿
⣿⣿⣿⣟⠖⠶⠰⠂⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢀⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿
⣿⣿⡶⣟⡿⠊⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢸⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿
⣿⣶⣾⣿⣿⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢹⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿
⣿⣿⣿⣿⣿⣇⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣠⣀⣀⣤⣸⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣯⣍⠈⣿⣿
⣿⣿⣿⣿⣿⣿⣆⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢰⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⢣⣿⣿
⣿⣿⣿⣿⣿⣿⣿⣷⣄⡀⠀⠀⠀⠀⠀⠀⠀⠀⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⢿⣷⣿⣿⣿
⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣦⣀⢀⣄⣀⠀⠀⠀⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⡿⣿⣷⣿⣿⣿⣿⣿
⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣶⣼⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⢿⣻⣵⣿⣿⣿⣿⣿⣿⣿⣿
⠛⠛⠛⠛⠛⠛⠛⠛⠛⠛⠛⠛⠛⠛⠛⠛⠛⠛⠛⠛⠛⠛⠛⠛⠛⠛⠛⠛⠛⠛⠛⠛⠛⠛⠛⠛⠛⠛⠛⠛⠛⠛⠛⠛⠛⠛⠛⠛
`.trim().split('\n');

// Width of the text column next to the portrait (desktop)
const ABOUT_TEXT_WIDTH = 50;
// Art row at which the text column starts (desktop)
const ABOUT_TEXT_OFFSET = 1;

const ABOUT_HEADER = {
  de: [
    { text: '┌─────────────────────────────────────┐', color: 'blue' },
    { text: '│           ÜBER MICH                  │', color: 'blue' },
    { text: '└─────────────────────────────────────┘', color: 'blue' },
    { text: '' },
  ],
  en: [
    { text: '┌─────────────────────────────────────┐', color: 'blue' },
    { text: '│           ABOUT ME                   │', color: 'blue' },
    { text: '└─────────────────────────────────────┘', color: 'blue' },
    { text: '' },
  ],
};

// { age: true } marks the line that gets the animated age
const ABOUT_TEXT = {
  de: [
    { text: '  Name:      Luis Gaertner', color: 'text' },
    { age: true },
    { text: '  Standort:  Deutschland', color: 'text' },
    { text: '  Job:       Junior IT-Supporter', color: 'text' },
    { text: '  Privat:    Eigene Apps & Tools', color: 'text' },
    { text: '  Märkte:    Investieren & Trading', color: 'text' },
    { text: '' },
    { text: '  Tagsüber sorge ich im IT-Support eines', color: 'dim' },
    { text: '  Mittelständlers dafür, dass alles läuft.', color: 'dim' },
    { text: '  Kleines Team, viele Kunden — da landet', color: 'dim' },
    { text: '  so ziemlich jedes IT-Thema irgendwann', color: 'dim' },
    { text: '  auf meinem Tisch.', color: 'dim' },
    { text: '' },
    { text: '  Meine Basis ist On-Premise: Server,', color: 'dim' },
    { text: '  Active Directory, Benutzer und Rechte', color: 'dim' },
    { text: '  kenne ich aus dem echten Betrieb —', color: 'dim' },
    { text: '  nicht nur aus dem Lehrbuch.', color: 'dim' },
    { text: '' },
    { text: '  Nach Feierabend baue ich eigene Tools,', color: 'dim' },
    { text: '  meistens weil mich im Alltag etwas nervt.', color: 'dim' },
    { text: '  Dabei ist KI mein Pair-Programmer:', color: 'dim' },
    { text: '  Ich bringe Idee und Problemverständnis,', color: 'dim' },
    { text: '  die KI das Tempo.', color: 'dim' },
    { text: '' },
    { text: '  Meine zweite Leidenschaft: die Märkte.', color: 'dim' },
    { text: '  Langfristig investiere ich breit in ETFs', color: 'dim' },
    { text: '  und Einzelaktien, aktiv trade ich vor', color: 'dim' },
    { text: '  allem Krypto. Was mich reizt: Daten lesen,', color: 'dim' },
    { text: '  Risiken abwägen, Disziplin halten — und', color: 'dim' },
    { text: '  der Familie helfen, ihr Geld sinnvoll', color: 'dim' },
    { text: '  anzulegen.', color: 'dim' },
    { text: '' },
    ...CANDLE_CHART,
    { text: '  Mein zweites Lieblingsterminal.', color: 'dim' },
    { text: '' },
    { text: "  → 'projects' zeigt, was dabei rauskommt.", color: 'green', command: 'projects' },
  ],
  en: [
    { text: '  Name:      Luis Gaertner', color: 'text' },
    { age: true },
    { text: '  Location:  Germany', color: 'text' },
    { text: '  Job:       Junior IT Support Specialist', color: 'text' },
    { text: '  Hobby:     Building my own apps & tools', color: 'text' },
    { text: '  Markets:   Investing & trading', color: 'text' },
    { text: '' },
    { text: '  By day, I work in IT support for a', color: 'dim' },
    { text: '  mid-sized company and keep things running.', color: 'dim' },
    { text: '  Small team, lots of clients — so pretty', color: 'dim' },
    { text: '  much every IT topic ends up on my desk', color: 'dim' },
    { text: '  sooner or later.', color: 'dim' },
    { text: '' },
    { text: '  My foundation is on-premise: servers,', color: 'dim' },
    { text: '  Active Directory, users and permissions —', color: 'dim' },
    { text: '  learned in real operations, not just', color: 'dim' },
    { text: '  from a textbook.', color: 'dim' },
    { text: '' },
    { text: '  After hours I build my own tools, usually', color: 'dim' },
    { text: '  because something in my day annoys me.', color: 'dim' },
    { text: '  AI is my pair programmer: I bring the', color: 'dim' },
    { text: '  idea and the problem, AI brings the speed.', color: 'dim' },
    { text: '' },
    { text: '  My second passion: the markets.', color: 'dim' },
    { text: '  Long term, I invest broadly in ETFs and', color: 'dim' },
    { text: '  individual stocks; actively, I mostly', color: 'dim' },
    { text: '  trade crypto. What I love about it:', color: 'dim' },
    { text: '  reading data, weighing risk, staying', color: 'dim' },
    { text: '  disciplined — and helping my family put', color: 'dim' },
    { text: '  their money to work sensibly.', color: 'dim' },
    { text: '' },
    ...CANDLE_CHART,
    { text: '  My other favorite terminal.', color: 'dim' },
    { text: '' },
    { text: "  → 'projects' shows what comes out of it.", color: 'green', command: 'projects' },
  ],
};

// Build ABOUT with computed age
export function getAbout(lang, mobile = false) {
  const age = getAge();
  const ageLabel = lang === 'de' ? '  Alter:     ' : '  Age:       ';
  const ageSuffix = lang === 'de' ? ' Jahre' : ' years';
  const ageText = ageLabel + age + ageSuffix;

  if (mobile) {
    // Mobile: text first, then art below (no side-by-side)
    const infoLines = ABOUT_TEXT[lang].map((line) =>
      line.age
        ? { text: ageText, color: 'text', ageValue: String(age), ageLabel, ageSuffix, isMobileAge: true }
        : line
    );
    const artLines = ABOUT_ART.map((text) => ({ text, color: 'dim' }));
    return [...ABOUT_HEADER[lang], ...infoLines, { text: '' }, ...artLines, { text: '' }];
  }

  // Desktop: text column next to the portrait
  const rowCount = Math.max(ABOUT_ART.length, ABOUT_TEXT_OFFSET + ABOUT_TEXT[lang].length);
  const artLines = Array.from({ length: rowCount }, (_, i) => {
    const line = ABOUT_TEXT[lang][i - ABOUT_TEXT_OFFSET] || { text: '' };
    const artSeg = { text: ABOUT_ART[i] || '', color: 'dim' };
    if (line.age) {
      return {
        segments: [
          { text: ageText.padEnd(ABOUT_TEXT_WIDTH), color: 'text', ageValue: String(age), ageLabel, ageSuffix },
          artSeg,
        ],
      };
    }
    if (line.segments) {
      const width = line.segments.reduce((n, seg) => n + seg.text.length, 0);
      const pad = { text: ' '.repeat(Math.max(0, ABOUT_TEXT_WIDTH - width)), color: 'dim' };
      return { segments: [...line.segments, pad, artSeg] };
    }
    return {
      segments: [{ text: line.text.padEnd(ABOUT_TEXT_WIDTH), color: line.color || 'dim' }, artSeg],
    };
  });
  return [...ABOUT_HEADER[lang], ...artLines, { text: '' }];
}

// ---- PROJECTS ----

export const PROJECTS = {
  de: [
    { text: '┌─────────────────────────────────────────────┐', color: 'purple' },
    { text: '│              PROJEKTE                        │', color: 'purple' },
    { text: '└─────────────────────────────────────────────┘', color: 'purple' },
    { text: '' },
    { text: '  Alles hier ist entstanden, weil mich etwas', color: 'dim' },
    { text: '  gestört hat — und ich es besser haben wollte.', color: 'dim' },
    { text: '' },
    { text: '  Eigene Projekte', color: 'yellow' },
    { text: '  ───────────────', color: 'dim' },
    { text: '' },
    { text: '  [01]  Speachy  ·  macOS', color: 'green' },
    { text: '        Tippen ist langsamer als Reden.', color: 'text' },
    { text: '        Also: Tastenkürzel drücken, sprechen — und', color: 'dim' },
    { text: '        der Text landet direkt dort, wo der Cursor', color: 'dim' },
    { text: '        steht. In jeder App. Der Formal-Modus macht', color: 'dim' },
    { text: '        aus Gesprochenem eine saubere Mail.', color: 'dim' },
    { text: '        Stack: Swift, SwiftUI, Whisper, GPT-4o-mini', color: 'cyan' },
    { text: '        → github.com/luisgaertner/Speachy', color: 'blue', link: 'https://github.com/luisgaertner/Speachy' },
    { text: '' },
    { text: '  [02]  Speachy  ·  iOS', color: 'green' },
    { text: '        Dasselbe für unterwegs.', color: 'text' },
    { text: '        Inklusive eigener Tastatur-Erweiterung, mit', color: 'dim' },
    { text: '        der sich der diktierte Text in jede App', color: 'dim' },
    { text: '        einfügen lässt.', color: 'dim' },
    { text: '        Stack: Swift, SwiftUI, Keyboard Extension', color: 'cyan' },
    { text: '        → github.com/luisgaertner/SpeachyiOS', color: 'blue', link: 'https://github.com/luisgaertner/SpeachyiOS' },
    { text: '' },
    { text: '  [03]  luisgaertner.de', color: 'green' },
    { text: '        Genau diese Seite.', color: 'text' },
    { text: '        Ein Lebenslauf als PDF war mir zu langweilig', color: 'dim' },
    { text: '        — also ein Terminal.', color: 'dim' },
    { text: "        Mit Easter Egg: probier mal 'game'.", color: 'dim' },
    { text: '        Stack: React, Vite, GitHub Pages', color: 'cyan' },
    { text: '        → github.com/luisgaertner/luisgaertner.de', color: 'blue', link: 'https://github.com/luisgaertner/luisgaertner.de' },
    { text: '' },
    { text: '  Weiterentwickelt (Forks)', color: 'yellow' },
    { text: '  ────────────────────────', color: 'dim' },
    { text: '  Gute Open-Source-Tools, die mir für meinen', color: 'dim' },
    { text: '  Alltag noch ein Feature gefehlt haben.', color: 'dim' },
    { text: '' },
    { text: '  [04]  Blitztext  ·  macOS', color: 'green' },
    { text: '        Speech-to-Text-App von cmagnussen.', color: 'text' },
    { text: '        Mein Beitrag: frei belegbare Tastenkürzel', color: 'dim' },
    { text: '        pro Workflow — statt fest vorgegebener.', color: 'dim' },
    { text: '        Stack: Swift, SwiftUI, WhisperKit', color: 'cyan' },
    { text: '        → github.com/luisgaertner/blitztext-app', color: 'blue', link: 'https://github.com/luisgaertner/blitztext-app' },
    { text: '' },
    { text: '  [05]  WindowAnchor  ·  Windows', color: 'green' },
    { text: '        Workspace-Manager von marvintrvl.', color: 'text' },
    { text: '        Merkt sich Fensterlayouts und stellt sie beim', color: 'dim' },
    { text: '        Andocken automatisch wieder her.', color: 'dim' },
    { text: '        Von mir: eigene Erweiterungen obendrauf.', color: 'dim' },
    { text: '        Stack: C#, .NET, WPF', color: 'cyan' },
    { text: '        → github.com/luisgaertner/WindowAnchor', color: 'blue', link: 'https://github.com/luisgaertner/WindowAnchor' },
    { text: '' },
    { text: "  Tipp: Klicke einen Link oder tippe 'open <nummer>'.", color: 'dim' },
    { text: '' },
  ],
  en: [
    { text: '┌─────────────────────────────────────────────┐', color: 'purple' },
    { text: '│              PROJECTS                        │', color: 'purple' },
    { text: '└─────────────────────────────────────────────┘', color: 'purple' },
    { text: '' },
    { text: '  Everything here exists because something', color: 'dim' },
    { text: '  bugged me — and I wanted it to be better.', color: 'dim' },
    { text: '' },
    { text: '  My own projects', color: 'yellow' },
    { text: '  ───────────────', color: 'dim' },
    { text: '' },
    { text: '  [01]  Speachy  ·  macOS', color: 'green' },
    { text: '        Typing is slower than talking.', color: 'text' },
    { text: '        So: press a hotkey, speak — and the text', color: 'dim' },
    { text: '        appears right where your cursor is. In any', color: 'dim' },
    { text: '        app. Formal mode turns rambling into a', color: 'dim' },
    { text: '        clean email.', color: 'dim' },
    { text: '        Stack: Swift, SwiftUI, Whisper, GPT-4o-mini', color: 'cyan' },
    { text: '        → github.com/luisgaertner/Speachy', color: 'blue', link: 'https://github.com/luisgaertner/Speachy' },
    { text: '' },
    { text: '  [02]  Speachy  ·  iOS', color: 'green' },
    { text: '        The same thing on the go.', color: 'text' },
    { text: '        Including a custom keyboard extension that', color: 'dim' },
    { text: '        inserts the dictated text into any app.', color: 'dim' },
    { text: '        Stack: Swift, SwiftUI, Keyboard Extension', color: 'cyan' },
    { text: '        → github.com/luisgaertner/SpeachyiOS', color: 'blue', link: 'https://github.com/luisgaertner/SpeachyiOS' },
    { text: '' },
    { text: '  [03]  luisgaertner.de', color: 'green' },
    { text: '        This very page.', color: 'text' },
    { text: '        A PDF résumé felt too boring — so I built', color: 'dim' },
    { text: '        a terminal instead.', color: 'dim' },
    { text: "        Easter egg included: try 'game'.", color: 'dim' },
    { text: '        Stack: React, Vite, GitHub Pages', color: 'cyan' },
    { text: '        → github.com/luisgaertner/luisgaertner.de', color: 'blue', link: 'https://github.com/luisgaertner/luisgaertner.de' },
    { text: '' },
    { text: '  Extended (forks)', color: 'yellow' },
    { text: '  ────────────────', color: 'dim' },
    { text: '  Great open-source tools that were missing', color: 'dim' },
    { text: '  one feature for my daily workflow.', color: 'dim' },
    { text: '' },
    { text: '  [04]  Blitztext  ·  macOS', color: 'green' },
    { text: '        Speech-to-text app by cmagnussen.', color: 'text' },
    { text: '        My contribution: freely configurable', color: 'dim' },
    { text: '        hotkeys per workflow instead of fixed ones.', color: 'dim' },
    { text: '        Stack: Swift, SwiftUI, WhisperKit', color: 'cyan' },
    { text: '        → github.com/luisgaertner/blitztext-app', color: 'blue', link: 'https://github.com/luisgaertner/blitztext-app' },
    { text: '' },
    { text: '  [05]  WindowAnchor  ·  Windows', color: 'green' },
    { text: '        Workspace manager by marvintrvl.', color: 'text' },
    { text: '        Remembers window layouts and restores them', color: 'dim' },
    { text: '        when you dock your laptop.', color: 'dim' },
    { text: '        From me: my own extensions on top.', color: 'dim' },
    { text: '        Stack: C#, .NET, WPF', color: 'cyan' },
    { text: '        → github.com/luisgaertner/WindowAnchor', color: 'blue', link: 'https://github.com/luisgaertner/WindowAnchor' },
    { text: '' },
    { text: "  Tip: Click a link or type 'open <number>' to visit.", color: 'dim' },
    { text: '' },
  ],
};

// ---- SKILLS ----

export const SKILLS = {
  de: [
    { text: '┌─────────────────────────────────────┐', color: 'yellow' },
    { text: '│           FÄHIGKEITEN                │', color: 'yellow' },
    { text: '└─────────────────────────────────────┘', color: 'yellow' },
    { text: '' },
    { text: '  Im Job  ·  IT-Infrastruktur & Support', color: 'green' },
    { text: '  ─────────────────────────────────────', color: 'dim' },
    { text: '  ▸ Active Directory, Benutzer & Berechtigungen', color: 'text' },
    { text: '  ▸ On-Premise-Server & Windows-Umgebungen', color: 'text' },
    { text: '  ▸ Support für viele Kunden mit sehr', color: 'text' },
    { text: '    unterschiedlichen Setups', color: 'text' },
    { text: '  ▸ Breites IT-Spektrum — vom Arbeitsplatz', color: 'text' },
    { text: '    bis zur Infrastruktur dahinter', color: 'text' },
    { text: '' },
    { text: '  Privat  ·  Entwicklung mit KI', color: 'green' },
    { text: '  ─────────────────────────────', color: 'dim' },
    { text: '  ▸ Swift & SwiftUI — Apps für macOS & iOS', color: 'text' },
    { text: '  ▸ OpenAI-APIs — Whisper & GPT eingebunden', color: 'text' },
    { text: '  ▸ C# / .NET — Erweiterungen für Windows-Tools', color: 'text' },
    { text: '  ▸ React & Vite — diese Website', color: 'text' },
    { text: '  ▸ Git & GitHub', color: 'text' },
    { text: '' },
    { text: '  Was der Support mir beigebracht hat', color: 'green' },
    { text: '  ───────────────────────────────────', color: 'dim' },
    { text: '  ▸ Ruhe bewahren, wenn es gerade brennt', color: 'text' },
    { text: '  ▸ Technik so erklären, dass jeder sie versteht', color: 'text' },
    { text: '  ▸ Probleme strukturiert eingrenzen statt raten', color: 'text' },
    { text: '' },
    { text: '  Ganz ehrlich:', color: 'yellow' },
    { text: '  Ich bin kein klassisch ausgebildeter Entwickler.', color: 'dim' },
    { text: '  Ich setze KI-Tools wie Claude gezielt ein, um', color: 'dim' },
    { text: '  Ideen in funktionierende Software zu verwandeln —', color: 'dim' },
    { text: '  und lerne mit jedem Projekt dazu, was unter', color: 'dim' },
    { text: '  der Haube passiert.', color: 'dim' },
    { text: '' },
  ],
  en: [
    { text: '┌─────────────────────────────────────┐', color: 'yellow' },
    { text: '│           SKILLS                     │', color: 'yellow' },
    { text: '└─────────────────────────────────────┘', color: 'yellow' },
    { text: '' },
    { text: '  At work  ·  IT infrastructure & support', color: 'green' },
    { text: '  ───────────────────────────────────────', color: 'dim' },
    { text: '  ▸ Active Directory, users & permissions', color: 'text' },
    { text: '  ▸ On-premise servers & Windows environments', color: 'text' },
    { text: '  ▸ Supporting many clients with very', color: 'text' },
    { text: '    different setups', color: 'text' },
    { text: '  ▸ Broad IT range — from the workstation', color: 'text' },
    { text: '    to the infrastructure behind it', color: 'text' },
    { text: '' },
    { text: '  Side projects  ·  Building with AI', color: 'green' },
    { text: '  ──────────────────────────────────', color: 'dim' },
    { text: '  ▸ Swift & SwiftUI — apps for macOS & iOS', color: 'text' },
    { text: '  ▸ OpenAI APIs — Whisper & GPT integration', color: 'text' },
    { text: '  ▸ C# / .NET — extensions for Windows tools', color: 'text' },
    { text: '  ▸ React & Vite — this website', color: 'text' },
    { text: '  ▸ Git & GitHub', color: 'text' },
    { text: '' },
    { text: '  What support work taught me', color: 'green' },
    { text: '  ───────────────────────────', color: 'dim' },
    { text: '  ▸ Staying calm when things are on fire', color: 'text' },
    { text: '  ▸ Explaining tech so anyone can follow', color: 'text' },
    { text: '  ▸ Narrowing problems down instead of guessing', color: 'text' },
    { text: '' },
    { text: '  Honestly:', color: 'yellow' },
    { text: "  I'm not a classically trained developer. I use", color: 'dim' },
    { text: '  AI tools like Claude deliberately to turn ideas', color: 'dim' },
    { text: '  into working software — and learn a bit more', color: 'dim' },
    { text: '  about what happens under the hood every time.', color: 'dim' },
    { text: '' },
  ],
};

// ---- CONTACT ----

export const CONTACT = {
  de: [
    { text: '┌─────────────────────────────────────┐', color: 'red' },
    { text: '│           KONTAKT                    │', color: 'red' },
    { text: '└─────────────────────────────────────┘', color: 'red' },
    { text: '' },
    { text: '  Email:    luisgaertner@icloud.com', color: 'text', link: 'mailto:luisgaertner@icloud.com' },
    { text: '  GitHub:   github.com/luisgaertner', color: 'text', link: 'https://github.com/luisgaertner' },
    { text: '' },
    { text: '  Du hast eine spannende Stelle, eine Frage', color: 'dim' },
    { text: '  oder einfach eine Idee? Schreib mir —', color: 'dim' },
    { text: '  ich antworte schnell.', color: 'dim' },
    { text: '' },
  ],
  en: [
    { text: '┌─────────────────────────────────────┐', color: 'red' },
    { text: '│           CONTACT                    │', color: 'red' },
    { text: '└─────────────────────────────────────┘', color: 'red' },
    { text: '' },
    { text: '  Email:    luisgaertner@icloud.com', color: 'text', link: 'mailto:luisgaertner@icloud.com' },
    { text: '  GitHub:   github.com/luisgaertner', color: 'text', link: 'https://github.com/luisgaertner' },
    { text: '' },
    { text: '  Got an interesting role, a question or just', color: 'dim' },
    { text: '  an idea? Drop me a line — I reply quickly.', color: 'dim' },
    { text: '' },
  ],
};

// ---- HELP ----

export const HELP = {
  de: [
    { text: '' },
    { text: '  Verfügbare Befehle:', color: 'yellow' },
    { text: '' },
    { text: '  about       Wer ich bin', color: 'green', command: 'about' },
    { text: '  projects    Was ich gebaut habe', color: 'green', command: 'projects' },
    { text: '  skills      Was ich kann — ehrlich', color: 'green', command: 'skills' },
    { text: '  contact     So erreichst du mich', color: 'green', command: 'contact' },
    { text: '  game        🎮 Kurze Pause? DoodleJump', color: 'green', command: 'game' },
    { text: '  lang        Switch to English', color: 'green', command: 'lang' },
    { text: '  clear       Terminal leeren', color: 'green', command: 'clear' },
    { text: '  help        Diese Übersicht', color: 'green', command: 'help' },
    { text: '' },
    { text: '  Klicke auf einen Befehl, um ihn auszuführen.', color: 'dim' },
    { text: '' },
  ],
  en: [
    { text: '' },
    { text: '  Available commands:', color: 'yellow' },
    { text: '' },
    { text: '  about       Who I am', color: 'green', command: 'about' },
    { text: "  projects    What I've built", color: 'green', command: 'projects' },
    { text: '  skills      What I can do — honestly', color: 'green', command: 'skills' },
    { text: '  contact     How to reach me', color: 'green', command: 'contact' },
    { text: '  game        🎮 Quick break? DoodleJump', color: 'green', command: 'game' },
    { text: '  lang        Auf Deutsch wechseln', color: 'green', command: 'lang' },
    { text: '  clear       Clear the terminal', color: 'green', command: 'clear' },
    { text: '  help        Show this overview', color: 'green', command: 'help' },
    { text: '' },
    { text: '  Click any command above to run it.', color: 'dim' },
    { text: '' },
  ],
};

// ---- PROJECT LINKS (order matches [01]–[05] above) ----

export const PROJECT_LINKS = [
  'https://github.com/luisgaertner/Speachy',
  'https://github.com/luisgaertner/SpeachyiOS',
  'https://github.com/luisgaertner/luisgaertner.de',
  'https://github.com/luisgaertner/blitztext-app',
  'https://github.com/luisgaertner/WindowAnchor',
];
