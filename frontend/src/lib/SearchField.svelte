<script lang="ts">
  import { type SearchTerm } from './searchTerm';
  import { debounce } from './utils';

  let highlightedSuggestionIndex = 0;
  let searchInput = ""
  let suggestions: SearchTerm[] = [];
  export let searchTerms: SearchTerm[] = [];
  let lastSearchTermDeleteMode = false;
  let inputElement: HTMLInputElement | null = null;
  let suggestionElements: HTMLElement[] = [];
  let isLoading = false;

  const fetchSuggestion = debounce(async (input)=> {
    highlightedSuggestionIndex = 0;
    if (!input.length) {
      suggestions = [];
      return;
    }
    isLoading = true;
    const res = await fetch(`/api/searchSuggestion/${input}`);
    const json = await res.json();
    isLoading = false;
    suggestions = json.filter(j => searchTerms.find(s=> s.type === j.type && s.name === j.name) === undefined);
  });
  function handleKeydown(event: KeyboardEvent) {
    if (event.key === "ArrowUp") {
      event.preventDefault();
      highlightedSuggestionIndex = Math.max(0, highlightedSuggestionIndex - 1);
    } else if (event.key === "ArrowDown") {
      event.preventDefault();
      highlightedSuggestionIndex = Math.min(suggestions.length - 1, highlightedSuggestionIndex + 1);
    } else if (event.key === "Enter" || event.key === "Tab" && suggestions[highlightedSuggestionIndex]) {
      event.preventDefault();
      addSearchTermFromSuggestion(highlightedSuggestionIndex);
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
    const suggestion = suggestions[index];
    const sameTerm = searchTerms.find(s => s.type === suggestion.type && s.name === suggestion.name);
    if (!sameTerm) {
      searchTerms.push(suggestion);
    } 
    suggestions = [];
    searchInput = "";
    searchTerms = searchTerms;
    inputElement?.focus();
  }
  function deleteSearchTerm(index) {
    searchTerms.splice(index, 1);
    searchTerms = searchTerms;
  }
  function scrollToSuggestion(index) {
    const element = suggestionElements[index];
    if (!element) return;
    element.scrollIntoView({
      block: 'nearest'
    });
  }
  function placeholder(terms): string {
    return terms.length ? "" : "Suche nach Nährstoff, Produkt oder Kategorie";
  }
  $: fetchSuggestion(searchInput)
  $: scrollToSuggestion(highlightedSuggestionIndex);
</script>

<div class="container" on:click={()=> inputElement?.focus()}>
  {#each searchTerms as searchTerm, index}
    <span class="selected-item {searchTerm.type} {lastSearchTermDeleteMode && index === searchTerms.length - 1 ? 'delete-mode' : ''}">
      <span class="selected-item-type">{searchTerm.type}</span>{searchTerm.name}
      
      <span class="delete" on:click={()=> deleteSearchTerm(index)}>✕</span>
    </span>
  {/each}
  <input
    bind:this={inputElement}
    bind:value={searchInput}
    on:keydown={handleKeydown}
    placeholder={placeholder(searchTerms)}
  />
  {#if isLoading}
  <div class="loading"></div>
  {/if}
</div>

{#if suggestions.length > 0}
  <ul class="suggestions">
    {#each suggestions as suggestion, index}
      <li 
        class="suggestion {index === highlightedSuggestionIndex ? 'highlight' : '' }"
        bind:this={suggestionElements[index]}
        on:click={()=> addSearchTermFromSuggestion(index)}
        on:mouseover={()=> highlightedSuggestionIndex = index}
      >
        <span class="suggestion-type">{suggestion.type}</span>
        {suggestion.name}
      </li>
    {/each}
  </ul>
{/if}

<style>
  .container {
    border: 1px solid #ddd;
    min-height: 50px;
    position: relative;
    display: flex;
    max-width: 100%;
    flex-wrap: wrap;
  }
  .container input {
    border: none;
    height: 50px;
    flex-grow: 1;
    flex-shrink: 1;
    background: transparent;
    font-size: 24px;
    width: 0;
    min-width: 100px;
  }
  .container input:focus {
    border: none;
    outline: none;
  }
  .container:focus-within {
    outline: solid 2px black;
  }
  .selected-item {
    position: relative;
    display: inline-block;
    border-radius: 10px;
    margin: 5px;
    padding: 5px 10px;
    font-size: 14px;
  }
  .selected-item.name {
    background: var(--search-name-color);
  }
  .selected-item.synonym {
    background: var(--search-synonym-color);
  }
  .selected-item.kategorie {
    background: var(--search-kategorie-color);
    color: var(--white-text-color);
  }
  .selected-item.nährstoff {
    background: var(--search-vitamin-color);
    color: var(--white-text-color);
  }
  .selected-item-type {
    display: block;
    font-size: 0.7em;
    margin-right: 10px;
  }
  .selected-item.delete-mode {
    outline: dashed 2px #f7180c;
  }
  .selected-item .delete {
    position: absolute;
    top: 0;
    right: 5px;
  }
  .selected-item .delete:hover {
    color: gray;
    cursor: pointer;
  }
  .suggestions {
    position: absolute;
    list-style: none;
    overflow: scroll;
    max-height: 400px;
    max-width: 500px;
    box-shadow: 0px 5px 10px rgba(115, 115, 115, 0.63);
    border: solid 1px #bbb;
    border-radius: 10px;
    padding: 5px 10px;
    background-color: var(--secondary-background-color);
  }
  .suggestion {
    border-radius: 5px;
    padding: 5px 10px;
    margin: 5px 0;
    cursor: pointer;
  }
  .suggestion-type {
    display: block;
    font-size: 0.7em;
  }
  .highlight {
    background: var(--highlight-background-color);
  }
  .loading {
    align-self: center;
    margin-right: 5px;
  }
</style>
