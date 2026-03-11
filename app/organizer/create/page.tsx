"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function CreateQueue() {
  const [queueName, setQueueName] = useState("");
  const [estimatedTimeMinutes, setEstimatedTimeMinutes] = useState(10);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleSaveQueue = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const token = localStorage.getItem("token");
    if (!token) {
      // Redirects to the login if the session token is absent
      router.push("/login");
      return;
    }

    try {
      // Converts the entered minutes in milliseconds for the database
      const averageServingTimeMs = estimatedTimeMinutes * 60 * 1000;

      // Sends the queue creation request to the backend
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URI}/queues`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`, // Gives the user identifier through the middleware
        },
        body: JSON.stringify({
          name: queueName, // Field validated by the queueNameChain middleware
          averageServingTime: averageServingTimeMs // Uses the key attended by the controller
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        // Manages the standardized error messages coming from the backend
        throw new Error(data.error || "Unable to create the queue");
      }

      // Redirects to account management after the resource creation
      router.push("/account");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-200 flex items-center justify-center p-8">
      <form onSubmit={handleSaveQueue} className="max-w-md w-full bg-white rounded-3xl shadow-xl p-10 border border-slate-100">
        <h1 className="text-3xl font-black text-indigo-600 mb-8 text-center uppercase tracking-tighter">Configure Queue</h1>
        
        {error && (
          <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-2xl text-sm font-bold text-center border border-red-100">
            {error}
          </div>
        )}

        <div className="space-y-6">
          <div>
            <label className="block px-4 text-sm font-bold text-slate-700 mb-2 uppercase tracking-wide">Session Name</label>
            <input 
              required 
              type="text" 
              className="w-full p-4 bg-slate-100 rounded-2xl text-slate-700 border-2 border-transparent focus:border-indigo-500 outline-none transition-all font-mono" 
              placeholder="e.g. Technical Consulting"
              value={queueName} 
              onChange={(e) => setQueueName(e.target.value)} 
            />
          </div>
          
          <div>
            <label className="block px-4 text-sm font-bold text-slate-700 mb-2 uppercase tracking-wide">Average turn duration (Minutes)</label>
            <input 
              required 
              type="number" 
              min="1" 
              className="w-full p-4 bg-slate-100 rounded-2xl text-slate-700 border-2 border-transparent focus:border-indigo-500 outline-none transition-all font-mono" 
              value={estimatedTimeMinutes} 
              onChange={(e) => setEstimatedTimeMinutes(parseInt(e.target.value))} 
            />
          </div>

          <button 
            type="submit" 
            disabled={loading} 
            className="w-full bg-indigo-600 text-white font-black py-4 rounded-2xl shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all disabled:opacity-50"
          >
            {loading ? "CREATING..." : "SAVE AND START"}
          </button>
        </div>
      </form>
    </main>
  );
}
