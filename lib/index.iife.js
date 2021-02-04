
(function(l, r) { if (l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (window.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(window.document);
(function () {
    'use strict';

    /*! *****************************************************************************
    Copyright (c) Microsoft Corporation. All rights reserved.
    Licensed under the Apache License, Version 2.0 (the "License"); you may not use
    this file except in compliance with the License. You may obtain a copy of the
    License at http://www.apache.org/licenses/LICENSE-2.0

    THIS CODE IS PROVIDED ON AN *AS IS* BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
    KIND, EITHER EXPRESS OR IMPLIED, INCLUDING WITHOUT LIMITATION ANY IMPLIED
    WARRANTIES OR CONDITIONS OF TITLE, FITNESS FOR A PARTICULAR PURPOSE,
    MERCHANTABLITY OR NON-INFRINGEMENT.

    See the Apache Version 2.0 License for specific language governing permissions
    and limitations under the License.
    ***************************************************************************** */

    var __assign = function() {
        __assign = Object.assign || function __assign(t) {
            for (var s, i = 1, n = arguments.length; i < n; i++) {
                s = arguments[i];
                for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p)) t[p] = s[p];
            }
            return t;
        };
        return __assign.apply(this, arguments);
    };

    function __values(o) {
        var m = typeof Symbol === "function" && o[Symbol.iterator], i = 0;
        if (m) return m.call(o);
        return {
            next: function () {
                if (o && i >= o.length) o = void 0;
                return { value: o && o[i++], done: !o };
            }
        };
    }

    function __read(o, n) {
        var m = typeof Symbol === "function" && o[Symbol.iterator];
        if (!m) return o;
        var i = m.call(o), r, ar = [], e;
        try {
            while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
        }
        catch (error) { e = { error: error }; }
        finally {
            try {
                if (r && !r.done && (m = i["return"])) m.call(i);
            }
            finally { if (e) throw e.error; }
        }
        return ar;
    }

    function __spread() {
        for (var ar = [], i = 0; i < arguments.length; i++)
            ar = ar.concat(__read(arguments[i]));
        return ar;
    }

    var endBytes = 200000;
    // const rRange = /(\d+)-(\d+)\/(\d+)/;
    var ffetch = (function (_a) {
        var url = _a.url, _b = _a.start, start = _b === void 0 ? 0 : _b, _c = _a.end, end = _c === void 0 ? endBytes : _c;
        return new Promise(function (response, reject) {
            fetch(url, {
                headers: {
                    Range: "bytes=" + start + "-" + end
                }
            }).then(function (res) {
                response(res);
            }).catch(function (error) {
                reject(error);
            });
        });
    });

    var Stream = /** @class */ (function () {
        function Stream(buffer) {
            this.buffer = null;
            this.position = 0;
            this.buffer = buffer;
        }
        Stream.prototype.readType = function (length) {
            if (length === void 0) { length = 4; }
            // 判断类型为什么长度是4？
            // mp4box中类型描述为4个字符，截取4个创建对应的字符如：moov，ftyp。
            var typeBuffer = [];
            var i = 0;
            while (i < length) {
                i++;
                // 遍历type类型
                typeBuffer.push(this.buffer[this.position++]);
            }
            // 静态 String.fromCharCode() 方法返回由指定的 UTF-16 代码单元序列创建的字符串。   String.fromCodePoint()相同效果
            // fromCharCode()fromCharCode() 可接受一个指定的 Unicode 值
            return String.fromCharCode.apply(null, typeBuffer);
        };
        Stream.prototype.readByte = function (length) {
            switch (length) {
                case 1: {
                    return this.readOneByte();
                }
                case 2: {
                    return this.readTwoByte();
                }
                case 3: {
                    return this.readThreeByte();
                }
                case 4: {
                    return this.readFourByte();
                }
                default: {
                    return 0;
                }
            }
        };
        Stream.prototype.readOneByte = function () {
            return this.buffer[this.position++] >>> 0;
        };
        Stream.prototype.readTwoByte = function () {
            return (((this.buffer[this.position++] << 8) | this.buffer[this.position++]) >>> 0);
        };
        Stream.prototype.readThreeByte = function () {
            return (((this.buffer[this.position++] << 16) |
                (this.buffer[this.position++] << 8) |
                this.buffer[this.position++]) >>>
                0);
        };
        Stream.prototype.readFourByte = function () {
            return (((this.buffer[this.position++] << 24) |
                (this.buffer[this.position++] << 16) |
                (this.buffer[this.position++] << 8) |
                this.buffer[this.position++]) >>> 0);
        };
        return Stream;
    }());

    function ftyp(buffer) {
        var stream = new Stream(buffer);
        var majorBrand = stream.readType();
        var minorVersion = stream.readByte(4);
        var compatibleBrands = [];
        for (var i = stream.position; i < buffer.length; i += 4) {
            compatibleBrands.push(stream.readType(4));
        }
        var ftypBox = {
            majorBrand: majorBrand,
            minorVersion: minorVersion,
            compatibleBrands: compatibleBrands,
        };
        return ftypBox;
    }

    function mvhd(buffer) {
        var stream = new Stream(buffer);
        var version = stream.readByte(1);
        var flags = stream.readByte(3);
        var creationTime = stream.readByte(4);
        var modificationTime = stream.readByte(4);
        var timescale = stream.readByte(4);
        var duration = stream.readByte(4);
        var rate = stream.readByte(4);
        var volume = stream.readByte(1);
        // reserved
        stream.readByte(3);
        stream.readByte(4);
        stream.readByte(4);
        var matrix = [];
        for (var i = 0; i < 36; i += 4) {
            matrix.push(stream.readByte(4));
        }
        // preDefined
        for (var i = 0; i < 24; i += 4) {
            stream.readByte(4);
        }
        var nextTrackID = stream.readByte(4);
        var mvhdBox = {
            version: version,
            flags: flags,
            creationTime: creationTime,
            modificationTime: modificationTime,
            timescale: timescale,
            duration: duration,
            rate: rate,
            volume: volume,
            matrix: matrix,
            nextTrackID: nextTrackID,
        };
        return mvhdBox;
    }

    function tkhd(buffer) {
        var stream = new Stream(buffer);
        var version = stream.readByte(1);
        var flags = stream.readByte(3);
        var creationTime = stream.readByte(4);
        var modificationTime = stream.readByte(4);
        var trackID = stream.readByte(4);
        // reserved
        stream.readByte(4);
        var duration = stream.readByte(4);
        // reserved
        stream.readByte(4);
        stream.readByte(4);
        var layer = stream.readByte(2);
        var alternateGroup = stream.readByte(2);
        var volume = stream.readByte(2);
        // reserved
        stream.readByte(2);
        var matrix = [];
        for (var i = 0; i < 36; i += 4) {
            matrix.push(stream.readByte(4));
        }
        var width = Number(stream.readByte(2) + "." + stream.readByte(2));
        var height = Number(stream.readByte(2) + "." + stream.readByte(2));
        var tkhdBox = {
            version: version,
            flags: flags,
            creationTime: creationTime,
            modificationTime: modificationTime,
            trackID: trackID,
            duration: duration,
            layer: layer,
            alternateGroup: alternateGroup,
            volume: volume,
            matrix: matrix,
            width: width,
            height: height,
        };
        return tkhdBox;
    }

    function elst(buffer) {
        var stream = new Stream(buffer);
        var version = stream.readByte(1);
        var flags = stream.readByte(3);
        var entryCount = stream.readByte(4);
        var entries = [];
        for (var i = 0; i < entryCount; ++i) {
            var segmentDuration = stream.readByte(4);
            var mediaTime = stream.readByte(4);
            // 0xffffffff -> -1
            if (mediaTime === 4294967295) {
                mediaTime = -1;
            }
            var mediaRateInteger = stream.readByte(2);
            var mediaRateFraction = stream.readByte(2);
            entries.push({
                segmentDuration: segmentDuration,
                mediaTime: mediaTime,
                mediaRateInteger: mediaRateInteger,
                mediaRateFraction: mediaRateFraction,
            });
        }
        var elstBox = {
            version: version,
            flags: flags,
            entries: entries,
        };
        return elstBox;
    }

    function mdhd(buffer) {
        var stream = new Stream(buffer);
        var version = stream.readByte(1);
        var flags = stream.readByte(3);
        var creationTime = stream.readByte(4);
        var modificationTime = stream.readByte(4);
        var timescale = stream.readByte(4);
        var duration = stream.readByte(4);
        var language = stream.readByte(2);
        var field = [];
        field[0] = (language >> 10) & 0x1f;
        field[1] = (language >> 5) & 0x1f;
        field[2] = language & 0x1f;
        var languageString = String.fromCharCode(0x60 + field[0], 0x60 + field[1], 0x60 + field[2]);
        // preDefined
        stream.readByte(2);
        var mdhdBox = {
            version: version,
            flags: flags,
            creationTime: creationTime,
            modificationTime: modificationTime,
            timescale: timescale,
            duration: duration,
            languageString: languageString,
        };
        return mdhdBox;
    }

    function hdlr(buffer) {
        var stream = new Stream(buffer);
        var version = stream.readByte(1);
        var flags = stream.readByte(3);
        // preDefined
        stream.readByte(4);
        var handlerType = stream.readType().toString();
        var handlerType2 = stream.readType().toString();
        // reserved
        stream.readByte(4);
        stream.readByte(4);
        var name = [];
        var c;
        while ((c = stream.readByte(1)) !== 0x00) {
            name.push(String.fromCharCode(c));
        }
        var hdlrBox = {
            version: version,
            flags: flags,
            handlerType: handlerType,
            handlerType2: handlerType2 || 0,
            name: name.join(''),
        };
        return hdlrBox;
    }

    function vmhd(buffer) {
        var stream = new Stream(buffer);
        var version = stream.readByte(1);
        var flags = stream.readByte(3);
        var graphicsmode = stream.readByte(2);
        var opcolor = new Array(3).fill(stream.readByte(2));
        var vmhdBox = {
            version: version,
            flags: flags,
            graphicsmode: graphicsmode,
            opcolor: opcolor,
        };
        return vmhdBox;
    }

    function dref(buffer) {
        var stream = new Stream(buffer);
        var version = stream.readByte(1);
        var flags = stream.readByte(3);
        var entryCount = stream.readByte(4);
        var urlBox = [];
        var urlBuffer = stream.buffer.slice(8);
        var newStream = new Stream(urlBuffer);
        var MP4Box$1 = new MP4Box();
        for (var i = 0; i < entryCount; i++) {
            MP4Box$1.readSize(newStream);
            MP4Box$1.readType(newStream);
            MP4Box$1.readBody(newStream);
            urlBox.push(MP4Box$1.box);
        }
        var drefBox = {
            version: version,
            flags: flags,
            url: urlBox,
        };
        return drefBox;
    }

    function url(buffer) {
        var stream = new Stream(buffer);
        var version = stream.readByte(1);
        var flags = stream.readByte(3);
        var urlBox = {
            version: version,
            flags: flags,
        };
        return urlBox;
    }

    function stsd(buffer) {
        var _a;
        var stream = new Stream(buffer);
        var version = stream.readByte(1);
        var flags = stream.readByte(3);
        var entryCount = stream.readByte(4);
        var box = [];
        var avc1Buffer = stream.buffer.slice(8);
        var newStream = new Stream(avc1Buffer);
        var MP4Box$1 = new MP4Box();
        var type = 'avc1';
        for (var i = 0; i < entryCount; i++) {
            MP4Box$1.readSize(newStream);
            MP4Box$1.readType(newStream);
            MP4Box$1.readBody(newStream);
            box.push(MP4Box$1.box);
            type = MP4Box$1.type;
        }
        var stsdBox = (_a = {
                version: version,
                flags: flags
            },
            _a[type] = box,
            _a);
        return stsdBox;
    }

    function avc1(buffer) {
        var stream = new Stream(buffer);
        // reserved
        stream.readByte(4);
        stream.readByte(2);
        var dataReferenceIndex = stream.readByte(2);
        // preDefined
        stream.readByte(2);
        // reserved
        stream.readByte(2);
        // preDefined
        stream.readByte(4);
        stream.readByte(4);
        stream.readByte(4);
        var width = stream.readByte(2);
        var height = stream.readByte(2);
        var horizresolution = stream.readByte(4);
        var vertresolution = stream.readByte(4);
        // reserved
        stream.readByte(4);
        var frameCount = stream.readByte(2);
        var compressorname = stream.readType(32);
        var depth = stream.readByte(2);
        // preDefined
        stream.readByte(2);
        var avcCBuffer = stream.buffer.slice(78);
        var newStream = new Stream(avcCBuffer);
        var MP4Box$1 = new MP4Box();
        MP4Box$1.readSize(newStream);
        MP4Box$1.readType(newStream);
        MP4Box$1.readBody(newStream);
        var avcCBox = MP4Box$1.box;
        var avc1Box = {
            dataReferenceIndex: dataReferenceIndex,
            width: width,
            height: height,
            horizresolution: horizresolution,
            vertresolution: vertresolution,
            frameCount: frameCount,
            compressorname: compressorname,
            depth: depth,
            avcC: avcCBox,
        };
        return avc1Box;
    }

    function avcC(buffer) {
        var stream = new Stream(buffer);
        var configurationVersion = stream.readByte(1);
        var AVCProfileIndication = stream.readByte(1);
        var profileCompatibility = stream.readByte(1);
        var AVCLevelIndication = stream.readByte(1);
        var lengthSizeMinusOne = stream.readByte(1) & 0x3;
        var numOfSequenceParameterSets = stream.readByte(1) & 31;
        var SPS = [];
        for (var i = 0; i < numOfSequenceParameterSets; i++) {
            var length_1 = stream.readByte(2);
            SPS.push.apply(SPS, __spread(stream.buffer.slice(stream.position, stream.position + length_1)));
            stream.position += length_1;
        }
        var numOfPictureParameterSets = stream.readByte(1);
        var PPS = [];
        for (var i = 0; i < numOfPictureParameterSets; i++) {
            var length_2 = stream.readByte(2);
            PPS.push.apply(PPS, __spread(stream.buffer.slice(stream.position, stream.position + length_2)));
            stream.position += length_2;
        }
        var avcCBox = {
            configurationVersion: configurationVersion,
            AVCProfileIndication: AVCProfileIndication,
            profileCompatibility: profileCompatibility,
            AVCLevelIndication: AVCLevelIndication,
            lengthSizeMinusOne: lengthSizeMinusOne,
            SPS: SPS,
            PPS: PPS,
        };
        return avcCBox;
    }

    function stts(buffer) {
        var stream = new Stream(buffer);
        var version = stream.readByte(1);
        var flags = stream.readByte(3);
        var entryCount = stream.readByte(4);
        var samples = [];
        for (var i = 0; i < entryCount; i++) {
            var sampleCount = stream.readByte(4);
            var sampleDelta = stream.readByte(4);
            samples.push({
                sampleCount: sampleCount,
                sampleDelta: sampleDelta,
            });
        }
        var sttsBox = {
            version: version,
            flags: flags,
            samples: samples,
        };
        return sttsBox;
    }

    function stss(buffer) {
        var stream = new Stream(buffer);
        var version = stream.readByte(1);
        var flags = stream.readByte(3);
        var entryCount = stream.readByte(4);
        var samples = [];
        for (var i = 0; i < entryCount; i++) {
            samples.push({ sampleNumber: stream.readByte(4) });
        }
        var stssBox = {
            version: version,
            flags: flags,
            samples: samples,
        };
        return stssBox;
    }

    function ctts(buffer) {
        var stream = new Stream(buffer);
        var version = stream.readByte(1);
        var flags = stream.readByte(3);
        var entryCount = stream.readByte(4);
        var samples = [];
        for (var i = 0; i < entryCount; i++) {
            samples.push({
                sampleCount: stream.readByte(4),
                sampleOffset: stream.readByte(4),
            });
        }
        var cttsBox = {
            version: version,
            flags: flags,
            samples: samples,
        };
        return cttsBox;
    }

    function mdhd$1(buffer) {
        var stream = new Stream(buffer);
        var version = stream.readByte(1);
        var flags = stream.readByte(3);
        var entryCount = stream.readByte(4);
        var samples = [];
        for (var i = 0; i < entryCount; i++) {
            samples.push({
                firstChunk: stream.readByte(4),
                samplesPerChunk: stream.readByte(4),
                sampleDescriptionIndex: stream.readByte(4),
            });
        }
        var mdhdBox = {
            version: version,
            flags: flags,
            samples: samples,
        };
        return mdhdBox;
    }

    function stss$1(buffer) {
        var stream = new Stream(buffer);
        var version = stream.readByte(1);
        var flags = stream.readByte(3);
        var sampleSize = stream.readByte(4);
        var sampleCount = stream.readByte(4);
        var samples = [];
        for (var i = 0; i < sampleCount; i++) {
            samples.push({ entrySize: stream.readByte(4) });
        }
        var stssBox = {
            version: version,
            flags: flags,
            sampleSize: sampleSize,
            samples: samples,
        };
        return stssBox;
    }

    function stco(buffer) {
        var stream = new Stream(buffer);
        var version = stream.readByte(1);
        var flags = stream.readByte(3);
        var entryCount = stream.readByte(4);
        var samples = [];
        for (var i = 0; i < entryCount; i++) {
            samples.push({ chunkOffset: stream.readByte(4) });
        }
        var stcoBox = {
            version: version,
            flags: flags,
            samples: samples,
        };
        return stcoBox;
    }

    function smhd(buffer) {
        var stream = new Stream(buffer);
        var version = stream.readByte(1);
        var flags = stream.readByte(3);
        var data = [];
        for (var i = 0; i < 4; i++) {
            data.push(stream.readByte(1));
        }
        var smhdBox = {
            version: version,
            flags: flags,
            data: data,
        };
        return smhdBox;
    }

    function mp4a(buffer) {
        var stream = new Stream(buffer);
        // reserved
        stream.readByte(4);
        stream.readByte(2);
        var dataReferenceIndex = stream.readByte(2);
        // preDefined
        stream.readByte(2);
        // reserved
        stream.readByte(2);
        // preDefined
        stream.readByte(4);
        var channelCount = stream.readByte(2);
        var sampleSize = stream.readByte(2);
        // reserved
        stream.readByte(4);
        var sampleRate = stream.readByte(4) / (1 << 16);
        var esdsBuffer = stream.buffer.slice(28);
        var newStream = new Stream(esdsBuffer);
        var MP4Box$1 = new MP4Box();
        MP4Box$1.readSize(newStream);
        MP4Box$1.readType(newStream);
        MP4Box$1.readBody(newStream);
        var esdsBox = MP4Box$1.box;
        var mp4aBox = {
            dataReferenceIndex: dataReferenceIndex,
            channelCount: channelCount,
            sampleSize: sampleSize,
            sampleRate: sampleRate,
            esds: esdsBox,
        };
        return mp4aBox;
    }

    var TAGS = [
        null,
        null,
        null,
        'ESDescrTag',
        'DecoderConfigDescrTag',
        'DecSpecificDescrTag',
    ];
    function esds(buffer) {
        var _a;
        var stream = new Stream(buffer);
        var version = stream.readByte(1);
        var flags = stream.readByte(3);
        var type = TAGS[stream.readByte(1)];
        var esdsBox = (_a = {
                version: version,
                flags: flags
            },
            _a[type] = getESDescrTag(stream),
            _a);
        return esdsBox;
    }
    function getESDescrTag(stream) {
        var data = {};
        var size = stream.readByte(1);
        if (size === 0x80) {
            stream.readByte(2);
            size = stream.readByte(1) + 5;
        }
        else {
            size += 2;
        }
        data.size = size;
        data.ESID = stream.readByte(2);
        data.streamPriority = stream.readByte(1);
        data[TAGS[stream.readByte(1)]] = getDecoderConfigDescrTag(stream);
        data[TAGS[stream.readByte(1)]] = getDecSpecificDescrTag(stream);
        return data;
    }
    function getDecoderConfigDescrTag(stream) {
        var data = {};
        var size = stream.readByte(1);
        if (size === 0x80) {
            stream.readByte(2);
            size = stream.readByte(1) + 5;
        }
        else {
            size += 2;
        }
        data.size = size;
        data.objectTypeIndication = stream.readByte(1);
        var type = stream.readByte(1);
        data.streamType = type & ((1 << 7) - 1);
        data.upStream = type & (1 << 1);
        data.bufferSize = stream.readByte(3);
        data.maxBitrate = stream.readByte(4);
        data.avgBitrate = stream.readByte(4);
        return data;
    }
    function getDecSpecificDescrTag(stream) {
        var data = {};
        var size = stream.readByte(1);
        var dataSize = size;
        if (size === 0x80) {
            stream.readByte(2);
            size = stream.readByte(1) + 5;
            dataSize = size - 5;
        }
        else {
            size += 2;
        }
        data.size = size;
        var EScode = [];
        for (var i = 0; i < dataSize; i++) {
            EScode.push(Number(stream.readByte(1))
                .toString(16)
                .padStart(2, '0'));
        }
        data.audioConfig = EScode.map(function (item) { return Number("0x" + item); });
        return data;
    }

    function meta(buffer) {
        var stream = new Stream(buffer);
        var version = stream.readByte(1);
        var flags = stream.readByte(3);
        var metaBox = {
            version: version,
            flags: flags,
        };
        return metaBox;
    }

    function mdat(buffer) {
        var stream = new Stream(buffer);
        var data = stream.buffer.subarray(stream.position, stream.buffer.length);
        var mdatBox = {
            data: data,
        };
        return mdatBox;
    }

    function sdtp(buffer) {
        var stream = new Stream(buffer);
        var version = stream.readByte(1);
        var flags = stream.readByte(3);
        var samplesFlag = [];
        for (var i = stream.position; i < buffer.length; i++) {
            var tmpByte = stream.readByte(1);
            samplesFlag.push({
                isLeading: tmpByte >> 6,
                dependsOn: (tmpByte >> 4) & 0x3,
                isDepended: (tmpByte >> 2) & 0x3,
                hasRedundancy: tmpByte & 0x3,
            });
        }
        var sdtpBox = {
            version: version,
            flags: flags,
            samplesFlag: samplesFlag,
        };
        return sdtpBox;
    }

    function thmb(buffer) {
        var stream = new Stream(buffer);
        var data = stream.readByte(buffer.length);
        var thmbBox = {
            data: data,
        };
        return thmbBox;
    }

    var boxParse = {
        ftyp: ftyp,
        mvhd: mvhd,
        tkhd: tkhd,
        elst: elst,
        mdhd: mdhd,
        hdlr: hdlr,
        vmhd: vmhd,
        dref: dref,
        'url ': url,
        stsd: stsd,
        avc1: avc1,
        avcC: avcC,
        stts: stts,
        stss: stss,
        ctts: ctts,
        stsc: mdhd$1,
        stsz: stss$1,
        stco: stco,
        smhd: smhd,
        mp4a: mp4a,
        esds: esds,
        meta: meta,
        mdat: mdat,
        sdtp: sdtp,
        thmb: thmb,
    };

    var CONTAINER_BOXES = ['moov', 'trak', 'edts', 'mdia', 'minf', 'dinf', 'stbl'];
    var SPECIAL_BOXES = ['udta', 'free'];
    var MP4Box = /** @class */ (function () {
        function MP4Box() {
            this.start = 0;
            this.size = 0;
            this.type = '';
            this.box = {};
        }
        MP4Box.prototype.readSize = function (stream) {
            // 大小分析
            this.start = stream.position;
            this.size = stream.readByte(4);
        };
        MP4Box.prototype.readType = function (stream) {
            this.type = stream.readType();
        };
        MP4Box.prototype.readBody = function (stream) {
            var _this = this;
            this.data = stream.buffer.slice(stream.position, this.size + this.start);
            // console.log('this.data:::===>>>', this.type);
            // 枚举字段
            if (CONTAINER_BOXES.find(function (item) { return item === _this.type; }) ||
                SPECIAL_BOXES.find(function (item) { return item === _this.type; })) {
                this.parserContainerBox();
            }
            else {
                if (!boxParse[this.type]) {
                    this.box = {};
                }
                else {
                    // 获取 mp4 box 类型
                    // console.log('boxParse[this.type]', this.type);
                    this.box = __assign(__assign({}, this.box), boxParse[this.type](this.data));
                }
                // 修改stream 定位
                stream.position += this.data.length;
            }
        };
        MP4Box.prototype.parserContainerBox = function () {
            var stream = new Stream(this.data);
            var size = stream.buffer.length;
            while (stream.position < size) {
                var Box = new MP4Box();
                Box.readSize(stream);
                Box.readType(stream);
                Box.readBody(stream);
                if (Box.type === 'trak' && Box.box.mdia && Box.box.mdia.hdlr) {
                    var handlerType = Box.box.mdia.hdlr.handlerType;
                    if (handlerType === 'vide') {
                        this.box.videoTrak = Box.box;
                    }
                    else if (handlerType === 'soun') {
                        this.box.audioTrak = Box.box;
                    }
                    else {
                        this.box[handlerType + "Trak"] = Box.box;
                    }
                }
                else {
                    this.box[Box.type] = Box.box;
                }
                // console.log('this.box::', this.box)
            }
        };
        return MP4Box;
    }());

    var Mp4Parse = /** @class */ (function () {
        function Mp4Parse(buffer) {
            this.mp4BoxTreeObject = {};
            this.buffer = buffer;
            this.stream = new Stream(buffer);
            this.init();
        }
        Mp4Parse.prototype.init = function () {
            while (this.stream.position < this.buffer.length) {
                var MP4BOX = new MP4Box();
                MP4BOX.readSize(this.stream);
                MP4BOX.readType(this.stream);
                MP4BOX.readBody(this.stream);
                this.mp4BoxTreeObject[MP4BOX.type] = MP4BOX.box;
                this.mp4BoxTreeObject[MP4BOX.type].size = MP4BOX.size;
            }
        };
        return Mp4Parse;
    }());

    function findBox(mp4BoxTree, type) {
        switch (type) {
            case 'moov':
                return findMoovBox(mp4BoxTree);
            case 'mvhd':
                return findMvhdBox(mp4BoxTree);
            case 'videoTrak':
                return findVideoTrakBox(mp4BoxTree);
            case 'audioTrak':
                return findAudioTrakBox(mp4BoxTree);
            case 'videoTkhd':
                return findVideoTkhdBox(mp4BoxTree);
            case 'audioTkhd':
                return findAudioTkhdBox(mp4BoxTree);
            case 'videoStbl':
                return findVideoStblBox(mp4BoxTree);
            case 'audioStbl':
                return findAudioStblBox(mp4BoxTree);
            case 'videoStsc':
                return findVideoStscBox(mp4BoxTree);
            case 'audioStsc':
                return findAudioStscBox(mp4BoxTree);
            case 'avcC':
                return findAvcCBox(mp4BoxTree);
            case 'esds':
                return findEsdsBox(mp4BoxTree);
            case 'videoStco':
                return findVideoStcoBox(mp4BoxTree);
            case 'audioStco':
                return findAudioStcoBox(mp4BoxTree);
            case 'videoStts':
                return findVideoSttsBox(mp4BoxTree);
            case 'audioStts':
                return findAudioSttsBox(mp4BoxTree);
            case 'audioMdhd':
                return findAudioMdhdBox(mp4BoxTree);
            case 'videoMdhd':
                return findVideoMdhdBox(mp4BoxTree);
            case 'videoStss':
                return findVideoStssBox(mp4BoxTree);
            case 'videoStsz':
                return findVideoStszBox(mp4BoxTree);
            case 'videoCtts':
                return findVideoCttsBox(mp4BoxTree);
            case 'audioStsz':
                return findAudioStszBox(mp4BoxTree);
            case 'mp4a':
                return findMp4aBox(mp4BoxTree);
            case 'audioElst':
                return findAudioElstBox(mp4BoxTree);
            case 'videoElst':
                return findVideoElstBox(mp4BoxTree);
            default:
                return {};
        }
    }
    function findMoovBox(mp4BoxTree) {
        return mp4BoxTree['moov'];
    }
    function findMvhdBox(mp4BoxTree) {
        return findMoovBox(mp4BoxTree)['mvhd'];
    }
    function findVideoTrakBox(mp4BoxTree) {
        return findMoovBox(mp4BoxTree)['videoTrak'];
    }
    function findVideoTkhdBox(mp4BoxTree) {
        return findVideoTrakBox(mp4BoxTree)['tkhd'];
    }
    function findVideoStblBox(mp4BoxTree) {
        return findVideoTrakBox(mp4BoxTree)['mdia']['minf']['stbl'];
    }
    function findAudioTrakBox(mp4BoxTree) {
        return findMoovBox(mp4BoxTree)['audioTrak'];
    }
    function findAudioStblBox(mp4BoxTree) {
        return findAudioTrakBox(mp4BoxTree)['mdia']['minf']['stbl'];
    }
    function findAudioTkhdBox(mp4BoxTree) {
        return findAudioTrakBox(mp4BoxTree)['tkhd'];
    }
    function findVideoStscBox(mp4BoxTree) {
        return findVideoStblBox(mp4BoxTree)['stsc'];
    }
    function findAudioStscBox(mp4BoxTree) {
        return findAudioStblBox(mp4BoxTree)['stsc'];
    }
    function findAvcCBox(mp4BoxTree) {
        return findVideoStblBox(mp4BoxTree)['stsd']['avc1'][0]['avcC'];
    }
    function findMp4aBox(mp4BoxTree) {
        return findAudioStblBox(mp4BoxTree)['stsd']['mp4a'][0];
    }
    function findEsdsBox(mp4BoxTree) {
        return findMp4aBox(mp4BoxTree)['esds'];
    }
    function findVideoStcoBox(mp4BoxTree) {
        return findVideoStblBox(mp4BoxTree)['stco'];
    }
    function findAudioStcoBox(mp4BoxTree) {
        return findAudioStblBox(mp4BoxTree)['stco'];
    }
    function findVideoSttsBox(mp4BoxTree) {
        return findVideoStblBox(mp4BoxTree)['stts'];
    }
    function findAudioSttsBox(mp4BoxTree) {
        return findAudioStblBox(mp4BoxTree)['stts'];
    }
    function findVideoMdhdBox(mp4BoxTree) {
        return findVideoTrakBox(mp4BoxTree)['mdia']['mdhd'];
    }
    function findAudioMdhdBox(mp4BoxTree) {
        return findAudioTrakBox(mp4BoxTree)['mdia']['mdhd'];
    }
    function findVideoStssBox(mp4BoxTree) {
        return findVideoStblBox(mp4BoxTree)['stss'];
    }
    function findVideoStszBox(mp4BoxTree) {
        return findVideoStblBox(mp4BoxTree)['stsz'];
    }
    function findAudioStszBox(mp4BoxTree) {
        return findAudioStblBox(mp4BoxTree)['stsz'];
    }
    function findVideoCttsBox(mp4BoxTree) {
        return findVideoStblBox(mp4BoxTree)['ctts'];
    }
    function findAudioElstBox(mp4BoxTree) {
        return findAudioTrakBox(mp4BoxTree)['edts']['elst'];
    }
    function findVideoElstBox(mp4BoxTree) {
        return findAudioTrakBox(mp4BoxTree)['edts']['elst'];
    }

    function getSamplesOffset(stszBox, stscBoxSamplesPerChunkArray) {
        var samplesOffset = [];
        for (var i = 0, j = 0; i < stscBoxSamplesPerChunkArray.length; i++) {
            if (i + j >= stszBox.samples.length) {
                break;
            }
            samplesOffset.push(stszBox.samples[i + j].entrySize);
            if (stscBoxSamplesPerChunkArray[i] !== 1) {
                for (var flag = 1; flag < stscBoxSamplesPerChunkArray[i]; flag++) {
                    var offset = stszBox.samples[i + flag + j].entrySize +
                        samplesOffset[i + flag - 1 + j];
                    samplesOffset.push(offset);
                }
                j = j + stscBoxSamplesPerChunkArray[i] - 1;
            }
        }
        return samplesOffset;
    }

    function getPerChunkArray(stscBox, end) {
        var stscBoxSamplesPerChunkArray = [];
        var stscSamplesLength = stscBox.samples.length;
        // stsc box
        // firstChunk         1  3  6  7
        // samplesPerChunk    1  2  1  2
        // ↓
        // [1,1,2,2,2,1,2,2]
        for (var i = 0; i < end; i++) {
            if (i !== 0 &&
                i < stscSamplesLength &&
                stscBox.samples[i].firstChunk - 1 !== stscBox.samples[i - 1].firstChunk) {
                i--;
                stscBox.samples[i].firstChunk++;
            }
            // 处理最后一位不是 end 时的情况
            if (i >= stscSamplesLength) {
                if (stscBox.samples[stscSamplesLength - 1] !== 1) {
                    i = i + stscBox.samples[stscSamplesLength - 1].samplesPerChunk - 1;
                }
                stscBoxSamplesPerChunkArray.push(stscBox.samples[stscSamplesLength - 1].samplesPerChunk);
            }
            else {
                stscBoxSamplesPerChunkArray.push(stscBox.samples[i].samplesPerChunk);
            }
        }
        return stscBoxSamplesPerChunkArray;
    }

    function getFragmentPosition(videoSamples, audioSamples, mdatStart, isLastFragmentPosition) {
        var videoSamplesEnd = videoSamples[videoSamples.length - 1].end;
        var videoSamplesStart = 0;
        if (videoSamples.length > 0) {
            videoSamplesStart = videoSamples[0].start;
        }
        // maybe the last GOP dont have audio track
        // 最后一个 GOP 序列可能没有音频轨
        var audioSamplesEnd = 0;
        var audioSamplesStart = Number.MAX_SAFE_INTEGER;
        if (audioSamples.length !== 0) {
            audioSamplesEnd = audioSamples[audioSamples.length - 1].end;
            audioSamplesStart = audioSamples[0].start;
        }
        var fragmentEndPosition = isLastFragmentPosition
            ? ''
            : Math.max(videoSamplesEnd, audioSamplesEnd) + mdatStart;
        var fragmentStartPosition = Math.min(videoSamplesStart, audioSamplesStart) + mdatStart;
        return [fragmentStartPosition, fragmentEndPosition];
    }

    /**
     * Removes all key-value entries from the list cache.
     *
     * @private
     * @name clear
     * @memberOf ListCache
     */
    function listCacheClear() {
      this.__data__ = [];
      this.size = 0;
    }

    var _listCacheClear = listCacheClear;

    /**
     * Performs a
     * [`SameValueZero`](http://ecma-international.org/ecma-262/7.0/#sec-samevaluezero)
     * comparison between two values to determine if they are equivalent.
     *
     * @static
     * @memberOf _
     * @since 4.0.0
     * @category Lang
     * @param {*} value The value to compare.
     * @param {*} other The other value to compare.
     * @returns {boolean} Returns `true` if the values are equivalent, else `false`.
     * @example
     *
     * var object = { 'a': 1 };
     * var other = { 'a': 1 };
     *
     * _.eq(object, object);
     * // => true
     *
     * _.eq(object, other);
     * // => false
     *
     * _.eq('a', 'a');
     * // => true
     *
     * _.eq('a', Object('a'));
     * // => false
     *
     * _.eq(NaN, NaN);
     * // => true
     */
    function eq(value, other) {
      return value === other || (value !== value && other !== other);
    }

    var eq_1 = eq;

    /**
     * Gets the index at which the `key` is found in `array` of key-value pairs.
     *
     * @private
     * @param {Array} array The array to inspect.
     * @param {*} key The key to search for.
     * @returns {number} Returns the index of the matched value, else `-1`.
     */
    function assocIndexOf(array, key) {
      var length = array.length;
      while (length--) {
        if (eq_1(array[length][0], key)) {
          return length;
        }
      }
      return -1;
    }

    var _assocIndexOf = assocIndexOf;

    /** Used for built-in method references. */
    var arrayProto = Array.prototype;

    /** Built-in value references. */
    var splice = arrayProto.splice;

    /**
     * Removes `key` and its value from the list cache.
     *
     * @private
     * @name delete
     * @memberOf ListCache
     * @param {string} key The key of the value to remove.
     * @returns {boolean} Returns `true` if the entry was removed, else `false`.
     */
    function listCacheDelete(key) {
      var data = this.__data__,
          index = _assocIndexOf(data, key);

      if (index < 0) {
        return false;
      }
      var lastIndex = data.length - 1;
      if (index == lastIndex) {
        data.pop();
      } else {
        splice.call(data, index, 1);
      }
      --this.size;
      return true;
    }

    var _listCacheDelete = listCacheDelete;

    /**
     * Gets the list cache value for `key`.
     *
     * @private
     * @name get
     * @memberOf ListCache
     * @param {string} key The key of the value to get.
     * @returns {*} Returns the entry value.
     */
    function listCacheGet(key) {
      var data = this.__data__,
          index = _assocIndexOf(data, key);

      return index < 0 ? undefined : data[index][1];
    }

    var _listCacheGet = listCacheGet;

    /**
     * Checks if a list cache value for `key` exists.
     *
     * @private
     * @name has
     * @memberOf ListCache
     * @param {string} key The key of the entry to check.
     * @returns {boolean} Returns `true` if an entry for `key` exists, else `false`.
     */
    function listCacheHas(key) {
      return _assocIndexOf(this.__data__, key) > -1;
    }

    var _listCacheHas = listCacheHas;

    /**
     * Sets the list cache `key` to `value`.
     *
     * @private
     * @name set
     * @memberOf ListCache
     * @param {string} key The key of the value to set.
     * @param {*} value The value to set.
     * @returns {Object} Returns the list cache instance.
     */
    function listCacheSet(key, value) {
      var data = this.__data__,
          index = _assocIndexOf(data, key);

      if (index < 0) {
        ++this.size;
        data.push([key, value]);
      } else {
        data[index][1] = value;
      }
      return this;
    }

    var _listCacheSet = listCacheSet;

    /**
     * Creates an list cache object.
     *
     * @private
     * @constructor
     * @param {Array} [entries] The key-value pairs to cache.
     */
    function ListCache(entries) {
      var index = -1,
          length = entries == null ? 0 : entries.length;

      this.clear();
      while (++index < length) {
        var entry = entries[index];
        this.set(entry[0], entry[1]);
      }
    }

    // Add methods to `ListCache`.
    ListCache.prototype.clear = _listCacheClear;
    ListCache.prototype['delete'] = _listCacheDelete;
    ListCache.prototype.get = _listCacheGet;
    ListCache.prototype.has = _listCacheHas;
    ListCache.prototype.set = _listCacheSet;

    var _ListCache = ListCache;

    /**
     * Removes all key-value entries from the stack.
     *
     * @private
     * @name clear
     * @memberOf Stack
     */
    function stackClear() {
      this.__data__ = new _ListCache;
      this.size = 0;
    }

    var _stackClear = stackClear;

    /**
     * Removes `key` and its value from the stack.
     *
     * @private
     * @name delete
     * @memberOf Stack
     * @param {string} key The key of the value to remove.
     * @returns {boolean} Returns `true` if the entry was removed, else `false`.
     */
    function stackDelete(key) {
      var data = this.__data__,
          result = data['delete'](key);

      this.size = data.size;
      return result;
    }

    var _stackDelete = stackDelete;

    /**
     * Gets the stack value for `key`.
     *
     * @private
     * @name get
     * @memberOf Stack
     * @param {string} key The key of the value to get.
     * @returns {*} Returns the entry value.
     */
    function stackGet(key) {
      return this.__data__.get(key);
    }

    var _stackGet = stackGet;

    /**
     * Checks if a stack value for `key` exists.
     *
     * @private
     * @name has
     * @memberOf Stack
     * @param {string} key The key of the entry to check.
     * @returns {boolean} Returns `true` if an entry for `key` exists, else `false`.
     */
    function stackHas(key) {
      return this.__data__.has(key);
    }

    var _stackHas = stackHas;

    var commonjsGlobal = typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : {};

    function createCommonjsModule(fn, module) {
    	return module = { exports: {} }, fn(module, module.exports), module.exports;
    }

    /** Detect free variable `global` from Node.js. */
    var freeGlobal = typeof commonjsGlobal == 'object' && commonjsGlobal && commonjsGlobal.Object === Object && commonjsGlobal;

    var _freeGlobal = freeGlobal;

    /** Detect free variable `self`. */
    var freeSelf = typeof self == 'object' && self && self.Object === Object && self;

    /** Used as a reference to the global object. */
    var root = _freeGlobal || freeSelf || Function('return this')();

    var _root = root;

    /** Built-in value references. */
    var Symbol$1 = _root.Symbol;

    var _Symbol = Symbol$1;

    /** Used for built-in method references. */
    var objectProto = Object.prototype;

    /** Used to check objects for own properties. */
    var hasOwnProperty = objectProto.hasOwnProperty;

    /**
     * Used to resolve the
     * [`toStringTag`](http://ecma-international.org/ecma-262/7.0/#sec-object.prototype.tostring)
     * of values.
     */
    var nativeObjectToString = objectProto.toString;

    /** Built-in value references. */
    var symToStringTag = _Symbol ? _Symbol.toStringTag : undefined;

    /**
     * A specialized version of `baseGetTag` which ignores `Symbol.toStringTag` values.
     *
     * @private
     * @param {*} value The value to query.
     * @returns {string} Returns the raw `toStringTag`.
     */
    function getRawTag(value) {
      var isOwn = hasOwnProperty.call(value, symToStringTag),
          tag = value[symToStringTag];

      try {
        value[symToStringTag] = undefined;
        var unmasked = true;
      } catch (e) {}

      var result = nativeObjectToString.call(value);
      if (unmasked) {
        if (isOwn) {
          value[symToStringTag] = tag;
        } else {
          delete value[symToStringTag];
        }
      }
      return result;
    }

    var _getRawTag = getRawTag;

    /** Used for built-in method references. */
    var objectProto$1 = Object.prototype;

    /**
     * Used to resolve the
     * [`toStringTag`](http://ecma-international.org/ecma-262/7.0/#sec-object.prototype.tostring)
     * of values.
     */
    var nativeObjectToString$1 = objectProto$1.toString;

    /**
     * Converts `value` to a string using `Object.prototype.toString`.
     *
     * @private
     * @param {*} value The value to convert.
     * @returns {string} Returns the converted string.
     */
    function objectToString(value) {
      return nativeObjectToString$1.call(value);
    }

    var _objectToString = objectToString;

    /** `Object#toString` result references. */
    var nullTag = '[object Null]',
        undefinedTag = '[object Undefined]';

    /** Built-in value references. */
    var symToStringTag$1 = _Symbol ? _Symbol.toStringTag : undefined;

    /**
     * The base implementation of `getTag` without fallbacks for buggy environments.
     *
     * @private
     * @param {*} value The value to query.
     * @returns {string} Returns the `toStringTag`.
     */
    function baseGetTag(value) {
      if (value == null) {
        return value === undefined ? undefinedTag : nullTag;
      }
      return (symToStringTag$1 && symToStringTag$1 in Object(value))
        ? _getRawTag(value)
        : _objectToString(value);
    }

    var _baseGetTag = baseGetTag;

    /**
     * Checks if `value` is the
     * [language type](http://www.ecma-international.org/ecma-262/7.0/#sec-ecmascript-language-types)
     * of `Object`. (e.g. arrays, functions, objects, regexes, `new Number(0)`, and `new String('')`)
     *
     * @static
     * @memberOf _
     * @since 0.1.0
     * @category Lang
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if `value` is an object, else `false`.
     * @example
     *
     * _.isObject({});
     * // => true
     *
     * _.isObject([1, 2, 3]);
     * // => true
     *
     * _.isObject(_.noop);
     * // => true
     *
     * _.isObject(null);
     * // => false
     */
    function isObject(value) {
      var type = typeof value;
      return value != null && (type == 'object' || type == 'function');
    }

    var isObject_1 = isObject;

    /** `Object#toString` result references. */
    var asyncTag = '[object AsyncFunction]',
        funcTag = '[object Function]',
        genTag = '[object GeneratorFunction]',
        proxyTag = '[object Proxy]';

    /**
     * Checks if `value` is classified as a `Function` object.
     *
     * @static
     * @memberOf _
     * @since 0.1.0
     * @category Lang
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if `value` is a function, else `false`.
     * @example
     *
     * _.isFunction(_);
     * // => true
     *
     * _.isFunction(/abc/);
     * // => false
     */
    function isFunction(value) {
      if (!isObject_1(value)) {
        return false;
      }
      // The use of `Object#toString` avoids issues with the `typeof` operator
      // in Safari 9 which returns 'object' for typed arrays and other constructors.
      var tag = _baseGetTag(value);
      return tag == funcTag || tag == genTag || tag == asyncTag || tag == proxyTag;
    }

    var isFunction_1 = isFunction;

    /** Used to detect overreaching core-js shims. */
    var coreJsData = _root['__core-js_shared__'];

    var _coreJsData = coreJsData;

    /** Used to detect methods masquerading as native. */
    var maskSrcKey = (function() {
      var uid = /[^.]+$/.exec(_coreJsData && _coreJsData.keys && _coreJsData.keys.IE_PROTO || '');
      return uid ? ('Symbol(src)_1.' + uid) : '';
    }());

    /**
     * Checks if `func` has its source masked.
     *
     * @private
     * @param {Function} func The function to check.
     * @returns {boolean} Returns `true` if `func` is masked, else `false`.
     */
    function isMasked(func) {
      return !!maskSrcKey && (maskSrcKey in func);
    }

    var _isMasked = isMasked;

    /** Used for built-in method references. */
    var funcProto = Function.prototype;

    /** Used to resolve the decompiled source of functions. */
    var funcToString = funcProto.toString;

    /**
     * Converts `func` to its source code.
     *
     * @private
     * @param {Function} func The function to convert.
     * @returns {string} Returns the source code.
     */
    function toSource(func) {
      if (func != null) {
        try {
          return funcToString.call(func);
        } catch (e) {}
        try {
          return (func + '');
        } catch (e) {}
      }
      return '';
    }

    var _toSource = toSource;

    /**
     * Used to match `RegExp`
     * [syntax characters](http://ecma-international.org/ecma-262/7.0/#sec-patterns).
     */
    var reRegExpChar = /[\\^$.*+?()[\]{}|]/g;

    /** Used to detect host constructors (Safari). */
    var reIsHostCtor = /^\[object .+?Constructor\]$/;

    /** Used for built-in method references. */
    var funcProto$1 = Function.prototype,
        objectProto$2 = Object.prototype;

    /** Used to resolve the decompiled source of functions. */
    var funcToString$1 = funcProto$1.toString;

    /** Used to check objects for own properties. */
    var hasOwnProperty$1 = objectProto$2.hasOwnProperty;

    /** Used to detect if a method is native. */
    var reIsNative = RegExp('^' +
      funcToString$1.call(hasOwnProperty$1).replace(reRegExpChar, '\\$&')
      .replace(/hasOwnProperty|(function).*?(?=\\\()| for .+?(?=\\\])/g, '$1.*?') + '$'
    );

    /**
     * The base implementation of `_.isNative` without bad shim checks.
     *
     * @private
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if `value` is a native function,
     *  else `false`.
     */
    function baseIsNative(value) {
      if (!isObject_1(value) || _isMasked(value)) {
        return false;
      }
      var pattern = isFunction_1(value) ? reIsNative : reIsHostCtor;
      return pattern.test(_toSource(value));
    }

    var _baseIsNative = baseIsNative;

    /**
     * Gets the value at `key` of `object`.
     *
     * @private
     * @param {Object} [object] The object to query.
     * @param {string} key The key of the property to get.
     * @returns {*} Returns the property value.
     */
    function getValue(object, key) {
      return object == null ? undefined : object[key];
    }

    var _getValue = getValue;

    /**
     * Gets the native function at `key` of `object`.
     *
     * @private
     * @param {Object} object The object to query.
     * @param {string} key The key of the method to get.
     * @returns {*} Returns the function if it's native, else `undefined`.
     */
    function getNative(object, key) {
      var value = _getValue(object, key);
      return _baseIsNative(value) ? value : undefined;
    }

    var _getNative = getNative;

    /* Built-in method references that are verified to be native. */
    var Map = _getNative(_root, 'Map');

    var _Map = Map;

    /* Built-in method references that are verified to be native. */
    var nativeCreate = _getNative(Object, 'create');

    var _nativeCreate = nativeCreate;

    /**
     * Removes all key-value entries from the hash.
     *
     * @private
     * @name clear
     * @memberOf Hash
     */
    function hashClear() {
      this.__data__ = _nativeCreate ? _nativeCreate(null) : {};
      this.size = 0;
    }

    var _hashClear = hashClear;

    /**
     * Removes `key` and its value from the hash.
     *
     * @private
     * @name delete
     * @memberOf Hash
     * @param {Object} hash The hash to modify.
     * @param {string} key The key of the value to remove.
     * @returns {boolean} Returns `true` if the entry was removed, else `false`.
     */
    function hashDelete(key) {
      var result = this.has(key) && delete this.__data__[key];
      this.size -= result ? 1 : 0;
      return result;
    }

    var _hashDelete = hashDelete;

    /** Used to stand-in for `undefined` hash values. */
    var HASH_UNDEFINED = '__lodash_hash_undefined__';

    /** Used for built-in method references. */
    var objectProto$3 = Object.prototype;

    /** Used to check objects for own properties. */
    var hasOwnProperty$2 = objectProto$3.hasOwnProperty;

    /**
     * Gets the hash value for `key`.
     *
     * @private
     * @name get
     * @memberOf Hash
     * @param {string} key The key of the value to get.
     * @returns {*} Returns the entry value.
     */
    function hashGet(key) {
      var data = this.__data__;
      if (_nativeCreate) {
        var result = data[key];
        return result === HASH_UNDEFINED ? undefined : result;
      }
      return hasOwnProperty$2.call(data, key) ? data[key] : undefined;
    }

    var _hashGet = hashGet;

    /** Used for built-in method references. */
    var objectProto$4 = Object.prototype;

    /** Used to check objects for own properties. */
    var hasOwnProperty$3 = objectProto$4.hasOwnProperty;

    /**
     * Checks if a hash value for `key` exists.
     *
     * @private
     * @name has
     * @memberOf Hash
     * @param {string} key The key of the entry to check.
     * @returns {boolean} Returns `true` if an entry for `key` exists, else `false`.
     */
    function hashHas(key) {
      var data = this.__data__;
      return _nativeCreate ? (data[key] !== undefined) : hasOwnProperty$3.call(data, key);
    }

    var _hashHas = hashHas;

    /** Used to stand-in for `undefined` hash values. */
    var HASH_UNDEFINED$1 = '__lodash_hash_undefined__';

    /**
     * Sets the hash `key` to `value`.
     *
     * @private
     * @name set
     * @memberOf Hash
     * @param {string} key The key of the value to set.
     * @param {*} value The value to set.
     * @returns {Object} Returns the hash instance.
     */
    function hashSet(key, value) {
      var data = this.__data__;
      this.size += this.has(key) ? 0 : 1;
      data[key] = (_nativeCreate && value === undefined) ? HASH_UNDEFINED$1 : value;
      return this;
    }

    var _hashSet = hashSet;

    /**
     * Creates a hash object.
     *
     * @private
     * @constructor
     * @param {Array} [entries] The key-value pairs to cache.
     */
    function Hash(entries) {
      var index = -1,
          length = entries == null ? 0 : entries.length;

      this.clear();
      while (++index < length) {
        var entry = entries[index];
        this.set(entry[0], entry[1]);
      }
    }

    // Add methods to `Hash`.
    Hash.prototype.clear = _hashClear;
    Hash.prototype['delete'] = _hashDelete;
    Hash.prototype.get = _hashGet;
    Hash.prototype.has = _hashHas;
    Hash.prototype.set = _hashSet;

    var _Hash = Hash;

    /**
     * Removes all key-value entries from the map.
     *
     * @private
     * @name clear
     * @memberOf MapCache
     */
    function mapCacheClear() {
      this.size = 0;
      this.__data__ = {
        'hash': new _Hash,
        'map': new (_Map || _ListCache),
        'string': new _Hash
      };
    }

    var _mapCacheClear = mapCacheClear;

    /**
     * Checks if `value` is suitable for use as unique object key.
     *
     * @private
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if `value` is suitable, else `false`.
     */
    function isKeyable(value) {
      var type = typeof value;
      return (type == 'string' || type == 'number' || type == 'symbol' || type == 'boolean')
        ? (value !== '__proto__')
        : (value === null);
    }

    var _isKeyable = isKeyable;

    /**
     * Gets the data for `map`.
     *
     * @private
     * @param {Object} map The map to query.
     * @param {string} key The reference key.
     * @returns {*} Returns the map data.
     */
    function getMapData(map, key) {
      var data = map.__data__;
      return _isKeyable(key)
        ? data[typeof key == 'string' ? 'string' : 'hash']
        : data.map;
    }

    var _getMapData = getMapData;

    /**
     * Removes `key` and its value from the map.
     *
     * @private
     * @name delete
     * @memberOf MapCache
     * @param {string} key The key of the value to remove.
     * @returns {boolean} Returns `true` if the entry was removed, else `false`.
     */
    function mapCacheDelete(key) {
      var result = _getMapData(this, key)['delete'](key);
      this.size -= result ? 1 : 0;
      return result;
    }

    var _mapCacheDelete = mapCacheDelete;

    /**
     * Gets the map value for `key`.
     *
     * @private
     * @name get
     * @memberOf MapCache
     * @param {string} key The key of the value to get.
     * @returns {*} Returns the entry value.
     */
    function mapCacheGet(key) {
      return _getMapData(this, key).get(key);
    }

    var _mapCacheGet = mapCacheGet;

    /**
     * Checks if a map value for `key` exists.
     *
     * @private
     * @name has
     * @memberOf MapCache
     * @param {string} key The key of the entry to check.
     * @returns {boolean} Returns `true` if an entry for `key` exists, else `false`.
     */
    function mapCacheHas(key) {
      return _getMapData(this, key).has(key);
    }

    var _mapCacheHas = mapCacheHas;

    /**
     * Sets the map `key` to `value`.
     *
     * @private
     * @name set
     * @memberOf MapCache
     * @param {string} key The key of the value to set.
     * @param {*} value The value to set.
     * @returns {Object} Returns the map cache instance.
     */
    function mapCacheSet(key, value) {
      var data = _getMapData(this, key),
          size = data.size;

      data.set(key, value);
      this.size += data.size == size ? 0 : 1;
      return this;
    }

    var _mapCacheSet = mapCacheSet;

    /**
     * Creates a map cache object to store key-value pairs.
     *
     * @private
     * @constructor
     * @param {Array} [entries] The key-value pairs to cache.
     */
    function MapCache(entries) {
      var index = -1,
          length = entries == null ? 0 : entries.length;

      this.clear();
      while (++index < length) {
        var entry = entries[index];
        this.set(entry[0], entry[1]);
      }
    }

    // Add methods to `MapCache`.
    MapCache.prototype.clear = _mapCacheClear;
    MapCache.prototype['delete'] = _mapCacheDelete;
    MapCache.prototype.get = _mapCacheGet;
    MapCache.prototype.has = _mapCacheHas;
    MapCache.prototype.set = _mapCacheSet;

    var _MapCache = MapCache;

    /** Used as the size to enable large array optimizations. */
    var LARGE_ARRAY_SIZE = 200;

    /**
     * Sets the stack `key` to `value`.
     *
     * @private
     * @name set
     * @memberOf Stack
     * @param {string} key The key of the value to set.
     * @param {*} value The value to set.
     * @returns {Object} Returns the stack cache instance.
     */
    function stackSet(key, value) {
      var data = this.__data__;
      if (data instanceof _ListCache) {
        var pairs = data.__data__;
        if (!_Map || (pairs.length < LARGE_ARRAY_SIZE - 1)) {
          pairs.push([key, value]);
          this.size = ++data.size;
          return this;
        }
        data = this.__data__ = new _MapCache(pairs);
      }
      data.set(key, value);
      this.size = data.size;
      return this;
    }

    var _stackSet = stackSet;

    /**
     * Creates a stack cache object to store key-value pairs.
     *
     * @private
     * @constructor
     * @param {Array} [entries] The key-value pairs to cache.
     */
    function Stack(entries) {
      var data = this.__data__ = new _ListCache(entries);
      this.size = data.size;
    }

    // Add methods to `Stack`.
    Stack.prototype.clear = _stackClear;
    Stack.prototype['delete'] = _stackDelete;
    Stack.prototype.get = _stackGet;
    Stack.prototype.has = _stackHas;
    Stack.prototype.set = _stackSet;

    var _Stack = Stack;

    /**
     * A specialized version of `_.forEach` for arrays without support for
     * iteratee shorthands.
     *
     * @private
     * @param {Array} [array] The array to iterate over.
     * @param {Function} iteratee The function invoked per iteration.
     * @returns {Array} Returns `array`.
     */
    function arrayEach(array, iteratee) {
      var index = -1,
          length = array == null ? 0 : array.length;

      while (++index < length) {
        if (iteratee(array[index], index, array) === false) {
          break;
        }
      }
      return array;
    }

    var _arrayEach = arrayEach;

    var defineProperty = (function() {
      try {
        var func = _getNative(Object, 'defineProperty');
        func({}, '', {});
        return func;
      } catch (e) {}
    }());

    var _defineProperty = defineProperty;

    /**
     * The base implementation of `assignValue` and `assignMergeValue` without
     * value checks.
     *
     * @private
     * @param {Object} object The object to modify.
     * @param {string} key The key of the property to assign.
     * @param {*} value The value to assign.
     */
    function baseAssignValue(object, key, value) {
      if (key == '__proto__' && _defineProperty) {
        _defineProperty(object, key, {
          'configurable': true,
          'enumerable': true,
          'value': value,
          'writable': true
        });
      } else {
        object[key] = value;
      }
    }

    var _baseAssignValue = baseAssignValue;

    /** Used for built-in method references. */
    var objectProto$5 = Object.prototype;

    /** Used to check objects for own properties. */
    var hasOwnProperty$4 = objectProto$5.hasOwnProperty;

    /**
     * Assigns `value` to `key` of `object` if the existing value is not equivalent
     * using [`SameValueZero`](http://ecma-international.org/ecma-262/7.0/#sec-samevaluezero)
     * for equality comparisons.
     *
     * @private
     * @param {Object} object The object to modify.
     * @param {string} key The key of the property to assign.
     * @param {*} value The value to assign.
     */
    function assignValue(object, key, value) {
      var objValue = object[key];
      if (!(hasOwnProperty$4.call(object, key) && eq_1(objValue, value)) ||
          (value === undefined && !(key in object))) {
        _baseAssignValue(object, key, value);
      }
    }

    var _assignValue = assignValue;

    /**
     * Copies properties of `source` to `object`.
     *
     * @private
     * @param {Object} source The object to copy properties from.
     * @param {Array} props The property identifiers to copy.
     * @param {Object} [object={}] The object to copy properties to.
     * @param {Function} [customizer] The function to customize copied values.
     * @returns {Object} Returns `object`.
     */
    function copyObject(source, props, object, customizer) {
      var isNew = !object;
      object || (object = {});

      var index = -1,
          length = props.length;

      while (++index < length) {
        var key = props[index];

        var newValue = customizer
          ? customizer(object[key], source[key], key, object, source)
          : undefined;

        if (newValue === undefined) {
          newValue = source[key];
        }
        if (isNew) {
          _baseAssignValue(object, key, newValue);
        } else {
          _assignValue(object, key, newValue);
        }
      }
      return object;
    }

    var _copyObject = copyObject;

    /**
     * The base implementation of `_.times` without support for iteratee shorthands
     * or max array length checks.
     *
     * @private
     * @param {number} n The number of times to invoke `iteratee`.
     * @param {Function} iteratee The function invoked per iteration.
     * @returns {Array} Returns the array of results.
     */
    function baseTimes(n, iteratee) {
      var index = -1,
          result = Array(n);

      while (++index < n) {
        result[index] = iteratee(index);
      }
      return result;
    }

    var _baseTimes = baseTimes;

    /**
     * Checks if `value` is object-like. A value is object-like if it's not `null`
     * and has a `typeof` result of "object".
     *
     * @static
     * @memberOf _
     * @since 4.0.0
     * @category Lang
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if `value` is object-like, else `false`.
     * @example
     *
     * _.isObjectLike({});
     * // => true
     *
     * _.isObjectLike([1, 2, 3]);
     * // => true
     *
     * _.isObjectLike(_.noop);
     * // => false
     *
     * _.isObjectLike(null);
     * // => false
     */
    function isObjectLike(value) {
      return value != null && typeof value == 'object';
    }

    var isObjectLike_1 = isObjectLike;

    /** `Object#toString` result references. */
    var argsTag = '[object Arguments]';

    /**
     * The base implementation of `_.isArguments`.
     *
     * @private
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if `value` is an `arguments` object,
     */
    function baseIsArguments(value) {
      return isObjectLike_1(value) && _baseGetTag(value) == argsTag;
    }

    var _baseIsArguments = baseIsArguments;

    /** Used for built-in method references. */
    var objectProto$6 = Object.prototype;

    /** Used to check objects for own properties. */
    var hasOwnProperty$5 = objectProto$6.hasOwnProperty;

    /** Built-in value references. */
    var propertyIsEnumerable = objectProto$6.propertyIsEnumerable;

    /**
     * Checks if `value` is likely an `arguments` object.
     *
     * @static
     * @memberOf _
     * @since 0.1.0
     * @category Lang
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if `value` is an `arguments` object,
     *  else `false`.
     * @example
     *
     * _.isArguments(function() { return arguments; }());
     * // => true
     *
     * _.isArguments([1, 2, 3]);
     * // => false
     */
    var isArguments = _baseIsArguments(function() { return arguments; }()) ? _baseIsArguments : function(value) {
      return isObjectLike_1(value) && hasOwnProperty$5.call(value, 'callee') &&
        !propertyIsEnumerable.call(value, 'callee');
    };

    var isArguments_1 = isArguments;

    /**
     * Checks if `value` is classified as an `Array` object.
     *
     * @static
     * @memberOf _
     * @since 0.1.0
     * @category Lang
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if `value` is an array, else `false`.
     * @example
     *
     * _.isArray([1, 2, 3]);
     * // => true
     *
     * _.isArray(document.body.children);
     * // => false
     *
     * _.isArray('abc');
     * // => false
     *
     * _.isArray(_.noop);
     * // => false
     */
    var isArray = Array.isArray;

    var isArray_1 = isArray;

    /**
     * This method returns `false`.
     *
     * @static
     * @memberOf _
     * @since 4.13.0
     * @category Util
     * @returns {boolean} Returns `false`.
     * @example
     *
     * _.times(2, _.stubFalse);
     * // => [false, false]
     */
    function stubFalse() {
      return false;
    }

    var stubFalse_1 = stubFalse;

    var isBuffer_1 = createCommonjsModule(function (module, exports) {
    /** Detect free variable `exports`. */
    var freeExports =  exports && !exports.nodeType && exports;

    /** Detect free variable `module`. */
    var freeModule = freeExports && 'object' == 'object' && module && !module.nodeType && module;

    /** Detect the popular CommonJS extension `module.exports`. */
    var moduleExports = freeModule && freeModule.exports === freeExports;

    /** Built-in value references. */
    var Buffer = moduleExports ? _root.Buffer : undefined;

    /* Built-in method references for those with the same name as other `lodash` methods. */
    var nativeIsBuffer = Buffer ? Buffer.isBuffer : undefined;

    /**
     * Checks if `value` is a buffer.
     *
     * @static
     * @memberOf _
     * @since 4.3.0
     * @category Lang
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if `value` is a buffer, else `false`.
     * @example
     *
     * _.isBuffer(new Buffer(2));
     * // => true
     *
     * _.isBuffer(new Uint8Array(2));
     * // => false
     */
    var isBuffer = nativeIsBuffer || stubFalse_1;

    module.exports = isBuffer;
    });

    /** Used as references for various `Number` constants. */
    var MAX_SAFE_INTEGER = 9007199254740991;

    /** Used to detect unsigned integer values. */
    var reIsUint = /^(?:0|[1-9]\d*)$/;

    /**
     * Checks if `value` is a valid array-like index.
     *
     * @private
     * @param {*} value The value to check.
     * @param {number} [length=MAX_SAFE_INTEGER] The upper bounds of a valid index.
     * @returns {boolean} Returns `true` if `value` is a valid index, else `false`.
     */
    function isIndex(value, length) {
      var type = typeof value;
      length = length == null ? MAX_SAFE_INTEGER : length;

      return !!length &&
        (type == 'number' ||
          (type != 'symbol' && reIsUint.test(value))) &&
            (value > -1 && value % 1 == 0 && value < length);
    }

    var _isIndex = isIndex;

    /** Used as references for various `Number` constants. */
    var MAX_SAFE_INTEGER$1 = 9007199254740991;

    /**
     * Checks if `value` is a valid array-like length.
     *
     * **Note:** This method is loosely based on
     * [`ToLength`](http://ecma-international.org/ecma-262/7.0/#sec-tolength).
     *
     * @static
     * @memberOf _
     * @since 4.0.0
     * @category Lang
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if `value` is a valid length, else `false`.
     * @example
     *
     * _.isLength(3);
     * // => true
     *
     * _.isLength(Number.MIN_VALUE);
     * // => false
     *
     * _.isLength(Infinity);
     * // => false
     *
     * _.isLength('3');
     * // => false
     */
    function isLength(value) {
      return typeof value == 'number' &&
        value > -1 && value % 1 == 0 && value <= MAX_SAFE_INTEGER$1;
    }

    var isLength_1 = isLength;

    /** `Object#toString` result references. */
    var argsTag$1 = '[object Arguments]',
        arrayTag = '[object Array]',
        boolTag = '[object Boolean]',
        dateTag = '[object Date]',
        errorTag = '[object Error]',
        funcTag$1 = '[object Function]',
        mapTag = '[object Map]',
        numberTag = '[object Number]',
        objectTag = '[object Object]',
        regexpTag = '[object RegExp]',
        setTag = '[object Set]',
        stringTag = '[object String]',
        weakMapTag = '[object WeakMap]';

    var arrayBufferTag = '[object ArrayBuffer]',
        dataViewTag = '[object DataView]',
        float32Tag = '[object Float32Array]',
        float64Tag = '[object Float64Array]',
        int8Tag = '[object Int8Array]',
        int16Tag = '[object Int16Array]',
        int32Tag = '[object Int32Array]',
        uint8Tag = '[object Uint8Array]',
        uint8ClampedTag = '[object Uint8ClampedArray]',
        uint16Tag = '[object Uint16Array]',
        uint32Tag = '[object Uint32Array]';

    /** Used to identify `toStringTag` values of typed arrays. */
    var typedArrayTags = {};
    typedArrayTags[float32Tag] = typedArrayTags[float64Tag] =
    typedArrayTags[int8Tag] = typedArrayTags[int16Tag] =
    typedArrayTags[int32Tag] = typedArrayTags[uint8Tag] =
    typedArrayTags[uint8ClampedTag] = typedArrayTags[uint16Tag] =
    typedArrayTags[uint32Tag] = true;
    typedArrayTags[argsTag$1] = typedArrayTags[arrayTag] =
    typedArrayTags[arrayBufferTag] = typedArrayTags[boolTag] =
    typedArrayTags[dataViewTag] = typedArrayTags[dateTag] =
    typedArrayTags[errorTag] = typedArrayTags[funcTag$1] =
    typedArrayTags[mapTag] = typedArrayTags[numberTag] =
    typedArrayTags[objectTag] = typedArrayTags[regexpTag] =
    typedArrayTags[setTag] = typedArrayTags[stringTag] =
    typedArrayTags[weakMapTag] = false;

    /**
     * The base implementation of `_.isTypedArray` without Node.js optimizations.
     *
     * @private
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if `value` is a typed array, else `false`.
     */
    function baseIsTypedArray(value) {
      return isObjectLike_1(value) &&
        isLength_1(value.length) && !!typedArrayTags[_baseGetTag(value)];
    }

    var _baseIsTypedArray = baseIsTypedArray;

    /**
     * The base implementation of `_.unary` without support for storing metadata.
     *
     * @private
     * @param {Function} func The function to cap arguments for.
     * @returns {Function} Returns the new capped function.
     */
    function baseUnary(func) {
      return function(value) {
        return func(value);
      };
    }

    var _baseUnary = baseUnary;

    var _nodeUtil = createCommonjsModule(function (module, exports) {
    /** Detect free variable `exports`. */
    var freeExports =  exports && !exports.nodeType && exports;

    /** Detect free variable `module`. */
    var freeModule = freeExports && 'object' == 'object' && module && !module.nodeType && module;

    /** Detect the popular CommonJS extension `module.exports`. */
    var moduleExports = freeModule && freeModule.exports === freeExports;

    /** Detect free variable `process` from Node.js. */
    var freeProcess = moduleExports && _freeGlobal.process;

    /** Used to access faster Node.js helpers. */
    var nodeUtil = (function() {
      try {
        // Use `util.types` for Node.js 10+.
        var types = freeModule && freeModule.require && freeModule.require('util').types;

        if (types) {
          return types;
        }

        // Legacy `process.binding('util')` for Node.js < 10.
        return freeProcess && freeProcess.binding && freeProcess.binding('util');
      } catch (e) {}
    }());

    module.exports = nodeUtil;
    });

    /* Node.js helper references. */
    var nodeIsTypedArray = _nodeUtil && _nodeUtil.isTypedArray;

    /**
     * Checks if `value` is classified as a typed array.
     *
     * @static
     * @memberOf _
     * @since 3.0.0
     * @category Lang
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if `value` is a typed array, else `false`.
     * @example
     *
     * _.isTypedArray(new Uint8Array);
     * // => true
     *
     * _.isTypedArray([]);
     * // => false
     */
    var isTypedArray = nodeIsTypedArray ? _baseUnary(nodeIsTypedArray) : _baseIsTypedArray;

    var isTypedArray_1 = isTypedArray;

    /** Used for built-in method references. */
    var objectProto$7 = Object.prototype;

    /** Used to check objects for own properties. */
    var hasOwnProperty$6 = objectProto$7.hasOwnProperty;

    /**
     * Creates an array of the enumerable property names of the array-like `value`.
     *
     * @private
     * @param {*} value The value to query.
     * @param {boolean} inherited Specify returning inherited property names.
     * @returns {Array} Returns the array of property names.
     */
    function arrayLikeKeys(value, inherited) {
      var isArr = isArray_1(value),
          isArg = !isArr && isArguments_1(value),
          isBuff = !isArr && !isArg && isBuffer_1(value),
          isType = !isArr && !isArg && !isBuff && isTypedArray_1(value),
          skipIndexes = isArr || isArg || isBuff || isType,
          result = skipIndexes ? _baseTimes(value.length, String) : [],
          length = result.length;

      for (var key in value) {
        if ((inherited || hasOwnProperty$6.call(value, key)) &&
            !(skipIndexes && (
               // Safari 9 has enumerable `arguments.length` in strict mode.
               key == 'length' ||
               // Node.js 0.10 has enumerable non-index properties on buffers.
               (isBuff && (key == 'offset' || key == 'parent')) ||
               // PhantomJS 2 has enumerable non-index properties on typed arrays.
               (isType && (key == 'buffer' || key == 'byteLength' || key == 'byteOffset')) ||
               // Skip index properties.
               _isIndex(key, length)
            ))) {
          result.push(key);
        }
      }
      return result;
    }

    var _arrayLikeKeys = arrayLikeKeys;

    /** Used for built-in method references. */
    var objectProto$8 = Object.prototype;

    /**
     * Checks if `value` is likely a prototype object.
     *
     * @private
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if `value` is a prototype, else `false`.
     */
    function isPrototype(value) {
      var Ctor = value && value.constructor,
          proto = (typeof Ctor == 'function' && Ctor.prototype) || objectProto$8;

      return value === proto;
    }

    var _isPrototype = isPrototype;

    /**
     * Creates a unary function that invokes `func` with its argument transformed.
     *
     * @private
     * @param {Function} func The function to wrap.
     * @param {Function} transform The argument transform.
     * @returns {Function} Returns the new function.
     */
    function overArg(func, transform) {
      return function(arg) {
        return func(transform(arg));
      };
    }

    var _overArg = overArg;

    /* Built-in method references for those with the same name as other `lodash` methods. */
    var nativeKeys = _overArg(Object.keys, Object);

    var _nativeKeys = nativeKeys;

    /** Used for built-in method references. */
    var objectProto$9 = Object.prototype;

    /** Used to check objects for own properties. */
    var hasOwnProperty$7 = objectProto$9.hasOwnProperty;

    /**
     * The base implementation of `_.keys` which doesn't treat sparse arrays as dense.
     *
     * @private
     * @param {Object} object The object to query.
     * @returns {Array} Returns the array of property names.
     */
    function baseKeys(object) {
      if (!_isPrototype(object)) {
        return _nativeKeys(object);
      }
      var result = [];
      for (var key in Object(object)) {
        if (hasOwnProperty$7.call(object, key) && key != 'constructor') {
          result.push(key);
        }
      }
      return result;
    }

    var _baseKeys = baseKeys;

    /**
     * Checks if `value` is array-like. A value is considered array-like if it's
     * not a function and has a `value.length` that's an integer greater than or
     * equal to `0` and less than or equal to `Number.MAX_SAFE_INTEGER`.
     *
     * @static
     * @memberOf _
     * @since 4.0.0
     * @category Lang
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if `value` is array-like, else `false`.
     * @example
     *
     * _.isArrayLike([1, 2, 3]);
     * // => true
     *
     * _.isArrayLike(document.body.children);
     * // => true
     *
     * _.isArrayLike('abc');
     * // => true
     *
     * _.isArrayLike(_.noop);
     * // => false
     */
    function isArrayLike(value) {
      return value != null && isLength_1(value.length) && !isFunction_1(value);
    }

    var isArrayLike_1 = isArrayLike;

    /**
     * Creates an array of the own enumerable property names of `object`.
     *
     * **Note:** Non-object values are coerced to objects. See the
     * [ES spec](http://ecma-international.org/ecma-262/7.0/#sec-object.keys)
     * for more details.
     *
     * @static
     * @since 0.1.0
     * @memberOf _
     * @category Object
     * @param {Object} object The object to query.
     * @returns {Array} Returns the array of property names.
     * @example
     *
     * function Foo() {
     *   this.a = 1;
     *   this.b = 2;
     * }
     *
     * Foo.prototype.c = 3;
     *
     * _.keys(new Foo);
     * // => ['a', 'b'] (iteration order is not guaranteed)
     *
     * _.keys('hi');
     * // => ['0', '1']
     */
    function keys(object) {
      return isArrayLike_1(object) ? _arrayLikeKeys(object) : _baseKeys(object);
    }

    var keys_1 = keys;

    /**
     * The base implementation of `_.assign` without support for multiple sources
     * or `customizer` functions.
     *
     * @private
     * @param {Object} object The destination object.
     * @param {Object} source The source object.
     * @returns {Object} Returns `object`.
     */
    function baseAssign(object, source) {
      return object && _copyObject(source, keys_1(source), object);
    }

    var _baseAssign = baseAssign;

    /**
     * This function is like
     * [`Object.keys`](http://ecma-international.org/ecma-262/7.0/#sec-object.keys)
     * except that it includes inherited enumerable properties.
     *
     * @private
     * @param {Object} object The object to query.
     * @returns {Array} Returns the array of property names.
     */
    function nativeKeysIn(object) {
      var result = [];
      if (object != null) {
        for (var key in Object(object)) {
          result.push(key);
        }
      }
      return result;
    }

    var _nativeKeysIn = nativeKeysIn;

    /** Used for built-in method references. */
    var objectProto$a = Object.prototype;

    /** Used to check objects for own properties. */
    var hasOwnProperty$8 = objectProto$a.hasOwnProperty;

    /**
     * The base implementation of `_.keysIn` which doesn't treat sparse arrays as dense.
     *
     * @private
     * @param {Object} object The object to query.
     * @returns {Array} Returns the array of property names.
     */
    function baseKeysIn(object) {
      if (!isObject_1(object)) {
        return _nativeKeysIn(object);
      }
      var isProto = _isPrototype(object),
          result = [];

      for (var key in object) {
        if (!(key == 'constructor' && (isProto || !hasOwnProperty$8.call(object, key)))) {
          result.push(key);
        }
      }
      return result;
    }

    var _baseKeysIn = baseKeysIn;

    /**
     * Creates an array of the own and inherited enumerable property names of `object`.
     *
     * **Note:** Non-object values are coerced to objects.
     *
     * @static
     * @memberOf _
     * @since 3.0.0
     * @category Object
     * @param {Object} object The object to query.
     * @returns {Array} Returns the array of property names.
     * @example
     *
     * function Foo() {
     *   this.a = 1;
     *   this.b = 2;
     * }
     *
     * Foo.prototype.c = 3;
     *
     * _.keysIn(new Foo);
     * // => ['a', 'b', 'c'] (iteration order is not guaranteed)
     */
    function keysIn$1(object) {
      return isArrayLike_1(object) ? _arrayLikeKeys(object, true) : _baseKeysIn(object);
    }

    var keysIn_1 = keysIn$1;

    /**
     * The base implementation of `_.assignIn` without support for multiple sources
     * or `customizer` functions.
     *
     * @private
     * @param {Object} object The destination object.
     * @param {Object} source The source object.
     * @returns {Object} Returns `object`.
     */
    function baseAssignIn(object, source) {
      return object && _copyObject(source, keysIn_1(source), object);
    }

    var _baseAssignIn = baseAssignIn;

    var _cloneBuffer = createCommonjsModule(function (module, exports) {
    /** Detect free variable `exports`. */
    var freeExports =  exports && !exports.nodeType && exports;

    /** Detect free variable `module`. */
    var freeModule = freeExports && 'object' == 'object' && module && !module.nodeType && module;

    /** Detect the popular CommonJS extension `module.exports`. */
    var moduleExports = freeModule && freeModule.exports === freeExports;

    /** Built-in value references. */
    var Buffer = moduleExports ? _root.Buffer : undefined,
        allocUnsafe = Buffer ? Buffer.allocUnsafe : undefined;

    /**
     * Creates a clone of  `buffer`.
     *
     * @private
     * @param {Buffer} buffer The buffer to clone.
     * @param {boolean} [isDeep] Specify a deep clone.
     * @returns {Buffer} Returns the cloned buffer.
     */
    function cloneBuffer(buffer, isDeep) {
      if (isDeep) {
        return buffer.slice();
      }
      var length = buffer.length,
          result = allocUnsafe ? allocUnsafe(length) : new buffer.constructor(length);

      buffer.copy(result);
      return result;
    }

    module.exports = cloneBuffer;
    });

    /**
     * Copies the values of `source` to `array`.
     *
     * @private
     * @param {Array} source The array to copy values from.
     * @param {Array} [array=[]] The array to copy values to.
     * @returns {Array} Returns `array`.
     */
    function copyArray(source, array) {
      var index = -1,
          length = source.length;

      array || (array = Array(length));
      while (++index < length) {
        array[index] = source[index];
      }
      return array;
    }

    var _copyArray = copyArray;

    /**
     * A specialized version of `_.filter` for arrays without support for
     * iteratee shorthands.
     *
     * @private
     * @param {Array} [array] The array to iterate over.
     * @param {Function} predicate The function invoked per iteration.
     * @returns {Array} Returns the new filtered array.
     */
    function arrayFilter(array, predicate) {
      var index = -1,
          length = array == null ? 0 : array.length,
          resIndex = 0,
          result = [];

      while (++index < length) {
        var value = array[index];
        if (predicate(value, index, array)) {
          result[resIndex++] = value;
        }
      }
      return result;
    }

    var _arrayFilter = arrayFilter;

    /**
     * This method returns a new empty array.
     *
     * @static
     * @memberOf _
     * @since 4.13.0
     * @category Util
     * @returns {Array} Returns the new empty array.
     * @example
     *
     * var arrays = _.times(2, _.stubArray);
     *
     * console.log(arrays);
     * // => [[], []]
     *
     * console.log(arrays[0] === arrays[1]);
     * // => false
     */
    function stubArray() {
      return [];
    }

    var stubArray_1 = stubArray;

    /** Used for built-in method references. */
    var objectProto$b = Object.prototype;

    /** Built-in value references. */
    var propertyIsEnumerable$1 = objectProto$b.propertyIsEnumerable;

    /* Built-in method references for those with the same name as other `lodash` methods. */
    var nativeGetSymbols = Object.getOwnPropertySymbols;

    /**
     * Creates an array of the own enumerable symbols of `object`.
     *
     * @private
     * @param {Object} object The object to query.
     * @returns {Array} Returns the array of symbols.
     */
    var getSymbols = !nativeGetSymbols ? stubArray_1 : function(object) {
      if (object == null) {
        return [];
      }
      object = Object(object);
      return _arrayFilter(nativeGetSymbols(object), function(symbol) {
        return propertyIsEnumerable$1.call(object, symbol);
      });
    };

    var _getSymbols = getSymbols;

    /**
     * Copies own symbols of `source` to `object`.
     *
     * @private
     * @param {Object} source The object to copy symbols from.
     * @param {Object} [object={}] The object to copy symbols to.
     * @returns {Object} Returns `object`.
     */
    function copySymbols(source, object) {
      return _copyObject(source, _getSymbols(source), object);
    }

    var _copySymbols = copySymbols;

    /**
     * Appends the elements of `values` to `array`.
     *
     * @private
     * @param {Array} array The array to modify.
     * @param {Array} values The values to append.
     * @returns {Array} Returns `array`.
     */
    function arrayPush(array, values) {
      var index = -1,
          length = values.length,
          offset = array.length;

      while (++index < length) {
        array[offset + index] = values[index];
      }
      return array;
    }

    var _arrayPush = arrayPush;

    /** Built-in value references. */
    var getPrototype = _overArg(Object.getPrototypeOf, Object);

    var _getPrototype = getPrototype;

    /* Built-in method references for those with the same name as other `lodash` methods. */
    var nativeGetSymbols$1 = Object.getOwnPropertySymbols;

    /**
     * Creates an array of the own and inherited enumerable symbols of `object`.
     *
     * @private
     * @param {Object} object The object to query.
     * @returns {Array} Returns the array of symbols.
     */
    var getSymbolsIn = !nativeGetSymbols$1 ? stubArray_1 : function(object) {
      var result = [];
      while (object) {
        _arrayPush(result, _getSymbols(object));
        object = _getPrototype(object);
      }
      return result;
    };

    var _getSymbolsIn = getSymbolsIn;

    /**
     * Copies own and inherited symbols of `source` to `object`.
     *
     * @private
     * @param {Object} source The object to copy symbols from.
     * @param {Object} [object={}] The object to copy symbols to.
     * @returns {Object} Returns `object`.
     */
    function copySymbolsIn(source, object) {
      return _copyObject(source, _getSymbolsIn(source), object);
    }

    var _copySymbolsIn = copySymbolsIn;

    /**
     * The base implementation of `getAllKeys` and `getAllKeysIn` which uses
     * `keysFunc` and `symbolsFunc` to get the enumerable property names and
     * symbols of `object`.
     *
     * @private
     * @param {Object} object The object to query.
     * @param {Function} keysFunc The function to get the keys of `object`.
     * @param {Function} symbolsFunc The function to get the symbols of `object`.
     * @returns {Array} Returns the array of property names and symbols.
     */
    function baseGetAllKeys(object, keysFunc, symbolsFunc) {
      var result = keysFunc(object);
      return isArray_1(object) ? result : _arrayPush(result, symbolsFunc(object));
    }

    var _baseGetAllKeys = baseGetAllKeys;

    /**
     * Creates an array of own enumerable property names and symbols of `object`.
     *
     * @private
     * @param {Object} object The object to query.
     * @returns {Array} Returns the array of property names and symbols.
     */
    function getAllKeys(object) {
      return _baseGetAllKeys(object, keys_1, _getSymbols);
    }

    var _getAllKeys = getAllKeys;

    /**
     * Creates an array of own and inherited enumerable property names and
     * symbols of `object`.
     *
     * @private
     * @param {Object} object The object to query.
     * @returns {Array} Returns the array of property names and symbols.
     */
    function getAllKeysIn(object) {
      return _baseGetAllKeys(object, keysIn_1, _getSymbolsIn);
    }

    var _getAllKeysIn = getAllKeysIn;

    /* Built-in method references that are verified to be native. */
    var DataView = _getNative(_root, 'DataView');

    var _DataView = DataView;

    /* Built-in method references that are verified to be native. */
    var Promise$1 = _getNative(_root, 'Promise');

    var _Promise = Promise$1;

    /* Built-in method references that are verified to be native. */
    var Set = _getNative(_root, 'Set');

    var _Set = Set;

    /* Built-in method references that are verified to be native. */
    var WeakMap = _getNative(_root, 'WeakMap');

    var _WeakMap = WeakMap;

    /** `Object#toString` result references. */
    var mapTag$1 = '[object Map]',
        objectTag$1 = '[object Object]',
        promiseTag = '[object Promise]',
        setTag$1 = '[object Set]',
        weakMapTag$1 = '[object WeakMap]';

    var dataViewTag$1 = '[object DataView]';

    /** Used to detect maps, sets, and weakmaps. */
    var dataViewCtorString = _toSource(_DataView),
        mapCtorString = _toSource(_Map),
        promiseCtorString = _toSource(_Promise),
        setCtorString = _toSource(_Set),
        weakMapCtorString = _toSource(_WeakMap);

    /**
     * Gets the `toStringTag` of `value`.
     *
     * @private
     * @param {*} value The value to query.
     * @returns {string} Returns the `toStringTag`.
     */
    var getTag = _baseGetTag;

    // Fallback for data views, maps, sets, and weak maps in IE 11 and promises in Node.js < 6.
    if ((_DataView && getTag(new _DataView(new ArrayBuffer(1))) != dataViewTag$1) ||
        (_Map && getTag(new _Map) != mapTag$1) ||
        (_Promise && getTag(_Promise.resolve()) != promiseTag) ||
        (_Set && getTag(new _Set) != setTag$1) ||
        (_WeakMap && getTag(new _WeakMap) != weakMapTag$1)) {
      getTag = function(value) {
        var result = _baseGetTag(value),
            Ctor = result == objectTag$1 ? value.constructor : undefined,
            ctorString = Ctor ? _toSource(Ctor) : '';

        if (ctorString) {
          switch (ctorString) {
            case dataViewCtorString: return dataViewTag$1;
            case mapCtorString: return mapTag$1;
            case promiseCtorString: return promiseTag;
            case setCtorString: return setTag$1;
            case weakMapCtorString: return weakMapTag$1;
          }
        }
        return result;
      };
    }

    var _getTag = getTag;

    /** Used for built-in method references. */
    var objectProto$c = Object.prototype;

    /** Used to check objects for own properties. */
    var hasOwnProperty$9 = objectProto$c.hasOwnProperty;

    /**
     * Initializes an array clone.
     *
     * @private
     * @param {Array} array The array to clone.
     * @returns {Array} Returns the initialized clone.
     */
    function initCloneArray(array) {
      var length = array.length,
          result = new array.constructor(length);

      // Add properties assigned by `RegExp#exec`.
      if (length && typeof array[0] == 'string' && hasOwnProperty$9.call(array, 'index')) {
        result.index = array.index;
        result.input = array.input;
      }
      return result;
    }

    var _initCloneArray = initCloneArray;

    /** Built-in value references. */
    var Uint8Array$1 = _root.Uint8Array;

    var _Uint8Array = Uint8Array$1;

    /**
     * Creates a clone of `arrayBuffer`.
     *
     * @private
     * @param {ArrayBuffer} arrayBuffer The array buffer to clone.
     * @returns {ArrayBuffer} Returns the cloned array buffer.
     */
    function cloneArrayBuffer(arrayBuffer) {
      var result = new arrayBuffer.constructor(arrayBuffer.byteLength);
      new _Uint8Array(result).set(new _Uint8Array(arrayBuffer));
      return result;
    }

    var _cloneArrayBuffer = cloneArrayBuffer;

    /**
     * Creates a clone of `dataView`.
     *
     * @private
     * @param {Object} dataView The data view to clone.
     * @param {boolean} [isDeep] Specify a deep clone.
     * @returns {Object} Returns the cloned data view.
     */
    function cloneDataView(dataView, isDeep) {
      var buffer = isDeep ? _cloneArrayBuffer(dataView.buffer) : dataView.buffer;
      return new dataView.constructor(buffer, dataView.byteOffset, dataView.byteLength);
    }

    var _cloneDataView = cloneDataView;

    /** Used to match `RegExp` flags from their coerced string values. */
    var reFlags = /\w*$/;

    /**
     * Creates a clone of `regexp`.
     *
     * @private
     * @param {Object} regexp The regexp to clone.
     * @returns {Object} Returns the cloned regexp.
     */
    function cloneRegExp(regexp) {
      var result = new regexp.constructor(regexp.source, reFlags.exec(regexp));
      result.lastIndex = regexp.lastIndex;
      return result;
    }

    var _cloneRegExp = cloneRegExp;

    /** Used to convert symbols to primitives and strings. */
    var symbolProto = _Symbol ? _Symbol.prototype : undefined,
        symbolValueOf = symbolProto ? symbolProto.valueOf : undefined;

    /**
     * Creates a clone of the `symbol` object.
     *
     * @private
     * @param {Object} symbol The symbol object to clone.
     * @returns {Object} Returns the cloned symbol object.
     */
    function cloneSymbol(symbol) {
      return symbolValueOf ? Object(symbolValueOf.call(symbol)) : {};
    }

    var _cloneSymbol = cloneSymbol;

    /**
     * Creates a clone of `typedArray`.
     *
     * @private
     * @param {Object} typedArray The typed array to clone.
     * @param {boolean} [isDeep] Specify a deep clone.
     * @returns {Object} Returns the cloned typed array.
     */
    function cloneTypedArray(typedArray, isDeep) {
      var buffer = isDeep ? _cloneArrayBuffer(typedArray.buffer) : typedArray.buffer;
      return new typedArray.constructor(buffer, typedArray.byteOffset, typedArray.length);
    }

    var _cloneTypedArray = cloneTypedArray;

    /** `Object#toString` result references. */
    var boolTag$1 = '[object Boolean]',
        dateTag$1 = '[object Date]',
        mapTag$2 = '[object Map]',
        numberTag$1 = '[object Number]',
        regexpTag$1 = '[object RegExp]',
        setTag$2 = '[object Set]',
        stringTag$1 = '[object String]',
        symbolTag = '[object Symbol]';

    var arrayBufferTag$1 = '[object ArrayBuffer]',
        dataViewTag$2 = '[object DataView]',
        float32Tag$1 = '[object Float32Array]',
        float64Tag$1 = '[object Float64Array]',
        int8Tag$1 = '[object Int8Array]',
        int16Tag$1 = '[object Int16Array]',
        int32Tag$1 = '[object Int32Array]',
        uint8Tag$1 = '[object Uint8Array]',
        uint8ClampedTag$1 = '[object Uint8ClampedArray]',
        uint16Tag$1 = '[object Uint16Array]',
        uint32Tag$1 = '[object Uint32Array]';

    /**
     * Initializes an object clone based on its `toStringTag`.
     *
     * **Note:** This function only supports cloning values with tags of
     * `Boolean`, `Date`, `Error`, `Map`, `Number`, `RegExp`, `Set`, or `String`.
     *
     * @private
     * @param {Object} object The object to clone.
     * @param {string} tag The `toStringTag` of the object to clone.
     * @param {boolean} [isDeep] Specify a deep clone.
     * @returns {Object} Returns the initialized clone.
     */
    function initCloneByTag(object, tag, isDeep) {
      var Ctor = object.constructor;
      switch (tag) {
        case arrayBufferTag$1:
          return _cloneArrayBuffer(object);

        case boolTag$1:
        case dateTag$1:
          return new Ctor(+object);

        case dataViewTag$2:
          return _cloneDataView(object, isDeep);

        case float32Tag$1: case float64Tag$1:
        case int8Tag$1: case int16Tag$1: case int32Tag$1:
        case uint8Tag$1: case uint8ClampedTag$1: case uint16Tag$1: case uint32Tag$1:
          return _cloneTypedArray(object, isDeep);

        case mapTag$2:
          return new Ctor;

        case numberTag$1:
        case stringTag$1:
          return new Ctor(object);

        case regexpTag$1:
          return _cloneRegExp(object);

        case setTag$2:
          return new Ctor;

        case symbolTag:
          return _cloneSymbol(object);
      }
    }

    var _initCloneByTag = initCloneByTag;

    /** Built-in value references. */
    var objectCreate = Object.create;

    /**
     * The base implementation of `_.create` without support for assigning
     * properties to the created object.
     *
     * @private
     * @param {Object} proto The object to inherit from.
     * @returns {Object} Returns the new object.
     */
    var baseCreate = (function() {
      function object() {}
      return function(proto) {
        if (!isObject_1(proto)) {
          return {};
        }
        if (objectCreate) {
          return objectCreate(proto);
        }
        object.prototype = proto;
        var result = new object;
        object.prototype = undefined;
        return result;
      };
    }());

    var _baseCreate = baseCreate;

    /**
     * Initializes an object clone.
     *
     * @private
     * @param {Object} object The object to clone.
     * @returns {Object} Returns the initialized clone.
     */
    function initCloneObject(object) {
      return (typeof object.constructor == 'function' && !_isPrototype(object))
        ? _baseCreate(_getPrototype(object))
        : {};
    }

    var _initCloneObject = initCloneObject;

    /** `Object#toString` result references. */
    var mapTag$3 = '[object Map]';

    /**
     * The base implementation of `_.isMap` without Node.js optimizations.
     *
     * @private
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if `value` is a map, else `false`.
     */
    function baseIsMap(value) {
      return isObjectLike_1(value) && _getTag(value) == mapTag$3;
    }

    var _baseIsMap = baseIsMap;

    /* Node.js helper references. */
    var nodeIsMap = _nodeUtil && _nodeUtil.isMap;

    /**
     * Checks if `value` is classified as a `Map` object.
     *
     * @static
     * @memberOf _
     * @since 4.3.0
     * @category Lang
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if `value` is a map, else `false`.
     * @example
     *
     * _.isMap(new Map);
     * // => true
     *
     * _.isMap(new WeakMap);
     * // => false
     */
    var isMap = nodeIsMap ? _baseUnary(nodeIsMap) : _baseIsMap;

    var isMap_1 = isMap;

    /** `Object#toString` result references. */
    var setTag$3 = '[object Set]';

    /**
     * The base implementation of `_.isSet` without Node.js optimizations.
     *
     * @private
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if `value` is a set, else `false`.
     */
    function baseIsSet(value) {
      return isObjectLike_1(value) && _getTag(value) == setTag$3;
    }

    var _baseIsSet = baseIsSet;

    /* Node.js helper references. */
    var nodeIsSet = _nodeUtil && _nodeUtil.isSet;

    /**
     * Checks if `value` is classified as a `Set` object.
     *
     * @static
     * @memberOf _
     * @since 4.3.0
     * @category Lang
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if `value` is a set, else `false`.
     * @example
     *
     * _.isSet(new Set);
     * // => true
     *
     * _.isSet(new WeakSet);
     * // => false
     */
    var isSet = nodeIsSet ? _baseUnary(nodeIsSet) : _baseIsSet;

    var isSet_1 = isSet;

    /** Used to compose bitmasks for cloning. */
    var CLONE_DEEP_FLAG = 1,
        CLONE_FLAT_FLAG = 2,
        CLONE_SYMBOLS_FLAG = 4;

    /** `Object#toString` result references. */
    var argsTag$2 = '[object Arguments]',
        arrayTag$1 = '[object Array]',
        boolTag$2 = '[object Boolean]',
        dateTag$2 = '[object Date]',
        errorTag$1 = '[object Error]',
        funcTag$2 = '[object Function]',
        genTag$1 = '[object GeneratorFunction]',
        mapTag$4 = '[object Map]',
        numberTag$2 = '[object Number]',
        objectTag$2 = '[object Object]',
        regexpTag$2 = '[object RegExp]',
        setTag$4 = '[object Set]',
        stringTag$2 = '[object String]',
        symbolTag$1 = '[object Symbol]',
        weakMapTag$2 = '[object WeakMap]';

    var arrayBufferTag$2 = '[object ArrayBuffer]',
        dataViewTag$3 = '[object DataView]',
        float32Tag$2 = '[object Float32Array]',
        float64Tag$2 = '[object Float64Array]',
        int8Tag$2 = '[object Int8Array]',
        int16Tag$2 = '[object Int16Array]',
        int32Tag$2 = '[object Int32Array]',
        uint8Tag$2 = '[object Uint8Array]',
        uint8ClampedTag$2 = '[object Uint8ClampedArray]',
        uint16Tag$2 = '[object Uint16Array]',
        uint32Tag$2 = '[object Uint32Array]';

    /** Used to identify `toStringTag` values supported by `_.clone`. */
    var cloneableTags = {};
    cloneableTags[argsTag$2] = cloneableTags[arrayTag$1] =
    cloneableTags[arrayBufferTag$2] = cloneableTags[dataViewTag$3] =
    cloneableTags[boolTag$2] = cloneableTags[dateTag$2] =
    cloneableTags[float32Tag$2] = cloneableTags[float64Tag$2] =
    cloneableTags[int8Tag$2] = cloneableTags[int16Tag$2] =
    cloneableTags[int32Tag$2] = cloneableTags[mapTag$4] =
    cloneableTags[numberTag$2] = cloneableTags[objectTag$2] =
    cloneableTags[regexpTag$2] = cloneableTags[setTag$4] =
    cloneableTags[stringTag$2] = cloneableTags[symbolTag$1] =
    cloneableTags[uint8Tag$2] = cloneableTags[uint8ClampedTag$2] =
    cloneableTags[uint16Tag$2] = cloneableTags[uint32Tag$2] = true;
    cloneableTags[errorTag$1] = cloneableTags[funcTag$2] =
    cloneableTags[weakMapTag$2] = false;

    /**
     * The base implementation of `_.clone` and `_.cloneDeep` which tracks
     * traversed objects.
     *
     * @private
     * @param {*} value The value to clone.
     * @param {boolean} bitmask The bitmask flags.
     *  1 - Deep clone
     *  2 - Flatten inherited properties
     *  4 - Clone symbols
     * @param {Function} [customizer] The function to customize cloning.
     * @param {string} [key] The key of `value`.
     * @param {Object} [object] The parent object of `value`.
     * @param {Object} [stack] Tracks traversed objects and their clone counterparts.
     * @returns {*} Returns the cloned value.
     */
    function baseClone(value, bitmask, customizer, key, object, stack) {
      var result,
          isDeep = bitmask & CLONE_DEEP_FLAG,
          isFlat = bitmask & CLONE_FLAT_FLAG,
          isFull = bitmask & CLONE_SYMBOLS_FLAG;

      if (customizer) {
        result = object ? customizer(value, key, object, stack) : customizer(value);
      }
      if (result !== undefined) {
        return result;
      }
      if (!isObject_1(value)) {
        return value;
      }
      var isArr = isArray_1(value);
      if (isArr) {
        result = _initCloneArray(value);
        if (!isDeep) {
          return _copyArray(value, result);
        }
      } else {
        var tag = _getTag(value),
            isFunc = tag == funcTag$2 || tag == genTag$1;

        if (isBuffer_1(value)) {
          return _cloneBuffer(value, isDeep);
        }
        if (tag == objectTag$2 || tag == argsTag$2 || (isFunc && !object)) {
          result = (isFlat || isFunc) ? {} : _initCloneObject(value);
          if (!isDeep) {
            return isFlat
              ? _copySymbolsIn(value, _baseAssignIn(result, value))
              : _copySymbols(value, _baseAssign(result, value));
          }
        } else {
          if (!cloneableTags[tag]) {
            return object ? value : {};
          }
          result = _initCloneByTag(value, tag, isDeep);
        }
      }
      // Check for circular references and return its corresponding clone.
      stack || (stack = new _Stack);
      var stacked = stack.get(value);
      if (stacked) {
        return stacked;
      }
      stack.set(value, result);

      if (isSet_1(value)) {
        value.forEach(function(subValue) {
          result.add(baseClone(subValue, bitmask, customizer, subValue, value, stack));
        });
      } else if (isMap_1(value)) {
        value.forEach(function(subValue, key) {
          result.set(key, baseClone(subValue, bitmask, customizer, key, value, stack));
        });
      }

      var keysFunc = isFull
        ? (isFlat ? _getAllKeysIn : _getAllKeys)
        : (isFlat ? keysIn : keys_1);

      var props = isArr ? undefined : keysFunc(value);
      _arrayEach(props || value, function(subValue, key) {
        if (props) {
          key = subValue;
          subValue = value[key];
        }
        // Recursively populate clone (susceptible to call stack limits).
        _assignValue(result, key, baseClone(subValue, bitmask, customizer, key, value, stack));
      });
      return result;
    }

    var _baseClone = baseClone;

    /** Used to compose bitmasks for cloning. */
    var CLONE_DEEP_FLAG$1 = 1,
        CLONE_SYMBOLS_FLAG$1 = 4;

    /**
     * This method is like `_.clone` except that it recursively clones `value`.
     *
     * @static
     * @memberOf _
     * @since 1.0.0
     * @category Lang
     * @param {*} value The value to recursively clone.
     * @returns {*} Returns the deep cloned value.
     * @see _.clone
     * @example
     *
     * var objects = [{ 'a': 1 }, { 'b': 2 }];
     *
     * var deep = _.cloneDeep(objects);
     * console.log(deep[0] === objects[0]);
     * // => false
     */
    function cloneDeep(value) {
      return _baseClone(value, CLONE_DEEP_FLAG$1 | CLONE_SYMBOLS_FLAG$1);
    }

    var cloneDeep_1 = cloneDeep;

    function getBufferStart(mp4BoxTree, videoOffsetStart, audioOffsetStart) {
        if (videoOffsetStart === void 0) { videoOffsetStart = 0; }
        if (audioOffsetStart === void 0) { audioOffsetStart = 0; }
        return Math.min(getChunkSize(mp4BoxTree, videoOffsetStart, 'video'), getChunkSize(mp4BoxTree, audioOffsetStart, 'audio'));
    }
    function getChunkSize(mp4BoxTree, offsetStart, type) {
        var stscBox = cloneDeep_1(findBox(mp4BoxTree, type === 'video' ? 'videoStsc' : 'audioStsc'));
        var newOffsetStart = 0;
        var stscBoxSamplesPerChunkArray = getPerChunkArray(stscBox, offsetStart);
        var chunkIndex = 0;
        for (var i = 0; offsetStart > 0 && i <= stscBoxSamplesPerChunkArray.length; i++) {
            newOffsetStart += stscBoxSamplesPerChunkArray[i];
            if (newOffsetStart === offsetStart) {
                chunkIndex = i + 1;
                break;
            }
            else if (newOffsetStart > offsetStart) {
                newOffsetStart -= stscBoxSamplesPerChunkArray[i];
                chunkIndex = i;
                break;
            }
        }
        var sampleInterval = [newOffsetStart, offsetStart];
        var stszBox = findBox(mp4BoxTree, type === 'video' ? 'videoStsz' : 'audioStsz');
        var sampleSize = 0;
        // 考虑到 stsc 不为 1 的情况
        var samples = stszBox.samples.slice(sampleInterval[0], sampleInterval[1]);
        for (var i = 0; i < samples.length; i++) {
            sampleSize += samples[i].entrySize;
        }
        var stcoBox = findBox(mp4BoxTree, type === 'video' ? 'videoStco' : 'audioStco');
        // 如果最后一个 GOP 没有音频轨，BufferStart 需要按照视频轨来计算。
        // If the last GOP dont have audio track, we should ignore the audio chunk size.
        if (chunkIndex >= stcoBox.samples.length) {
            return Number.MAX_SAFE_INTEGER;
        }
        return stcoBox.samples[chunkIndex].chunkOffset + sampleSize;
    }

    function getVideoSamples(mp4BoxTree, bufferStart, offsetInterVal) {
        var cttsBox = cloneDeep_1(findBox(mp4BoxTree, 'videoCtts'));
        var compositionTimeOffset = [];
        if (cttsBox) {
            for (var i = 0; i < cttsBox.samples.length; i++) {
                compositionTimeOffset.push(cttsBox.samples[i].sampleOffset);
                if (cttsBox.samples[i].sampleCount !== 1) {
                    cttsBox.samples[i].sampleCount--;
                    i--;
                }
            }
        }
        return getSamples(mp4BoxTree, bufferStart, offsetInterVal, compositionTimeOffset);
    }
    function getAudioSamples(mp4BoxTree, bufferStart, offsetInterVal) {
        return getSamples(mp4BoxTree, bufferStart, offsetInterVal);
    }
    function getSamples(mp4BoxTree, bufferStart, _a, compositionTimeOffset) {
        var _b = __read(_a, 2), offsetStart = _b[0], offsetEnd = _b[1];
        var samples = [];
        var sttsBox = findBox(mp4BoxTree, compositionTimeOffset ? 'videoStts' : 'audioStts');
        var stszBox = findBox(mp4BoxTree, compositionTimeOffset ? 'videoStsz' : 'audioStsz');
        var stcoBox = findBox(mp4BoxTree, compositionTimeOffset ? 'videoStco' : 'audioStco');
        var stscBox = cloneDeep_1(findBox(mp4BoxTree, compositionTimeOffset ? 'videoStsc' : 'audioStsc'));
        var stscBoxSamplesPerChunkArray = getPerChunkArray(stscBox, offsetEnd);
        var samplesOffset = getSamplesOffset(stszBox, stscBoxSamplesPerChunkArray);
        var sttsFormatBox = [];
        for (var i = 0; i < sttsBox.samples.length; i++) {
            var _c = sttsBox.samples[i], sampleCount = _c.sampleCount, sampleDelta = _c.sampleDelta;
            sttsFormatBox.push({
                sampleCount: sampleCount +
                    (sttsFormatBox[i - 1] ? sttsFormatBox[i - 1].sampleCount : 0),
                sampleDelta: sampleDelta,
            });
        }
        // 算法不太好，可以和下面 for 循环结合，用双指针来做
        // FIXME
        var chunkOffsetArray = [];
        for (var i = 0; i < stscBoxSamplesPerChunkArray.length; i++) {
            for (var j = 0; j < stscBoxSamplesPerChunkArray[i]; j++) {
                var sample = stcoBox.samples[i];
                chunkOffsetArray.push(sample
                    ? sample.chunkOffset
                    : stcoBox.samples[stcoBox.samples.length - 1].chunkOffset);
            }
        }
        var _loop_1 = function (i) {
            var size = stszBox.samples[i].entrySize;
            var end = chunkOffsetArray[i] - bufferStart + samplesOffset[i];
            var start = end - size;
            var duration = sttsFormatBox.find(function (sample, idx) {
                if (sttsFormatBox[idx - 1]) {
                    return (i + 1 <= sample.sampleCount &&
                        i + 1 > sttsFormatBox[idx - 1].sampleCount);
                }
                else {
                    return i + 1 <= sample.sampleCount;
                }
            }).sampleDelta;
            samples.push(__assign(__assign({}, (compositionTimeOffset && {
                compositionTimeOffset: compositionTimeOffset.length
                    ? compositionTimeOffset[i]
                    : 0,
            })), { duration: duration,
                size: size,
                start: start,
                end: end,
                bufferStart: bufferStart }));
        };
        for (var i = offsetStart; i < offsetEnd; i++) {
            _loop_1(i);
        }
        return samples;
    }

    function getDuration(sttsBox, totalCount) {
        var count = 0;
        var duration = 0;
        for (var i = 0; i < sttsBox.samples.length; i++) {
            var _a = sttsBox.samples[i], sampleCount = _a.sampleCount, sampleDelta = _a.sampleDelta;
            for (var j = 0; j < sampleCount; j++) {
                if (count < totalCount && totalCount !== 0) {
                    duration += sampleDelta;
                    count++;
                }
                else {
                    return duration;
                }
            }
        }
        return duration;
    }

    function getVideoSamplesInterval(mp4BoxTree, time) {
        if (time === void 0) { time = 0; }
        var stssBox = cloneDeep_1(findBox(mp4BoxTree, 'videoStss'));
        var sttsBox = cloneDeep_1(findBox(mp4BoxTree, 'videoStts'));
        var stszBox = findBox(mp4BoxTree, 'videoStsz');
        var duration = getDuration(sttsBox, stszBox.samples.length);
        var intervalArray = getIntervalArray(stssBox, stszBox);
        var timeInterval = intervalArray.map(function (interval) {
            return getDuration(sttsBox, interval);
        });
        var interval = {
            offsetInterVal: [],
            timeInterVal: [],
        };
        for (var i = 0; i < timeInterval.length; i++) {
            var start = timeInterval[i];
            var end = timeInterval[i + 1] ? timeInterval[i + 1] : duration;
            if (start <= time && time < end) {
                var offsetStart = intervalArray[i];
                var offsetEnd = intervalArray[i + 1] !== undefined
                    ? intervalArray[i + 1]
                    : stszBox.samples.length;
                interval.offsetInterVal.push(offsetStart, offsetEnd);
                interval.timeInterVal.push(start, end);
                break;
            }
        }
        return interval;
    }
    function getAudioSamplesInterval(mp4BoxTree, videoInterval) {
        var _a = __read(videoInterval.timeInterVal, 2), startTime = _a[0], endTime = _a[1], offsetInterVal = videoInterval.offsetInterVal;
        var sttsBox = cloneDeep_1(findBox(mp4BoxTree, 'audioStts'));
        var audioTimescale = findBox(mp4BoxTree, 'audioMdhd').timescale;
        var videoTimescale = findBox(mp4BoxTree, 'videoMdhd').timescale;
        var videoStszBox = findBox(mp4BoxTree, 'videoStsz');
        var audioStszBox = findBox(mp4BoxTree, 'audioStsz');
        var audioElstBox = findBox(mp4BoxTree, 'audioElst');
        var audioStartTime = (startTime / videoTimescale) * audioTimescale;
        var audioEndTime = (endTime / videoTimescale) * audioTimescale;
        var start = 0;
        var end = 0;
        var _b = audioElstBox.entries[0], mediaTime = _b.mediaTime, segmentDuration = _b.segmentDuration;
        var startDuration = mediaTime !== -1 ? mediaTime : segmentDuration;
        var endDuration = 0;
        for (var i = 0; i < sttsBox.samples.length; i++) {
            var _c = sttsBox.samples[i], sampleCount = _c.sampleCount, sampleDelta = _c.sampleDelta;
            for (var j = 0; j < sampleCount; j++) {
                if (startDuration <= audioStartTime && audioStartTime !== 0) {
                    startDuration += sampleDelta;
                    start++;
                }
                if (endDuration <= audioEndTime) {
                    endDuration += sampleDelta;
                    end++;
                }
            }
        }
        // 如果是 video 的最后一个片段，也就是 audio 的最有一个片段
        // 使用 stsz 的长度来判断
        var audioEnd;
        if (offsetInterVal[1] === videoStszBox.samples.length) {
            audioEnd = audioStszBox.samples.length;
        }
        var interval = {
            offsetInterVal: [start, audioEnd ? audioEnd : end],
            timeInterVal: [startDuration, endDuration],
        };
        return interval;
    }
    function getNextVideoSamplesInterval(mp4BoxTree, sample) {
        var stssBox = cloneDeep_1(findBox(mp4BoxTree, 'videoStss'));
        var sttsBox = cloneDeep_1(findBox(mp4BoxTree, 'videoStts'));
        var stszBox = findBox(mp4BoxTree, 'videoStsz');
        var sampleCount = stszBox.samples.length;
        var duration = getDuration(sttsBox, sampleCount);
        var intervalArray = getIntervalArray(stssBox, stszBox);
        var timeInterval = intervalArray.map(function (interval) {
            return getDuration(sttsBox, interval);
        });
        var result = [];
        if (sample + 1 > intervalArray[intervalArray.length - 1]) {
            result = {
                offsetInterVal: [intervalArray[intervalArray.length - 1], sampleCount],
                timeInterVal: [timeInterval[intervalArray.length - 1], duration],
            };
        }
        for (var i = 0; i < intervalArray.length; i++) {
            if (intervalArray[i] < sample + 1 && intervalArray[i + 1] >= sample + 1) {
                result = {
                    offsetInterVal: [intervalArray[i], intervalArray[i + 1]],
                    timeInterVal: [timeInterval[i], timeInterval[i + 1]],
                };
                break;
            }
        }
        return result;
    }
    function getIntervalArray(stssBox, stszBox) {
        var intervalArray = [];
        if (stssBox) {
            intervalArray = stssBox.samples.map(function (sample) { return sample.sampleNumber - 1; });
        }
        else {
            // make a fake GOP when video dont have B/P frame
            for (var i = 0; i <= Math.floor(stszBox.samples.length / 5); i++) {
                intervalArray.push(i * 5);
            }
        }
        return intervalArray;
    }

    function getVideoTrackInfo(videoSamples, mdatBuffer) {
        return {
            samples: videoSamples.map(function (sample) { return (__assign(__assign({}, sample), { buffer: mdatBuffer.slice(sample.start, sample.end) })); }),
            trackId: 1,
        };
    }
    function getAudioTrackInfo(audioSamples, mdatBuffer) {
        return {
            samples: audioSamples.map(function (sample) { return (__assign(__assign({}, sample), { buffer: mdatBuffer.slice(sample.start, sample.end) })); }),
            trackId: 2,
        };
    }

    var MP4Probe = /** @class */ (function () {
        function MP4Probe(mp4BoxTree) {
            var _this = this;
            this.init = function () {
                _this.getMP4Data();
            };
            this.isDraining = function (time) {
                return time > (_this.timeRange[1] - _this.timeRange[0]) / 4 + _this.timeRange[0];
            };
            this.updateInterval = function (time) {
                var _a = _this.mp4Data, videoTimescale = _a.videoTimescale, audioTimescale = _a.audioTimescale;
                if (typeof time === 'number') {
                    _this.videoInterval = getVideoSamplesInterval(_this.mp4BoxTree, time * videoTimescale);
                }
                else {
                    _this.videoInterval = getNextVideoSamplesInterval(_this.mp4BoxTree, _this.videoInterval.offsetInterVal[1]);
                }
                _this.audioInterval = getAudioSamplesInterval(_this.mp4BoxTree, _this.videoInterval);
                var videoTimeRange = _this.videoInterval.timeInterVal.map(function (time) { return time / videoTimescale; });
                var audioTimeRange = _this.audioInterval.timeInterVal.map(function (time) { return time / audioTimescale; });
                _this.timeRange = [
                    Math.min(videoTimeRange[0], audioTimeRange[0]),
                    Math.max(videoTimeRange[1], audioTimeRange[1]),
                ];
            };
            this.getFragmentPosition = function (time) {
                _this.updateInterval(time);
                _this.bufferStart = getBufferStart(_this.mp4BoxTree, _this.videoInterval.offsetInterVal[0], _this.audioInterval.offsetInterVal[0]);
                var _a = _this.getSamples(), videoSamples = _a.videoSamples, audioSamples = _a.audioSamples;
                var stcoBox = findBox(_this.mp4BoxTree, 'videoStco');
                var videoSamplesStart = 0;
                if (videoSamples.length > 0) {
                    videoSamplesStart = videoSamples[videoSamples.length - 1].start;
                }
                var isLastFragmentPosition = videoSamplesStart + videoSamples[videoSamples.length - 1].bufferStart ===
                    stcoBox.samples[stcoBox.samples.length - 1].chunkOffset;
                return getFragmentPosition(videoSamples, audioSamples, _this.bufferStart, isLastFragmentPosition);
            };
            this.getTrackInfo = function (mdatBuffer) {
                var _a = _this.getSamples(), videoSamples = _a.videoSamples, audioSamples = _a.audioSamples;
                var videoTrackInfo = getVideoTrackInfo(videoSamples, mdatBuffer);
                var audioTrackInfo = getAudioTrackInfo(audioSamples, mdatBuffer);
                return {
                    videoTrackInfo: videoTrackInfo,
                    audioTrackInfo: audioTrackInfo,
                };
            };
            this.getSamples = function () {
                var videoSamples = getVideoSamples(_this.mp4BoxTree, _this.bufferStart, _this.videoInterval.offsetInterVal);
                var audioSamples = getAudioSamples(_this.mp4BoxTree, _this.bufferStart, _this.audioInterval.offsetInterVal);
                return {
                    videoSamples: videoSamples,
                    audioSamples: audioSamples,
                };
            };
            this.mp4BoxTree = mp4BoxTree;
            this.mp4Data = {};
            this.init();
        }
        MP4Probe.prototype.getMP4Data = function () {
            var _a = findBox(this.mp4BoxTree, 'mvhd'), duration = _a.duration, timescale = _a.timescale;
            var _b = findBox(this.mp4BoxTree, 'mp4a'), channelCount = _b.channelCount, sampleRate = _b.sampleRate;
            var _c = findBox(this.mp4BoxTree, 'audioMdhd'), audioTimescale = _c.timescale, audioDuration = _c.duration;
            var audioConfig = findBox(this.mp4BoxTree, 'esds').ESDescrTag.DecSpecificDescrTag.audioConfig;
            this.mp4Data = {
                duration: duration,
                timescale: timescale,
                channelCount: channelCount,
                sampleRate: sampleRate,
                audioConfig: audioConfig,
                audioDuration: audioDuration,
                audioTimescale: audioTimescale,
            };
            var hasVideoStream = findBox(this.mp4BoxTree, 'videoTrak');
            if (hasVideoStream) {
                var _d = findBox(this.mp4BoxTree, 'videoTkhd'), width = _d.width, height = _d.height;
                var samples = findBox(this.mp4BoxTree, 'videoStsz').samples;
                var _e = findBox(this.mp4BoxTree, 'avcC'), SPS = _e.SPS, PPS = _e.PPS;
                var _f = findBox(this.mp4BoxTree, 'videoMdhd'), videoTimescale = _f.timescale, videoDuration = _f.duration;
                this.mp4Data = __assign(__assign({}, this.mp4Data), { width: width,
                    height: height,
                    SPS: SPS,
                    PPS: PPS,
                    videoDuration: videoDuration,
                    videoTimescale: videoTimescale, videoSamplesLength: samples.length });
            }
        };
        return MP4Probe;
    }());

    function generateVersionAndFlags(version, flag) {
        return new Uint8Array([
            version & 0xff,
            (flag >> 16) & 0xff,
            (flag >> 8) & 0xff,
            flag & 0xff,
        ]);
    }

    function concatTypedArray() {
        var e_1, _a, e_2, _b;
        var arrays = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            arrays[_i] = arguments[_i];
        }
        var totalLength = 0;
        try {
            for (var arrays_1 = __values(arrays), arrays_1_1 = arrays_1.next(); !arrays_1_1.done; arrays_1_1 = arrays_1.next()) {
                var arr = arrays_1_1.value;
                totalLength += arr.length;
            }
        }
        catch (e_1_1) { e_1 = { error: e_1_1 }; }
        finally {
            try {
                if (arrays_1_1 && !arrays_1_1.done && (_a = arrays_1.return)) _a.call(arrays_1);
            }
            finally { if (e_1) throw e_1.error; }
        }
        var result = new Uint8Array(totalLength);
        var offset = 0;
        try {
            for (var arrays_2 = __values(arrays), arrays_2_1 = arrays_2.next(); !arrays_2_1.done; arrays_2_1 = arrays_2.next()) {
                var arr = arrays_2_1.value;
                result.set(arr, offset);
                offset += arr.length;
            }
        }
        catch (e_2_1) { e_2 = { error: e_2_1 }; }
        finally {
            try {
                if (arrays_2_1 && !arrays_2_1.done && (_b = arrays_2.return)) _b.call(arrays_2);
            }
            finally { if (e_2) throw e_2.error; }
        }
        return result;
    }

    function num2FourBytes(num) {
        return new Uint8Array([
            (num >>> 24) & 0xff,
            (num >>> 16) & 0xff,
            (num >>> 8) & 0xff,
            num & 0xff,
        ]);
    }
    function num2EightBytes(num) {
        var upper = num / Math.pow(2, 32);
        var lower = num % Math.pow(2, 32);
        return new Uint8Array([
            (upper >>> 24) & 0xff,
            (upper >>> 16) & 0xff,
            (upper >>> 8) & 0xff,
            upper & 0xff,
            (lower >>> 24) & 0xff,
            (lower >>> 16) & 0xff,
            (lower >>> 8) & 0xff,
            lower & 0xff,
        ]);
    }

    var char2Hex = function (char) { return char.charCodeAt(); };
    var str2TypedArray = function (str) {
        // 字符串转 uint8 array
        return new Uint8Array(Array.prototype.map.call(str, char2Hex));
    };

    function generateBox(type, content) {
        return concatTypedArray(num2FourBytes(content.length + 8), str2TypedArray(type), content);
    }

    function generatePredefined(length) {
        return generateZeroBytes(length);
    }
    function generateReserved(length) {
        return generateZeroBytes(length);
    }
    function generateZeroBytes(bytes) {
        return new Uint8Array(bytes);
    }

    // prettier-ignore
    var ftyp$1 = (function () {
        var content = new Uint8Array([
            0x69, 0x73, 0x6F, 0x6D,
            0x00, 0x00, 0x00, 0x01,
            0x69, 0x73, 0x6F, 0x6D,
            0x61, 0x76, 0x63, 0x31,
        ]);
        return generateBox('ftyp', content);
    });

    // prettier-ignore
    var MATRIX_TYPED_ARRAY = new Uint8Array([
        0x00, 0x01, 0x00, 0x00,
        0x00, 0x00, 0x00, 0x00,
        0x00, 0x00, 0x00, 0x00,
        0x00, 0x00, 0x00, 0x00,
        0x00, 0x01, 0x00, 0x00,
        0x00, 0x00, 0x00, 0x00,
        0x00, 0x00, 0x00, 0x00,
        0x00, 0x00, 0x00, 0x00,
        0x40, 0x00, 0x00, 0x00,
    ]);

    function mvhd$1(data) {
        var duration = data.duration, timescale = data.timescale;
        // prettier-ignore
        var content = new Uint8Array(__spread([
            0x01, 0x00, 0x00, 0x00,
            0x00, 0x00, 0x00, 0x00,
            0x00, 0x00, 0x00, 0x00,
            0x00, 0x00, 0x00, 0x00,
            0x00, 0x00, 0x00, 0x00
        ], num2FourBytes(timescale), num2EightBytes(duration), [
            0x00, 0x01, 0x00, 0x00,
            0x01, 0x00
        ], generateReserved(10), MATRIX_TYPED_ARRAY, generatePredefined(24), [
            0xff, 0xff, 0xff, 0xff // next_track_ID
        ]));
        return generateBox('mvhd', content);
    }

    function tkhd$1(data) {
        var type = data.type, duration = data.duration, width = data.width, height = data.height;
        // prettier-ignore
        var content = new Uint8Array(__spread(generateVersionAndFlags(1, 7), [
            0x00, 0x00, 0x00, 0x00,
            0x00, 0x00, 0x00, 0x00,
            0x00, 0x00, 0x00, 0x00,
            0x00, 0x00, 0x00, 0x00
        ], num2FourBytes(type === 'video' ? 1 : 2), generateReserved(4), num2EightBytes(duration), generateReserved(8), [
            0x00, 0x00,
            0x00, 0x00,
            0x00, 0x00,
            0x00, 0x00
        ], MATRIX_TYPED_ARRAY, [
            (width >> 8) & 0xff, width & 0xff,
            0x00, 0x00,
            (height >> 8) & 0xff, height & 0xff,
            0x00, 0x00,
        ]));
        return generateBox('tkhd', content);
    }

    function mdhd$2(data) {
        var type = data.type;
        var duration;
        var timescale;
        if (type === 'video') {
            duration = data.videoDuration;
            timescale = data.videoTimescale;
        }
        else {
            duration = data.audioDuration;
            timescale = data.audioTimescale;
        }
        // prettier-ignore
        var content = new Uint8Array(__spread(generateVersionAndFlags(1, 0), [
            0x00, 0x00, 0x00, 0x00,
            0x00, 0x00, 0x00, 0x00,
            0x00, 0x00, 0x00, 0x00,
            0x00, 0x00, 0x00, 0x00
        ], num2FourBytes(timescale), num2EightBytes(duration), [
            0x55, 0xc4,
            0x00, 0x00,
        ]));
        return generateBox('mdhd', content);
    }

    function hdlr$1(type) {
        var handler = '';
        var name = '';
        switch (type) {
            case 'video':
                handler = 'vide';
                name = 'VideoHandler';
                break;
            case 'audio':
                handler = 'soun';
                name = 'SoundHandler';
        }
        // prettier-ignore
        var content = new Uint8Array(__spread(generateVersionAndFlags(0, 0), generatePredefined(4), str2TypedArray(handler), generateReserved(12), str2TypedArray(name), [
            0x00,
        ]));
        return generateBox('hdlr', content);
    }

    function vmhd$1() {
        // prettier-ignore
        var content = new Uint8Array(__spread(generateVersionAndFlags(0, 1), [
            0x00, 0x00,
            0x00, 0x00, 0x00, 0x00,
            0x00, 0x00
        ]));
        return generateBox('vmhd', content);
    }

    function smhd$1() {
        // prettier-ignore
        var content = __spread(generateVersionAndFlags(0, 0), [
            0x00, 0x00, 0x00, 0x00 // balance(2) + reserved(2)
        ]);
        return generateBox('smhd', content);
    }

    function dinf() {
        return generateBox('dinf', dref$1());
    }
    function dref$1() {
        // prettier-ignore
        var content = concatTypedArray(new Uint8Array(__spread(generateVersionAndFlags(0, 0), [
            0x00, 0x00, 0x00, 0x01,
        ])), url$1());
        return generateBox('dref', content);
    }
    function url$1() {
        // prettier-ignore
        return generateBox('url ', [0x00, 0x00, 0x00, 0x01]);
    }

    function avcC$1(data) {
        var SPS = data.SPS, PPS = data.PPS;
        // prettier-ignore
        var content = new Uint8Array(__spread([
            0x01,
            SPS[1],
            SPS[2],
            SPS[3],
            0xfc | 3,
            0xE0 | 1,
            SPS.length >> 8 & 0xff,
            SPS.length & 0xff
        ], SPS, [
            0x01,
            PPS.length >> 8 & 0xff,
            PPS.length & 0xff
        ], PPS));
        return generateBox('avcC', content);
    }

    function acv1(data) {
        var width = data.width, height = data.height;
        // prettier-ignore
        var content = new Uint8Array(__spread(generateReserved(6), [
            0x00, 0x01
        ], generatePredefined(16), [
            (width >> 8) & 0xff, width & 0xff,
            (height >> 8) & 0xff, height & 0xff,
            0x00, 0x48, 0x00, 0x00,
            0x00, 0x48, 0x00, 0x00
        ], generateReserved(4), [
            0x00, 0x01,
            0x0B,
            0x57, 0x41, 0x4E, 0x47,
            0x4C, 0x75, 0x76,
            0X44, 0x41, 0x4E, 0x47
        ], generatePredefined(20), [
            0x00, 0x18,
            // 设置成 0x00, 0x00 的话 safari 无法正常播放。
            0xff, 0xff,
        ]));
        content = concatTypedArray(content, avcC$1(data));
        return generateBox('avc1', content);
    }

    function esds$1(data) {
        var _a = data.audioConfig, config = _a === void 0 ? [43, 146, 8, 0] : _a;
        // prettier-ignore
        var content = new Uint8Array(__spread(generateVersionAndFlags(0, 0), [
            0x03,
            0x17 + config.length,
            0x00, 0x01,
            0x00,
            0x04,
            0x0f + config.length,
            0x40,
            0x15,
            0x00, 0x00, 0x00,
            0x00, 0x00, 0x00, 0x00,
            0x00, 0x00, 0x00, 0x00,
            0x05,
            config.length
        ], config, [
            0x06, 0x01, 0x02,
        ]));
        return generateBox('esds', content);
    }

    function mp4a$1(data) {
        var channelCount = data.channelCount, sampleRate = data.sampleRate;
        // prettier-ignore
        var content = new Uint8Array(__spread(generateReserved(6), [
            0x00, 0x01
        ], generateReserved(8), [
            0x00, channelCount,
            0x00, 0x10
        ], generateReserved(4), [
            (sampleRate >> 8) & 0xFF,
            (sampleRate) & 0xFF,
            0x00, 0x00
        ]));
        content = concatTypedArray(content, esds$1(data));
        return generateBox('mp4a', content);
    }

    function stsd$1(data) {
        var type = data.type;
        var content;
        if (type === 'video') {
            content = acv1(data);
        }
        else if (type === 'audio') {
            content = mp4a$1(data);
        }
        content = concatTypedArray(
        // prettier-ignore
        new Uint8Array(__spread(generateVersionAndFlags(0, 0), [
            0x00, 0x00, 0x00, 0x01 // entry_count
        ])), content);
        return generateBox('stsd', content);
    }

    function stbl(data) {
        var content = concatTypedArray(stsd$1(data), stts$1(), stsc(), stsz(), stco$1());
        return generateBox('stbl', content);
    }
    var stsz = function () {
        // prettier-ignore
        var content = new Uint8Array(__spread(generateVersionAndFlags(0, 0), [
            0x00, 0x00, 0x00, 0x00,
            0x00, 0x00, 0x00, 0x00 // sample_count
        ]));
        return generateBox('stsz', content);
    };
    var stsc = function () {
        // prettier-ignore
        var content = new Uint8Array(__spread(generateVersionAndFlags(0, 0), [
            0x00, 0x00, 0x00, 0x00,
        ]));
        return generateBox('stsc', content);
    };
    var stts$1 = function () {
        // prettier-ignore
        var content = new Uint8Array(__spread(generateVersionAndFlags(0, 0), [
            0x00, 0x00, 0x00, 0x00,
        ]));
        return generateBox('stts', content);
    };
    var stco$1 = function () {
        // prettier-ignore
        var content = new Uint8Array(__spread(generateVersionAndFlags(0, 0), [
            0x00, 0x00, 0x00, 0x00,
        ]));
        return generateBox('stco', content);
    };

    function minf(data) {
        var type = data.type;
        var header = '';
        switch (type) {
            case 'video':
                header = vmhd$1();
                break;
            case 'audio':
                header = smhd$1();
                break;
        }
        var content = concatTypedArray(header, dinf(), stbl(data));
        return generateBox('minf', content);
    }

    function mdia(data) {
        var content = concatTypedArray(mdhd$2(data), hdlr$1(data.type), minf(data));
        return generateBox('mdia', content);
    }

    function trak(data) {
        var content = concatTypedArray(tkhd$1(data), mdia(data));
        return generateBox('trak', content);
    }

    function mvex(data) {
        var content = concatTypedArray(mehd(data), trex(1), trex(2));
        return generateBox('mvex', content);
    }
    function mehd(data) {
        var duration = data.duration;
        // prettier-ignore
        var content = new Uint8Array(__spread(generateVersionAndFlags(0, 0), num2FourBytes(duration)));
        return generateBox('mehd', content);
    }
    function trex(trackId) {
        // prettier-ignore
        var content = new Uint8Array(__spread(generateVersionAndFlags(0, 0), num2FourBytes(trackId), [
            0x00, 0x00, 0x00, 0x01,
            0x00, 0x00, 0x00, 0x00,
            0x00, 0x00, 0x00, 0x00,
            0x00, 0x01, 0x00, 0x01 // default_sample_flags
        ]));
        return generateBox('trex', content);
    }

    function moov(data, type) {
        var content = concatTypedArray(mvhd$1(data), trak(__assign(__assign({}, data), { type: type })), mvex(data));
        return generateBox('moov', content);
    }

    function mfhd(data) {
        var sequenceNumber = data.sequenceNumber;
        // prettier-ignore
        var content = new Uint8Array(__spread(generateVersionAndFlags(0, 0), num2FourBytes(sequenceNumber)));
        return generateBox('mfhd', content);
    }

    function tfhd(data) {
        var trackId = data.trackId;
        // prettier-ignore
        return generateBox('tfhd', new Uint8Array(__spread(generateVersionAndFlags(0, 0), num2FourBytes(trackId))));
    }

    function sdtp$1(data) {
        var samples = data.samples;
        var content = concatTypedArray.apply(void 0, __spread([[0x00, 0x00, 0x00, 0x00]], samples.map(function () { return new Uint8Array([0x10]); }) // FIXME: need sample flags
        ));
        return generateBox('sdtp', content);
    }

    function tfdt(data) {
        var baseMediaDecodeTime = data.baseMediaDecodeTime;
        // prettier-ignore
        var content = new Uint8Array(__spread(generateVersionAndFlags(1, 0), [
            0x00, 0x00, 0x00, 0x00,
            (baseMediaDecodeTime >>> 24) & 0xFF,
            (baseMediaDecodeTime >>> 16) & 0xFF,
            (baseMediaDecodeTime >>> 8) & 0xFF,
            (baseMediaDecodeTime) & 0xFF
        ]));
        return generateBox('tfdt', content);
    }

    function trun(data) {
        var samples = data.samples, trackId = data.trackId;
        var ceil = trackId === 1 ? 16 : 12;
        var length = samples.length;
        // mdat-header 8
        // moof-header 8
        // mfhd 16
        // traf-header 8
        // thhd 16
        // tfdt 20
        // trun-header 12
        // sampleCount 4
        // data-offset 4
        // samples.length
        // sdtp-header 12
        var offset = 108 + ceil * length + samples.length;
        // prettier-ignore
        var content = new Uint8Array(__spread([
            0x00, 0x00, trackId === 1 ? 0x0f : 0x07, 0x01
        ], num2FourBytes(samples.length), num2FourBytes(offset), concatTypedArray.apply(void 0, __spread(samples.map(function (sample, index) {
            var duration = sample.duration, size = sample.size, compositionTimeOffset = sample.compositionTimeOffset;
            return concatTypedArray(num2FourBytes(duration), num2FourBytes(size), trackId === 1
                ? index === 0 // FIXME:need sample flags
                    ? [0x02, 0x00, 0x00, 0x00]
                    : [0x01, 0x01, 0x00, 0x00]
                : [0x01, 0x00, 0x00, 0x00], trackId === 1 ? num2FourBytes(compositionTimeOffset) : []);
        })))));
        return generateBox('trun', content);
    }

    function traf(data) {
        var content = concatTypedArray(tfhd(data), tfdt(data), sdtp$1(data), trun(data));
        return generateBox('traf', content);
    }

    function moof(data) {
        var content = concatTypedArray(mfhd(data), traf(data));
        return generateBox('moof', content);
    }

    function mdat$1(data) {
        return generateBox('mdat', data);
    }

    var FMP4Generator = /** @class */ (function () {
        function FMP4Generator() {
        }
        FMP4Generator.ftyp = function () {
            return ftyp$1();
        };
        FMP4Generator.moov = function (data, type) {
            return moov(data, type);
        };
        FMP4Generator.moof = function (trackInfo, baseMediaDecodeTime) {
            return moof(Object.assign({}, trackInfo, {
                sequenceNumber: FMP4Generator.sequenceNumber++,
                baseMediaDecodeTime: baseMediaDecodeTime,
            }));
        };
        FMP4Generator.mdat = function (trackInfo) {
            var samples = trackInfo.samples.map(function (sample) { return new Uint8Array(sample.buffer); });
            return mdat$1(concatTypedArray.apply(void 0, __spread(samples)));
        };
        FMP4Generator.sequenceNumber = 1;
        return FMP4Generator;
    }());

    var SEGMENTBYTE = 200000;
    var MSE = /** @class */ (function () {
        function MSE(videoEl, src) {
            var _this = this;
            this.sourceBuffer = { video: '', audio: '' };
            this.videoQueue = [];
            this.audioQueue = [];
            this.needUpdateTime = false;
            // 加载数据
            this.loader = function (start, end) {
                if (start === void 0) { start = 0; }
                if (end === void 0) { end = SEGMENTBYTE; }
                return new Promise(function (resolve, reject) {
                    ffetch({ url: _this.src, start: start, end: end }).then(function (data) {
                        resolve(data);
                    });
                });
            };
            // 1、 初始媒体信息
            this.initSource = function () {
                _this.mediaSource = new MediaSource();
                _this.mediaSource.addEventListener('sourceopen', function (evt) { return _this.sourceOpen(evt); });
                _this.videoEl.src = URL.createObjectURL(_this.mediaSource);
            };
            // 2、 监听媒体接口
            this.sourceOpen = function (evt) {
                _this.evt = evt;
                // 销毁url， 控制内存
                // URL.revokeObjectURL(this.videoEl.src);
                // URL.revokeObjectURL(evt.target.src);
                var mimeTypes = {
                    // video/mp4; codecs="avc1.42E01E,mp4a.40.2"
                    // video/mp4; codecs="avc1.64001E, mp4a.40.5"
                    // video/mp4; codecs="avc1.64001E, mp4a.40.5"
                    // video: 'video/mp4; codecs="avc1.64001E, mp4a.40.5"',
                    // video: 'video/mp4; codecs="avc1.64001f"',
                    video: 'video/mp4; codecs="avc1.42E01E"',
                    audio: 'audio/mp4; codecs="mp4a.40.2"',
                };
                _this.sourceBuffer.video = _this.mediaSource.addSourceBuffer(mimeTypes.video);
                _this.sourceBuffer.audio = _this.mediaSource.addSourceBuffer(mimeTypes.audio);
                _this.sourceBuffer.video.addEventListener('updateend', function () {
                    var buffer = _this.videoQueue.shift();
                    if (buffer && _this.mediaSource.readyState === 'open') {
                        _this.handleAppendBuffer(buffer, 'video');
                    }
                    if (_this.needUpdateTime) {
                        _this.needUpdateTime = false;
                        _this.handleTimeUpdate();
                    }
                });
                _this.sourceBuffer.audio.addEventListener('updateend', function () {
                    var buffer = _this.audioQueue.shift();
                    if (buffer && _this.mediaSource.readyState === 'open') {
                        _this.handleAppendBuffer(buffer, 'audio');
                    }
                });
            };
            this.handleTimeUpdate = function () {
                if (!_this.mp4Probe) {
                    return;
                }
                var _a = _this.mp4Probe, _b = _a.videoInterval, _c = (_b === void 0 ? [] : _b).offsetInterVal, offsetInterVal = _c === void 0 ? [] : _c, videoSamplesLength = _a.mp4Data.videoSamplesLength, _d = _a.timeRange, timeRange = _d === void 0 ? [] : _d;
                if (_this.mediaSource.readyState !== 'closed') {
                    if (offsetInterVal[1] === videoSamplesLength &&
                        _this.videoEl.currentTime > timeRange[0]) {
                        _this.destroy();
                    }
                    else if (_this.shouldFetchNextSegment()) {
                        _this.seek();
                    }
                }
            };
            this.shouldFetchNextSegment = function () {
                _this.handleReplayCase();
                if (_this.mp4Probe.isDraining(_this.videoEl.currentTime)) {
                    return true;
                }
                return false;
            };
            this.handleReplayCase = function () {
                console.log('this.mediaSource.readyState>>>>>>', _this.mediaSource.readyState);
                if (_this.mediaSource.readyState === 'ended') {
                    // If MediaSource.readyState value is ended,
                    // setting SourceBuffer.timestampOffset will cause this value to transition to open.
                    _this.sourceBuffer.video.timestampOffset = 0;
                }
            };
            this.destroy = function () {
                _this.mediaSource.removeEventListener('sourceopen', _this.sourceOpen);
                URL.revokeObjectURL(_this.videoEl.src);
                if (_this.mediaSource.readyState === 'open' &&
                    !_this.sourceBuffer.video.updating &&
                    !_this.sourceBuffer.audio.updating) {
                    _this.mediaSource.endOfStream();
                }
            };
            this.init = function () {
                //  根据分辨率像素数据。
                var chunkSize = 1280 * 640;
                // const chunkSize = 4691480;
                _this.loader(0, chunkSize).then(function (res) {
                    return res.arrayBuffer();
                }).then(function (data) {
                    // 分析媒体格式
                    return new Mp4Parse(new Uint8Array(data)).mp4BoxTreeObject;
                }).then(function (mp4BoxTreeObject) {
                    console.log('mp4BoxTreeObject::::>>>>>>', mp4BoxTreeObject);
                    // 获取关键帧
                    // 获取流媒体关键信息
                    _this.mp4Probe = new MP4Probe(mp4BoxTreeObject);
                    _this.mp4Probe.mp4BoxTreeObject = mp4BoxTreeObject;
                    console.log('mp4BoxTreeObject.moov.duration', mp4BoxTreeObject.moov);
                    // 设置视频
                    _this.evt.duration = mp4BoxTreeObject.moov.mvhd.duration / mp4BoxTreeObject.moov.mvhd.timescale;
                    console.log(' this.mediaSource.duration', _this.evt.duration);
                    // 合成FMP4视频信息
                    var videoRawData = concatTypedArray(FMP4Generator.ftyp(), FMP4Generator.moov(_this.mp4Probe.mp4Data, 'video'));
                    var audioRawData = concatTypedArray(FMP4Generator.ftyp(), FMP4Generator.moov(_this.mp4Probe.mp4Data, 'audio'));
                    console.log('this.mediaSource.readyState', _this.mediaSource.readyState);
                    if (_this.mediaSource.readyState === 'open') {
                        // this.sourceBuffer.video.appendBuffer(videoRawData);
                        // this.sourceBuffer.audio.appendBuffer(audioRawData);
                        _this.handleAppendBuffer(videoRawData, 'video');
                        _this.handleAppendBuffer(audioRawData, 'audio');
                        console.log('=>>>>>>>>>');
                        // this.seek(0)/
                    }
                    // 获取视频关键信息
                });
            };
            this.seek = function (time) {
                var _a = __read(_this.mp4Probe.getFragmentPosition(time), 2), start = _a[0], end = _a[1];
                _this.handleReplayCase();
                _this.loader(start, end).then(function (res) {
                    return res.arrayBuffer();
                }).then(function (mdatBuffer) {
                    var _a = _this.mp4Probe.getTrackInfo(mdatBuffer), videoTrackInfo = _a.videoTrackInfo, audioTrackInfo = _a.audioTrackInfo;
                    var _b = _this.mp4Probe, videoInterval = _b.videoInterval, audioInterval = _b.audioInterval;
                    var videoBaseMediaDecodeTime = videoInterval.timeInterVal[0];
                    var audioBaseMediaDecodeTime = audioInterval.timeInterVal[0];
                    var videoRawData = concatTypedArray(FMP4Generator.moof(videoTrackInfo, videoBaseMediaDecodeTime), FMP4Generator.mdat(videoTrackInfo));
                    if (audioTrackInfo.samples.length !== 0) {
                        var audioRawData = concatTypedArray(FMP4Generator.moof(audioTrackInfo, audioBaseMediaDecodeTime), FMP4Generator.mdat(audioTrackInfo));
                        _this.handleAppendBuffer(audioRawData, 'audio');
                    }
                    _this.handleAppendBuffer(videoRawData, 'video');
                    if (time) {
                        _this.needUpdateTime = true;
                    }
                    // console.log('endOfStream')
                    // this.mediaSource.endOfStream()
                });
            };
            this.handleAppendBuffer = function (buffer, type) {
                if (_this.mediaSource.readyState === 'open') {
                    try {
                        if (_this.sourceBuffer[type]) {
                            console.log('this.sourceBuffer[type]: ', type, buffer);
                            _this.sourceBuffer[type].appendBuffer(buffer);
                        }
                    }
                    catch (error) {
                        // see https://developers.google.com/web/updates/2017/10/quotaexceedederror
                        if (error.code === 22) {
                            console.log('error::::', error);
                            _this.handleQuotaExceededError(buffer, type);
                        }
                        else {
                            throw error;
                        }
                    }
                }
                else {
                    console.log('[`${type}Queue`] ', type + "Queue", buffer);
                    _this[type + "Queue"].push(buffer);
                }
            };
            this.handleQuotaExceededError = function (buffer, type) {
                for (var key in _this.sourceBuffer) {
                    var track = _this.sourceBuffer[key];
                    var currentTime = _this.videoEl.currentTime;
                    var removeStart = 0;
                    if (track.buffered.length > 0) {
                        removeStart = track.buffered.start(0) + 10;
                    }
                    _this.removeBuffer(removeStart, currentTime - 10, key);
                }
                // re-append(maybe should lower the playback resolution)
                _this.handleAppendBuffer(buffer, type);
            };
            this.videoEl = videoEl;
            this.src = src;
            this.initSource();
        }
        MSE.prototype.removeBuffer = function (start, end, type) {
            console.log('removeBuffer');
            var track = this.sourceBuffer[type];
            if (track.updating) {
                // const {isSafari} = ua
                // if (isSafari) {
                //   // Safari 9/10/11/12 does not correctly implement abort() on SourceBuffer.
                //   // Calling abort() before appending a segment causes that segment to be
                //   // incomplete in buffer.
                //   // Bug filed: https://bugs.webkit.org/show_bug.cgi?id=165342
                //   abortPolyfill()
                // }
                track.abort();
            }
            track.remove(start, end);
        };
        return MSE;
    }());

    // import MSE from './mse/index2';
    var videoEL = document.querySelector('#videoEl');
    var init = document.querySelector('#init');
    var play = document.querySelector('#play');
    var nextSegment = document.querySelector('#nextSegment');
    // const mse  = new MSE(videoEL, 'http://localhost:3000/old.mp4');
    // const mse  = new MSE(videoEL, 'https://testdevcdn.xylink.com/test-video/video.mp4?v=2');
    // const mse  = new MSE(videoEL, 'https://devcdn.xylink.com/video-tset/dpi1.mp4');
    // const mse  = new MSE(videoEL, 'http://localhost:3000/1.mp4');
    // const mse  = new MSE(videoEL, 'https://devcdn.xylink.com/video-tset/test.mp4'); // not fmp4d
    // const mse = new MSE(videoEL, 'https://testdevcdn.xylink.com/test-video/video.mp4'); // not fmp4d
    // const mse = new MSE(videoEL, 'https://testdevcdn.xylink.com/test-video/xg360.mp4'); // not fmp4d  last moov
    var mse = new MSE(videoEL, 'https://testdevcdn.xylink.com/test-video/xg360Moov.mp4'); // not fmp4d  first moov
    // const mse  = new MSE(videoEL, 'https://devcdn.xylink.com/video-tset/base.mp4'); //  fmp4
    // mse.init()
    init.addEventListener('click', function () {
        mse.init();
    });
    play.addEventListener('click', function () {
        // videoEL.play()
        mse.seek(0);
    });
    videoEL.addEventListener('timeupdate', function () {
        console.log('timeupdate');
        mse.handleTimeUpdate();
    });
    videoEL.addEventListener('seeking', function () {
        console.log('seeking');
        var currentTime = videoEL.currentTime;
        var buffered = videoEL.buffered;
        if (buffered && buffered.length > 0) {
            if (currentTime - 0.1 > buffered.start(0)) {
                mse.seek(videoEL.currentTime);
            }
        }
        else {
            mse.seek(videoEL.currentTime);
        }
    });
    nextSegment.addEventListener('click', function () {
        mse.seek(20);
        // videoEL.play().then(() => {
        //   console.log('play')
        // }).catch((err) => {
        //   console.log('err', err)
        // })
    });

}());
//# sourceMappingURL=index.iife.js.map
