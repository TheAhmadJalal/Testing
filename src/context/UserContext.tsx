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
  ReactNode,
} from "react";
import axios from "axios";
import { initializeAfterLogin } from "../utils/dbInitializer";

// Define the Permission type
interface Permission {
  page: string;
  actions: string[];
}

// Updated interface to match the actual MongoDB structure
interface PermissionMap {
  [resource: string]: {
    view?: boolean;
    add?: boolean;
    edit?: boolean;
    delete?: boolean;
    [key: string]: boolean | undefined;
  };
}

interface Voter {
  id: string;
  name: string;
  voterId: string;
  hasVoted: boolean;
  voteCount?: number; // Add voteCount property
  votedAt?: Date;
}

// Update the User interface to include properly typed permissions
interface User {
  _id: string;
  id?: string;
  username: string;
  email?: string;
  role: string | { name: string; permissions?: PermissionMap };
  name?: string;
  isAdmin?: boolean;
  permissions?: PermissionMap; // Updated type with correct structure
  voteCount?: number; // Number of votes cast by this voter
  maxVotes?: number; // Maximum number of votes allowed per voter
}

interface Role {
  id?: string;
  name: string;
  permissions?: Record<string, string[]>;
}

interface UserContextType {
  user: User | null;
  setUser: (user: User | null) => void;
  loading: boolean;
  isAuthenticated: boolean;
  authToken: string | null;
  login: (
    username: string,
    password: string
  ) => Promise<{
    success: boolean;
    user?: any;
    message?: string;
  }>;
  logout: () => void;
  setUserData: (userData: User) => void;
  setAuthToken: (token: string | null) => void;
  refreshUserData: () => Promise<void>;
  checkAuth: () => boolean;
  getMockVoter: (voterId: string) => Voter | null;
  hasPermission: (page: string, action: string) => boolean;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

// Mock voter data for testing
const mockVoters: Voter[] = [
  { id: "1", name: "John Doe", voterId: "V001", hasVoted: false },
  {
    id: "2",
    name: "Jane Smith",
    voterId: "V002",
    hasVoted: true,
    votedAt: new Date(),
  },
  // Add more mock voters as needed
];

const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:5000";

export const UserProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // To manage log throttling
  const logCache = new Map<string, number>();
  const LOG_THROTTLE_MS = 5000; // Only log the same permission check every 5 seconds
  // Define a DEBUG constant at the top of the file
  const DEBUG_PERMISSIONS = process.env.NODE_ENV === "development";

  // Initialize from localStorage on mount
  useEffect(() => {
    const token = localStorage.getItem("authToken");
    const userData = localStorage.getItem("user");

    if (token && userData) {
      try {
        setAuthToken(token);
        setUser(JSON.parse(userData));
        setIsAuthenticated(true);
      } catch (error) {
        console.error("Error parsing user data from localStorage:", error);
        localStorage.removeItem("authToken");
        localStorage.removeItem("user");
      }
    }
  }, []);

  // Fix the VotingAuth component issue by properly handling the conversion between _id and id
  const setUserData = (userData: User) => {
    // Ensure both _id and id are set for compatibility
    const normalizedUser = {
      ...userData,
      id: userData.id || userData._id, // Make sure id is set
    };

    setUser(normalizedUser);
    localStorage.setItem("user", JSON.stringify(normalizedUser));
  };

  const checkAuth = () => {
    return !!authToken && !!user;
  };

  // Helper function to check if a user is admin based on role
  const isUserAdmin = (role: any): boolean => {
    if (!role) return false;

    if (typeof role === "string") {
      return role.toLowerCase() === "admin";
    }

    if (typeof role === "object" && role !== null) {
      return role.name?.toLowerCase() === "admin";
    }

    return false;
  };

  // Helper function to check if a user is viewer based on role
  const isUserViewer = (role: any): boolean => {
    if (!role) return false;

    if (typeof role === "string") {
      return role.toLowerCase() === "viewer";
    }

    if (typeof role === "object" && role !== null) {
      return role.name?.toLowerCase() === "viewer";
    }

    return false;
  };

