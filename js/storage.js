// IndexedDB wrapper for local storage
class IssueStorage {
  constructor() {
    this.db = null;
  }

  async init() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(CONFIG.DB_NAME, CONFIG.DB_VERSION);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve(this.db);
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains(CONFIG.STORE_NAME)) {
          const store = db.createObjectStore(CONFIG.STORE_NAME, { keyPath: 'alias_id' });
          store.createIndex('created_at', 'created_at', { unique: false });
          store.createIndex('resolved_at', 'resolved_at', { unique: false });
        }
      };
    });
  }

  async addIssue(issue) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([CONFIG.STORE_NAME], 'readwrite');
      const store = transaction.objectStore(CONFIG.STORE_NAME);
      const request = store.add(issue);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async getIssue(aliasId) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([CONFIG.STORE_NAME], 'readonly');
      const store = transaction.objectStore(CONFIG.STORE_NAME);
      const request = store.get(aliasId);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async getAllIssues() {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([CONFIG.STORE_NAME], 'readonly');
      const store = transaction.objectStore(CONFIG.STORE_NAME);
      const request = store.getAll();

      request.onsuccess = () => {
        // Sort by created_at descending (newest first)
        const issues = request.result.sort((a, b) =>
          new Date(b.created_at) - new Date(a.created_at)
        );
        resolve(issues);
      };
      request.onerror = () => reject(request.error);
    });
  }

  async updateIssue(aliasId, updates) {
    const issue = await this.getIssue(aliasId);
    if (!issue) throw new Error('Issue not found');

    const updatedIssue = { ...issue, ...updates };

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([CONFIG.STORE_NAME], 'readwrite');
      const store = transaction.objectStore(CONFIG.STORE_NAME);
      const request = store.put(updatedIssue);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async issueExists(aliasId) {
    const issue = await this.getIssue(aliasId);
    return !!issue;
  }

  // Add or update issue (upsert)
  async upsertIssue(issue) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([CONFIG.STORE_NAME], 'readwrite');
      const store = transaction.objectStore(CONFIG.STORE_NAME);
      const request = store.put(issue);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }
}

const storage = new IssueStorage();
