const jwt = require("jsonwebtoken");

const protect = (req, res, next) => {
    try {
        const token = req.cookies.token;

        if (!token) {
            return res.status(401).json({
                success: false,
                message: "Authentication required",
            });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        if (!decoded.id) {
            return res.status(401).json({
                success: false,
                message: "Invalid authentication token",
            });
        }

        req.user = {
            id: decoded.id,
        };



        next();
    } catch (error) {
        return res.status(401).json({
            success: false,
            message: "Invalid or expired session",
        });
    }
};

module.exports = { protect };