import React, { useState, useEffect } from "react";
import ExportButtons from "../components/ExportButtons";
import HomeButton from "../components/HomeButton";
import apiClient from "../services/apiClient";

export default function Reports() {
  const [rows, setRows] = useState([]);
  const [filters, setFilters] = useState({
    dateFrom: "",
    dateTo: "",
    warehouse: "",
    crop: "",
    status: ""
  });
  const [warehouses, setWarehouses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [reportType, setReportType] = useState("bookings"); // bookings, soil, crops
  const [soilData, setSoilData] = useState([]);
  const [cropsData, setCropsData] = useState([]);

  useEffect(() => {
    fetchWarehouses();
    fetchBookings();
  }, []);

  const fetchWarehouses = async () => {
    try {
      // This function is kept for the warehouse dropdown
      const res = await apiClient.get("/warehouses?limit=100");
      if (res.data?.success) setWarehouses(res.data.data || []);
    } catch (error) {
      console.error("Failed to fetch warehouses:", error);
    }
  };

  const fetchBookings = async () => {
    try {
      setLoading(true);
      setError("");
      const params = new URLSearchParams();
      if (filters.dateFrom) params.append("dateFrom", filters.dateFrom);
      if (filters.dateTo) params.append("dateTo", filters.dateTo);
      if (filters.status) params.append("status", filters.status);
      
      const res = await apiClient.get(`/warehouse-bookings/my-bookings?${params.toString()}`);
      if (res.data?.success) {
        const normalized = (res.data.data || []).map(b => ({
          id: b._id,
          bookingId: b.bookingId || b._id,
          warehouse: b.warehouse?.name || "N/A",
          warehouseId: b.warehouse?._id || "",
          location: `${b.warehouse?.location?.city || ""}, ${b.warehouse?.location?.state || ""}`.trim(),
          crop: b.produce?.type || b.produceType || "",
          quantity: b.produce?.quantity || b.quantity || 0,
          unit: b.produce?.unit || b.unit || "",
          startDate: b.bookingDates?.startDate || b.startDate,
          endDate: b.bookingDates?.endDate || b.endDate,
          duration: b.bookingDates?.duration || b.duration,
          amount: b.pricing?.totalAmount || b.totalAmount || 0,
          status: b.status || "pending",
          paymentStatus: b.payment?.status || b.paymentStatus || "pending",
          createdAt: b.createdAt
        }));
        setRows(normalized);
      } else {
        setRows([]);
        setError(res.data?.message || "Failed to load bookings");
      }
    } catch (e) {
      setRows([]);
      setError(e?.response?.data?.message || "Failed to load bookings");
    } finally {
      setLoading(false);
    }
  };

  const fetchSoilHistory = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await apiClient.get("/reports/soil?months=6");
      if (res.data?.success) {
        setSoilData(res.data.data || []);
      } else {
        setSoilData([]);
        setError(res.data?.message || "Failed to load soil history");
      }
    } catch (e) {
      setSoilData([]);
      setError(e?.response?.data?.message || "Failed to load soil history");
    } finally {
      setLoading(false);
    }
  };

  const fetchCropsReport = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await apiClient.get("/reports/crops");
      if (res.data?.success) {
        setCropsData(res.data.data || []);
      } else {
        setCropsData([]);
        setError(res.data?.message || "Failed to load crops report");
      }
    } catch (e) {
      setCropsData([]);
      setError(e?.response?.data?.message || "Failed to load crops report");
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    if (reportType === "bookings") {
      return rows.filter(r => {
        const wOk = !filters.warehouse || r.warehouseId === filters.warehouse;
        const cOk = !filters.crop || (r.crop || "").toLowerCase().includes(filters.crop.toLowerCase());
        const dFromOk = !filters.dateFrom || (r.startDate && new Date(r.startDate) >= new Date(filters.dateFrom));
        const dToOk = !filters.dateTo || (r.endDate && new Date(r.endDate) <= new Date(filters.dateTo));
        const sOk = !filters.status || r.status === filters.status;
        return wOk && cOk && dFromOk && dToOk && sOk;
      });
    }
    return [];
  };

  const exportData = () => {
    let dataToExport = [];
    let columns = [];
    let filenamePrefix = "farmerai-report";

    switch (reportType) {
      case "bookings":
        dataToExport = applyFilters();
        columns = [
          { key: "bookingId", title: "Booking ID" },
          { key: "warehouse", title: "Warehouse" },
          { key: "location", title: "Location" },
          { key: "crop", title: "Crop" },
          { key: "quantity", title: "Qty" },
          { key: "unit", title: "Unit" },
          { key: "startDate", title: "Start" },
          { key: "endDate", title: "End" },
          { key: "duration", title: "Days" },
          { key: "amount", title: "Amount" },
          { key: "status", title: "Status" },
          { key: "paymentStatus", title: "Payment" },
        ];
        filenamePrefix = "farmerai-bookings";
        break;
      case "soil":
        dataToExport = soilData;
        columns = [
          { key: "createdAt", title: "Date" },
          { key: "pH", title: "pH" },
          { key: "moisture", title: "Moisture" },
          { key: "n", title: "Nitrogen" },
          { key: "p", title: "Phosphorus" },
          { key: "k", title: "Potassium" },
        ];
        filenamePrefix = "farmerai-soil-history";
        break;
      case "crops":
        dataToExport = cropsData;
        columns = [
          { key: "cropName", title: "Crop" },
          { key: "startDate", title: "Start Date" },
          { key: "expectedHarvestDate", title: "Expected Harvest" },
          { key: "progress", title: "Progress %" },
        ];
        filenamePrefix = "farmerai-crops-report";
        break;
      default:
        dataToExport = applyFilters();
        columns = [
          { key: "bookingId", title: "Booking ID" },
          { key: "warehouse", title: "Warehouse" },
          { key: "location", title: "Location" },
          { key: "crop", title: "Crop" },
          { key: "quantity", title: "Qty" },
          { key: "unit", title: "Unit" },
          { key: "startDate", title: "Start" },
          { key: "endDate", title: "End" },
          { key: "duration", title: "Days" },
          { key: "amount", title: "Amount" },
          { key: "status", title: "Status" },
          { key: "paymentStatus", title: "Payment" },
        ];
        filenamePrefix = "farmerai-bookings";
    }

    return { data: dataToExport, columns, filenamePrefix };
  };

  return (
    <div className="max-w-6xl mx-auto">
      <HomeButton />
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold text-gray-800">Reports</h2>
        <ExportButtons
          data={exportData().data}
          filenamePrefix={exportData().filenamePrefix}
          columns={exportData().columns}
        />
      </div>

      {/* Report Type Selector */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <button
          onClick={() => {
            setReportType("bookings");
            setTimeout(() => fetchBookings(), 100);
          }}
          className={`p-4 rounded-xl border text-left transition-all ${
            reportType === "bookings"
              ? "border-emerald-500 bg-emerald-50"
              : "border-gray-200 hover:border-gray-300"
          }`}
        >
          <div className="flex items-center space-x-3">
            <span className="text-2xl">📦</span>
            <div>
              <div className="font-medium">Booking History</div>
              <div className="text-sm text-gray-600">Your warehouse bookings</div>
            </div>
          </div>
        </button>
        <button
          onClick={() => {
            setReportType("soil");
            setTimeout(() => fetchSoilHistory(), 100);
          }}
          className={`p-4 rounded-xl border text-left transition-all ${
            reportType === "soil"
              ? "border-emerald-500 bg-emerald-50"
              : "border-gray-200 hover:border-gray-300"
          }`}
        >
          <div className="flex items-center space-x-3">
            <span className="text-2xl">🌱</span>
            <div>
              <div className="font-medium">Soil History</div>
              <div className="text-sm text-gray-600">Soil test records</div>
            </div>
          </div>
        </button>
        <button
          onClick={() => {
            setReportType("crops");
            setTimeout(() => fetchCropsReport(), 100);
          }}
          className={`p-4 rounded-xl border text-left transition-all ${
            reportType === "crops"
              ? "border-emerald-500 bg-emerald-50"
              : "border-gray-200 hover:border-gray-300"
          }`}
        >
          <div className="flex items-center space-x-3">
            <span className="text-2xl">🌽</span>
            <div>
              <div className="font-medium">Crops Report</div>
              <div className="text-sm text-gray-600">Growth calendar data</div>
            </div>
          </div>
        </button>
      </div>

      <div className="p-4 bg-white rounded-2xl shadow-sm border border-green-50">
        <p className="text-gray-700 mb-3">
          Export your {reportType === "bookings" ? "booking history" : reportType === "soil" ? "soil records" : "crops data"} to PDF or Excel.
          {reportType === "bookings" && " Use filters below to refine."}
        </p>

        {/* Filters - only for bookings */}
        {reportType === "bookings" && (
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3 mb-4">
            <div>
              <label className="text-sm text-gray-600">Date From</label>
              <input
                type="date"
                value={filters.dateFrom}
                onChange={e => setFilters(prev => ({ ...prev, dateFrom: e.target.value }))}
                className="w-full mt-1 px-3 py-2 border rounded-lg"
              />
            </div>
            <div>
              <label className="text-sm text-gray-600">Date To</label>
              <input
                type="date"
                value={filters.dateTo}
                onChange={e => setFilters(prev => ({ ...prev, dateTo: e.target.value }))}
                className="w-full mt-1 px-3 py-2 border rounded-lg"
              />
            </div>
            <div>
              <label className="text-sm text-gray-600">Warehouse</label>
              <select
                value={filters.warehouse}
                onChange={e => setFilters(prev => ({ ...prev, warehouse: e.target.value }))}
                className="w-full mt-1 px-3 py-2 border rounded-lg"
              >
                <option value="">All</option>
                {warehouses.map(w => (
                  <option key={w._id} value={w._id}>
                    {w.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm text-gray-600">Crop Type</label>
              <input
                type="text"
                placeholder="e.g., Wheat"
                value={filters.crop}
                onChange={e => setFilters(prev => ({ ...prev, crop: e.target.value }))}
                className="w-full mt-1 px-3 py-2 border rounded-lg"
              />
            </div>
            <div>
              <label className="text-sm text-gray-600">Status</label>
              <select
                value={filters.status}
                onChange={e => setFilters(prev => ({ ...prev, status: e.target.value }))}
                className="w-full mt-1 px-3 py-2 border rounded-lg"
              >
                <option value="">All</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="paid">Paid</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>
        )}

        {/* Bookings Table */}
        {reportType === "bookings" && (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-gray-600">
                  <th className="py-2 pr-4">Booking ID</th>
                  <th className="py-2 pr-4">Warehouse</th>
                  <th className="py-2 pr-4">Crop</th>
                  <th className="py-2 pr-4">Qty</th>
                  <th className="py-2 pr-4">Duration</th>
                  <th className="py-2 pr-4">Amount</th>
                  <th className="py-2 pr-4">Status</th>
                </tr>
              </thead>
              <tbody>
                {applyFilters().map(r => (
                  <tr key={r.id} className="border-t">
                    <td className="py-2 pr-4">{r.bookingId}</td>
                    <td className="py-2 pr-4">{r.warehouse}</td>
                    <td className="py-2 pr-4">{r.crop}</td>
                    <td className="py-2 pr-4">{r.quantity} {r.unit}</td>
                    <td className="py-2 pr-4">{r.duration} days</td>
                    <td className="py-2 pr-4">₹{r.amount}</td>
                    <td className="py-2 pr-4 capitalize">{r.status}</td>
                  </tr>
                ))}
                {applyFilters().length === 0 && (
                  <tr>
                    <td className="py-4 text-gray-500" colSpan={7}>
                      {loading ? "Loading..." : (error || "No bookings found.")}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Soil History Table */}
        {reportType === "soil" && (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-gray-600">
                  <th className="py-2 pr-4">Date</th>
                  <th className="py-2 pr-4">pH</th>
                  <th className="py-2 pr-4">Moisture (%)</th>
                  <th className="py-2 pr-4">Nitrogen</th>
                  <th className="py-2 pr-4">Phosphorus</th>
                  <th className="py-2 pr-4">Potassium</th>
                </tr>
              </thead>
              <tbody>
                {soilData.map((record, index) => (
                  <tr key={index} className="border-t">
                    <td className="py-2 pr-4">{new Date(record.createdAt).toLocaleDateString()}</td>
                    <td className="py-2 pr-4">{record.pH}</td>
                    <td className="py-2 pr-4">{record.moisture}</td>
                    <td className="py-2 pr-4">{record.n}</td>
                    <td className="py-2 pr-4">{record.p}</td>
                    <td className="py-2 pr-4">{record.k}</td>
                  </tr>
                ))}
                {soilData.length === 0 && (
                  <tr>
                    <td className="py-4 text-gray-500" colSpan={6}>
                      {loading ? "Loading..." : (error || "No soil records found.")}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Crops Report Table */}
        {reportType === "crops" && (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-gray-600">
                  <th className="py-2 pr-4">Crop</th>
                  <th className="py-2 pr-4">Start Date</th>
                  <th className="py-2 pr-4">Expected Harvest</th>
                  <th className="py-2 pr-4">Progress</th>
                </tr>
              </thead>
              <tbody>
                {cropsData.map((crop, index) => (
                  <tr key={index} className="border-t">
                    <td className="py-2 pr-4">{crop.cropName}</td>
                    <td className="py-2 pr-4">{new Date(crop.startDate).toLocaleDateString()}</td>
                    <td className="py-2 pr-4">{crop.expectedHarvestDate ? new Date(crop.expectedHarvestDate).toLocaleDateString() : "N/A"}</td>
                    <td className="py-2 pr-4">{crop.progress || 0}%</td>
                  </tr>
                ))}
                {cropsData.length === 0 && (
                  <tr>
                    <td className="py-4 text-gray-500" colSpan={4}>
                      {loading ? "Loading..." : (error || "No crops data found.")}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}