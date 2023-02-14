<script lang="ts">
  import type { SearchTerm } from './SearchField.svelte';

  export let searchTerms: SearchTerm[];
  let searchResultsColumnNames = [];
  let searchResults = [];

  async function search(searchTerms: SearchTerm[]) {
    if (searchTerms.length === 0) {
      searchResults = [];
      return;
    }
    const res = await fetch('/api/search', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify(searchTerms)
    });
    const { rows, columnNames } = await res.json();
    searchResultsColumnNames = columnNames;
    searchResults = rows;
  }

  function shouldShowCell(value: string): boolean {
    if (['', '0', 'k.a.', 'Sp.', '-'].includes(value.toLowerCase())) {
      return false;
    }
    return true;
  }

  $: search(searchTerms);
</script>

<div class="search-results">
  {#each searchResults as searchResult (searchResult[0])}
    {@const colWithoutId = searchResultsColumnNames.slice(1)}
    {@const rowWithoutId = searchResult.slice(1)}
    <div class="search-result">
      {#each colWithoutId as col, index}
        {@const value = rowWithoutId[index]}
        {#if shouldShowCell(value)}
          <div class="column {columnType(index) ?? ''}">
            <div class="column-name">{col}</div>
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
    border: solid 1px #f9c64f;
  }
  .column .name {
    background: #f9c64f;
    padding: 3px 5px;
    font-size: 0.7em;
  }
  .column .value {
    padding: 3px 5px;
  }
</style>