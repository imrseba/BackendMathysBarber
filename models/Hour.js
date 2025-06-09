const mongoose = require("mongoose");

const HourSchema = new mongoose.Schema({
    day_id: { type: String, required: true },
    time: { type: String, required: true },
    status: { type: String, enum: ["libre", "ocupada"], default: "libre" },
    barber_ids: {
        type: [String], 
        validate: {
            validator: function(value) {
                return value.length <= 3 && new Set(value).size === value.length;
            },
            message: "No puede haber más de 3 barberos o barberos duplicados"
        },
        default: []
    }
});

module.exports = mongoose.model("Hour", HourSchema);

