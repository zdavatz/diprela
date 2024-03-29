import { Application, Router, send } from "https://deno.land/x/oak@v11.1.0/mod.ts";
import * as Path from "https://deno.land/std@0.177.0/path/mod.ts";
import { getSearchSuggestions } from "./handler/suggestion.ts";
import { getSearchResult } from "./handler/search.ts";

const staticPath = Path.posix.resolve(new URL('.', import.meta.url).pathname, '..', 'frontend', 'dist');
const pdfPath = Path.posix.resolve(new URL('.', import.meta.url).pathname, '..', 'pdf');

const router = new Router();
router
  .get("/api/searchSuggestion/:input", async (context) => {
    const input = context?.params?.input;
    if (input) {
      const result = await getSearchSuggestions(input.toLowerCase());
      context.response.body = result;
    }
  })
  .post("/api/search",async (context) => {
    const input = context?.request.body({
      type: "json"
    });
    const searchTerms = await input.value;
    if (input) {
      const result = await getSearchResult(searchTerms);
      context.response.body = result;
    }
  })
  .get("/", async (context) => {
    return await send(context, 'index.html', {
      root: staticPath,
    });
  })
  .get("/search/:path+", async (context) => {
    return await send(context, 'index.html', {
      root: staticPath,
    });
  })
  .get("/pdf/:path+", async (context)=> {
    const relPath = context.params.path;
    if (relPath === undefined || !Path.resolve(pdfPath, relPath).startsWith(pdfPath)) {
      context.response.status = 403;
      context.response.body = 'Forbidden';
      return;
    }
    try {
      return await send(context, relPath, {
        root: pdfPath,
      });
    } catch (_e) {
      context.response.status = 404;
      context.response.body = 'Not Found';
      return;
    }
  })
  .get("/:path+", async (context) => {
    const relPath = context.params.path || 'index.html';
    const absPath = Path.resolve(staticPath, relPath);
    if (!absPath.startsWith(staticPath)) {
      context.response.status = 403;
      context.response.body = 'Forbidden';
      return;
    }
    try {
      return await send(context, relPath, {
        root: staticPath,
      });
    } catch (_e) {
      context.response.status = 404;
      context.response.body = 'Not Found';
      return;
    }
  });

const app = new Application();
app.use(router.routes());
app.use(router.allowedMethods());

const port = Deno.env.get("PORT") || "8000"
console.log(`Listening on ${port}`);
await app.listen({ port: Number(port) });
