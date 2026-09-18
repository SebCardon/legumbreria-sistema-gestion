import axios from 'axios';
const API_URL = 'http://localhost:3000/api/estados';

export const getEstados = async () => (await axios.get(API_URL)).data;
export const createEstado = async (data) => (await axios.post(API_URL, data)).data;
export const updateEstado = async (id, data) => (await axios.put(`${API_URL}/${id}`, data)).data;
export const deleteEstado = async (id) => (await axios.delete(`${API_URL}/${id}`)).data;