import axios from 'axios';
import { API_BASE_URL } from './apiConfig';

const API_URL = `${API_BASE_URL}/abonos`;

export const getAbonos = async () => (await axios.get(API_URL)).data;
export const getAbonosByFactura = async (idFactura) => (await axios.get(`${API_URL}/factura/${idFactura}`)).data;
export const getResumenFactura = async (idFactura) => (await axios.get(`${API_URL}/factura/${idFactura}/resumen`)).data;
export const createAbono = async (data) => (await axios.post(API_URL, data)).data;
export const aplicarSaldoAFavor = async (data) => (await axios.post(`${API_URL}/aplicar-saldo`, data)).data;