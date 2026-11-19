import { Navigate } from "react-router-dom";
import { useAuth } from "./AuthProvider";

/** Só administradores (profiles.is_admin) acessam; o banco revalida em cada RPC. */
export default function AdminRoute({ children }) {
  const { user, profile, loading } = useAuth();

  if (loading || (user && !profile)) {
    return (
      <div className="auth-loading">
        <p>Carregando…</p>
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace state={{ from: "/admin" }} />;
  if (!profile?.is_admin) return <Navigate to="/" replace />;

  return children;
}
