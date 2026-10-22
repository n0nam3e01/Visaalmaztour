export function consultationUrl(destination = '', details = '') {
 const subject = String(destination).trim();
 const extra = String(details).trim();
 const text = 'Здравствуйте! Хочу получить консультацию по визе' + (subject ? ': ' + subject : '') + '.' + (extra ? '\n' + extra : '');
 return 'https://wa.me/77064060101?text=' + encodeURIComponent(text);
}
export function mapsApiUrl(key = '') {
 if (!key.trim()) return null;
 const url = new URL('https://maps.googleapis.com/maps/api/js');
 url.searchParams.set('key', key.trim());
 url.searchParams.set('libraries', 'places');
 url.searchParams.set('loading', 'async');
 url.searchParams.set('callback', 'initVisaMap');
 url.searchParams.set('v', 'weekly');
 return url.href;
}
