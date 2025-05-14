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
import { useUser } from "./context/UserContext";
import { initializeElectionData } from "./utils/dbInitializer";

interface AppContentProps {
  children: React.ReactNode;
}

const AppContent: React.FC<AppContentProps> = ({ children }) => {
  const { isAuthenticated, authToken } = useUser();

  useEffect(() => {
    // Only initialize if the user is authenticated
    if (isAuthenticated && authToken) {
      initializeElectionData(authToken);
    }
  }, [isAuthenticated, authToken]);

  return <>{children}</>;
};

export default AppContent;
