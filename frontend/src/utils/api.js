const API_BASE_URL = import.meta.env.VITE_API_URL || '';

export async function fetchHeatmap(filters = {}) {
  const params = new URLSearchParams();
  if (filters.category) params.append('category', filters.category);
  if (filters.hours_back) params.append('hours_back', filters.hours_back);
  if (filters.affected_group) params.append('affected_group', filters.affected_group);

  const queryString = params.toString();
  const url = `${API_BASE_URL}/reports/heatmap${queryString ? `?${queryString}` : ''}`;

  const res = await fetch(url);
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || 'Failed to fetch heatmap data');
  }
  return res.json();
}

export async function submitReport(reportData) {
  const res = await fetch(`${API_BASE_URL}/reports`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(reportData),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.detail || 'Failed to submit report');
  }
  return data;
}

export async function confirmReport(reportId, deviceId) {
  const res = await fetch(`${API_BASE_URL}/reports/${reportId}/confirm`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ device_id: deviceId }),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.detail || 'Failed to confirm report');
  }
  return data;
}
