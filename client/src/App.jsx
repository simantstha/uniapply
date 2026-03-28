import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import LoginForm from './components/auth/LoginForm';
import SignupForm from './components/auth/SignupForm';
import Layout from './components/layout/Layout';
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';
import Universities from './pages/Universities';
import SOPWorkshop from './pages/SOPWorkshop';
import SOPList from './pages/SOPList';
import Documents from './pages/Documents';
import Onboarding from './pages/Onboarding';
import Compare from './pages/Compare';
import ReviewPage from './pages/ReviewPage';
import Timeline from './pages/Timeline';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import VerifyEmail from './pages/VerifyEmail';
import Landing from './pages/Landing';

function PrivateRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg)' }}>
      <div className="w-6 h-6 border-2 border-apple-blue border-t-transparent rounded-full animate-spin" />
    </div>
  );
  if (!user) return <Navigate to="/" replace />;
  if (!user.onboardingCompleted) return <Navigate to="/onboarding" replace />;
  return children;
}

function PublicHome() {
  const { user, loading } = useAuth();
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg)' }}>
      <div className="w-6 h-6 border-2 border-apple-blue border-t-transparent rounded-full animate-spin" />
    </div>
  );
  if (user && user.onboardingCompleted) return <Navigate to="/dashboard" replace />;
  if (user && !user.onboardingCompleted) return <Navigate to="/onboarding" replace />;
  return <Landing />;
}

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <Routes>
            <Route path="/" element={<PublicHome />} />
            <Route path="/login" element={<LoginForm />} />
            <Route path="/signup" element={<SignupForm />} />
            <Route path="/onboarding" element={<Onboarding />} />
            <Route path="/review/:token" element={<ReviewPage />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/verify-email" element={<VerifyEmail />} />
            <Route element={
              <PrivateRoute>
                <Layout />
              </PrivateRoute>
            }>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/universities" element={<Universities />} />
              <Route path="/documents" element={<Documents />} />
              <Route path="/sop/:universityId" element={<SOPList />} />
              <Route path="/sop/:universityId/:sopId" element={<SOPWorkshop />} />
              <Route path="/compare" element={<Compare />} />
              <Route path="/timeline" element={<Timeline />} />
            </Route>
          </Routes>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
