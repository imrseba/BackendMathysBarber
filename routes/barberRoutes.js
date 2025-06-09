const express = require('express');
const router = express.Router();
const Barber = require('../models/Barber');
const Day = require('../models/Day');
const Hour = require('../models/Hour');
const mongoose = require('mongoose');


router.get('/', async (req, res) => {
  try {
    const barbers = await Barber.find().populate('user_id', 'name email');
    res.json(barbers);
  } catch (err) {
    console.error('Error al obtener barberos:', err);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const barber = await Barber.findById(req.params.id).populate('user_id', 'name email');
    if (!barber) return res.status(404).json({ message: 'Barbero no encontrado' });
    res.json(barber);
  } catch (err) {
    console.error('Error al obtener barbero:', err);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

router.post('/:barberId/cancel-day', async (req, res) => {
  const { barberId } = req.params;
  const { date } = req.body;

  if (!barberId || !date) {
    return res.status(400).json({ message: 'Faltan datos obligatorios (barberId y date)' });
  }

  try {
    // Make sure `date` is being used as the `day_id` in your Day model
    const day = await Day.findOne({ day_id: date });

    if (!day) {
      return res.status(404).json({ message: 'Día no encontrado' });
    }

    // Check if the barber is already in the cancelled list
    if (day.day_cancel_id.includes(barberId)) {
      return res.status(400).json({ message: 'Este barbero ya tiene cancelado este día' });
    }

    // Ensure no more than 3 barbers are cancelled for this day
    if (day.day_cancel_id.length >= 3) {
      return res.status(400).json({ message: 'Ya hay 3 barberos cancelados para este día' });
    }

    // Add the barber to the cancelled list
    day.day_cancel_id.push(barberId);

    await day.save();

    res.status(200).json({ message: `Día cancelado para el barbero ${barberId}` });
  } catch (error) {
    console.error('Error al cancelar día:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});


router.get('/:barberId/appointments-available', async (req, res) => {
  const { barberId } = req.params;

  try {
    if (!mongoose.Types.ObjectId.isValid(barberId)) {
      return res.status(400).json({ message: 'ID de barbero no válido' });
    }

    const days = await Day.find().populate({
      path: 'hours',
      model: 'Hour',
    });

    const availableHours = {};

    days.forEach((day) => {
      if (day.day_cancel_id.includes(barberId)) {
        return;
      }

      const availableTimes = [];

      day.hours.forEach((hour) => {
        if (!hour.barber_ids.includes(barberId)) {
          availableTimes.push(hour.time);
        }
      });

      if (availableTimes.length > 0) {
        availableHours[day.day_id] = availableTimes;
      }
    });

    if (Object.keys(availableHours).length === 0) {
      return res.status(404).json({ message: 'No hay horas disponibles para este barbero' });
    }

    res.json(availableHours);
  } catch (err) {
    console.error('Error al obtener horas disponibles:', err);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});



module.exports = router;

