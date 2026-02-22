"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // Invia le credenziali all'endpoint di login dedicato
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URI}/auth/login`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }), // Trasmette i dati richiesti dal servizio di login
        },
      );

      const data = await response.json();

      if (!response.ok) {
        // Estrae il messaggio di errore strutturato dal middleware del backend
        throw new Error(data.error || "Credenziali non valide");
      }

      // Memorizza il token JWT nel database locale del browser
      localStorage.setItem("token", data.token);

      // Indirizza l'utente alla pagina principale dopo l'autenticazione
      router.push("/");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="bg-slate-200 min-h-screen flex flex-col items-center justify-center px-8 py-12 ">
      <form
        onSubmit={handleLogin}
        className="max-w-md w-full bg-white rounded-3xl shadow-xl p-12 border border-slate-100"
      >
        <h1 className="text-4xl font-black text-center text-indigo-600 mb-12">
          Login
        </h1>

        {error && (
          <div className="mb-4 p-4 bg-red-50 text-red-600 rounded-2xl text-sm font-bold text-center border border-red-100">
            {error}
          </div>
        )}

        <div className="mb-4">
          <label className="block px-4 text-sm font-bold text-slate-700 mb-2 tracking-wide">
            Email
          </label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full mb-4 p-4 bg-slate-100 rounded-2xl text-slate-700 border-2 border-transparent focus:border-indigo-500 outline-none transition-all text-l font-mono"
            placeholder="esempio@mail.com"
          />

          <label className="block px-4 text-sm font-bold text-slate-700 mb-2 tracking-wide">
            Password
          </label>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full mb-4 p-4 bg-slate-100 rounded-2xl text-slate-700 border-2 border-transparent focus:border-indigo-500 outline-none transition-all text-l font-mono"
            placeholder="••••••••"
          />

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-4 bg-indigo-600 text-white font-bold py-4 rounded-2xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 disabled:opacity-50"
          >
            {loading ? "Accesso in corso..." : "Accedi"}
          </button>
        </div>

        <div className="relative flex py-5 items-center">
          <div className="grow border-t border-slate-200"></div>
          <span className="shrink mx-4 text-slate-400 text-sm font-bold uppercase text-center">
            Oppure
          </span>
          <div className="grow border-t border-slate-200"></div>
        </div>

        <Link href="/signin">
          <button
            type="button"
            className="w-full border-2 border-slate-200 text-slate-600 font-bold py-4 rounded-2xl hover:bg-slate-700 hover:text-slate-200 transition-all duration-300"
          >
            Registrati
          </button>
        </Link>
      </form>
    </main>
  );
}