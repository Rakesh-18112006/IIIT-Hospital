import User from "../models/User.js";
import { generateToken } from "../middleware/auth.js";

// @desc    Register student with Google (Firebase)
// @route   POST /api/auth/google
// @access  Public
export const googleAuth = async (req, res) => {
  try {
    const { email, name, googleId } = req.body;

    if (!email || !name || !googleId) {
      return res
        .status(400)
        .json({ message: "Please provide all required fields" });
    }

    // Check if user exists
    let user = await User.findOne({ $or: [{ email }, { googleId }] });

    if (user) {
      // User exists, log them in
      if (user.role !== "student") {
        return res
          .status(400)
          .json({ message: "This email is registered with a different role" });
      }

      const token = generateToken(user._id);
      return res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        studentId: user.studentId,
        branch: user.branch,
        year: user.year,
        hostelBlock: user.hostelBlock,
        address: user.address,
        phone: user.phone,
        profileCompleted: user.profileCompleted,
        token,
      });
    }

    // Create new student user (profile not completed yet)
    user = await User.create({
      name,
      email,
      googleId,
      role: "student",
      profileCompleted: false,
    });

    const token = generateToken(user._id);

    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      profileCompleted: false,
      isNewUser: true,
      token,
    });
  } catch (error) {
    console.error("Google auth error:", error);
    res.status(500).json({ message: "Server error during authentication" });
  }
};

// @desc    Complete student profile
// @route   PUT /api/auth/complete-profile
// @access  Private (Student only)
export const completeProfile = async (req, res) => {
  try {
    const { studentId, branch, year, hostelBlock, address, phone } = req.body;

    if (!studentId || !branch || !year || !hostelBlock || !address) {
      return res
        .status(400)
        .json({ message: "Please provide all required fields" });
    }

    // Check if studentId is already taken
    const existingStudent = await User.findOne({
      studentId,
      _id: { $ne: req.user._id },
    });

    if (existingStudent) {
      return res.status(400).json({ message: "Student ID already registered" });
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      {
        studentId,
        branch,
        year: parseInt(year),
        hostelBlock,
        address,
        phone,
        profileCompleted: true,
      },
      { new: true }
    ).select("-password");

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      studentId: user.studentId,
      branch: user.branch,
      year: user.year,
      hostelBlock: user.hostelBlock,
      address: user.address,
      phone: user.phone,
      profileCompleted: user.profileCompleted,
    });
  } catch (error) {
    console.error("Complete profile error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// @desc    Update student profile
// @route   PUT /api/auth/profile
// @access  Private (Student only)
export const updateProfile = async (req, res) => {
  try {
    const { name, studentId, branch, year, hostelBlock, address, phone } =
      req.body;

    // Check if studentId is already taken by another user
    if (studentId) {
      const existingStudent = await User.findOne({
        studentId,
        _id: { $ne: req.user._id },
      });

      if (existingStudent) {
        return res
          .status(400)
          .json({ message: "Student ID already registered" });
      }
    }

    const updateData = {};
    if (name) updateData.name = name;
    if (studentId) updateData.studentId = studentId;
    if (branch) updateData.branch = branch;
    if (year) updateData.year = parseInt(year);
    if (hostelBlock) updateData.hostelBlock = hostelBlock;
    if (address) updateData.address = address;
    if (phone !== undefined) updateData.phone = phone;

    const user = await User.findByIdAndUpdate(req.user._id, updateData, {
      new: true,
    }).select("-password");

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      studentId: user.studentId,
      branch: user.branch,
      year: user.year,
      hostelBlock: user.hostelBlock,
      address: user.address,
      phone: user.phone,
      profileCompleted: user.profileCompleted,
    });
  } catch (error) {
    console.error("Update profile error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// @desc    Get student profile
// @route   GET /api/auth/profile
// @access  Private
export const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("-password");
    res.json(user);
  } catch (error) {
    console.error("Get profile error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// @desc    Delete student account
// @route   DELETE /api/auth/profile
// @access  Private (Student only)
export const deleteProfile = async (req, res) => {
  try {
    await User.findByIdAndDelete(req.user._id);
    res.json({ message: "Account deleted successfully" });
  } catch (error) {
    console.error("Delete profile error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// @desc    Login staff (Doctor, Hospital Admin, Mess Admin)
// @route   POST /api/auth/login
// @access  Public
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Please provide email and password" });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    if (user.role === "student") {
      return res
        .status(400)
        .json({ message: "Students must login with Google" });
    }

    const isMatch = await user.comparePassword(password);

    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = generateToken(user._id);

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      token,
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Server error during login" });
  }
};

// @desc    Register staff (Doctor, Hospital Admin, Mess Admin)
// @route   POST /api/auth/register
// @access  Public (in production, this should be admin-only)
export const registerStaff = async (req, res) => {
  try {
    const { name, email, password, role, department, phone } = req.body;

    if (!name || !email || !password || !role) {
      return res
        .status(400)
        .json({ message: "Please provide all required fields" });
    }

    if (!["doctor", "hospital_admin", "mess_admin"].includes(role)) {
      return res.status(400).json({ message: "Invalid role" });
    }

    const userExists = await User.findOne({ email });

    if (userExists) {
      return res.status(400).json({ message: "User already exists" });
    }

    const user = await User.create({
      name,
      email,
      password,
      role,
      department,
      phone,
    });

    const token = generateToken(user._id);

    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      token,
    });
  } catch (error) {
    console.error("Register error:", error);
    res.status(500).json({ message: "Server error during registration" });
  }
};

// @desc    Get current user profile
// @route   GET /api/auth/me
// @access  Private
export const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("-password");
    res.json(user);
  } catch (error) {
    console.error("Get me error:", error);
    res.status(500).json({ message: "Server error" });
  }
};
