const router=require('express').Router();

//const { json } = require('express');
const bcrypt=require('bcrypt');
const pool=require('../connect.js');
const jwtGenerator=require('../utils/jwtGenerator.js');
const validinfo=require('../middleware/validinfo.js');
const authorize=require('../middleware/authorization.js');

router.post('/register', async (req, res) => {
    try {
        const { username,password,role_id} = req.body;
  
        // Check if the user already exists
        const userQuery = `SELECT * FROM users WHERE username = $1`;
        const user = await pool.query(userQuery, [username]);
  
        if (user.rows.length !== 0) {
            return res.status(401).send('User already exists');
        }
  
        // Hash the password
        const salt = bcrypt.genSaltSync(10);
        const hashedPassword = bcrypt.hashSync(password, salt);
  
        // Get the location_id for the given city and country
      
        // Insert the new user into the database
        const insertUserQuery = `
            INSERT INTO users(username,password,role_id)
            VALUES($1, $2,$3)
            RETURNING *`;
        const newUser = await pool.query(insertUserQuery, [
            username,
            hashedPassword,
            role_id
        ]);
  
        // Generate JWT token
        //get the role_name from roles table using role_id
        const roleQuery = `SELECT role_name FROM roles WHERE role_id = $1`;
        const role = await pool.query(roleQuery, [role_id]);
        const token = jwtGenerator(newUser.rows[0].user_id, role.rows[0].role_name);
        
        // Respond with the newly created user
        res.json(newUser.rows[0]);
  
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
  });
  
  //login routes
  router.post('/login',async(req,res)=>{
  
  
      try{
  
          //1. destructure the req.body
          //2. check if user doesn't exist (if not then we throw error)
          //3. check if incoming password is the same as the database password
          //4. give them the jwt token
          const {username,password}=req.body;
          const q = "SELECT * FROM users WHERE username = $1";
          const user=await pool.query(q,[username]);
          if(user.rows.length===0){
              return res.status(401).json('Username or password is incorrect');
              
          }
          const validPassword=bcrypt.compareSync(password,user.rows[0].password);
          if(!validPassword){
              return res.status(401).json('Username or password is incorrect');
          }
        const role_id=user.rows[0].role_id;
        const roleQuery = `SELECT role_name FROM roles WHERE role_id = $1`;
        const role = await pool.query(roleQuery, [role_id]);
        const token = jwtGenerator(user.rows[0].user_id, role.rows[0].role_name);
          res.json({token});
  
      }
      catch(err){
          console.error(err.message);
          res.status(500).send('Server error');
      }
  
  });



  router.post("/verify", authorize, (req, res) => {
    try {
      res.json(true);
    } catch (err) {
      console.error(err.message);
      res.status(500).send("Server error");
    }
  });

  router.post('/logout', authorize, (req, res) => {
    try {
      // Log the logout action, if necessary
      console.log(`User ${req.userId} logged out`);
  
      // Inform the client that the token should be deleted/ignored
      res.json({ message: 'Logout successful. Please clear the token on the client side.' });
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server error');
    }
  });
  
  module.exports = router;

  