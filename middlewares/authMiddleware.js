const jwt = require("jsonwebtoken");

const verifyToken = (req, res, next) => {
    // Acceder correctamente al encabezado 'Authorization'
    const token = req.headers['authorization'];
    if (!token) return res.status(401).json({ message: "Acceso denegado. Token requerido." });

    try {
        // Extraer el token del encabezado 'Bearer <token>'
        const decoded = jwt.verify(token.split(" ")[1], process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        res.status(400).json({ message: "Token inválido." });
    }
};

const checkRole = (roles) => (req, res, next) => {
    if (!roles.includes(req.user.role)) {
        return res.status(403).json({ message: "No tienes permisos." });
    }
    next();
};

module.exports = { verifyToken, checkRole };
