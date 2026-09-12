import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "./AuthProvider";

/** Redireciona visitantes não autenticados para /login. */
export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="auth-loading">
        <p>Carregando…</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return children;
}
