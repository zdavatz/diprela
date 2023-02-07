<script lang="ts">
  import { debounce } from './utils';

  type SearchTerm = {
    type: "name" | "synonym" | "kategorie" | "vitamin";
    name: string;
  };

  let highlightedSuggestionIndex = 0;
  let searchInput = ""
  let suggestions: SearchTerm[] = [];
  let searchTerms: SearchTerm[] = [];
  let lastSearchTermDeleteMode = false;

  const fetchSuggestion = debounce(async (input)=> {
    highlightedSuggestionIndex = 0;
    if (!input.length) return;
    const res = await fetch(`http://localhost:8000/api/searchSuggestion/${input}`);
    const json = await res.json();
    suggestions = json;
  });
  function handleKeydown(event: KeyboardEvent) {
    console.log(event.key)
    if (event.key === "ArrowUp") {
      event.preventDefault();
      highlightedSuggestionIndex = Math.max(0, highlightedSuggestionIndex - 1);
    } else if (event.key === "ArrowDown") {
      event.preventDefault();
      highlightedSuggestionIndex = Math.min(suggestions.length - 1, highlightedSuggestionIndex + 1);
    } else if (event.key === "Enter" || event.key === "Tab" && suggestions[highlightedSuggestionIndex]) {
      event.preventDefault();
      searchTerms.push(suggestions[highlightedSuggestionIndex])
      searchTerms = searchTerms;
      searchInput = '';
      suggestions = [];
    } else if (event.key === "Backspace") {
      if ((event.target as HTMLInputElement).selectionStart === 0) {
        if (!lastSearchTermDeleteMode) {
          lastSearchTermDeleteMode = true;
        } else {
          searchTerms.pop();
          searchTerms = searchTerms;
          lastSearchTermDeleteMode = false;
        }
      }
    } else if (event.key === "Escape") {
      lastSearchTermDeleteMode = false;
      suggestions = [];
    } else {
      lastSearchTermDeleteMode = false;
    }
  }
  function addSearchTermFromSuggestion(index) {
    searchTerms.push(suggestions[index]);
    searchTerms = searchTerms;
  }
  function deleteSearchTerm(index) {
    searchTerms.splice(index, 1);
    searchTerms = searchTerms;
  }
  $: fetchSuggestion(searchInput)
</script>

Selected:
<ol>
  {#each searchTerms as searchTerm, index}
    <li>
      {searchTerm.name} / {searchTerm.type}
      {#if lastSearchTermDeleteMode && index === searchTerms.length - 1}
        d
      {/if}
      <span on:click={()=> deleteSearchTerm(index)}>delete</span>
    </li>
  {/each}
</ol>

<input bind:value={searchInput} on:keydown={handleKeydown} />

<ol>
  {#each suggestions as suggestion, index}
    <li 
      class="{index === highlightedSuggestionIndex ? 'highlight' : '' }"
      on:click={()=> addSearchTermFromSuggestion(index)}
      on:mouseover={()=> highlightedSuggestionIndex = index}
    >
      {suggestion.name} / {suggestion.type}
    </li>
  {/each}
</ol>

<style>
  .highlight {
    background: #ddd;
  }
</style>