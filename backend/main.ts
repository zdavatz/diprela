import { Application, Router, send } from "https://deno.land/x/oak@v11.1.0/mod.ts";
import { oakCors } from "https://deno.land/x/cors@v1.2.2/mod.ts";
import { readCSVRows } from "https://deno.land/x/csv@v0.8.0/mod.ts";
import * as Path from "https://deno.land/std@0.177.0/path/mod.ts";

const staticPath = Path.posix.resolve(new URL('.', import.meta.url).pathname, '..', 'frontend', 'dist');

const router = new Router();
router
  .get("/api/searchSuggestion/:input", async (context) => {
    const input = context?.params?.input;
    if (input) {
      const result = await getSearchSuggestion(input.toLowerCase());
      context.response.body = result;
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
    return await send(context, relPath, {
      root: staticPath,
    });
  })
  .get("/", async (context) => {
    return await send(context, 'index.html', {
      root: staticPath,
    });
  });

const CsvIndex = {
  Name: 0,
  Synonym: 1,
  Kategorie: 2,
};

let cachedVitaminNames: string[] | null = null;
let cachedRows: string[][] | null = null;

async function preapreCSV(): Promise<[string[], string[][]]> {
  if (!cachedRows || !cachedVitaminNames) {
    const file = await Deno.open(
      "../csv/Nährwertdatenbank_gesamt_26.01.2022.csv",
    );
    const iterator = readCSVRows(file, { columnSeparator: ";", fromLine: 2 });

    let i = 0;
    const r = [];
    for await (const row of iterator) {
      if (i === 0) {
        cachedVitaminNames = row.slice(4, 44);
      } else {
        r.push(row);
      }
      i++;
    }
    cachedRows = r;
  }
  return [cachedVitaminNames!, cachedRows];
}

async function getVitaminSuggestions(prefix: string): Promise<string[]> {
  const [vitamins] = await preapreCSV();
  return vitamins.filter((v) => v.toLowerCase().startsWith(prefix));
}

async function getSuggestionForCSVColumns(
  prefix: string,
): Promise<Suggestion[]> {
  const [, rows] = await preapreCSV();
  const addedValues = new Set<string>();
  const results: Suggestion[] = [];
  for (const r of rows) {
    console.log("CsvIndex", CsvIndex);
    for (const [columnName, index] of Object.entries(CsvIndex)) {
      const cellValue = r[index];
      console.log("cellValue", cellValue);
      console.log("prefix", prefix);
      const cellValueLowerCase = cellValue.toLowerCase();
      if (cellValueLowerCase.startsWith(prefix)) {
        console.log("in!");
        const dedupString = `${columnName}:${cellValueLowerCase}`;
        if (!addedValues.has(dedupString)) {
          results.push({
            type: columnName.toLowerCase() as Suggestion["type"],
            name: cellValue,
          });
          addedValues.add(dedupString);
        }
      }
    }
  }
  return results;
}

type Suggestion = {
  type: "name" | "synonym" | "kategorie" | "vitamin";
  name: string;
};
async function getSearchSuggestion(input: string): Promise<Suggestion[]> {
  return [
    ...(await getVitaminSuggestions(input)).map((name) => ({
      type: "vitamin" as const,
      name,
    })),
    ...await getSuggestionForCSVColumns(input),
  ];
}

const app = new Application();
app.use(oakCors()); // Enable CORS for All Routes
app.use(router.routes());
app.use(router.allowedMethods());

console.log("Listening on 8000");
await app.listen({ port: 8000 });
