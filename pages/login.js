import React, { useState } from "react";
import { useRouter } from "next/router";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  const handleSubmit = (e) => {
    e.preventDefault();

    // Contoh validasi sederhana, nanti bisa diganti dengan autentikasi nyata
    if (username === "admin" && password === "password123") {
      // Simpan status login di localStorage/sessionStorage
      localStorage.setItem("isLoggedIn", "true");
      router.push("/admin");
    } else {
      setError("Username atau password salah");
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-[#0f172a] to-[#1e293b] flex items-center justify-center px-4">
      <form
        onSubmit={handleSubmit}
        className="bg-[#1e293b] p-8 rounded-lg max-w-sm w-full shadow-lg"
      >
        <h1 className="text-3xl font-bold mb-6 text-white text-center">
          Login Admin
        </h1>
        {error && (
          <p className="mb-4 text-red-500 font-semibold text-center">{error}</p>
        )}
        <input
          type="text"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="w-full px-4 py-2 mb-4 rounded-lg border border-gray-600 bg-[#1e293b] text-white placeholder-gray-400"
          required
          autoFocus
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full px-4 py-2 mb-6 rounded-lg border border-gray-600 bg-[#1e293b] text-white placeholder-gray-400"
          required
        />
        <button
          type="submit"
          className="w-full py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-white font-semibold"
        >
          Masuk
        </button>
      </form>
    </main>
  );
}
