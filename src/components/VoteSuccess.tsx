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

import React, { useRef } from "react";
import {
  CheckCircle,
  Copy,
  Calendar,
  Clock,
  User,
  Ticket,
  School,
  Check,
  Download,
  Printer,
} from "lucide-react";
import { useSettings } from "../context/SettingsContext";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

interface VoteToken {
  token: string;
  timestamp: string | Date;
}

interface VoterData {
  name: string;
  voterId: string;
  votedAt: string | Date;
  voteToken?: string; // For backward compatibility
  voteCount?: number;
  maxVotes?: number;
  voteTokens?: VoteToken[]; // Added voteTokens array
}

interface VoteSuccessProps {
  voter: VoterData;
  isPopup?: boolean;
}

const VoteSuccess: React.FC<VoteSuccessProps> = ({
  voter,
  isPopup = false,
}) => {
  const { settings } = useSettings();
  const [copied, setCopied] = React.useState(false);
  const receiptRef = useRef<HTMLDivElement>(null);

  // Format date to DD/MM/YYYY
  const formatDate = (dateInput: string | Date) => {
    try {
      const date = new Date(dateInput);
      return `${date.getDate().toString().padStart(2, "0")}/${(
        date.getMonth() + 1
      )
        .toString()
        .padStart(2, "0")}/${date.getFullYear()}`;
    } catch (e) {
      return "Date unavailable";
    }
  };

  // Format time to HH:MM AM/PM
  const formatTime = (dateInput: string | Date) => {
    try {
      const date = new Date(dateInput);
      return date.toLocaleString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      });
    } catch (e) {
      return "Time unavailable";
    }
  };

  // Get all vote tokens from the voter data
  const getVoteTokens = (): VoteToken[] => {
    // If voteTokens array exists, use it
    if (voter.voteTokens && voter.voteTokens.length > 0) {
      return voter.voteTokens;
    }

    // Fallback to single voteToken for backward compatibility
    if (voter.voteToken) {
      return [
        {
          token: voter.voteToken,
          timestamp: voter.votedAt,
        },
      ];
    }

    return [];
  };

  const voteTokens = getVoteTokens();

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const copyAllTokens = () => {
    const tokensText = voteTokens.map((t) => t.token).join(", ");
    copyToClipboard(tokensText);
  };

  const handlePrint = () => {
    const content = receiptRef.current;
    if (!content) return;

    const originalDisplay = document.body.style.display;
    const originalOverflow = document.body.style.overflow;

    // Create a cloned receipt to print
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      alert("Please allow popups to print the receipt");
      return;
    }

    // Add styles and content to the new window
    printWindow.document.write(`
      <html>
        <head>
          <title>Vote Receipt - ${voter.voterId}</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              padding: 20px;
              max-width: 500px;
              margin: 0 auto;
            }
            .receipt {
              border: 1px solid #ddd;
              border-radius: 8px;
              padding: 20px;
              margin-bottom: 20px;
            }
            .header {
              text-align: center;
              margin-bottom: 20px;
            }
            .success-icon {
              color: #10B981;
              font-size: 48px;
              text-align: center;
              display: block;
              margin: 0 auto 16px;
            }
            h2 {
              color: #10B981;
              text-align: center;
              font-size: 24px;
              margin-bottom: 20px;
            }
            .info-row {
              display: flex;
              justify-content: space-between;
              margin-bottom: 10px;
              padding-bottom: 10px;
              border-bottom: 1px dashed #eee;
            }
            .label {
              font-weight: bold;
              color: #555;
            }
            .value {
              text-align: right;
              font-weight: 500;
            }
            .token {
              text-align: center;
              font-size: 24px;
              font-weight: bold;
              color: #1E40AF;
              margin: 20px 0;
              letter-spacing: 2px;
            }
            .footer {
              text-align: center;
              font-size: 12px;
              color: #666;
              margin-top: 20px;
            }
            @media print {
              body {
                padding: 0;
              }
              .receipt {
                border: none;
              }
            }
               .tokens-section {
          margin: 25px 0;
          text-align: center;
        }
        .token-title {
          font-size: 14px;
          font-weight: bold;
          margin-bottom: 15px;
          color: #555;
          border-bottom: 1px solid #eee;
          padding-bottom: 8px;
        }
        .token-item {
          margin: 15px 0;
        }
        .token-value {
          font-size: 24px;
          font-weight: bold;
          color: #1E40AF;
          letter-spacing: 2px;
          font-family: monospace;
        }
        .token-index {
          font-size: 12px;
          color: #666;
          margin-top: 5px;
        }
        .divider {
          margin: 20px 0;
          border-top: 1px dashed #ddd;
        }
          </style>
        </head>
        <body>
          <div class="receipt">
            <div class="header">
              <span class="success-icon">✓</span>
              <h2>Vote Successfully Recorded</h2>
            </div>
            
            <div class="info-row">
              <span class="label">Voter Name:</span>
              <span class="value">${voter.name}</span>
            </div>
            
            <div class="info-row">
              <span class="label">Voter ID:</span>
              <span class="value">${voter.voterId}</span>
            </div>
            
            <div class="info-row">
              <span class="label">Date:</span>
              <span class="value">${formatDate(voter.votedAt)}</span>
            </div>
            
            <div class="info-row">
              <span class="label">Time:</span>
              <span class="value">${formatTime(voter.votedAt)}</span>
            </div>
            
            ${
              hasMultipleVotes
                ? `
            <div class="info-row">
              <span class="label">Vote Count:</span>
              <span class="value">${voter.voteCount} of ${voter.maxVotes}</span>
            </div>
            `
                : ""
            }
            
         <div class="tokens-section">
          ${
            voteTokens.length > 1
              ? '<div class="token-title">Vote Tokens</div>'
              : ""
          }
          
          ${voteTokens
            .map(
              (token, index) => `
            <div class="token-item">
              <div class="token-value">${token.token}</div>
              ${
                voteTokens.length > 1
                  ? `<div class="token-index">(Vote ${index + 1})</div>`
                  : ""
              }
            </div>
            ${
              index < voteTokens.length - 1 ? '<div class="divider"></div>' : ""
            }
          `
            )
            .join("")}
        </div>
        
        <div class="footer">
              This receipt serves as proof of your vote. Keep it for your records.
            </div>
          </div>
        </body>
      </html>
    `);

    printWindow.document.close();

    // Print after content is loaded
    printWindow.onload = function () {
      printWindow.focus();
      printWindow.print();
    };
  };

  const handleDownloadPDF = async () => {
    if (!receiptRef.current) return;

    try {
      const content = receiptRef.current;

      // Use higher scale for better quality
      const canvas = await html2canvas(content, {
        scale: 2,
        logging: false,
        useCORS: true,
        allowTaint: true,
      });

      const imgData = canvas.toDataURL("image/png");

      // Create PDF in portrait orientation
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      // Calculate dimensions to fit the receipt on the page with margins
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const margin = 20; // 20mm margin

      // Calculate image width and height to maintain aspect ratio
      const imgWidth = pdfWidth - margin * 2;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      // Add the image to the PDF centered on the page
      pdf.addImage(
        imgData,
        "PNG",
        margin,
        (pdfHeight - imgHeight) / 2,
        imgWidth,
        imgHeight
      );

      // Save the PDF with a proper filename
      pdf.save(
        `Vote_Receipt_${voter.voterId}_${
          new Date().toISOString().split("T")[0]
        }.pdf`
      );
    } catch (error) {
      console.error("Error generating PDF:", error);
      alert("There was an error generating the PDF. Please try again.");
    }
  };

  const hasMultipleVotes =
    voter.voteCount && voter.maxVotes && voter.maxVotes > 1;

  return (
    <div
      className={`bg-white ${
        isPopup ? "" : "rounded-lg shadow-lg mx-auto max-w-md"
      } py-8 px-6`}
    >
      <div className="text-center">
        <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100">
          <CheckCircle className="h-10 w-10 text-green-600" />
        </div>
        <h3 className="mt-3 text-xl font-medium text-gray-900">
          Vote Successful!
        </h3>
        <p className="mt-2 text-sm text-gray-500">
          Your vote has been successfully recorded. Keep this receipt for
          reference.
        </p>
      </div>

      <div className="mt-6" ref={receiptRef}>
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center text-sm font-medium text-gray-500">
              <School className="mr-1 h-4 w-4" />
              School:
            </div>
            <span className="text-sm font-semibold text-gray-900">
              {settings?.schoolName || "School Name"}
            </span>
          </div>

          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center text-sm font-medium text-gray-500">
              <Ticket className="mr-1 h-4 w-4" />
              Election:
            </div>
            <span className="text-sm font-semibold text-gray-900">
              {settings?.electionTitle || "Election Name"}
            </span>
          </div>

          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center text-sm font-medium text-gray-500">
              <User className="mr-1 h-4 w-4" />
              Voter:
            </div>
            <span className="text-sm font-semibold text-gray-900">
              {voter.name} ({voter.voterId})
            </span>
          </div>

          {/* Display vote count and max votes if available */}
          {voter.maxVotes && voter.maxVotes > 1 && (
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center text-sm font-medium text-gray-500">
                <CheckCircle className="mr-1 h-4 w-4" />
                Votes Used:
              </div>
              <span className="text-sm font-semibold text-gray-900">
                {voter.voteCount || 1} of {voter.maxVotes}
              </span>
            </div>
          )}

          {/* Display all vote tokens */}
          <div className="mt-4 border-t border-gray-200 pt-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center text-sm font-medium text-gray-500">
                Vote Token{voteTokens.length > 1 ? "s" : ""}:
              </div>
              {voteTokens.length > 1 && (
                <button
                  onClick={copyAllTokens}
                  className="text-xs bg-blue-50 hover:bg-blue-100 text-blue-600 py-1 px-2 rounded flex items-center"
                >
                  <Copy className="h-3 w-3 mr-1" />
                  Copy All
                </button>
              )}
            </div>

            {/* List all vote tokens */}
            <div className="space-y-2">
              {voteTokens.map((token, index) => (
                <div key={index} className="bg-gray-100 rounded p-3">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center">
                      <span className="text-lg font-mono font-bold text-indigo-600">
                        {token.token}
                      </span>
                      {voteTokens.length > 1 && (
                        <span className="ml-2 text-xs text-gray-500">
                          (Vote {index + 1})
                        </span>
                      )}
                    </div>
                    <button
                      onClick={() => copyToClipboard(token.token)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <Copy className="h-4 w-4" />
                    </button>
                  </div>

                  {/* Add timestamp for each token if available */}
                  {token.timestamp && (
                    <div className="mt-1 text-xs text-gray-500">
                      <div className="flex items-center">
                        <Calendar className="h-3 w-3 mr-1" />
                        {formatDate(token.timestamp)}
                        <span className="mx-1">•</span>
                        <Clock className="h-3 w-3 mr-1" />
                        {formatTime(token.timestamp)}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Only show latest date/time if multiple tokens exist */}
          {voteTokens.length <= 1 && (
            <>
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center text-sm font-medium text-gray-500">
                  <Calendar className="mr-1 h-4 w-4" />
                  Date Voted:
                </div>
                <span className="text-sm font-semibold text-gray-900">
                  {formatDate(voter.votedAt)}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center text-sm font-medium text-gray-500">
                  <Clock className="mr-1 h-4 w-4" />
                  Time Voted:
                </div>
                <span className="text-sm font-semibold text-gray-900">
                  {formatTime(voter.votedAt)}
                </span>
              </div>
            </>
          )}
        </div>
      </div>

      {copied && (
        <div className="mt-3 text-center text-sm text-green-600">
          Copied to clipboard!
        </div>
      )}

      <div className="mt-6 text-center text-xs text-gray-500">
        <p>
          Keep this receipt as proof of your vote. You'll need the token if you
          want to verify your vote later.
        </p>
      </div>

      {/* Add the print and download buttons */}
      <div className="border-t border-gray-200 px-6 py-4 bg-gray-50 flex justify-between">
        <button
          onClick={handlePrint}
          className="flex items-center justify-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
        >
          <Printer className="h-5 w-5 mr-2" />
          Print Receipt
        </button>

        <button
          onClick={handleDownloadPDF}
          className="flex items-center justify-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
        >
          <Download className="h-5 w-5 mr-2" />
          Download PDF
        </button>
      </div>
    </div>
  );
};

export default VoteSuccess;
