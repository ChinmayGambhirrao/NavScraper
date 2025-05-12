export const selectors = {
  // Search results container
  resultsContainer: '.search-results-container',
  
  // Individual profile cards
  profileCard: '.artdeco-list__item',
  
  // Profile information
  name: '.artdeco-entity-lockup__title',
  title: '.artdeco-entity-lockup__subtitle',
  company: '.artdeco-entity-lockup__caption',
  location: '.artdeco-entity-lockup__metadata-item',
  
  // Links
  profileLink: 'a.artdeco-entity-lockup__title-link',
  linkedInLink: 'a.artdeco-entity-lockup__subtitle-link',
  
  // Navigation
  nextButton: 'button.artdeco-pagination__button--next',
  paginationContainer: '.artdeco-pagination',
  
  // Loading states
  loadingIndicator: '.artdeco-loader',
  
  // Error states
  errorMessage: '.artdeco-inline-feedback--error',
  
  // Optional fields (may not always be present)
  optionalFields: {
    industry: '.artdeco-entity-lockup__metadata-item--industry',
    companySize: '.artdeco-entity-lockup__metadata-item--company-size',
    connectionDegree: '.artdeco-entity-lockup__metadata-item--connection-degree'
  }
} as const; 