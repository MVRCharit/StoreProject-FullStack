import db from "../database/db.js";
import { initDB } from "../database/db.js";
import { encryptPassword, decryptPassword } from "../utils/AES.js";
import jwt from "jsonwebtoken";
await initDB();
export const getAllUsers = async () => {
    const [rows] = await db.execute("SELECT * FROM users where role='user'");
    return rows;
};
export const getAllCompanies = async () => {
    const [rows] = await db.execute("SELECT * FROM users where role='company'");
    return rows;
};
export const getUserById = async (id) => {
    const [rows] = await db.execute("SELECT * FROM users WHERE id = ?", [id]);
    const result = rows;
    return result.length ? result[0] : null;
};
export const getCompanyById = async (id) => {
    const [rows] = await db.execute("SELECT * FROM users WHERE id = ? AND role = 'company'", [id]);
    const result = rows;
    return result.length ? result[0] : null;
};
export const createUser = async (user) => {
    const [result] = await db.execute("INSERT INTO users (name, email) VALUES (?, ?)", [user.name, user.email]);
    return {
        id: result.insertId,
        ...user,
    };
};
export const blockUser = async (id) => {
    const [result] = await db.execute("UPDATE users SET active = ? WHERE id = ?", [0, id]);
    if (result.affectedRows === 0) {
        return null;
    }
    return result.affectedRows > 0;
};
export const blockCompany = async (id) => {
    const [result] = await db.execute("UPDATE users SET active = ? WHERE id = ? AND role = 'company'", [0, id]);
    if (result.affectedRows === 0) {
        return null;
    }
    return result.affectedRows > 0;
};
export const unblockUser = async (id) => {
    const [result] = await db.execute("UPDATE users SET active = ? WHERE id = ?", [1, id]);
    if (result.affectedRows === 0) {
        return null;
    }
    return result.affectedRows > 0;
};
export const unblockCompany = async (id) => {
    const [result] = await db.execute("UPDATE users SET active = ? WHERE id = ? AND role = 'company'", [1, id]);
    if (result.affectedRows === 0) {
        return null;
    }
    return result.affectedRows > 0;
};
export const deleteUser = async (id) => {
    const [result] = await db.execute("DELETE FROM users WHERE id = ?", [id]);
    return result.affectedRows > 0;
};
export const deleteCompany = async (id) => {
    const [result] = await db.execute("DELETE FROM users WHERE id = ? AND role = 'company'", [id]);
    return result.affectedRows > 0;
};
export const getPendingCompanies = async () => {
    const [rows] = await db.execute("SELECT * FROM users WHERE role = 'company' AND approval_status = 'pending'");
    return rows;
};
export const approveCompany = async (id) => {
    // 1. update users table — approval_status + unblock
    const [result] = await db.execute(`UPDATE users 
     SET approval_status = 'approved', active = 1 
     WHERE id = ? AND role = 'company'`, [id]);
    if (result.affectedRows === 0)
        return null;
    // 2. update companies table too — same approval_status
    await db.execute(`UPDATE companies 
     SET approval_status = 'approved' 
     WHERE user_id = ?`, [id]);
    return true;
};
export const rejectCompany = async (id) => {
    const [result] = await db.execute(`UPDATE users 
     SET approval_status = 'rejected', active = 0 
     WHERE id = ? AND role = 'company'`, [id]);
    if (result.affectedRows === 0)
        return null;
    await db.execute(`UPDATE companies 
     SET approval_status = 'rejected' 
     WHERE user_id = ?`, [id]);
    return true;
};
export const getPendingProducts = async () => {
    const [rows] = await db.execute("SELECT * FROM products WHERE approval_status = 'pending'");
    return rows;
};
export const approveProduct = async (id) => {
    const [result] = await db.execute("UPDATE products SET approval_status = 'approved' WHERE id = ?", [id]);
    if (result.affectedRows === 0)
        return null;
    return result.affectedRows > 0;
};
export const rejectProduct = async (id) => {
    const [result] = await db.execute("UPDATE products SET approval_status = 'rejected' WHERE id = ?", [id]);
    if (result.affectedRows === 0)
        return null;
    return result.affectedRows > 0;
};
export const signup = async (name, email, password, role, companyData) => {
    const encryptedPassword = encryptPassword(password);
    const isCompany = role === "company";
    const approvalStatus = isCompany ? "pending" : "approved";
    const active = isCompany ? false : true;
    // 1. create user (auth identity)
    const [userResult] = await db.execute(`INSERT INTO users (name, email, password, role, active, approval_status)
     VALUES (?, ?, ?, ?, ?, ?)`, [name, email, encryptedPassword, role, active, approvalStatus]);
    const userId = userResult.insertId;
    // 2. if company → create company profile
    if (isCompany) {
        await db.execute(`INSERT INTO companies (user_id, name, location, type, established_year, approval_status)
       VALUES (?, ?, ?, ?, ?, ?)`, [
            userId,
            companyData?.companyName || name,
            companyData?.location || null,
            companyData?.type || null,
            companyData?.establishedYear || null,
            "pending",
        ]);
    }
    return userId;
};
/*export const signup = async (name: string, email: string, password: string) => {
  const hashedPassword = await bcrypt.hash(password, 10);

  const [result]: any = await db.execute(
    "INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)",
    [name, email, hashedPassword, "user"]
  );

  return result.insertId;
};*/
export const login = async (email, password) => {
    const [rows] = await db.execute("SELECT * FROM users WHERE email = ?", [email]);
    const user = Array.isArray(rows) ? rows[0] : null;
    if (!user)
        throw new Error("User not found");
    const decryptedPassword = decryptPassword(user.password);
    if (decryptedPassword !== password) {
        throw new Error("Wrong password");
    }
    if (!user.active) {
        throw new Error("User blocked by Admin");
    }
    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, "secret_key", { expiresIn: "24h" });
    return { token, role: user.role };
};
/*export const login = async (email: string, password: string) => {
  const [rows]: any = await db.execute(
    "SELECT * FROM users WHERE email = ?",
    [email]
  );

  const user = rows[0];
  if (!user) throw new Error("User not found");

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) throw new Error("Wrong password");

  const token = jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    "secret_key",
    { expiresIn: "24h" }
  );

  return { token, role: user.role };
};*/
