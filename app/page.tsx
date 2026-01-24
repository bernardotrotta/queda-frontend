"use client"; // Abilita l'interattività lato client

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";

export default function Home() {
  const [codiceCoda, setCodiceCoda] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  return (
    <div className="min-h-screen bg-slate-200 flex flex-col items-center">

      <header className="flex justify-end w-full px-8 py-4">
        {isLoggedIn ? (
          <Link href="/account" className="group">
            <div className="relative size-12 rounded-full overflow-hidden border-2 border-transparent group-hover:border-indigo-500 transition-all shadow-sm">
              <Image
                src="/user-placeholder.png"
                alt="Account"
                fill
                className="object-cover group-hover:scale-110 transition-transform duration-300"
              />
            </div>
          </Link>
        ) : (
          <Link href="/login" className="group">
            <button className="w-full px-4 bg-indigo-600 text-white font-bold py-4 rounded-2xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200">
              Accedi
            </button>
          </Link>
        )}
      </header>

      <main className="grow flex flex-col items-center py-8 px-8">
        <div className="max-w-md w-full bg-white rounded-3xl shadow-xl p-12 border border-slate-100">
          <h1 className="text-4xl font-black text-center text-indigo-600 mb-12">QUEDA</h1>

          {/* Accesso ad una coda gia esistente */}
          <div className="mb-4">
            <label className="block px-4 uppercase text-sm font-bold text-slate-700 mb-2 tracking-wide">
              Inserisci Codice Coda
            </label>
            <input
              type="text"
              placeholder="XXXX-XXXX"
              className="w-full p-4 bg-slate-100 rounded-2xl text-slate-500 border-2 border-transparent focus:border-indigo-500 outline-none transition-all text-l font-mono"
              onChange={(e) => setCodiceCoda(e.target.value)}
            />
            {isLoggedIn ? (
              <Link href={`/utente?coda=${codiceCoda}`}>
                <button className="w-full mt-4 bg-indigo-600 text-white font-bold py-4 rounded-2xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200">
                  Partecipa come Utente
                </button>
              </Link>
            ) : (
              <Link href={`/login`}>
                <button className="w-full mt-4 bg-indigo-600 text-white font-bold py-4 rounded-2xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200">
                  Partecipa come Utente
                </button>
              </Link>
            )}
          </div>

          <div className="relative flex py-5 items-center">
            <div className="grow border-t border-slate-200"></div>
            <span className="shrink mx-4 text-slate-400 text-sm font-bold uppercase">Oppure</span>
            <div className="grow border-t border-slate-200"></div>
          </div>

          {/* Creazione di una nuova coda */}
          {isLoggedIn ? (
            <Link href="/organizzatore/crea">
              <button className="w-full border-2 border-slate-200 text-slate-600 font-bold py-4 rounded-2xl hover:bg-slate-50 transition-all">
                Crea una Nuova Coda
              </button>
            </Link>
          ) : (
            <Link href="/login">
              <button className="w-full border-2 border-slate-200 text-slate-600 font-bold py-4 rounded-2xl hover:bg-slate-50 transition-all">
                Crea una Nuova Coda
              </button>
            </Link>
          )}
        </div>
      </main>
    </div>
  );
}