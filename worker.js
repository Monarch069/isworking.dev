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

    const headers = new Headers(response.headers);
    headers.set("Vary", "Accept");

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers
    });
  }
};
