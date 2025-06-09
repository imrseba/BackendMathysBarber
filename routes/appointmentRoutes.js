const express = require("express");
const Appointment = require("../models/Appointment");
const { verifyToken, checkRole } = require("../middlewares/authMiddleware");
const Hour = require("../models/Hour");
const router = express.Router();
const Day = require("../models/Day");

// 📌 Agendar una cita
router.post("/create", verifyToken, async (req, res) => {
    const { barber_id, date, time } = req.body;

    try {
        // Verificar que la cita no esté ocupada
        const exists = await Appointment.findOne({ barber_id, date, time });
        if (exists) return res.status(400).json({ message: "Esa hora ya está ocupada" });

        // 🔹 Marcar la hora como "ocupada" en la colección Hour
        await Hour.findOneAndUpdate(
            { day_id: date, time },  // Buscar por la fecha y hora
            { status: "ocupada" }    // Cambiar el estado a ocupada
        );

        // Crear la nueva cita
        const appointment = new Appointment({
            user_id: req.user.id,
            barber_id,
            date,
            time
        });

        await appointment.save();
        
        res.status(201).json({ message: "Cita agendada correctamente" });
    } catch (error) {
        res.status(500).json({ message: "Error al agendar cita", error });
    }
});

// 📌 Obtener citas de un usuario
router.get("/user", verifyToken, async (req, res) => {
    try {
        const appointments = await Appointment.find({ user_id: req.user.id })
        .populate("barber_id", "name phone")
        .populate("user_id", "name");
        res.json(appointments);
    } catch (error) {
        res.status(500).json({ message: "Error al obtener citas" });
    }
});

// 📌 Obtener citas de un barbero
router.get("/barber", verifyToken, checkRole(["barber", "admin"]), async (req, res) => {
    try {
        const appointments = await Appointment.find({ barber_id: req.user.id })
        .populate("user_id", "name phone")
        .populate("barber_id", "name");
        res.json(appointments);
    } catch (error) {
        res.status(500).json({ message: "Error al obtener citas" });
    }
});

// 📌 Ruta para liberar una cita
router.delete("/release/:barber_id/:date/:time", verifyToken, checkRole(["barber", "admin"]), async (req, res) => {
    const { barber_id, date, time } = req.params;

    try {
        // Buscar la cita que corresponde a la barbería, fecha y hora
        const appointment = await Appointment.findOne({ barber_id, date, time });
        if (!appointment) {
            return res.status(404).json({ message: "No se encontró una cita en esa hora" });
        }

        // Eliminar la cita utilizando deleteOne
        await Appointment.deleteOne({ barber_id, date, time });

        // Liberar la hora (marcar como 'libre')
        const updatedHour = await Hour.findOneAndUpdate(
            { day_id: date, time },  // Buscar por fecha y hora
            { status: "libre" },     // Cambiar el estado a 'libre'
            { new: true }            // Retornar el documento actualizado
        );

        res.status(200).json({ message: "Cita liberada correctamente", hour: updatedHour });
    } catch (error) {
        res.status(500).json({ message: "Error al liberar la cita", error });
    }
});

router.get("/available-days", async (req, res) => {
    try {
        // Realizamos la agregación para obtener los días con horas libres
        const availableDays = await Day.aggregate([
            {
                $lookup: {
                    from: "hours",           // Nombre de la colección de horas
                    localField: "day_id",    // Campo que relaciona con 'day_id'
                    foreignField: "day_id",  // Campo en la colección 'hours' que corresponde
                    as: "hours"              // Alias para las horas asociadas a un día
                }
            },
            {
                $unwind: "$hours"             // Descompone el arreglo de horas
            },
            {
                $match: {
                    "hours.status": "libre"  // Filtramos solo las horas libres
                }
            },
            {
                $group: {
                    _id: "$day_id",           // Agrupamos por 'day_id' (día)
                    availableHours: {
                        $push: "$hours"      // Empujamos las horas disponibles al arreglo
                    }
                }
            },
            {
                $project: {
                    _id: 0,
                    day_id: "$_id",            // Mostramos el 'day_id'
                    availableHours: 1          // Mostramos solo las horas disponibles
                }
            }
        ]);

        if (availableDays.length === 0) {
            return res.status(404).json({ message: "No hay días con horas disponibles" });
        }

        res.status(200).json(availableDays);

    } catch (error) {
        console.error("Error al obtener los días disponibles:", error);
        res.status(500).json({ message: "Error al obtener los días con horas disponibles", error });
    }
});

// 📌 Ruta para cancelar una cita
router.put("/cancel/:barber_id/:date/:time", verifyToken, checkRole(["barber", "admin", "user"]), async (req, res) => {
    const { barber_id, date, time } = req.params;

    try {
        // Buscar la cita que corresponde a la barbería, fecha y hora
        const appointment = await Appointment.findOne({ barber_id, date, time });
        if (!appointment) {
            return res.status(404).json({ message: "No se encontró una cita en esa hora" });
        }

        // Verificar si el usuario tiene permiso para cancelar
        if (req.user.id !== appointment.user_id.toString() && req.user.role !== "admin" && req.user.role !== "barber") {
            return res.status(403).json({ message: "No tienes permiso para cancelar esta cita" });
        }

        // Cambiar el estado de la cita a "cancelada"
        appointment.status = "cancelada";
        await appointment.save();

        // Liberar la hora (marcar como 'libre')
        await Hour.findOneAndUpdate(
            { day_id: date, time },  // Buscar por fecha y hora
            { status: "libre" },     // Cambiar el estado a 'libre'
            { new: true }            // Retornar el documento actualizado
        );

        res.status(200).json({ message: "Cita cancelada correctamente" });
    } catch (error) {
        res.status(500).json({ message: "Error al cancelar la cita", error });
    }
});

// 📌 Ruta para marcar una cita como completada
router.put("/complete/:barber_id/:date/:time", verifyToken, checkRole(["barber", "admin"]), async (req, res) => {
    const { barber_id, date, time } = req.params;

    try {
        // Buscar la cita que corresponde a la barbería, fecha y hora
        const appointment = await Appointment.findOne({ barber_id, date, time });
        if (!appointment) {
            return res.status(404).json({ message: "No se encontró una cita en esa hora" });
        }

        // Verificar que el usuario que intenta marcar la cita como completada sea el barbero o administrador
        if (req.user.id !== appointment.barber_id.toString() && req.user.role !== "admin") {
            return res.status(403).json({ message: "No tienes permiso para completar esta cita" });
        }

        // Cambiar el estado de la cita a "completada"
        appointment.status = "completada";
        await appointment.save();

        res.status(200).json({ message: "Cita marcada como completada" });
    } catch (error) {
        res.status(500).json({ message: "Error al completar la cita", error });
    }
});

module.exports = router;
