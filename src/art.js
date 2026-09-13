const sheets = {
  phones: { columns: 4, rows: 4, ids: ['nokia-3220', 'alcatel-e221', 'motorola-w375', 'lg-shine', 'nokia-e71', 'iphone-4', 'htc-one', 'xperia-z5', 'lenovo-p2', 'mi-a2-lite', 'mi-9t-pro', 'zenfone-9', 'xiaomi-15'] },
  laptops: { columns: 4, rows: 2, ids: ['hp-dv6000', 'toshiba-l300d', 'samsung-nc10', 'acer-4820t', 'samsung-chronos', 'dell-xps-13', 'matebook-x-pro', 'zenbook-16x'] },
  desktops: { columns: 3, rows: 2, ids: ['dino-pc', 'prodigy', 'dan-a4', 'meshlicious', 'meshroom-d'] },
};

export function artStyle(device) {
  const sheet = sheets[device.category];
  const key = device.upgradeOf || device.imageKey || device.id;
  const index = sheet.ids.indexOf(key);
  if (index < 0) throw new Error(`No illustration mapped for ${device.id}`);
  const column = index % sheet.columns;
  const row = Math.floor(index / sheet.columns);
  return `--art-url:url('/assets/${device.category}.png');--art-size:${sheet.columns * 100}% ${sheet.rows * 100}%;--art-position:${column / (sheet.columns - 1) * 100}% ${row / (sheet.rows - 1) * 100}%;`;
}

export const categories = [
  { id: 'phones', title: 'Phones', count: '13 devices' },
  { id: 'laptops', title: 'Laptops', count: '8 devices' },
  { id: 'desktops', title: 'Desktops', count: '5 builds · 1 upgrade' },
];
