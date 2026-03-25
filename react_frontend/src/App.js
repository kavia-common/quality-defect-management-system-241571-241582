import React from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider } from "./auth/AuthContext";
import { RequireAuth } from "./auth/RequireAuth";
import { AppShell } from "./layout/AppShell";
import { LoginPage } from "./pages/LoginPage";
import { DashboardPage } from "./pages/DashboardPage";
import { DefectsListPage } from "./pages/DefectsListPage";
import { DefectCreatePage } from "./pages/DefectCreatePage";
import { DefectDetailsPage } from "./pages/DefectDetailsPage";
import { ActionsPage } from "./pages/ActionsPage";
import { ReportsPage } from "./pages/ReportsPage";
import { SettingsPage } from "./pages/SettingsPage";

// PUBLIC_INTERFACE
function App() {
  /** Root SPA component: routing, auth, and layout. */
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />

          <Route
            path="/*"
            element={
              <RequireAuth>
                <AppShell>
                  <Routes>
                    <Route path="/" element={<DashboardPage />} />
                    <Route path="/defects" element={<DefectsListPage />} />
                    <Route path="/defects/new" element={<DefectCreatePage />} />
                    <Route path="/defects/:defectId" element={<DefectDetailsPage />} />
                    <Route path="/actions" element={<ActionsPage />} />
                    <Route path="/reports" element={<ReportsPage />} />
                    <Route path="/settings" element={<SettingsPage />} />
                    <Route path="*" element={<Navigate to="/" replace />} />
                  </Routes>
                </AppShell>
              </RequireAuth>
            }
          />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
