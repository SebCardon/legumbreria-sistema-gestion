import axios from 'axios';
import { API_BASE_URL } from './apiConfig';

const API_URL = `${API_BASE_URL}/compras`;

export const getCompras = async () => (await axios.get(API_URL)).data;
export const createCompra = async (data) => (await axios.post(API_URL, data)).data;
export const updateCompra = async (id, data) => (await axios.put(`${API_URL}/${id}`, data)).data;
export const deleteCompra = async (id) => (await axios.delete(`${API_URL}/${id}`)).data;