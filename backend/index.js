const express=require('express');
const app=express();
const cors=require('cors');

const axios = require('axios');



//MIddlewares
app.use(express.json());
app.use(cors());

//Routes
app.use('/auth',require('./routes/auth.js'));
//user routes
app.use('/users',require('./routes/usermanagement.js'));
// permissions routes
app.use('/rbac', require('./routes/permissions.js'));
app.use('/', require('./routes/profile.js'));
app.use('/data', require('./routes/dataEntry.js'));
app.use('/bill', require('./routes/billing.js'));
app.use('/fleet', require('./routes/fleet.js'));


app.listen(5000,()=>{
    console.log('Server is running');
});