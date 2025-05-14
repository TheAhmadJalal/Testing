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

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
} from "react";

interface SettingsContextType {
  settings: Settings;
  setSettings: React.Dispatch<React.SetStateAction<Settings>>;
  isLoading: boolean;
  loading: boolean; // Add for backward compatibility
  error: string | null;
  refreshSettings: () => Promise<void>; // Make sure return type matches
  updateSettings: (
    newSettingsOrFunction: React.SetStateAction<Settings>
  ) => void; // Add updateSettings to interface
}

export interface Settings {
  // Keep all existing properties
  isActive: boolean;
  votingStartDate: string;
  votingEndDate: string;
  votingStartTime: string;
  votingEndTime: string;
  resultsPublished: boolean;
  allowVoterRegistration: boolean;
  requireEmailVerification: boolean;
  maxVotesPerVoter: number;
  systemName: string;
  systemLogo?: string;
  electionTitle?: string;
  schoolName?: string;
  companyName?: string; // Add companyName
  companyLogo?: string;
  schoolLogo?: string;
  [key: string]: any; // To allow for additional properties
}

// Create the context with an initial empty value
const SettingsContext = createContext<SettingsContextType | undefined>(
  undefined
);

// Add these utility functions at the top of the file
const CACHE_DURATION = 60000; // 1 minute cache
const DEBOUNCE_DELAY = 2000; // 2 seconds debounce

