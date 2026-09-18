import axios from 'axios';
import { API_BASE_URL } from './apiConfig';

const API_URL = `${API_BASE_URL}/estados`;

export const getEstados = async () => (await axios.get(API_URL)).data;
export const createEstado = async (data) => (await axios.post(API_URL, data)).data;
export const updateEstado = async (id, data) => (await axios.put(`${API_URL}/${id}`, data)).data;
export const deleteEstado = async (id) => (await axios.delete(`${API_URL}/${id}`)).data;