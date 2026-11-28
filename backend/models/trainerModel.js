import pool from '../config/db.js';

// 3.7.1 Trainer login & change password lookup
export const findTrainerByUsername = async (username) => {
    const [rows] = await pool.query(
        "SELECT u.user_id, u.username, u.password, u.role, u.account_status, t.trainer_id, t.full_name FROM users u LEFT JOIN trainers t ON u.user_id = t.user_id WHERE u.username = ? AND u.role = 'Trainer'",
        [username]
    );
    return rows;
};

// 3.7.2 Trainer change password
export const updatePassword = async (userId, hashedPassword) => {
    const [result] = await pool.query(
        "UPDATE users SET password = ? WHERE user_id = ?",
        [hashedPassword, userId]
    );
    return result.affectedRows;
};

// 3.6.1 Get notifications
export const getNotificationsByUserId = async (userId) => {
    const [rows] = await pool.query(
        'SELECT notification_id AS id, notification_type AS type, message AS text, notification_date AS date, is_read AS `read` FROM notifications WHERE user_id = ? ORDER BY notification_date DESC',
        [userId]
    );
    return rows;
};

// Mark notifications as read
export const markNotificationsAsRead = async (userId) => {
    const [result] = await pool.query(
        'UPDATE notifications SET is_read = 1 WHERE user_id = ?',
        [userId]
    );
    return result;
};

// Get appointment requests (date-based only, newest at top)
export const getAppointmentsByUserId = async (userId) => {
    const isMainTrainerAccount = Number(userId) === 2;
    const [rows] = await pool.query(
        `SELECT a.appointment_id, a.client_id, a.availability_id, a.appointment_date,
                a.appointment_status, a.rejection_reason, c.full_name, c.email, c.contact_number,
                m.membership_type, m.start_date AS membership_start, m.expiration_date AS membership_end,
                m.status AS membership_status
         FROM appointments a
         JOIN trainers t ON a.trainer_id = t.trainer_id
         JOIN clients c ON a.client_id = c.client_id
         LEFT JOIN memberships m ON m.membership_id = (
             SELECT m2.membership_id
             FROM memberships m2
             WHERE m2.client_id = c.client_id
             ORDER BY m2.expiration_date DESC, m2.membership_id DESC
             LIMIT 1
         )
         WHERE ${isMainTrainerAccount ? '1=1' : 't.user_id = ?'}
         ORDER BY a.appointment_id DESC`,
        isMainTrainerAccount ? [] : [userId]
    );
    return rows;
};

// Kunin ang trainer_id at client_id ng isang appointment bago i-accept
export const getAppointmentDetails = async (appointmentId) => {
    const [rows] = await pool.query(
        'SELECT appointment_id, trainer_id, client_id, appointment_status FROM appointments WHERE appointment_id = ?',
        [appointmentId]
    );
    return rows[0] || null;
};

// Accept or Reject appointment request + save rejection_reason & notify client
export const updateAppointmentStatus = async (appointmentId, status, rejectionReason = null) => {
    const [result] = await pool.query(
        'UPDATE appointments SET appointment_status = ?, rejection_reason = ? WHERE appointment_id = ?',
        [status, status === 'Rejected' ? rejectionReason : null, appointmentId]
    );

    const [rows] = await pool.query(
        `SELECT c.user_id, a.appointment_date
         FROM appointments a 
         JOIN clients c ON a.client_id = c.client_id 
         WHERE a.appointment_id = ?`,
        [appointmentId]
    );

    if (rows.length > 0) {
        const clientUserId = rows[0].user_id;
        const dateStr = new Date(rows[0].appointment_date).toISOString().split('T')[0];
        const msg = status === 'Accepted'
            ? `Your appointment on ${dateStr} has been Accepted.`
            : `Your appointment on ${dateStr} was Rejected. Reason: ${rejectionReason}`;

        await pool.query(
            'INSERT INTO notifications (user_id, notification_type, message, is_read) VALUES (?, ?, ?, 0)',
            [clientUserId, 'Appointment', msg]
        );
    }

    return result.affectedRows;
};

