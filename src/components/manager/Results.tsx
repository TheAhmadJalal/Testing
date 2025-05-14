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

import React, { useState, useEffect, useRef } from "react";
import {
  Search,
  Download,
  FileSpreadsheet,
  Printer,
  Users,
  Check,
  AlertCircle,
  BarChart2,
  X,
  ChevronRight,
  Eye,
  EyeOff,
  ArrowLeft,
  Maximize2,
  Minimize2,
  ChevronLeft,
  Trophy,
  Star,
  Award,
  Medal,
  Crown,
  RefreshCw,
  Save,
  Loader,
} from "lucide-react";
import { useUser } from "../../context/UserContext";
import { useSettings } from "../../context/SettingsContext";
import { motion, AnimatePresence } from "framer-motion";

// Define types for the results data
interface Candidate {
  _id: string;
  name: string;
  positionId: string;
  image?: string;
  biography?: string;
  class?: string;
  house?: string;
  year?: string;
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

const Results: React.FC = () => {
  const { hasPermission } = useUser();
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
  const [chartType, setChartType] = useState<"bar" | "pie">("bar");
  const [electionStatus, setElectionStatus] = useState<{
    isActive: boolean;
    resultsPublished: boolean;
  }>({ isActive: false, resultsPublished: false });

  // New state variables for enhanced features
  const [showDeclaration, setShowDeclaration] = useState(false);
  const [revealedCandidates, setRevealedCandidates] = useState<string[]>([]);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [currentPositionIndex, setCurrentPositionIndex] = useState(0);
  const [confettiActive, setConfettiActive] = useState(false);

  // Check user permissions once instead of using PermissionGuard everywhere
  const canViewResults = hasPermission("results", "view");
  const canManageResults = hasPermission("results", "edit");

  // Track fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullScreen(!!document.fullscreenElement);
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () =>
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  // Fetch election results from the API
  const fetchResults = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Get authentication token
      const token = localStorage.getItem("token");
      const headers = {
        "Content-Type": "application/json",
        Authorization: token ? `Bearer ${token}` : "",
      };

      // First, get the current election
      const electionResponse = await fetch(
        `${
          import.meta.env.VITE_API_URL || "http://localhost:5000"
        }/api/elections/current`,
        { headers }
      );

      if (!electionResponse.ok) {
        throw new Error(
          `Failed to fetch current election: ${electionResponse.status}`
        );
      }

      const currentElection = await electionResponse.json();
      console.log("Current election fetched:", currentElection);

      // Check if the current election is active
      if (!currentElection.isActive) {
        setError("There is no active election. Results cannot be displayed.");
        setResults([]);
        setVoterStats({
          total: 0,
          voted: 0,
          notVoted: 0,
          percentage: 0,
        });
        setIsLoading(false);
        return;
      }

      // Make sure we're explicitly requesting the current election's results
      const response = await fetch(
        `${
          import.meta.env.VITE_API_URL || "http://localhost:5000"
        }/api/results?electionId=${
          currentElection._id
        }&timestamp=${Date.now()}`, // Added timestamp to prevent caching
        { headers }
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
          return;
        }
        throw new Error(`Failed to fetch results: ${response.status}`);
      }

      const data = await response.json();
      console.log(
        `Fetched results for election: ${currentElection.title} (${currentElection._id})`
      );
      console.log(
        `Results contain ${data.results ? data.results.length : 0} positions`
      );

      // Verify results belong to current election by checking position electionId
      if (data.results && data.results.length > 0) {
        for (const result of data.results) {
          if (
            result.position &&
            result.position.electionId &&
            result.position.electionId !== currentElection._id
          ) {
            console.warn("Results contain data from incorrect election");
            throw new Error("Received results from incorrect election");
          }
        }
      }

