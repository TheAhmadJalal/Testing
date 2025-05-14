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

import React, { useState, useRef, useEffect } from "react";
import {
  Plus,
  Edit,
  Trash2,
  Search,
  X,
  Check,
  AlertCircle,
  Download,
  RefreshCw,
  FileSpreadsheet,
  Printer,
  Columns,
  Info,
  Users,
  ArrowUp,
  ArrowDown,
  KeyRound,
  Upload,
  FileText,
} from "lucide-react";
import { useUser } from "../../context/UserContext";
import { useSettings } from "../../context/SettingsContext";

// Update the Voter interface to match the backend model
interface Voter {
  _id: string;
  voterId: string;
  studentId: string; // Added Student ID field
  name: string;
  gender: string;
  class: string;
  year: string;
  house: string;
  hasVoted: boolean;
  votedAt: string | null;
}

// Add interfaces for House, Year, and Class
interface House {
  _id: string;
  name: string;
  description: string;
  color: string;
  active: boolean;
}

interface Year {
  _id: string;
  name: string;
  description: string;
  active: boolean;
}

interface Class {
  _id: string;
  name: string;
  description: string;
  active: boolean;
}

const VotersManager: React.FC = () => {
  const { hasPermission } = useUser();
  const { settings } = useSettings();
  const [voters, setVoters] = useState<Voter[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterVoted, setFilterVoted] = useState<boolean | null>(null);
  const [filterGender, setFilterGender] = useState<string>("");
  const [filterClass, setFilterClass] = useState<string>("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingVoter, setEditingVoter] = useState<Voter | null>(null);
  const [notification, setNotification] = useState<{
    type: "success" | "error" | "warning";
    message: string;
  } | null>(null);
  const [sortField, setSortField] = useState<"name" | "class">("name");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [showColumnSelector, setShowColumnSelector] = useState(false);
  const columnSelectorRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showBulkImport, setShowBulkImport] = useState(false);

  // Add state for dynamic data
  const [availableClasses, setAvailableClasses] = useState<Class[]>([]);
  const [availableHouses, setAvailableHouses] = useState<House[]>([]);
  const [availableYears, setAvailableYears] = useState<Year[]>([]);

  // Visible columns state - update to include year and house
  const [visibleColumns, setVisibleColumns] = useState({
    name: true,
    studentId: true,
    voterId: true,
    gender: true,
    year: true, // Add year column
    class: true,
    house: true, // Add house column
    status: true,
    actions: true,
  });

  // Form state - updated to match API structure
  const [newVoter, setNewVoter] = useState({
    voterId: "",
    studentId: "", // Add Student ID field
    name: "",
    gender: "",
    class: "",
    year: "",
    house: "",
    hasVoted: false,
    votedAt: null,
  });

  // Import functionality state
  const [showImportModal, setShowImportModal] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importProgress, setImportProgress] = useState(0);
  const [importResults, setImportResults] = useState<{
    total: number;
    success: number;
    failed: number;
    errors: string[];
  }>({
    total: 0,
    success: 0,
    failed: 0,
    errors: [],
  });
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Add a new state variable to track recently changed voter IDs
  const [recentlyUpdatedVoterId, setRecentlyUpdatedVoterId] = useState<
    string | null
  >(null);

  // Close column selector when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        columnSelectorRef.current &&
        !columnSelectorRef.current.contains(event.target as Node)
      ) {
        setShowColumnSelector(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Fetch classes from API
  const fetchClasses = async () => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api/classes`
      );
      if (!response.ok)
        throw new Error(`Failed to fetch classes: ${response.status}`);
      const data = await response.json();
      setAvailableClasses(data);
    } catch (error) {
      console.error("Error fetching classes:", error);
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
  };

  // Fetch houses from API
  const fetchHouses = async () => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api/houses`
      );
      if (!response.ok)
        throw new Error(`Failed to fetch houses: ${response.status}`);
      const data = await response.json();
      setAvailableHouses(data);
    } catch (error) {
      console.error("Error fetching houses:", error);
    }
  };

  // Fetch years from API
  const fetchYears = async () => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api/years`
      );
      if (!response.ok)
        throw new Error(`Failed to fetch years: ${response.status}`);
      const data = await response.json();
      setAvailableYears(data);
    } catch (error) {
      console.error("Error fetching years:", error);
    }
  };

  // Fetch voters from the API
  const fetchVoters = async () => {
    try {
      setIsLoading(true);

      // Get authentication token
      const token = localStorage.getItem("token");
      const headers = {
        "Content-Type": "application/json",
        Authorization: token ? `Bearer ${token}` : "",
      };

      const response = await fetch(
        `${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api/voters`,
        { headers }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch voters: ${response.status}`);
      }

      const data = await response.json();
      setVoters(data);
    } catch (error) {
      console.error("Error fetching voters:", error);
      setNotification({
        type: "error",
        message: "Failed to load voters",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Load all data on component mount
  useEffect(() => {
    fetchVoters();
    fetchClasses();
    fetchHouses();
    fetchYears();
  }, []);

  // Filter and sort voters
  const filteredVoters = voters
    .filter(
      (voter) =>
        (voter.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          voter.voterId.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (voter.studentId &&
            voter.studentId
              .toLowerCase()
              .includes(searchTerm.toLowerCase()))) && // Add search by Student ID
        (filterVoted === null || voter.hasVoted === filterVoted) &&
        (filterGender === "" || voter.gender === filterGender) &&
        (filterClass === "" || voter.class === filterClass)
    )
    .sort((a, b) => {
      if (sortField === "name") {
        return sortDirection === "asc"
          ? a.name.localeCompare(b.name)
          : b.name.localeCompare(a.name);
      } else if (sortField === "class") {
        return sortDirection === "asc"
          ? a.class.localeCompare(b.class)
          : b.class.localeCompare(a.class);
      }
      return 0;
    });

  // Get unique classes and genders for filters
  const uniqueClasses = Array.from(new Set(voters.map((v) => v.class))).sort();
  const uniqueGenders = Array.from(new Set(voters.map((v) => v.gender))).sort();

  const handleSort = (field: "name" | "class") => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  // Enhanced function to generate unique alphanumeric voter IDs (6 characters) with at least one number
  const generateVoterId = (existingIds?: Set<string>) => {
    const letters = "ABCDEFGHJKLMNPQRSTUVWXYZ"; // Avoiding confusing characters like I, O
    const numbers = "23456789"; // Avoiding confusing numbers like 0, 1
    const allCharacters = letters + numbers;

    // Use either provided set of IDs or check against voters array
    const isIdTaken = (id: string) => {
      if (existingIds) {
        return existingIds.has(id);
      }
      return voters.some((voter) => voter.voterId === id);
    };

    // Try to generate a unique ID with max attempts to avoid infinite loop
    let maxAttempts = 10;
    let attempts = 0;
    let result;

    do {
      // Generate a completely random ID
      result = "";
      for (let i = 0; i < 6; i++) {
        result += allCharacters.charAt(
          Math.floor(Math.random() * allCharacters.length)
        );
      }

      // Check if the result contains at least one number
      const hasNumber = /[0-9]/.test(result);

      // If no number is present, replace a random position with a number
      if (!hasNumber) {
        const randomPosition = Math.floor(Math.random() * 6);
        const randomNumber = numbers.charAt(
          Math.floor(Math.random() * numbers.length)
        );
        result =
          result.substring(0, randomPosition) +
          randomNumber +
          result.substring(randomPosition + 1);
      }

      attempts++;
    } while (isIdTaken(result) && attempts < maxAttempts);

    // If we couldn't generate a unique ID after maxAttempts, add a timestamp suffix
    if (isIdTaken(result)) {
      const timestamp = Date.now().toString().slice(-4);
      result = result.substring(0, 2) + timestamp;
    }

    return result;
  };

  // Add voter with API integration and enhanced uniqueness checking
  const handleAddVoter = async () => {
    // Trim the input values
    const trimmedName = newVoter.name.trim();
    const trimmedGender = newVoter.gender.trim();
    const trimmedClass = newVoter.class.trim();
    const trimmedYear = newVoter.year.trim();
    const trimmedHouse = newVoter.house.trim();
    const trimmedStudentId = newVoter.studentId.trim(); // Add Student ID trimming

    console.log("Submitting voter with:", {
      name: trimmedName,
      gender: trimmedGender,
      class: trimmedClass,
      year: trimmedYear,
      house: trimmedHouse,
      studentId: trimmedStudentId, // Log Student ID
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

    // Check if any required field is empty
    if (!trimmedName) {
      setNotification({
        type: "error",
        message: "Full Name is required",
      });
      return;
    }

    if (!trimmedGender) {
      setNotification({
        type: "error",
        message: "Gender is required",
      });
      return;
    }

    if (!trimmedClass) {
      setNotification({
        type: "error",
        message: "Class is required",
      });
      return;
    }

    if (!trimmedYear) {
      setNotification({
        type: "error",
        message: "Year is required",
      });
      return;
    }

    if (!trimmedHouse) {
      setNotification({
        type: "error",
        message: "House is required",
      });
      return;
    }

    if (!trimmedStudentId) {
      setNotification({
        type: "error",
        message: "Student ID is required",
      });
      return;
    }

    try {
      setIsLoading(true);

      // Get authentication token
      const token = localStorage.getItem("token");
      const headers = {
        "Content-Type": "application/json",
        Authorization: token ? `Bearer ${token}` : "",
      };

      // Create a set of existing voter IDs for checking uniqueness
      const existingVoterIds = new Set(voters.map((v) => v.voterId));

      // Generate a unique voterId (checked against set of existing IDs)
      let tempVoterId = generateVoterId(existingVoterIds);

      // Double-check it's not already taken (extra safety)
      if (existingVoterIds.has(tempVoterId)) {
        console.warn(
          `Generated ID ${tempVoterId} already exists in local array, regenerating...`
        );
        tempVoterId = generateVoterId(existingVoterIds);
      }

      // Include all required fields
      const voterToAdd = {
        name: trimmedName,
        gender: trimmedGender,
        class: trimmedClass,
        year: trimmedYear,
        house: trimmedHouse,
        studentId: trimmedStudentId, // Add Student ID
        voterId: tempVoterId, // Client-generated unique ID
        hasVoted: false,
        votedAt: null,
      };

      console.log("Sending data to server:", voterToAdd);

      const response = await fetch(
        `${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api/voters`,
        {
          method: "POST",
          headers,
          body: JSON.stringify(voterToAdd),
        }
      );

      const responseData = await response.json();
      console.log("Server response:", responseData);

      if (!response.ok) {
        // Specifically handle duplicate key errors
        if (
          response.status === 409 ||
          responseData.message?.includes("duplicate") ||
          responseData.error?.includes("duplicate") ||
          responseData.error?.includes("E11000")
        ) {
          throw new Error(
            "Voter ID already exists. The system will generate a new ID for you. Please try again."
          );
        }
        throw new Error(responseData.message || "Failed to add voter");
      }

      // Use the voter returned from the server (which might have a different ID)
      setVoters([...voters, responseData]);

      setNewVoter({
        voterId: "",
        studentId: "", // Reset Student ID
        name: "",
        gender: "",
        class: "",
        year: "",
        house: "",
        hasVoted: false,
        votedAt: null,
      });

      setShowAddForm(false);
      setNotification({
        type: "success",
        message: "Voter added successfully",
      });
    } catch (error: any) {
      console.error("Error adding voter:", error);
      setNotification({
        type: "error",
        message: error.message || "Failed to add voter",
      });
    } finally {
      setIsLoading(false);
      setTimeout(() => setNotification(null), 3000);
    }
  };

  // Update voter with API integration
  const handleUpdateVoter = async () => {
    if (!editingVoter) return;

    // Trim the input values
    const trimmedName = editingVoter.name.trim();
    const trimmedGender = (editingVoter.gender || "Male").trim();
    const trimmedClass = editingVoter.class.trim();
    const trimmedYear = editingVoter.year?.trim() || "";
    const trimmedHouse = editingVoter.house?.trim() || "";
    const trimmedStudentId = editingVoter.studentId?.trim() || ""; // Add Student ID trimming

    console.log("Updating voter with:", {
      id: editingVoter._id,
      name: trimmedName,
      gender: trimmedGender,
      class: trimmedClass,
      year: trimmedYear,
      house: trimmedHouse,
      studentId: trimmedStudentId, // Log Student ID
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

    // Check all fields
    if (
      !trimmedName ||
      !trimmedGender ||
      !trimmedClass ||
      !trimmedYear ||
      !trimmedHouse ||
      !trimmedStudentId // Check for Student ID
    ) {
      setNotification({
        type: "error",
        message: "All fields are required",
      });
      return;
    }

    try {
      setIsLoading(true);

      // Get authentication token
      const token = localStorage.getItem("token");
      const headers = {
        "Content-Type": "application/json",
        Authorization: token ? `Bearer ${token}` : "",
      };

      const updatedVoter = {
        ...editingVoter,
        name: trimmedName,
        gender: trimmedGender,
        class: trimmedClass,
        year: trimmedYear,
        house: trimmedHouse,
        studentId: trimmedStudentId, // Add Student ID
      };

      const response = await fetch(
        `${
          import.meta.env.VITE_API_URL || "http://localhost:5000"
        }/api/voters/${editingVoter._id}`,
        {
          method: "PUT",
          headers,
          body: JSON.stringify(updatedVoter),
        }
      );

      const responseData = await response.json();
      console.log("Server response:", responseData);

      if (!response.ok) {
        throw new Error(responseData.message || "Failed to update voter");
      }

      setVoters(
        voters.map((voter) =>
          voter._id === responseData._id ? responseData : voter
        )
      );

      setEditingVoter(null);
      setNotification({
        type: "success",
        message: "Voter updated successfully",
      });
    } catch (error: any) {
      console.error("Error updating voter:", error);
      setNotification({
        type: "error",
        message: error.message || "Failed to update voter",
      });
    } finally {
      setIsLoading(false);
      setTimeout(() => setNotification(null), 3000);
    }
  };

  // Delete voter with API integration
  const handleDeleteVoter = async (id: string) => {
    const voter = voters.find((v) => v._id === id);
    if (voter?.hasVoted) {
      setNotification({
        type: "error",
        message: "Cannot delete a voter who has already voted",
      });
      return;
    }

    if (!window.confirm("Are you sure you want to delete this voter?")) {
      return;
    }

    try {
      setIsLoading(true);

      // Get authentication token
      const token = localStorage.getItem("token");
      const headers = {
        "Content-Type": "application/json",
        Authorization: token ? `Bearer ${token}` : "",
      };

      const response = await fetch(
        `${
          import.meta.env.VITE_API_URL || "http://localhost:5000"
        }/api/voters/${id}`,
        {
          method: "DELETE",
          headers,
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to delete voter: ${response.status}`);
      }

      setVoters(voters.filter((voter) => voter._id !== id));
      setNotification({
        type: "success",
        message: "Voter deleted successfully",
      });
    } catch (error) {
      console.error("Error deleting voter:", error);
      setNotification({
        type: "error",
        message: "Failed to delete voter",
      });
    } finally {
      setIsLoading(false);
      setTimeout(() => setNotification(null), 3000);
    }
  };

  // Regenerate voter ID with API integration - enhanced with duplicate handling
  const handleRegenerateVoterId = async (id: string) => {
    const voter = voters.find((v) => v._id === id);
    if (!voter) {
      setNotification({
        type: "error",
        message: "Voter not found",
      });
      return;
    }

    if (voter.hasVoted) {
      setNotification({
        type: "error",
        message: "Cannot regenerate Voter ID after voting",
      });
      return;
    }

    if (!window.confirm("Are you sure you want to regenerate this Voter ID?")) {
      return;
    }

    try {
      setIsLoading(true);

      // Check if user has the correct permission
      if (!hasPermission("voters", "edit")) {
        setNotification({
          type: "error",
          message: "You don't have permission to regenerate voter IDs",
        });
        return;
      }

      // Generate a new voter ID with local uniqueness check
      let newVoterId = generateVoterId();
      let attempts = 0;
      const maxAttempts = 3;

      // Make extra sure ID is unique in local array
      while (
        voters.some((v) => v.voterId === newVoterId) &&
        attempts < maxAttempts
      ) {
        console.log(`Generated ID ${newVoterId} already exists, retrying...`);
        newVoterId = generateVoterId();
        attempts++;
      }

      console.log(
        `Generated new voter ID: ${newVoterId} for voter: ${voter.name} (after ${attempts} attempts)`
      );

      // Get authentication token
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("Authentication token not found. Please log in again.");
      }

      const headers = {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      };

      // Use the regular update endpoint to update the voter with the new ID
      const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:5000";

      // Create request body with a special flag to force voter ID update
      const requestBody = {
        ...voter,
        voterId: newVoterId,
        forceVoterIdUpdate: true, // Add a special flag to tell backend this is intentional
      };

      console.log("Sending update request with body:", requestBody);

      const response = await fetch(`${apiUrl}/api/voters/${id}`, {
        method: "PUT",
        headers,
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("Server error response:", errorData);
        throw new Error(
          `Failed to update voter ID: ${
            errorData.message || response.statusText
          }`
        );
      }

      const updatedVoter = await response.json();
      console.log("Server returned voter:", updatedVoter);
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

      // Check if the server actually updated the voter ID as requested
      if (updatedVoter.voterId !== newVoterId) {
        console.warn(
          `Server returned different voter ID than requested. Requested: ${newVoterId}, Received: ${updatedVoter.voterId}`
        );

        // Show a warning in the notification but continue with the update
        setNotification({
          type: "warning",
          message: `Voter ID regenerated with a different value: ${updatedVoter.voterId}`,
        });
      } else {
        setNotification({
          type: "success",
          message: `Voter ID regenerated successfully: ${updatedVoter.voterId}`,
        });
      }

      // Always use the ID returned from the server
      updateVotersList(updatedVoter);
    } catch (error) {
      console.error("Error regenerating voter ID:", error);
      setNotification({
        type: "error",
        message:
          error instanceof Error
            ? error.message
            : "Failed to regenerate voter ID",
      });
    } finally {
      setIsLoading(false);
      setTimeout(() => setNotification(null), 3000);
    }
  };

  // Helper function to update voters list with regenerated voter
  const updateVotersList = (updatedVoter: Voter) => {
    // Update the voter in the list with the server-returned data
    setVoters(
      voters.map((voter) =>
        voter._id === updatedVoter._id ? updatedVoter : voter
      )
    );

    // Set the recently updated voter ID to trigger the highlight effect
    setRecentlyUpdatedVoterId(updatedVoter._id);

    // Clear the highlight after 2 seconds
    setTimeout(() => {
      setRecentlyUpdatedVoterId(null);
    }, 2000);
  };

  // Format date and time
  const formatDateTime = (dateString: string | null) => {
    if (!dateString) return "-";

    const date = new Date(dateString);
    return new Intl.DateTimeFormat("en-US", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
    }).format(date);
  };

  // Fix the handleEditVoter function to provide a default gender if it's missing
  const handleEditVoter = (voter: Voter) => {
    console.log("Editing voter:", voter);
    // Ensure gender exists - database might not have this field yet
    if (!voter.gender) {
      voter.gender = "Male"; // Default gender if missing
    }
    console.log("Gender value after fix:", voter.gender);
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

    setEditingVoter(voter);
  };

  // Open import modal first, not file picker dialog
  const handleImportClick = () => {
    // Reset import state
    setImportFile(null);
    setImportProgress(0);
    setImportResults({
      total: 0,
      success: 0,
      failed: 0,
      errors: [],
    });
    setIsImporting(false);

    // Show the modal first
    setShowImportModal(true);
  };

  // Separate function to trigger file selection
  const triggerFileSelection = () => {
    fileInputRef.current?.click();
  };

  // Handle file selection
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type === "text/csv" || file.name.endsWith(".csv")) {
        setImportFile(file);
        // Modal is already open, so we don't need to set it again
      } else {
        setNotification({
          type: "error",
          message: "Please select a CSV file.",
        });
      }
    }
  };

  // Parse CSV file - update to handle Student ID and improve case handling
  const parseCSV = (text: string): any[] => {
    try {
      // Remove any BOM characters or invisible Unicode characters
      text = text.replace(/^\uFEFF/, "");

      // Split into lines and remove empty lines
      const lines = text
        .split(/\r?\n/)
        .filter((line) => line.trim().length > 0);

      if (lines.length === 0) {
        throw new Error("CSV file is empty");
      }

      console.log("Original CSV lines:", lines);
      let headerLine = lines[0];

      // Improved separator detection
      let separator = ",";
      if (headerLine.includes("\t")) {
        separator = "\t";
        console.log("Detected tab separator");
      } else if (headerLine.includes(";")) {
        separator = ";";
        console.log("Detected semicolon separator");
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
        console.log("Using default comma separator");
      }

      console.log(`Using separator: "${separator}"`);

      // Clean potential line numbers from the start of each line
      const cleanLines = lines.map((line) => {
        // Remove line numbers that might appear at the start (e.g., "1 Name")
        return line.replace(/^\d+\s+/, "");
      });

      console.log("Cleaned lines:", cleanLines);
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

      headerLine = cleanLines[0];

      // Process headers - trim and normalize
      const headers = headerLine
        .split(separator)
        .map((h) => h.trim().toLowerCase()) // Normalize all headers to lowercase
        .filter((h) => h.length > 0);

      console.log("Detected headers:", headers);
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

      // Check for required columns (case-insensitive)
      const requiredColumnsLower = [
        "name",
        "gender",
        "class",
        "year",
        "house",
        "studentid",
      ];
      const missingColumns = requiredColumnsLower.filter(
        (col) => !headers.includes(col)
      );

      if (missingColumns.length > 0) {
        console.error("Missing required columns:", missingColumns);
        console.error("Available headers:", headers);
        throw new Error(
          `Missing required columns: ${missingColumns.join(", ")}`
        );
      }

      // Process data rows (skip header)
      const data = [];
      for (let i = 1; i < cleanLines.length; i++) {
        const values = cleanLines[i].split(separator).map((v) => v.trim());

        // Make sure we have enough values
        if (values.length < headers.length) {
          console.warn(
            `Row ${i} has fewer values than headers, padding with empty strings`
          );
          while (values.length < headers.length) {
            values.push("");
          }
        }

        // Create an object with header keys and row values
        const rowData: Record<string, string> = {};
        headers.forEach((header, index) => {
          if (index < values.length) {
            rowData[header] = values[index];
          } else {
            rowData[header] = "";
          }
        });

        // Fix common issues - normalize values
        if (rowData.gender) {
          // Normalize gender to match server expectations
          if (rowData.gender.toLowerCase().startsWith("m")) {
            rowData.gender = "Male";
          } else if (rowData.gender.toLowerCase().startsWith("f")) {
            rowData.gender = "Female";
          }
        }

        // Trim all values to remove leading/trailing whitespace
        Object.keys(rowData).forEach((key) => {
          if (typeof rowData[key] === "string") {
            rowData[key] = rowData[key].trim();
          }
        });

        console.log(`Row ${i} data:`, rowData);
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

        data.push(rowData);
      }

      console.log(`Parsed ${data.length} rows of data`);
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

      return data;
    } catch (error) {
      console.error("CSV parsing error:", error);
      throw error;
    }
  };

  // Start import process
  const handleStartImport = async () => {
    if (!importFile) return;

    setIsImporting(true);
    setImportProgress(0);
    setImportResults({
      total: 0,
      success: 0,
      failed: 0,
      errors: [],
    });

    try {
      // Ensure importFile is not null and is a File object
      if (!(importFile instanceof File)) {
        throw new Error("Invalid file selected for import.");
      }

      // Read file
      const text = await importFile.text();
      console.log("Raw CSV content:", text.substring(0, 500));
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

      // Parse CSV
      const data = parseCSV(text);

      if (data.length === 0) {
        throw new Error("No valid data found in the CSV file");
      }

      setImportProgress(25);
      setImportResults((prev) => ({ ...prev, total: data.length }));

      // Get token
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("Authentication token not found. Please log in again.");
      }

      // Try to fetch current election ID, but don't fail if not available
      let electionId = null;

      try {
        const electionResponse = await fetch(
          `${
            import.meta.env.VITE_API_URL || "http://localhost:5000"
          }/api/elections/current`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (electionResponse.ok) {
          const electionData = await electionResponse.json();
          electionId = electionData._id;
          console.log("Using active election ID:", electionId);
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
        } else if (electionResponse.status === 404) {
          console.log(
            "No active election found, proceeding without election ID"
          );
          // Show warning notification but continue
          setNotification({
            type: "warning",
            message:
              "No active election found. Voters will be imported without being associated with an election.",
          });
          // Clear the notification after 5 seconds
          setTimeout(() => {
            setNotification(null);
          }, 5000);
        }
      } catch (electionError) {
        console.warn("Failed to fetch current election:", electionError);
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

        // Continue without an election ID
      }

      setImportProgress(50);

      // Create a Set of all existing voter IDs in the database
      const existingVoterIds = new Set(voters.map((v) => v.voterId));
      const importedIds = new Set<string>();

      // Map over the imported data to generate unique voter IDs
      const votersWithIds = data.map((voter) => {
        // Combine existing database IDs and already generated batch IDs
        const combinedIds = new Set([...existingVoterIds, ...importedIds]);

        // Generate a unique voter ID using our consistent function
        const voterId = generateVoterId(combinedIds);

        // Track this new ID to avoid duplicates in subsequent iterations
        importedIds.add(voterId);

        console.log(`Generated ID ${voterId} for ${voter.name}`);
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

        return {
          ...voter,
          voterId, // Use our client-generated voter ID
          forceVoterIdUpdate: true, // Flag to prevent server-side regeneration
          forceClientVoterId: true, // Additional explicit flag
          skipIdGeneration: true, // Extra flag to prevent server-side generation
          _skipVoterIdGeneration: true, // Match any server-side hook flag
          preserveId: true, // Another explicit flag
          ...(electionId ? { electionId } : {}),
        };
      });

      // Prepare request payload
      const payload = {
        voters: votersWithIds,
        preserveClientIds: true,
        useClientGeneratedIds: true, // Flag for the entire batch
        skipServerIdGeneration: true, // Extra batch-level flag
        _preserveIds: true, // Another batch-level flag
      };

      console.log(
        "Sending enhanced payload to server:",
        JSON.stringify(payload, null, 2)
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

      // Make API request
      const response = await fetch(
        `${
          import.meta.env.VITE_API_URL || "http://localhost:5000"
        }/api/voters/bulk-simple`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error("Unauthorized: Please log in again.");
        }
        throw new Error(result.message || "Failed to import voters.");
      }

      setImportProgress(100);
      setImportResults({
        total: data.length,
        success: result.success || 0,
        failed: result.failed || 0,
        errors: result.errors || [],
      });

      // Refresh the voters list if any were successfully imported
      if (result.success > 0) {
        fetchVoters(); // Fetch updated voters list

        setNotification({
          type: "success",
          message: `Successfully imported ${result.success} voters.`,
        });
      } else {
        setNotification({
          type: "error",
          message: `Import failed: ${
            result.errors?.join(", ") || "Unknown error"
          }`,
        });
      }
    } catch (error: any) {
      console.error("Error during import:", error);
      setImportResults((prev) => ({
        ...prev,
        failed: prev.total || 1,
        errors: [error.message || "An error occurred during import."],
      }));
      setNotification({
        type: "error",
        message:
          error.message || "An error occurred during the import process.",
      });
    } finally {
      setIsImporting(false);
      setImportProgress(100);
    }
  };

  // Close import modal and reset state
  const handleCloseImport = () => {
    setShowImportModal(false);
    setImportFile(null);
    setImportProgress(0);
    // Clear results when closing the modal
    setImportResults({
      total: 0,
      success: 0,
      failed: 0,
      errors: [],
    });

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Check user permissions once instead of using PermissionGuard everywhere
  const canAddVoter = hasPermission("voters", "add");
  const canEditVoter = hasPermission("voters", "edit");
  const canDeleteVoter = hasPermission("voters", "delete");

  // Handle export to Excel
  const handleExportExcel = () => {
    // Create CSV content with all voter fields in the new order
    let csvContent = `${
      settings?.electionTitle || "Election"
    } - Voters List\n\n`;
    csvContent +=
      "S/N,Name,Student ID,Voter ID,Gender,Year,Class,House,Status,Date Voted\n";

    filteredVoters.forEach((voter, index) => {
      // Escape any commas in text fields with double quotes
      csvContent += `${index + 1},"${voter.name}","${voter.studentId || ""}","${
        voter.voterId
      }","${voter.gender}","${voter.year || ""}","${voter.class}","${
        voter.house || ""
      }","${voter.hasVoted ? "Voted" : "Not Voted"}","${
        voter.votedAt ? formatDateTime(voter.votedAt) : ""
      }"\n`;
    });

    // Create a blob and download link
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `${settings?.electionTitle || "election"}_voters_list_${
        new Date().toISOString().split("T")[0]
      }.csv`
    );
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Handle print function
  const handlePrint = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      alert("Please allow pop-ups to print");
      return;
    }

    const styles = `
      <style>
        body { font-family: Arial, sans-serif; margin: 0; padding: 20px; }
        h1 { text-align: center; color: #4338ca; margin-bottom: 20px; }
        h2 { text-align: center; color: #6366f1; margin-bottom: 15px; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
        th { background-color: #f3f4f6; color: #374151; font-weight: bold; text-align: left; padding: 12px; }
        td { padding: 10px; border-bottom: 1px solid #e5e7eb; }
        tr:nth-child(even) { background-color: #f9fafb; }
        .status-voted { color: #047857; font-weight: bold; }
        .status-not-voted { color: #b91c1c; font-weight: bold; }
        .footer { margin-top: 20px; text-align: center; font-size: 12px; color: #6b7280; }
      </style>
    `;

    // Apply the same sorting as in the UI before printing
    const sortedVoters = [...filteredVoters].sort((a, b) => {
      if (sortField === "name") {
        return sortDirection === "asc"
          ? a.name.localeCompare(b.name)
          : b.name.localeCompare(a.name);
      } else if (sortField === "class") {
        return sortDirection === "asc"
          ? a.class.localeCompare(b.class)
          : b.class.localeCompare(a.class);
      }
      return 0;
    });

    // Generate table headers based on visible columns
    const tableHeaders = `
      <tr>
        <th>S/N</th>
        ${visibleColumns.name ? "<th>Name</th>" : ""}
        ${visibleColumns.studentId ? "<th>Student ID</th>" : ""}
        ${visibleColumns.voterId ? "<th>Voter ID</th>" : ""}
        ${visibleColumns.gender ? "<th>Gender</th>" : ""}
        ${visibleColumns.year ? "<th>Year</th>" : ""}
        ${visibleColumns.class ? "<th>Class</th>" : ""}
        ${visibleColumns.house ? "<th>House</th>" : ""}
        ${visibleColumns.status ? "<th>Status</th>" : ""}
        <th>Date Voted</th>
      </tr>
    `;

    // Generate table rows based on visible columns
    const tableRows = sortedVoters
      .map(
        (voter, index) => `
        <tr>
          <td>${index + 1}</td>
          ${visibleColumns.name ? `<td>${voter.name}</td>` : ""}
          ${
            visibleColumns.studentId ? `<td>${voter.studentId || "-"}</td>` : ""
          }
          ${visibleColumns.voterId ? `<td>${voter.voterId}</td>` : ""}
          ${visibleColumns.gender ? `<td>${voter.gender}</td>` : ""}
          ${visibleColumns.year ? `<td>${voter.year || "-"}</td>` : ""}
          ${visibleColumns.class ? `<td>${voter.class}</td>` : ""}
          ${visibleColumns.house ? `<td>${voter.house || "-"}</td>` : ""}
          ${
            visibleColumns.status
              ? `<td class="${
                  voter.hasVoted ? "status-voted" : "status-not-voted"
                }">${voter.hasVoted ? "Voted" : "Not Voted"}</td>`
              : ""
          }
          <td>${
            voter.hasVoted && voter.votedAt
              ? formatDateTime(voter.votedAt)
              : "-"
          }</td>
        </tr>
      `
      )
      .join("");

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Voters List - ${settings?.electionTitle || "Election"}</title>
          ${styles}
        </head>
        <body>
          <h1>Voters List</h1>
          <h2>${settings?.electionTitle || "Election"}</h2>
          
          <table>
            <thead>
              ${tableHeaders}
            </thead>
            <tbody>
              ${tableRows}
            </tbody>
          </table>
          
          <div class="footer">
            <p>Printed on ${new Date().toLocaleString()}</p>
            <p>${settings?.schoolName || ""}</p>
          </div>
        </body>
      </html>
    `);

    printWindow.document.close();

    setTimeout(() => {
      printWindow.print();
    }, 500);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-3 md:space-y-0 bg-gradient-to-r from-indigo-700 to-purple-700 text-white p-4 rounded-lg shadow-md">
        <div>
          <h2 className="text-xl font-bold">Voter Management</h2>
          <p className="text-indigo-100 text-sm font-sans font-light">
            Manage student voters for the election
          </p>
        </div>
        <div className="flex space-x-2">
          {canAddVoter && (
            <>
              <button
                onClick={() => setShowAddForm(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm rounded-md shadow-sm text-indigo-700 bg-white hover:bg-indigo-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-200"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Voter
              </button>
              <button
                onClick={handleImportClick}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-200"
              >
                <Upload className="h-4 w-4 mr-2" />
                Import Voters
              </button>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileSelect}
                accept=".csv"
                className="hidden"
              />
            </>
          )}
        </div>
      </div>

      {/* Notification */}
      {notification && (
        <div
          className={`p-3 rounded-md ${
            notification.type === "success"
              ? "bg-green-50 border border-green-200"
              : notification.type === "warning"
              ? "bg-yellow-50 border border-yellow-200"
              : "bg-red-50 border border-red-200"
          } flex justify-between items-start shadow-sm`}
        >
          <div className="flex">
            {notification.type === "success" ? (
              <Check className="h-5 w-5 text-green-500 mr-2" />
            ) : notification.type === "warning" ? (
              <AlertCircle className="h-5 w-5 text-yellow-500 mr-2" />
            ) : (
              <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
            )}
            <p
              className={
                notification.type === "success"
                  ? "text-green-800"
                  : notification.type === "warning"
                  ? "text-yellow-800"
                  : "text-red-800"
              }
            >
              {notification.message}
            </p>
          </div>
          <button
            onClick={() => setNotification(null)}
            className="text-gray-400 hover:text-gray-500"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      )}

      {/* Add/Edit Form */}
      {(showAddForm || editingVoter) && (
        <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-md">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            {editingVoter ? "Edit Voter" : "Add New Voter"}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Full Name
              </label>
              <input
                type="text"
                className="w-full p-2 border border-gray-300 rounded-md"
                value={editingVoter ? editingVoter.name : newVoter.name}
                onChange={(e) => {
                  if (editingVoter) {
                    setEditingVoter({ ...editingVoter, name: e.target.value });
                  } else {
                    setNewVoter({ ...newVoter, name: e.target.value });
                  }
                }}
              />
            </div>

            {/* Add Student ID field */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Student ID
              </label>
              <input
                type="text"
                className="w-full p-2 border border-gray-300 rounded-md"
                value={
                  editingVoter
                    ? editingVoter.studentId || ""
                    : newVoter.studentId
                }
                onChange={(e) => {
                  if (editingVoter) {
                    setEditingVoter({
                      ...editingVoter,
                      studentId: e.target.value,
                    });
                  } else {
                    setNewVoter({ ...newVoter, studentId: e.target.value });
                  }
                }}
                placeholder="Enter student ID"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Gender
              </label>
              <select
                className="w-full p-2 border border-gray-300 rounded-md"
                value={
                  editingVoter ? editingVoter.gender || "" : newVoter.gender
                }
                onChange={(e) => {
                  if (editingVoter) {
                    setEditingVoter({
                      ...editingVoter,
                      gender: e.target.value,
                    });
                  } else {
                    setNewVoter({ ...newVoter, gender: e.target.value });
                  }
                }}
              >
                <option key="empty-gender" value="">
                  Select gender
                </option>
                <option key="male" value="Male">
                  Male
                </option>
                <option key="female" value="Female">
                  Female
                </option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Class
              </label>
              <select
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                value={editingVoter ? editingVoter.class : newVoter.class}
                onChange={(e) => {
                  if (editingVoter) {
                    setEditingVoter({ ...editingVoter, class: e.target.value });
                  } else {
                    setNewVoter({ ...newVoter, class: e.target.value });
                  }
                }}
              >
                <option value="">Select class</option>
                {availableClasses.map((cls) => (
                  <option key={cls.name} value={cls.name}>
                    {cls.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Year
              </label>
              <select
                className="w-full p-2 border border-gray-300 rounded-md"
                value={editingVoter ? editingVoter.year : newVoter.year}
                onChange={(e) => {
                  if (editingVoter) {
                    setEditingVoter({ ...editingVoter, year: e.target.value });
                  } else {
                    setNewVoter({ ...newVoter, year: e.target.value });
                  }
                }}
              >
                <option key="empty-year" value="">
                  Select year
                </option>
                {availableYears
                  .filter((year) => year.active)
                  .map((year) => (
                    <option key={`year-${year._id}`} value={year.name}>
                      {year.name}
                    </option>
                  ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                House
              </label>
              <select
                className="w-full p-2 border border-gray-300 rounded-md"
                value={editingVoter ? editingVoter.house : newVoter.house}
                onChange={(e) => {
                  if (editingVoter) {
                    setEditingVoter({ ...editingVoter, house: e.target.value });
                  } else {
                    setNewVoter({ ...newVoter, house: e.target.value });
                  }
                }}
              >
                <option key="empty-house" value="">
                  Select house
                </option>
                {availableHouses
                  .filter((house) => house.active)
                  .map((house) => (
                    <option key={`house-${house._id}`} value={house.name}>
                      {house.name}
                    </option>
                  ))}
              </select>
            </div>
          </div>

          <div className="mt-4 flex justify-end space-x-2">
            <button
              onClick={() => {
                setShowAddForm(false);
                setEditingVoter(null);
              }}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={editingVoter ? handleUpdateVoter : handleAddVoter}
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
            >
              {editingVoter ? "Update" : "Add"} Voter
            </button>
          </div>
        </div>
      )}

      {/* Filters and Actions */}
      <div className="bg-white p-4 rounded-lg shadow-md">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setFilterVoted(null)}
            className={`px-3 py-1.5 rounded-md text-sm font-medium ${
              filterVoted === null
                ? "bg-indigo-600 text-white"
                : "bg-gray-100 text-gray-800 hover:bg-gray-200"
            }`}
          >
            All Voters
          </button>
          <button
            onClick={() => setFilterVoted(true)}
            className={`px-3 py-1.5 rounded-md text-sm font-medium ${
              filterVoted === true
                ? "bg-green-600 text-white"
                : "bg-gray-100 text-gray-800 hover:bg-gray-200"
            }`}
          >
            Voted
          </button>
          <button
            onClick={() => setFilterVoted(false)}
            className={`px-3 py-1.5 rounded-md text-sm font-medium ${
              filterVoted === false
                ? "bg-red-600 text-white"
                : "bg-gray-100 text-gray-800 hover:bg-gray-200"
            }`}
          >
            Not Voted
          </button>
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                className="block w-full pl-10 pr-3 py-1.5 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                placeholder="Search voters..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <select
            className="px-3 py-1.5 border border-gray-300 rounded-md text-sm"
            value={filterGender}
            onChange={(e) => setFilterGender(e.target.value)}
          >
            <option key="all-genders" value="">
              All Genders
            </option>
            {uniqueGenders.map((gender) => (
              <option key={`gender-${gender}`} value={gender}>
                {gender}
              </option>
            ))}
          </select>

          <select
            className="px-3 py-1.5 border border-gray-300 rounded-md text-sm"
            value={filterClass}
            onChange={(e) => setFilterClass(e.target.value)}
          >
            <option key="all-classes" value="">
              All Classes
            </option>
            {uniqueClasses.map((cls) => (
              <option key={`filter-class-${cls}`} value={cls}>
                {cls}
              </option>
            ))}
          </select>

          {/* Add Export Button */}
          {canAddVoter && (
            <>
              <button
                onClick={handlePrint}
                className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                title="Print voters list"
              >
                <Printer className="h-4 w-4 mr-1.5" />
                Print
              </button>
              <button
                onClick={handleExportExcel}
                className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                title="Export to Excel"
              >
                <FileSpreadsheet className="h-4 w-4 mr-1.5" />
                Export
              </button>
            </>
          )}

          <div className="relative" ref={columnSelectorRef}>
            <button
              onClick={() => setShowColumnSelector(!showColumnSelector)}
              className="px-3 py-1.5 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              <Columns className="h-4 w-4" />
            </button>

            {showColumnSelector && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10 border border-gray-200">
                <div className="p-2">
                  <div className="text-sm font-medium text-gray-700 mb-2">
                    Show/Hide Columns
                  </div>
                  <div className="space-y-1">
                    <label className="flex items-center p-2 hover:bg-gray-50">
                      <input
                        type="checkbox"
                        checked={visibleColumns.name}
                        onChange={() =>
                          setVisibleColumns({
                            ...visibleColumns,
                            name: !visibleColumns.name,
                          })
                        }
                      />
                      <span className="ml-2 text-sm text-gray-700">
                        Student ID
                      </span>
                    </label>
                    <label className="flex items-center p-2 hover:bg-gray-50">
                      <input
                        type="checkbox"
                        checked={visibleColumns.voterId}
                        onChange={() =>
                          setVisibleColumns({
                            ...visibleColumns,
                            voterId: !visibleColumns.voterId,
                          })
                        }
                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                      />
                      <span className="ml-2 text-sm text-gray-700">
                        Voter ID
                      </span>
                    </label>
                    <label className="flex items-center p-2 hover:bg-gray-50">
                      <input
                        type="checkbox"
                        checked={visibleColumns.gender}
                        onChange={() =>
                          setVisibleColumns({
                            ...visibleColumns,
                            gender: !visibleColumns.gender,
                          })
                        }
                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                      />
                      <span className="ml-2 text-sm text-gray-700">Gender</span>
                    </label>
                    <label className="flex items-center p-2 hover:bg-gray-50">
                      <input
                        type="checkbox"
                        checked={visibleColumns.year}
                        onChange={() =>
                          setVisibleColumns({
                            ...visibleColumns,
                            year: !visibleColumns.year,
                          })
                        }
                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                      />
                      <span className="ml-2 text-sm text-gray-700">Year</span>
                    </label>
                    <label className="flex items-center p-2 hover:bg-gray-50">
                      <input
                        type="checkbox"
                        checked={visibleColumns.class}
                        onChange={() =>
                          setVisibleColumns({
                            ...visibleColumns,
                            class: !visibleColumns.class,
                          })
                        }
                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                      />
                      <span className="ml-2 text-sm text-gray-700">Class</span>
                    </label>
                    <label className="flex items-center p-2 hover:bg-gray-50">
                      <input
                        type="checkbox"
                        checked={visibleColumns.house}
                        onChange={() =>
                          setVisibleColumns({
                            ...visibleColumns,
                            house: !visibleColumns.house,
                          })
                        }
                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                      />
                      <span className="ml-2 text-sm text-gray-700">House</span>
                    </label>
                    <label className="flex items-center p-2 hover:bg-gray-50">
                      <input
                        type="checkbox"
                        checked={visibleColumns.status}
                        onChange={() =>
                          setVisibleColumns({
                            ...visibleColumns,
                            status: !visibleColumns.status,
                          })
                        }
                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                      />
                      <span className="ml-2 text-sm text-gray-700">Status</span>
                    </label>
                    <label className="flex items-center p-2 hover:bg-gray-50">
                      <input
                        type="checkbox"
                        checked={visibleColumns.actions}
                        onChange={() =>
                          setVisibleColumns({
                            ...visibleColumns,
                            actions: !visibleColumns.actions,
                          })
                        }
                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                      />
                      <span className="ml-2 text-sm text-gray-700">
                        Actions
                      </span>
                    </label>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Loading indicator */}
      {isLoading && (
        <div className="flex justify-center py-12">
          <div className="flex flex-col items-center">
            <RefreshCw className="h-8 w-8 text-indigo-500 animate-spin mb-2" />
            <p className="text-gray-500">Loading...</p>
          </div>
        </div>
      )}

      {/* Empty state for no voters */}
      {!isLoading && voters.length === 0 && (
        <div className="bg-white rounded-lg p-8 text-center">
          <Users className="h-12 w-12 text-indigo-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No voters found
          </h3>
          <p className="text-gray-500 mb-6">
            Get started by adding voters using the button above
          </p>
        </div>
      )}

      {/* Voters Table */}
      {(!isLoading || voters.length > 0) && (
        <div className="bg-white shadow-md rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th
                    scope="col"
                    className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    S/N
                  </th>
                  {visibleColumns.name && (
                    <th
                      scope="col"
                      className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                      onClick={() => handleSort("name")}
                    >
                      <div className="flex items-center">
                        Name
                        {sortField === "name" &&
                          (sortDirection === "asc" ? (
                            <ArrowUp className="h-4 w-4 ml-1" />
                          ) : (
                            <ArrowDown className="h-4 w-4 ml-1" />
                          ))}
                      </div>
                    </th>
                  )}
                  {visibleColumns.studentId && (
                    <th
                      scope="col"
                      className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Student ID
                    </th>
                  )}
                  {visibleColumns.voterId && (
                    <th
                      scope="col"
                      className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Voter ID
                    </th>
                  )}
                  {visibleColumns.gender && (
                    <th
                      scope="col"
                      className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Gender
                    </th>
                  )}
                  {visibleColumns.year && (
                    <th
                      scope="col"
                      className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Year
                    </th>
                  )}
                  {visibleColumns.class && (
                    <th
                      scope="col"
                      className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                      onClick={() => handleSort("class")}
                    >
                      <div className="flex items-center">
                        Class
                        {sortField === "class" &&
                          (sortDirection === "asc" ? (
                            <ArrowUp className="h-4 w-4 ml-1" />
                          ) : (
                            <ArrowDown className="h-4 w-4 ml-1" />
                          ))}
                      </div>
                    </th>
                  )}
                  {visibleColumns.house && (
                    <th
                      scope="col"
                      className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      House
                    </th>
                  )}
                  {visibleColumns.status && (
                    <th
                      scope="col"
                      className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Status
                    </th>
                  )}
                  <th
                    scope="col"
                    className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Date Voted
                  </th>
                  {visibleColumns.actions &&
                    (canEditVoter || canDeleteVoter) && (
                      <th
                        scope="col"
                        className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Actions
                      </th>
                    )}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredVoters.map((voter, index) => (
                  <tr
                    key={voter._id}
                    className={`hover:bg-gray-50 transition-colors duration-300 ${
                      recentlyUpdatedVoterId === voter._id
                        ? "bg-green-50 animate-pulse"
                        : ""
                    }`}
                  >
                    <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500">
                      {index + 1}
                    </td>
                    {visibleColumns.name && (
                      <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900">
                        {voter.name}
                      </td>
                    )}
                    {visibleColumns.studentId && (
                      <td className="px-3 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {voter.studentId || "-"}
                      </td>
                    )}
                    {visibleColumns.voterId && (
                      <td className="px-3 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {voter.voterId}
                      </td>
                    )}
                    {visibleColumns.gender && (
                      <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900">
                        {voter.gender}
                      </td>
                    )}
                    {visibleColumns.year && (
                      <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900">
                        {voter.year || "-"}
                      </td>
                    )}
                    {visibleColumns.class && (
                      <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900">
                        {voter.class}
                      </td>
                    )}
                    {visibleColumns.house && (
                      <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900">
                        {voter.house || "-"}
                      </td>
                    )}
                    {visibleColumns.status && (
                      <td className="px-3 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            voter.hasVoted
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {voter.hasVoted ? "Voted" : "Not Voted"}
                        </span>
                      </td>
                    )}
                    <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500">
                      {voter.hasVoted && voter.votedAt
                        ? formatDateTime(voter.votedAt)
                        : "-"}
                    </td>
                    {visibleColumns.actions &&
                      (canEditVoter || canDeleteVoter) && (
                        <td className="px-3 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex justify-end space-x-2">
                            {canEditVoter && (
                              <>
                                <button
                                  onClick={() =>
                                    handleRegenerateVoterId(voter._id)
                                  }
                                  className={`text-indigo-600 hover:text-indigo-900 ${
                                    voter.hasVoted
                                      ? "opacity-50 cursor-not-allowed"
                                      : ""
                                  }`}
                                  disabled={voter.hasVoted}
                                >
                                  <KeyRound className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={() => handleEditVoter(voter)}
                                  className={`ml-2 text-indigo-600 hover:text-indigo-900 ${
                                    voter.hasVoted
                                      ? "opacity-50 cursor-not-allowed"
                                      : ""
                                  }`}
                                  disabled={voter.hasVoted}
                                >
                                  <Edit className="h-4 w-4" />
                                </button>
                              </>
                            )}
                            {canDeleteVoter && (
                              <button
                                onClick={() => handleDeleteVoter(voter._id)}
                                className={`ml-2 text-red-600 hover:text-red-900 ${
                                  voter.hasVoted
                                    ? "opacity-50 cursor-not-allowed"
                                    : ""
                                }`}
                                disabled={voter.hasVoted}
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredVoters.length === 0 && voters.length > 0 && (
            <div className="text-center py-4 text-gray-500">
              No voters found matching your criteria
            </div>
          )}
        </div>
      )}

      {/* Table Information */}
      <div className="bg-white p-4 rounded-lg shadow-md text-sm text-gray-500">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Info className="h-4 w-4 mr-1.5 text-gray-400" />
            <span>
              Showing{" "}
              <span className="font-medium text-gray-900">
                {filteredVoters.length}
              </span>{" "}
              of{" "}
              <span className="font-medium text-gray-900">{voters.length}</span>{" "}
              voters
            </span>
          </div>
          <button
            onClick={() => {
              setSearchTerm("");
              setFilterVoted(null);
              setFilterGender("");
              setFilterClass("");
            }}
            className="text-indigo-600 hover:text-indigo-900"
          >
            Clear all filters
          </button>
        </div>
      </div>

      {/* Import Modal */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity">
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen">
              &#8203;
            </span>
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-3xl sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-indigo-100 sm:mx-0 sm:h-10 sm:w-10">
                    <FileText className="h-6 w-6 text-indigo-600" />
                  </div>
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">
                      Import Voters
                    </h3>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500">
                        Upload a CSV file to import voters in bulk. All columns
                        shown below are required.
                      </p>

                      {/* Column Preview Table - Add overflow-x-auto */}
                      <div className="mt-4 overflow-x-auto">
                        <div className="border border-gray-200 rounded-md max-w-full">
                          <table className="min-w-full divide-y divide-gray-200 text-sm">
                            <thead className="bg-gray-50">
                              <tr>
                                {[
                                  "name",
                                  "studentid",
                                  "gender",
                                  "class",
                                  "year",
                                  "house",
                                ].map((col) => (
                                  <th
                                    key={col}
                                    className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-indigo-50 border-b-2 border-indigo-200"
                                  >
                                    <div className="flex items-center">
                                      <span>{col}</span>
                                      <span className="ml-1 text-red-500">
                                        *
                                      </span>
                                    </div>
                                  </th>
                                ))}
                              </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-100">
                              <tr className="text-gray-600 text-xs">
                                <td className="px-3 py-2">John Doe</td>
                                <td className="px-3 py-2">STD12345</td>
                                <td className="px-3 py-2">Male</td>
                                <td className="px-3 py-2">Science</td>
                                <td className="px-3 py-2">Form4</td>
                                <td className="px-3 py-2">Green House</td>
                              </tr>
                              <tr className="text-gray-600 text-xs bg-gray-50">
                                <td className="px-3 py-2">Jane Smith</td>
                                <td className="px-3 py-2">STD67890</td>
                                <td className="px-3 py-2">Female</td>
                                <td className="px-3 py-2">Arts</td>
                                <td className="px-3 py-2">2025</td>
                                <td className="px-3 py-2">Red House</td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      </div>

                      {/* Template Download - Update template to include Student ID */}
                      <div className="mt-4 flex justify-between">
                        <button
                          type="button"
                          onClick={triggerFileSelection}
                          className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-md shadow-sm flex items-center"
                        >
                          <Upload className="h-4 w-4 mr-2" />
                          {importFile ? "Change File" : "Select CSV File"}
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            // Generate a simple CSV template for download - header only, now with studentid
                            const template =
                              "name,studentid,gender,class,year,house";
                            const blob = new Blob([template], {
                              type: "text/csv;charset=utf-8;",
                            });
                            const url = URL.createObjectURL(blob);
                            const link = document.createElement("a");
                            link.setAttribute("href", url);
                            link.setAttribute(
                              "download",
                              "voter_import_template.csv"
                            );
                            document.body.appendChild(link);
                            link.click();
                            document.body.removeChild(link);
                          }}
                          className="px-3 py-2 text-xs border border-gray-300 rounded text-gray-700 hover:bg-gray-50 flex items-center"
                        >
                          <Download className="h-3 w-3 mr-1" />
                          Download Template
                        </button>
                      </div>

                      {/* Only show a brief error summary here */}
                      {importResults.errors.length > 0 &&
                        importProgress === 100 && (
                          <div className="mt-3 mb-4 p-3 border-l-4 border-red-500 bg-red-50 rounded-md overflow-hidden">
                            <div className="flex items-start">
                              <AlertCircle className="h-5 w-5 text-red-500 mr-2 flex-shrink-0 mt-0.5" />
                              <div className="w-full overflow-hidden">
                                <p className="text-sm font-medium text-red-800 mb-1">
                                  Import failed
                                </p>
                                <p className="text-xs text-red-700">
                                  See detailed results below.
                                </p>
                              </div>
                            </div>
                          </div>
                        )}

                      {importFile && (
                        <div className="mt-3 p-2 bg-indigo-50 rounded-md">
                          <p className="text-sm font-medium text-indigo-800">
                            Selected file: {importFile.name}
                          </p>
                          <p className="text-xs text-indigo-500">
                            Size: {(importFile.size / 1024).toFixed(2)} KB
                          </p>
                        </div>
                      )}

                      {isImporting && (
                        <div className="mt-4">
                          <div className="relative pt-1">
                            <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-indigo-200">
                              <div
                                style={{ width: `${importProgress}%` }}
                                className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-indigo-500 transition-all duration-500"
                              ></div>
                            </div>
                            <p className="text-center text-sm text-indigo-700">
                              Processing...
                            </p>
                          </div>
                        </div>
                      )}

                      {importResults.total > 0 &&
                        importProgress === 100 &&
                        !isImporting && (
                          <div
                            className={`mt-4 border rounded-md p-3 ${
                              importResults.failed > 0
                                ? "border-orange-200 bg-orange-50"
                                : "border-green-200 bg-green-50"
                            }`}
                          >
                            {/* ...existing results display code... */}
                            <h4 className="font-medium text-gray-700">
                              Import Results
                            </h4>
                            <div className="mt-2 space-y-1">
                              <p className="text-sm">
                                Total: {importResults.total} voters
                              </p>
                              <p className="text-sm text-green-600 font-medium">
                                Success: {importResults.success} voters
                              </p>
                              {importResults.failed > 0 && (
                                <p className="text-sm text-red-600 font-medium">
                                  Failed: {importResults.failed} voters
                                </p>
                              )}

                              {importResults.errors.length > 0 && (
                                <div className="mt-2">
                                  <p className="text-sm font-medium text-red-700">
                                    Errors:
                                  </p>
                                  <div className="max-h-32 overflow-y-auto pr-2 mt-1">
                                    <ul className="list-disc pl-5 text-xs text-red-600">
                                      {importResults.errors.map(
                                        (error, index) => (
                                          <li
                                            key={index}
                                            className="break-words"
                                          >
                                            {error}
                                          </li>
                                        )
                                      )}
                                    </ul>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                {/* Only show Start Import button if a file is selected */}
                {importFile &&
                (importResults.total === 0 || importProgress !== 100) ? (
                  <>
                    <button
                      type="button"
                      className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:ml-3 sm:w-auto sm:text-sm"
                      onClick={handleStartImport}
                      disabled={isImporting}
                    >
                      {isImporting ? "Importing..." : "Start Import"}
                    </button>
                  </>
                ) : importResults.total > 0 && importProgress === 100 ? (
                  <>
                    <button
                      type="button"
                      className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:ml-3 sm:w-auto sm:text-sm"
                      onClick={handleCloseImport}
                    >
                      Close
                    </button>
                    <button
                      type="button"
                      className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                      onClick={triggerFileSelection}
                    >
                      Select New File
                    </button>
                  </>
                ) : null}

                <button
                  type="button"
                  className={`${
                    importFile && importResults.total === 0 ? "mt-3" : ""
                  } w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 ${
                    importFile && importResults.total === 0 ? "sm:ml-3" : ""
                  } sm:w-auto sm:text-sm`}
                  onClick={handleCloseImport}
                  disabled={isImporting}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VotersManager;
