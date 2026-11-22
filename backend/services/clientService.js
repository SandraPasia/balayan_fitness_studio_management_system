import * as clientModel from '../models/clientModel.js';
import ValidationError from '../utils/ValidationError.js';
import validator from 'validator';
import bcrypt from 'bcryptjs';

// 2.1.1 Implement client login and logout
export const login = async (user) => {
    if (!user.username || !user.password) {
        throw new ValidationError("Username and password required", 400);
    }

    const existing = await clientModel.findClientByUsername(user.username);

    if (existing.length === 0) {
        throw new ValidationError("Invalid username or password", 400);
    }

    const client = existing[0];

    if (client.account_status !== 'Active') {
        throw new ValidationError("Account is inactive. Please contact admin.", 403);
    }

    const isCorrectPassword = await bcrypt.compare(user.password, client.password);

    if (!isCorrectPassword) {
        throw new ValidationError("Invalid username or password", 400);
    }

    return {
        user_id: client.user_id,
        client_id: client.client_id,
        username: client.username,
        full_name: client.full_name,
        role: client.role
    };
};

export const logout = async () => {
    return "Logout successful";
};

// 2.1.2 Implement change password
export const changePassword = async (data) => {
    if (!data.user_id || !data.currentPassword || !data.newPassword || !data.confirmPassword) {
        throw new ValidationError("All fields are required", 400);
    }

    if (data.newPassword !== data.confirmPassword) {
        throw new ValidationError("New password and confirm password do not match", 400);
    }

    if (!validator.isStrongPassword(data.newPassword)) {
        throw new ValidationError("New password is not strong enough", 400);
    }

    const existing = await clientModel.findUserById(data.user_id);

    if (existing.length === 0) {
        throw new ValidationError("Client account not found", 404);
    }

    const isMatch = await bcrypt.compare(data.currentPassword, existing[0].password);

    if (!isMatch) {
        throw new ValidationError("Current password is incorrect", 400);
    }

    const salt = bcrypt.genSaltSync(10);
    const hashedPassword = bcrypt.hashSync(data.newPassword, salt);

    await clientModel.updatePassword(data.user_id, hashedPassword);
    return "Password updated successfully";
};

// 2.2.1 Display membership information
export const getMembership = async (clientId) => {
    const memberships = await clientModel.findMembershipByClientId(clientId);

    if (memberships.length === 0) {
        throw new ValidationError("No membership records found", 404);
    }

    return memberships;
};

// 2.2.2 Generate and display individual QR code
export const getQrCode = async (clientId) => {
    const client = await clientModel.findClientQrById(clientId);

    if (client.length === 0) {
        throw new ValidationError("Client not found", 404);
    }

    return client[0];
};
