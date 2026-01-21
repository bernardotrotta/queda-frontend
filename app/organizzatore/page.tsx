"use client"; // L'applicazione abilita l'interattività lato client

import { useState } from "react";
import Link from "next/link";

export default function Home() {
    const [codiceCoda, setCodiceCoda] = useState("");

    return (
        <main className="bg-slate-50 flex flex-col items-center justify-center px-8 py-12 ">
            <div className="max-w-md w-full bg-white rounded-3xl shadow-xl p-10 border border-slate-100">
                <h1 className="text-4xl font-black text-center text-indigo-600 mb-10">Accedi</h1>

                {/* Accesso ad una coda gia esistente */}
                <div className="mb-10">
                    <label className="block text-sm font-bold text-slate-700 mb-2 uppercase tracking-wide">
                        Inserisci Codice Coda
                    </label>
                    <input
                        type="text"
                        placeholder="XXXX-XXXX"
                        className="w-full p-4 bg-slate-100 rounded-2xl border-2 border-transparent focus:border-indigo-500 outline-none transition-all text-xl font-mono"
                        onChange={(e) => setCodiceCoda(e.target.value)}
                    />
                    <Link href={`/utente?coda=${codiceCoda}`}>
                        <button className="w-full mt-4 bg-indigo-600 text-white font-bold py-4 rounded-2xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200">
                            Partecipa come Utente
                        </button>
                    </Link>
                </div>

                <div className="relative flex py-5 items-center">
                    <div className="flex-grow border-t border-slate-200"></div>
                    <span className="flex-shrink mx-4 text-slate-400 text-sm font-bold uppercase">Oppure</span>
                    <div className="flex-grow border-t border-slate-200"></div>
                </div>

                {/* Creazione di una nuova coda */}
                <Link href="/organizzatore/crea">
                    <button className="w-full border-2 border-slate-200 text-slate-600 font-bold py-4 rounded-2xl hover:bg-slate-50 transition-all">
                        Crea una Nuova Coda
                    </button>
                </Link>
            </div>
        </main>
    );
}