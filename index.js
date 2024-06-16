// Import the required modules
const express = require('express');
const { Client } = require('pg');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const bcrypt = require('bcrypt-nodejs');

const dbConfig = require('./db_config');
const { getTrackingRealTime, getVehicleByfleet, getDetailVehicle } = require('./tracking');
const { getProvince } = require('./master_config');
const { getUserData, updateToken } = require('./user');
var noti = require('./backend_sockjs_noti.js');//9004 port socket io

const JWT_TOKEN_SECRET = 'hangman';


const app = express();
app.use(cors());
app.use(bodyParser.json());
app.get('/api/province', async (req, res) => {
  try {
    const data = await getProvince();
    res.json(data);
  } catch (error) {
    res.status(500).send('Internal Server Error');
  }
});

app.post('/api/tracking_realtime_forklift', async (req, res) => {
  try {
    console.log(req.body);
    const { fleetid, fleetname } = req.body;
    // Now you can use fleetid and fleetname as needed
    console.log('Received fleetid:', fleetid);
    console.log('Received fleetname:', fleetname);

    const fleetData = {
      fleetid: fleetid,
      fleetname: fleetname
    };

    // Now you can use fleetData object
    console.log('Received fleet data:', fleetData);
    //validate 

    const data = await getTrackingRealTime(fleetData);
    res.json(data);
  } catch (error) {
    res.status(500).send('Internal Server Error ' + error);
  }
});

app.post('/api/get_vehicle_byfleet', async (req, res) => {
  try {
    console.log(req.body);
    const { fleetid, fleetname } = req.body;
    // Now you can use fleetid and fleetname as needed
    console.log('Received fleetid:', fleetid);
    console.log('Received fleetname:', fleetname);

    const fleetData = {
      fleetid: fleetid,
      fleetname: fleetname
    };

    // Now you can use fleetData object
    console.log('Received fleet data:', fleetData);
    //validate 

    const data = await getVehicleByfleet(fleetData);
    res.json(data);
  } catch (error) {
    res.status(500).send('Internal Server Error ' + error);
  }
});

app.post('/api/get_detail_vehicle', async (req, res) => {
  try {
    console.log(req.body);
    const { fleetid, fleetname } = req.body;
    // Now you can use fleetid and fleetname as needed
    console.log('Received fleetid:', fleetid);
    console.log('Received fleetname:', fleetname);

    const fleetData = {
      fleetid: fleetid,
      fleetname: fleetname
    };

    // Now you can use fleetData object
    console.log('Received fleet data:', fleetData);
    //validate 

    const data = await getDetailVehicle(fleetData);
    res.json(data);
  } catch (error) {
    res.status(500).send('Internal Server Error ' + error);
  }
});

// app.post('/noti', function (req, res)
// {
 
//     var fleet_id = req.body.fleet_id;
//     var message = req.body.message_th;
//     var msg = { mess: 'Welcome to the coolest API on earth! ' + fleet_id + ' ' + message };
//     res.json(msg);

//     noti.broadcast(req.body, fleet_id);


// });



app.post('/api/list_geom', async (req, res) => {
  try {
    console.log(req.body);
    let mocOutput = {
      "station_name": "rtesr",
      "station_type": "1",
      "bound1": "[13.996077402033,100.899890940898]",
      "bound2": "[13.992462597682,100.896189056984]"
    }
    res.json(mocOutput);
    //return mocOutput;
    // const { fleetid, fleetname } = req.body;
    // // Now you can use fleetid and fleetname as needed
    // console.log('Received fleetid:', fleetid);
    // console.log('Received fleetname:', fleetname);

    // const fleetData = {
    //   fleetid: fleetid,
    //   fleetname: fleetname
    // };

    // // Now you can use fleetData object
    // console.log('Received fleet data:', fleetData);
    // //validate 

    // const data = await getDetailVehicle(fleetData);
    //res.json(data);
  } catch (error) {
    res.status(500).send('Internal Server Error ' + error);
  }
});
async function decode_pws(pws, hash) {
  return new Promise((resolve, reject) => {
      bcrypt.compare(pws, hash, (err, res) => {
          if (err) {
              reject(err);
          } else {
              resolve(res);
          }
      });
  });
}
app.post('/api/get_login', async (req, res) => {
  try {
    const { user, pass } = req.body;
    const userObj = {
      user: user,
      pass: pass
    };
    // Fetch user data from the database
    const userData = await getUserData(userObj);
    console.log(userData);

    if (userData) {
      const hashedPassword = userData.hash;
      const passwordMatch = await decode_pws(pass, hashedPassword);
      if (passwordMatch) {
        // Generate JWT token
        const token = jwt.sign({ user: user }, JWT_TOKEN_SECRET, { expiresIn: '1d' });

        // Update token in the database
        const updateId = await updateToken(userData.id, token);
        console.log("updateId:" + updateId);
        // Respond with success message and token
        return res.json({
          success: true,
          message: 'Pass to authenticate token.',
          fleetname: userData.fleetname,
          fleetid: userData.fleetid,
          role: userData.role,
          token: token
        });
      } else {
        // Incorrect password
        return res.status(401).json({ success: false, message: 'Authentication failed. Incorrect password.' });
      }
    } else {
      // User not found
      return res.status(404).json({ success: false, message: 'User not found.' });
    }
  } catch (error) {
    console.error('Error in authentication:', error);
    return res.status(500).send('Internal Server Error');
  }
});




// Set the port for the server to listen on
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
