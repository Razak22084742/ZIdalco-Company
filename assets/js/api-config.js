// API Configuration for production deployment
window.API_CONFIG = {
    baseUrl: window.location.hostname === 'localhost' 
        ? 'http://localhost:3000' 
        : (window.NEXT_PUBLIC_API_URL || 'https://zidalco-api-5nf2.onrender.com')
};

// Helper function to make API calls
window.apiCall = function(endpoint, options = {}) {
    const url = `${window.API_CONFIG.baseUrl}${endpoint}`;
    return fetch(url, options);
};
