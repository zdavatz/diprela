<script lang="ts">
  import { type SearchTerm, searchTermsToString } from './searchTerm';

  export let searchTerms: SearchTerm[];
  let searchedTerms: SearchTerm[]; // Needed to remember the previous terms to dedup search
  let searchResultsColumnNames = [];
  let searchResults = [];
  let searchResultsColumnUrls = [];
  let isLoading = false;

  async function search(searchTerms: SearchTerm[]) {
    if (searchTerms.length === 0) {
      searchResults = [];
      return;
    }
    if (searchTermsToString(searchTerms) === searchTermsToString(searchedTerms)) {
      return;
    }
    searchedTerms = [...searchTerms];
    const res = await fetch('/api/search', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify(searchTerms)
    });
    isLoading = true;
    const { rows, columnNames, columnUrls } = await res.json();
    searchResultsColumnNames = columnNames;
    searchResults = rows;
    searchResultsColumnUrls = columnUrls;
    isLoading = false;
  }

  function shouldShowCell(value: string): boolean {
    if (['', '0', 'k.a.', 'sp.', '-'].includes(value.trim().toLowerCase())) {
      return false;
    }
    return true;
  }

  function columnType(index): SearchTerm['type'] | null {
    if (index === 1) {
      return 'name';
    } else if (index === 2) {
      return 'synonym';
    } else if (index === 4) {
      return 'kategorie';
    } else if (index >= 5 && index <= 45) {
      return 'vitamin';
    }
    return null;
  }

  function isVitaminNameSearched(vitaminName: string): boolean {
    return searchTerms.find(t => t.type === 'vitamin' && t.name === vitaminName) !== undefined;
  }

  function columnValueHtmlWithLink(value: string) {
    const keyword = "Verzehr in der Schwangerschaft meiden!";
    return value.replaceAll(keyword, `<a target="_blank" href="/pdf/Lebensmittelbedingte_Infektionskrankheiten.pdf">${keyword}</a>`);
  }

  function columnNameHtmlWithLink(colIndex: number): string {
    const url = searchResultsColumnUrls[colIndex];
    if (!url) {
      return searchResultsColumnNames[colIndex];
    }
    return `<a target="_blank" href="${url}">${searchResultsColumnNames[colIndex]}</a>`
  }

  $: search(searchTerms);
</script>

<div class="search-results">
  {#if isLoading}
    <div class="loading"></div>
  {:else}
    {#each searchResults as searchResult (searchResult[0])}
      {@const colWithoutId = searchResultsColumnNames.slice(1)}
      {@const rowWithoutId = searchResult.slice(1)}
      {@const colUrlsWithoutId = searchResultsColumnUrls.slice(1)}
      <div class="search-result">
        {#each colWithoutId as col, index}
          {@const value = rowWithoutId[index]}
          {@const url = colUrlsWithoutId[index]}
          {#if shouldShowCell(value)}
            <div class="column {columnType(index + 1) ?? ''}">
              <div class="column-name {isVitaminNameSearched(col) ? 'highlight' : ''}">
                {#if url !== null}
                  <a href={url} target="_blank" rel="noreferrer">{col}</a>
                {:else}
                  {col}
                {/if}
              </div>
              <div class="value">{@html columnValueHtmlWithLink(value)}</div>
            </div>
          {/if}
        {/each}
        </div>
    {:else}
      No results
    {/each}
  {/if}
</div>

<style>
  .search-results {
    
  }
  .search-result {
    display: flex;
    flex-flow: row wrap;
    gap: 10px;
    margin: 20px 0;
    border: solid 1px var(--text-color);
    padding: 10px;
    border-radius: 10px;
  }
  .column {
    max-width: 200px;
    border-radius: 7px;
    overflow: hidden;
    border: solid 1px gray;
  }
  .column .column-name {
    padding: 3px 5px;
    font-size: 0.7em;
    background: var(--search-other-color);
  }

  .column.name {
    border: solid 1px var(--search-name-color);
  }
  .column.name .column-name {
    background: var(--search-name-color);
  }
  .column.synonym {
    border: solid 1px var(--search-synonym-color);
  }
  .column.synonym .column-name {
    background: var(--search-synonym-color);
  }
  .column.kategorie {
    border: solid 1px var(--search-kategorie-color);
  }
  .column.kategorie .column-name {
    background: var(--search-kategorie-color);
  }
  .column.vitamin {
    border: solid 1px var(--search-vitamin-color);
  }
  .column.vitamin .column-name {
    background: var(--search-vitamin-color);
  }
  .column.vitamin .column-name.highlight {
    background: #e31414;
    color: white;
  }
  .column .value {
    padding: 3px 5px;
  }
  .loading {
    margin: 10px auto;
  }
</style>
