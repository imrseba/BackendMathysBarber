const express = require("express");
const { MercadoPagoConfig, Preference } = require("mercadopago");

const router = express.Router();

const client = new MercadoPagoConfig({
  accessToken: process.env.MP_ACCESS_TOKEN,
});

const preference = new Preference(client);

router.post("/create-preference", async (req, res) => {
  try {
    const { date, hour, cutType, extras, barberName } = req.body;

    const preferenceData = {
      body: {
        items: [
          {
            title: `Cita con ${barberName} - ${cutType}`,
            description: `Extras: ${extras.join(", ")}`,
            quantity: 1,
            unit_price: 3000,
          },
        ],
        back_urls: {
          success: "https://backendmathysbarber.onrender.com/appointments?status=success",
          failure: "https://backendmathysbarber.onrender.com/appointments?status=failure",
          pending: "https://backendmathysbarber.onrender.com/appointments?status=pending",
        },
        auto_return: "approved",
      },
    };

    const response = await preference.create(preferenceData);
    res.status(200).json({ id: response.body.id });
  } catch (error) {
    console.error("Error al crear preferencia:", error);
    res.status(500).json({ error: "Error creando la preferencia" });
  }
});

module.exports = router;
