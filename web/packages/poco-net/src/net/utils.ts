import { PocoConnection, PocoPeerConnection } from "./connection";
import { PocoSocketIOConnection, PocoPeerSocketIOConnection } from "./socketIO";
import { PocoConnectionOptions, PocoPeerConnectionOptions, UnknownPocoConnectionTypeError } from "./types";
import { PocoPeerWebRTCConnection } from "./webrtc";

export async function createPocoConnection(opts: PocoConnectionOptions): Promise<PocoConnection> {
    if (opts.type === "socketIO") {
        //直接创建了没有peer的socketioconnection
        return new PocoSocketIOConnection(opts.localAddress, opts);
    }

    throw new UnknownPocoConnectionTypeError(opts.type)
}

export async function createPocoPeerConnection(opts: PocoPeerConnectionOptions): Promise<PocoPeerConnection> {
    if (opts.type === "socketIO") {
        return new PocoPeerSocketIOConnection(opts.connection.localAddress, opts.remoteAddress, opts.connection, opts);
    } else if (opts.type === "webrtc") {
        return new PocoPeerWebRTCConnection(opts.connection.localAddress, opts.remoteAddress, opts.connection as PocoPeerConnection, opts)
    }

    // @ts-ignore
    throw new UnknownPocoConnectionTypeError(opts.type)
}