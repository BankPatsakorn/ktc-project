// var http = require('http');
// var sockjs = require('sockjs');

// // Import required utility modules

// // Define the port for WebSocket server
// var port_sock = 9004;

// // Clients list
// var clients = {};

// // Broadcast message to all clients in a room
// function broadcast(message, room_id) {
//     console.log("broadcast");
//     for (var client in clients) {
//         if (clients[client].room == room_id) {
//             clients[client].write(JSON.stringify(message));
//         }
//     }
// }

// // Create a SockJS server
// var echo = sockjs.createServer();

// // Handle new connections
// echo.on('connection', function (conn) {
//     console.log("connect");
//     // Add the client to the clients object
//     clients[conn.id] = conn;
//     console.log(conn);
//     // Send a welcome message to the client
//     var send = {
//         message: 'ktc_welcome',
//         users: 'demo',
//         time: "",
//         username: 'test'
//     };
//     conn.write(JSON.stringify(send));

//     // Handle incoming data from the client
//     conn.on('data', function (msg) {
//         var json = JSON.parse(msg);
//         conn.room = json.room;
//         conn.username = json.username;
//         broadcast(json, conn.room);
//     });

//     // Handle connection close
//     conn.on('close', function() {
//         delete clients[conn.id];
//     });
// });

// // Create an HTTP server
// var server = http.createServer();

// // Integrate SockJS and listen on /chat
// echo.installHandlers(server, { prefix: '/chat' });

// // Start the server
// server.listen(port_sock);
// //console.log(server);
// // Export the broadcast function
// exports.broadcast = broadcast;
