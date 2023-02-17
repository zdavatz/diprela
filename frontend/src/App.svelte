<script lang="ts">
  import { searchTermsToURL, urlToSearchTerms, type SearchTerm } from './lib/searchTerm';
  import SearchField from './lib/SearchField.svelte';
  import SearchResults from "./lib/SearchResults.svelte";

  let searchTerms = [];

  function setSearchTermURL(terms: SearchTerm[]) {
    const newURL = searchTermsToURL(terms);
    if (newURL !== new URL(document.location.href).pathname) {
      history.pushState(null, '', newURL);
    }
  }

  $: setSearchTermURL(searchTerms);

  function loadSearchTermsFromURL() {
    searchTerms = urlToSearchTerms(document.location.href);
  }
  loadSearchTermsFromURL();
</script>

<svelte:window on:popstate={loadSearchTermsFromURL} />

<main>
  <SearchField bind:searchTerms={searchTerms} />
  <SearchResults searchTerms={searchTerms} />
</main>
