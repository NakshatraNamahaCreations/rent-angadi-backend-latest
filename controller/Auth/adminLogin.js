const AdminModel = require("../../model/Auth/adminLogin");
const JWT_SECRET_KEY = require("../../config/jwtSecret");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");

async function adminSignUp(req, res) {
  try {
    const { email, password } = req.body;
    console.log("email pwd: ", email, password)

    const admin = await AdminModel.findOne({ email });
    console.log(`admin: `, admin);

    if (admin) {
      return res.status(400).json({ error: "Email already exists" });
    }

    const newAdmin = await AdminModel.create({
      email,
      password: await bcrypt.hash(password, 10),
    });

    const token = await jwt.sign({ email }, JWT_SECRET_KEY, {
      expiresIn: "1h",
    });
    res.status(201).json({ success: "Admin signed up successfully", token });
  } catch (error) {
    res.status(500).json({ error: error });
  }
}

async function adminLogin(req, res) {
  try {
    const { email, password } = req.body;

    // Check if the user exists
    const admin = await AdminModel.findOne({ email });
    console.log(`admin: `, admin.toObject());
    if (!admin) {
      return res.status(400).json({ error: "Invalid email or password" });
    }

    // Validate password
    const isPasswordValid = await bcrypt.compare(password, admin.password);
    if (!isPasswordValid) {
      return res.status(400).json({ error: "Invalid email or password" });
    }

    // Generate a token with an expiry of 1 hour
    const token = jwt.sign({ email }, JWT_SECRET_KEY, { expiresIn: "1h" });

    res.status(200).json({ success: "Logged in successfully", token, roles: admin.roles });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

async function adminsList(req, res) {
  try {
    const admins = await AdminModel.find().select("-password"); // Exclude password
    res.status(200).json({ admins });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

async function getAdminPermission(req, res) {
  try {
    const { id } = req;
    console.log(`getAdminPermission id: `, id);

    const admin = await AdminModel.findById(id);
    console.log(`getAdminPermission admin: `, admin);
    res.status(200).json({ admin });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

async function getAdminPermissionForSuperAdmin(req, res) {
  try {
    const { id } = req.params;
    const admin = await AdminModel.findById(id);
    console.log(`getAdminPermissionForSuperAdmin admin: `, admin);
    res.status(200).json({ admin });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

async function updateAdminPermission(req, res) {
  try {
    const { id } = req.params;
    const { roles } = req.body;
    const admin = await AdminModel.findByIdAndUpdate(id, { roles }, { new: true });
    console.log(`admin: `, admin.toJSON());
    res.status(200).json({ admin });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
module.exports = { adminSignUp, adminLogin, adminsList, updateAdminPermission, getAdminPermission, getAdminPermissionForSuperAdmin };
