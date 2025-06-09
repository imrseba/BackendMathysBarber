const express = require("express");
const cron = require("node-cron");
const Day = require("../models/Day");
const Hour = require("../models/Hour");

const router = express.Router();

// 📌 Función para generar las horas de un día
const generateHours = async (day_id) => {
    const hoursList = [];
    for (let hour = 11; hour <= 20; hour++) {
        const formattedHour = `${hour}:00`;
        const newHour = new Hour({
            day_id,
            time: formattedHour,
            status: "libre"
        });
        await newHour.save();
        hoursList.push(newHour._id);
    }
    return hoursList;
};

// 📌 Función para obtener la última fecha de la base de datos
const getLastDateFromDB = async () => {
    try {
        const lastDay = await Day.findOne().sort({ day_id: -1 }).limit(1);  // Ordenar por day_id de forma descendente
        return lastDay ? new Date(lastDay.day_id) : null;  // Devolver la fecha o null si no hay datos
    } catch (error) {
        console.error("Error al obtener la última fecha de la base de datos", error);
        return null;
    }
};

// 📌 Función para generar la semana en base a la última fecha
const generateWeekBasedOnLastDate = async () => {
    try {
        const lastDate = await getLastDateFromDB();
        let startDate = lastDate ? new Date(lastDate) : new Date();  // Si no hay última fecha, usar la fecha actual

        // Asegúrate de que el inicio de la semana sea un lunes (ajustar si la fecha actual no es lunes)
        const dayOfWeek = startDate.getUTCDay(); // 0 (Domingo) - 6 (Sábado)
        if (dayOfWeek !== 1) {
            startDate.setUTCDate(startDate.getUTCDate() + ((1 - dayOfWeek + 7) % 7));  // Ajusta al próximo lunes
        }

        const weekDays = [];
        for (let i = 0; i < 6; i++) { // Lunes a Sábado (sin Domingo)
            const date = new Date(startDate);
            date.setUTCDate(startDate.getUTCDate() + i);
            const formattedDate = date.toISOString().split("T")[0]; // YYYY-MM-DD

            const existingDay = await Day.findOne({ day_id: formattedDate });
            if (!existingDay) {
                const newDay = new Day({ day_id: formattedDate });
                await newDay.save();

                newDay.hours = await generateHours(newDay.day_id); // Generar las horas para el día
                await newDay.save();

                weekDays.push(newDay);
            }
        }
        console.log("✅ Semana generada correctamente");
    } catch (error) {
        console.error("❌ Error al generar la semana:", error);
    }
};

// 📌 Generar semana automáticamente los lunes a la 01:00 AM
const generateWeek = async () => {
    try {
        const today = new Date();
        const dayOfWeek = today.getUTCDay(); // 0 (Domingo) - 6 (Sábado)

        // Solo generar si es lunes
        if (dayOfWeek !== 1) return;

        await generateWeekBasedOnLastDate();
    } catch (error) {
        console.error("❌ Error al generar la semana:", error);
    }
};

// 📌 Tarea programada para ejecutarse los lunes a la 01:00 AM
cron.schedule("0 1 * * 1", generateWeek);

// 📌 Ruta manual para generar la semana (solo los lunes)
// 📌 Ruta manual para generar la semana (IGNORA el día)
router.post("/generate-week", async (req, res) => {
    try {
        await generateWeekBasedOnLastDate(); // 👈 LLAMAR DIRECTO A LA FUNCIÓN
        res.status(201).json({ message: "Semana generada correctamente" });
    } catch (error) {
        console.error("❌ Error en la ruta /generate-week:", error);
        res.status(500).json({ message: "Error al generar la semana", error });
    }
});

router.get("/", async (req, res) => {
    try {
        const days = await Day.find().populate("hours");
        res.json(days);
    } catch (error) {
        res.status(500).json({ message: "Error al obtener los días", error });
    }
});

// 📌 Función para generar los próximos 8 días desde hoy
const generateWeek7 = async () => {
    try {
        const today = new Date();
        today.setUTCHours(0, 0, 0, 0); // Normalizar hora

        for (let i = 0; i < 8; i++) {
            const date = new Date(today);
            date.setUTCDate(today.getUTCDate() + i);
            const formattedDate = date.toISOString().split("T")[0]; // YYYY-MM-DD

            // Verificar si ya existe ese día
            const existingDay = await Day.findOne({ day_id: formattedDate });
            if (!existingDay) {
                const newDay = new Day({ day_id: formattedDate });
                await newDay.save();

                newDay.hours = await generateHours(newDay.day_id); // Generar horas
                await newDay.save();
                console.log(`✅ Día ${formattedDate} generado`);
            } else {
                console.log(`ℹ️ Día ${formattedDate} ya existe`);
            }
        }

        console.log("✅ Semana +1 generada correctamente desde hoy");
    } catch (error) {
        console.error("❌ Error al generar semana +1:", error);
    }
};

router.post("/generate-week7", async (req, res) => {
    try {
        await generateWeek7();
        res.status(201).json({ message: "Semana generada desde hoy + 7 días" });
    } catch (error) {
        console.error("❌ Error en la ruta /generate-week7:", error);
        res.status(500).json({ message: "Error al generar la semana desde hoy", error });
    }
});


module.exports = router;
