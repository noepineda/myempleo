// utils/exchange.js
const axios = require('axios');

const API_KEY = '54790b6c0ba664ef82c9979d'; // tu clave personal
const BASE_URL = `https://v6.exchangerate-api.com/v6/${API_KEY}`;

async function convertirUSDaARS(montoUSD) {
    try {
        const response = await axios.get(`${BASE_URL}/pair/USD/ARS`);
        const tasaCambio = response.data.conversion_rate;
        const montoARS = montoUSD * tasaCambio;
        return montoARS.toFixed(2);
    } catch (error) {
        console.error('Error al obtener el tipo de cambio:', error);
        throw new Error('No se pudo obtener el tipo de cambio');
    }
}

module.exports = { convertirUSDaARS };