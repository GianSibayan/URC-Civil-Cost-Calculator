// src/auth.js
// Frontend session token handling
// Manages login, logout, and session validation in the browser

const Auth = {

  // Local dev bypass — skips Vercel auth when running on localhost
  isLocalDev() {
    return window.location.hostname === 'localhost' || 
           window.location.hostname === '127.0.0.1';
  },

  // Store token in sessionStorage after successful login
  // sessionStorage clears automatically when browser tab is closed
  setToken(token, email) {
    sessionStorage.setItem('ccc_token', token);
    sessionStorage.setItem('ccc_email', email);
  },

  // Get token from sessionStorage
  getToken() {
    return sessionStorage.getItem('ccc_token');
  },

  // Get logged in user email
  getEmail() {
    return sessionStorage.getItem('ccc_email');
  },

  // Check if user is logged in
  isLoggedIn() {
    return !!sessionStorage.getItem('ccc_token');
  },

  // Clear session (logout)
  logout() {
    sessionStorage.removeItem('ccc_token');
    sessionStorage.removeItem('ccc_email');
    window.location.href = '/index.html';
  },

  // Guard — call this at the top of calculator.html and admin.html
  // Redirects to index.html if not logged in
  requireLogin() {
    if (this.isLocalDev()) {
      if (!this.isLoggedIn()) {
        this.setToken('dev-token', 'dev@urc.com');
      }
      return;
    }
    if (!this.isLoggedIn()) {
      window.location.href = '/index.html';
    }
  },

  // Login — sends email + password to /api/auth
  // destination: 'calculator' or 'admin'
  async login(email, password, destination = 'calculator') {
    if (this.isLocalDev()) {
      this.setToken('dev-token', 'dev@urc.com');
      window.location.href = destination === 'admin' ? '/admin.html' : '/calculator.html';
      return { success: true };
    }
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        return { success: false, error: data.error || 'Login failed' };
      }

      this.setToken(data.token, data.email);

      if (destination === 'admin') {
        window.location.href = '/admin.html';
      } else {
        window.location.href = '/calculator.html';
      }

      return { success: true };

    } catch (e) {
      console.error('Login error:', e);
      return { success: false, error: 'Network error. Please try again.' };
    }
  },

  // Get Authorization header for API calls
  getAuthHeader() {
    const token = this.getToken();
    return token ? `Bearer ${token}` : null;
  },
};