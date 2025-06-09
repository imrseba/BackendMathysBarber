const mongoose = require("mongoose");

const DaySchema = new mongoose.Schema({
    day_id: { type: String, unique: true, required: true },
    hours: [{ type: mongoose.Schema.Types.ObjectId, ref: "Hour" }],
    day_cancel_id: {
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

module.exports = mongoose.model("Day", DaySchema);

