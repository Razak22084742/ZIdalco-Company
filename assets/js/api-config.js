// API Configuration for production deployment
window.API_CONFIG = {
    baseUrl: window.location.hostname === 'localhost' 
        ? 'http://localhost:3000' 
        : 'https://api.mysite.com'
};

// Helper function to make API calls
window.apiCall = function(endpoint, options = {}) {
    const url = `${window.API_CONFIG.baseUrl}${endpoint}`;
    return fetch(url, options);
};
