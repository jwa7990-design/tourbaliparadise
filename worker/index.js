/* Cloudflare Worker in front of the static site.
   One job: send every visitor to the single canonical address,
   https://tourbaliparadise.com, with a permanent (301) redirect.
     http://tourbaliparadise.com/...      -> https://tourbaliparadise.com/...
     http(s)://www.tourbaliparadise.com/... -> https://tourbaliparadise.com/...
   Everything else (including the workers.dev preview address) is served
   from the static files exactly as before. */
const CANONICAL_HOST = 'tourbaliparadise.com';
const REDIRECT_HOSTS = new Set(['tourbaliparadise.com', 'www.tourbaliparadise.com']);

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const host = url.hostname.toLowerCase();
    if (REDIRECT_HOSTS.has(host) && (host !== CANONICAL_HOST || url.protocol === 'http:')) {
      url.protocol = 'https:';
      url.hostname = CANONICAL_HOST;
      url.port = '';
      return Response.redirect(url.toString(), 301);
    }
    return env.ASSETS.fetch(request);
  },
};
