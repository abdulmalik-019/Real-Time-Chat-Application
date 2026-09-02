import { useState } from "react";

function Register({ goToLogin }) {
    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [loading, setLoading] = useState(false);

    const handleRegister = async (e) => {
        e.preventDefault();

        setError("");
        setSuccess("");

        if (password !== confirmPassword) {
            setError("Passwords do not match");
            return;
        }

        setLoading(true);

        try {
            const response = await fetch(
    "http://10.250.66.177:5000/api/auth/register",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        username,
                        email,
                        password,
                    }),
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Registration failed");
            }

            setSuccess("Registration successful! Please login.");

            setUsername("");
            setEmail("");
            setPassword("");
            setConfirmPassword("");

        } catch (error) {
            setError(error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
            <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8">

                <div className="text-center mb-8">
                    <div className="text-5xl mb-3">💬</div>

                    <h1 className="text-3xl font-bold text-gray-800">
                        Create Account
                    </h1>

                    <p className="text-gray-500 mt-2">
                        Join Real Chat today
                    </p>
                </div>

                <form onSubmit={handleRegister}>

                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Username
                    </label>

                    <input
                        type="text"
                        placeholder="Enter username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        required
                        className="w-full border border-gray-300 rounded-lg px-4 py-3 mb-4 outline-none focus:ring-2 focus:ring-green-500"
                    />

                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Email
                    </label>

                    <input
                        type="email"
                        placeholder="Enter email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="w-full border border-gray-300 rounded-lg px-4 py-3 mb-4 outline-none focus:ring-2 focus:ring-green-500"
                    />

                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Password
                    </label>

                    <input
                        type="password"
                        placeholder="Enter password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        className="w-full border border-gray-300 rounded-lg px-4 py-3 mb-4 outline-none focus:ring-2 focus:ring-green-500"
                    />

                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Confirm Password
                    </label>

                    <input
                        type="password"
                        placeholder="Confirm password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                        className="w-full border border-gray-300 rounded-lg px-4 py-3 mb-5 outline-none focus:ring-2 focus:ring-green-500"
                    />

                    {error && (
                        <div className="bg-red-100 text-red-600 px-4 py-3 rounded-lg mb-4 text-sm">
                            {error}
                        </div>
                    )}

                    {success && (
                        <div className="bg-green-100 text-green-700 px-4 py-3 rounded-lg mb-4 text-sm">
                            {success}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-lg transition disabled:opacity-50"
                    >
                        {loading ? "Creating account..." : "Register"}
                    </button>

                </form>

                <p className="text-center text-gray-600 mt-6">
                    Already have an account?{" "}

                    <button
                        onClick={goToLogin}
                        className="text-green-600 font-semibold hover:underline"
                    >
                        Login
                    </button>
                </p>

            </div>
        </div>
    );
}

export default Register;