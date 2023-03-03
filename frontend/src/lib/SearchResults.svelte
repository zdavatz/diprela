<script lang="ts">
  import { type SearchTerm, searchTermsToString } from './searchTerm';

  export let searchTerms: SearchTerm[];
  let searchedTerms: SearchTerm[]; // Needed to remember the previous terms to dedup search
  let searchResultsColumnNames = [];
  let searchResults = [];
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
    const { rows, columnNames } = await res.json();
    searchResultsColumnNames = columnNames;
    searchResults = rows;
    isLoading = false;
  }

  function shouldShowCell(value: string): boolean {
    if (['', '0', 'k.a.', 'Sp.', '-'].includes(value.toLowerCase())) {
      return false;
    }
    return true;
  }

  function columnType(index): SearchTerm['type'] | null {
    if (index === 1) {
      return 'name';
    } else if (index === 2) {
      return 'synonym';
    } else if (index === 3) {
      return 'kategorie';
    } else if (index >= 5 && index <= 45) {
      return 'vitamin';
    }
    return null;
  }

  function isVitaminNameSearched(vitaminName: string): boolean {
    return searchTerms.find(t => t.type === 'vitamin' && t.name === vitaminName) !== undefined;
  }

  $: search(searchTerms);
</script>

<div class="search-results">
  {#if isLoading}
    <div class="loading"></div>
  {/if}
  {#each searchResults as searchResult (searchResult[0])}
    {@const colWithoutId = searchResultsColumnNames.slice(1)}
    {@const rowWithoutId = searchResult.slice(1)}
    <div class="search-result">
      {#each colWithoutId as col, index}
        {@const value = rowWithoutId[index]}
        {#if shouldShowCell(value)}
          <div class="column {columnType(index) ?? ''}">
            <div class="column-name {isVitaminNameSearched(col) ? 'highlight' : ''}">{col}</div>
            <div class="value">{value}</div>
          </div>
        {/if}
      {/each}
      </div>
  {:else}
    No results
  {/each}
</div>

<style>
  .search-results {
    
  }
  .search-result {
    display: flex;
    flex-flow: row wrap;
    gap: 10px;
    margin: 20px 0;
    border: solid 1px black;
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
    background: lightgray;
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
