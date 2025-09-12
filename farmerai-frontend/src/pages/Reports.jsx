import React from "react";
import ExportButtons from "../components/ExportButtons";
import HomeButton from "../components/HomeButton";

export default function Reports() {
  const [rows, setRows] = React.useState([]);

  React.useEffect(() => {
    try {
      const list = JSON.parse(localStorage.getItem('farmerai_interactions') || '[]');
      setRows(list);
    } catch { setRows([]); }
  }, []);

  return (
    <div className="max-w-4xl mx-auto">
      <HomeButton />
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold text-gray-800">Reports</h2>
        <ExportButtons data={rows} />
      </div>

      <div className="p-4 bg-white rounded-2xl shadow-sm border border-green-50">
        <p className="text-gray-700 mb-3">Export personalized recommendations, crop cycles, and market insights to PDF/Excel.</p>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left text-gray-600">
                <th className="py-2 pr-4">Date</th>
                <th className="py-2 pr-4">Soil</th>
                <th className="py-2 pr-4">Season</th>
                <th className="py-2 pr-4">Location</th>
                <th className="py-2 pr-4">Selected Crop</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(r => (
                <tr key={r.id} className="border-t">
                  <td className="py-2 pr-4">{new Date(r.date).toLocaleString()}</td>
                  <td className="py-2 pr-4">{r.soilType}</td>
                  <td className="py-2 pr-4">{r.season}</td>
                  <td className="py-2 pr-4">{r.location}</td>
                  <td className="py-2 pr-4">{r.selectedCrop}</td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr><td className="py-4 text-gray-500" colSpan={5}>No saved interactions yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}