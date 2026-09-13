import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { devices } from '../src/data.js';
import { artStyle } from '../src/art.js';

test('every authoritative ownership row appears exactly once with its acquisition date', async () => {
  const source = await readFile(new URL('../docs/model-research.md', import.meta.url), 'utf8');
  const rows = source.split(/\r?\n/).filter(line => /^\| 20\d{2}/.test(line)).map(line => line.split('|').map(value => value.trim()));
  assert.equal(rows.length, 27);
  assert.equal(devices.length, rows.length);
  assert.equal(new Set(devices.map(d => d.id)).size, devices.length);
  for (const [,date,name] of rows) {
    const found = devices.filter(d => d.name === name);
    assert.equal(found.length, 1, `Canonical record must exist once: ${name}`);
    assert.ok(found[0].acquired.startsWith(date), `Ownership date changed: ${name}`);
    assert.equal(found[0].year, Number(date.slice(0,4)));
  }
});
test('desktop upgrade stays linked to its original build and is not counted as another PC', () => {
  assert.equal(devices.filter(d => d.category === 'desktops' && !d.upgradeOf).length, 5);
  const upgrades = devices.filter(d => d.upgradeOf);
  assert.equal(upgrades.length, 1);
  assert.equal(upgrades[0].year, 2022);
  assert.equal(upgrades[0].upgradeOf, 'meshlicious');
  assert.equal(devices.find(d => d.id === upgrades[0].upgradeOf).year, 2021);
});
test('confirmed unusual configurations and deliberate unknowns survive', () => {
  const specs = id => devices.find(d => d.id === id).ownedSpecs.flat().join(' ');
  assert.match(specs('matebook-x-pro'), /i5-8250U/);
  assert.match(specs('matebook-x-pro'), /8 GB/);
  assert.match(specs('matebook-x-pro'), /No dedicated GPU/);
  assert.match(specs('matebook-x-pro'), /Storage Not recorded/);
  assert.match(specs('xiaomi-15'), /Silver Special Edition/);
  assert.match(specs('xiaomi-15'), /512 GB/);
  assert.match(specs('meshroom-d'), /Motherboard Not recorded/);
  assert.doesNotMatch(specs('meshroom-d'), /B550/);
  assert.match(specs('dino-pc'), /840 PRO/);
});
test('every device has a mapped illustration and every price and benchmark has a source', () => {
  for (const device of devices) {
    assert.match(artStyle(device), /--art-url/);
    if (device.price) assert.ok(new URL(device.price.source).protocol.startsWith('http'));
    for (const result of device.benchmarks) {
      assert.ok(result.context.length > 20);
      assert.ok(new URL(result.source).protocol.startsWith('http'));
    }
  }
});
