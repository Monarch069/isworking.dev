export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;

    // Assets and files with explicit extensions are served as-is.
    if (path.split("/").pop().includes(".")) {
      return env.ASSETS.fetch(request);
    }

    const accept = request.headers.get("Accept") ?? "";

    let extension;

    if (accept.includes("text/html")) {
      extension = ".html";
    } else if (accept.includes("text/markdown")) {
      extension = ".md";
    } else {
      extension = ".txt";
    }

    const assetUrl = new URL(request.url);

    // "/" becomes "/index.html", "/index.txt", or "/index.md"
    // "/foo" becomes "/foo.html", "/foo.txt", or "/foo.md"
    assetUrl.pathname =
      path === "/"
        ? `/index${extension}`
        : `${path}${extension}`;

    const response = await env.ASSETS.fetch(
      `https://assets.local${assetPath}`
    );

    if (!response.ok) {
      return new Response(
        `Asset not found: ${assetPath}\nStatus: ${response.status}`,
        {
          status: response.status,
          headers: {
            "Content-Type": "text/plain; charset=utf-8"
          }
        }
      );
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
