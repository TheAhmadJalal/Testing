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

import React from "react";
import { Loader } from "lucide-react";

interface LoadingIndicatorProps {
  size?: "small" | "medium" | "large";
  message?: string;
  fullscreen?: boolean;
  transparent?: boolean;
}

const LoadingIndicator: React.FC<LoadingIndicatorProps> = ({
  size = "medium",
  message = "Loading...",
  fullscreen = false,
  transparent = false,
}) => {
  const sizeClasses = {
    small: "h-4 w-4",
    medium: "h-6 w-6",
    large: "h-10 w-10",
  };

  if (fullscreen) {
    return (
      <div
        className={`fixed inset-0 z-50 flex items-center justify-center ${
          !transparent ? "bg-white/80" : ""
        }`}
      >
        <div className="text-center">
          <Loader
            className={`${sizeClasses[size]} text-indigo-600 animate-spin mx-auto mb-2`}
          />
          <p className="text-sm font-medium text-gray-700">{message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center p-4">
      <Loader
        className={`${sizeClasses[size]} text-indigo-600 animate-spin mr-3`}
      />
      <p className="text-sm font-medium text-gray-700">{message}</p>
    </div>
  );
};

export default LoadingIndicator;
