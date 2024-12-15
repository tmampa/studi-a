'use client';

export async function fetchWithAuth(endpoint, options = {}) {
  if (typeof window === 'undefined') {
    throw new Error('fetchWithAuth must be used in client-side code');
  }

  const token = localStorage.getItem('token');
  if (!token) {
    throw new Error('No authentication token found');
  }

  const response = await fetch(endpoint, {
    ...options,
    headers: {
      ...options.headers,
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  const data = await response.json();
  return data;
}

export function getToken() {
  if (typeof window === 'undefined') {
    return null;
  }
  return localStorage.getItem('token');
}

export function isAuthenticated() {
  if (typeof window === 'undefined') {
    return false;
  }
  return !!localStorage.getItem('token');
}

export function logout() {
  if (typeof window === 'undefined') {
    return;
  }
  localStorage.removeItem('token');
  window.location.href = '/login';
}
