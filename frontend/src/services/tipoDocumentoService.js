import axios from 'axios';
import { API_BASE_URL } from './apiConfig';

const API_URL = `${API_BASE_URL}/tipos-documento`;

export const getTiposDocumento = async () => (await axios.get(API_URL)).data;
export const createTipoDocumento = async (data) => (await axios.post(API_URL, data)).data;
export const updateTipoDocumento = async (id, data) => (await axios.put(`${API_URL}/${id}`, data)).data;
export const deleteTipoDocumento = async (id) => (await axios.delete(`${API_URL}/${id}`)).data;