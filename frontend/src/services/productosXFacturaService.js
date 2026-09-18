import axios from 'axios';
const API_URL = 'http://localhost:3000/api/productos-x-factura';

export const getProductosXFactura = async () => (await axios.get(API_URL)).data;
export const createProductoXFactura = async (data) => (await axios.post(API_URL, data)).data;
export const deleteProductoXFactura = async (id) => (await axios.delete(`${API_URL}/${id}`)).data;
export const updateProductoXFactura = async (id, data) => (await axios.put(`${API_URL}/${id}`, data)).data;