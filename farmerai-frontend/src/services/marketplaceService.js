import apiClient from './apiClient';

const marketplaceService = {
  // Products
  getProducts: async (params = {}) => {
    const { data } = await apiClient.get('/marketplace/products', { params });
    return data?.data;
  },
  getProductById: async (id) => {
    const { data } = await apiClient.get(`/marketplace/products/${id}`);
    return data?.data;
  },
  getFeaturedProducts: async (limit = 10) => {
    const { data } = await apiClient.get('/marketplace/products/featured', { params: { limit } });
    return data?.data;
  },
  getCategories: async () => {
    const { data } = await apiClient.get('/marketplace/products/categories');
    return data?.data;
  },

  // Farmer listings
  getFarmerProducts: async (farmerId, params = {}) => {
    const { data } = await apiClient.get(`/marketplace/farmers/${farmerId}/products`, { params });
    return data?.data;
  },

  // Cart
  getCart: async () => {
    const { data } = await apiClient.get('/marketplace/cart');
    return data?.data;
  },
  addToCart: async ({ productId, quantity = 1, notes = '' }) => {
    const { data } = await apiClient.post('/marketplace/cart/add', { productId, quantity, notes });
    return data?.data;
  },
  updateCartItem: async (productId, quantity) => {
    const { data } = await apiClient.put(`/marketplace/cart/items/${productId}`, { quantity });
    return data?.data;
  },
  removeCartItem: async (productId) => {
    const { data } = await apiClient.delete(`/marketplace/cart/items/${productId}`);
    return data?.data;
  },
  clearCart: async () => {
    const { data } = await apiClient.delete('/marketplace/cart/clear');
    return data?.data;
  },
  getCartSummary: async () => {
    const { data } = await apiClient.get('/marketplace/cart/summary');
    return data?.data;
  },

  // Orders (no payment integration)
  createOrder: async (payload) => {
    const { data } = await apiClient.post('/marketplace/orders', payload);
    return data?.data;
  },
  getOrders: async (params = {}) => {
    const { data } = await apiClient.get('/marketplace/orders', { params });
    return data?.data;
  },
  getOrderById: async (id) => {
    const { data } = await apiClient.get(`/marketplace/orders/${id}`);
    return data?.data;
  },
  updateOrderStatus: async (id, status) => {
    const { data } = await apiClient.put(`/marketplace/orders/${id}/status`, { status });
    return data?.data;
  },
  cancelOrder: async (id, reason = '') => {
    const { data } = await apiClient.post(`/marketplace/orders/${id}/cancel`, { reason });
    return data?.data;
  },
  addOrderMessage: async (id, message) => {
    const { data } = await apiClient.post(`/marketplace/orders/${id}/messages`, { message });
    return data?.data;
  }
};

export default marketplaceService;
