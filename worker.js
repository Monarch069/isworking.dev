export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;

    // Real files (style.css, keys/gpg, foo/index.html, ...) are served as-is.
    if (!path.endsWith("/")) {
      const exact = await env.ASSETS.fetch(request);

      if (exact.status !== 404)
        return exact;
    }

    const accept = request.headers.get("Accept") ?? "";

    let extension = ".txt";

    if (accept.includes("text/html")) {
      extension = ".html";
    } else if (accept.includes("text/markdown")) {
      extension = ".md";
    }

    const fetchAsset = (pathname) => {
      const assetUrl = new URL(request.url);
      assetUrl.pathname = pathname;
      return env.ASSETS.fetch(new Request(assetUrl, request));
    };

    let response;

    if (path === "/404" || path === "/404/") {
      // The 404 page itself is still a 404.
      response = await fetchAsset(`/404/index${extension}`);
      return withStatus(response, 404);
    }

    if (path.endsWith("/")) {
      // ssg publishes foo.md and foo/index.md as foo/index.{html,md,txt}.
      response = await fetchAsset(`${path}index${extension}`);
    } else {
      // foo.md stays foo.{html,md,txt} when foo/index.md also exists.
      response = await fetchAsset(`${path}${extension}`);

      if (response.status === 404) {
        // /foo is a directory page: redirect to /foo/ so its relative links resolve.
        const index = await fetchAsset(`${path}/index${extension}`);

        if (index.status !== 404) {
          url.pathname = `${path}/`;
          return Response.redirect(url.toString(), 301);
        }
      }
    }

    if (response.status === 404) {
      // Anything missing gets 404.md, in whichever format was asked for.
      response = await fetchAsset(`/404/index${extension}`);
      return withStatus(response, 404);
    }

    return withStatus(response, response.status);
  }
};

function withStatus(response, status) {
  const headers = new Headers(response.headers);
  headers.set("Vary", "Accept");

  return new Response(response.body, {
    status,
    statusText: status === response.status ? response.statusText : "Not Found",
    headers
  });
}
