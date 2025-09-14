// API Configuration for production deployment
window.API_CONFIG = {
    baseUrl: window.location.hostname === 'localhost' 
        ? 'http://localhost:3000' 
        : 'https://zidalco-api-5nf2.onrender.com'  // Your actual Render URL
};

// Helper function to make API calls
window.apiCall = function(endpoint, options = {}) {
    const url = `${window.API_CONFIG.baseUrl}${endpoint}`;
    return fetch(url, options);
};
