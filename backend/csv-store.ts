import { readCSVRows } from "https://deno.land/x/csv@v0.8.0/mod.ts";

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

async function prepareCSV(): Promise<void> {
  const file = await Deno.open(
    "../csv/diprela.csv",
  );
  const iterator = readCSVRows(file, { columnSeparator: ";", fromLine: 2 });

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
