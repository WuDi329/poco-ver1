import express from "express";
import http from "http";
import chalk from "chalk";
import { Server as SocketIOServer, Socket } from "socket.io";

const app = express();
const server = http.createServer(app);
const io = new SocketIOServer(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});
const port = 8080;

const userMap = new Map<string, Socket>();
const pendingPeerConnections = new Set<string>();

io.on("connection", (socket) => {
    console.log("incomming connection...")

    const address = socket.handshake.auth.address as string | undefined;
    const protocol = (socket.conn.transport as any).socket.protocol as string | undefined;

    if (!address || !protocol) {
        socket.send("missing address or protocol field\n")
        socket.disconnect()
        return
    }

    const oldConnection = userMap.get(address);

    if (oldConnection && oldConnection.connected) {
        socket.send("address already in use\n")
        socket.disconnect()
        return
    }

    console.log("User", chalk.green(address), "with protocol", chalk.yellow(protocol), "connected.")

    userMap.set(address, socket);

    socket.on("disconnect", () => {
        console.log("User", chalk.green(address), "disconnected.")

        userMap.delete(address)
    })

    socket.on("peer message", ({ fromAddress, toAddress, payload }: { fromAddress: string, toAddress: string, payload: any }) => {
        if (fromAddress != address) {
            return;
        }

        if (!userMap.has(fromAddress) || !userMap.has(toAddress)) {
            return;
        }

        console.log("message", chalk.green(fromAddress), "->", chalk.yellow(toAddress), ": ", payload)

        const toSocket = userMap.get(toAddress)!;

        toSocket.emit("peer message", { fromAddress, toAddress, payload });
    })

    socket.on("peer event", ({ fromAddress, toAddress, payload, event }: { fromAddress: string, toAddress: string, payload: any, event: string }) => {
        if (fromAddress != address) {
            return;
        }

        if (!userMap.has(fromAddress) || !userMap.has(toAddress)) {
            return;
        }

        console.log("event", chalk.cyan(event), ": ", chalk.green(fromAddress), "->", chalk.yellow(toAddress), ": ", payload)

        const toSocket = userMap.get(toAddress)!;

        toSocket.emit("peer event", { fromAddress, toAddress, payload, event });
    })

    socket.on("peer connection setup", ({ fromAddress, toAddress }: { fromAddress: string, toAddress: string }) => {
        if (fromAddress != address) {
            return;
        }

        if (!userMap.has(fromAddress) || !userMap.has(toAddress)) {
            return;
        }

        const requestId = `${toAddress}-${fromAddress}`;

        if (pendingPeerConnections.has(requestId)) {
            console.log("User", chalk.green(fromAddress), "connected to", chalk.green(toAddress), "successfully.")

            pendingPeerConnections.delete(requestId);

            socket.emit("peer connection established")

            const toSocket = userMap.get(toAddress)!;

            toSocket.emit("peer connection established")
        } else {
            console.log("User", chalk.green(fromAddress), "wants to connect user", chalk.green(toAddress), ".")

            pendingPeerConnections.add(`${fromAddress}-${toAddress}`)

            const toSocket = userMap.get(toAddress)!;

            toSocket.emit("peer connection setup", { fromAddress, toAddress });
        }
    })

    socket.on("peer connection destroy", ({ fromAddress, toAddress }: { fromAddress: string, toAddress: string }) => {
        if (fromAddress != address) {
            return;
        }

        if (!userMap.has(fromAddress) || !userMap.has(toAddress)) {
            return;
        }

        const toSocket = userMap.get(toAddress)!;

        toSocket.emit("peer connection destroy")
    })
})

server.listen(port, () => {
    console.log("server is running at port", chalk.green(port.toString()))
})