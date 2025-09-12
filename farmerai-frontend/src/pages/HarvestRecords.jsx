import React, { useEffect, useState } from 'react';
import { getGrowthCalendars } from '../services/calendarService';
import PageHeader from '../components/PageHeader';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const HarvestRecords = () => {
  const [calendars, setCalendars] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const res = await getGrowthCalendars();
        setCalendars(Array.isArray(res?.data) ? res.data : (Array.isArray(res) ? res : []));
      } catch (e) {
        setError(e?.message || 'Failed to load harvest records');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const exportCSV = () => {
    const rows = [['Crop','Variety','Expected Harvest','Actual Harvest','Expected Yield','Actual Yield','Observations']];
    calendars.forEach((c) => {
      const expected = c.harvestDate || c.estimatedHarvestDate || '';
      const expectedStr = expected ? new Date(expected).toLocaleDateString() : '';
      const recs = Array.isArray(c.harvestRecords) && c.harvestRecords.length ? c.harvestRecords : [{}];
      recs.forEach((r) => {
        rows.push([
          c.cropName || '',
          c.variety || '',
          expectedStr,
          r.actualHarvestDate ? new Date(r.actualHarvestDate).toLocaleDateString() : '',
          c.expectedYield ?? '',
          r.quantity ?? c.actualYield ?? '',
          r.observations || ''
        ]);
      });
    });
    const csv = rows.map(r => r.map(v => `"${String(v).replace(/"/g,'""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'harvest-records.csv'; a.click(); URL.revokeObjectURL(url);
  };

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.text('Harvest Records', 14, 16);
    const head = [['Crop','Variety','Expected Harvest','Actual Harvest','Expected Yield','Actual Yield','Observations']];
    const body = [];
    calendars.forEach((c) => {
      const expected = c.harvestDate || c.estimatedHarvestDate || '';
      const expectedStr = expected ? new Date(expected).toLocaleDateString() : '';
      const recs = Array.isArray(c.harvestRecords) && c.harvestRecords.length ? c.harvestRecords : [{}];
      recs.forEach((r) => {
        body.push([
          c.cropName || '',
          c.variety || '',
          expectedStr,
          r.actualHarvestDate ? new Date(r.actualHarvestDate).toLocaleDateString() : '',
          c.expectedYield ?? '',
          r.quantity ?? c.actualYield ?? '',
          r.observations || ''
        ]);
      });
    });
    autoTable(doc, { head, body, startY: 22 });
    doc.save('harvest-records.pdf');
  };

  return (
    <div className="container mx-auto p-4 md:p-6">
      <PageHeader title="Harvest Records" subtitle="Compare expected vs actual outcomes" />
      <div className="mb-4 flex justify-end gap-2">
        <button onClick={exportCSV} className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">Export CSV</button>
        <button onClick={exportPDF} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Export PDF</button>
      </div>
      {loading ? (
        <p>Loading...</p>
      ) : error ? (
        <p className="text-red-600">{error}</p>
      ) : (
        <div className="space-y-4">
          {calendars.map((c, idx) => (
            <div key={idx} className="p-4 border rounded-xl bg-white">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-lg font-semibold">{c.cropName} {c.variety && <span className="text-gray-500">• {c.variety}</span>}</div>
                  <div className="text-sm text-gray-600">Expected: {(c.harvestDate || c.estimatedHarvestDate) ? new Date(c.harvestDate || c.estimatedHarvestDate).toLocaleDateString() : '—'}</div>
                </div>
                <div className="text-right">
                  <div className="text-sm">Expected Yield: {c.expectedYield ?? '—'}</div>
                  <div className="text-sm">Actual Yield: {c.actualYield ?? '—'}</div>
                </div>
              </div>
              <div className="mt-3">
                <div className="text-sm font-medium mb-1">Records</div>
                {Array.isArray(c.harvestRecords) && c.harvestRecords.length ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {c.harvestRecords.map((r, i) => (
                      <div key={i} className="p-3 border rounded-lg bg-gray-50">
                        <div className="text-sm">Actual: {r.actualHarvestDate ? new Date(r.actualHarvestDate).toLocaleDateString() : '—'}</div>
                        <div className="text-sm">Quantity: {r.quantity ?? '—'} {r.unit || 'kg'}</div>
                        {r.observations && <div className="text-xs text-gray-600">{r.observations}</div>}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-sm text-gray-600">No records yet.</div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default HarvestRecords;


