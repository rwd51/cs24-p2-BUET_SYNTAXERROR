/*
const jwt=require('jsonwebtoken');
require('dotenv').config();
function jwtGenerator(user_id){
    const payload={
        userId:user_id
    }
    return jwt.sign(payload,process.env.jwtSecret,{expiresIn:"1hr"});
}
module.exports=jwtGenerator;
*/

const jwt = require('jsonwebtoken');
require('dotenv').config();

// Updated to include user role in the JWT token
function jwtGenerator(user_id, user_role) {
  const payload = {
    userId: user_id,
    role: user_role
  };
  return jwt.sign(payload, process.env.jwtSecret, { expiresIn: "1hr" });
}
module.exports = jwtGenerator;