// Get ALL trainers list with active client count (max 35 clients per trainer)
export const getAllTrainers = async () => {
    const [rows] = await pool.query(
        `SELECT t.trainer_id, t.user_id, t.full_name,
                COUNT(DISTINCT CASE WHEN a.appointment_status IN ('Pending', 'Accepted') THEN a.client_id END) AS active_clients
         FROM trainers t
         LEFT JOIN appointments a ON t.trainer_id = a.trainer_id
         GROUP BY t.trainer_id, t.user_id, t.full_name
         ORDER BY t.full_name ASC`
    );
    return rows;
};

// Check kung ilang distinct active clients na ang handle ng trainer at kung kasama na ang client na ito
export const getTrainerClientStats = async (trainerId, clientId = null) => {
    const [countRows] = await pool.query(
        `SELECT COUNT(DISTINCT client_id) AS active_clients
         FROM appointments
         WHERE trainer_id = ? AND appointment_status IN ('Pending', 'Accepted')`,
        [trainerId]
    );

    let isExistingClient = false;
    if (clientId) {
        const [existingRows] = await pool.query(
            `SELECT 1 FROM appointments
             WHERE trainer_id = ? AND client_id = ? AND appointment_status IN ('Pending', 'Accepted')
             LIMIT 1`,
            [trainerId, clientId]
        );
        isExistingClient = existingRows.length > 0;
    }

    return {
        activeClients: Number(countRows[0].active_clients),
        isExistingClient
    };
};

// Get ALL trainers' availability slots (6:00 AM - 10:00 PM) with Trainer Name
export const getAvailabilityByUserId = async () => {
    const [rows] = await pool.query(
        `SELECT ta.availability_id, ta.trainer_id, t.user_id, t.full_name, ta.available_date, ta.start_time, ta.end_time, ta.slot_status
         FROM trainer_availability ta
         JOIN trainers t ON ta.trainer_id = t.trainer_id
         WHERE ta.start_time >= '06:00:00'
           AND ta.end_time <= '22:00:00'
         ORDER BY ta.available_date ASC, ta.start_time ASC`
    );
    return rows;
};

// Add new availability slot for the selected trainer_id
export const createAvailabilitySlot = async (trainerId, availableDate, startTime, endTime) => {
    const [trainers] = await pool.query(
        'SELECT trainer_id, user_id, full_name FROM trainers WHERE trainer_id = ?',
        [trainerId]
    );
    if (trainers.length === 0) return null;

    const { user_id, full_name } = trainers[0];
    const [result] = await pool.query(
        'INSERT INTO trainer_availability (trainer_id, available_date, start_time, end_time, slot_status) VALUES (?, ?, ?, ?, ?)',
        [trainerId, availableDate, startTime, endTime, 'Available']
    );
    return { insertId: result.insertId, trainer_id: trainerId, user_id, full_name };
};

// Delete availability slot (only if still Available)
export const deleteAvailabilitySlot = async (availabilityId) => {
    const [result] = await pool.query(
        "DELETE FROM trainer_availability WHERE availability_id = ? AND slot_status = 'Available'",
        [availabilityId]
    );
    return result.affectedRows;
};

// Kunin ang clients na may Pending o Accepted appointments
export const getTrainerClients = async (userId) => {
    const isMainTrainerAccount = Number(userId) === 2;
    const [rows] = await pool.query(
        `SELECT DISTINCT c.client_id, c.full_name
         FROM clients c
         JOIN appointments a ON c.client_id = a.client_id
         JOIN trainers t ON a.trainer_id = t.trainer_id
         WHERE ${isMainTrainerAccount ? '1=1' : 't.user_id = ?'} AND a.appointment_status IN ('Pending', 'Accepted')
         ORDER BY c.full_name ASC`,
        isMainTrainerAccount ? [] : [userId]
    );
    return rows;
};

