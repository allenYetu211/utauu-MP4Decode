export declare function getVideoSamplesInterval(mp4BoxTree: any, time?: number): {
    offsetInterVal: any[];
    timeInterVal: any[];
};
export declare function getAudioSamplesInterval(mp4BoxTree: any, videoInterval: any): {
    offsetInterVal: any[];
    timeInterVal: any[];
};
export declare function getNextVideoSamplesInterval(mp4BoxTree: any, sample: any): any;
export declare function getIntervalArray(stssBox: any, stszBox: any): any[];
