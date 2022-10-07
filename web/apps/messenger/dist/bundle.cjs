(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? factory(require('express'), require('node:http'), require('chalk'), require('socket.io')) :
    typeof define === 'function' && define.amd ? define(['express', 'node:http', 'chalk', 'socket.io'], factory) :
    (global = typeof globalThis !== 'undefined' ? globalThis : global || self, factory(global.express, global.http, global.chalk, global.socket_io));
})(this, (function (express, http, chalk, socket_io) { 'use strict';

    function _interopDefaultLegacy (e) { return e && typeof e === 'object' && 'default' in e ? e : { 'default': e }; }

    var express__default = /*#__PURE__*/_interopDefaultLegacy(express);
    var http__default = /*#__PURE__*/_interopDefaultLegacy(http);
    var chalk__default = /*#__PURE__*/_interopDefaultLegacy(chalk);

    const app = express__default["default"]();
    const server = http__default["default"].createServer(app);
    const io = new socket_io.Server(server, {
        cors: {
            origin: "*",
            methods: ["GET", "POST"]
        }
    });
    const port = 8080;
    const userMap = new Map();
    io.on("connection", (socket) => {
        console.log("incomming connection...");
        const address = socket.handshake.auth.address;
        const protocol = socket.conn.transport.socket.protocol;
        if (!address || !protocol) {
            socket.send("missing address or protocol field\n");
            socket.disconnect();
            return;
        }
        const oldConnection = userMap.get(address);
        if (oldConnection && oldConnection.connected) {
            socket.send("address already in use\n");
            socket.disconnect();
            return;
        }
        console.log("User", chalk__default["default"].green(address), "with protocol", chalk__default["default"].yellow(protocol), "connected.");
        userMap.set(address, socket);
        socket.on("disconnect", () => {
            console.log("User", chalk__default["default"].green(address), "disconnected.");
            userMap.delete(address);
        });
        socket.on("peer message", (args) => {
            if (args.length < 1)
                return;
            const { fromAddress, toAddress, payload } = args[0];
            if (fromAddress != address) {
                return;
            }
            if (!userMap.has(fromAddress) || !userMap.has(toAddress)) {
                return;
            }
            const toSocket = userMap.get(toAddress);
            toSocket.emit("peer message", { fromAddress, toAddress, payload });
        });
        socket.on("peer event", (args) => {
            if (args.length < 1)
                return;
            const { fromAddress, toAddress, payload, event } = args[0];
            if (fromAddress != address) {
                return;
            }
            if (!userMap.has(fromAddress) || !userMap.has(toAddress)) {
                return;
            }
            const toSocket = userMap.get(toAddress);
            toSocket.emit("peer event", { fromAddress, toAddress, payload, event });
        });
        socket.on("setup peer connection", (args) => {
            if (args.length < 1)
                return;
            console.log(args);
            const { fromAddress, toAddress } = args[0];
            if (fromAddress != address) {
                return;
            }
            if (!userMap.has(fromAddress) || !userMap.has(toAddress)) {
                return;
            }
            console.log("User", chalk__default["default"].green(fromAddress), "wants to connect user", chalk__default["default"].green(toAddress));
            // const toSocket = userMap.get(toAddress)!;
            // toSocket.emit("connect", { fromAddress, toAddress });
            socket.emit("peer connection established");
        });
    });
    server.listen(port, () => {
        console.log("server is running at port", chalk__default["default"].green(port.toString()));
    });

}));
//# sourceMappingURL=bundle.cjs.map
