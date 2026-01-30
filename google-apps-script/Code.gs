/**
 * Issue Tracker - Google Apps Script Backend
 *
 * SETUP INSTRUCTIONS:
 * 1. Create a new Google Sheet with columns: alias_id, error_type, description, created_at, resolved_at, time_elapsed
 * 2. Go to Extensions > Apps Script
 * 3. Copy this entire code into Code.gs
 * 4. Replace SHEET_ID below with your Google Sheet ID (from the URL)
 * 5. Deploy > New Deployment > Web App
 *    - Execute as: Me
 *    - Who has access: Anyone
 * 6. Copy the Web App URL and paste it into js/config.js
 */

// Replace with your Google Sheet ID (found in the sheet URL)
const SHEET_ID = 'YOUR_GOOGLE_SHEET_ID_HERE';
const SHEET_NAME = 'Sheet1'; // Change if your sheet has a different name

/**
 * Handle GET requests (fetch issue by alias_id)
 */
function doGet(e) {
  try {
    const sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName(SHEET_NAME);
    const data = sheet.getDataRange().getValues();

    if (data.length === 0) {
      return createJsonResponse({ success: false, error: 'Sheet is empty' });
    }

    const headers = data[0];
    const aliasId = e.parameter.alias_id;

    if (aliasId) {
      // Find specific issue by alias_id
      for (let i = 1; i < data.length; i++) {
        if (data[i][0] === aliasId) {
          const issue = rowToObject(headers, data[i]);
          return createJsonResponse({ success: true, issue: issue });
        }
      }
      return createJsonResponse({ success: false, error: 'Issue not found' });
    }

    // Return all issues
    const issues = [];
    for (let i = 1; i < data.length; i++) {
      issues.push(rowToObject(headers, data[i]));
    }

    return createJsonResponse({ success: true, issues: issues });

  } catch (error) {
    return createJsonResponse({ success: false, error: error.toString() });
  }
}

/**
 * Handle POST requests (create or resolve issue)
 */
function doPost(e) {
  try {
    const sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName(SHEET_NAME);
    const data = JSON.parse(e.postData.contents);

    if (data.action === 'create') {
      return handleCreate(sheet, data);
    }

    if (data.action === 'resolve') {
      return handleResolve(sheet, data);
    }

    return createJsonResponse({ success: false, error: 'Invalid action' });

  } catch (error) {
    return createJsonResponse({ success: false, error: error.toString() });
  }
}

/**
 * Create a new issue
 */
function handleCreate(sheet, data) {
  const aliasId = data.alias_id;

  // Check for duplicate alias_id
  const existingData = sheet.getDataRange().getValues();
  for (let i = 1; i < existingData.length; i++) {
    if (existingData[i][0] === aliasId) {
      return createJsonResponse({
        success: false,
        error: 'Alias ID already exists'
      });
    }
  }

  // Append new row
  sheet.appendRow([
    data.alias_id,
    data.error_type,
    data.description,
    data.created_at,
    '',  // resolved_at
    ''   // time_elapsed
  ]);

  return createJsonResponse({ success: true });
}

/**
 * Resolve an existing issue
 */
function handleResolve(sheet, data) {
  const aliasId = data.alias_id;
  const existingData = sheet.getDataRange().getValues();

  for (let i = 1; i < existingData.length; i++) {
    if (existingData[i][0] === aliasId) {
      // Check if already resolved
      if (existingData[i][4]) {
        return createJsonResponse({
          success: false,
          error: 'Issue is already resolved'
        });
      }

      const createdAt = new Date(existingData[i][3]);
      const resolvedAt = new Date();
      const diffMs = resolvedAt - createdAt;

      // Calculate time elapsed in human-readable format
      const timeElapsed = formatTimeElapsed(diffMs);

      // Update the row (columns are 1-indexed in setRange)
      sheet.getRange(i + 1, 5).setValue(resolvedAt.toISOString()); // resolved_at
      sheet.getRange(i + 1, 6).setValue(timeElapsed); // time_elapsed

      return createJsonResponse({
        success: true,
        resolved_at: resolvedAt.toISOString(),
        time_elapsed: timeElapsed
      });
    }
  }

  return createJsonResponse({
    success: false,
    error: 'Issue not found'
  });
}

/**
 * Convert a row array to an object using headers
 */
function rowToObject(headers, row) {
  const obj = {};
  headers.forEach((header, index) => {
    obj[header] = row[index] || null;
  });
  return obj;
}

/**
 * Format time elapsed in human-readable format
 */
function formatTimeElapsed(diffMs) {
  const seconds = Math.floor(diffMs / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) {
    const remainingHours = hours % 24;
    return `${days}d ${remainingHours}h`;
  } else if (hours > 0) {
    const remainingMinutes = minutes % 60;
    return `${hours}h ${remainingMinutes}m`;
  } else if (minutes > 0) {
    return `${minutes}m`;
  } else {
    return `${seconds}s`;
  }
}

/**
 * Create a JSON response with proper CORS handling
 */
function createJsonResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Test function - run this to verify your setup
 */
function testSetup() {
  try {
    const sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName(SHEET_NAME);
    const data = sheet.getDataRange().getValues();
    Logger.log('Sheet found! Headers: ' + data[0].join(', '));
    Logger.log('Number of rows (including header): ' + data.length);
    return true;
  } catch (error) {
    Logger.log('Error: ' + error.toString());
    return false;
  }
}
