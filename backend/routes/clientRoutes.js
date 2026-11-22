import * as clientController from '../controller/clientController.js';
import express from 'express';

const clientRoutes = express.Router();

// 2.1.1 Implement client login and logout
clientRoutes.post('/login', clientController.login);
clientRoutes.post('/logout', clientController.logout);

// 2.1.2 Implement change password
clientRoutes.put('/change-password', clientController.changePassword);

// 2.2.1 Display membership information
clientRoutes.get('/membership/:clientId', clientController.getMembership);

// 2.2.2 Generate and display individual QR code
clientRoutes.get('/qr/:clientId', clientController.getQrCode);

// 2.3.1 Display trainer availability
clientRoutes.get('/availability', clientController.getTrainerAvailability);

// 2.3.2 Implement appointment request
clientRoutes.post('/appointments', clientController.requestAppointment);

// 2.3.3 Display appointment status and schedule change request
clientRoutes.get('/appointments/:clientId', clientController.getAppointments);
clientRoutes.put('/appointments/change/:appointmentId', clientController.requestScheduleChange);

// 2.4.1 Display fitness progress records
clientRoutes.get('/progress/:clientId', clientController.getFitnessProgress);

// 2.5.1 Implement client notifications
clientRoutes.get('/notifications/:userId', clientController.getNotifications);
clientRoutes.put('/notifications/read/:notificationId', clientController.markAsRead);

export default clientRoutes;