const router=require('express').Router();

//const { json } = require('express');
const bcrypt=require('bcrypt');
const pool=require('../connect.js');
const jwtGenerator=require('../utils/jwtGenerator.js');
const validinfo=require('../middleware/validinfo.js');
const authorize=require('../middleware/authorization.js');
const verifyAdmin = require('../middleware/verifyAdmin.js');
const axios = require('axios');


const optimalTrucks = (wasteWeight, trucks, distance) => {
    let sum = 0;
    let distVehicle = trucks.length;
    let cost = 0;
    let ans = [];
    
    for (let i = 0; i < trucks.length; ++i) {
        sum += 3 * trucks[i].capacity;
        cost += 3 * trucks[i].c_loaded;
        ans.push({ vehicle_id: trucks[i].vehicle_id, trip_no: 1, load: trucks[i].capacity });
        ans.push({ vehicle_id: trucks[i].vehicle_id, trip_no: 2, load: trucks[i].capacity });
        ans.push({ vehicle_id: trucks[i].vehicle_id, trip_no: 3, load: trucks[i].capacity });
    }
    
    if (sum <= wasteWeight) {
        return { waste: sum, perKMcost: cost, totalCost: (distance / 1000) * cost, vehicle_count: distVehicle, fleet: ans };
    }
    
    for (let s = 0; s < (1 << (3 * trucks.length)); ++s) {
        let initCost = 0;
        const vehics = new Set();
        let currT = [];
        
        for (let j = 0; j < (3 * trucks.length); ++j) {
            if (s >>> j & 1) {
                let bb = Math.floor(j / 3);
                initCost += trucks[bb].c_unloaded;
                currT.push(trucks[bb]);
                vehics.add(bb + 1);
            }
        }
        
        trucks.sort((a, b) => {
            const ratioA = (a.c_loaded - a.c_unloaded) / a.capacity;
            const ratioB = (b.c_loaded - b.c_unloaded) / b.capacity;
            return ratioA - ratioB;
        });
        
        let needs = wasteWeight;
        let here = [];
        
        for (let j = 0; j < (currT.length) && needs > 0; ++j) {
            initCost += (Math.min(needs, currT[j].capacity) / currT[j].capacity) * (currT[j].c_loaded - currT[j].c_unloaded);
            let trip_no = 1;
            
            if (here.length > 0 && here[here.length - 1].vehicle_id === currT[j].vehicle_id) {
                trip_no = here[here.length - 1].trip_no + 1;
            }
            
            here.push({ vehicle_id: currT[j].vehicle_id, trip_no: trip_no, load: Math.min(needs, currT[j].capacity) });
            needs -= Math.min(needs, currT[j].capacity);
        }
        
        if (needs > 0) continue;
        
        if (initCost < cost) {
            cost = initCost;
            ans = here;
        } else if (initCost === cost && distVehicle > vehics.size) {
            distVehicle = vehics.size;
            ans = here;
        }
    }
    
    console.log(cost);
    return { waste: wasteWeight, perKMcost: cost, totalCost: (distance / 1000) * cost, vehicle_count: distVehicle, fleet: ans };
};

const getDistanceAndDuration = async (origin, destination) => {
    const apiKey = 'AIzaSyDhWd7YOYxisQq0w3PUntlSsTvUBDyNDPM'; // Replace with your actual API key
    const url = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${origin}&destinations=${destination}&key=${apiKey}`;
    
    try {
        const response = await axios.get(url);
        //const distanceText = response.data.rows[0].elements[0].distance.text;
        //const durationText = response.data.rows[0].elements[0].duration.text;
        const distanceValue = response.data.rows[0].elements[0].distance.value; // In meters
        return { distanceValue };
    } catch (error) {
        console.error('Error fetching distance and duration:', error);
        throw error; // Rethrow the error to handle it in the calling function
    }
};

router.post('/:sts_id', async (req, res) => {
    const { sts_id } = req.params;
    const { wasteWeight, landfill_id } = req.body;

    await pool.query(
        `SELECT * FROM sts_trucks NATURAL JOIN vehicles WHERE sts_id = ${sts_id}`,
        async (err, results) => {
            if (err) {
                console.error('Error fetching trucks:', err);
                return res.status(500).json({ message: 'Internal server error' });
            }

            let trucks = [];

            for (let i = 0; i < results.rows.length; ++i) {
                trucks.push({
                    vehicle_id: Number(results.rows[i].vehicle_id),
                    capacity: Number(results.rows[i].capacity),
                    c_unloaded: Number(results.rows[i].fuel_cost_unloaded),
                    c_loaded: Number(results.rows[i].fuel_cost_loaded),
                });
            }

            const stsCoordinatesQuery = 'SELECT gps_coordinates FROM sts WHERE sts_id = $1';
            const landfillCoordinatesQuery = 'SELECT gps_coordinates FROM landfill_sites WHERE landfill_id = $1';
            const stsCoordinatesResult = await pool.query(stsCoordinatesQuery, [sts_id]);
            const landfillCoordinatesResult = await pool.query(landfillCoordinatesQuery, [landfill_id]);

            if (stsCoordinatesResult.rows.length === 0 || landfillCoordinatesResult.rows.length === 0) {
                return res.status(404).json({ message: 'STS or landfill not found' });
            }

            const stsCoordinates = stsCoordinatesResult.rows[0].gps_coordinates.split(',');
            const landfillCoordinates = landfillCoordinatesResult.rows[0].gps_coordinates.split(',');

            const origin = `${stsCoordinates[0]},${stsCoordinates[1]}`;
            const destination = `${landfillCoordinates[0]},${landfillCoordinates[1]}`;

            try {
                const optimalRoute = await getDistanceAndDuration(origin, destination);
                const ans = optimalTrucks(wasteWeight, trucks, optimalRoute.distanceValue);
                return res.status(200).json(ans);
            } catch (error) {
                console.error('Error:', error);
                return res.status(500).json({ message: 'Internal server error' });
            }
        }
    );
});






module.exports=router;