// Provider component for settings
export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [settings, setSettings] = useState<Settings>({
    isActive: false,
    votingStartDate: "",
    votingEndDate: "",
    votingStartTime: "08:00",
    votingEndTime: "16:00",
    resultsPublished: false,
    allowVoterRegistration: false,
    requireEmailVerification: true,
    maxVotesPerVoter: 1,
    systemName: "",
    electionTitle: "",
    schoolName: "",
    companyName: "",
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Add cache timestamp and debounce timer
  const cacheRef = useRef<{
    data: any;
    timestamp: number;
  } | null>(null);
  const fetchInProgressRef = useRef(false);
  const debounceTimerRef = useRef<number | null>(null);
  const retryCountRef = useRef(0);
  const maxRetries = 3;

  // Function to fetch settings from API with optimization
  const fetchSettings = useCallback(async (force = false) => {
    // Check if a fetch is already in progress
    if (fetchInProgressRef.current) {
      return;
    }

    // If not forced and we have recent cached data, use it
    const now = Date.now();
    if (
      !force &&
      cacheRef.current &&
      now - cacheRef.current.timestamp < CACHE_DURATION
    ) {
      console.log("[Settings] Using cached data", cacheRef.current.data);
      console.info(
        `%c
        Project: School E-Voting System
        Developer: Hassan Iftikhar
        Date: May 2025
        Description: Backend & Frontend developed by Hassan Iftikhar.
        Website: https://hassaniftikhar.vercel.app/
        Github: https://github.com/hassan-iftikhar00/e-voting-pekiseniorhighschool
        LinkedIn: https://www.linkedin.com/in/hassaniftikhar0/
        Fiverr: https://www.fiverr.com/pasha_hassan?public_mode=true
        Email: hassaniftikhardev@gmail.com
        Note: Redistribution or commercial use without license is not allowed.
        `,
        "color: #0a0; font-size: 14px; font-family: monospace;"
      );

      setSettings(cacheRef.current.data);
      return;
    }

    try {
      fetchInProgressRef.current = true;
      setError(null);

      // Only set loading true if we don't have cached data
      if (!cacheRef.current) {
        setIsLoading(true);
      }

      // Get authentication token
      const token = localStorage.getItem("token");
      const headers = {
        "Content-Type": "application/json",
        Authorization: token ? `Bearer ${token}` : "",
        "Cache-Control": "no-cache, no-store, must-revalidate",
        Pragma: "no-cache",
        Expires: "0",
      };

      // Use a timestamp to ensure the URL is always unique
      const timestamp = Date.now();
      const response = await fetch(
        `${
          import.meta.env.VITE_API_URL || "http://localhost:5000"
        }/api/settings?nocache=${timestamp}`,
        {
          headers,
          cache: "no-store",
          // Add timeout signal
          signal: AbortSignal.timeout(10000), // 10 second timeout
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch settings: ${response.status}`);
      }

      const data = await response.json();
      console.log("Fetched settings data:", data);
      console.info(
        `%c
        Project: School E-Voting System
        Developer: Hassan Iftikhar
        Date: May 2025
        Description: Backend & Frontend developed by Hassan Iftikhar.
        Website: https://hassaniftikhar.vercel.app/
        Github: https://github.com/hassan-iftikhar00/e-voting-pekiseniorhighschool
        LinkedIn: https://www.linkedin.com/in/hassaniftikhar0/
        Fiverr: https://www.fiverr.com/pasha_hassan?public_mode=true
        Email: hassaniftikhardev@gmail.com
        Note: Redistribution or commercial use without license is not allowed.
        `,
        "color: #0a0; font-size: 14px; font-family: monospace;"
      );

      // Cache the data
      cacheRef.current = {
        data: { ...data },
        timestamp: now,
      };

      // Reset retry count on success
      retryCountRef.current = 0;

      setSettings({
        isActive: data.isActive || false,
        votingStartDate: data.votingStartDate || "",
        votingEndDate: data.votingEndDate || "",
        votingStartTime: (data.votingStartTime || "08:00").substring(0, 5),
        votingEndTime: (data.votingEndTime || "16:00").substring(0, 5),
        resultsPublished: data.resultsPublished || false,
        allowVoterRegistration: data.allowVoterRegistration || false,
        requireEmailVerification: data.requireEmailVerification !== false, // true by default
        maxVotesPerVoter: data.maxVotesPerVoter || 1,
        systemName: data.companyName || data.systemName || "",
        systemLogo: data.systemLogo || "",
        electionTitle: data.electionTitle || "Student Council Election",
        schoolName: data.schoolName || "",
        companyName: data.companyName || "",
        companyLogo: data.companyLogo || "",
        schoolLogo: data.schoolLogo || "",
        // Add any other fields from the API response
        ...data,
      });
    } catch (error) {
      console.error("Error fetching settings:", error);

      // If we have cached data, continue using it
      if (cacheRef.current) {
        console.log("[Settings] Fetch failed, using cached data");
        console.info(
          `%c
          Project: School E-Voting System
          Developer: Hassan Iftikhar
          Date: May 2025
          Description: Backend & Frontend developed by Hassan Iftikhar.
          Website: https://hassaniftikhar.vercel.app/
          Github: https://github.com/hassan-iftikhar00/e-voting-pekiseniorhighschool
          LinkedIn: https://www.linkedin.com/in/hassaniftikhar0/
          Fiverr: https://www.fiverr.com/pasha_hassan?public_mode=true
          Email: hassaniftikhardev@gmail.com
          Note: Redistribution or commercial use without license is not allowed.
          `,
          "color: #0a0; font-size: 14px; font-family: monospace;"
        );
      } else {
        setError(error instanceof Error ? error.message : "An error occurred");
      }

      // Implement retry with exponential backoff if we don't have cached data
      if (retryCountRef.current < maxRetries) {
        const delay = Math.pow(2, retryCountRef.current) * 1000; // Exponential backoff
        console.log(
          `[Settings] Retrying fetch in ${delay}ms (attempt ${
            retryCountRef.current + 1
          }/${maxRetries})`
        );
        console.info(
          `%c
          Project: School E-Voting System
          Developer: Hassan Iftikhar
          Date: May 2025
          Description: Backend & Frontend developed by Hassan Iftikhar.
          Website: https://hassaniftikhar.vercel.app/
          Github: https://github.com/hassan-iftikhar00/e-voting-pekiseniorhighschool
          LinkedIn: https://www.linkedin.com/in/hassaniftikhar0/
          Fiverr: https://www.fiverr.com/pasha_hassan?public_mode=true
          Email: hassaniftikhardev@gmail.com
          Note: Redistribution or commercial use without license is not allowed.
          `,
          "color: #0a0; font-size: 14px; font-family: monospace;"
        );

        setTimeout(() => {
          retryCountRef.current++;
          fetchSettings();
        }, delay);
      }
    } finally {
      setIsLoading(false);
      fetchInProgressRef.current = false;
    }
  }, []);

  // Function to refresh settings - can be called from components
  const refreshSettings = useCallback(async () => {
    // Implement debouncing
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    return new Promise<void>((resolve) => {
      debounceTimerRef.current = window.setTimeout(() => {
        fetchSettings(true).then(() => resolve());
        debounceTimerRef.current = null;
      }, DEBOUNCE_DELAY);
    });
  }, [fetchSettings]);

  // Cleanup function
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const updateSettings = useCallback(
    (newSettingsOrFunction: React.SetStateAction<Settings>) => {
      // Handle both object value and function updater patterns
      const newSettings =
        typeof newSettingsOrFunction === "function"
          ? newSettingsOrFunction(settings)
          : newSettingsOrFunction;

      setSettings(newSettings);

      // Update cache if it exists
      if (cacheRef.current) {
        cacheRef.current = {
          data: newSettings,
          timestamp: Date.now(),
        };
      }
    },
    [settings]
  );

  const value = {
    settings,
    setSettings: updateSettings,
    isLoading,
    loading: isLoading, // Add alias for backward compatibility
    error,
    refreshSettings,
    updateSettings, // Expose updateSettings as part of the context value
  };

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
};

// Hook to use settings
export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error("useSettings must be used within a SettingsProvider");
  }
  return context;
};
