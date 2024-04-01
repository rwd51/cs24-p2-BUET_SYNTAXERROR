const router=require('express').Router();

//const { json } = require('express');
const bcrypt=require('bcrypt');
const pool=require('../connect.js');
const jwtGenerator=require('../utils/jwtGenerator.js');
const validinfo=require('../middleware/validinfo.js');
const authorize=require('../middleware/authorization.js');
const verifyAdmin = require('../middleware/verifyAdmin.js');
// 1. System admin can add vehicles (trucks)
router.post('/vehicles'/*,verifyAdmin*/, async (req, res) => {
    try {
        const { registration_number, type, capacity, fuel_cost_loaded, fuel_cost_unloaded } = req.body;
        
        // Insert the new vehicle into the database
        const query = 'INSERT INTO vehicles (registration_number, type, capacity, fuel_cost_loaded, fuel_cost_unloaded) VALUES ($1, $2, $3, $4, $5) RETURNING *';
        const newVehicle = await pool.query(query, [registration_number, type, capacity, fuel_cost_loaded, fuel_cost_unloaded]);
        
        res.json(newVehicle.rows[0]); // Return the newly created vehicle
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

// 2. System admin can create STS (Sanitary Transfer Station)
router.post('/sts', async (req, res) => {
    try {
        const { ward_number, capacity, gps_coordinates } = req.body;
        
        // Insert the new STS into the database
        const query = 'INSERT INTO sts (ward_number, capacity, gps_coordinates) VALUES ($1, $2, $3) RETURNING *';
        const newSTS = await pool.query(query, [ward_number, capacity, gps_coordinates]);
        
        res.json(newSTS.rows[0]); // Return the newly created STS
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

// 3. System admin can assign one STS manager for each STS
router.post('/sts/:stsId/manager', async (req, res) => {
    try {
        const { stsId } = req.params;
        const { userId } = req.body; // Assuming only one manager is assigned in a single request

      

        // Insert the manager assignment into the database
        const query = 'INSERT INTO sts_managers (sts_id, user_id) VALUES ($1, $2)';
        await pool.query(query, [stsId, userId]);
        
        res.json({ message: 'STS manager assigned successfully' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

// 4. System admin can assign one truck to each STS
router.post('/sts/:stsId/truck'/*,verifyAdmin*/, async (req, res) => {
    try {
        const { stsId } = req.params;
        const { vehicleId } = req.body; // Assuming only one truck is assigned in a single request


        // Insert the truck assignment into the database
        const query = 'INSERT INTO sts_trucks (sts_id, vehicle_id) VALUES ($1, $2)';
        await pool.query(query, [stsId, vehicleId]);
        
        res.json({ message: 'Truck assigned to STS successfully' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});
//5.STS Managers adding entry of vehicles leaving the STS
//5.STS Managers adding entry of vehicles leaving the STS
router.post('/sts/:stsId/truck/dumping', async (req, res) => {
    try {
        const { stsId } = req.params;
        const { vehicle_id, weight_of_waste, departure_time } = req.body;

        // Validate input data if necessary

        // Insert the entry into the database
        const query = 'INSERT INTO sts_truck_dumping_entries (sts_id, vehicle_id, weight_of_waste, departure_time) VALUES ($1, $2, $3, $4)';
        await pool.query(query, [stsId, vehicle_id, weight_of_waste,departure_time]);

        res.status(200).json({ message: 'Vehicle entry added successfully' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});
// STS managers updating the arrival time of the vehicle
// STS managers updating the arrival time of the vehicle
router.put('/sts/truck/entries/:entryId/arrivaltime', async (req, res) => {
    try {
        const { entryId } = req.params;
        const { arrival_time } = req.body;

        // Validate input data if necessary

        // Update the arrival_time in the database
        const query = 'UPDATE sts_truck_dumping_entries SET arrival_time = $1 WHERE entry_id = $2';
        await pool.query(query, [arrival_time, entryId]);

        res.status(200).json({ message: 'Arrival time updated successfully' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});



//6. System admin can create landfill sites
router.post('/landfill/sites', async (req, res) => {
    try {
        const { capacity, operational_timespan, gps_coordinates } = req.body;

        // Validate input data if necessary

        // Insert the landfill site into the database
        const query = 'INSERT INTO landfill_sites (capacity, operational_timespan, gps_coordinates) VALUES ($1, $2, $3)';
        await pool.query(query, [capacity, operational_timespan, gps_coordinates]);

        res.status(200).json({ message: 'Landfill site created successfully' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});
//7. System admin can assign managers to each landfill site
router.post('/landfill/sites/:landfillId/managers', async (req, res) => {
    try {
        const { landfillId } = req.params;
        const { managerId } = req.body; // Assuming only one manager is assigned in a single request

        // Insert the manager assignment into the database
        const query = 'INSERT INTO landfill_managers (landfill_id, user_id) VALUES ($1, $2)';
        await pool.query(query, [landfillId, managerId]);

        res.status(200).json({ message: 'Landfill manager assigned successfully' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});
//8. System admin can assign truck dumping to each landfill site
//8. System admin can assign truck dumping to each landfill site
router.post('/landfill/sites/:landfillId/truck/dumping', async (req, res) => {
    try {
        const { landfillId } = req.params;
        const { vehicle_id, weight_of_waste, arrival_time } = req.body;

        // Validate input data if necessary

        // Insert the entry into the database
        const query = 'INSERT INTO landfill_truck_dumping_entries (landfill_id, vehicle_id, weight_of_waste, arrival_time) VALUES ($1, $2, $3, $4)';
        await pool.query(query, [landfillId, vehicle_id, weight_of_waste, arrival_time]);

        res.status(200).json({ message: 'Truck dumping entry added successfully' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});
//9. get all trucks under a STS
router.get('/sts/:stsId/trucks', async (req, res) => {
    try {
        const { stsId } = req.params;

        // Fetch all trucks under the STS
        const query = `SELECT v.* FROM sts_trucks st
                          JOIN vehicles v ON st.vehicle_id = v.vehicle_id
                          WHERE sts_id = $1`;
       
        const { rows } = await pool.query(query, [stsId]);

        res.status(200).json(rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});
//10. get all sts information
router.get('/sts', async (req, res) => {
    try {
        // Fetch all STS
        const query = 'SELECT * FROM sts';
        const { rows } = await pool.query(query);

        res.status(200).json(rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

//11. get all landfill sites information
router.get('/landfill', async (req, res) => {
    try {
        // Fetch all landfill sites
        const query = 'SELECT * FROM landfill_sites';
        const { rows } = await pool.query(query);

        res.status(200).json(rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});
//12. get sts_truck_dumping_entries under a STS where arrival_time is null
router.get('/sts/:stsId/truck/dumping/entries', async (req, res) => {
    try {
        const { stsId } = req.params;

        // Fetch all truck dumping entries under the STS where arrival_time is null
        const query = `SELECT v.registration_number,st.* FROM sts_truck_dumping_entries st JOIN vehicles v ON st.vehicle_id = v.vehicle_id 
        WHERE st.sts_id = $1 AND arrival_time IS NULL`;
        const { rows } = await pool.query(query, [stsId]);

        res.status(200).json(rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});
//13. get sts_truck_dumping_entries under a STS where arrival_time is not null that is reached
router.get('/sts/:stsId/truck/dumping/entries/reached', async (req, res) => {
    try {
        const { stsId } = req.params;

        // Fetch all truck dumping entries under the STS where arrival_time is not null
        const query = `SELECT v.registration_number,st.* FROM sts_truck_dumping_entries st JOIN vehicles v ON st.vehicle_id = v.vehicle_id 
        WHERE st.sts_id = $1 AND arrival_time IS NOT NULL`;
        const { rows } = await pool.query(query, [stsId]);

        res.status(200).json(rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

router.get('/landfill/:landfillId/truck/dumping/entries', async (req, res) => {
    try {
        const { landfillId } = req.params;

        // Fetch all truck dumping entries under the landfill where departure_time is null
        const query = `SELECT v.registration_number,lt.*,st.sts_id AS sts_assignment FROM landfill_truck_dumping_entries lt JOIN vehicles v ON lt.vehicle_id = v.vehicle_id JOIN sts_trucks st ON lt.vehicle_id = st.vehicle_id
        WHERE lt.landfill_id =$1 AND departure_time IS NULL`;
        const { rows } = await pool.query(query, [landfillId]);

        res.status(200).json(rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

//15. get landfill_truck_dumping_entries under a landfill where departure time is not null that is going back
router.get('/landfill/:landfillId/truck/dumping/entries/goingback', async (req, res) => {
    try {
        const { landfillId } = req.params;

        // Fetch all truck dumping entries under the landfill where departure_time is not null
        const query = `SELECT v.registration_number,lt.*,st.sts_id AS sts_assignment FROM landfill_truck_dumping_entries lt JOIN vehicles v ON lt.vehicle_id = v.vehicle_id JOIN sts_trucks st ON lt.vehicle_id = st.vehicle_id
        WHERE lt.landfill_id = $1 AND departure_time IS NOT NULL`;
        const { rows } = await pool.query(query, [landfillId]);

        res.status(200).json(rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

router.put('/landfill/truck/entries/:entryId/departure/time', async (req, res) => {
    try {
        const { entryId } = req.params;
        const { departure_time } = req.body;

        // Validate input data if necessary

        // Update the departure_time in the database
        const query = 'UPDATE landfill_truck_dumping_entries SET departure_time = $1 WHERE entry_id = $2';
        await pool.query(query, [departure_time, entryId]);

        res.status(200).json({ message: 'Departure time updated successfully' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

// get all trucks
router.get('/vehicles/all', async (req, res) => {
    try {
        // Fetch all trucks
        const query = 'SELECT v.*, sts.sts_id AS sts_assignment FROM vehicles v LEFT JOIN sts_trucks st ON v.vehicle_id = st.vehicle_id LEFT JOIN sts ON st.sts_id = sts.sts_id';
        const { rows } = await pool.query(query);

        res.status(200).json(rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});





module.exports = router;