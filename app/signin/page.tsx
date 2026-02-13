"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function SignIn() {
    // Gestisce i dati del form in un unico oggetto di stato
    const [formData, setFormData] = useState({
        username: "",
        email: "",
        password: "",
        confirmPassword: ""
    });
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    // Aggiorna i campi dinamicamente
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        // Controllo Campi Obbligatori
        const { username, email, password, confirmPassword } = formData;
        if (!username || !email || !password || !confirmPassword) {
            setError("Tutti i campi sono obbligatori.");
            return;
        }

        // Controllo Corrispondenza Password
        if (password !== confirmPassword) {
            setError("Le password non coincidono.");
            return;
        }

        setLoading(true);

        try {
            // Effettua la chiamata al servizio signUser del backend
            const response = await fetch("http://localhost:port/register", { // SOSTITUIRE PORT
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            });

            const data = await response.json();

            if (!response.ok) {
                // Cattura gli errori dal backend 
                throw new Error(data.message || "Errore durante la registrazione");
            }

            // In caso di successo, reindirizza al login
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
                <h1 className="text-4xl font-black text-center text-indigo-600 mb-10">Sign Up</h1>

                {/* Feedback Visivo: L'applicazione mostra il messaggio d'errore se la validazione fallisce */}
                {error && (
                    <div className="mb-4 p-4 bg-red-50 text-red-600 rounded-2xl text-sm font-bold text-center border border-red-100">
                        {error}
                    </div>
                )}

                <div className="space-y-4">
                    <div>
                        <label className="block px-4 text-sm font-bold text-slate-700 mb-2 tracking-wide">Username</label>
                        <input name="username" type="text" onChange={handleChange} className="w-full p-4 bg-slate-100 rounded-2xl text-slate-700 border-2 border-transparent focus:border-indigo-500 outline-none transition-all font-mono" placeholder="Il tuo nome" />
                    </div>

                    <div>
                        <label className="block px-4 text-sm font-bold text-slate-700 mb-2 tracking-wide">Email</label>
                        <input name="email" type="email" onChange={handleChange} className="w-full p-4 bg-slate-100 rounded-2xl text-slate-700 border-2 border-transparent focus:border-indigo-500 outline-none transition-all font-mono" placeholder="esempio@mail.com" />
                    </div>

                    <div>
                        <label className="block px-4 text-sm font-bold text-slate-700 mb-2 tracking-wide">Password</label>
                        <input name="password" type="password" onChange={handleChange} className="w-full p-4 bg-slate-100 rounded-2xl text-slate-700 border-2 border-transparent focus:border-indigo-500 outline-none transition-all font-mono" placeholder="••••••••" />
                    </div>

                    <div>
                        <label className="block px-4 text-sm font-bold text-slate-700 mb-2 tracking-wide">Confirm Password</label>
                        <input name="confirmPassword" type="password" onChange={handleChange} className="w-full p-4 bg-slate-100 rounded-2xl text-slate-700 border-2 border-transparent focus:border-indigo-500 outline-none transition-all font-mono" placeholder="Ripeti password" />
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
                    Hai già un account? <Link href="/login" className="text-indigo-600 font-bold hover:underline">Accedi</Link>
                </p>
            </form>
        </main>
    );
}