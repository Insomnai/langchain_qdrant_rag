export function createRetriever(vectorStore, options = {}) {
  const {
    k = 4,
    searchType = 'similarity',
    filter = null,
  } = options;

  const retrieverConfig = {
    k,
    searchType,
  };

  if (filter) {
    retrieverConfig.filter = filter;
  }

  return vectorStore.asRetriever(retrieverConfig);
}
