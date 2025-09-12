import React from "react";

function downloadBlob(filename, content, mime = 'text/plain;charset=utf-8') {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function toCSV(rows) {
  const header = ["id","date","soilType","season","location","selectedCrop","recommendations"];
  const csv = [header.join(',')].concat(
    rows.map(r => [
      r.id,
      r.date,
      JSON.stringify(r.soilType || ""),
      JSON.stringify(r.season || ""),
      JSON.stringify(r.location || ""),
      JSON.stringify(r.selectedCrop || ""),
      JSON.stringify((r.recommendations || []).join('; '))
    ].join(','))
  ).join('\n');
  return csv;
}

export default function ExportButtons({ data }) {
  const getData = () => {
    if (data && Array.isArray(data)) return data;
    try {
      const list = JSON.parse(localStorage.getItem('farmerai_interactions') || '[]');
      return list;
    } catch {
      return [];
    }
  };

  const handleExportExcel = () => {
    const rows = getData();
    const csv = toCSV(rows);
    // .csv is Excel-friendly
    downloadBlob('farmerai-recommendations.csv', csv, 'text/csv;charset=utf-8');
  };

  const handleExportPDF = () => {
    const rows = getData();
    // Simple text-based PDF content placeholder (for real PDF, integrate a lib like jsPDF)
    const lines = rows.map(r => `Date: ${r.date}\nSoil: ${r.soilType}\nSeason: ${r.season}\nLocation: ${r.location}\nSelected: ${r.selectedCrop}\nRecs: ${(r.recommendations || []).join(', ')}\n---`).join('\n');
    downloadBlob('farmerai-recommendations.pdf', lines);
  };

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={handleExportPDF}
        className="px-3 py-2 bg-green-600 text-white rounded-xl shadow-sm hover:bg-green-700 transition-colors"
      >
        Export PDF
      </button>

      <button
        onClick={handleExportExcel}
        className="px-3 py-2 bg-gray-100 rounded-xl shadow-sm hover:bg-gray-200 transition-colors"
      >
        Export Excel
      </button>
    </div>
  );
}
