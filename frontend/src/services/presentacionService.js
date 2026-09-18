import axios from 'axios';
import { API_BASE_URL } from './apiConfig';

const API_URL = `${API_BASE_URL}/presentaciones`;

export const getPresentaciones = async () => (await axios.get(API_URL)).data;
export const createPresentacion = async (data) => (await axios.post(API_URL, data)).data;
export const updatePresentacion = async (id, data) => (await axios.put(`${API_URL}/${id}`, data)).data;
export const deletePresentacion = async (id) => (await axios.delete(`${API_URL}/${id}`)).data;