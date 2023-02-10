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
  let inputElement: HTMLInputElement | null = null;
  let suggestionElements: HTMLElement[] = [];

  const fetchSuggestion = debounce(async (input)=> {
    highlightedSuggestionIndex = 0;
    if (!input.length) {
      suggestions = [];
      return;
    }
    const res = await fetch(`/api/searchSuggestion/${input}`);
    const json = await res.json();
    suggestions = json;
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
    const indexOfSameType = searchTerms.findIndex(s => s.type === suggestion.type);
    if (indexOfSameType === -1) {
      searchTerms.push(suggestion);
    } else {
      searchTerms.splice(indexOfSameType, 1, suggestion);
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
  $: fetchSuggestion(searchInput)
  $: scrollToSuggestion(highlightedSuggestionIndex);
</script>

<div class="container" on:click={()=> inputElement?.focus()}>
  {#each searchTerms as searchTerm, index}
    <span class="selected-item {lastSearchTermDeleteMode && index === searchTerms.length - 1 ? 'delete-mode' : ''}">
      <span class="selected-item-type">{searchTerm.type}</span>{searchTerm.name}
      
      <span class="delete" on:click={()=> deleteSearchTerm(index)}>✕</span>
    </span>
  {/each}
  <input bind:this={inputElement} bind:value={searchInput} on:keydown={handleKeydown} />
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
    width: 500px;
    flex-wrap: wrap;
  }
  .container input {
    border: none;
    height: 50px;
    flex-grow: 1;
    flex-shrink: 1;
    /* background: rgba(255,0,0,0.4); */
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
    background: #f9c64f;
    border-radius: 10px;
    margin: 5px;
    padding: 5px 10px;
    font-size: 14px;
  }
  .selected-item-type {
    display: block;
    font-size: 0.7em;
  }
  .selected-item.delete-mode {
    background-color: #ff918b;
  }
  .selected-item .delete {
    position: absolute;
    top: 0;
    right: 5px;
  }
  .selected-item .delete:hover {
    color: red;
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
    background: #ddd;
  }
</style>
