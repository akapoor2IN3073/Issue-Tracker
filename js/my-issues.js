// My Issues page logic
let currentResolvingIssueId = null;

document.addEventListener('DOMContentLoaded', async () => {
  await storage.init();

  const tableBody = document.getElementById('issues-body');
  const filterCheckbox = document.getElementById('filter-unresolved');
  const findBtn = document.getElementById('find-issue-btn');
  const emptyState = document.getElementById('empty-state');
  const tableWrapper = document.querySelector('.table-wrapper');

  // Populate submission status dropdown
  const submissionStatusSelect = document.getElementById('submission-status');
  CONFIG.SUBMISSION_STATUS_OPTIONS.forEach(option => {
    const optionEl = document.createElement('option');
    optionEl.value = option.value;
    optionEl.textContent = option.label;
    submissionStatusSelect.appendChild(optionEl);
  });

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
        <td>${issue.submission_status ? escapeHtml(formatSubmissionStatus(issue.submission_status)) : '-'}</td>
        <td class="actions">
          ${!issue.resolved_at
            ? `<button class="btn-resolve" data-id="${escapeHtml(issue.alias_id)}">Resolve</button>`
            : '<span class="status-resolved">Resolved</span>'}
          <button class="btn-delete" data-id="${escapeHtml(issue.alias_id)}" title="Delete issue">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M5.5 5.5V14.5H10.5V5.5H5.5Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M2 3.5H14" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
              <path d="M6.5 1.5H9.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
            </svg>
          </button>
        </td>
      `;

      tableBody.appendChild(row);
    });

    // Attach resolve button handlers
    document.querySelectorAll('.btn-resolve').forEach(btn => {
      btn.addEventListener('click', handleResolve);
    });

    // Attach delete button handlers
    document.querySelectorAll('.btn-delete').forEach(btn => {
      btn.addEventListener('click', handleDeleteClick);
    });
  }

  function handleResolve(e) {
    const aliasId = e.target.dataset.id;
    currentResolvingIssueId = aliasId;

    // Open resolve modal
    document.getElementById('resolve-issue-id').textContent = `Issue: ${aliasId}`;
    document.getElementById('submission-status').value = '';
    document.getElementById('resolve-modal').classList.remove('hidden');
  }

  async function handleDeleteClick(e) {
    const aliasId = e.target.dataset.id;

    if (!confirm(`Are you sure you want to delete issue "${aliasId}"?`)) {
      return;
    }

    try {
      // 1. Delete from local storage first (optimistic)
      await storage.deleteIssue(aliasId);

      // 2. Re-render table immediately
      await renderIssues();

      // 3. Delete from Google Sheet in background
      API.deleteIssue(aliasId).then(result => {
        if (!result.success) {
          console.error('Failed to delete from Google Sheet:', result.error);
        }
      }).catch(error => {
        console.error('Error deleting from Google Sheet:', error);
      });

    } catch (error) {
      console.error('Error deleting issue:', error);
      alert('Failed to delete issue. Please try again.');
    }
  }

  function calculateTimeElapsed(createdAt, resolvedAt) {
    const diffMs = resolvedAt - new Date(createdAt);
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

  async function handleResolveSubmit() {
    const aliasId = currentResolvingIssueId;
    const submissionStatus = document.getElementById('submission-status').value;
    const submitBtn = document.getElementById('resolve-submit-btn');

    if (!submissionStatus) {
      alert('Please select a submission status');
      return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = 'Submitting...';

    try {
      // Calculate resolved_at and time_elapsed locally
      const resolvedAt = new Date();
      const resolvedAtISO = resolvedAt.toISOString();

      // Get the issue to calculate time elapsed
      const existsLocally = await storage.issueExists(aliasId);
      let timeElapsed = '';

      if (existsLocally) {
        const issue = await storage.getIssue(aliasId);
        timeElapsed = calculateTimeElapsed(issue.created_at, resolvedAt);

        // 1. Update local storage first (optimistic)
        await storage.updateIssue(aliasId, {
          resolved_at: resolvedAtISO,
          time_elapsed: timeElapsed,
          submission_status: submissionStatus
        });
      } else {
        // Issue was found via Find modal - fetch full data first
        const fetchResult = await API.findIssue(aliasId);
        if (fetchResult.success && fetchResult.issue) {
          timeElapsed = calculateTimeElapsed(fetchResult.issue.created_at, resolvedAt);

          await storage.upsertIssue({
            ...fetchResult.issue,
            resolved_at: resolvedAtISO,
            time_elapsed: timeElapsed,
            submission_status: submissionStatus
          });
        }
      }

      // 2. Close modal and re-render table immediately
      closeResolveModal();
      await renderIssues();

      // 3. Update Google Sheet in background
      API.resolveIssue(aliasId, submissionStatus).then(result => {
        if (!result.success) {
          console.error('Failed to resolve in Google Sheet:', result.error);
        }
      }).catch(error => {
        console.error('Error resolving in Google Sheet:', error);
      });

    } catch (error) {
      console.error('Error resolving issue:', error);
      alert('Failed to resolve issue. Please try again.');
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Submit';
    }
  }

  function closeResolveModal() {
    document.getElementById('resolve-modal').classList.add('hidden');
    currentResolvingIssueId = null;
  }

  filterCheckbox.addEventListener('change', renderIssues);
  findBtn.addEventListener('click', openFindModal);

  // Resolve modal event listeners
  document.getElementById('resolve-close-btn').addEventListener('click', closeResolveModal);
  document.getElementById('resolve-submit-btn').addEventListener('click', handleResolveSubmit);

  // Close modal on background click
  document.getElementById('resolve-modal').addEventListener('click', (e) => {
    if (e.target.id === 'resolve-modal') {
      closeResolveModal();
    }
  });

  // Close modal on Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !document.getElementById('resolve-modal').classList.contains('hidden')) {
      closeResolveModal();
    }
  });

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

function formatSubmissionStatus(status) {
  // Find the label from CONFIG.SUBMISSION_STATUS_OPTIONS
  const option = CONFIG.SUBMISSION_STATUS_OPTIONS.find(opt => opt.value === status);
  return option ? option.label : status;
}

// Add hidden class style
const style = document.createElement('style');
style.textContent = '.hidden { display: none !important; }';
document.head.appendChild(style);
