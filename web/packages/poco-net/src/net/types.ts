import { ManagerOptions, SocketOptions } from "socket.io-client";
import { PocoConnection, PocoPeerConnection } from "./connection";

//规定type为“websocket，webrtc，socketio”其中一种
export type PocoConnectionType = "websocket" | "webrtc" | "socketIO"

export class UnknownPocoConnectionTypeError extends Error {
    public type: string;

    constructor(type: string) {
        super(`unknown connection type ${type}`);
        this.type = type;
    }
}

export class PocoConnectionClosedError extends Error {
    public connection: PocoConnection;

    constructor(connection: PocoConnection) {
        super(`connection is closed`)

        this.connection = connection;
    }
}


export class PocoConnectionTimeoutError extends Error {
    public connection: PocoConnection;

    constructor(connection: PocoConnection) {
        super(`connection timeout`)

        this.connection = connection;
    }
}

export type Address = string;
export type PocoConnectionStatus = "closed" | "connected" | "connecting" | "disconnected" | "failed" | "new";

export type PocoSocketIOConnectionOptions = {
    type: "socketIO";
    uri: string;
} & Partial<ManagerOptions> & Partial<SocketOptions>;

export type PocoConnectionOptions = { localAddress: Address; } & PocoSocketIOConnectionOptions;

export type PocoPeerSocketIOConnectionOptions = {
    type: "socketIO",
    connection: PocoConnection,
    timeout: number;
}

export type PocoPeerWebRTCConnectionOptions = {
    type: "webrtc";
    connection: PocoPeerConnection;
    offer?: RTCSessionDescriptionInit;
    rtcConfiguration?: RTCConfiguration
    rtcOfferOptions?: RTCOfferOptions
    rtcAnswerOptions?: RTCAnswerOptions
};

export type PocoPeerConnectionOptions = { remoteAddress: Address } & (PocoPeerSocketIOConnectionOptions | PocoPeerWebRTCConnectionOptions)