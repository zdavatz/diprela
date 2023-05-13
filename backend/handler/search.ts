import { CsvIndex, getColumns, getRows, splitCellIntoTerms, getColumnPdfs } from "../csv-store.ts";

export type SearchTerm = {
  type: "name" | "synonym" | "kategorie" | "vitamin";
  name: string;
};

export type SearchResponse = {
  rows: string[][];
  columnNames: string[],
  columnUrls: (string | null)[],
}

export async function getSearchResult(searchTerms: SearchTerm[]): Promise<SearchResponse> {
  const rows = await getRows();
  const nskSearchTerms = filterNSKSearchTerms(searchTerms);
  const vitaminIndexes = await columnIndexOfVitaminSearchTerms(searchTerms);
  const result = rows.filter(r => isRowMatchSearchTerms(r, nskSearchTerms, vitaminIndexes));
  const sortFn = await sortFunctionWithSearchTerms(searchTerms);
  const pdfs = await getColumnPdfs();
  return {
    rows: result.sort(sortFn),
    columnNames: await getColumns(),
    columnUrls: pdfs.map(filename => filename && `/pdf/${filename}`),
  };
}

function filterNSKSearchTerms(searchTerms: SearchTerm[]): SearchTerm[] {
  return searchTerms.filter(s => s.type === 'name' || s.type === 'synonym' || s.type === 'kategorie');
}

async function columnIndexOfVitaminSearchTerms(searchTerms: SearchTerm[]): Promise<number[]> {
  const vitaminNames = searchTerms.filter(s => s.type === 'vitamin').map(s => s.name);
  if (!vitaminNames.length) return [];
  const columns = await getColumns();
  const vitaminIndexes = vitaminNames.map(v => columns.indexOf(v)).filter(i => i >= 0);
  return vitaminIndexes;
}

function isRowMatchSearchTerms(row: string[], nskSearchTerms: SearchTerm[], vitaminIndexes: number[]): boolean {
  if (!nskSearchTerms.length && !vitaminIndexes.length) {
    return false; // Empty when there's no search term
  }
  const nskMatch = nskSearchTerms.length
    ? nskSearchTerms.some(s => isRowMatchNSKSearchTerm(row, s))
    : true;
  const vitaminMatch = vitaminIndexes.length
    ? vitaminIndexes.map(index => sensitizeVitaminValue(row[index])).filter(value => value !== 0).length > 0
    : true;
  return nskMatch && vitaminMatch;
}

function isRowMatchNSKSearchTerm(row: string[], searchTerm: SearchTerm): boolean {
  const index = searchTerm.type === 'name' ? CsvIndex.Name
    : searchTerm.type === 'synonym' ? CsvIndex.Synonym
    : searchTerm.type === 'kategorie' ? CsvIndex.Kategorie
    : null;
  if (!index) return false;
  const candidates = splitCellIntoTerms(index, row[index]);
  return candidates.some(c => c.toLowerCase()?.startsWith(searchTerm.name.toLowerCase()));
}

async function sortFunctionWithSearchTerms(searchTerms: SearchTerm[]) {
  const vitaminIndexes = await columnIndexOfVitaminSearchTerms(searchTerms);
  if (!vitaminIndexes.length) {
    return undefined;
  }
  return function(row1: string[], row2: string[]): number {
    const row1VitaminCount = vitaminIndexes.map(index => sensitizeVitaminValue(row1[index])).filter(value => value !== 0).length;
    const row2VitaminCount = vitaminIndexes.map(index => sensitizeVitaminValue(row2[index])).filter(value => value !== 0).length;
    if (row1VitaminCount !== row2VitaminCount) {
      return row2VitaminCount - row1VitaminCount;
    }
    for (const index of vitaminIndexes) {
      const compareResult = sensitizeVitaminValue(row2[index]) - sensitizeVitaminValue(row1[index]);
      if (compareResult !== 0) {
        return compareResult;
      }
    }
    return 0;
  }
}

function sensitizeVitaminValue(val: string): number {
  if (val === "k.A." || val === "Sp.") {
    return 0;
  }
  return Number(val);
}