      setResults(data.results);
      setVoterStats(data.stats);
    } catch (error: any) {
      console.error("Error fetching results:", error);
      setError(error.message || "Failed to load election results");
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch positions for filtering
  const fetchPositions = async () => {
    try {
      // Get authentication token
      const token = localStorage.getItem("token");
      const headers = {
        "Content-Type": "application/json",
        Authorization: token ? `Bearer ${token}` : "",
      };

      // First, get the current election
      const electionResponse = await fetch(
        `${
          import.meta.env.VITE_API_URL || "http://localhost:5000"
        }/api/elections/current`,
        { headers }
      );

      if (!electionResponse.ok) {
        throw new Error(
          `Failed to fetch current election: ${electionResponse.status}`
        );
      }

      const currentElection = await electionResponse.json();
      console.log("Current election fetched for positions:", currentElection);

      // Check if the current election is active
      if (!currentElection.isActive) {
        setPositions([]); // Clear positions if election is inactive
        return; // Do not fetch positions if election is inactive
      }

      // Then fetch positions specifically for this election ID
      const response = await fetch(
        `${
          import.meta.env.VITE_API_URL || "http://localhost:5000"
        }/api/positions?electionId=${
          currentElection._id
        }&timestamp=${Date.now()}`, // Added timestamp to prevent caching
        { headers }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch positions: ${response.status}`);
      }

      const data = await response.json();
      console.log(
        `Fetched ${data.length} positions for election ID: ${currentElection._id}`
      );

      // Filter positions to ensure they belong to the current election
      const filteredPositions = data.filter(
        (p: Position) => p.electionId === currentElection._id
      );

      if (filteredPositions.length < data.length) {
        console.warn(
          `Filtered out ${
            data.length - filteredPositions.length
          } positions from other elections`
        );
      }

      setPositions(filteredPositions);
    } catch (error: any) {
      console.error("Error fetching positions:", error);
    }
  };

  // Updated fetchElectionStatus function to improve error handling and logging
  const fetchElectionStatus = async () => {
    try {
      // Get authentication token
      const token = localStorage.getItem("token");
      const headers = {
        "Content-Type": "application/json",
        Authorization: token ? `Bearer ${token}` : "",
      };

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10-second timeout

      const response = await fetch(
        `${
          import.meta.env.VITE_API_URL || "http://localhost:5000"
        }/api/election/status`,
        { headers, signal: controller.signal }
      );

      clearTimeout(timeoutId);

      if (!response.ok) {
        if (response.status === 404) {
          // Set default status until API is ready
          setElectionStatus({ isActive: false, resultsPublished: false });
          return;
        }
        throw new Error(`Failed to fetch election status: ${response.status}`);
      }

      const data = await response.json();
      setElectionStatus(data);
    } catch (error) {
      console.error("Error fetching election status:", error);
      // Don't show error for this, just use defaults
      setElectionStatus({ isActive: false, resultsPublished: false });
    }
  };

  // Load data on component mount
  useEffect(() => {
    if (canViewResults) {
      fetchResults();
      fetchPositions();
      fetchElectionStatus();
    }
  }, [canViewResults]);

  // Filter results based on search term and position filter, then deduplicate positions
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

  // Print results with grid layout matching the image
  const handlePrint = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      alert("Please allow pop-ups to print");
      return;
    }

    const styles = `
      <style>
        body { 
          font-family: Arial, sans-serif; 
          margin: 0; 
          padding: 20px;
          background-color: #f5f5f5;
        }
        .container {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 20px;
          max-width: 1200px;
          margin: 0 auto;
        }
        .position-card {
          background: white;
          border-radius: 10px;
          overflow: hidden;
          box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        }
        .position-header {
          padding: 15px;
          background-color: #f9f9f9;
          border-bottom: 1px solid #eee;
        }
        .position-title {
          font-size: 18px;
          font-weight: bold;
          margin: 0;
          color: #333;
        }
        .total-votes {
          font-size: 14px;
          color: #666;
          margin: 5px 0 0 0;
        }
        .candidates-list {
          padding: 15px;
        }
        .candidate-row {
          display: flex;
          align-items: center;
          margin-bottom: 15px;
        }
        .candidate-rank {
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: #4caf50;
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: bold;
          font-size: 12px;
          position: absolute;
          top: -3px;
          right: -3px;
        }
        .candidate-rank-2 {
          background: #ff9800;
        }
        .candidate-image-container {
          position: relative;
          margin-right: 12px;
        }
        .candidate-image {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          object-fit: cover;
          border: 2px solid white;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .candidate-info {
          flex: 1;
        }
        .candidate-name {
          font-size: 14px;
          font-weight: 500;
          color: #333;
          margin: 0 0 4px 0;
        }
        .progress-container {
          height: 8px;
          background-color: #e9ecef;
          border-radius: 4px;
          overflow: hidden;
          margin-top: 6px;
        }
        .progress-bar {
          height: 100%;
          border-radius: 4px;
        }
        .progress-bar-1 {
          background-color: #4caf50;
        }
        .progress-bar-2 {
          background-color: #ff9800;
        }
        .progress-bar-other {
          background-color: #2196f3;
        }
        .vote-count {
          font-size: 14px;
          font-weight: 500;
          color: #2196f3;
          margin-left: 8px;
        }
        .vote-percentage {
          font-size: 12px;
          color: #666;
        }
        .candidate-votes {
          text-align: right;
          white-space: nowrap;
        }
        @media print {
          body {
            background-color: white;
            padding: 0;
          }
          .container {
            width: 100%;
            max-width: none;
          }
          .position-card {
            break-inside: avoid;
            box-shadow: none;
            border: 1px solid #eee;
          }
        }
        .footer {
          margin-top: 40px;
          text-align: center;
          font-size: 12px;
          color: #6b7280;
          border-top: 1px solid #e5e7eb;
          padding-top: 20px;
        }
      </style>
    `;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Election Results - ${
            settings?.electionTitle || "Election"
          }</title>
          ${styles}
        </head>
        <body>
          <div class="container">
            ${filteredResults
              .map(
                (result) => `
              <div class="position-card">
                <div class="position-header">
                  <h3 class="position-title">${result.position.title}</h3>
                  <p class="total-votes">Total Votes: ${result.totalVotes}</p>
                </div>
                <div class="candidates-list">
                  ${result.candidates
                    .sort((a, b) => b.voteCount - a.voteCount)
                    .map((candidateResult, index) => {
                      const candidate = candidateResult.candidate;
                      // Calculate percentage correctly without relying on candidateResult.percentage
                      const percentage =
                        result.totalVotes > 0
                          ? (
                              (candidateResult.voteCount / result.totalVotes) *
                              100
                            ).toFixed(1)
                          : "0.0";

                      return `
                      <div class="candidate-row">
                        <div class="candidate-image-container">
                          ${
                            candidate.image
                              ? `<img src="${candidate.image}" alt="${candidate.name}" class="candidate-image">`
                              : `<div class="candidate-image" style="background-color: #e6e6e6; display: flex; align-items: center; justify-content: center; font-size: 16px; color: #666;">${candidate.name.charAt(
                                  0
                                )}</div>`
                          }
                          ${
                            index === 0
                              ? '<div class="candidate-rank">1</div>'
                              : index === 1
                              ? '<div class="candidate-rank candidate-rank-2">2</div>'
                              : ""
                          }
                        </div>
                        <div class="candidate-info">
                          <p class="candidate-name">${candidate.name}</p>
                          <div class="progress-container">
                            <div 
                              class="progress-bar ${
                                index === 0
                                  ? "progress-bar-1"
                                  : index === 1
                                  ? "progress-bar-2"
                                  : "progress-bar-other"
                              }" 
                              style="width: ${percentage}%"
                            ></div>
                          </div>
                        </div>
                        <div class="candidate-votes">
                          <span class="vote-count">${
                            candidateResult.voteCount
                          }</span>
                          <span class="vote-percentage">(${percentage}%)</span>
                        </div>
                      </div>
                    `;
                    })
                    .join("")}
                    
                  ${
                    result.totalVotes > 0
                      ? `
                    <div class="candidate-row">
                      <div class="candidate-image-container">
                        <div class="candidate-image" style="background-color: #ffebee; display: flex; align-items: center; justify-content: center;">
                          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f44336" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                          </svg>
                        </div>
                      </div>
                      <div class="candidate-info">
                        <p class="candidate-name">Abstentions</p>
                        <div class="progress-container">
                          <div 
                            class="progress-bar" 
                            style="width: ${(() => {
                              // First check for a "None" candidate
                              const noneCandidate = result.candidates.find(
                                (c) =>
                                  c.candidate.isAbstention === true ||
                                  c.candidate.name.toLowerCase() === "none" ||
                                  c.candidate.name.toLowerCase() ===
                                    "none of the listed" ||
                                  c.candidate.name.toLowerCase() === "abstain"
                              );

                              if (noneCandidate) {
                                return `${noneCandidate.percentage}%`;
                              }

                              // Otherwise fall back to calculation
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
                                ? `${(abstentions / result.totalVotes) * 100}%`
                                : "0%";
                            })()}; background-color: #f44336;"
                          ></div>
                        </div>
                      </div>
                      <div class="candidate-votes">
                        ${(() => {
                          // First check if there's a special abstention candidate
                          const noneCandidate = result.candidates.find(
                            (c) =>
                              c.candidate.isAbstention === true ||
                              c.candidate.name.toLowerCase() === "none" ||
                              c.candidate.name.toLowerCase() ===
                                "none of the listed" ||
                              c.candidate.name.toLowerCase() === "abstain"
                          );

                          // If there is a "None" candidate, use its votes
                          if (noneCandidate) {
                            return `
                              <span class="vote-count">${
                                noneCandidate.voteCount
                              }</span>
                              <span class="vote-percentage">(${noneCandidate.percentage.toFixed(
                                1
                              )}%)</span>
                            `;
                          }

                          // Otherwise fall back to the original calculation
                          const totalCandidateVotes = result.candidates.reduce(
                            (sum, c) => sum + c.voteCount,
                            0
                          );
                          const abstentions = Math.max(
                            0,
                            result.totalVotes - totalCandidateVotes
                          );
                          const abstentionPercentage =
                            result.totalVotes > 0
                              ? (abstentions / result.totalVotes) * 100
                              : 0;

                          return `
                            <span class="vote-count">${abstentions}</span>
                            <span class="vote-percentage">(${abstentionPercentage.toFixed(
                              1
                            )}%)</span>
                          `;
                        })()}
                      </div>
                    </div>
                  `
                      : ""
                  }
                </div>
              </div>
            `
              )
              .join("")}
          </div>
          
          <div class="footer">
            <p>Generated on ${new Date().toLocaleString()}</p>
            <p>${
              settings?.schoolName || "School"
            } - Election ${new Date().getFullYear()}</p>
            <p>Developed by Secured Smart System (+233 24 333 9546)</p>
          </div>
        </body>
      </html>
    `);

    printWindow.document.close();
    setTimeout(() => printWindow.print(), 500);
  };

  // Export results to Excel (CSV)
  const handleExportExcel = () => {
    let csvContent = `${settings?.electionTitle || "Election"} - Results\n\n`;
    csvContent += "Position,Candidate,Votes,Percentage\n";

    filteredResults.forEach((result) => {
      result.candidates
        .sort((a, b) => b.voteCount - a.voteCount)
        .forEach((candidateResult) => {
          csvContent += `"${result.position.title}","${
            candidateResult.candidate.name
          }",${candidateResult.voteCount},${candidateResult.percentage.toFixed(
            1
          )}%\n`;
        });
      // Add an empty line after each position
      csvContent += `"${result.position.title} Total",,${result.totalVotes},100%\n\n`;
    });

    // Create a blob and download link
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `${settings?.electionTitle || "election"}_results_${
        new Date().toISOString().split("T")[0]
      }.csv`
    );
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Helper function to reveal candidate results
  const handleRevealCandidate = (candidateId: string) => {
    setRevealedCandidates((prev) => [...prev, candidateId]);
    // Only show confetti for abstention reveals
    if (candidateId.includes("-none")) {
      setConfettiActive(true);
      setTimeout(() => setConfettiActive(false), 3000);
    }
  };

  // Helper function to reveal all candidates for a position
  const handleRevealAll = (position: string) => {
    const candidateIds =
      filteredResults
        .find((result) => result.position.title === position)
        ?.candidates.map((c) => c.candidate._id.toString()) || [];

    setRevealedCandidates((prev) => [
      ...prev,
      ...candidateIds,
      `${position}-none`,
    ]);
    // Still show confetti when revealing all, as it includes abstentions
    setConfettiActive(true);
    setTimeout(() => setConfettiActive(false), 3000);
  };

  // Toggle fullscreen mode
  const toggleFullScreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullScreen(true);
    } else {
      document.exitFullscreen();
      setIsFullScreen(false);
    }
  };

  // Navigate to previous position in fullscreen mode
  const handlePreviousPosition = () => {
    setCurrentPositionIndex((prev) =>
      prev === 0 ? filteredResults.length - 1 : prev - 1
    );
  };

  // Navigate to next position in fullscreen mode
  const handleNextPosition = () => {
    setCurrentPositionIndex((prev) =>
      prev === filteredResults.length - 1 ? 0 : prev + 1
    );
  };

  // Fix the renderPositionResults function to ensure all buttons are clickable
  const renderPositionResults = (result: ResultItem) => {
    // Sort candidates by votes (highest first)
    const sortedCandidates = [...result.candidates].sort(
      (a, b) => b.voteCount - a.voteCount
    );
    const winner = sortedCandidates[0];
    const runnerUp = sortedCandidates[1];
    const isPositionRevealed = revealedCandidates.includes(
      `${result.position.title}-none`
    );
    const isWinnerRevealed =
      winner && revealedCandidates.includes(winner.candidate._id.toString());

    return (
      <div
        key={result.position._id}
        className="bg-gradient-to-br bg-white rounded-xl shadow-2xl overflow-hidden text-white"
      >
        <div className="p-6 bg-gradient-to-r from-indigo-600/80 to-purple-600/80 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-4xl font-bold mb-2 text-white">
                {result.position.title}
              </h3>
              <p className="text-xl text-indigo-100">
                Total Votes:{" "}
                <span className="font-bold">{result.totalVotes}</span>
              </p>
            </div>
          </div>
        </div>

        <div className="p-6 relative">
          {/* Decorative elements */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-400 rounded-full filter blur-3xl"></div>
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-400 rounded-full filter blur-3xl"></div>
          </div>

          {/* Add this wrapper div with relative positioning to contain all cards */}
          <div className="relative z-10 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 mb-6">
            {/* Winner card - with fixed z-index to ensure button works */}
            {winner && (
              <div
                className={`${
                  isPositionRevealed
                    ? "bg-gradient-to-r from-yellow-400/30 to-amber-400/30 border-yellow-400/40"
                    : "bg-white border border-gray-300 hover:bg-gray-50 transition-all duration-300"
                } p-4 rounded-xl relative overflow-hidden z-10`}
              >
                {isPositionRevealed && (
                  <>
                    <div className="absolute top-0 right-0 w-40 h-40 -mt-16 -mr-16 bg-yellow-500/20 rounded-full"></div>
                    <div className="absolute bottom-0 left-0 w-24 h-24 -mb-12 -ml-12 bg-yellow-500/20 rounded-full"></div>
                  </>
                )}

                <div className="flex flex-col items-center gap-4 relative z-10">
                  <div className="relative">
                    {isPositionRevealed && (
                      <div className="absolute -top-3 -left-3 bg-yellow-500 text-yellow-900 rounded-full p-1.5 shadow-lg">
                        <Trophy className="h-5 w-5" />
                      </div>
                    )}
                    <div
                      className={`overflow-hidden ${
                        isPositionRevealed
                          ? "w-32 h-32 rounded-full border-4 border-yellow-500"
                          : "w-full h-[250px] rounded-lg border border-gray-300"
                      } shadow-lg`}
                    >
                      <img
                        src={
                          winner.candidate.image ||
                          "https://via.placeholder.com/150"
                        }
                        alt={winner.candidate.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src =
                            "https://via.placeholder.com/150?text=" +
                            winner.candidate.name.charAt(0);
                        }}
                      />
                    </div>
                    {isPositionRevealed && (
                      <div className="absolute -bottom-2 -right-2 bg-yellow-500 text-yellow-900 rounded-full p-1.5 shadow-lg">
                        <Crown className="h-4 w-4" />
                      </div>
                    )}
                  </div>

                  <div className="text-center">
                    {isPositionRevealed && (
                      <div className="inline-block bg-yellow-500 text-yellow-900 px-3 py-1 rounded-full text-sm font-bold mb-2">
                        WINNER
                      </div>
                    )}
                    <h4
                      className={`text-2xl font-bold mb-1 ${
                        isPositionRevealed ? "text-gray-800" : "text-gray-900"
                      }`}
                    >
                      {winner.candidate.name}
                    </h4>

                    {isWinnerRevealed || isPositionRevealed ? (
                      <div className="flex flex-col gap-2">
                        <div className=" px-4 py-2 rounded-lg  ">
                          <div
                            className={`text-2xl font-bold ${
                              isPositionRevealed
                                ? "text-yellow-600"
                                : "text-indigo-600"
                            }`}
                          >
                            {winner.voteCount}
                          </div>
                          <div
                            className={`${
                              isPositionRevealed
                                ? "text-yellow-700"
                                : "text-gray-600 mt-2"
                            } text-lg font-medium `}
                          >
                            votes
                          </div>
                        </div>
                        <div className="px-4 b-2 rounded-lg">
                          <div
                            className={`text-2xl font-bold ${
                              isPositionRevealed
                                ? "text-yellow-600"
                                : "text-indigo-600"
                            }`}
                          >
                            {result.totalVotes > 0
                              ? (
                                  (winner.voteCount / result.totalVotes) *
                                  100
                                ).toFixed(1)
                              : "0.0"}
                            %
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center">
                        <button
                          onClick={() =>
                            handleRevealCandidate(
                              winner.candidate._id.toString()
                            )
                          }
                          className="inline-flex items-center px-4 py-2 text-base font-medium text-indigo-600 hover:text-white border-2 border-indigo-600 rounded-lg hover:bg-indigo-600 transition-all duration-300 z-20 relative"
                        >
                          <Eye className="h-5 w-5 mr-2" />
                          Reveal Results
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Other candidates - with fixed z-index to ensure button works */}
            {sortedCandidates
              .filter((candidateResult) =>
                winner
                  ? candidateResult.candidate._id !== winner.candidate._id
                  : true
              )
              .map((candidateResult, index) => {
                const candidate = candidateResult.candidate;
                const candidateId = candidate._id.toString();

                return (
                  <div
                    key={candidateId}
                    className="bg-white rounded-xl p-4 transition-all duration-300 hover:bg-gray-50 border border-gray-300 shadow-sm relative z-10"
                  >
                    <div className="relative mb-4">
                      <img
                        src={
                          candidate.image || "https://via.placeholder.com/250"
                        }
                        alt={candidate.name}
                        className="w-full object-cover rounded-lg shadow-md"
                        style={{ width: "100%", height: "250px" }}
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = `https://via.placeholder.com/250?text=${candidate.name.charAt(
                            0
                          )}`;
                        }}
                      />
                    </div>
                    <h4 className="text-xl font-bold text-gray-900 text-center mb-3">
                      {candidate.name}
                    </h4>

                    {revealedCandidates.includes(candidateId) ? (
                      <div className="text-center space-y-2">
                        <div className="text-3xl font-bold text-indigo-600">
                          {candidateResult.voteCount}
                        </div>
                        <div className="text-lg font-medium text-gray-600">
                          votes
                        </div>
                        <div className="text-2xl font-bold text-indigo-600">
                          {result.totalVotes > 0
                            ? (
                                (candidateResult.voteCount /
                                  result.totalVotes) *
                                100
                              ).toFixed(1)
                            : "0.0"}
                          %
                        </div>
                      </div>
                    ) : (
                      <div className="text-center">
                        <button
                          onClick={() => handleRevealCandidate(candidateId)}
                          className="inline-flex items-center px-4 py-2 text-base font-medium text-indigo-600 hover:text-white border-2 border-indigo-600 rounded-lg hover:bg-indigo-600 transition-all duration-300 relative z-20 pointer-events-auto"
                        >
                          <Eye className="h-5 w-5 mr-2" />
                          Reveal Results
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}

            {/* Abstentions - with fixed z-index to ensure button works */}
            <div className="bg-red-50 rounded-xl p-4 border border-red-200 shadow-sm relative z-10">
              <div className="aspect-w-1 aspect-h-1 mb-4">
                <div
                  className="w-full h-[250px] bg-red-200 rounded-lg shadow-md flex items-center justify-center"
                  style={{ width: "100%", height: "250px" }}
                >
                  <X className="h-24 w-24 text-red-500" />
                </div>
              </div>
              <h4 className="text-xl font-bold text-red-800 text-center mb-3">
                Abstentions
              </h4>

              {revealedCandidates.includes(`${result.position.title}-none`) ? (
                <div className="text-center space-y-2">
                  <div className="text-3xl font-bold text-red-600">
                    {/* Calculate abstention votes */}
                    {(() => {
                      // Find abstention candidate if exists
                      const noneCandidate = result.candidates.find(
                        (c) =>
                          c.candidate.isAbstention === true ||
                          c.candidate.name.toLowerCase() === "none" ||
                          c.candidate.name.toLowerCase() ===
                            "none of the listed" ||
                          c.candidate.name.toLowerCase() === "abstain"
                      );

                      if (noneCandidate) {
                        return noneCandidate.voteCount;
                      }

                      // Fall back to calculation
                      return Math.max(
                        0,
                        result.totalVotes -
                          result.candidates.reduce(
                            (sum, c) => sum + c.voteCount,
                            0
                          )
                      );
                    })()}
                  </div>
                  <div className="text-lg font-medium text-gray-600">votes</div>
                  <div className="text-2xl font-bold text-red-600">
                    {/* Calculate abstention percentage */}
                    {(() => {
                      const noneCandidate = result.candidates.find(
                        (c) =>
                          c.candidate.isAbstention === true ||
                          c.candidate.name.toLowerCase() === "none" ||
                          c.candidate.name.toLowerCase() ===
                            "none of the listed" ||
                          c.candidate.name.toLowerCase() === "abstain"
                      );

                      if (noneCandidate) {
                        return noneCandidate.percentage.toFixed(1);
                      }

                      // Fall back to calculation
                      const abstentions = Math.max(
                        0,
                        result.totalVotes -
                          result.candidates.reduce(
                            (sum, c) => sum + c.voteCount,
                            0
                          )
                      );
                      return result.totalVotes > 0
                        ? ((abstentions / result.totalVotes) * 100).toFixed(1)
                        : "0.0";
                    })()}
                    %
                  </div>
                </div>
              ) : (
                <div className="text-center">
                  <button
                    onClick={() =>
                      handleRevealCandidate(`${result.position.title}-none`)
                    }
                    className="inline-flex items-center px-4 py-2 text-base font-medium text-red-600 hover:text-white border-2 border-red-600 rounded-lg hover:bg-red-600 transition-all duration-300 relative z-20 pointer-events-auto"
                  >
                    <Eye className="h-5 w-5 mr-2" />
                    Reveal Results
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Quick reveal all button */}
          {/* <div className="text-center mb-6">
            <button
              onClick={() => handleRevealAll(result.position.title)}
              className="inline-flex items-center px-6 py-2 text-base font-medium text-purple-600 hover:text-white border-2 border-purple-600 rounded-lg hover:bg-purple-600 transition-all duration-300 relative z-10"
            >
              <Eye className="h-5 w-5 mr-2" />
              Reveal All Results
            </button>
          </div> */}

          <div className="text-center text-sm text-black mt-4">
            <p>Developed by Secured Smart System (+233 24 333 9546)</p>
          </div>
        </div>
      </div>
    );
  };

  // If user doesn't have view permission
  if (!canViewResults) {
    return (
      <div className="bg-yellow-50 p-6 rounded-lg text-center">
        <AlertCircle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-yellow-800 mb-2">
          Access Restricted
        </h3>
        <p className="text-yellow-700">
          You don't have permission to view election results.
        </p>
      </div>
    );
  }

  // Show loading state
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-center">
          <RefreshCw className="h-12 w-12 text-indigo-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading results...</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="bg-red-50 p-4 rounded-md">
        <div className="flex">
          <AlertCircle className="h-5 w-5 text-red-500 mr-3" />
          <p className="text-red-800">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`space-y-6 ${
        isFullScreen ? "fixed inset-0 bg-gray-100 z-50 overflow-auto p-6" : ""
      }`}
    >
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-3 md:space-y-0 bg-gradient-to-r from-indigo-700 to-purple-700 text-white p-4 rounded-lg shadow-md">
        <div>
          <h2 className="text-xl font-bold">Election Results</h2>
          <p className="text-indigo-100 text-sm font-sans font-light">
            View and analyze voting results
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleExportExcel}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm rounded-md shadow-sm text-indigo-700 bg-white hover:bg-indigo-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-200"
          >
            <FileSpreadsheet className="h-4 w-4 mr-2" />
            Export
          </button>
          <button
            onClick={handlePrint}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm rounded-md shadow-sm text-indigo-700 bg-white hover:bg-indigo-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-200"
          >
            <Printer className="h-4 w-4 mr-2" />
            Print
          </button>
          <button
            onClick={toggleFullScreen}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm rounded-md shadow-sm text-indigo-700 bg-white hover:bg-indigo-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-200"
          >
            {isFullScreen ? (
              <>
                <Minimize2 className="h-4 w-4 mr-2" />
                Exit Fullscreen
              </>
            ) : (
              <>
                <Maximize2 className="h-4 w-4 mr-2" />
                Fullscreen
              </>
            )}
          </button>
          <button
            onClick={() => setShowDeclaration(!showDeclaration)}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm rounded-md shadow-sm text-indigo-700 bg-white hover:bg-indigo-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-200"
          >
            {showDeclaration ? (
              <>
                <ArrowLeft className="h-4 w-4 mr-2" />
                View Results
              </>
            ) : (
              <>
                <Eye className="h-4 w-4 mr-2" />
                View Declaration
              </>
            )}
          </button>
        </div>
      </div>

      {/* Notification */}
      {notification && (
        <div
          className={`p-4 rounded-md ${
            notification.type === "success"
              ? "bg-green-50 border border-green-200"
              : "bg-red-50 border border-red-200"
          } flex justify-between items-start shadow-sm`}
        >
          <div className="flex">
            {notification.type === "success" ? (
              <Check className="h-5 w-5 text-green-500 mr-3" />
            ) : (
              <AlertCircle className="h-5 w-5 text-red-500 mr-3" />
            )}
            <p
              className={
                notification.type === "success"
                  ? "text-green-800"
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

      {/* Search */}
      {!isFullScreen && (
        <div className="bg-white p-4 rounded-lg shadow-md">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search positions or candidates..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      )}

      {/* Confetti Effect */}
      {confettiActive && (
        <div className="fixed inset-0 pointer-events-none z-50">
          {Array.from({ length: 100 }).map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-3 h-3 rounded-full"
              initial={{
                top: "-10%",
                left: `${Math.random() * 100}%`,
                backgroundColor: [
                  "#FFD700", // gold
                  "#FF4500", // red-orange
                  "#00BFFF", // deep sky blue
                  "#32CD32", // lime green
                  "#FF69B4", // hot pink
                  "#9370DB", // medium purple
                ][Math.floor(Math.random() * 6)],
              }}
              animate={{
                top: "110%",
                rotate: [0, 360],
                scale: [1, Math.random() * 0.5 + 0.5],
              }}
              transition={{
                duration: Math.random() * 2 + 2,
                ease: "linear",
                delay: Math.random() * 0.5,
              }}
            />
          ))}
        </div>
      )}

      {showDeclaration ? (
        // Result Declaration View
        isFullScreen && filteredResults.length > 0 ? (
          <div className="relative">
            <AnimatePresence mode="wait">
              <motion.div
                key={
                  filteredResults[currentPositionIndex]?.position.title ||
                  "empty"
                }
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.5 }}
              >
                {filteredResults.length > 0 ? (
                  renderPositionResults(filteredResults[currentPositionIndex])
                ) : (
                  <div className="text-center p-6">No results available</div>
                )}
              </motion.div>
            </AnimatePresence>

            {/* Navigation Buttons */}
            {filteredResults.length > 1 && (
              <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 flex items-center space-x-4">
                <button
                  onClick={handlePreviousPosition}
                  className="bg-white/20 backdrop-blur-sm p-3 rounded-full shadow-lg hover:bg-white/30 border border-white/30"
                >
                  <ChevronLeft className="h-6 w-6 text-black" />
                </button>
                <div className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full shadow-lg text-black border border-white/30">
                  {currentPositionIndex + 1} / {filteredResults.length}
                </div>
                <button
                  onClick={handleNextPosition}
                  className="bg-white/20 backdrop-blur-sm p-3 rounded-full shadow-lg hover:bg-white/30 border border-white/30"
                >
                  <ChevronRight className="h-6 w-6 text-black" />
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            {filteredResults.map((result) => renderPositionResults(result))}
          </div>
        )
      ) : (
        // REPLACED: Standard Results View with Grid Layout from old version
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredResults.map((result) => (
            <div
              key={result.position._id}
              className="bg-white rounded-lg shadow-md overflow-hidden"
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
                    // Calculate percentage directly
                    const calculatedPercentage =
                      result.totalVotes > 0
                        ? (
                            (candidateResult.voteCount / result.totalVotes) *
                            100
                          ).toFixed(1)
                        : "0.0";

                    return (
                      <div key={candidate._id} className="space-y-2">
                        <div className="flex items-center space-x-3">
                          <div className="relative">
                            {candidate.image ? (
                              <img
                                src={candidate.image}
                                alt={candidate.name}
                                className="h-10 w-10 rounded-full object-cover border-2 border-white shadow-sm"
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  target.src = `https://via.placeholder.com/40?text=${candidate.name.charAt(
                                    0
                                  )}`;
                                }}
                              />
                            ) : (
                              <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center border-2 border-white shadow-sm">
                                <span className="text-indigo-800 font-medium text-sm">
                                  {candidate.name.charAt(0)}
                                </span>
                              </div>
                            )}
                            {index === 0 && (
                              <div className="absolute -top-1 -right-1 bg-green-500 text-white rounded-full w-4 h-4 flex items-center justify-center text-xs shadow-sm">
                                1
                              </div>
                            )}
                            {index === 1 && (
                              <div className="absolute -top-1 -right-1 bg-yellow-500 text-white rounded-full w-4 h-4 flex items-center justify-center text-xs shadow-sm">
                                2
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-center mb-1">
                              <span className="text-sm text-gray-900">
                                {candidate.name}
                              </span>
                              <div className="flex items-center">
                                <span className="text-sm font-medium text-indigo-600">
                                  {candidateResult.voteCount}
                                </span>
                                <span className="text-xs text-gray-500 ml-1">
                                  ({calculatedPercentage}%)
                                </span>
                              </div>
                            </div>
                            <div className="relative mt-2">
                              <div className="overflow-hidden h-2 text-xs flex rounded bg-gray-100">
                                <div
                                  style={{
                                    width: `${
                                      result.totalVotes > 0
                                        ? (candidateResult.voteCount /
                                            result.totalVotes) *
                                          100
                                        : 0
                                    }%`,
                                  }}
                                  className={`shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center ${
                                    index === 0
                                      ? "bg-green-500"
                                      : index === 1
                                      ? "bg-yellow-500"
                                      : "bg-indigo-500"
                                  }`}
                                ></div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}

                {/* Abstentions - From newer version */}
                {result.totalVotes > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center space-x-3">
                      <div className="relative">
                        <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center border-2 border-white shadow-sm">
                          <X className="h-5 w-5 text-red-500" />
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-sm text-gray-900">
                            Abstentions
                          </span>
                          <div className="flex items-center">
                            {(() => {
                              // First check if there's a special abstention candidate
                              const noneCandidate = result.candidates.find(
                                (c) =>
                                  c.candidate.isAbstention === true ||
                                  c.candidate.name.toLowerCase() === "none" ||
                                  c.candidate.name.toLowerCase() ===
                                    "none of the listed" ||
                                  c.candidate.name.toLowerCase() === "abstain"
                              );

                              // If there is a "None" candidate, use its votes
                              if (noneCandidate) {
                                return (
                                  <>
                                    <span className="text-sm font-medium text-indigo-600">
                                      {noneCandidate.voteCount}
                                    </span>
                                    <span className="text-xs text-gray-500 ml-1">
                                      ({noneCandidate.percentage.toFixed(1)}%)
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
                                  ? parseFloat(
                                      (
                                        (abstentions / result.totalVotes) *
                                        100
                                      ).toFixed(1)
                                    )
                                  : 0;

                              return (
                                <>
                                  <span className="text-sm font-medium text-indigo-600">
                                    {abstentions}
                                  </span>
                                  <span className="text-xs text-gray-500 ml-1">
                                    ({abstentionPercentage.toFixed(1)}%)
                                  </span>
                                </>
                              );
                            })()}
                          </div>
                        </div>
                        <div className="relative mt-2">
                          <div className="overflow-hidden h-2 text-xs flex rounded bg-gray-100">
                            <div
                              style={{
                                width: (() => {
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
                                    ? `${
                                        (abstentions / result.totalVotes) * 100
                                      }%`
                                    : "0%";
                                })(),
                              }}
                              className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-red-500"
                            ></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {filteredResults.length === 0 && !isLoading && !error && (
        <div className="bg-white p-8 text-center rounded-lg shadow-md">
          <BarChart2 className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">
            No results found
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            {results.length === 0
              ? "No votes have been cast yet."
              : "Try adjusting your search terms"}
          </p>
          <p className="mt-4 text-xs text-gray-500">
            Developed by Secured Smart System (+233 24 333 9546)
          </p>
        </div>
      )}
    </div>
  );
};

export default Results;
