const router=require('express').Router();

//const { json } = require('express');
const bcrypt=require('bcrypt');
const pool=require('../connect.js');
const jwtGenerator=require('../utils/jwtGenerator.js');
const validinfo=require('../middleware/validinfo.js');
const authorize=require('../middleware/authorization.js');
const verifyAdmin=require('../middleware/verifyAdmin.js');
const { mod } = require('mathjs');


// GET /profile endpoint to retrieve logged-in user's profile
router.get('/profile', async (req, res) => {
    try {
        const userId = req.userId;
        const query = 'SELECT user_id, username, role_id FROM users WHERE user_id = $1';
        const user = await pool.query(query, [userId]);

        if (user.rows.length === 0) {
            return res.status(404).json('User not found');
        }

        // Assuming you want to also send back the user's role name, not just the role ID
        const roleQuery = 'SELECT role_name FROM roles WHERE role_id = $1';
        const role = await pool.query(roleQuery, [user.rows[0].role_id]);

        const userProfile = {
            userId: user.rows[0].user_id,
            username: user.rows[0].username,
            role: role.rows[0].role_name
        };

        res.json(userProfile);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});
// get a specific user's profile
router.get('/profile/:userId', async (req, res) => {
    try {
        const userId = req.params.userId;
        const query = 'SELECT user_id, username, role_id FROM users WHERE user_id = $1';
        const user = await pool.query(query, [userId]);

        if (user.rows.length === 0) {
            return res.status(404).json('User not found');
        }

        // Assuming you want to also send back the user's role name, not just the role ID
        const roleQuery = 'SELECT role_name FROM roles WHERE role_id = $1';
        const role = await pool.query(roleQuery, [user.rows[0].role_id]);

        const userProfile = {
            userId: user.rows[0].user_id,
            username: user.rows[0].username,
            role: role.rows[0].role_name
        };

        res.json(userProfile);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});
// PUT method to edit logged in users profile
router.put('/profile', async (req, res) => {
    try {
        const userId = req.userId;
        const { username} = req.body;

        const query = 'UPDATE users SET username = $1 WHERE user_id = $2 RETURNING *';
        const updatedUser = await pool.query(query, [username, userId]);

        res.json(updatedUser.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

module.exports=router;