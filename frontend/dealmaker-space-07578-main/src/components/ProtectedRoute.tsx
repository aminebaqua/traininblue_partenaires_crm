import { Navigate, Outlet, useLocation } from "react-router-dom";

interface ProtectedRouteProps {
  authOnly?: boolean; 
}

const ProtectedRoute = ({ authOnly = true }: ProtectedRouteProps) => {
  const token = localStorage.getItem("access_token");
  const location = useLocation();

  // console.log("ProtectedRoute check:", { token, path: location.pathname });

  
  if (authOnly && !token) {
    console.log("No token found, redirecting to /auth");
    return <Navigate to="/auth" replace state={{ from: location }} />;
  }

  if (!authOnly && token) {
    console.log("Token found, redirecting to /dashboard");
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
