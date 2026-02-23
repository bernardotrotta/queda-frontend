"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function SignIn() {
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Esegue una validazione preliminare delle password
    if (formData.password !== formData.confirmPassword) {
      setError("Le password non coincidono");
      return;
    }

    setLoading(true);

    try {
      // Invia i dati di registrazione al server 
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URI}/auth/signup`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        // Cattura errori specifici come "User already exists" o "Missing parameters" 
        throw new Error(data.error || "Errore durante la creazione dell'account");
      }

      // Reindirizza l'utente alla pagina di login in caso di successo
      router.push("/login");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="bg-slate-200 min-h-screen flex flex-col items-center justify-center px-8 py-12">
      <form
        onSubmit={handleRegister}
        className="max-w-md w-full bg-white rounded-3xl shadow-xl p-10 border border-slate-100"
      >
        <h1 className="text-4xl font-black text-center text-indigo-600 mb-10 uppercase tracking-tighter">
          Sign Up
        </h1>

        {error && (
          <div className="mb-4 p-4 bg-red-50 text-red-600 rounded-2xl text-sm font-bold text-center border border-red-100">
            {error}
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="block px-4 text-sm font-bold text-slate-700 mb-2 tracking-wide uppercase">
              Username
            </label>
            <input
              name="username"
              type="text"
              required
              onChange={handleChange}
              className="w-full p-4 bg-slate-100 rounded-2xl text-slate-700 border-2 border-transparent focus:border-indigo-500 outline-none transition-all font-mono"
              placeholder="Il tuo nome"
            />
          </div>

          <div>
            <label className="block px-4 text-sm font-bold text-slate-700 mb-2 tracking-wide uppercase">
              Email
            </label>
            <input
              name="email"
              type="email"
              required
              onChange={handleChange}
              className="w-full p-4 bg-slate-100 rounded-2xl text-slate-700 border-2 border-transparent focus:border-indigo-500 outline-none transition-all font-mono"
              placeholder="esempio@mail.com"
            />
          </div>

          <div>
            <label className="block px-4 text-sm font-bold text-slate-700 mb-2 tracking-wide uppercase">
              Password
            </label>
            <input
              name="password"
              type="password"
              required
              onChange={handleChange}
              className="w-full p-4 bg-slate-100 rounded-2xl text-slate-700 border-2 border-transparent focus:border-indigo-500 outline-none transition-all font-mono"
              placeholder="••••••••"
            />
          </div>

          <div>
            <label className="block px-4 text-sm font-bold text-slate-700 mb-2 tracking-wide uppercase">
              Confirm Password
            </label>
            <input
              name="confirmPassword"
              type="password"
              required
              onChange={handleChange}
              className="w-full p-4 bg-slate-100 rounded-2xl text-slate-700 border-2 border-transparent focus:border-indigo-500 outline-none transition-all font-mono"
              placeholder="Ripeti password"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-4 bg-indigo-600 text-white font-bold py-4 rounded-2xl hover:bg-indigo-700 transition-all shadow-lg disabled:opacity-50"
          >
            {loading ? "Registrazione..." : "Registrati"}
          </button>
        </div>

        <p className="text-center text-slate-500 text-sm mt-6">
          Hai già un account?{" "}
          <Link
            href="/login"
            className="text-indigo-600 font-bold hover:underline"
          >
            Accedi
          </Link>
        </p>
      </form>
    </main>
  );
}