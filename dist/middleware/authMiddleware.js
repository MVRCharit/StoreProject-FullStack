import jwt from "jsonwebtoken";
export const authMiddleware = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).json({ message: "No token" });
    }
    const token = authHeader.split(" ")[1];
    try {
        const decoded = jwt.verify(token, "secret_key");
        // attach user info
        req.user = decoded;
        next();
    }
    catch {
        return res.status(401).json({ message: "Invalid token" });
    }
};
