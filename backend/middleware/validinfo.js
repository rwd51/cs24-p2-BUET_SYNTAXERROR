module.exports = function(req, res, next) {
    const { email, name, password } = req.body;
  
    function validEmail(userEmail) {
      return /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(userEmail);
    }
  
    if (req.path === "/register") {
    const {username,email,password,name}=req.body;
      console.log(!email.length);
      if (![username,email,password,name].every(Boolean)) {
        return res.json("Missing Credentials");
      } else if (!validEmail(email)) {
        return res.json("Invalid Email");
      }
    } else if (req.path === "/login") {
        const {username,password}=req.body;
      if (![username, password].every(Boolean)) {
        return res.json("Missing Credentials");
      } 
    }
  
    next();
  };