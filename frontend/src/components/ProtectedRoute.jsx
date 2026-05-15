import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function ProtectedRoute({ children }) {
  const { user } = useAuth();

  // Ainda carregando o estado de auth — mostra nada (evita flash)
  if (user === undefined) {
    return (
      <div className="flex items-center justify-center h-screen bg-base">
        <div className="text-green font-mono text-sm animate-pulse">Verificando acesso...</div>
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  return children;
}
