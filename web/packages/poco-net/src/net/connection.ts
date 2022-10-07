import _ from "lodash";
import { PocoConnectionType, Address, PocoConnectionStatus } from "./types";

//第一版的PocoConnection，没有eventsmap类型
export abstract class PocoConnection {
    public connectionType: PocoConnectionType; //"socketIO" | "webrtc" | "websocket"
    public localAddress: Address;
    protected connectionStatus: PocoConnectionStatus; //"closed" | "connected" | "connecting" | "disconnected" | "failed" | "new"
    //后续将callback和eventnames一起放在listeners里面，这里是一个状态+connection对应一个callback
    protected connectionStatusCallback: ((status: PocoConnectionStatus, connection: PocoConnection) => Promise<void>)[];

    constructor(connectionType: PocoConnectionType, localAddress: Address) {
        this.connectionType = connectionType;
        this.localAddress = localAddress;
        this.connectionStatus = "new";
        this.connectionStatusCallback = [];
    }

    abstract connect(): Promise<void>
    abstract disconnect(): Promise<void>
    //后续版本中，将这个方法直接实现了：return this.connectionStatus
    abstract status(): PocoConnectionStatus;

    protected setStatus(status: PocoConnectionStatus): void {
        this.connectionStatus = status;

        for (const callback of this.connectionStatusCallback) {
            callback(status, this)
        }
    }

    //后面的版本删除了onStatusChange方法，全部集成到了setStatus
    onStatusChange(callback: (status: PocoConnectionStatus, connection: PocoConnection) => Promise<void>): void {
        if (this.connectionStatusCallback.find(e => e == callback))
            return;

        this.connectionStatusCallback.push(callback);
    }

    //后来将payload具体为PocoObject，并且扩展返回值的可能
    abstract send<T>(payload: T): Promise<void>
    abstract emit<T>(event: string, payload: T): Promise<void>;
    abstract onMessage<T>(callback: (payload: T) => Promise<void>): void;
    abstract onEvent<T>(event: string, callback: (payload: T) => Promise<void>, once?: boolean): void;
}


//多了一个remoteAddress
export abstract class PocoPeerConnection extends PocoConnection {
    public remoteAddress: Address;

    constructor(connectionType: PocoConnectionType, localAddress: Address, remoteAddress: Address) {
        super(connectionType, localAddress);

        this.remoteAddress = remoteAddress;
    }
}