let rawBaseUrl =
  import.meta.env.VITE_API_BASE_URL ||
  import.meta.env.VITE_API_URL ||
  'https://adiona.onrender.com';

if (!rawBaseUrl || rawBaseUrl.includes('chennai-safety-map-backend.onrender.com')) {
  rawBaseUrl = 'https://adiona.onrender.com';
}

const API_BASE_URL = rawBaseUrl.replace(/\/+$/, '');

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
  if (filters.days_back) params.append('days_back', String(filters.days_back));
  if (filters.time_bucket && filters.time_bucket !== 'all') {
    params.append('time_bucket', filters.time_bucket);
  }
  if (filters.affected_group) params.append('affected_group', filters.affected_group);

  const queryString = params.toString();
  const url = `${API_BASE_URL}/reports/heatmap${queryString ? `?${queryString}` : ''}`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 90000);

  const fetchOptions = {
    signal: signal || controller.signal,
  };

  try {
    const res = await fetch(url, fetchOptions);
    clearTimeout(timeoutId);
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(formatErrorMessage(errorData, 'Failed to fetch heatmap data'));
    }
    return res.json();
  } catch (err) {
    clearTimeout(timeoutId);
    throw err;
  }
}

export async function submitReport(reportData, signal = null) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 90000);

  const fetchOptions = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(reportData),
    signal: signal || controller.signal,
  };

  try {
    const res = await fetch(`${API_BASE_URL}/reports`, fetchOptions);
    clearTimeout(timeoutId);
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(formatErrorMessage(data, 'Failed to submit report'));
    }
    return data;
  } catch (err) {
    clearTimeout(timeoutId);
    if (err.name === 'AbortError') {
      throw new Error('Connection timed out. The cloud server may be waking up from idle state. Please try again.');
    }
    throw err;
  }
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

export async function submitFeedback(feedbackData, signal = null) {
  const fetchOptions = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(feedbackData),
  };
  if (signal) {
    fetchOptions.signal = signal;
  }

  const res = await fetch(`${API_BASE_URL}/feedback`, fetchOptions);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(formatErrorMessage(data, 'Failed to submit feedback'));
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

// ---------------------------------------------------------------------------
// Phase 2: Institutional Dashboard, Open Data, Help Points & Routing APIs
// ---------------------------------------------------------------------------

export async function fetchDashboardSummary(adminKey, daysBack = 90, signal = null) {
  const fetchOptions = {
    headers: {
      'X-Admin-Key': adminKey,
    },
  };
  if (signal) fetchOptions.signal = signal;

  const res = await fetch(`${API_BASE_URL}/admin/dashboard/summary?days_back=${daysBack}`, fetchOptions);
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(formatErrorMessage(errorData, 'Failed to fetch dashboard summary'));
  }
  return res.json();
}

export async function fetchDashboardTopZones(adminKey, category = null, limit = 10, daysBack = 90, signal = null) {
  const params = new URLSearchParams({ limit: String(limit), days_back: String(daysBack) });
  if (category) params.append('category', category);

  const fetchOptions = {
    headers: {
      'X-Admin-Key': adminKey,
    },
  };
  if (signal) fetchOptions.signal = signal;

  const res = await fetch(`${API_BASE_URL}/admin/dashboard/top-zones?${params.toString()}`, fetchOptions);
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(formatErrorMessage(errorData, 'Failed to fetch top zones'));
  }
  return res.json();
}

export async function exportOpenDataCells(format = 'json') {
  const url = `${API_BASE_URL}/export/cells?format=${format}`;
  if (format === 'csv') {
    window.open(url, '_blank');
    return;
  }
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error('Failed to export aggregated open data.');
  }
  return res.json();
}

export async function scoreRouteGeometry(coordinates, signal = null) {
  const fetchOptions = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ coordinates }),
  };
  if (signal) fetchOptions.signal = signal;

  const res = await fetch(`${API_BASE_URL}/routing/score-route`, fetchOptions);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(formatErrorMessage(data, 'Failed to evaluate route risk'));
  }
  return data;
}

export async function fetchNearbyHelpPoints() {
  const origin =
    typeof window !== 'undefined' && window.location?.origin && window.location.origin !== 'null'
      ? window.location.origin
      : 'http://localhost';
  const res = await fetch(`${origin}/data/help_points.geojson`);
  if (!res.ok) {
    throw new Error('Could not load nearby emergency help points.');
  }
  return res.json();
}
