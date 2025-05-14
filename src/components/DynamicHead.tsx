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

import React, { useEffect } from "react";

// Using a try-catch pattern to avoid errors when context isn't available yet
const DynamicHead: React.FC = () => {
  // Default values if settings aren't available
  let pageTitle = "Election System";
  let schoolName = "";

  // Try to get settings from localStorage as a fallback
  try {
    const cachedSettings = localStorage.getItem("settings");
    if (cachedSettings) {
      const parsedSettings = JSON.parse(cachedSettings);
      if (parsedSettings.data) {
        pageTitle = parsedSettings.data.electionTitle || "Election System";
        schoolName = parsedSettings.data.schoolName || "";
      }
    }
  } catch (error) {
    console.log("Error reading settings from localStorage:", error);
  }

  // Update document title with useEffect
  useEffect(() => {
    // Set document title
    document.title = pageTitle;

    // Set meta description
    if (schoolName) {
      let metaDescription = document.querySelector('meta[name="description"]');
      if (!metaDescription) {
        metaDescription = document.createElement("meta");
        metaDescription.setAttribute("name", "description");
        document.head.appendChild(metaDescription);
      }
      metaDescription.setAttribute(
        "content",
        `${schoolName} - Election System`
      );
    }
  }, [pageTitle, schoolName]);

  // This component doesn't render anything visible
  return null;
};

export default DynamicHead;
