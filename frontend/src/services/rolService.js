import axios from 'axios';
const API_URL = 'http://localhost:3000/api/roles';

export const getRoles = async () => (await axios.get(API_URL)).data;
export const createRol = async (data) => (await axios.post(API_URL, data)).data;
export const updateRol = async (id, data) => (await axios.put(`${API_URL}/${id}`, data)).data;
export const deleteRol = async (id) => (await axios.delete(`${API_URL}/${id}`)).data;