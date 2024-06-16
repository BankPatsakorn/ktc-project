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
const getTrackingRealTime = async (fleetData) => {
    console.log(fleetData);
    try {
        // Prepare SELECT query

        var object = { "db_name": fleetData.fleetid, 'fleetname': fleetData.fleetname, "vehicle_tracking": [] };


        let sql = `SELECT DISTINCT r.modem_id, mcv.vehiclename AS vehicle_name, get_carlicence(r.modem_id) AS car_licence,
        idate(gps_datetime) AS gps_datetime, lon, lat, speed, get_speed_limit(r.modem_id) AS speedmax, direction,
        altitude, satelites, message_id, input_status, output_status,
        r.analog_input1, r.analog_input2,
        tambol, etambol, amphur, eamphur, province, eprovince,
        idate(time_server_fin) AS time_server, angle, r.oil_percent, r.oil_liter,
        status, status || '_' || angle AS heading, status || '_' || angle AS status_angle,
        get_model_device(r.modem_id) AS model_device,
        COALESCE(driver_prefix || ' ' || driver_name || ' ' || driver_surname, '') AS driver_name,
        COALESCE(driver_id, '') AS driver_id, COALESCE(driver_no, '') AS driver_no,
        COALESCE(SUBSTR(driver_type, 1, 2), '') AS driver_type,
        COALESCE(CASE WHEN driver_sex = '1' THEN 'ชาย' WHEN driver_sex = '2' THEN 'หญิง' END, '') AS driver_sex_th,
        COALESCE(CASE WHEN driver_sex = '1' THEN 'Male' WHEN driver_sex = '2' THEN 'Female' END, '') AS driver_sex_en,
        COALESCE(driver_birthcard, '') AS driver_birthcard, COALESCE(driver_expirecard, '') AS driver_expirecard,
        get_has_card_reader(r.modem_id) AS has_card_reader,
        r.analog_input1 AS batterry, rfid,
        forklift_person_code(rfid) AS person_code,
        forklift_person_name(rfid) AS person_name,
        forklift_organization_unit(rfid) AS organization_unit,
        allmin_norun + allmin_run + r.forklift_minute_working_today AS working_hour,
        allmin_norun AS working_norun,
        '0' AS mileage,
        idate(timer_rfid_update) AS scan_datetime,
        forklift_phone(rfid) AS phone,
        forklift_email(rfid) AS email,
        COALESCE(forklift_min_bat, '0') AS min_bat, COALESCE(forklift_max_bat, '0') AS max_bat,
        forklift_can_speed_motor AS can_speed_motor, forklift_can_volt_batt AS can_volt_batt,
        forklift_can_percent_batt AS can_percent_batt, forklift_can_temp_batt AS can_temp_batt, forklift_can_speed AS can_speed
        FROM realtime AS r, setup_vehicle AS sv, master_config_vehicle AS mcv, master_vehicle_model AS mvm`;

        const resultMaster = await is_master_fleet(fleetData.fleetname);
        if (resultMaster) {
            console.log(resultMaster);
            if (resultMaster.master_fleet == '1') {
                sql += " WHERE sv.modem_id=r.modem_id  ";
                sql += " AND sv.fleetid = mcv.db_name ";
                sql += " AND sv.modem_id = mcv.modem_id ";
                sql += " AND sv.fleetcode=get_fleetid($1)"
                sql += " AND mcv.vehicle_model_id::int=mvm.vehiclemodelid::int ";
                sql += " ORDER BY mcv.vehiclename ASC ";

            }
            else {
                sql += " WHERE r.modem_id=sv.modem_id AND sv.fleetcode=get_fleetid($1)";
                sql += " AND sv.fleetid = mcv.db_name ";
                sql += " AND sv.modem_id = mcv.modem_id ";
                sql += " AND mcv.vehicle_model_id::int=mvm.vehiclemodelid::int ";
                sql += " ORDER BY mcv.vehiclename ASC   ";
            }
        }
        //return "";
        // Execute SELECT query
        console.log("start query");
        const startTime = new Date();
        console.log("Start time:", startTime);
        const result = await client.query(sql, [fleetData.fleetname]);
        const endTime = new Date();
        console.log("End query");
        console.log("End time:", endTime);
        console.log("Query duration:", endTime - startTime, "ms");
        object.vehicle_tracking = result.rows;
        return object;
    } catch (error) {
        console.error('Error executing SELECT query from tracking module:', error);
        throw error;
    }
};


