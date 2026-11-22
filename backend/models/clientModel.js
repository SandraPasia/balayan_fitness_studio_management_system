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

// 2.2.2 Generate and display individual QR code
export const findClientQrById = async (clientId) => {
    const [rows] = await pool.query(
        "SELECT client_id, full_name, qr_code FROM clients WHERE client_id = ?",
        [clientId]
    );
    return rows;
};

// 2.3.1 Display trainer availability
export const fetchAvailableTrainerSlots = async () => {
    const [rows] = await pool.query(
        "SELECT ta.availability_id, t.trainer_id, t.full_name AS trainer_name, t.specialization, ta.available_date, ta.start_time, ta.end_time FROM trainer_availability ta JOIN trainers t ON ta.trainer_id = t.trainer_id WHERE ta.slot_status = 'Available' ORDER BY ta.available_date ASC, ta.start_time ASC"
    );
    return rows;
};

// 2.3.2 Implement appointment request
export const checkActiveMembership = async (clientId) => {
    const [rows] = await pool.query(
        "SELECT * FROM memberships WHERE client_id = ? AND status = 'Active' AND expiration_date >= CURDATE()",
        [clientId]
    );
    return rows;
};

export const findAvailabilityById = async (availabilityId) => {
    const [rows] = await pool.query(
        "SELECT * FROM trainer_availability WHERE availability_id = ?",
        [availabilityId]
    );
    return rows;
};

export const checkDuplicateAppointment = async (clientId, availabilityId) => {
    const [rows] = await pool.query(
        "SELECT * FROM appointments WHERE client_id = ? AND availability_id = ? AND status != 'Rejected'",
        [clientId, availabilityId]
    );
    return rows;
};

export const insertAppointment = async (data) => {
    const [result] = await pool.query(
        "INSERT INTO appointments (client_id, trainer_id, availability_id, appointment_date, start_time, end_time, status) VALUES (?, ?, ?, ?, ?, ?, 'Pending')",
        [data.client_id, data.trainer_id, data.availability_id, data.appointment_date, data.start_time, data.end_time]
    );
    return result.insertId;
};

// 2.3.3 Display appointment status and schedule change request
export const findAppointmentsByClientId = async (clientId) => {
    const [rows] = await pool.query(
        "SELECT a.appointment_id, t.full_name AS trainer_name, a.appointment_date, a.start_time, a.end_time, a.status, a.rejection_reason, a.requested_new_availability_id, a.change_request_status FROM appointments a JOIN trainers t ON a.trainer_id = t.trainer_id WHERE a.client_id = ? ORDER BY a.appointment_date DESC, a.start_time DESC",
        [clientId]
    );
    return rows;
};

export const findAppointmentById = async (appointmentId) => {
    const [rows] = await pool.query(
        "SELECT * FROM appointments WHERE appointment_id = ?",
        [appointmentId]
    );
    return rows;
};

export const updateScheduleChangeRequest = async (appointmentId, newAvailabilityId) => {
    const [result] = await pool.query(
        "UPDATE appointments SET requested_new_availability_id = ?, change_request_status = 'Pending' WHERE appointment_id = ?",
        [newAvailabilityId, appointmentId]
    );
    return result.affectedRows;
};

// 2.4.1 Display fitness progress records
export const findFitnessProgressByClientId = async (clientId) => {
    const [rows] = await pool.query(
        "SELECT fp.progress_id, fp.height_cm, fp.weight_kg, fp.bmi, fp.remarks, fp.recorded_date, t.full_name AS trainer_name FROM fitness_progress fp LEFT JOIN trainers t ON fp.trainer_id = t.trainer_id WHERE fp.client_id = ? ORDER BY fp.recorded_date DESC",
        [clientId]
    );
    return rows;
};
