import axios from 'axios';
const API_URL = 'http://localhost:3000/api/presentaciones';

export const getPresentaciones = async () => (await axios.get(API_URL)).data;
export const createPresentacion = async (data) => (await axios.post(API_URL, data)).data;
export const updatePresentacion = async (id, data) => (await axios.put(`${API_URL}/${id}`, data)).data;
export const deletePresentacion = async (id) => (await axios.delete(`${API_URL}/${id}`)).data;