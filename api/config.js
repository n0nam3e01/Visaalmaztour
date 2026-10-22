import { publicConfig } from '../public-config.mjs';

export default {
  fetch(request) {
    const headers = { 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' };
    if (!['GET', 'HEAD'].includes(request.method)) {
      return Response.json({ error: 'Метод не поддерживается.' }, { status: 405, headers: { ...headers, Allow: 'GET, HEAD' } });
    }
    if (request.method === 'HEAD') return new Response(null, { headers });
    return Response.json(publicConfig(process.env), { headers });
  },
};
