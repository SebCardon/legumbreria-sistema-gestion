import axios from 'axios';
import { API_BASE_URL } from './apiConfig';

const API_URL = `${API_BASE_URL}/productos`;

export const getProductos = async () => {
    const response = await axios.get(API_URL);
    return response.data;
};

export const getProductoById = async (id) => {
    const response = await axios.get(`${API_URL}/${id}`);
    return response.data;
};

export const createProducto = async (producto) => {
    const response = await axios.post(API_URL, producto);
    return response.data;
};

export const updateProducto = async (id, producto) => {
    const response = await axios.put(`${API_URL}/${id}`, producto);
    return response.data;
};

export const desactivarProducto = async (id) => {
    const response = await axios.patch(`${API_URL}/${id}/desactivar`);
    return response.data;
};