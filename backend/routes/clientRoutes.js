import * as clientController from '../controller/clientController.js';
import express from 'express';

const clientRoutes = express.Router();

// 2.1.1 Implement client login and logout
clientRoutes.post('/login', clientController.login);
clientRoutes.post('/logout', clientController.logout);

// 2.1.2 Implement change password
clientRoutes.put('/change-password', clientController.changePassword);

export default clientRoutes;