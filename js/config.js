// Configuration
const CONFIG = {
  // Replace with your deployed Google Apps Script Web App URL
  GOOGLE_SCRIPT_URL: 'https://script.google.com/macros/s/AKfycbyb05gSGOBj153CAPsCsGcTMzDFYjKg8F1avrhcDoHsHmNNlnenFrz0Ljr2YpiZTOIy/exec',

  ERROR_TYPES: [
    { value: 'UI_BUG', label: 'UI Bug' },
    { value: 'API_ERROR', label: 'API Error' },
    { value: 'PERFORMANCE', label: 'Performance Issue' },
    { value: 'SECURITY', label: 'Security Concern' },
    { value: 'OTHER', label: 'Other' }
  ],

  DB_NAME: 'IssueTrackerDB',
  DB_VERSION: 1,
  STORE_NAME: 'issues'
};
