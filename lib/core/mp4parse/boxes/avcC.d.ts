export default function avcC(buffer: any): {
    configurationVersion: number;
    AVCProfileIndication: number;
    profileCompatibility: number;
    AVCLevelIndication: number;
    lengthSizeMinusOne: number;
    SPS: any[];
    PPS: any[];
};
