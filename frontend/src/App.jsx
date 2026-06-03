import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { LanguageProvider } from './context/LanguageContext';
import { Toaster } from 'react-hot-toast';
import Navbar from './components/NavbarI18n';
import ProtectedRoute from './components/ProtectedRouteI18n';
import Home from './pages/HomeI18n';
import Report from './pages/ReportI18n';
import Dashboard from './pages/DashboardI18n';
import Issues from './pages/IssuesI18n';
import Admin from './pages/AdminI18n';
import Login from './pages/LoginI18n';
import WorkerDashboard from './pages/WorkerDashboardI18n';
import ReportedIssues from './pages/ReportedIssuesFeedbackI18n';

export default function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <BrowserRouter>
          <Toaster position="top-right" toastOptions={{ duration: 3000 }} />
          <div className="min-h-screen bg-gray-50 flex flex-col">
            <Navbar />
            <main className="flex-1">
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/report" element={<Report />} />
                <Route
                  path="/reported-issues"
                  element={
                    <ProtectedRoute>
                      <ReportedIssues />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/dashboard"
                  element={
                    <ProtectedRoute roles={['officer', 'admin']}>
                      <Dashboard />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/issues"
                  element={
                    <ProtectedRoute roles={['admin']}>
                      <Issues />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin"
                  element={
                    <ProtectedRoute roles={['admin']}>
                      <Admin />
                    </ProtectedRoute>
                  }
                />
                <Route path="/login" element={<Login />} />
                <Route
                  path="/worker-dashboard"
                  element={
                    <ProtectedRoute roles={['worker']}>
                      <WorkerDashboard />
                    </ProtectedRoute>
                  }
                />
              </Routes>
            </main>
          </div>
        </BrowserRouter>
      </AuthProvider>
    </LanguageProvider>
  );
}
