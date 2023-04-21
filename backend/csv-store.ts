import * as Path from "https://deno.land/std@0.177.0/path/mod.ts";
import { readCSVRows } from "https://deno.land/x/csv@v0.8.0/mod.ts";

const pdfPath = Path.posix.resolve(new URL('.', import.meta.url).pathname, '..', 'pdf');

export const CsvIndex = {
  // 0 is reserved for our own-injected row number (id)
  Name: 1,
  Synonym: 2,
  Kategorie: 4,
};

let cachedVitaminNames: string[] | null = null;
let cachedColumns: string[] | null = null;
let cachedRows: string[][] | null = null;

export async function getVitaminNames(): Promise<string[]> {
  if (!cachedVitaminNames) {
    await prepareCSV();
  }
  return cachedVitaminNames!;
}

export async function getColumns(): Promise<string[]> {
  if (!cachedColumns) {
    await prepareCSV();
  }
  return cachedColumns!;
}

export async function getRows(): Promise<string[][]> {
  if (!cachedRows) {
    await prepareCSV();
  }
  return cachedRows!;
}

export async function getColumnPdfs(): Promise<(string | null)[]> {
  const columns = await getColumns();
  const names: (string | null)[] = columns.map(_ => null);
  for await (const dirEntry of Deno.readDir(pdfPath)) {
    const results = /([A-Z]{1,2})(-[A-Z]{1,2})?.pdf$/g.exec(dirEntry.name);
    if (results === null || results.length < 2) {
      continue;
    }
    const from = columnToIndex(results[1]);
    const to = results[2] === undefined ? from : columnToIndex(results[2].replace('-', ''));
    for (let i = from; i <= to; i++) {
      names[i] = dirEntry.name;
    }
  }
  return names;
}

// e.g. A = 1, B = 2, AA = 27
function columnToIndex(column: string): number {
  let result = 0;
  for (let i = 0; i < column.length; i++) {
    const thisDigit = column.codePointAt(i)! - 64;
    result = result * 26 + thisDigit;
  }
  return result;
}

async function prepareCSV(): Promise<void> {
  const file = await Deno.open(
    "../csv/diprela.csv",
  );
  const iterator = readCSVRows(file, { columnSeparator: ";", fromLine: 4 });

  let i = 0;
  const r = [];
  const iter = iterator[Symbol.asyncIterator]();
  while (true) {
    const val = await iter.next().catch(e => {
      console.log('CSV error', e);
      return {done: false, value: null};
    });
    if (val.done) {
      break;
    }
    if (val.value === null) continue;
    if (i === 0) {
      cachedColumns = ['id', ...val.value];
      cachedVitaminNames = val.value.slice(5, 45);
    } else {
      r.push([String(i), ...val.value]);
    }
    i++;
  }
  cachedRows = r;
}

export function splitCellIntoTerms(index: number, cellValue: string): string[] {
  if (index === CsvIndex.Synonym) {
    return cellValue.split(',').map(s => s.trim());
  }
  return [cellValue];
}
