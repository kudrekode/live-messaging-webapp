import React, { useEffect, useState } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";

// Page Imports:
import LoginPage from "./pages/login";
import AdminHome from "./pages/admin-home";
import UserHome from "./pages/user-home";

const App: React.FC = () => {

    //We store the JWT Token and Role of user obtained through API resposne in the login page
    const [authState, setAuthState] = useState<{ token: string | null, role: string | null }>({
        token: null,
        role: null
    });

    // We call useEffect hook to ensure that when app first loads it retrieves the JWT and role data from local storage (saved from login page).
    // This also ensures when user refreshes page, their session is persistent (still logged in)
    useEffect(() => {
        const token = localStorage.getItem("authToken");
        const role = localStorage.getItem("role");

        if (token && role) {
            setAuthState({ token, role });
            console.log("Auth state loaded:", { token, role });
        }
    }, []);

    return (
        <Router>
            <Routes>
                {/* Default route is login page, routing to admin and user implemented here */}
                <Route path="/" element={
                    authState.token ? (
                        authState.role === "1" ? <Navigate to="/admin-home" />
                            : authState.role === "2" ? <Navigate to="/user-home" />
                                    : <Navigate to="/login" />
                    ) : (
                        <LoginPage />
                    )
                } />

                {/* We use element={authState.token} to protect routes so that users and admins don't get routed to wrong page */}
                <Route path="/admin-home" element={authState.token ? <AdminHome /> : <Navigate to="/" />} />
                <Route path="/user-home" element={authState.token ? <UserHome /> : <Navigate to="/" />} />

                {/* Default routing incase of errors or general loads */}
                <Route path="*" element={<Navigate to="/" />} />
            </Routes>
        </Router>
    );
};

export default App;