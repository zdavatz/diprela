import { CsvIndex, getVitaminNames, getRows } from "../csv-store.ts";
import { SearchTerm } from "./search.ts";

export async function getSearchSuggestions(input: string): Promise<SearchTerm[]> {
  return [
    ...(await getVitaminSuggestions(input)).map((name) => ({
      type: "vitamin" as const,
      name,
    })),
    ...await getSuggestionForCSVColumns(input),
  ];
}

async function getVitaminSuggestions(prefix: string): Promise<string[]> {
  const vitamins = await getVitaminNames();
  return vitamins.filter((v) => v.toLowerCase().startsWith(prefix));
}

async function getSuggestionForCSVColumns(
  prefix: string,
): Promise<SearchTerm[]> {
  const rows = await getRows();
  const addedValues = new Set<string>();
  const results: SearchTerm[] = [];
  for (const r of rows) {
    for (const [columnName, index] of Object.entries(CsvIndex)) {
      const cellValue = r[index];
      const cellValueLowerCase = cellValue.toLowerCase();
      if (cellValueLowerCase.startsWith(prefix)) {
        const dedupString = `${columnName}:${cellValueLowerCase}`;
        if (!addedValues.has(dedupString)) {
          results.push({
            type: columnName.toLowerCase() as SearchTerm["type"],
            name: cellValue,
          });
          addedValues.add(dedupString);
        }
      }
    }
  }
  return results;
}
