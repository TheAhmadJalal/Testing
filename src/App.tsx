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
import { Navigate, Routes, Route } from "react-router-dom";
import { UserProvider } from "./context/UserContext";
import { ElectionProvider } from "./context/ElectionContext";
import { SettingsProvider } from "./context/SettingsContext";
import { ThemeProvider } from "next-themes";
import Login from "./components/Login";
import VotingAuth from "./components/VotingAuth";
import Candidates from "./components/Candidates";
import ConfirmVote from "./components/ConfirmVote";
import ThankYou from "./components/ThankYou";
import ElectionManagerVoterPanel from "./components/ElectionManagerVoterPanel";
import VoteSuccess from "./components/VoteSuccess";
import SettingsPreloader from "./components/SettingsPreloader";
import ServerConnectionMonitor from "./components/ServerConnectionMonitor";
import DynamicHead from "./components/DynamicHead";
import VoterResults from "./components/VoterResults";

const App: React.FC = () => {
  return (
    <>
      {/* This component will handle updating the document head */}
      <DynamicHead />
      <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
        <UserProvider>
          <SettingsProvider>
            <ElectionProvider>
              <ServerConnectionMonitor>
                <SettingsPreloader>
                  <div className="flex flex-col min-h-screen">
                    <main className="flex-grow">
                      <Routes>
                        <Route
                          path="/"
                          element={<Navigate to="/voting-auth" replace />}
                        />
                        <Route path="/login" element={<Login />} />
                        <Route path="/voting-auth" element={<VotingAuth />} />
                        <Route path="/candidates" element={<Candidates />} />
                        <Route path="/confirm-vote" element={<ConfirmVote />} />
                        <Route path="/thank-you" element={<ThankYou />} />
                        <Route
                          path="/election-manager/*"
                          element={<ElectionManagerVoterPanel />}
                        />
                        <Route
                          path="/voter-results"
                          element={<VoterResults />}
                        />
                        {/* Make Route for VoteSuccess with default props */}
                        <Route
                          path="/vote-success"
                          element={
                            <VoteSuccess
                              voter={{
                                name: "",
                                voterId: "",
                                votedAt: "",
                                voteToken: "",
                              }}
                            />
                          }
                        />
                        {/* Add this catchall route */}
                        <Route path="*" element={<Navigate to="/" replace />} />
                      </Routes>
                    </main>
                  </div>
                </SettingsPreloader>
              </ServerConnectionMonitor>
            </ElectionProvider>
          </SettingsProvider>
        </UserProvider>
      </ThemeProvider>
    </>
  );
};

export default App;
