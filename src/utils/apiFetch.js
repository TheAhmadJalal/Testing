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

import { getApiUrl } from "./apiConfig";

/**
 * Custom fetch function with API URL handling and error management
 * @param {string} endpoint - API endpoint path (with or without leading slash)
 * @param {Object} options - Fetch options
 * @param {number} retries - Number of retry attempts (default: 3)
 * @returns {Promise<any>} - Response data as JSON
 */
export async function apiFetch(endpoint, options = {}, retries = 3) {
  const apiUrl = getApiUrl();
  const url = endpoint.startsWith("/")
    ? `${apiUrl}${endpoint}`
    : `${apiUrl}/${endpoint}`;

  // Set default timeout
  const controller = new AbortController();
  const timeout = setTimeout(
    () => controller.abort(),
    options.timeout || 15000
  );

  try {
    // Apply signal from controller if no signal provided
    const signal = options.signal || controller.signal;

    const response = await fetch(url, {
      ...options,
      signal,
      headers: {
        ...options.headers,
        // Add cache busting headers
        "Cache-Control": "no-cache, no-store, must-revalidate",
        Pragma: "no-cache",
        Expires: "0",
      },
    });

    // Clear timeout as response received
    clearTimeout(timeout);

    if (!response.ok) {
      let errorData;
      let errorText;

      try {
        errorText = await response.text();
        try {
          // Try to parse as JSON
          errorData = JSON.parse(errorText);
        } catch (e) {
          // If not JSON, use the raw text
          errorData = { message: errorText };
        }
      } catch (textError) {
        errorData = {
          message: `Request failed with status ${response.status}`,
        };
      }

      throw new Error(
        errorData.message || `Request failed with status ${response.status}`
      );
    }

    // Parse JSON response
    const data = await response.json();
    return data;
  } catch (error) {
    clearTimeout(timeout);

    // Handle resource-related errors with retry logic
    if (
      error.name === "AbortError" ||
      error.message.includes("ERR_INSUFFICIENT_RESOURCES") ||
      error.message.includes("NetworkError") ||
      error.message.includes("Failed to fetch")
    ) {
      if (retries > 0) {
        const delay = Math.pow(2, 3 - retries) * 1000; // Exponential backoff
        console.warn(
          `[API] Connection error, retrying in ${delay}ms: ${error.message}`
        );

        return new Promise((resolve) => {
          setTimeout(() => {
            resolve(apiFetch(endpoint, options, retries - 1));
          }, delay);
        });
      }
    }

    console.error(`[API] Error fetching ${endpoint}:`, error);
    throw error;
  }
}

export default apiFetch;
