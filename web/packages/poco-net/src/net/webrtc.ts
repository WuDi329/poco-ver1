import { PocoConnection, PocoPeerConnection } from "./connection";
import { Address, PocoConnectionClosedError, PocoConnectionStatus, PocoPeerWebRTCConnectionOptions } from "./types";
import _ from "lodash";
import { PocoMediaConnection } from "./media";

export class PocoPeerWebRTCConnection extends PocoPeerConnection implements PocoMediaConnection {
    protected rtcConnection: RTCPeerConnection;
    protected peerConnection: PocoConnection;

    protected options: Partial<PocoPeerWebRTCConnectionOptions>;

    constructor(localAddress: Address, remoteAddress: Address, peerConnection: PocoPeerConnection, opts?: Partial<PocoPeerWebRTCConnectionOptions>) {
        super("webrtc", localAddress, remoteAddress)

        this.options = _.defaults(opts, {
            rtcConfiguration: {
                iceServers: [
                    {
                        urls: "stun:stun.l.google.com:19302"
                    }
                ]
            }
        });

        this.rtcConnection = new RTCPeerConnection(this.options.rtcConfiguration);
        this.rtcConnection.addEventListener("icecandidate", (event) => {
            if (event.candidate && this.rtcConnection.remoteDescription) {
                this.peerConnection.emit("webrtc candidate", event.candidate)
            }
        })

        this.rtcConnection.addEventListener("iceconnectionstatechange", (event) => {
            this.setStatus(this.rtcConnection.connectionState)

            switch (this.rtcConnection.iceConnectionState) {
                case "closed":
                case "failed":
                case "disconnected":
                    this.cleanup();
            }
        });

        this.rtcConnection.addEventListener("signalingstatechange", (event) => {
            switch (this.rtcConnection.signalingState) {
                case "closed":
                    this.cleanup();
            }
        })

        this.rtcConnection.addEventListener("icegatheringstatechange", () => {

        })

        this.rtcConnection.addEventListener("connectionstatechange", (event) => {
            this.setStatus(this.rtcConnection.connectionState)
        })

        this.peerConnection = peerConnection;


        this.peerConnection.onEvent("webrtc answer", async (answer: RTCSessionDescriptionInit) => {
            const description = new RTCSessionDescription(answer);

            await this.rtcConnection.setRemoteDescription(description);
        })

        this.peerConnection.onEvent("webrtc candidate", async (candidateOpts: RTCIceCandidateInit) => {
            const candidate = new RTCIceCandidate(candidateOpts);

            await this.rtcConnection.addIceCandidate(candidate)
        })

        this.peerConnection.onEvent("webrtc close", async () => {
            this.cleanup();
        })
    }

    async connect(): Promise<void> {
        if (this.peerConnection.status() === "new") {
            await this.peerConnection.connect();
        }

        if (this.peerConnection.status() !== "connected") {
            throw new PocoConnectionClosedError(this.peerConnection);
        }

        if (this.options.offer) {
            this.onOffer(this.options.offer)
        } else {
            const offer = await this.rtcConnection.createOffer(this.options?.rtcOfferOptions);

            await this.rtcConnection.setLocalDescription(offer);
            await this.peerConnection.emit("webrtc offer", this.rtcConnection.localDescription);
        }
    }

    cleanup() {
        this.rtcConnection.ontrack = null;
        this.rtcConnection.onicecandidate = null;
        this.rtcConnection.oniceconnectionstatechange = null;
        this.rtcConnection.onicegatheringstatechange = null;
        this.rtcConnection.onsignalingstatechange = null;
        this.rtcConnection.onnegotiationneeded = null;

        this.rtcConnection.close()
    }

    async disconnect(): Promise<void> {
        this.peerConnection.emit("webrtc close", {});

        this.cleanup();
    }

    private async onOffer(offer: RTCSessionDescriptionInit) {
        const description = new RTCSessionDescription(offer);

        await this.rtcConnection.setRemoteDescription(description);

        const answer = await this.rtcConnection.createAnswer(this.options?.rtcAnswerOptions);

        await this.rtcConnection.setLocalDescription(answer);

        await this.peerConnection.emit("webrtc answer", this.rtcConnection.localDescription);
    }

    async addTrack(track: MediaStreamTrack, ...streams: MediaStream[]) {
        this.rtcConnection.addTrack(track, ...streams);
    }

    onTrack(callback: (stream: readonly MediaStream[]) => Promise<void>): void {
        this.rtcConnection.ontrack = (e) => {
            callback(e.streams)
        };
    }

    status(): PocoConnectionStatus {
        return this.rtcConnection.connectionState;
    }

    send<T>(payload: T): Promise<void> {
        throw new Error("Method not implemented.");
    }

    emit<T>(event: string, payload: T): Promise<void> {
        throw new Error("Method not implemented.");
    }

    onMessage<T>(callback: (payload: T) => Promise<void>): void {
        throw new Error("Method not implemented.");
    }

    onEvent<T>(event: string, callback: (payload: T) => Promise<void>, once?: boolean | undefined): void {
        throw new Error("Method not implemented.");
    }
}