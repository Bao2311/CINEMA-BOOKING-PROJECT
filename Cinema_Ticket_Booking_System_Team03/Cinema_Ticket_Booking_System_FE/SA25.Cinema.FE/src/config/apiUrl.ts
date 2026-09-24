// Centralized API base URL for the entire application
// In development: http://localhost:5204
// In production: set via VITE_API_URL environment variable (e.g., https://your-app.azurewebsites.net)
export const API_BASE_URL = `${import.meta.env.VITE_API_URL || "http://localhost:5204"}`;
export const API_URL = `${API_BASE_URL}/api`;
