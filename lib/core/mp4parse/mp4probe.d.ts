export default class MP4Probe {
    mp4BoxTree: any;
    mp4Data: any;
    videoInterval: any;
    audioInterval: any;
    timeRange: any;
    bufferStart: any;
    constructor(mp4BoxTree: any);
    init: () => void;
    isDraining: (time: any) => boolean;
    getMP4Data(): void;
    updateInterval: (time: any) => void;
    getFragmentPosition: (time: any) => any[];
    getTrackInfo: (mdatBuffer: any) => {
        videoTrackInfo: {
            samples: any;
            trackId: number;
        };
        audioTrackInfo: {
            samples: any;
            trackId: number;
        };
    };
    getSamples: () => {
        videoSamples: any[];
        audioSamples: any[];
    };
}
