// tracking.js

const { Client } = require('pg');
const dbConfig = require('./db_config'); // Assuming you've moved the database configuration to db_config.js

// Create a new PostgreSQL client with your configuration
const client = new Client({
  user: dbConfig.user,
  host: dbConfig.host,
  database: dbConfig.database,
  password: dbConfig.password,
  port: dbConfig.port
});

// Connect to the database
client.connect()
  .then(() => {
    console.log('Connected to the database from tracking module');
  })
  .catch(err => {
    console.error('Error connecting to the database from tracking module:', err);
  });

// Define a function to handle the database query for real-time forklift tracking
async function getUserData(userObj) {
    try {
      // Connect to the database
      const sql = `
        SELECT id, fleetid, fleetname, password AS hash, token, get_rolename(role::int) AS role
        FROM master_fleet
        WHERE fleetname = $1`;
  
      // Execute the SQL query
      const result = await client.query(sql, [userObj.user]);
  
      //const result = await client.query(query);
      // Release the client back to the pool
      //client.release();
      if (result.rows.length > 0) {
        return result.rows[0];
      } else {
        return null;
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
      throw error;
    }
  }


// Function to update token in the database for the user with userId
async function updateToken(userId, token) {
    try {
        const sql = `
        UPDATE master_fleet
        SET token = $1
        WHERE id = $2
        RETURNING id`;
  
        const result = await client.query(sql, [token, userId]);
        return result.rows[0].id;

    } catch (error) {
      console.error('Error updating token:', error);
      throw error;
    }
  }
  

module.exports = { getUserData , updateToken };
