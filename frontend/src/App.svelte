<script lang="ts">
  import type { SvelteComponentTyped } from "svelte";
  import SearchField from './lib/SearchField.svelte'
  import SearchResults from "./lib/SearchResults.svelte";

  let searchTerms = [];
</script>

<main>
  <SearchField bind:searchTerms={searchTerms} />
  <SearchResults searchTerms={searchTerms} />
</main>
