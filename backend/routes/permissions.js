
const router=require('express').Router();

//const { json } = require('express');
const bcrypt=require('bcrypt');
const pool=require('../connect.js');
const jwtGenerator=require('../utils/jwtGenerator.js');
const validinfo=require('../middleware/validinfo.js');
const authorize=require('../middleware/authorization.js');
const verifyAdmin = require('../middleware/verifyAdmin.js');


router.post('/roles/:role_id/permissions', async (req, res) => {
    const { role_id } = req.params;
    const { permission_name } = req.body;

    try {
        const { rows: permissionRows } = await pool.query(
            `SELECT permission_id FROM permissions WHERE permission_name = $1`,
            [permission_name]
        );

        if (permissionRows.length === 0) {
            return res.status(404).json({ message: 'Permission not found' });
        }

        const permission_id = permissionRows[0].permission_id;

        await pool.query(
            `INSERT INTO role_permissions (role_id, permission_id) VALUES ($1, $2)`,
            [role_id, permission_id]
        );

        res.status(200).json({ message: 'Permission assigned successfully' });
    } catch (error) {
        console.error('Error assigning permission:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

module.exports = router;
