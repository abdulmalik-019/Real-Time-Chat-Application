import { useState } from "react";
import Login from "./components/Login";
import Register from "./components/Register";
import Chat from "./components/Chat";

function App() {
    const [page, setPage] = useState("login");

    const [user, setUser] = useState(() => {
        const savedUser = sessionStorage.getItem("user");

        return savedUser ? JSON.parse(savedUser) : null;
    });

    const handleLogin = (loggedInUser) => {
        setUser(loggedInUser);
    };

    const handleLogout = () => {
    sessionStorage.removeItem("token");
    sessionStorage.removeItem("user");

    setUser(null);
    setPage("login");
};

    if (!user) {
        if (page === "register") {
            return (
                <Register
                    goToLogin={() => setPage("login")}
                />
            );
        }

        return (
            <Login
                onLogin={handleLogin}
                goToRegister={() => setPage("register")}
            />
        );
    }

    return (
        <Chat
            user={user}
            onLogout={handleLogout}
        />
    );
}

export default App;