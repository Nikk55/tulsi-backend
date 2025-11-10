import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";
import { encryptText, decryptText } from "../utils/crypto.js";

const prisma = new PrismaClient();

const userSelect = {
  id: true,
  username: true,
  email: true,
  firstName: true,
  lastName: true,
  role: true,
  createdAt: true,
};

// ✅ CREATE salesperson
export const createSalesperson = async (req, res) => {
  try {
    const { firstName, lastName, username, email, password, confirmPassword } = req.body;

    if (!firstName || !lastName || !username || !email || !password || !confirmPassword)
      return res.status(400).json({ error: "All fields are required." });

    if (password !== confirmPassword)
      return res.status(400).json({ error: "Passwords do not match." });

    const exists = await prisma.user.findFirst({
      where: { OR: [{ username }, { email }] }
    });
    if (exists) return res.status(400).json({ error: "Username or Email already exists." });

    const hashed = await hash(password, 10);
    const encrypted = encryptText(password);

    const newUser = await prisma.user.create({
      data: {
        firstName,
        lastName,
        username,
        email,
        password: hashed,
        encryptedPassword: encrypted,
        role: "SALESPERSON"
      },
      select: userSelect,
    });

    res.status(201).json({
      message: "Salesperson registered successfully!",
      user: newUser,
      plainPassword: password
    });
  } catch (err) {
    console.error("Registration error:", err);
    res.status(500).json({ error: "Internal server error." });
  }
};

// ✅ GET all salespersons (Plain Password Returned)
export const getSalespersons = async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      where: { role: "SALESPERSON" },
      orderBy: { id: "asc" },
      select: { ...userSelect, encryptedPassword: true }
    });

    const formatted = users.map(u => ({
      ...u,
      plainPassword: decryptText(u.encryptedPassword)
    }));

    res.json({ users: formatted });
  } catch (err) {
    console.error("Fetch error:", err);
    res.status(500).json({ error: "Internal server error." });
  }
};

// ✅ GET by ID
export const getSalespersonById = async (req, res) => {
  try {
    const id = Number(req.params.id);

    const u = await prisma.user.findUnique({
      where: { id },
      select: { ...userSelect, encryptedPassword: true }
    });

    if (!u) return res.status(404).json({ error: "User not found" });
    if (u.role !== "SALESPERSON") return res.status(400).json({ error: "Not a salesperson" });

    res.json({
      user: {
        ...u,
        plainPassword: decryptText(u.encryptedPassword),
      }
    });
  } catch (err) {
    console.error("Fetch by ID error:", err);
    res.status(500).json({ error: "Internal server error." });
  }
};

// ✅ UPDATE
export const updateSalesperson = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { firstName, lastName, username, email, password, confirmPassword } = req.body;

    const existing = await prisma.user.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ error: "User not found" });

    if (password && password !== confirmPassword)
      return res.status(400).json({ error: "Passwords do not match" });

    const data = { firstName, lastName, username, email };

    if (password) {
      data.password = await hash(password, 10);
      data.encryptedPassword = encryptText(password);
    }

    const updated = await prisma.user.update({
      where: { id },
      data,
      select: userSelect,
    });

    res.json({
      message: "Updated successfully",
      user: updated,
      plainPassword: password || undefined
    });
  } catch (err) {
    console.error("Update error:", err);
    res.status(500).json({ error: "Internal server error." });
  }
};

// ✅ DELETE
export const deleteSalesperson = async (req, res) => {
  try {
    const id = Number(req.params.id);

    const exists = await prisma.user.findUnique({ where: { id }});
    if (!exists) return res.status(404).json({ error: "User not found" });

    await prisma.user.delete({ where: { id }});
    res.json({ message: "Deleted successfully" });
  } catch (err) {
    console.error("Delete error:", err);
    res.status(500).json({ error: "Internal server error." });
  }
};
