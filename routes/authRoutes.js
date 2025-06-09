const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

const router = express.Router();

// 📌 Registro de usuarios y barberos
router.post("/register", async (req, res) => {
    try {
        const { name, email, phone, password, role } = req.body;
        const user = new User({ name, email, phone, password, role });
        await user.save();
        res.status(201).json({ message: "Usuario registrado exitosamente" });
    } catch (error) {
        res.status(500).json({ message: "Error al registrar usuario" });
    }
});

// 📌 Inicio de sesión
router.post("/login", async (req, res) => {
    const { email, password } = req.body;

    try {
        let user = await User.findOne({ email });
        if (!user) return res.status(400).json({ message: "Usuario no encontrado" });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ message: "Contraseña incorrecta" });

        const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: "1h" });

        res.json({ token, role: user.role, name: user.name });
    } catch (error) {
        res.status(500).json({ message: "Error en el servidor" });
    }
});

module.exports = router;
