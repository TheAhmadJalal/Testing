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

import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search,
  X,
  AlertCircle,
  RefreshCw,
  ArrowLeft,
  BarChart2,
  Check,
  Calendar,
  Clock,
  Shield,
} from "lucide-react";
import { useSettings } from "../context/SettingsContext";
import { motion, AnimatePresence } from "framer-motion";
import { Doughnut } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";
import { parseDateTime, formatDuration } from "../utils/dateUtils"; // Add this import

// Register ChartJS components
ChartJS.register(ArcElement, Tooltip, Legend);

// Define types for the results data
interface Candidate {
  _id: string;
  name: string;
  positionId: string;
  image?: string;
  biography?: string;
  isActive: boolean;
  isAbstention?: boolean; // Add this property
}

interface Position {
  _id: string;
  title: string;
  priority: number;
  maxVotes: number;
  isActive: boolean;
  electionId?: string;
}

interface ResultItem {
  position: Position;
  candidates: Array<{
    candidate: Candidate;
    voteCount: number;
    percentage: number;
  }>;
  totalVotes: number;
}

interface VoterStats {
  total: number;
  voted: number;
  notVoted: number;
  percentage: number;
}

const VoterResults: React.FC = () => {
  const navigate = useNavigate();
  const { settings } = useSettings();
  const [results, setResults] = useState<ResultItem[]>([]);
  const [voterStats, setVoterStats] = useState<VoterStats>({
    total: 0,
    voted: 0,
    notVoted: 0,
    percentage: 0,
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [filterPosition, setFilterPosition] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notification, setNotification] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const [positions, setPositions] = useState<Position[]>([]);
  const [electionStatus, setElectionStatus] = useState<{
    isActive: boolean;
    resultsPublished: boolean;
    status?: string;
    startDate?: string;
    endDate?: string;
    startTime?: string;
    endTime?: string;
    votingStartDate?: string;
    votingEndDate?: string;
    votingStartTime?: string;
    votingEndTime?: string;
    date?: string;
  }>({ isActive: false, resultsPublished: false });

  // Add these new states to match VotingAuth.tsx
  const [timeRemaining, setTimeRemaining] = useState("");
  const [statusType, setStatusType] = useState<
    "not-started" | "active" | "ended"
  >("not-started");
  const [statusLoading, setStatusLoading] = useState(true);

  // Fetch election results from the API
  const fetchResults = async () => {
    try {
      setIsLoading(true);
      setError(null);
      setStatusLoading(true); // Add loading state for election status

      // First, check election status
      const statusResponse = await fetch(
        `${
          import.meta.env.VITE_API_URL || "http://localhost:5000"
        }/api/election/status`
      );

      if (!statusResponse.ok) {
        throw new Error(
          `Failed to fetch election status: ${statusResponse.status}`
        );
      }

      const statusData = await statusResponse.json();
      console.log("Election status data:", statusData);
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

      console.log(
        "isActive:",
        statusData.isActive,
        "resultsPublished:",
        statusData.resultsPublished
      );

      // Store the original status data
      setElectionStatus(statusData);

      // Use the updateTimeRemaining function to update status and time
      updateTimeRemaining(statusData);

      // Calculate if the election has actually ended based on date/time
      let hasElectionEnded = false;

      if (statusData.endDate && statusData.endTime) {
        const now = new Date();
        const endDate = new Date(`${statusData.endDate}T${statusData.endTime}`);
        hasElectionEnded = now > endDate;
        console.log("Current time check:", {
          now: now.toISOString(),
          endDate: endDate.toISOString(),
          hasElectionEnded,
        });
      }

      // Modified condition - Check if server reports active AND time hasn't ended
      // Allow viewing results if EITHER:
      // 1. Server reports election as inactive, OR
      // 2. Current time is past the election end time
      if (statusData.isActive && !hasElectionEnded) {
        console.log("Cannot view results: election is still active");
        setError("Results can only be viewed after the election ends");
        setIsLoading(false);
        return;
      }

      console.log("Proceeding to fetch results");

      // Get current election results
      const response = await fetch(
        `${
          import.meta.env.VITE_API_URL || "http://localhost:5000"
        }/api/results?timestamp=${Date.now()}`
      );

      if (!response.ok) {
        if (response.status === 404) {
          setResults([]);
          setVoterStats({
            total: 0,
            voted: 0,
            notVoted: 0,
            percentage: 0,
          });
          setIsLoading(false);
          throw new Error("No results found");
        }
        throw new Error(`Failed to fetch results: ${response.status}`);
      }

      const data = await response.json();
      console.log("Results data received:", data ? "Yes" : "No"); // Debug log

      // Set the fetched data
      setResults(data.results || []);
      setVoterStats(
        data.stats || {
          total: 0,
          voted: 0,
          notVoted: 0,
          percentage: 0,
        }
      );

      // Fetch positions for filtering
      fetchPositions();
    } catch (error: any) {
      console.error("Error fetching results:", error);
      setError(error.message || "Failed to load election results");
    } finally {
      setIsLoading(false);
      setStatusLoading(false);
    }
  };

  // Add the same updateTimeRemaining function from VotingAuth.tsx
  const updateTimeRemaining = useCallback(
    (election?: any) => {
      const currentElection = election || electionStatus;

      if (!currentElection) {
        setTimeRemaining("Loading...");
        return;
      }

      try {
        // Get current time as a UTC timestamp (equivalent to Ghana/Accra local time)
        const nowUTC = Date.now();

        // Always use voting times directly with fallbacks
        // Add safety checks to prevent undefined values
        const startDate =
          currentElection.votingStartDate ||
          currentElection.startDate ||
          currentElection.date ||
          new Date().toISOString().split("T")[0]; // Fallback to today

        const endDate =
          currentElection.votingEndDate ||
          currentElection.endDate ||
          currentElection.date ||
          new Date().toISOString().split("T")[0]; // Fallback to today

        const startTime =
          currentElection.votingStartTime ||
          currentElection.startTime ||
          "08:00";

        const endTime =
          currentElection.votingEndTime || currentElection.endTime || "17:00";

        // Validate date strings before parsing
        if (!startDate || !endDate) {
          console.error("Missing date information in election data");
          setTimeRemaining("Date information unavailable");
          setStatusLoading(false);
          return;
        }

        // Validate time strings before parsing
        if (!startTime || !endTime) {
          console.error("Missing time information in election data");
          setTimeRemaining("Time information unavailable");
          setStatusLoading(false);
          return;
        }

        // Parse voting period into Date objects using UTC (Ghana/Accra time)
        const votingStart = parseDateTime(startDate, startTime);
        const votingEnd = parseDateTime(endDate, endTime);

        // Compare timestamps for accurate time comparison
        if (nowUTC > votingEnd.getTime()) {
          // If current time is after the end time
          setStatusType("ended");
          setTimeRemaining("Election has ended");
        } else if (nowUTC >= votingStart.getTime()) {
          // If current time is between start and end
          setStatusType("active");
          const diff = votingEnd.getTime() - nowUTC;
          setTimeRemaining(formatDuration(diff));
        } else {
          // If current time is before the start time
          setStatusType("not-started");
          const diff = votingStart.getTime() - nowUTC;
          setTimeRemaining(formatDuration(diff));
        }

        // End loading state after status determination
        setStatusLoading(false);
      } catch (error) {
        console.error("Error calculating time remaining:", error);
        // Provide a more specific error message for debugging
        if (error instanceof Error) {
          console.error(`Details: ${error.message}`);
        }
        setTimeRemaining("Time calculation error");
        setStatusLoading(false);
      }
    },
    [electionStatus]
  );

  // Add the timer effect from VotingAuth.tsx
  useEffect(() => {
    if (Object.keys(electionStatus).length > 0) {
      updateTimeRemaining();
    }

    const timer = setInterval(() => {
      updateTimeRemaining();
    }, 1000);

    return () => clearInterval(timer);
  }, [electionStatus, updateTimeRemaining]);

  // Fetch positions for filtering
  const fetchPositions = async () => {
    try {
      const response = await fetch(
        `${
          import.meta.env.VITE_API_URL || "http://localhost:5000"
        }/api/positions`
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch positions: ${response.status}`);
      }

      const data = await response.json();
      setPositions(data);
    } catch (error: any) {
      console.error("Error fetching positions:", error);
      // Don't show error for this, just use empty array
      setPositions([]);
    }
  };

  // Load data on component mount
  useEffect(() => {
    fetchResults();
  }, []);

  // Filter results based on search term and position filter
  const filteredResults = React.useMemo(() => {
    // First, apply the basic filters
    const filtered = results.filter(
      (result) =>
        (filterPosition === "" || result.position._id === filterPosition) &&
        (searchTerm === "" ||
          result.position.title
            .toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          result.candidates.some((c) =>
            c.candidate.name.toLowerCase().includes(searchTerm.toLowerCase())
          ))
    );

    // Then deduplicate by position title
    const positionMap = new Map<string, ResultItem>();

    filtered.forEach((result) => {
      const existingResult = positionMap.get(result.position.title);

      // If this position doesn't exist yet, or has more votes than the existing one, use this one
      if (!existingResult || result.totalVotes > existingResult.totalVotes) {
        positionMap.set(result.position.title, result);
      }
    });

    // Convert the map back to an array and sort by position priority if available
    return Array.from(positionMap.values()).sort(
      (a, b) => a.position.priority - b.position.priority
    );
  }, [results, filterPosition, searchTerm]);

  // Handle return to voting page
  const handleReturn = () => {
    navigate("/");
  };

  // Format date for display
  const formatElectionDate = (dateString?: string) => {
    if (!dateString) return "Unknown date";

    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-US", {
        day: "numeric",
        month: "long",
        year: "numeric",
      });
    } catch (e) {
      console.error("Error formatting date:", e);
      return dateString;
    }
  };

  // Prepare chart data for voter stats
  const chartData = {
    labels: ["Votes Cast", "Not Voted"],
    datasets: [
      {
        data: [voterStats.voted, voterStats.notVoted],
        backgroundColor: ["rgba(16, 185, 129, 0.9)", "rgba(239, 68, 68, 0.9)"],
        borderColor: ["rgba(16, 185, 129, 1)", "rgba(239, 68, 68, 1)"],
        borderWidth: 2,
        cutout: "80%",
        borderRadius: 10,
        spacing: 5,
      },
    ],
  };

  const chartOptions = {
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        enabled: false,
      },
    },
    maintainAspectRatio: false,
    rotation: -90,
    circumference: 360,
    animation: {
      animateRotate: true,
      animateScale: true,
    },
  };

  // Format percentage to avoid long decimals
  const formatPercentage = (value: number) => {
    if (typeof value !== "number") {
      return 0;
    }
    return Math.round(value);
  };

  // Render loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md text-center">
          <RefreshCw className="h-12 w-12 text-indigo-500 animate-spin mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-800 mb-2">
            Loading Results
          </h2>
          <p className="text-gray-600">
            Please wait while we fetch the election results...
          </p>
        </div>
      </div>
    );
  }

  // Render error state
  if (error) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
          <div className="flex flex-col items-center text-center">
            <AlertCircle className="h-12 w-12 text-yellow-500 mb-4" />
            <h2 className="text-xl font-semibold text-gray-800 mb-2">
              Results Not Available Yet
            </h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <button
              onClick={handleReturn}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Return to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Main component render
  return (
    <div className="min-h-screen bg-white p-4 sm:p-6 md:p-8 pb-20">
      <div className="max-w-7xl mx-auto">
        {/* Header with election info and controls */}
        <div className="bg-white rounded-lg shadow-lg mb-6 p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              {/* Make election title more prominent */}
              <h1 className="text-3xl font-extrabold text-indigo-800 mb-1">
                {settings?.electionTitle || "Student Council Election"}
              </h1>
              <div className="flex items-center text-gray-600 text-sm">
                <BarChart2 className="h-5 w-5 text-indigo-600 mr-2" />
                <span className="font-medium">Election Results</span>
              </div>
            </div>
            <div className="flex items-center">
              <button
                onClick={handleReturn}
                className="inline-flex items-center px-3 py-2 border border-transparent text-sm rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Return to Home
              </button>
            </div>
          </div>

          {/* Election status banner - Update to match VotingAuth.tsx */}
          <div className="mt-4 flex flex-col sm:flex-row sm:items-center space-y-3 sm:space-y-0 sm:space-x-4">
            <div className="bg-indigo-100 backdrop-blur-sm rounded-lg px-3 py-2 border border-indigo-200 flex items-center">
              <Calendar className="h-4 w-4 mr-2 flex-shrink-0 text-indigo-600" />
              <span className="text-xs sm:text-sm font-bold text-indigo-700">
                {formatElectionDate(electionStatus.endDate)}
              </span>
            </div>

            {/* Update status banner to match VotingAuth.tsx */}
            <div
              className="rounded-lg px-3 py-2 text-xs sm:text-sm font-medium flex items-center"
              style={{
                backgroundColor: statusLoading
                  ? "rgb(156, 163, 175)" // gray-400
                  : statusType === "active"
                  ? "rgb(34, 197, 94)" // green-500
                  : statusType === "ended"
                  ? "rgb(107, 114, 128)" // gray-500
                  : "rgb(253, 224, 71)", // yellow-300
                color:
                  statusType === "not-started" && !statusLoading
                    ? "black"
                    : "white",
                transition: "background-color 0.5s ease, color 0.5s ease",
              }}
            >
              <Clock className="h-4 w-4 mr-2 flex-shrink-0" />
              <span>
                {statusLoading ? (
                  "Loading election status..."
                ) : statusType === "active" ? (
                  <>Election in progress • Ends in: {timeRemaining}</>
                ) : statusType === "ended" ? (
                  <>Election has ended</>
                ) : timeRemaining === "Election scheduled but not active" ? (
                  <>Election is scheduled but waiting to be activated</>
                ) : (
                  <>Election starts in: {timeRemaining}</>
                )}
              </span>
            </div>
          </div>

          {/* Stats Summary with animations */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="bg-blue-50 rounded-lg p-3 border border-blue-100"
            >
              <div className="flex justify-between items-center">
                <div className="md:text-left">
                  <p className="text-sm text-blue-600 font-medium">
                    Total Voters
                  </p>
                  <p className="text-xl font-bold text-blue-700">
                    {voterStats.total}
                  </p>
                </div>
              </div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="bg-green-50 rounded-lg p-3 border border-green-100"
            >
              <div className="flex justify-between items-center">
                <div className="md:text-left">
                  <p className="text-sm text-green-600 font-medium">
                    Votes Cast
                  </p>
                  <p className="text-xl font-bold text-green-700">
                    {voterStats.voted}
                  </p>
                </div>
              </div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="relative bg-purple-50 rounded-lg p-3 border border-purple-100"
            >
              <div className="flex justify-between items-center">
                <div className="md:text-left">
                  <p className="text-sm text-purple-600 font-medium">
                    Voter Turnout
                  </p>
                  <p className="text-xl font-bold text-purple-700">
                    {formatPercentage(voterStats.percentage)}%
                  </p>
                </div>
                <div className="h-10 w-10 flex-shrink-0">
                  <Doughnut data={chartData} options={chartOptions} />
                </div>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Search and Filter */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="bg-white rounded-lg shadow-md p-4 mb-6"
        >
          <div className="flex flex-col md:flex-row md:items-center space-y-3 md:space-y-0 gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  placeholder="Search positions or candidates..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            {/* Position filter */}
            {positions.length > 0 && (
              <div>
                <select
                  className="block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  value={filterPosition}
                  onChange={(e) => setFilterPosition(e.target.value)}
                >
                  <option value="">All Positions</option>
                  {positions.map((position) => (
                    <option key={position._id} value={position._id}>
                      {position.title}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </motion.div>

        {/* Results Grid with Animations */}
        <AnimatePresence>
          {filteredResults.length > 0 ? (
            <motion.div
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-40"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.5 }}
            >
              {filteredResults.map((result, index) => (
                <motion.div
                  key={result.position._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.5 + index * 0.1 }}
                  className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300"
                >
                  <div className="p-4 bg-gradient-to-r from-indigo-50 to-purple-50 border-b">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {result.position.title}
                    </h3>
                    <p className="text-sm text-gray-500">
                      Total Votes: {result.totalVotes}
                    </p>
                  </div>

                  <div className="p-4 space-y-4">
                    {result.candidates
                      .sort((a, b) => b.voteCount - a.voteCount)
                      .map((candidateResult, index) => {
                        const candidate = candidateResult.candidate;
                        return (
                          <motion.div
                            key={candidate._id}
                            className="space-y-2"
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{
                              duration: 0.3,
                              delay: 0.7 + index * 0.05,
                            }}
                          >
                            <div className="flex items-center space-x-3">
                              <div className="relative">
                                {candidate.image ? (
                                  <img
                                    src={candidate.image}
                                    alt={candidate.name}
                                    className="h-10 w-10 rounded-full object-cover border-2 border-white shadow-sm"
                                  />
                                ) : (
                                  <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center border-2 border-white shadow-sm">
                                    <span className="text-indigo-800 font-medium text-sm">
                                      {candidate.name.charAt(0)}
                                    </span>
                                  </div>
                                )}
                                {index === 0 && result.totalVotes > 0 && (
                                  <div className="absolute -top-1 -right-1 bg-green-500 text-white rounded-full w-4 h-4 flex items-center justify-center text-xs shadow-sm">
                                    <Check className="h-3 w-3" />
                                  </div>
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex justify-between items-center mb-1">
                                  <span className="text-sm font-medium text-gray-900">
                                    {candidate.name}
                                  </span>
                                  <div className="flex items-center">
                                    <span className="text-sm font-medium text-indigo-600">
                                      {candidateResult.voteCount}
                                    </span>
                                    <span className="text-xs text-gray-500 ml-1">
                                      ({candidateResult.percentage.toFixed(1)}%)
                                    </span>
                                  </div>
                                </div>
                                <div className="relative mt-2">
                                  <div className="overflow-hidden h-2 text-xs flex rounded bg-gray-100">
                                    <motion.div
                                      initial={{ width: 0 }}
                                      animate={{
                                        width: `${candidateResult.percentage}%`,
                                      }}
                                      transition={{
                                        duration: 1,
                                        delay: 0.8 + index * 0.1,
                                      }}
                                      className={`shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center ${
                                        index === 0
                                          ? "bg-green-500"
                                          : index === 1
                                          ? "bg-yellow-500"
                                          : "bg-indigo-500"
                                      }`}
                                    ></motion.div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        );
                      })}

                    {/* Abstentions - Add this section */}
                    {result.totalVotes > 0 && (
                      <motion.div
                        className="space-y-2"
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{
                          duration: 0.3,
                          delay: 0.7 + result.candidates.length * 0.05,
                        }}
                      >
                        <div className="flex items-center space-x-3">
                          <div className="relative">
                            <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center border-2 border-white shadow-sm">
                              <X className="h-5 w-5 text-red-500" />
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-center mb-1">
                              <span className="text-sm font-medium text-gray-900">
                                Abstentions
                              </span>
                              <div className="flex items-center">
                                {(() => {
                                  // First check if there's a special abstention candidate
                                  const noneCandidate = result.candidates.find(
                                    (c) =>
                                      c.candidate.isAbstention === true ||
                                      c.candidate.name.toLowerCase() ===
                                        "none" ||
                                      c.candidate.name.toLowerCase() ===
                                        "none of the listed" ||
                                      c.candidate.name.toLowerCase() ===
                                        "abstain"
                                  );

                                  // If there is a "None" candidate, use its votes
                                  if (noneCandidate) {
                                    return (
                                      <>
                                        <span className="text-sm font-medium text-indigo-600">
                                          {noneCandidate.voteCount}
                                        </span>
                                        <span className="text-xs text-gray-500 ml-1">
                                          ({noneCandidate.percentage.toFixed(1)}
                                          %)
                                        </span>
                                      </>
                                    );
                                  }

                                  // Otherwise fall back to the original calculation
                                  const totalCandidateVotes =
                                    result.candidates.reduce(
                                      (sum, c) => sum + c.voteCount,
                                      0
                                    );

                                  const abstentions = Math.max(
                                    0,
                                    result.totalVotes - totalCandidateVotes
                                  );

                                  // Calculate abstention percentage
                                  const abstentionPercentage =
                                    result.totalVotes > 0
                                      ? (
                                          (abstentions / result.totalVotes) *
                                          100
                                        ).toFixed(1)
                                      : "0.0";

                                  return (
                                    <>
                                      <span className="text-sm font-medium text-indigo-600">
                                        {abstentions}
                                      </span>
                                      <span className="text-xs text-gray-500 ml-1">
                                        ({abstentionPercentage}%)
                                      </span>
                                    </>
                                  );
                                })()}
                              </div>
                            </div>
                            <div className="relative mt-2">
                              <div className="overflow-hidden h-2 text-xs flex rounded bg-gray-100">
                                <motion.div
                                  initial={{ width: 0 }}
                                  animate={{
                                    width: (() => {
                                      // First check if there's a special abstention candidate
                                      const noneCandidate =
                                        result.candidates.find(
                                          (c) =>
                                            c.candidate.isAbstention === true ||
                                            c.candidate.name.toLowerCase() ===
                                              "none" ||
                                            c.candidate.name.toLowerCase() ===
                                              "none of the listed" ||
                                            c.candidate.name.toLowerCase() ===
                                              "abstain"
                                        );

                                      // If there is a "None" candidate, use its percentage
                                      if (noneCandidate) {
                                        return `${noneCandidate.percentage}%`;
                                      }

                                      // Otherwise fall back to the original calculation
                                      const totalCandidateVotes =
                                        result.candidates.reduce(
                                          (sum, c) => sum + c.voteCount,
                                          0
                                        );
                                      const abstentions = Math.max(
                                        0,
                                        result.totalVotes - totalCandidateVotes
                                      );
                                      return result.totalVotes > 0
                                        ? (abstentions / result.totalVotes) *
                                            100
                                        : 0;
                                    })(),
                                  }}
                                  transition={{
                                    duration: 1,
                                    delay: 0.8 + result.candidates.length * 0.1,
                                  }}
                                  className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-red-500"
                                ></motion.div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </div>
                </motion.div>
              ))}
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="bg-white p-8 text-center rounded-lg shadow-md"
            >
              <BarChart2 className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">
                No results found
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                {results.length === 0
                  ? "No votes have been cast yet in this election."
                  : "Try adjusting your search terms"}
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Fixed Footer - Updated to be fixed at bottom */}
      </div>

      {/* Footer - Modified to be fixed at bottom */}
      <div className="fixed bottom-0 left-0 right-0 p-3 text-xs text-gray-600 border-t border-gray-200 bg-white z-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2 max-w-7xl mx-auto">
          {/* Empty column on desktop to help with centering */}
          <div className="hidden md:block"></div>

          {/* Middle content - centered on all screens */}
          <div className="flex items-center justify-center mb-2 md:mb-0">
            <Shield className="h-3 w-3 mr-1 flex-shrink-0" />
            <span className="whitespace-nowrap">
              Monitored by Secured Smart System (Contact +233 24 333 9546)
            </span>
          </div>

          {/* Right content - centered on mobile, right-aligned on desktop */}
          <div className="  flex justify-end">
            <div className="text-right font-medium hover:underline transition-colors duration-200">
              <span className="text-gray-400 hover:text-gray-300 text-xs">
                Developed by{" "}
              </span>
              <span className="text-indigo-500 hover:text-indigo-400 text-xs ml-1">
                Packets Out LLC
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VoterResults;
