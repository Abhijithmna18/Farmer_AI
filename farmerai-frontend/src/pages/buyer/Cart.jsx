import React, { useEffect, useState } from 'react';
import marketplaceService from '../../services/marketplaceService';

export default function Cart(){
  const [cart, setCart] = useState(null);
  const [summary, setSummary] = useState(null);

  const load = async () => {
    const data = await marketplaceService.getCart();
    setCart(data?.cart);
    setSummary(data?.summary);
  };

  useEffect(() => { load(); }, []);

  const checkout = async () => {
    // Minimal payload for order creation (no payment)
    const payload = {
      items: (cart?.items || []).map(it => ({ productId: it.product._id, quantity: it.quantity })),
      shippingAddress: {
        name: 'Buyer', phone: '0000000000', address: 'Address', city: 'City', state: 'State', pincode: '000000'
      },
      deliveryMethod: 'home_delivery',
      paymentMethod: 'cod',
      clearCart: true
    };
    const order = await marketplaceService.createOrder(payload);
    alert(`Order placed: ${order?.orderNumber || order?._id}`);
  };

  return (
    <div className="p-4">
      <h2 className="text-xl font-semibold mb-3">Your Cart</h2>
      {!cart ? 'Loading...' : (
        <>
          {(cart.items || []).map(it => (
            <div key={it.product._id} className="border rounded p-3 mb-2 flex items-center justify-between">
              <div>
                <div className="font-semibold">{it.product.name}</div>
                <div className="text-sm">Qty: {it.quantity}</div>
              </div>
              <button className="px-3 py-2 bg-red-600 text-white rounded" onClick={async ()=>{ await marketplaceService.removeCartItem(it.product._id); load(); }}>Remove</button>
            </div>
          ))}
          <div className="mt-4 p-3 border rounded bg-white dark:bg-slate-900">
            <div className="font-semibold">Summary</div>
            <div className="text-sm mt-1">Items: {summary?.itemCount || 0}</div>
            <div className="text-sm">Total: ₹{summary?.totalAmount || 0}</div>
            <button onClick={checkout} className="mt-3 px-4 py-2 bg-emerald-600 text-white rounded">Place Order</button>
          </div>
        </>
      )}
    </div>
  );
}
