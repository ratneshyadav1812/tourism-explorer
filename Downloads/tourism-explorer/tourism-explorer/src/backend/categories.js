// Query text -> Geoapify categories. To support a new query pattern, add a row here.
// Verify names against https://apidocs.geoapify.com/docs/places/#categories
export const CATEGORIES = [
  { key: 'museum',   label: 'Museums',    test: /museums?|galler(y|ies)/i,                    geo: 'entertainment.museum' },
  { key: 'worship',  label: 'Temples',    test: /temples?|church(es)?|mosques?|shrines?|gurudwaras?/i, geo: 'tourism.sights.place_of_worship,religion.place_of_worship' },
  { key: 'fort',     label: 'Forts',      test: /forts?|castles?|palaces?/i,                  geo: 'tourism.sights.fort,tourism.sights.castle' },
  { key: 'monument', label: 'Monuments',  test: /monuments?|memorials?/i,                     geo: 'tourism.sights.monument,tourism.sights.memorial' },
  { key: 'park',     label: 'Parks',      test: /parks?|gardens?/i,                           geo: 'leisure.park' },
  { key: 'viewpoint',label: 'Viewpoints', test: /viewpoints?|lookouts?/i,                     geo: 'tourism.attraction.viewpoint' },
  { key: 'historic', label: 'Historic',   test: /historic(al)?\s+sites?|ruins?|heritage/i,    geo: 'tourism.sights.archaeological_site,heritage' },
];
export const DEFAULT = { key: 'all', label: 'All sights', geo: 'tourism.sights' };

export const byKey = (k) => CATEGORIES.find((c) => c.key === k) || DEFAULT;
export const detect = (q = '') => CATEGORIES.find((c) => c.test.test(q)) || DEFAULT;

// Safety net: never show these as primary results
export const BLOCK = /catering|accommodation|commercial|service\.|office\.|building\.(residential|commercial)/;
