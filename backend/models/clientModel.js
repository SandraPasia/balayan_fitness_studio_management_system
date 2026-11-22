import pool from '../config/db.js';

// 2.1.1 Implement client login
export const findClientByUsername = async (username) => {
    const [rows] = await pool.query(
        "SELECT u.user_id, u.username, u.password, u.role, u.account_status, c.client_id, c.full_name, c.email, c.contact_number, c.qr_code FROM users u JOIN clients c ON u.user_id = c.user_id WHERE u.username = ? AND u.role = 'Client'",
        [username]
    );
    return rows;
};

// 2.1.2 Implement change password
export const findUserById = async (userId) => {
    const [rows] = await pool.query(
        "SELECT * FROM users WHERE user_id = ? AND role = 'Client'",
        [userId]
    );
    return rows;
};

export const updatePassword = async (userId, hashedPassword) => {
    const [result] = await pool.query(
        "UPDATE users SET password = ? WHERE user_id = ?",
        [hashedPassword, userId]
    );
    return result.affectedRows;
};

// 2.2.1 Display membership information
export const findMembershipByClientId = async (clientId) => {
    const [rows] = await pool.query(
        "SELECT membership_id, membership_type, start_date, expiration_date, status FROM memberships WHERE client_id = ? ORDER BY expiration_date DESC",
        [clientId]
    );
    return rows;
};
