import axios from 'axios';
import { API_BASE_URL } from './apiConfig';

const API_URL = `${API_BASE_URL}/proveedores`;

export const getProveedores = async () => (await axios.get(API_URL)).data;
export const createProveedor = async (data) => (await axios.post(API_URL, data)).data;
export const updateProveedor = async (id, data) => (await axios.put(`${API_URL}/${id}`, data)).data;
export const deleteProveedor = async (id) => (await axios.delete(`${API_URL}/${id}`)).data;