import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ToastProvider } from './contexts/ToastContext';
import { BackendProvider } from './contexts/BackendContext';
import { ProtectedRoute } from './components/common/ProtectedRoute';

import { Landing } from './pages/Landing';
import { LandingWorkflow } from './pages/LandingWorkflow';
import { Login } from './pages/Login';
import { Signup } from './pages/Signup';
import { Onboarding } from './pages/Onboarding';
import { Dashboard } from './pages/Dashboard';
import { Inbox } from './pages/Inbox';
import { Tickets } from './pages/Tickets';
import { KnowledgeBase } from './pages/KnowledgeBase';
import { Analytics } from './pages/Analytics';
import { Settings } from './pages/Settings';

// User Portal Pages
import { UserHome } from './pages/user/UserHome';
import { UserChat } from './pages/user/UserChat';
import { UserHistory } from './pages/user/UserHistory';
import { UserProfile } from './pages/user/UserProfile';

export function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <BackendProvider>
          <ToastProvider>
            <Routes>
              {/* Public Marketing & Auth */}
              <Route path="/" element={<LandingWorkflow />} />
              <Route path="/classic" element={<Landing />} />
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/onboarding" element={<Onboarding />} />

              {/* Customer User Portal (Role-based Protected) */}
              <Route
                path="/user"
                element={
                  <ProtectedRoute>
                    <UserHome />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/user/chat/:conversationId"
                element={
                  <ProtectedRoute>
                    <UserChat />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/user/history"
                element={
                  <ProtectedRoute>
                    <UserHistory />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/user/profile"
                element={
                  <ProtectedRoute>
                    <UserProfile />
                  </ProtectedRoute>
                }
              />

              {/* Agent / Admin Workspace (Restricted from Customer role) */}
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute requiredRole="admin">
                    <Dashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/inbox"
                element={
                  <ProtectedRoute requiredRole="admin">
                    <Inbox />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/tickets"
                element={
                  <ProtectedRoute requiredRole="admin">
                    <Tickets />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/knowledge-base"
                element={
                  <ProtectedRoute requiredRole="admin">
                    <KnowledgeBase />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/analytics"
                element={
                  <ProtectedRoute requiredRole="admin">
                    <Analytics />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/settings"
                element={
                  <ProtectedRoute requiredRole="admin">
                    <Settings />
                  </ProtectedRoute>
                }
              />

              {/* Catch-all redirect */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </ToastProvider>
        </BackendProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
