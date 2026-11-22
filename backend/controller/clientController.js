import * as clientService from '../services/clientService.js';

// 2.1.1 Implement client login and logout
export const login = async (req, res) => {
    const { username, password } = req.body;
    const user = { username, password };

    try {
        const result = await clientService.login(user);
        res.status(200).json({
            success: true,
            message: result
        });
    } catch (e) {
        console.log(e);
        res.status(e.statusCode || 500).json({
            error: `${e.message || "Internal Server Error"}`
        });
    }
};

export const logout = async (req, res) => {
    try {
        const result = await clientService.logout();
        res.status(200).json({
            success: true,
            message: result
        });
    } catch (e) {
        console.log(e);
        res.status(e.statusCode || 500).json({
            error: `${e.message || "Internal Server Error"}`
        });
    }
};

// 2.1.2 Implement change password
export const changePassword = async (req, res) => {
    const { user_id, currentPassword, newPassword, confirmPassword } = req.body;
    const data = { user_id, currentPassword, newPassword, confirmPassword };

    try {
        const result = await clientService.changePassword(data);
        res.status(200).json({
            success: true,
            message: result
        });
    } catch (e) {
        console.log(e);
        res.status(e.statusCode || 500).json({
            error: `${e.message || "Internal Server Error"}`
        });
    }
};

// 2.2.1 Display membership information
export const getMembership = async (req, res) => {
    const { clientId } = req.params;

    try {
        const result = await clientService.getMembership(parseInt(clientId));
        res.status(200).json({
            success: true,
            message: result
        });
    } catch (e) {
        console.log(e);
        res.status(e.statusCode || 500).json({
            error: `${e.message || "Internal Server Error"}`
        });
    }
};

// 2.2.2 Generate and display individual QR code
export const getQrCode = async (req, res) => {
    const { clientId } = req.params;

    try {
        const result = await clientService.getQrCode(parseInt(clientId));
        res.status(200).json({
            success: true,
            message: result
        });
    } catch (e) {
        console.log(e);
        res.status(e.statusCode || 500).json({
            error: `${e.message || "Internal Server Error"}`
        });
    }
};

// 2.3.1 Display trainer availability
export const getTrainerAvailability = async (req, res) => {
    try {
        const slots = await clientService.getTrainerAvailability();
        res.status(200).json(slots);
    } catch (e) {
        console.log(e);
        res.status(e.statusCode || 500).json({
            error: `${e.message || "Internal Server Error"}`
        });
    }
};

// 2.3.2 Implement appointment request
export const requestAppointment = async (req, res) => {
    const { client_id, availability_id } = req.body;
    const data = { client_id, availability_id };

    try {
        const appointmentId = await clientService.requestAppointment(data);
        res.status(200).json({
            success: true,
            message: appointmentId
        });
    } catch (e) {
        console.log(e);
        res.status(e.statusCode || 500).json({
            error: `${e.message || "Internal Server Error"}`
        });
    }
};

// 2.3.3 Display appointment status and schedule change request
export const getAppointments = async (req, res) => {
    const { clientId } = req.params;

    try {
        const appointments = await clientService.getAppointments(parseInt(clientId));
        res.status(200).json(appointments);
    } catch (e) {
        console.log(e);
        res.status(e.statusCode || 500).json({
            error: `${e.message || "Internal Server Error"}`
        });
    }
};

export const requestScheduleChange = async (req, res) => {
    const { appointmentId } = req.params;
    const { requested_new_availability_id } = req.body;
    const data = { appointment_id: parseInt(appointmentId), requested_new_availability_id };

    try {
        const result = await clientService.requestScheduleChange(data);
        res.status(200).json({
            success: true,
            message: result
        });
    } catch (e) {
        console.log(e);
        res.status(e.statusCode || 500).json({
            error: `${e.message || "Internal Server Error"}`
        });
    }
};

// 2.4.1 Display fitness progress records
export const getFitnessProgress = async (req, res) => {
    const { clientId } = req.params;

    try {
        const progress = await clientService.getFitnessProgress(parseInt(clientId));
        res.status(200).json(progress);
    } catch (e) {
        console.log(e);
        res.status(e.statusCode || 500).json({
            error: `${e.message || "Internal Server Error"}`
        });
    }
};

// 2.5.1 Implement client notifications
export const getNotifications = async (req, res) => {
    const { userId } = req.params;

    try {
        const notifications = await clientService.getNotifications(parseInt(userId));
        res.status(200).json(notifications);
    } catch (e) {
        console.log(e);
        res.status(e.statusCode || 500).json({
            error: `${e.message || "Internal Server Error"}`
        });
    }
};

export const markAsRead = async (req, res) => {
    const { notificationId } = req.params;

    try {
        const result = await clientService.markAsRead(parseInt(notificationId));
        res.status(200).json({
            success: true,
            message: result
        });
    } catch (e) {
        console.log(e);
        res.status(e.statusCode || 500).json({
            error: `${e.message || "Internal Server Error"}`
        });
    }
};