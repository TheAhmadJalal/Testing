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

import React, { useMemo } from "react";
import { useUser } from "../context/UserContext";
import AccessDenied from "./AccessDenied";

interface PermissionGuardProps {
  resource: string;
  action: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

const PermissionGuard: React.FC<PermissionGuardProps> = ({
  resource,
  action,
  children,
  fallback,
}) => {
  const { user, hasPermission } = useUser();

  // Use memoization to prevent repeated permission checks during renders
  const hasAccess = useMemo(() => {
    return hasPermission(resource, action);
  }, [hasPermission, resource, action]);

  // Add debug log to help diagnose permission issues
  React.useEffect(() => {
    if (process.env.NODE_ENV === "development") {
      const role =
        typeof user?.role === "string" ? user?.role : user?.role?.name;

      // Enhanced logging to show permissions and resources
      console.log(
        `[PermissionGuard] ${resource}/${action} Check for role ${role}:`,
        hasAccess ? "GRANTED" : "DENIED",
        {
          role,
          resourceName: resource,
          actionName: action,
          resourcePermissions: user?.permissions?.[resource] || "none",
        }
      );
    }
  }, [resource, action, hasAccess, user]);

  if (!user) {
    return (
      fallback || (
        <AccessDenied message="Please log in to access this resource" />
      )
    );
  }

  if (!hasAccess) {
    return (
      fallback || (
        <AccessDenied
          message={`You don't have permission to ${action} ${resource}`}
          resource={resource}
          action={action}
          userRole={typeof user.role === "string" ? user.role : user.role.name}
        />
      )
    );
  }

  return <>{children}</>;
};

export default PermissionGuard;
