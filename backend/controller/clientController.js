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

