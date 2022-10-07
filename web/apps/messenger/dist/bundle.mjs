import express from 'express';
import http from 'node:http';
import chalk from 'chalk';
import { Server } from 'socket.io';

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
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
    console.log("User", chalk.green(address), "with protocol", chalk.yellow(protocol), "connected.");
    userMap.set(address, socket);
    socket.on("disconnect", () => {
        console.log("User", chalk.green(address), "disconnected.");
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
        console.log("User", chalk.green(fromAddress), "wants to connect user", chalk.green(toAddress));
        // const toSocket = userMap.get(toAddress)!;
        // toSocket.emit("connect", { fromAddress, toAddress });
        socket.emit("peer connection established");
    });
});
server.listen(port, () => {
    console.log("server is running at port", chalk.green(port.toString()));
});
//# sourceMappingURL=bundle.mjs.map
