export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;

    // 1. Try the requested path exactly as-is.
    //    This handles things like:
    //    /keys/ssh
    //    /robots.txt
    //    /assets/style.css
    const exact = await env.ASSETS.fetch(request);

    if (exact.status !== 404) {
      return exact;
    }

    // 2. It doesn't exist literally, so negotiate a generated document.
    const accept = request.headers.get("Accept") ?? "";

    let extension = ".txt";

    if (accept.includes("text/html")) {
      extension = ".html";
    } else if (accept.includes("text/markdown")) {
      extension = ".md";
    }

    const assetPath =
      path === "/"
        ? `/index${extension}`
        : `${path}${extension}`;

    const assetUrl = new URL(request.url);
    assetUrl.pathname = assetPath;

    const response = await env.ASSETS.fetch(
      new Request(assetUrl, request)
    );

    const headers = new Headers(response.headers);
    headers.set("Vary", "Accept");

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers
    });
  }
};
