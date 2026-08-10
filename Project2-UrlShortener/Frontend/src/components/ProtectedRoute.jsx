import { Navigate } from "react-router-dom";
import { useSelector } from "react-redux";


// ProtectedRoute can no longer check localStorage —
//  it needs to check Redux state, and handle 
// the "we're still trying to silently refresh" 
// loading state

// children means whatever you put inside <ProtectedRoute>.

// For example:

// <ProtectedRoute>
//     <Dashboard />
// </ProtectedRoute>

// Replace the current history entry instead of adding a new one.
// If the user presses Back,
//  they could go back to /dashboard, which immediately redirects them to /login again.

export default function ProtectedRoute ({ children }) {
    const accessToken = useSelector((state) => state.auth.accessToken);

    if (!accessToken) {
        return <Navigate to="/login" replace/>;
    }

    return children
}