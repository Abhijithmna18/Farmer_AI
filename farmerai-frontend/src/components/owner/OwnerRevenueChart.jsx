import React from 'react';

export default function OwnerRevenueChart({ revenue = [] }) {
  // Minimal placeholder: show a simple list; can integrate chart lib later
  return (
    <div className="bg-white rounded-xl border p-6">
      <div className="text-lg font-semibold mb-4">Revenue (Recent)</div>
      {revenue.length === 0 ? (
        <div className="text-sm text-gray-600">No revenue data yet.</div>
      ) : (
        <ul className="text-sm text-gray-800 list-disc ml-5">
          {revenue.map((r, idx) => (
            <li key={idx}>{r.label}: ₹{r.amount}</li>
          ))}
        </ul>
      )}
    </div>
  );
}





