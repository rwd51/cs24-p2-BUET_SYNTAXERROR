const router=require('express').Router();

//const { json } = require('express');
const bcrypt=require('bcrypt');
const pool=require('../connect.js');
const jwtGenerator=require('../utils/jwtGenerator.js');
const validinfo=require('../middleware/validinfo.js');
const authorize=require('../middleware/authorization.js');
const verifyAdmin=require('../middleware/verifyAdmin.js');

// GET method for listing all users (System Admin access)
router.get('/', async (req, res) => {
    try {
      const query = 'SELECT * FROM users';
      const users = await pool.query(query);
      res.json(users.rows[0]);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server error');
    }
  });
  
  // GET method for retrieving a specific user's details
  router.get('/:userId', async (req, res) => {
    try {
      const { userId } = req.params;
      const query = 'SELECT * FROM users WHERE user_id = $1';
      const user = await pool.query(query, [userId]);
  
      if (user.rows.length === 0) {
        return res.status(404).json({ error: 'User not found' });
      }
  
      res.json(user.rows[0]);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server error');
    }
  });
  
  // POST method for creating a new user (System Admin access)
  router.post('/', async (req, res) => {
    try {
      const { username, password, role_name } = req.body;
  
      const query = 'INSERT INTO users (username, password, role_id) VALUES ($1, $2, (SELECT role_id FROM roles WHERE role_name= $3)) RETURNING *';
      const newUser = await pool.query(query, [username, password, role_name]);
  
      res.json(newUser.rows[0]);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server error');
    }
  });
  
  // PUT method for updating a user's details (restricted to own details or System Admin access)
  router.put('/:userId', async (req, res) => {
    try {
      const { userId } = req.params;
      const { username } = req.body;
      // Check if the user is updating their own details or if the user is a System Admin, system admin has role_id 1
        /*if (req.userId !== userId && req.roleId !== 1) {
            return res.status(401).json({ error: 'Unauthorized to do this Action' });
        }
        */
  
      const query = 'UPDATE users SET username = $1 WHERE user_id = $2 RETURNING *';
      const updatedUser = await pool.query(query, [username, userId]);
  
      if (updatedUser.rows.length === 0) {
        return res.status(404).json({ error: 'User not found' });
      }
  
      res.json(updatedUser.rows[0]);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server error');
    }
  });
  
  // DELETE method for deleting a user (System Admin access)
  router.delete('/:userId', async (req, res) => {
    try {
      const { userId } = req.params;
      const query = 'DELETE FROM users WHERE user_id = $1 RETURNING *';
      const deletedUser = await pool.query(query, [userId]);
  
      if (deletedUser.rows.length === 0) {
        return res.status(404).json({ error: 'User not found' });
      }
  
      res.json({ message: 'User deleted successfully' });
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server error');
    }
  });
  
  // GET method for listing all available roles
  router.get('/roles', async (req, res) => {
    try {
      const query = 'SELECT * FROM roles';
      const roles = await pool.query(query);
      res.json(roles.rows[0]);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server error');
    }
  });
  
  // PUT method for updating a user's roles (System Admin access)
  router.put('/:userId/roles', async (req, res) => {
    try {
      const { userId } = req.params;
      const { roleId } = req.body;
  
      const query = 'UPDATE users SET role_id = $1 WHERE user_id = $2 RETURNING *';
      const updatedUser = await pool.query(query, [roleId, userId]);
  
      if (updatedUser.rows.length === 0) {
        return res.status(404).json({ error: 'User not found' });
      }
  
      res.json(updatedUser.rows[0]);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server error');
    }
  });

// all sts managers
  router.get('/sts/managers', async (req, res) => {
    try {
        const query = `
            SELECT u.user_id, u.username, sm.sts_id, s.ward_number,u.role_id
            FROM users u
            JOIN sts_managers sm ON u.user_id = sm.user_id
            JOIN sts s ON sm.sts_id = s.sts_id
        `;
        const { rows } = await pool.query(query);
        res.status(200).json(rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});
// all landfill managers

router.get('/landfill/managers', async (req, res) => {
    try {
        const query = `
            SELECT u.user_id, u.username, lm.landfill_id, l.capacity, l.operational_timespan
            FROM users u
            JOIN landfill_managers lm ON u.user_id = lm.user_id
            JOIN landfill_sites l ON lm.landfill_id = l.landfill_id
        `;
        const { rows } = await pool.query(query);
        res.status(200).json(rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});
// all unassigned users
router.get('/unassigned/users', async (req, res) => {
  try {
      const query = `
          SELECT u.user_id, u.username, u.role_id
          FROM users u JOIN roles r ON u.role_id = r.role_id
          WHERE r.role_name ='Unassigned'
      `;
      const { rows } = await pool.query(query);
      res.status(200).json(rows);
  } catch (err) {
      console.error(err.message);
      res.status(500).send('Server error');
  }
});

///get Roles
router.post('/roles', async (req, res) => {
  try {
    const { role_name } = req.body;

    // Validate input data if necessary

    // Retrieve the role_id based on the role_name
    const query = 'SELECT role_id FROM roles WHERE role_name = $1';
    const { rows } = await pool.query(query, [role_name]);

    if (rows.length === 0) {
        return res.status(404).json({ message: 'Role not found' });
    }

    //const role_id = rows[0].role_id;
    res.status(200).json(rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});



  
  module.exports = router;