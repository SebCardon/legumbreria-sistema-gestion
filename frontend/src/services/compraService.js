import axios from 'axios';
import { API_BASE_URL } from './apiConfig';

const API_URL = `${API_BASE_URL}/compras`;

export const getCompras = async () => (await axios.get(API_URL)).data;
export const getComprasCanceladas = async () => (await axios.get(`${API_URL}/canceladas`)).data;
export const createCompra = async (data) => (await axios.post(API_URL, data)).data;
export const updateCompra = async (id, data) => (await axios.put(`${API_URL}/${id}`, data)).data;
export const desactivarCompra = async (id) => (await axios.patch(`${API_URL}/${id}/desactivar`)).data;
export const reactivarCompra = async (id) => (await axios.patch(`${API_URL}/${id}/reactivar`)).data;