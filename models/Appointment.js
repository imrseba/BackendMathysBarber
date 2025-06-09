const mongoose = require("mongoose");

const appointmentSchema = new mongoose.Schema({
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    barber_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    date: String, // Formato: "YYYY-MM-DD"
    time: String, // Formato: "HH:mm"
    status: { type: String, enum: ["pendiente", "completada", "cancelada"], default: "pendiente" }
}, { timestamps: true });

module.exports = mongoose.model("Appointment", appointmentSchema);
