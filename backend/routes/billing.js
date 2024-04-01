const router=require('express').Router();

//const { json } = require('express');
const bcrypt=require('bcrypt');
const pool=require('../connect.js');
const jwtGenerator=require('../utils/jwtGenerator.js');
const validinfo=require('../middleware/validinfo.js');
const authorize=require('../middleware/authorization.js');
const axios=require('axios')

const math = require('mathjs');

// Function to calculate distance between two GPS coordinates (
const getDistanceAndDuration = async (origin, destination) => {
    const apiKey = 'AIzaSyDhWd7YOYxisQq0w3PUntlSsTvUBDyNDPM'; // Make sure to use your actual API key here
    const url = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${origin}&destinations=${destination}&key=${apiKey}`;
    try {
        const response = await axios.get(url);
        const distanceText = response.data.rows[0].elements[0].distance.text;
        const durationText = response.data.rows[0].elements[0].duration.text;
        const distanceValue = response.data.rows[0].elements[0].distance.value; // In meters
        return { distanceText, durationText, distanceValue };
    } catch (error) {
        console.error('Error fetching distance and duration:', error);
        throw error; // Rethrow the error to handle it in the calling function
    }
};


// Calculate fuel allocation and generate slip
// Calculate fuel allocation and generate slip
router.post('/generate/slip', async (req, res) => {
    try {
        // Extract necessary data from the request body
        const { weightOfWaste, vehicleId, stsId, landfillId } = req.body;

        // Fetch vehicle details to calculate fuel allocation
        const vehicleQuery = 'SELECT * FROM vehicles WHERE vehicle_id = $1';
        const vehicleResult = await pool.query(vehicleQuery, [vehicleId]);
        if (vehicleResult.rows.length === 0) {
            return res.status(404).json({ message: 'Vehicle not found' });
        }
        const { registration_number, fuel_cost_loaded, fuel_cost_unloaded } = vehicleResult.rows[0];

        // Calculate cost per kilometer for the journey based on load
        const unloadedCost = parseFloat(fuel_cost_unloaded);
const loadedCost = parseFloat(fuel_cost_loaded);
const loadFactor = 3 / 5; // This is already a float due to the division operation
const journeyCost = unloadedCost + (loadFactor * (loadedCost - unloadedCost));
console.log(journeyCost);


        // Fetch GPS coordinates of STS and Landfill
        const stsCoordinatesQuery = 'SELECT gps_coordinates FROM sts WHERE sts_id = $1';
        const landfillCoordinatesQuery = 'SELECT gps_coordinates FROM landfill_sites WHERE landfill_id = $1';
        const stsCoordinatesResult = await pool.query(stsCoordinatesQuery, [stsId]);
        const landfillCoordinatesResult = await pool.query(landfillCoordinatesQuery, [landfillId]);
        
        if (stsCoordinatesResult.rows.length === 0 || landfillCoordinatesResult.rows.length === 0) {
            return res.status(404).json({ message: 'STS or landfill not found' });
        }

        // Extract GPS coordinates from the query results
        const stsCoordinates = stsCoordinatesResult.rows[0].gps_coordinates.split(',');
        const landfillCoordinates = landfillCoordinatesResult.rows[0].gps_coordinates.split(',');

        const origin = `${stsCoordinates[0]},${stsCoordinates[1]}`; // Format: "lat,lng"
        const destination = `${landfillCoordinates[0]},${landfillCoordinates[1]}`; // Format: "lat,lng"
        
        // Await the function call to get distance and duration
        const { distanceText, durationText, distanceValue } = await getDistanceAndDuration(origin, destination);
        
        const distanceInKm = distanceValue/1000; 

        // Calculate total fuel allocation for the journey
        const fuelAllocationCost = journeyCost * distanceInKm;

        // Generate slip with relevant details
        const slip = {
            
            vehicleId,
            registration_number,
            weightOfWaste,
            stsId,
            landfillId,
            fuelAllocationCost
        };

       

        // Respond with the generated slip
        res.json({ slip });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});


module.exports = router;

