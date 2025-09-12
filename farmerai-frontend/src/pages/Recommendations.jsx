import React from "react";
import HomeButton from "../components/HomeButton";

export default function Recommendations() {
  return (
    <div className="max-w-4xl mx-auto">
      <HomeButton />
      <h2 className="text-2xl font-bold text-gray-800 mb-4">Recommendations</h2>
      <div className="grid grid-cols-1 gap-4">
        <div className="p-4 bg-white rounded-2xl shadow-sm border border-green-50">
          <p className="text-gray-700">AI-powered crop, fertilizer and pest recommendations tailored to your profile will appear here.</p>
        </div>
      </div>
    </div>
  );
}