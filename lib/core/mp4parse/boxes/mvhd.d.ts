export default function mvhd(buffer: any): {
    version: number;
    flags: number;
    creationTime: number;
    modificationTime: number;
    timescale: number;
    duration: number;
    rate: number;
    volume: number;
    matrix: any[];
    nextTrackID: number;
};
