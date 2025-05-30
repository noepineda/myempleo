// routes/pagos.js
const express = require('express');
const router = express.Router();
const mercadopago = require('mercadopago');

// Configura tu ACCESS TOKEN de Mercado Pago (no uses el de prueba en producción)
mercadopago.configure({
    access_token: 'APP_USR-6757277863483446-072520-f69172ad16fd90ac330b7b76b33fb324-365304205'
});

const { convertirUSDaARS } = require('./utils/exchange');

router.post('/crear-preferencia', async (req, res) => {
    try {
        const montoUSD = 4; // precio fijo en dólares
        const montoARS = await convertirUSDaARS(montoUSD);

        const preference = {
            items: [
                {
                    title: 'Publicación de Empleo',
                    unit_price: parseFloat(montoARS),
                    quantity: 1,
                    currency_id: 'ARS'
                }
            ],
            back_urls: {
                success: 'http://localhost:3000/pago-exitoso',
                failure: 'http://localhost:3000/pago-fallido',
                pending: 'http://localhost:3000/pago-pendiente'
            },
            auto_return: 'approved'
        };

        const response = await mercadopago.preferences.create(preference);
        res.redirect(response.body.init_point);
    } catch (err) {
        console.error('Error creando preferencia:', err);
        res.status(500).send('Error al generar el pago');
    }
});


module.exports = router;


// id de mercadopago
// 365304205