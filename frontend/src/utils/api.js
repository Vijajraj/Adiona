const API_BASE_URL = import.meta.env.VITE_API_URL || '';

function formatErrorMessage(errorData, fallback) {
  if (typeof errorData?.detail === 'string') {
    return errorData.detail;
  }
  if (Array.isArray(errorData?.detail) && errorData.detail.length > 0) {
    return errorData.detail.map((e) => e.msg || e.message).join(', ');
  }
  return fallback;
}

export async function fetchHeatmap(filters = {}, signal = null) {
  const params = new URLSearchParams();
  if (filters.category) params.append('category', filters.category);
  if (filters.hours_back) params.append('hours_back', String(filters.hours_back));
  if (filters.affected_group) params.append('affected_group', filters.affected_group);

  const queryString = params.toString();
  const url = `${API_BASE_URL}/reports/heatmap${queryString ? `?${queryString}` : ''}`;

  const fetchOptions = {};
  if (signal) {
    fetchOptions.signal = signal;
  }

  const res = await fetch(url, fetchOptions);
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(formatErrorMessage(errorData, 'Failed to fetch heatmap data'));
  }
  return res.json();
}

export async function submitReport(reportData, signal = null) {
  const fetchOptions = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(reportData),
  };
  if (signal) {
    fetchOptions.signal = signal;
  }

  const res = await fetch(`${API_BASE_URL}/reports`, fetchOptions);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(formatErrorMessage(data, 'Failed to submit report'));
  }
  return data;
}

export async function confirmReport(reportId, deviceId, signal = null) {
  const fetchOptions = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ device_id: deviceId }),
  };
  if (signal) {
    fetchOptions.signal = signal;
  }

  const res = await fetch(`${API_BASE_URL}/reports/${reportId}/confirm`, fetchOptions);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(formatErrorMessage(data, 'Failed to confirm report'));
  }
  return data;
}

export async function fetchFlaggedReports(adminKey, signal = null) {
  const fetchOptions = {
    headers: {
      'X-Admin-Key': adminKey,
    },
  };
  if (signal) {
    fetchOptions.signal = signal;
  }

  const res = await fetch(`${API_BASE_URL}/moderation/reports`, fetchOptions);
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(formatErrorMessage(errorData, 'Failed to fetch flagged reports'));
  }
  return res.json();
}

export async function fetchModerationStats(adminKey, signal = null) {
  const fetchOptions = {
    headers: {
      'X-Admin-Key': adminKey,
    },
  };
  if (signal) {
    fetchOptions.signal = signal;
  }

  const res = await fetch(`${API_BASE_URL}/moderation/stats`, fetchOptions);
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(formatErrorMessage(errorData, 'Failed to fetch moderation stats'));
  }
  return res.json();
}

export async function approveFlaggedReport(reportId, adminKey, signal = null) {
  const fetchOptions = {
    method: 'POST',
    headers: {
      'X-Admin-Key': adminKey,
    },
  };
  if (signal) {
    fetchOptions.signal = signal;
  }

  const res = await fetch(`${API_BASE_URL}/moderation/reports/${reportId}/approve`, fetchOptions);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(formatErrorMessage(data, 'Failed to approve report'));
  }
  return data;
}

export async function deleteFlaggedReport(reportId, adminKey, signal = null) {
  const fetchOptions = {
    method: 'DELETE',
    headers: {
      'X-Admin-Key': adminKey,
    },
  };
  if (signal) {
    fetchOptions.signal = signal;
  }

  const res = await fetch(`${API_BASE_URL}/moderation/reports/${reportId}`, fetchOptions);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(formatErrorMessage(data, 'Failed to delete report'));
  }
  return data;
}
