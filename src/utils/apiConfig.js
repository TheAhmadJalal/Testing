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

// Get API base URL from environment variables with fallback
const API_BASE_URL =
  import.meta.env.VITE_API_URL || "https://e-voting-api-jsfc.onrender.com";

// Remove any trailing slash for consistency
const apiUrl = API_BASE_URL.endsWith("/")
  ? API_BASE_URL.slice(0, -1)
  : API_BASE_URL;

// Build complete URL with endpoint
export const getApiUrl = (endpoint) => {
  // Ensure endpoint starts with slash
  const path = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
  return `${apiUrl}${path}`;
};

export default {
  baseUrl: apiUrl,
  getApiUrl,
};
