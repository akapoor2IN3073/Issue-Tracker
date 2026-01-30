// Find Issue Modal logic
let currentFoundIssue = null;

function openFindModal() {
  document.getElementById('find-modal').classList.remove('hidden');
  document.getElementById('search-alias').focus();
}

function closeFindModal() {
  document.getElementById('find-modal').classList.add('hidden');
  document.getElementById('search-result').innerHTML = '';
  document.getElementById('search-alias').value = '';
  currentFoundIssue = null;
}

function escapeHtmlModal(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function formatDateModal(isoString) {
  if (!isoString) return '-';
  const date = new Date(isoString);
  return date.toLocaleString();
}

function formatErrorTypeModal(type) {
  const typeMap = {
    'UI_BUG': 'UI Bug',
    'API_ERROR': 'API Error',
    'PERFORMANCE': 'Performance Issue',
    'SECURITY': 'Security Concern',
    'OTHER': 'Other'
  };
  return typeMap[type] || type;
}

document.addEventListener('DOMContentLoaded', () => {
  const modal = document.getElementById('find-modal');
  const closeBtn = modal.querySelector('.close-btn');
  const searchBtn = document.getElementById('search-btn');
  const searchInput = document.getElementById('search-alias');
  const resultDiv = document.getElementById('search-result');

  closeBtn.addEventListener('click', closeFindModal);

  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeFindModal();
  });

  // Close on Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !modal.classList.contains('hidden')) {
      closeFindModal();
    }
  });

  // Search on Enter key
  searchInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      searchBtn.click();
    }
  });

  searchBtn.addEventListener('click', async () => {
    const aliasId = searchInput.value.trim();
    if (!aliasId) {
      resultDiv.innerHTML = '<p class="error">Please enter an Alias ID</p>';
      return;
    }

    resultDiv.innerHTML = '<p class="loading">Searching...</p>';
    searchBtn.disabled = true;

    try {
      const result = await API.findIssue(aliasId);

      if (result.success && result.issue) {
        currentFoundIssue = result.issue;
        const issue = result.issue;
        const isResolved = !!issue.resolved_at;

        resultDiv.innerHTML = `
          <div class="issue-details ${isResolved ? 'resolved' : 'unresolved'}">
            <p><strong>Alias ID:</strong> ${escapeHtmlModal(issue.alias_id)}</p>
            <p><strong>Error Type:</strong> ${escapeHtmlModal(formatErrorTypeModal(issue.error_type))}</p>
            <p><strong>Description:</strong> ${escapeHtmlModal(issue.description)}</p>
            <p><strong>Created:</strong> ${formatDateModal(issue.created_at)}</p>
            <p><strong>Resolved:</strong> ${isResolved ? formatDateModal(issue.resolved_at) : 'Not yet'}</p>
            <p><strong>Time Elapsed:</strong> ${issue.time_elapsed || '-'}</p>
            ${!isResolved ? `
              <div class="resolve-wrapper">
                <button id="modal-resolve-btn" class="btn-resolve">Resolve This Issue</button>
              </div>
            ` : ''}
          </div>
        `;

        // Attach resolve handler if not resolved
        if (!isResolved) {
          document.getElementById('modal-resolve-btn').addEventListener('click', handleModalResolve);
        }
      } else {
        currentFoundIssue = null;
        resultDiv.innerHTML = '<p class="error">Issue not found in database</p>';
      }
    } catch (error) {
      console.error('Search error:', error);
      currentFoundIssue = null;
      resultDiv.innerHTML = '<p class="error">Error searching. Please check your connection and try again.</p>';
    } finally {
      searchBtn.disabled = false;
    }
  });

  async function handleModalResolve() {
    if (!currentFoundIssue) return;

    const aliasId = currentFoundIssue.alias_id;
    const btn = document.getElementById('modal-resolve-btn');

    if (!confirm(`Resolve issue "${aliasId}"?`)) return;

    btn.disabled = true;
    btn.textContent = 'Resolving...';

    try {
      // 1. Update Google Sheet
      const result = await API.resolveIssue(aliasId);

      if (!result.success) {
        alert(`Error: ${result.error || 'Failed to resolve in Google Sheet'}`);
        btn.disabled = false;
        btn.textContent = 'Resolve This Issue';
        return;
      }

      // 2. Update local storage (add if not exists, update if exists)
      const updatedIssue = {
        ...currentFoundIssue,
        resolved_at: result.resolved_at,
        time_elapsed: result.time_elapsed
      };
      await storage.upsertIssue(updatedIssue);

      // 3. Update modal display
      currentFoundIssue = updatedIssue;
      resultDiv.innerHTML = `
        <div class="issue-details resolved">
          <p><strong>Alias ID:</strong> ${escapeHtmlModal(updatedIssue.alias_id)}</p>
          <p><strong>Error Type:</strong> ${escapeHtmlModal(formatErrorTypeModal(updatedIssue.error_type))}</p>
          <p><strong>Description:</strong> ${escapeHtmlModal(updatedIssue.description)}</p>
          <p><strong>Created:</strong> ${formatDateModal(updatedIssue.created_at)}</p>
          <p><strong>Resolved:</strong> ${formatDateModal(updatedIssue.resolved_at)}</p>
          <p><strong>Time Elapsed:</strong> ${updatedIssue.time_elapsed || '-'}</p>
        </div>
        <p class="success" style="margin-top: 1rem;">Issue resolved successfully!</p>
      `;

      // 4. Refresh the table if on my-issues page
      if (typeof renderIssues === 'function') {
        await renderIssues();
      }

    } catch (error) {
      console.error('Error resolving issue from modal:', error);
      alert('Failed to resolve issue. Please try again.');
      btn.disabled = false;
      btn.textContent = 'Resolve This Issue';
    }
  }
});
