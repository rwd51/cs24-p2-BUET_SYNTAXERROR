// Middleware to verify if the user is a system admin
const jwt =require('jsonwebtoken');
require('dotenv').config();
module.exports=function verifyAdmin(req, res, next) {
    const jwtToken = req.header('token');
    if (!jwtToken) {
      return res.status(403).json('Not authorized');
    }
    try {
      const payload = jwt.verify(jwtToken, process.env.jwtSecret);
      req.userId = payload.userId;
      if (payload.role !== 'System Admin') {
        return res.status(403).json('Not authorized, admin only');
      }
      next();
    } catch (err) {
      console.error(err.message);
      return res.status(403).json('Not authorized');
    }
  }
  