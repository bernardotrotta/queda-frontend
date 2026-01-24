"use client";

import Link from "next/link";

export default function Home() {

    return (
        <main className="bg-slate-200 min-h-screen flex flex-col items-center justify-center px-8 py-12 ">
            <div className="max-w-md w-full bg-white rounded-3xl shadow-xl p-10 border border-slate-100">
                <h1 className="text-4xl font-black text-center text-indigo-600 mb-10">Sign In</h1>

                <div className="mb-4">
                    <label className="block px-4 text-sm font-bold text-slate-700 mb-2 tracking-wide">
                        Username
                    </label>
                    <input
                        type="text"
                        className="w-full mb-4 p-4 bg-slate-100 rounded-2xl text-slate-500 border-2 border-transparent focus:border-indigo-500 outline-none transition-all text-l font-mono"
                    />

                    <label className="block px-4 text-sm font-bold text-slate-700 mb-2 tracking-wide">
                        Email
                    </label>
                    <input
                        type="text"
                        className="w-full mb-4 p-4 bg-slate-100 rounded-2xl text-slate-500 border-2 border-transparent focus:border-indigo-500 outline-none transition-all text-l font-mono"
                    />

                    <label className="block px-4 text-sm font-bold text-slate-700 mb-2 tracking-wide">
                        Password
                    </label>
                    <input
                        type="text"
                        className="w-full mb-4 p-4 bg-slate-100 rounded-2xl text-slate-500 border-2 border-transparent focus:border-indigo-500 outline-none transition-all text-l font-mono"
                    />

                    <label className="block px-4 text-sm font-bold text-slate-700 mb-2 tracking-wide">
                        Confirm Password
                    </label>
                    <input
                        type="text"
                        className="w-full mb-4 p-4 bg-slate-100 rounded-2xl text-slate-500 border-2 border-transparent focus:border-indigo-500 outline-none transition-all text-l font-mono"
                    />
                    <Link href={``}>
                        <button className="w-full mt-4 bg-indigo-600 text-white font-bold py-4 rounded-2xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200">
                            Registrati
                        </button>
                    </Link>
                </div>
            </div>
        </main>
    );
}