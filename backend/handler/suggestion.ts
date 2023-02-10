import { CsvIndex, fetchCSV } from "../csv-store.ts";

type Suggestion = {
  type: "name" | "synonym" | "kategorie" | "vitamin";
  name: string;
};
export async function getSearchSuggestions(input: string): Promise<Suggestion[]> {
  return [
    ...(await getVitaminSuggestions(input)).map((name) => ({
      type: "vitamin" as const,
      name,
    })),
    ...await getSuggestionForCSVColumns(input),
  ];
}

async function getVitaminSuggestions(prefix: string): Promise<string[]> {
  const [vitamins] = await fetchCSV();
  return vitamins.filter((v) => v.toLowerCase().startsWith(prefix));
}

async function getSuggestionForCSVColumns(
  prefix: string,
): Promise<Suggestion[]> {
  const [, rows] = await fetchCSV();
  const addedValues = new Set<string>();
  const results: Suggestion[] = [];
  for (const r of rows) {
    for (const [columnName, index] of Object.entries(CsvIndex)) {
      const cellValue = r[index];
      const cellValueLowerCase = cellValue.toLowerCase();
      if (cellValueLowerCase.startsWith(prefix)) {
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