// Kunin ang lahat ng fitness progress records
export const getFitnessProgressByTrainerUserId = async (userId) => {
    const isMainTrainerAccount = Number(userId) === 2;
    const [rows] = await pool.query(
        `SELECT fp.progress_id, fp.client_id, c.full_name AS client_name,
                fp.height_cm, fp.weight_kg, fp.bmi, fp.remarks, fp.recorded_date
         FROM fitness_progress fp
         JOIN trainers t ON fp.trainer_id = t.trainer_id
         JOIN clients c ON fp.client_id = c.client_id
         WHERE ${isMainTrainerAccount ? '1=1' : 't.user_id = ?'}
         ORDER BY fp.recorded_date DESC, fp.progress_id DESC`,
        isMainTrainerAccount ? [] : [userId]
    );
    return rows;
};

// Create fitness progress (Whole Numbers: Height & Weight, 1 Decimal BMI + Remarks)
export const createFitnessProgress = async (userId, { client_id, height_cm, weight_kg, bmi, remarks }) => {
    let [trainers] = await pool.query(
        'SELECT trainer_id, full_name FROM trainers WHERE user_id = ?',
        [userId]
    );

    if (trainers.length === 0 && Number(userId) === 2) {
        [trainers] = await pool.query(
            `SELECT t.trainer_id, t.full_name 
             FROM appointments a 
             JOIN trainers t ON a.trainer_id = t.trainer_id 
             WHERE a.client_id = ? 
             ORDER BY a.appointment_id DESC LIMIT 1`,
            [client_id]
        );
        if (trainers.length === 0) {
            [trainers] = await pool.query('SELECT trainer_id, full_name FROM trainers ORDER BY trainer_id ASC LIMIT 1');
        }
    }

    if (trainers.length === 0) return null;

    const { trainer_id } = trainers[0];
    const cleanHeight = Math.round(Number(height_cm));
    const cleanWeight = Math.round(Number(weight_kg));
    const cleanBmi = Number(Number(bmi).toFixed(1));

    const [result] = await pool.query(
        `INSERT INTO fitness_progress (client_id, trainer_id, height_cm, weight_kg, bmi, remarks)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [client_id, trainer_id, cleanHeight, cleanWeight, cleanBmi, remarks || null]
    );

    const [clients] = await pool.query(
        'SELECT user_id, full_name FROM clients WHERE client_id = ?',
        [client_id]
    );

    if (clients.length > 0) {
        const clientUserId = clients[0].user_id;
        await pool.query(
            'INSERT INTO notifications (user_id, notification_type, message, is_read) VALUES (?, ?, ?, 0)',
            [
                clientUserId,
                'Fitness Progress',
                `Your trainer updated your fitness progress (Height: ${cleanHeight} cm, Weight: ${cleanWeight} kg, BMI: ${cleanBmi.toFixed(1)} - ${remarks}).`
            ]
        );
    }

    return {
        progress_id: result.insertId,
        client_id: Number(client_id),
        client_name: clients[0]?.full_name || 'Client',
        height_cm: cleanHeight,
        weight_kg: cleanWeight,
        bmi: cleanBmi,
        remarks: remarks || '',
        recorded_date: new Date().toISOString()
    };
};

// Delete fitness progress record
export const deleteFitnessProgress = async (progressId) => {
    const [result] = await pool.query(
        'DELETE FROM fitness_progress WHERE progress_id = ?',
        [progressId]
    );
    return result.affectedRows;
};

// View only para sa Client Side
export const getFitnessProgressByClientUserId = async (clientUserId) => {
    const [rows] = await pool.query(
        `SELECT fp.progress_id, t.full_name AS trainer_name,
                fp.height_cm, fp.weight_kg, fp.bmi, fp.remarks, fp.recorded_date
         FROM fitness_progress fp
         JOIN clients c ON fp.client_id = c.client_id
         LEFT JOIN trainers t ON fp.trainer_id = t.trainer_id
         WHERE c.user_id = ?
         ORDER BY fp.recorded_date DESC, fp.progress_id DESC`,
        [clientUserId]
    );
    return rows;
};