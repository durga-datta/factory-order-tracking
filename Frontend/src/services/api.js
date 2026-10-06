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

// Order Management (Staff & Admin)
export async function fetchOrders(token) {
  const response = await fetch(`${API_BASE_URL}/orders`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const result = await response.json();
  if (!response.ok) throw new Error(result.message || 'Failed to fetch orders');
  return result; // { success, data: [...] }
}

export async function fetchOrderDetails(orderId, token) {
  const response = await fetch(`${API_BASE_URL}/orders/${orderId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const result = await response.json();
  if (!response.ok) throw new Error(result.message || 'Failed to load order details');
  return result;
}

export async function createFactoryOrder(orderData, token) {
  const response = await fetch(`${API_BASE_URL}/orders`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(orderData),
  });
  const result = await response.json();
  if (!response.ok) throw new Error(result.message || 'Failed to create order');
  return result;
}

export async function advanceOrderStage(orderId, stageData, token) {
  const response = await fetch(`${API_BASE_URL}/orders/${orderId}/advance`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(stageData || {}),
  });
  const result = await response.json();
  if (!response.ok) throw new Error(result.message || 'Failed to advance stage');
  return result;
}

export async function submitQCInspection(orderId, qcData, token) {
  const response = await fetch(`${API_BASE_URL}/orders/${orderId}/qc`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(qcData),
  });
  const result = await response.json();
  if (!response.ok) throw new Error(result.message || 'Failed to record QC inspection');
  return result;
}

export async function submitDispatch(orderId, dispatchData, token) {
  const response = await fetch(`${API_BASE_URL}/orders/${orderId}/dispatch`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(dispatchData),
  });
  const result = await response.json();
  if (!response.ok) throw new Error(result.message || 'Failed to process dispatch');
  return result;
}

export async function broadcastDelay(orderId, delayData, token) {
  const response = await fetch(`${API_BASE_URL}/orders/${orderId}/delay`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(delayData),
  });
  const result = await response.json();
  if (!response.ok) throw new Error(result.message || 'Failed to broadcast delay alert');
  return result;
}

// Public Customer Tracking Link (No login required)
export async function fetchPublicTracking(orderId) {
  const response = await fetch(`${API_BASE_URL}/orders/${orderId}/public`);
  const result = await response.json();
  if (!response.ok) throw new Error(result.message || 'Failed to load tracking info');
  return result;
}
