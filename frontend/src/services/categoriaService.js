import axios from 'axios';
const API_URL = 'http://localhost:3000/api/categorias';

export const getCategorias = async () => (await axios.get(API_URL)).data;
export const createCategoria = async (data) => (await axios.post(API_URL, data)).data;
export const updateCategoria = async (id, data) => (await axios.put(`${API_URL}/${id}`, data)).data;
export const deleteCategoria = async (id) => (await axios.delete(`${API_URL}/${id}`)).data;