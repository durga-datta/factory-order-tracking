const API_BASE_URL = 'http://localhost:5000/api';

// Visitor Enquiry
export async function submitEnquiry(data) {
  const response = await fetch(`${API_BASE_URL}/enquiries`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  const result = await response.json();
  if (!response.ok) {
    throw new Error(result.message || 'Failed to submit enquiry');
  }
  return result;
}

// Health Check
export async function checkBackendHealth() {
  try {
    const response = await fetch(`${API_BASE_URL}/health`);
    if (response.ok) {
      return await response.json();
    }
    return null;
  } catch (e) {
    return null;
  }
}

// Authentication (Login - Admin & Staff)
export async function loginUser(credentials) {
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(credentials),
  });

  const result = await response.json();
  if (!response.ok) {
    throw new Error(result.message || 'Login failed');
  }
  return result; // { success, token, user }
}

// Get Current User Profile
export async function fetchCurrentUser(token) {
  const response = await fetch(`${API_BASE_URL}/auth/me`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const result = await response.json();
  if (!response.ok) {
    throw new Error(result.message || 'Failed to load profile');
  }
  return result;
}

// Staff Management (Admin Only)
export async function appointStaff(staffData, token) {
  const response = await fetch(`${API_BASE_URL}/staff`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(staffData),
  });

  const result = await response.json();
  if (!response.ok) {
    throw new Error(result.message || 'Failed to add employee');
  }
  return result;
}

export async function fetchStaffList(token) {
  const response = await fetch(`${API_BASE_URL}/staff`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const result = await response.json();
  if (!response.ok) {
    throw new Error(result.message || 'Failed to fetch staff list');
  }
  return result; // { success, data: [...] }
}

export async function updateStaffMember(staffId, updateData, token) {
  const response = await fetch(`${API_BASE_URL}/staff/${staffId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(updateData),
  });

  const result = await response.json();
  if (!response.ok) {
    throw new Error(result.message || 'Failed to update employee');
  }
  return result;
}
