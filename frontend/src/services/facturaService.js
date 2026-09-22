import axios from 'axios';
import { API_BASE_URL } from './apiConfig';

const API_URL = `${API_BASE_URL}/facturas`;

export const getFacturas = async () => (await axios.get(API_URL)).data;
export const createFactura = async (data) => (await axios.post(API_URL, data)).data;
export const updateFactura = async (id, data) => (await axios.put(`${API_URL}/${id}`, data)).data;
export const desactivarFactura = async (id) => (await axios.patch(`${API_URL}/${id}/desactivar`)).data;
export const getFacturasCanceladas = async () => (await axios.get(`${API_URL}/canceladas`)).data;