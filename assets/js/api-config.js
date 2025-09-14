// API Configuration for production deployment
window.API_CONFIG = {
    baseUrl: window.location.hostname === 'localhost' 
        ? 'http://localhost:3000' 
        : 'https://zidalco-api-5nf2.onrender.com'
};

console.log('API Config loaded:', window.API_CONFIG);
console.log('Hostname:', window.location.hostname);

// Helper function to make API calls
window.apiCall = function(endpoint, options = {}) {
    const url = `${window.API_CONFIG.baseUrl}${endpoint}`;
    return fetch(url, options);
};