// Define a function to handle the database query for real-time forklift tracking
const getVehicleByfleet = async (fleetData) => {
    console.log(fleetData);
    try {
        var object = { "db_name": fleetData.fleetid, 'fleetname': fleetData.fleetname, "vehicle_tracking": [] };
        let sql = '';

        if (object.fleetname != 'ocsb') {

            sql += " SELECT DISTINCT r.modem_id, get_vehiclename_fleet(r.modem_id, r.fleet_id) AS vehicle_name  ";
            sql += " FROM realtime AS r, master_vehicle AS msv, setup_vehicle AS sv, master_fleet AS mf ";
            sql += " WHERE r.modem_id = sv.modem_id ";
            sql += " AND sv.fleetcode = (SELECT id FROM master_fleet WHERE fleetname = $1) ";
            sql += " AND mf.id = sv.fleetcode ";
            sql += " AND sv.vehicleid = msv.vehicleid  ";
            sql += " AND get_vehiclename(r.modem_id) != '1234' ";
            sql += " ORDER BY vehicle_name ASC ";
        }
        else {
            const resultMaster = await is_master_fleet(fleetData.fleetname);
            if (resultMaster) {
                console.log(resultMaster.master_fleet);
                if (resultMaster.master_fleet) {
                    // Do something if master fleet
                    sql = "";
                    sql += "     WITH result as( ";
                    sql += " SELECT DISTINCT r.modem_id ";
                    sql += " ,get_vehiclename_fleet(r.modem_id,r.fleet_id) as vehicle_name,camera_url  ";
                    sql += " FROM	realtime as r, setup_vehicle as sv ";
                    sql += "     WHERE	r.modem_id=sv.modem_id ";
                    sql += "     AND sv.fleetid=($1) ";
                    sql += " )  ";
                    sql += " (SELECT modem_id,vehicle_name FROM result WHERE camera_url !='' ORDER BY get_vehiclename(modem_id)) ";
                    sql += "  UNION ALL ";
                    sql += " (SELECT modem_id,vehicle_name FROM result WHERE  camera_url IS NULL ORDER BY vehicle_name) ";

                } else {
                    sql = "";
                    sql += "     WITH result as( ";
                    sql += " SELECT DISTINCT r.modem_id ";
                    sql += " ,get_vehiclename_fleet(r.modem_id,r.fleet_id) as vehicle_name,camera_url  ";
                    sql += " FROM	realtime as r, setup_vehicle as sv ";
                    sql += "     WHERE	r.modem_id=sv.modem_id ";
                    sql += "    AND sv.fleetcode=get_fleetid($1) ";
                    sql += " )  ";
                    sql += " (SELECT modem_id,vehicle_name FROM result WHERE camera_url !='' ORDER BY get_vehiclename(modem_id)) ";
                    sql += "  UNION ALL ";
                    sql += " (SELECT modem_id,vehicle_name FROM result WHERE  camera_url IS NULL ORDER BY vehicle_name) ";

                }

                const result = await client.query(sql, [fleetData.fleetname]);
                object.vehicle_tracking = result.rows;
                return object;

            }
        }

        const result = await client.query(sql, [fleetData.fleetname]);

        return result.rows;
    } catch (error) {
        console.error('Error executing SELECT query from tracking module:', error);
        throw error;
    }
}




// Define a function to handle the database query for real-time forklift tracking
const getDetailVehicle = async (fleetData) => {
    console.log(fleetData);
    try {
        var object = { "db_name": fleetData.fleetid, 'fleetname': fleetData.fleetname, "vehicle_tracking": [] };
        let sql = '';
        sql += " SELECT ";
        sql += "  vb.vehiclebrandid,vb.vehiclebrand,vm.vehiclemodelid,vm.vehiclemodel_name ";
        sql += " ,vt.Vehicletypeid,vt.vehicletype ";
        sql += " ,vm.emptygauge,vm.fullgauge,vm.oiltank ";
        sql += " ,x.xvehiclebrandid as vbrand_id,x.xVehicletypeid as vtype_id,'1' as sim_brand ";
        sql += " FROM master_vehicle_brand as vb,master_vehicle_model as vm ";
        sql += " ,master_vehicle_type as vt ";
        sql += " ,fn_tb_getbrand_vehicle(vm.vehiclemodelid::INTEGER) as x ";
        sql += " WHERE vb.vehiclebrandid = vm.vehiclebrandid ";
        sql += " AND vm.vehicletypeid=vt.vehicletypeid ";
        const result = await client.query(sql);

        return result.rows;
    } catch (error) {
        console.error('Error executing SELECT query from tracking module:', error);
        throw error;
    }
}


// Define a function to handle the database query for real-time forklift tracking
const listGeom = async (fleetData) => {
    console.log(fleetData);
    try {
        var object = { "db_name": fleetData.fleetid, 'fleetname': fleetData.fleetname, "vehicle_tracking": [] };
        let sql = '';

        const resultMaster = await is_master_fleet(fleetData.fleetname);
        if (resultMaster) {
            console.log(resultMaster.master_fleet);
            if (resultMaster.master_fleet) {
                switch(fleetData.fleet_id){
                    case 'db_10020' : {
                     rscl.list_geom_ratchaburi(req, res);
                    }
                    break;
                    case 'db_10021' : {
                       rscl.list_geom_ratchaburi(req, res);
                    }
                    break;
                    default : { 
                      
        
                    }
                    break;
                }
        
            }else
            {

            }
        } else {
        }


        sql += " SELECT ";
        sql += "  vb.vehiclebrandid,vb.vehiclebrand,vm.vehiclemodelid,vm.vehiclemodel_name ";
        sql += " ,vt.Vehicletypeid,vt.vehicletype ";
        sql += " ,vm.emptygauge,vm.fullgauge,vm.oiltank ";
        sql += " ,x.xvehiclebrandid as vbrand_id,x.xVehicletypeid as vtype_id,'1' as sim_brand ";
        sql += " FROM master_vehicle_brand as vb,master_vehicle_model as vm ";
        sql += " ,master_vehicle_type as vt ";
        sql += " ,fn_tb_getbrand_vehicle(vm.vehiclemodelid::INTEGER) as x ";
        sql += " WHERE vb.vehiclebrandid = vm.vehiclebrandid ";
        sql += " AND vm.vehicletypeid=vt.vehicletypeid ";
        const result = await client.query(sql);

        return result.rows;
    } catch (error) {
        console.error('Error executing SELECT query from tracking module:', error);
        throw error;
    }
}




const is_master_fleet = async (fleet_name) => {
    var sql = ` SELECT coalesce(masterfleet,'0') as master_fleet FROM master_fleet WHERE fleetname = $1 `;

    const result = await client.query(sql, [fleet_name]);
    return result.rows[0];
}


module.exports = { getTrackingRealTime, getVehicleByfleet, getDetailVehicle };
