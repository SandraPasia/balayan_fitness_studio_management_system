import pool from '../config/db.js';

// Trainer login
export const findTrainerByUsername = async (username) => {
    const [rows] = await pool.query(
        "SELECT u.user_id, u.username, u.password, u.role, u.account_status, t.trainer_id, t.full_name, t.specialization FROM users u LEFT JOIN trainers t ON u.user_id = t.user_id WHERE u.username = ? AND u.role = 'Trainer'",
        [username]
    );
    return rows;
};

// Trainer change password (naka-ready para sa susunod)
export const updatePassword = async (userId, hashedPassword) => {
    const [result] = await pool.query(
        "UPDATE users SET password = ? WHERE user_id = ?",
        [hashedPassword, userId]
    );
    return result.affectedRows;
};