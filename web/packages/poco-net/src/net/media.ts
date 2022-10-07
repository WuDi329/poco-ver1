export interface PocoMediaConnection {
    addTrack(track: MediaStreamTrack, ...streams: MediaStream[]): Promise<void>
    onTrack(callback: (stream: readonly MediaStream[]) => Promise<void>): void;
}