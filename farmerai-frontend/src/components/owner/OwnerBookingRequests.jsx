import React from 'react';

export default function OwnerBookingRequests({ bookings = [], onApprove, onReject }) {
  if (!bookings.length) {
    return <div className="bg-white rounded-xl border p-6 text-center text-gray-600">No pending booking requests.</div>;
  }

  return (
    <div className="bg-white rounded-xl border overflow-x-auto">
      <table className="min-w-full text-sm">
        <thead className="bg-gray-50 text-gray-600">
          <tr>
            <th className="px-4 py-3 text-left">Farmer</th>
            <th className="px-4 py-3 text-left">Warehouse</th>
            <th className="px-4 py-3 text-left">Produce</th>
            <th className="px-4 py-3 text-left">Dates</th>
            <th className="px-4 py-3 text-left">Amount</th>
            <th className="px-4 py-3"></th>
          </tr>
        </thead>
        <tbody>
          {bookings.map((b) => (
            <tr key={b._id} className="border-t">
              <td className="px-4 py-3">{b.farmer?.firstName} {b.farmer?.lastName}</td>
              <td className="px-4 py-3">{b.warehouse?.name}</td>
              <td className="px-4 py-3">{b.produce?.type} ({b.produce?.quantity} {b.produce?.unit})</td>
              <td className="px-4 py-3">{new Date(b.bookingDates?.startDate).toLocaleDateString()} - {new Date(b.bookingDates?.endDate).toLocaleDateString()}</td>
              <td className="px-4 py-3">₹{b.pricing?.ownerAmount}</td>
              <td className="px-4 py-3 text-right space-x-2">
                <button onClick={() => onReject?.(b)} className="px-3 py-1 rounded bg-red-50 text-red-600 hover:bg-red-100">Reject</button>
                <button onClick={() => onApprove?.(b)} className="px-3 py-1 rounded bg-green-600 text-white hover:bg-green-700">Approve</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}





