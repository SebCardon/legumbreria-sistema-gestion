import axios from 'axios';
const API_URL = 'http://localhost:3000/api/facturas';

export const getFacturas = async () => (await axios.get(API_URL)).data;
export const createFactura = async (data) => (await axios.post(API_URL, data)).data;
export const updateFactura = async (id, data) => (await axios.put(`${API_URL}/${id}`, data)).data;
export const desactivarFactura = async (id) => (await axios.patch(`${API_URL}/${id}/desactivar`)).data;