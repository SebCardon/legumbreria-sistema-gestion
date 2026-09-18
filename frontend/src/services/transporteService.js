import axios from 'axios';
import { API_BASE_URL } from './apiConfig';

const API_URL = `${API_BASE_URL}/transportes`;

export const getTransportes = async () => (await axios.get(API_URL)).data;
export const createTransporte = async (data) => (await axios.post(API_URL, data)).data;
export const updateTransporte = async (id, data) => (await axios.put(`${API_URL}/${id}`, data)).data;
export const deleteTransporte = async (id) => (await axios.delete(`${API_URL}/${id}`)).data;