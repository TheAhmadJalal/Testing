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

// Get the base API URL from environment variables with a fallback
export const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000";

// Build a full API URL with the given endpoint
export function getApiUrl(endpoint) {
  const path = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
  return `${API_BASE_URL}${path}`;
}

// Config for React Router - add this to ensure proper SPA routing
export const routerConfig = {
  basename: "/",
};

export default {
  API_BASE_URL,
  getApiUrl,
  routerConfig,
};
