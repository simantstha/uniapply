import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import LoginForm from './components/auth/LoginForm';
import SignupForm from './components/auth/SignupForm';
import Layout from './components/layout/Layout';
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';
import Universities from './pages/Universities';
import SOPWorkshop from './pages/SOPWorkshop';

function PrivateRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-gray-400 text-sm">Loading...</div>
    </div>
  );
  return user ? children : <Navigate to="/login" replace />;
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<LoginForm />} />
          <Route path="/signup" element={<SignupForm />} />
          <Route path="/" element={
            <PrivateRoute>
              <Layout />
            </PrivateRoute>
          }>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="profile" element={<Profile />} />
            <Route path="universities" element={<Universities />} />
            <Route path="sop/:universityId" element={<SOPWorkshop />} />
          </Route>
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
