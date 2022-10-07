<script setup lang="ts">
import { $ref } from "vue/macros"
import * as poco from "poco-net";
import { PocoPeerWebRTCConnection } from "poco-net/dist/net";

let localAddress = $ref("")
let remoteAddress = $ref("")
let history = $ref("");
let message = $ref("");
let localVideo = $ref<HTMLVideoElement>();
let remoteVideo = $ref<HTMLVideoElement>();

let localStream: MediaStream;
let remoteStream: MediaStream;

let socket: poco.net.PocoConnection;
let peer: poco.net.PocoPeerConnection;
let rtc: poco.net.PocoPeerWebRTCConnection;

const createConnection = async () => {
    socket = await poco.net.createPocoConnection({
        type: "socketIO",
        uri: "http://localhost:8080",
        localAddress,
    });

    socket.onEvent("peer connection setup", async ({ fromAddress, toAddress }: { fromAddress: string, toAddress: string }) => {
        history += `peer connection request from ${fromAddress}\n`

        if (toAddress != localAddress) {
            return;
        }

        remoteAddress = fromAddress;

        peer = await poco.net.createPocoPeerConnection({
            type: "socketIO",
            remoteAddress,
            connection: socket,
            timeout: 5000
        })

        peer.onMessage(async (payload: any) => {
            history += `${payload}\n`
        })

        peer.onEvent("webrtc offer", async (offer: RTCSessionDescriptionInit) => {
            rtc = new poco.net.PocoPeerWebRTCConnection(peer.remoteAddress, peer.localAddress, peer, {
                offer: offer
            });

            rtc.onStatusChange(async (status) => {
                history += `rtc status: ${status}\n`
            })

            rtc.onTrack(async (streams) => {
                remoteVideo.srcObject = streams[0]
            })

            localStream = await navigator.mediaDevices.getDisplayMedia({

            })

            localVideo.srcObject = localStream;


            localStream.getTracks().forEach(track => {
                rtc.addTrack(track, localStream)
            })

            await rtc.connect();
        })


        await peer.connect();
    })

    socket.onEvent("peer connection established", async () => {
        history += `peer connection established\n`
    })

    await socket.connect();
}

const createPeerConnection = async () => {
    peer = await poco.net.createPocoPeerConnection({
        type: "socketIO",
        remoteAddress,
        connection: socket,
        timeout: 5000
    })

    peer.onMessage(async (payload: any) => {
        history += `${payload}\n`
    })

    peer.onEvent("webrtc offer", async (offer: RTCSessionDescriptionInit) => {
        rtc = new poco.net.PocoPeerWebRTCConnection(peer.remoteAddress, peer.localAddress, peer, {
            offer: offer
        });

        rtc.onStatusChange(async (status) => {
            history += `rtc status: ${status}\n`
        })

        rtc.onTrack(async (streams) => {
            remoteVideo.srcObject = streams[0]
        })

        localStream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: false
        })


        localStream.getTracks().forEach(track => {
            rtc.addTrack(track, localStream)
        })

        await rtc.connect();
    })

    await peer.connect();
}

const sendMessage = async () => {
    if (peer.status() != "connected") return;

    const messageToSend = message.trim();

    if (messageToSend.length === 0) return;

    peer.send(messageToSend);
}

const createWebRTCPeerConnection = async () => {
    localStream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: false
    })

    localVideo.srcObject = localStream;

    rtc = await poco.net.createPocoPeerConnection({
        type: "webrtc",
        remoteAddress,
        connection: peer
    }) as PocoPeerWebRTCConnection

    localStream.getTracks().forEach(track => {
        rtc.addTrack(track, localStream)
    })

    rtc.onTrack(async (streams) => {
        remoteVideo.srcObject = streams[0]
    })

    rtc.onStatusChange(async (status) => {
        history += `rtc status: ${status}\n`
    })

    await rtc.connect();
}

</script>

<template>
    <div class="p-8">
        <div class="flex">
            <div class="flex-grow">
                <div class="flex h-12 items-center">
                    <div>Local Address: </div>
                    <input type="text" v-model="localAddress" class="border mx-2" />
                    <button @click="createConnection"
                        class="bg-purple-500 rounded-md px-4 text-white py-2 text-sm hover:bg-purple-300">connect</button>
                </div>
                <div class="flex h-12 items-center">
                    <div>Remote Address: </div>
                    <input type="text" v-model="remoteAddress" class="border mx-2" />
                    <button @click="createPeerConnection"
                        class="bg-purple-500 rounded-md px-4 text-white py-2 text-sm hover:bg-purple-300">connect</button>
                </div>
                <div class="flex h-12 items-center">
                    <div class="pr-2">WebRTC Connection: </div>
                    <button @click="createWebRTCPeerConnection"
                        class="bg-purple-500 rounded-md px-4 text-white py-2 text-sm hover:bg-purple-300">connect</button>
                </div>
                <div class="flex h-12 items-center">
                    <div>Message</div>
                    <input type="text" v-model="message" class="border mx-2" />
                    <button @click="sendMessage"
                        class="bg-purple-500 rounded-md px-4 text-white py-2 text-sm hover:bg-purple-300">send</button>
                </div>
                <div class="flex flex-col justify-center">
                    <div>History: </div>
                    <textarea v-model="history" class="border w-72 h-64 mt-2"></textarea>
                </div>
            </div>
            <div class="flex-grow">
                <h2 class="py-2 text-lg">Local Video:</h2>
                <div class="relative w-[400px] h-[300px] bg-black my-2">
                    <video ref="localVideo" width="400" height="300" autoplay></video>
                </div>
                <h2 class="py-2 text-lg">Remote Video:</h2>
                <div class="relative w-[400px] h-[300px] bg-black my-2">
                    <video ref="remoteVideo" width="400" height="300" autoplay></video>
                </div>
            </div>
        </div>
    </div>
</template>