import { CsvIndex, getVitaminNames, getRows, splitCellIntoTerms } from "../csv-store.ts";
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
      const cellValues = splitCellIntoTerms(index, r[index]);
      for (const cellValue of cellValues) {
        const cellValueLowerCase = cellValue.toLowerCase().trim();
        if (cellValueLowerCase.startsWith(prefix)) {
          const dedupString = `${columnName}:${cellValueLowerCase}`;
          if (!addedValues.has(dedupString)) {
            results.push({
              type: columnName.toLowerCase() as SearchTerm["type"],
              name: cellValue.trim(),
            });
            addedValues.add(dedupString);
          }
        }
      }
    }
  }
  return results;
}
