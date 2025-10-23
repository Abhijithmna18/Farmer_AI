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

async function loadCDNScript(src) {
  return new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[src="${src}"]`);
    if (existing) return resolve(true);
    const script = document.createElement('script');
    script.src = src;
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => reject(new Error(`Failed to load ${src}`));
    document.body.appendChild(script);
  });
}

function toCSV(rows, columns) {
  const header = columns?.map(c => c.title) || Object.keys(rows[0] || {});
  const keys = columns?.map(c => c.key) || Object.keys(rows[0] || {});
  const csv = [header.join(',')].concat(
    rows.map(r => keys.map(k => JSON.stringify(r[k] ?? "")).join(','))
  ).join('\n');
  return csv;
}

export default function ExportButtons({ data, columns, filenamePrefix = 'farmerai-report' }) {
  const rows = Array.isArray(data) ? data : [];

  const handleExportExcel = async () => {
    // Try real XLSX via CDN; fallback to CSV
    try {
      await loadCDNScript('https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js');
      // SheetJS exposes global XLSX
      // eslint-disable-next-line no-undef
      const wb = XLSX.utils.book_new();
      const header = columns?.map(c => c.title) || Object.keys(rows[0] || {});
      const keys = columns?.map(c => c.key) || Object.keys(rows[0] || {});
      const aoa = [header, ...rows.map(r => keys.map(k => r[k]))];
      // eslint-disable-next-line no-undef
      const ws = XLSX.utils.aoa_to_sheet(aoa);
      // eslint-disable-next-line no-undef
      XLSX.utils.book_append_sheet(wb, ws, 'Bookings');
      // eslint-disable-next-line no-undef
      const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
      const blob = new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${filenamePrefix}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      const csv = toCSV(rows, columns);
      downloadBlob(`${filenamePrefix}.csv`, csv, 'text/csv;charset=utf-8');
    }
  };

  const handleExportPDF = async () => {
    // Try jsPDF via CDN; fallback to plain text .pdf
    try {
      await loadCDNScript('https://cdn.jsdelivr.net/npm/jspdf@2.5.1/dist/jspdf.umd.min.js');
      // eslint-disable-next-line no-undef
      const { jsPDF } = window.jspdf;
      const doc = new jsPDF({ unit: 'pt', format: 'a4' });
      const margin = 40;
      let y = margin;
      doc.setFontSize(16);
      doc.text('FarmerAI - Bookings Report', margin, y);
      y += 20;
      doc.setFontSize(10);
      const header = columns?.map(c => c.title) || Object.keys(rows[0] || {});
      const keys = columns?.map(c => c.key) || Object.keys(rows[0] || {});
      const colWidths = header.map(() => 70);
      // Header row
      let x = margin;
      header.forEach((h, i) => {
        doc.text(String(h), x, y);
        x += colWidths[i];
      });
      y += 14;
      doc.setLineWidth(0.5);
      doc.line(margin, y, margin + colWidths.reduce((a, b) => a + b, 0), y);
      y += 10;
      // Rows
      rows.forEach(r => {
        x = margin;
        keys.forEach((k, i) => {
          const val = r[k] == null ? '' : String(r[k]);
          const lines = doc.splitTextToSize(val, colWidths[i] - 4);
          lines.forEach((ln) => {
            doc.text(ln, x, y);
            y += 12;
            if (y > 780) { // simple pagination
              doc.addPage();
              y = margin;
            }
          });
          x += colWidths[i];
          y -= 12 * (lines.length);
        });
        y += 16;
        if (y > 780) { doc.addPage(); y = margin; }
      });
      doc.save(`${filenamePrefix}.pdf`);
    } catch (e) {
      const header = columns?.map(c => c.title) || Object.keys(rows[0] || {});
      const keys = columns?.map(c => c.key) || Object.keys(rows[0] || {});
      const lines = [header.join(' | ')].concat(
        rows.map(r => keys.map(k => r[k]).join(' | '))
      ).join('\n');
      downloadBlob(`${filenamePrefix}.pdf`, lines);
    }
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
