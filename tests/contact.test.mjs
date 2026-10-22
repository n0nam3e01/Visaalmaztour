import test from 'node:test';
import assert from 'node:assert/strict';
import { consultationUrl, mapsApiUrl } from '../contact.mjs';
test('consultation preserves Cyrillic and encodes special characters as message content', () => {
 const url = new URL(consultationUrl('США', 'Семья & дети?'));
 assert.equal(url.origin, 'https://wa.me');
 assert.equal(url.pathname, '/77064060101');
 assert.match(url.searchParams.get('text'), /США/);
 assert.match(url.searchParams.get('text'), /Семья & дети\?/);
 assert.equal([...url.searchParams.keys()].length, 1);
});
test('blank consultation has useful generic wording without undefined values', () => {
 const text = new URL(consultationUrl('  ', '')).searchParams.get('text');
 assert.match(text, /консультацию/);
 assert.doesNotMatch(text, /undefined|null/);
});
test('maps API is absent without a key and safely encodes a configured key', () => {
 assert.equal(mapsApiUrl(''), null);
 const url = new URL(mapsApiUrl('demo&key'));
 assert.equal(url.searchParams.get('key'), 'demo&key');
 assert.equal(url.searchParams.get('libraries'), 'places');
});
