# Issue Tracker

A lightweight, zero-cost issue tracking system with a static frontend and Google Sheets as the database. Perfect for small teams or personal projects.

## Features

- ✅ **Create Issues** - Report bugs with custom alias IDs, error types, and descriptions
- 🔍 **Find Issues** - Search for any issue by alias ID from the central database
- ✅ **Resolve Issues** - Mark issues as resolved with submission status tracking
- 🗑️ **Delete Issues** - Remove issues from both local storage and Google Sheets
- 📊 **Status Tracking** - Multiple submission statuses (Fixed, Won't Fix, Duplicate, etc.)
- ⏱️ **Time Tracking** - Automatic calculation of time elapsed from creation to resolution
- 🎨 **Visual Indicators** - Color-coded rows (red for unresolved, white for resolved)
- 🔄 **Offline First** - IndexedDB local storage with background sync to Google Sheets
- 📱 **Responsive Design** - Works on desktop and mobile devices

## Tech Stack

- **Frontend**: Static HTML/CSS/JavaScript (vanilla)
- **Backend**: Google Apps Script Web App
- **Database**: Google Sheets
- **Local Storage**: IndexedDB
- **Hosting**: Vercel (or any static hosting)
- **Total Cost**: $0/month

## File Structure

```
issue-tracker/
├── index.html              # Raise Issue page
├── my-issues.html          # My Issues page
├── README.md               # This file
├── css/
│   └── styles.css          # All styling
├── js/
│   ├── config.js           # Google Apps Script URL & constants
│   ├── storage.js          # IndexedDB wrapper
│   ├── api.js              # Google Apps Script API calls
│   ├── raise-issue.js      # Issue creation logic
│   ├── my-issues.js        # Table rendering & resolve/delete logic
│   └── modal.js            # Find issue modal
├── google-apps-script/
│   └── Code.gs             # Google Apps Script backend
└── vercel.json             # Vercel deployment config
```

---

## Setup Instructions

### Part 1: Google Apps Script Backend Setup

#### Step 1: Create Google Sheet

1. Go to [Google Sheets](https://sheets.google.com)
2. Create a new spreadsheet
3. Rename it to "Issue Tracker" (or any name you prefer)
4. Add the following column headers in the first row:
   ```
   alias_id | error_type | description | created_at | resolved_at | time_elapsed | submission_status
   ```

#### Step 2: Get Sheet ID

- Copy the Sheet ID from the URL:
  ```
  https://docs.google.com/spreadsheets/d/SHEET_ID_HERE/edit
  ```

#### Step 3: Create Apps Script

1. In your Google Sheet, go to **Extensions** → **Apps Script**
2. Delete any existing code
3. Copy the entire contents of `google-apps-script/Code.gs` from this repo
4. Paste it into the Apps Script editor
5. **Replace the `SHEET_ID`** on line 16 with your actual Sheet ID:
   ```javascript
   const SHEET_ID = "YOUR_SHEET_ID_HERE";
   ```
6. If your sheet has a different name than "Sheet1", update line 17:
   ```javascript
   const SHEET_NAME = "Sheet1"; // Change to your sheet name
   ```

#### Step 4: Deploy Web App

1. Click **Deploy** → **New deployment**
2. Click the gear icon ⚙️ next to "Select type"
3. Choose **Web app**
4. Configure:
   - **Description**: Issue Tracker API (or any description)
   - **Execute as**: Me
   - **Who has access**: Anyone
5. Click **Deploy**
6. **Authorize the app** (you may see a warning - click "Advanced" → "Go to [Project Name] (unsafe)")
7. **Copy the Web App URL** (it looks like: `https://script.google.com/macros/s/XXXXX/exec`)

#### Step 5: Test the Setup (Optional)

1. In Apps Script editor, click the function dropdown
2. Select `testSetup`
3. Click **Run**
4. Check the execution log (View → Logs) - should show "Sheet found!"

---

### Part 2: Frontend Setup

#### Step 1: Update Configuration

1. Open `js/config.js`
2. Replace the `GOOGLE_SCRIPT_URL` with your Web App URL:
   ```javascript
   GOOGLE_SCRIPT_URL: 'https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec',
   ```

#### Step 2: Test Locally

1. Open `index.html` in a browser (or use a local server)
2. Create a test issue:
   - Alias ID: `test-001`
   - Error Type: API Error
   - Description: Test issue
3. Click "Report Error"
4. Check your Google Sheet - the issue should appear

#### Step 3: Test My Issues Page

1. Open `my-issues.html`
2. You should see the test issue in the table
3. Try resolving it with a submission status
4. Try deleting it

---

### Part 3: Deployment (Vercel)

#### Option A: Deploy with Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Navigate to project directory
cd issue-tracker

# Deploy
vercel
```

#### Option B: Deploy via GitHub

1. Push this repo to GitHub
2. Go to [vercel.com](https://vercel.com)
3. Click "New Project"
4. Import your GitHub repository
5. Click "Deploy"

The `vercel.json` file is already configured for clean URLs.

---

## Usage Guide

### Creating an Issue

1. Go to the "Raise Issue" page
2. Enter a unique **Alias ID** (e.g., `BUG-001`, `PERF-042`)
3. Select an **Error Type** (UI Bug, API Error, Performance, Security, Other)
4. Describe the issue
5. Click "Report Error"
6. You'll be redirected to "My Issues" automatically

### Viewing Your Issues

1. Go to "My Raised Issues"
2. See all issues in a sortable table
3. Use the **"Show only unresolved"** filter to hide resolved issues
4. Click **"Find Issue by ID"** to search for any issue in the database

### Resolving an Issue

1. In "My Issues", click the green **"Resolve"** button
2. Select a **Submission Status**:
   - ✅ **Fixed** - Issue has been resolved
   - 🚫 **Won't Fix** - Decided not to fix
   - 🔁 **Duplicate** - Duplicate of another issue
   - ❓ **Cannot Reproduce** - Unable to reproduce the issue
   - ✔️ **Resolved** - General resolution
3. Click "Submit"
4. The issue will show the resolution time and status

### Deleting an Issue

1. Click the **trash bin icon** (🗑️) next to any issue
2. Confirm the deletion
3. The issue is removed from both local storage and Google Sheets

### Finding Any Issue

1. Click **"Find Issue by ID"** in "My Issues"
2. Enter the alias ID
3. Click "Search"
4. If found, you can resolve it directly from the modal
5. The issue will be saved to your local storage after resolution

---

## Configuration

### Error Types

Edit error types in `js/config.js`:

```javascript
ERROR_TYPES: [
  { value: 'UI_BUG', label: 'UI Bug' },
  { value: 'API_ERROR', label: 'API Error' },
  { value: 'PERFORMANCE', label: 'Performance Issue' },
  { value: 'SECURITY', label: 'Security Concern' },
  { value: 'OTHER', label: 'Other' }
]
```

### Submission Statuses

Edit submission statuses in `js/config.js`:

```javascript
SUBMISSION_STATUS_OPTIONS: [
  { value: 'FIXED', label: '✅ Fixed' },
  { value: 'WONT_FIX', label: '🚫 Won\'t Fix' },
  { value: 'DUPLICATE', label: '🔁 Duplicate' },
  { value: 'CANNOT_REPRODUCE', label: '❓ Cannot Reproduce' },
  { value: 'RESOLVED', label: '✔️ Resolved' }
]
```

---

## How It Works

### Data Flow

```
User Action → IndexedDB (local) → Google Apps Script → Google Sheet
                    ↓                     ↓
              My Issues Table        Central Database
```

### Optimistic Updates

- **Create**: Saves to IndexedDB first, syncs to Sheets in background
- **Resolve**: Updates Sheets first (needs calculated time), then updates local
- **Delete**: Deletes from IndexedDB first, syncs to Sheets in background

### Conditional Formatting

Google Sheets automatically highlights:
- **Unresolved issues**: Light red background (#ffcccc)
- **Resolved issues**: White/default background

---

## Troubleshooting

### Issue not appearing in Google Sheet

1. Check browser console for errors
2. Verify `GOOGLE_SCRIPT_URL` in `js/config.js` is correct
3. Ensure Apps Script deployment is set to "Anyone" access
4. Check Apps Script execution logs: Apps Script Editor → **Executions**

### Submission status not updating

1. Redeploy the Google Apps Script:
   - Deploy → Manage deployments → Edit → New version → Deploy
2. Check that the `submission_status` column exists in your sheet
3. Verify column headers match exactly (case-sensitive)

### Delete not working

1. Redeploy the Google Apps Script (same as above)
2. Check browser console for errors

### Time elapsed not calculating

- Ensure `created_at` and `resolved_at` columns have valid ISO timestamps
- Check the `formatTimeElapsed()` function in `Code.gs`

---

## Advanced Features

### Customizing the UI

Edit `css/styles.css` to change colors, fonts, spacing, etc.

### Adding More Columns

1. Add column to Google Sheet
2. Update `Code.gs` `handleCreate()` to include the new field
3. Update frontend forms and table to display the new field

### Multi-User Support

The current setup uses browser-local IndexedDB. For multi-user:
- Use Google Sheets as the single source of truth
- Fetch all issues from Sheets on page load (modify `doGet` in Code.gs)
- Remove IndexedDB dependency

---

## License

MIT License - Feel free to use this for any purpose.

---

## Support

For issues or questions, please open an issue on GitHub.

---

**Built with ❤️ using vanilla JavaScript and Google Apps Script**
