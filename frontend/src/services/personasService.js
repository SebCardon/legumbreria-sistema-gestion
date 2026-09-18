import axios from 'axios';
import { API_BASE_URL } from './apiConfig';

const API_URL = `${API_BASE_URL}/personas`;

export const getPersonas = async () => {
    const response = await axios.get(API_URL);
    return response.data;
};

export const getPersonaById = async (id) => {
    const response = await axios.get(`${API_URL}/${id}`);
    return response.data;
};

export const createPersona = async (persona) => {
    const response = await axios.post(API_URL, persona);
    return response.data;
};

export const updatePersona = async (id, persona) => {
    const response = await axios.put(`${API_URL}/${id}`, persona);
    return response.data;
};

export const desactivarPersona = async (id) => {
    const response = await axios.patch(`${API_URL}/${id}/desactivar`);
    return response.data;
};