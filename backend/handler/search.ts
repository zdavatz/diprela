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
  const forFilter = filterSearchTerms(searchTerms);
  const result = forFilter.length ? rows.filter(r => isRowMatchSearchTerms(r, forFilter)) : rows;
  const sortFn = await sortFunctionWithSearchTerms(searchTerms);
  const pdfs = await getColumnPdfs();
  return {
    rows: result.sort(sortFn),
    columnNames: await getColumns(),
    columnUrls: pdfs.map(filename => filename && `/pdf/${filename}`),
  };
}

// Name, synonym, and kategorie are for filter and vitamin is for sorting
function filterSearchTerms(searchTerms: SearchTerm[]): SearchTerm[] {
  return searchTerms.filter(t => ['name', 'synonym', 'kategorie'].includes(t.type));
}

function isRowMatchSearchTerms(row: string[], searchTerms: SearchTerm[]): boolean {
  return searchTerms.some(s => isRowMatchSearchTerm(row, s));
}

function isRowMatchSearchTerm(row: string[], searchTerm: SearchTerm): boolean {
  const index = searchTerm.type === 'name' ? CsvIndex.Name
    : searchTerm.type === 'synonym' ? CsvIndex.Synonym
    : searchTerm.type === 'kategorie' ? CsvIndex.Kategorie
    : null;
  if (!index) return false;
  const candidates = splitCellIntoTerms(index, row[index]);
  return candidates.some(c => c.toLowerCase()?.startsWith(searchTerm.name.toLowerCase()));
}

async function sortFunctionWithSearchTerms(searchTerms: SearchTerm[]) {
  const vitaminNames = searchTerms.filter(s => s.type === 'vitamin').map(s => s.name);
  if (!vitaminNames.length) return undefined;
  const columns = await getColumns();
  const vitaminIndexes = vitaminNames.map(v => columns.indexOf(v)).filter(i => i >= 0);
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
