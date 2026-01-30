// API functions to communicate with Google Apps Script
const API = {
  // Create new issue in Google Sheet
  async createIssue(issue) {
    try {
      const response = await fetch(CONFIG.GOOGLE_SCRIPT_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8',
        },
        body: JSON.stringify({
          action: 'create',
          ...issue
        })
      });
      return response.json();
    } catch (error) {
      console.error('API createIssue error:', error);
      throw error;
    }
  },

  // Resolve issue in Google Sheet
  async resolveIssue(aliasId) {
    try {
      const response = await fetch(CONFIG.GOOGLE_SCRIPT_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8',
        },
        body: JSON.stringify({
          action: 'resolve',
          alias_id: aliasId
        })
      });
      return response.json();
    } catch (error) {
      console.error('API resolveIssue error:', error);
      throw error;
    }
  },

  // Find issue by alias ID (fetch from Google Sheet)
  async findIssue(aliasId) {
    try {
      const url = `${CONFIG.GOOGLE_SCRIPT_URL}?alias_id=${encodeURIComponent(aliasId)}`;
      const response = await fetch(url);
      return response.json();
    } catch (error) {
      console.error('API findIssue error:', error);
      throw error;
    }
  }
};
