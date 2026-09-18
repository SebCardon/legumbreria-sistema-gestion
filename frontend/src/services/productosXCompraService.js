import axios from 'axios';
const API_URL = 'http://localhost:3000/api/productos-x-compra';

export const getProductosXCompra = async () => (await axios.get(API_URL)).data;
export const createProductoXCompra = async (data) => (await axios.post(API_URL, data)).data;
export const deleteProductoXCompra = async (id) => (await axios.delete(`${API_URL}/${id}`)).data;
export const updateProductoXCompra = async (id, data) => (await axios.put(`${API_URL}/${id}`, data)).data;