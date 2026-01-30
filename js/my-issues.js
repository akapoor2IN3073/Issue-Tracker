// My Issues page logic
document.addEventListener('DOMContentLoaded', async () => {
  await storage.init();

  const tableBody = document.getElementById('issues-body');
  const filterCheckbox = document.getElementById('filter-unresolved');
  const findBtn = document.getElementById('find-issue-btn');
  const emptyState = document.getElementById('empty-state');
  const tableWrapper = document.querySelector('.table-wrapper');

  async function renderIssues() {
    const issues = await storage.getAllIssues();
    const showOnlyUnresolved = filterCheckbox.checked;

    tableBody.innerHTML = '';

    const filteredIssues = showOnlyUnresolved
      ? issues.filter(i => !i.resolved_at)
      : issues;

    if (filteredIssues.length === 0) {
      tableWrapper.classList.add('hidden');
      emptyState.classList.remove('hidden');
      emptyState.querySelector('p').textContent = showOnlyUnresolved
        ? 'No unresolved issues found.'
        : 'No issues found.';
      return;
    }

    tableWrapper.classList.remove('hidden');
    emptyState.classList.add('hidden');

    filteredIssues.forEach(issue => {
      const row = document.createElement('tr');
      row.className = issue.resolved_at ? 'resolved' : 'unresolved';

      row.innerHTML = `
        <td>${escapeHtml(issue.alias_id)}</td>
        <td>${escapeHtml(formatErrorType(issue.error_type))}</td>
        <td class="description" title="${escapeHtml(issue.description)}">${escapeHtml(issue.description)}</td>
        <td>${formatDate(issue.created_at)}</td>
        <td>${issue.resolved_at ? formatDate(issue.resolved_at) : '-'}</td>
        <td>${issue.time_elapsed || '-'}</td>
        <td>
          ${!issue.resolved_at
            ? `<button class="btn-resolve" data-id="${escapeHtml(issue.alias_id)}">Resolve</button>`
            : '<span class="status-resolved">Resolved</span>'}
        </td>
      `;

      tableBody.appendChild(row);
    });

    // Attach resolve button handlers
    document.querySelectorAll('.btn-resolve').forEach(btn => {
      btn.addEventListener('click', handleResolve);
    });
  }

  async function handleResolve(e) {
    const btn = e.target;
    const aliasId = btn.dataset.id;

    if (!confirm(`Resolve issue "${aliasId}"?`)) return;

    btn.disabled = true;
    btn.textContent = 'Resolving...';

    try {
      // 1. Update Google Sheet
      const result = await API.resolveIssue(aliasId);

      if (!result.success) {
        alert(`Error: ${result.error || 'Failed to resolve in Google Sheet'}`);
        btn.disabled = false;
        btn.textContent = 'Resolve';
        return;
      }

      // 2. Update local storage
      await storage.updateIssue(aliasId, {
        resolved_at: result.resolved_at,
        time_elapsed: result.time_elapsed
      });

      // 3. Re-render table
      await renderIssues();

    } catch (error) {
      console.error('Error resolving issue:', error);
      alert('Failed to resolve issue. Please try again.');
      btn.disabled = false;
      btn.textContent = 'Resolve';
    }
  }

  filterCheckbox.addEventListener('change', renderIssues);
  findBtn.addEventListener('click', openFindModal);

  // Initial render
  await renderIssues();
});

function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function formatDate(isoString) {
  if (!isoString) return '-';
  const date = new Date(isoString);
  return date.toLocaleString();
}

function formatErrorType(type) {
  const typeMap = {
    'UI_BUG': 'UI Bug',
    'API_ERROR': 'API Error',
    'PERFORMANCE': 'Performance Issue',
    'SECURITY': 'Security Concern',
    'OTHER': 'Other'
  };
  return typeMap[type] || type;
}

// Add hidden class style
const style = document.createElement('style');
style.textContent = '.hidden { display: none !important; }';
document.head.appendChild(style);
