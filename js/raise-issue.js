// Raise Issue page logic
document.addEventListener('DOMContentLoaded', async () => {
  await storage.init();

  const form = document.getElementById('issue-form');
  const submitBtn = document.getElementById('submit-btn');
  const alertDiv = document.getElementById('form-alert');

  function showAlert(message, type) {
    alertDiv.innerHTML = `<div class="alert alert-${type}">${escapeHtml(message)}</div>`;
    // Auto-hide success messages after 5 seconds
    if (type === 'success') {
      setTimeout(() => {
        alertDiv.innerHTML = '';
      }, 5000);
    }
  }

  function clearAlert() {
    alertDiv.innerHTML = '';
  }

  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearAlert();

    const aliasId = document.getElementById('alias-id').value.trim();
    const errorType = document.getElementById('error-type').value;
    const description = document.getElementById('description').value.trim();

    // Validate alias ID format (alphanumeric, dashes, underscores)
    if (!/^[a-zA-Z0-9_-]+$/.test(aliasId)) {
      showAlert('Alias ID can only contain letters, numbers, dashes, and underscores.', 'error');
      return;
    }

    // Check if alias already exists locally
    const existsLocally = await storage.issueExists(aliasId);
    if (existsLocally) {
      showAlert('An issue with this Alias ID already exists locally.', 'error');
      return;
    }

    const createdAt = new Date().toISOString();

    const issue = {
      alias_id: aliasId,
      error_type: errorType,
      description: description,
      created_at: createdAt,
      resolved_at: null,
      time_elapsed: null
    };

    // Disable submit button during submission
    submitBtn.disabled = true;
    submitBtn.textContent = 'Submitting...';

    try {
      // 1. Save to local IndexedDB first (optimistic update)
      await storage.addIssue(issue);

      showAlert('Issue reported successfully! Redirecting to My Issues...', 'success');
      form.reset();

      // 2. Save to Google Sheet in background (don't block navigation)
      API.createIssue(issue).then(apiResult => {
        if (!apiResult.success) {
          console.error('Failed to save to Google Sheet:', apiResult.error);
        }
      }).catch(error => {
        console.error('Error saving to Google Sheet:', error);
      });

      // Redirect to My Issues page after a short delay
      setTimeout(() => {
        window.location.href = 'my-issues.html';
      }, 1000);

    } catch (error) {
      console.error('Error submitting issue:', error);
      showAlert('Failed to submit issue. Please try again.', 'error');
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Report Error';
    }
  });
});
