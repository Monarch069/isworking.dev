export default {
  async fetch(request, env) {
    try {
      const url = new URL(request.url);
      const path = url.pathname;

      // Files with an extension are served as-is.
      if (path.split("/").pop().includes(".")) {
        return env.ASSETS.fetch(request);
      }

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

      console.log({
        path,
        accept,
        assetPath
      });

      const response = await env.ASSETS.fetch(
        `https://assets.local${assetPath}`
      );

      const headers = new Headers(response.headers);
      headers.set("Vary", "Accept");

      return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers
      });
    } catch (error) {
      console.error(error);

      return new Response(
        `Worker error:\n${error instanceof Error ? error.stack : String(error)}\n`,
        {
          status: 500,
          headers: {
            "Content-Type": "text/plain; charset=utf-8"
          }
        }
      );
    }
  }
};
