export default function mdhd(buffer: any): {
    version: number;
    flags: number;
    creationTime: number;
    modificationTime: number;
    timescale: number;
    duration: number;
    languageString: string;
};
