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

  function handleResolve(e) {
    const aliasId = e.target.dataset.id;
    currentResolvingIssueId = aliasId;

    // Open resolve modal
    document.getElementById('resolve-issue-id').textContent = `Issue: ${aliasId}`;
    document.getElementById('submission-status').value = '';
    document.getElementById('resolve-modal').classList.remove('hidden');
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
      // 1. Update Google Sheet
      const result = await API.resolveIssue(aliasId, submissionStatus);

      if (!result.success) {
        alert(`Error: ${result.error || 'Failed to resolve in Google Sheet'}`);
        return;
      }

      // 2. Update local storage (check if exists first)
      const existsLocally = await storage.issueExists(aliasId);

      if (existsLocally) {
        // Update existing local issue
        await storage.updateIssue(aliasId, {
          resolved_at: result.resolved_at,
          time_elapsed: result.time_elapsed,
          submission_status: submissionStatus
        });
      } else {
        // Issue was found via Find modal - fetch full data and save locally
        const fetchResult = await API.findIssue(aliasId);
        if (fetchResult.success && fetchResult.issue) {
          await storage.upsertIssue({
            ...fetchResult.issue,
            resolved_at: result.resolved_at,
            time_elapsed: result.time_elapsed,
            submission_status: submissionStatus
          });
        }
      }

      // 3. Close modal and re-render table
      closeResolveModal();
      await renderIssues();

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
