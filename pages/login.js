import React, { useState } from "react";
import { useRouter } from "next/router";
import { supabase } from "../utils/supabaseClient";

export default function Login() {
  const [email, setEmail] = useState(""); // Ganti jadi email
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError("Email atau password salah");
    } else {
      router.push("/admin");
    }
  };

  return (
    <main className="min-h-screen bg-[#F1E7E7] flex items-center justify-center px-4">
      <form
        onSubmit={handleSubmit}
        className="bg-[#E69DB8] p-8 rounded-lg max-w-sm w-full shadow-lg"
      >
        <h1 className="text-3xl font-bold mb-6 text-[white] text-center">
          Login Admin
        </h1>
        {error && (
          <p className="mb-4 text-red-500 font-semibold text-center">{error}</p>
        )}
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full px-4 py-2 mb-4 rounded-lg border border-yellow-400 bg-[#FFC6C6] text-[#948979] placeholder-[#948979]"
          required
          autoFocus
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full px-4 py-2 mb-6 rounded-lg border border-yellow-400 bg-[#FFC6C6] text-[#948979] placeholder-[#948979]"
          required
        />
        <button
          type="submit"
          className="w-full py-2 bg-[#D76C82] hover:text-[#948979] hover:bg-[#FFFECE] rounded-lg text-white font-semibold"
        >
          Masuk
        </button>
      </form>
    </main>
  );
}
