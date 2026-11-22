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

export default clientRoutes;