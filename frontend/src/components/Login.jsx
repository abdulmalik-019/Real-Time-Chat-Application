import { useState } from "react";

function Login({ onLogin, goToRegister }) {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleLogin = async (e) => {
        e.preventDefault();

        setError("");
        setLoading(true);

        try {
            const response = await fetch(
                "http://10.250.66.177:5000/api/auth/login",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        email,
                        password,
                    }),
                }
            );

            // Response ko safely read karo
            const text = await response.text();

            let data = {};

            if (text) {
                try {
                    data = JSON.parse(text);
                } catch (jsonError) {
                    console.error(
                        "Invalid JSON response:",
                        text
                    );

                    throw new Error(
                        "Server returned an invalid response"
                    );
                }
            }

            if (!response.ok) {
                throw new Error(
                    data.message || "Login failed"
                );
            }

            // Token save
            sessionStorage.setItem(
                "token",
                data.token
            );

            // User save
            sessionStorage.setItem(
                "user",
                JSON.stringify(data.user)
            );

            // Login success
            onLogin(data.user);

        } catch (error) {
            console.error("Login error:", error);

            setError(error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">

            <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8">

                {/* HEADER */}
                <div className="text-center mb-8">

                    <div className="text-5xl mb-3">
                        💬
                    </div>

                    <h1 className="text-3xl font-bold text-gray-800">
                        Real Chat
                    </h1>

                    <p className="text-gray-500 mt-2">
                        Login to continue chatting
                    </p>

                </div>

                {/* LOGIN FORM */}
                <form onSubmit={handleLogin}>

                    {/* EMAIL */}
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Email
                    </label>

                    <input
                        type="email"
                        placeholder="Enter your email"
                        value={email}
                        onChange={(e) =>
                            setEmail(e.target.value)
                        }
                        required
                        className="w-full border border-gray-300 rounded-lg px-4 py-3 mb-5 outline-none focus:ring-2 focus:ring-green-500"
                    />

                    {/* PASSWORD */}
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Password
                    </label>

                    <input
                        type="password"
                        placeholder="Enter your password"
                        value={password}
                        onChange={(e) =>
                            setPassword(e.target.value)
                        }
                        required
                        className="w-full border border-gray-300 rounded-lg px-4 py-3 mb-5 outline-none focus:ring-2 focus:ring-green-500"
                    />

                    {/* ERROR */}
                    {error && (
                        <div className="bg-red-100 text-red-600 px-4 py-3 rounded-lg mb-5 text-sm">
                            {error}
                        </div>
                    )}

                    {/* LOGIN BUTTON */}
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-lg transition disabled:opacity-50"
                    >
                        {loading
                            ? "Logging in..."
                            : "Login"}
                    </button>

                </form>

                {/* REGISTER */}
                <p className="text-center text-gray-600 mt-6">

                    Don't have an account?{" "}

                    <button
                        onClick={goToRegister}
                        className="text-green-600 font-semibold hover:underline"
                    >
                        Register
                    </button>

                </p>

            </div>

        </div>
    );
}

export default Login;