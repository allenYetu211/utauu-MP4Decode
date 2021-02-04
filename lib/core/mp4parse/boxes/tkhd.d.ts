export default function tkhd(buffer: any): {
    version: number;
    flags: number;
    creationTime: number;
    modificationTime: number;
    trackID: number;
    duration: number;
    layer: number;
    alternateGroup: number;
    volume: number;
    matrix: any[];
    width: number;
    height: number;
};
