/**
 * Authentication debugging utility
 * Helps track and debug authentication issues across the application
 */

// Enable or disable auth debugging globally
const DEBUG_ENABLED = true;

// Store debug logs
let authDebugLogs = [];

/**
 * Log authentication-related information with timestamps
 * @param {string} source - Component or file generating the log
 * @param {string} message - Debug message
 * @param {any} data - Optional data to include
 */
export function logAuth(source, message, data = null) {
  if (!DEBUG_ENABLED) return;
  
  const timestamp = new Date().toISOString();
  const logEntry = {
    timestamp,
    source,
    message,
    data
  };
  
  // Add to internal log array
  authDebugLogs.push(logEntry);
  
  // Also output to console for immediate feedback
  console.log(`[AUTH DEBUG] [${source}] ${message}`, data || '');
  
  // Keep log size manageable
  if (authDebugLogs.length > 100) {
    authDebugLogs.shift();
  }
}

/**
 * Get the current authentication state from various sources
 * @returns {Object} Authentication state from different sources
 */
export function getAuthState() {
  try {
    // Check localStorage
    const localStorageUser = localStorage.getItem('user');
    const localStorageToken = localStorage.getItem('token');
    
    // Check cookies
    const cookies = document.cookie.split(';').reduce((acc, cookie) => {
      const [key, value] = cookie.trim().split('=');
      if (key) acc[key] = value;
      return acc;
    }, {});
    
    return {
      localStorage: {
        user: localStorageUser ? JSON.parse(localStorageUser) : null,
        token: localStorageToken || null,
        hasAuth: !!(localStorageUser && localStorageToken)
      },
      cookies: {
        user: cookies.user ? JSON.parse(decodeURIComponent(cookies.user)) : null,
        token: cookies.token || null,
        hasAuth: !!(cookies.user && cookies.token)
      },
      logs: authDebugLogs.slice(-10) // Return last 10 logs
    };
  } catch (err) {
    console.error('Error getting auth state:', err);
    return { error: err.message };
  }
}

/**
 * Force authentication state to be consistent
 * Useful for fixing auth state issues
 */
export function repairAuthState() {
  try {
    // Get current state
    const state = getAuthState();
    
    // If we have auth in localStorage but not in cookies, set cookies
    if (state.localStorage.hasAuth && !state.cookies.hasAuth) {
      document.cookie = `token=${state.localStorage.token}; path=/; max-age=86400`;
      document.cookie = `user=${encodeURIComponent(JSON.stringify(state.localStorage.user))}; path=/; max-age=86400`;
      logAuth('repairAuthState', 'Restored cookies from localStorage');
    }
    
    // If we have auth in cookies but not in localStorage, set localStorage
    if (state.cookies.hasAuth && !state.localStorage.hasAuth) {
      localStorage.setItem('user', JSON.stringify(state.cookies.user));
      localStorage.setItem('token', state.cookies.token);
      logAuth('repairAuthState', 'Restored localStorage from cookies');
    }
    
    return getAuthState();
  } catch (err) {
    console.error('Error repairing auth state:', err);
    return { error: err.message };
  }
}

/**
 * Display current auth debug information
 * @returns {HTMLElement} A div containing debug information
 */
export function getAuthDebugPanel() {
  const state = getAuthState();
  
  // Create debug panel element
  const panel = document.createElement('div');
  panel.style.position = 'fixed';
  panel.style.bottom = '10px';
  panel.style.right = '10px';
  panel.style.backgroundColor = 'rgba(0,0,0,0.8)';
  panel.style.color = 'white';
  panel.style.padding = '10px';
  panel.style.borderRadius = '5px';
  panel.style.zIndex = '9999';
  panel.style.maxWidth = '400px';
  panel.style.maxHeight = '300px';
  panel.style.overflow = 'auto';
  panel.style.fontSize = '12px';
  panel.style.fontFamily = 'monospace';
  
  let html = '<h3>Auth Debug</h3>';
  
  // LocalStorage
  html += '<h4>LocalStorage</h4>';
  html += `<div>Has Auth: ${state.localStorage.hasAuth}</div>`;
  if (state.localStorage.user) {
    html += `<div>User: ${JSON.stringify(state.localStorage.user)}</div>`;
  }
  html += `<div>Token: ${state.localStorage.token ? 'Present' : 'Missing'}</div>`;
  
  // Cookies
  html += '<h4>Cookies</h4>';
  html += `<div>Has Auth: ${state.cookies.hasAuth}</div>`;
  if (state.cookies.user) {
    html += `<div>User: ${JSON.stringify(state.cookies.user)}</div>`;
  }
  html += `<div>Token: ${state.cookies.token ? 'Present' : 'Missing'}</div>`;
  
  // Recent logs
  html += '<h4>Recent Logs</h4>';
  html += '<ul>';
  state.logs.forEach(log => {
    html += `<li>${log.timestamp.split('T')[1].split('.')[0]} [${log.source}] ${log.message}</li>`;
  });
  html += '</ul>';
  
  // Add repair button
  html += '<button id="repair-auth-btn" style="margin-top:10px;padding:5px;background:#333;color:white;border:1px solid #666;border-radius:3px;">Repair Auth State</button>';
  
  panel.innerHTML = html;
  
  // Add event listener to repair button
  setTimeout(() => {
    const repairBtn = document.getElementById('repair-auth-btn');
    if (repairBtn) {
      repairBtn.addEventListener('click', () => {
        repairAuthState();
        // Refresh the panel
        panel.remove();
        document.body.appendChild(getAuthDebugPanel());
      });
    }
  }, 0);
  
  return panel;
}

// Export a function to show the debug panel
export function showAuthDebugPanel() {
  if (!DEBUG_ENABLED) return;
  
  // Remove existing panel if present
  const existingPanel = document.getElementById('auth-debug-panel');
  if (existingPanel) {
    existingPanel.remove();
  }
  
  // Create and add the panel
  const panel = getAuthDebugPanel();
  panel.id = 'auth-debug-panel';
  document.body.appendChild(panel);
}

// Export functions
export default {
  logAuth,
  getAuthState,
  repairAuthState,
  showAuthDebugPanel
};
