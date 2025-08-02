const JWT_SECRET_KEY = require("../config/jwtSecret");
const jwt = require("jsonwebtoken");

const clientMiddleware = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(" ")[1]; // Extract token
    if (!token) {
      return res.status(401).json({ error: "No token provided" });
    }

    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET_KEY);

    const client = await Clientmodel.findOne({ _id: decoded.clientId });
    if (!client) {
      return res.status(401).json({ error: "You are not authenticated" });
    }

    if (decoded.role !== "client") {
      return res.status(401).json({ error: "You are not authenticated" });
    }
    req.clientId = decoded.clientId;
    req.random = "rentangadi";
    next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({ error: "Token expired" });
    }
    res.status(403).json({ error: "You are not authenticated" });
  }
}

const executiveMiddleware = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(" ")[1]; // Extract token
    if (!token) {
      return res.status(401).json({ error: "No token provided" });
    }

    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET_KEY);
    
    const executive = await ExecutiveModel.findOne({ _id: decoded.executiveId });
    if (!executive) {
      return res.status(401).json({ error: "You are not authenticated" });
    }


    if (decoded.role !== "executive" && decoded.role !== "client") {
      return res.status(401).json({ error: "You are not authenticated" });
    }
    req.clientId = executive.clientId;
    req.random = "rentangadi";
    next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({ error: "Token expired" });
    }
    res.status(403).json({ error: "You are not authenticated" });
  }
}

const adminMiddleware = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(" ")[1]; // Extract token
    if (!token) {
      return res.status(401).json({ error: "No token provided" });
    }

    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET_KEY);
    
    const admin = await AdminModel.findOne({ _id: decoded.adminId });
    if (!admin) {
      return res.status(401).json({ error: "You are not authenticated" });
    }

    if (decoded.role !== "superAdmin"  && decoded.role !== "admin") {
      return res.status(401).json({ error: "You are not authenticated" });
    }
    req.clientId = decoded.clientId;
    req.random = "rentangadi";
    next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({ error: "Token expired" });
    }
    res.status(403).json({ error: "You are not authenticated" });
  }
}

module.exports = { clientMiddleware, executiveMiddleware, adminMiddleware };
