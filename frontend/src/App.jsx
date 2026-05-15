import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Navbar from "./components/Navbar";
import Dashboard from "./pages/Dashboard";
import Cliente from "./pages/Cliente";
import Links from "./pages/Links";
import Login from "./pages/Login";

function AppLayout() {
  return (
    <div className="min-h-screen bg-base">
      <Navbar />
      <main className="max-w-7xl mx-auto px-6 pt-20 pb-12">
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/cliente/:id" element={<ProtectedRoute><Cliente /></ProtectedRoute>} />
          <Route path="/links" element={<ProtectedRoute><Links /></ProtectedRoute>} />
        </Routes>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppLayout />
      </BrowserRouter>
    </AuthProvider>
  );
}
