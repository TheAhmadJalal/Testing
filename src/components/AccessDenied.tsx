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
import { AlertCircle, ShieldAlert } from "lucide-react";
import { useUser } from "../context/UserContext";

interface AccessDeniedProps {
  message?: string;
  resource?: string;
  action?: string;
  userRole?: string;
}

const AccessDenied: React.FC<AccessDeniedProps> = ({
  message = "Access Denied",
  resource,
  action,
  userRole,
}) => {
  const { user } = useUser();

  // Show available permissions for this resource if we can
  const availablePermissions = user?.permissions
    ? Object.keys(user.permissions).filter(
        (k) =>
          k === resource ||
          k === `${resource}s` ||
          (resource?.endsWith("s") && k === resource.slice(0, -1))
      )
    : [];

  return (
    <div className="bg-yellow-50 p-6 rounded-lg text-center">
      <ShieldAlert className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
      <h3 className="text-lg font-medium text-yellow-800 mb-2">{message}</h3>

      {resource && action && (
        <p className="text-yellow-700 mb-4">
          Required permission:{" "}
          <span className="font-medium">
            {resource}/{action}
          </span>
        </p>
      )}

      {userRole && (
        <p className="text-yellow-600 text-sm">
          Your current role: <span className="font-medium">{userRole}</span>
        </p>
      )}

      {availablePermissions.length > 0 && (
        <div className="mt-2 text-xs text-yellow-600">
          <p>Available resources for your role:</p>
          <p className="font-mono">{availablePermissions.join(", ")}</p>
        </div>
      )}

      <div className="mt-4 text-sm text-yellow-700 bg-yellow-100 p-3 rounded">
        If you believe this is an error, please contact your system
        administrator to verify your permissions.
      </div>
    </div>
  );
};

export default AccessDenied;
