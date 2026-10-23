// The city and its soundscape run entirely in the browser.
export default {
  async fetch(request, env) {
    const response = await env.ASSETS.fetch(request);
    if (new URL(request.url).pathname === '/.well-known/spatial-review.json') {
      const headers = new Headers(response.headers);
      headers.set('Access-Control-Allow-Origin', 'https://spatial-review.alterno.dev');
      return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
    }
    return response;
  },
};
