// master_config.js

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
    console.log('Connected to the database from master_config module');
  })
  .catch(err => {
    console.error('Error connecting to the database from master_config module:', err);
  });

// Define a function to handle the database query for provinces
const getProvince = async () => {
  try {
    // Prepare SELECT query
    const query = `SELECT id, tname, ename FROM master_province ORDER BY id`;

    // Execute SELECT query
    const result = await client.query(query);
    return result.rows;
  } catch (error) {
    console.error('Error executing SELECT query from master_config module:', error);
    throw error;
  }
};

module.exports = { getProvince };
