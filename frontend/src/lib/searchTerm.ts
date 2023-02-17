export type SearchTerm = {
  type: 'name' | 'synonym' | 'kategorie' | 'vitamin';
  name: string;
};
export const AllSearchTermTypes: SearchTerm['type'][] = ['name', 'synonym', 'kategorie', 'vitamin'];

function searchTermsToString(terms: SearchTerm[]) {
  if (!terms) return '';
  return terms.map(t =>
    t.type + ':' + encodeURIComponent(t.name)
  ).join(',');
}

function searchTermsToURL(terms: SearchTerm[]): string {
  if (terms.length === 0) return '';
  return '/search/' + searchTermsToString(terms);
}

function urlToSearchTerms(location: string): SearchTerm[] {
  const url = new URL(location);
  const searchTermsString = url.pathname.split('/')[2];
  return searchTermsString.split(',').map(str => {
    const [type, name] = str.split(':');
    return {
      type,
      name: decodeURIComponent(name)
    } as SearchTerm;
  });
}

export { searchTermsToString, searchTermsToURL, urlToSearchTerms }