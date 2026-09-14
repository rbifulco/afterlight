// The city and its soundscape run entirely in the browser.
export default {
  fetch(request, env) {
    return env.ASSETS.fetch(request);
  },
};
