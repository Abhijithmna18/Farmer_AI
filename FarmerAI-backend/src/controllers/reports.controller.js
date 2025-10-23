// src/controllers/reports.controller.js
const SoilRecord = require('../models/SoilRecord');
const Booking = require('../models/Booking');
const GrowthCalendar = require('../models/GrowthCalendar');
const Warehouse = require('../models/Warehouse');

// Soil history for last N months
exports.getSoilHistory = async (req, res) => {
  try {
    const userId = req.params.userId || req.user._id || req.user.id;
    const { months = 6 } = req.query;
    const since = new Date();
    since.setMonth(since.getMonth() - Math.max(1, parseInt(months)));

    const pipeline = [
      { $match: { user: userId, createdAt: { $gte: since } } },
      { $project: { pH: 1, moisture: 1, n: '$nutrients.n', p: '$nutrients.p', k: '$nutrients.k', createdAt: 1 } },
      { $sort: { createdAt: 1 } }
    ];

    const points = await SoilRecord.aggregate(pipeline);
    res.json({ success: true, data: points });
  } catch (e) {
    res.status(500).json({ message: e.message || 'Failed to fetch soil history' });
  }
};

// Crops yield & growth
exports.getCropsReport = async (req, res) => {
  try {
    const userId = req.params.userId || req.user._id || req.user.id;
    // Using GrowthCalendar as proxy for crop progress if present
    const items = await GrowthCalendar.find({ user: userId })
      .select('cropName progress startDate expectedHarvestDate')
      .sort({ startDate: -1 })
      .lean();
    res.json({ success: true, data: items });
  } catch (e) {
    res.status(500).json({ message: e.message || 'Failed to fetch crops report' });
  }
};

// Market trends (stubbed / delegated to assistant insights if needed)
exports.getMarketTrends = async (req, res) => {
  try {
    const { crop = 'pepper' } = req.params;
    // For now, return a 90-day synthetic series shaped for charts
    const days = 90;
    const base = 500 + Math.floor(Math.random() * 50);
    const series = Array.from({ length: days }, (_, i) => ({
      day: i + 1,
      price: base + Math.round(20 * Math.sin(i / 6) + Math.random() * 10)
    }));
    res.json({ success: true, data: { crop, series } });
  } catch (e) {
    res.status(500).json({ message: e.message || 'Failed to fetch market trends' });
  }
};

// Exports placeholder - return CSV content for now
exports.exportData = async (req, res) => {
  try {
    const { format = 'csv' } = req.params;
    const { reportType, startDate, endDate } = req.query;
    
    // Generate report data based on type
    let rows;
    
    switch (reportType) {
      case 'revenue':
        rows = [
          ['Date', 'Revenue'],
          [new Date().toISOString(), 125000],
          [new Date(Date.now() - 86400000).toISOString(), 115000]
        ];
        break;
      case 'bookings':
        rows = [
          ['Date', 'Bookings', 'Revenue'],
          [new Date().toISOString(), 25, 45000],
          [new Date(Date.now() - 86400000).toISOString(), 22, 42000]
        ];
        break;
      case 'inventory':
        rows = [
          ['Item', 'Current Stock', 'Reorder Level'],
          ['Wheat Seeds', 50, 100],
          ['NPK Fertilizer', 200, 500]
        ];
        break;
      case 'customers':
        rows = [
          ['Customer', 'Bookings', 'Revenue'],
          ['John Doe', 12, 18000],
          ['Jane Smith', 8, 12000]
        ];
        break;
      case 'warehouses':
        rows = [
          ['Warehouse', 'Occupancy %', 'Revenue'],
          ['Cold Storage A', 85, 45000],
          ['Grain Storage C', 90, 38000]
        ];
        break;
      case 'financial':
        rows = [
          ['Month', 'Revenue', 'Costs', 'Profit'],
          ['Jan', 35000, 15000, 20000],
          ['Feb', 42000, 18000, 24000]
        ];
        break;
      default:
        rows = [
          ['date', 'ph', 'moisture'],
          [new Date().toISOString(), 6.5, 28],
          [new Date(Date.now() - 86400000).toISOString(), 6.7, 30]
        ];
    }

    if (format === 'csv') {
      const csv = rows.map(r => r.join(',')).join('\n');
      res.header('Content-Type', 'text/csv');
      res.attachment(`${reportType || 'report'}.csv`);
      return res.send(csv);
    }
    if (format === 'excel' || format === 'xlsx') {
      // Simple CSV fallback for Excel
      const csv = rows.map(r => r.join(',')).join('\n');
      res.header('Content-Type', 'application/vnd.ms-excel');
      res.attachment(`${reportType || 'report'}.xls`);
      return res.send(csv);
    }
    if (format === 'pdf') {
      // Minimal PDF placeholder
      res.header('Content-Type', 'application/pdf');
      res.attachment(`${reportType || 'report'}.pdf`);
      return res.send(Buffer.from('%PDF-1.3\n%… minimal placeholder PDF …', 'utf8'));
    }
    return res.status(400).json({ message: 'Unsupported format' });
  } catch (e) {
    res.status(500).json({ message: e.message || 'Failed to export report' });
  }
};















