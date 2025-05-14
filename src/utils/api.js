/**
 * Project: School E-Voting System
 * Developer: Hassan Iftikhar
 * Date: May 2025
 * Description: Backend & Frontend developed by Hassan Iftikhar.
 * Website: https://hassaniftikhar.vercel.app/
 * Github: https://github.com/hassan-iftikhar00/e-voting-pekiseniorhighschool
 * LinkedIn: https://www.linkedin.com/in/hassaniftikhar0/
 * Fiverr: https://www.fiverr.com/pasha_hassan?public_mode=true
 * Email: hassaniftikhardev@gmail.com
 * Note: Redistribution or commercial use without license is not allowed.
 */

// Get the API URL from environment variables or use a default
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

// Remove trailing slash if present
const apiBaseUrl = API_URL.endsWith("/") ? API_URL.slice(0, -1) : API_URL;

// Helper function to build complete API URLs
export function getApiUrl(endpoint) {
  // Ensure endpoint starts with a slash
  const path = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
  return `${apiBaseUrl}${path}`;
}

// Export a configured fetch function that automatically uses the correct base URL
export async function apiFetch(endpoint, options = {}) {
  const url = getApiUrl(endpoint);

  // Add common headers
  const headers = {
    "Content-Type": "application/json",
    ...options.headers,
  };

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    throw new Error(`API request failed: ${response.status}`);
  }

  return response.json();
}

export default {
  getApiUrl,
  apiFetch,
};
