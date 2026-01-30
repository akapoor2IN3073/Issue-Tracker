// Configuration
const CONFIG = {
  // Replace with your deployed Google Apps Script Web App URL
  GOOGLE_SCRIPT_URL: 'https://script.google.com/macros/s/AKfycbyx66BxJzhkkVTLUhRDBC2gAT30uQR-EjSOGn9UImtXAYiJCD6OxrJKEclAH-WGZsvjyQ/exec',

  ERROR_TYPES: [
    { value: 'UI_BUG', label: 'UI Bug' },
    { value: 'API_ERROR', label: 'API Error' },
    { value: 'PERFORMANCE', label: 'Performance Issue' },
    { value: 'SECURITY', label: 'Security Concern' },
    { value: 'OTHER', label: 'Other' }
  ],

  // Submission status options for resolving issues
  SUBMISSION_STATUS_OPTIONS: [
    { value: 'SKIPPED', label: 'Skipped' },
    { value: 'SUBMITTED', label: 'Submitted' },
  ],

  DB_NAME: 'IssueTrackerDB',
  DB_VERSION: 1,
  STORE_NAME: 'issues'
};
