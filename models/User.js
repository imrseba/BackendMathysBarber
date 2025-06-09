const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema({
    name: String,
    email: { type: String, unique: true, required: true },
    phone: String,
    password: String, 
    role: { type: String, enum: ["user", "barber", "admin"], default: "user" }
}, { timestamps: true });

// Hashear contraseña antes de guardar
userSchema.pre("save", async function(next) {
    if (!this.isModified("password")) return next();
    this.password = await bcrypt.hash(this.password, 10);
    next();
});

module.exports = mongoose.model("User", userSchema);