  // Function to standardize role comparison
  const getUserRole = (roleData: any): string => {
    if (!roleData) return "";

    if (typeof roleData === "string") {
      return roleData.toLowerCase();
    }

    if (typeof roleData === "object" && roleData.name) {
      return roleData.name.toLowerCase();
    }

    return "";
  };

  // Completely revised hasPermission function
  const hasPermission = (resource: string, action: string): boolean => {
    if (!user) {
      if (DEBUG_PERMISSIONS) console.log(`Permission check failed: No user`);
      return false;
    }

    const role = getUserRole(user.role);
    const permissionKey = `${role}/${resource}/${action}`;

    // Add explicit deny for non-authorized roles
    if (typeof user.role === "string" && user.role === "testRole") {
      const allowedResources = ["dashboard", "positions"];
      if (!allowedResources.includes(resource)) {
        if (DEBUG_PERMISSIONS && shouldLog(permissionKey)) {
          console.log(
            `[TESTMODE DENY] ${role} not allowed to access ${resource}`
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
        }
        return false;
      }
    }

    // Debug current permission check
    if (DEBUG_PERMISSIONS && shouldLog(permissionKey)) {
      console.log(`[PERMISSION CHECK START] ${role}/${resource}/${action}`, {
        role,
        resource,
        action,
        userPermissions: user.permissions || {},
        userRoleType: typeof user.role,
      });
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

      // Debug missing permissions
      if (!user.permissions) {
        console.error("WARNING: Permissions object missing in user:", user);
      }
    }

    // Admin has permission for everything
    if (role === "admin") {
      return true;
    }

    // Special case for the viewer role - they can view everything
    if (role === "viewer" && action === "view") {
      return true;
    }

    // Get permissions from user object - this is the source of truth
    // Use empty object as fallback when permissions are undefined
    const userPermissions = user.permissions || {};

    // For string-based roles like "testRole", only grant permissions
    // that are explicitly defined in the permissions object
    if (
      typeof user.role === "string" &&
      user.role !== "admin" &&
      user.role !== "viewer"
    ) {
      // Debug available permissions
      if (DEBUG_PERMISSIONS && shouldLog(permissionKey)) {
        console.log(`[STRING ROLE CHECK] ${role}/${resource}/${action}`, {
          available: Object.keys(userPermissions),
          resourcePermissions: userPermissions[resource],
          exactPermission: userPermissions[resource]?.[action],
        });
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
      }

      // STRICT CHECK: Only allow exact match for string-based custom roles
      const hasExactPermission = userPermissions[resource]?.[action] === true;

      if (DEBUG_PERMISSIONS && shouldLog(permissionKey)) {
        console.log(
          `[STRING ROLE RESULT] ${hasExactPermission ? "GRANTED" : "DENIED"}`
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
      }

      return hasExactPermission;
    }

    // For object-based roles, we can use the more flexible matching
    // Normalize resource names for object-based roles only
    const normalizedResource = resource.endsWith("s")
      ? resource
      : `${resource}s`;
    const singularResource = resource.endsWith("s")
      ? resource.slice(0, -1)
      : resource;

    // Try EXACT match first
    if (
      userPermissions[resource] &&
      userPermissions[resource][action] === true
    ) {
      return true;
    }

    // Try normalized (plural) version
    if (
      userPermissions[normalizedResource] &&
      userPermissions[normalizedResource][action] === true
    ) {
      return true;
    }

    // Try singular version
    if (
      userPermissions[singularResource] &&
      userPermissions[singularResource][action] === true
    ) {
      return true;
    }

    // If we got here, permission is denied
    return false;
  };

  // Add this helper function to throttle logging
  const shouldLog = (key: string): boolean => {
    const now = Date.now();
    const lastLog = logCache.get(key) || 0;

    if (now - lastLog > LOG_THROTTLE_MS) {
      logCache.set(key, now);
      return true;
    }
    return false;
  };

  const refreshUserData = async () => {
    if (!authToken || !user) return;

    try {
      const response = await axios.get(`${apiUrl}/api/users/${user._id}`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      setUserData(response.data);
    } catch (error) {
      console.error("Error refreshing user data:", error);
    }
  };

  // Update the login function to better clean permissions
  const login = async (username: string, password: string) => {
    try {
      setLoading(true);
      setError(null);

      // Get API base URL
      const API_BASE_URL =
        import.meta.env.VITE_API_URL || "http://localhost:5000";

      // First check if server is reachable
      try {
        console.log("[LOGIN] Testing server connection before login attempt");
        await fetch(`${API_BASE_URL}/api/server-info`, {
          method: "HEAD",
          signal: AbortSignal.timeout(3000), // Quick 3 second timeout
        });
      } catch (connErr) {
        console.warn("[LOGIN] Server connection test failed:", connErr);
        throw new Error(
          "Server connection failed. Please check your connection and try again."
        );
      }

      console.log(
        "[LOGIN] Server connection test passed, proceeding with login"
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

      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
        signal: AbortSignal.timeout(30000), // 15 second timeout
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Login failed");
      }

      // Save auth data
      localStorage.setItem("token", data.token);
      if (data.user) {
        // Remove Mongoose internals from permissions
        const cleanPermissions = (perms: any) => {
          const clean: Record<string, any> = {};
          for (const [key, value] of Object.entries(perms)) {
            if (value && typeof value === "object") {
              // Remove Mongoose-specific properties
              const { $__parent, $__, $isNew, _id, __v, ...cleanValue } =
                value as any;
              clean[key] = cleanValue._doc
                ? // If it's a Mongoose doc, we need to clean it properly
                  (() => {
                    const docObj = cleanValue._doc;
                    const { _id, __v, ...cleanDoc } = docObj;
                    return cleanDoc;
                  })()
                : cleanValue;
            } else {
              clean[key] = value;
            }
          }
          return clean;
        };

        // Normalize permissions if missing
        if (!data.user.permissions) {
          console.warn("Backend sent no permissions! Creating empty set");
          data.user.permissions = {};
        }

        // Apply cleaning function
        data.user.permissions = data.user.permissions
          ? cleanPermissions(data.user.permissions)
          : {};

        // Enhanced permission logging
        console.log(
          "USER LOGIN - RECEIVED PERMISSIONS:",
          data.user.permissions
            ? JSON.stringify(data.user.permissions, null, 2)
            : "UNDEFINED"
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

        console.log("USER ROLE:", data.user.role);
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

        localStorage.setItem("user", JSON.stringify(data.user));
        setUser(data.user);
      }
      setIsAuthenticated(true);
      setLoading(false);

      // Return success to allow login component to navigate
      return { success: true, user: data.user };
    } catch (err: any) {
      console.error("Login error:", err);

      // Provide more descriptive error messages based on error type
      let errorMessage = "Failed to login. Please try again.";
      if (err.name === "TimeoutError" || err.name === "AbortError") {
        errorMessage =
          "Connection to server timed out. Please check your network connection and try again.";
      } else if (err.message.includes("Server connection failed")) {
        errorMessage = err.message;
      } else if (err.message.includes("Failed to fetch")) {
        errorMessage =
          "Cannot connect to the authentication server. Please check your connection.";
      }

      setError(errorMessage);
      setLoading(false);
      return { success: false, error: errorMessage };
    }
  };

  const logout = () => {
    localStorage.removeItem("authToken");
    localStorage.removeItem("user");
    setAuthToken(null);
    setUser(null);
    setIsAuthenticated(false);
  };

  const getMockVoter = (voterId: string): Voter | null => {
    return mockVoters.find((voter) => voter.voterId === voterId) || null;
  };

  const value = {
    user,
    setUser,
    loading,
    isAuthenticated,
    authToken,
    login,
    logout,
    setUserData,
    setAuthToken,
    refreshUserData,
    checkAuth,
    getMockVoter,
    hasPermission,
  };

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
};
