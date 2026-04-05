import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './Context/AuthContext';
import { ThemeProvider } from './Context/ThemeContext';
import AdminLayout from './components/layout/AdminLayout';
import Login from './pages/auth/Login';
import Dashboard from './pages/dashboard/Dashboard';
import Properties from './pages/properties/Properties';
import Categories from './pages/categories/Categories';
import Enquiries from './pages/enquiries/Enquiries';
import Users from './pages/users/Users';
import CMS from './pages/cms/CMS';

function Protected({ children }) {
  const { isAuth, loading } = useAuth();
  if (loading) return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'var(--bg)' }}>
      <div className="spinner spinner-gold spinner-page" />
    </div>
  );
  return isAuth ? children : <Navigate to="/login" replace />;
}
function PublicRoute({ children }) {
  const { isAuth } = useAuth();
  return isAuth ? <Navigate to="/dashboard" replace /> : children;
}
export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
            <Route path="/" element={<Protected><AdminLayout /></Protected>}>
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="dashboard"  element={<Dashboard />} />
              <Route path="properties" element={<Properties />} />
              <Route path="categories" element={<Categories />} />
              <Route path="enquiries"  element={<Enquiries />} />
              <Route path="users"      element={<Users />} />
              <Route path="cms"        element={<CMS />} />
            </Route>
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}