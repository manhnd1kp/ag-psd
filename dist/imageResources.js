"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resourceHandlersMap = exports.resourceHandlers = void 0;
var base64_js_1 = require("base64-js");
var psdReader_1 = require("./psdReader");
var psdWriter_1 = require("./psdWriter");
var helpers_1 = require("./helpers");
var utf8_1 = require("./utf8");
var descriptor_1 = require("./descriptor");
exports.resourceHandlers = [];
exports.resourceHandlersMap = {};
function addHandler(key, has, read, write) {
    var handler = { key: key, has: has, read: read, write: write };
    exports.resourceHandlers.push(handler);
    exports.resourceHandlersMap[handler.key] = handler;
}
var LOG_MOCK_HANDLERS = false;
var RESOLUTION_UNITS = [undefined, 'PPI', 'PPCM'];
var MEASUREMENT_UNITS = [undefined, 'Inches', 'Centimeters', 'Points', 'Picas', 'Columns'];
var hex = '0123456789abcdef';
function charToNibble(code) {
    return code <= 57 ? code - 48 : code - 87;
}
function byteAt(value, index) {
    return (charToNibble(value.charCodeAt(index)) << 4) | charToNibble(value.charCodeAt(index + 1));
}
function readUtf8String(reader, length) {
    var buffer = psdReader_1.readBytes(reader, length);
    return utf8_1.decodeString(buffer);
}
function writeUtf8String(writer, value) {
    var buffer = utf8_1.encodeString(value);
    psdWriter_1.writeBytes(writer, buffer);
}
helpers_1.MOCK_HANDLERS && addHandler(1028, // IPTC-NAA record
function (// IPTC-NAA record
target) { return target._ir1028 !== undefined; }, function (reader, target, left) {
    LOG_MOCK_HANDLERS && console.log('image resource 1028', left());
    target._ir1028 = psdReader_1.readBytes(reader, left());
}, function (writer, target) {
    psdWriter_1.writeBytes(writer, target._ir1028);
});
addHandler(1061, function (target) { return target.captionDigest !== undefined; }, function (reader, target) {
    var captionDigest = '';
    for (var i = 0; i < 16; i++) {
        var byte = psdReader_1.readUint8(reader);
        captionDigest += hex[byte >> 4];
        captionDigest += hex[byte & 0xf];
    }
    target.captionDigest = captionDigest;
}, function (writer, target) {
    for (var i = 0; i < 16; i++) {
        psdWriter_1.writeUint8(writer, byteAt(target.captionDigest, i * 2));
    }
});
addHandler(1060, function (target) { return target.xmpMetadata !== undefined; }, function (reader, target, left) { return target.xmpMetadata = readUtf8String(reader, left()); }, function (writer, target) { return writeUtf8String(writer, target.xmpMetadata); });
var Inte = helpers_1.createEnum('Inte', 'perceptual', {
    'perceptual': 'Img ',
    'saturation': 'Grp ',
    'relative colorimetric': 'Clrm',
    'absolute colorimetric': 'AClr',
});
addHandler(1082, function (target) { return target.printInformation !== undefined; }, function (reader, target) {
    var _a, _b;
    var desc = descriptor_1.readVersionAndDescriptor(reader);
    target.printInformation = {
        printerName: desc.printerName || '',
        renderingIntent: Inte.decode((_a = desc.Inte) !== null && _a !== void 0 ? _a : 'Inte.Img '),
    };
    var info = target.printInformation;
    if (desc.PstS !== undefined)
        info.printerManagesColors = desc.PstS;
    if (desc['Nm  '] !== undefined)
        info.printerProfile = desc['Nm  '];
    if (desc.MpBl !== undefined)
        info.blackPointCompensation = desc.MpBl;
    if (desc.printSixteenBit !== undefined)
        info.printSixteenBit = desc.printSixteenBit;
    if (desc.hardProof !== undefined)
        info.hardProof = desc.hardProof;
    if (desc.printProofSetup) {
        if ('Bltn' in desc.printProofSetup) {
            info.proofSetup = { builtin: desc.printProofSetup.Bltn.split('.')[1] };
        }
        else {
            info.proofSetup = {
                profile: desc.printProofSetup.profile,
                renderingIntent: Inte.decode((_b = desc.printProofSetup.Inte) !== null && _b !== void 0 ? _b : 'Inte.Img '),
                blackPointCompensation: !!desc.printProofSetup.MpBl,
                paperWhite: !!desc.printProofSetup.paperWhite,
            };
        }
    }
}, function (writer, target) {
    var _a, _b;
    var info = target.printInformation;
    var desc = {};
    if (info.printerManagesColors) {
        desc.PstS = true;
    }
    else {
        if (info.hardProof !== undefined)
            desc.hardProof = !!info.hardProof;
        desc.ClrS = 'ClrS.RGBC'; // TODO: ???
        desc['Nm  '] = (_a = info.printerProfile) !== null && _a !== void 0 ? _a : 'CIE RGB';
    }
    desc.Inte = Inte.encode(info.renderingIntent);
    if (!info.printerManagesColors)
        desc.MpBl = !!info.blackPointCompensation;
    desc.printSixteenBit = !!info.printSixteenBit;
    desc.printerName = info.printerName || '';
    if (info.proofSetup && 'profile' in info.proofSetup) {
        desc.printProofSetup = {
            profile: info.proofSetup.profile || '',
            Inte: Inte.encode(info.proofSetup.renderingIntent),
            MpBl: !!info.proofSetup.blackPointCompensation,
            paperWhite: !!info.proofSetup.paperWhite,
        };
    }
    else {
        desc.printProofSetup = {
            Bltn: ((_b = info.proofSetup) === null || _b === void 0 ? void 0 : _b.builtin) ? "builtinProof." + info.proofSetup.builtin : 'builtinProof.proofCMYK',
        };
    }
    descriptor_1.writeVersionAndDescriptor(writer, '', 'printOutput', desc);
});
helpers_1.MOCK_HANDLERS && addHandler(1083, // Print style
function (// Print style
target) { return target._ir1083 !== undefined; }, function (reader, target, left) {
    LOG_MOCK_HANDLERS && console.log('image resource 1083', left());
    target._ir1083 = psdReader_1.readBytes(reader, left());
    // TODO:
    // const desc = readVersionAndDescriptor(reader);
    // console.log('1083', require('util').inspect(desc, false, 99, true));
}, function (writer, target) {
    psdWriter_1.writeBytes(writer, target._ir1083);
});
addHandler(1005, function (target) { return target.resolutionInfo !== undefined; }, function (reader, target) {
    var horizontalResolution = psdReader_1.readFixedPoint32(reader);
    var horizontalResolutionUnit = psdReader_1.readUint16(reader);
    var widthUnit = psdReader_1.readUint16(reader);
    var verticalResolution = psdReader_1.readFixedPoint32(reader);
    var verticalResolutionUnit = psdReader_1.readUint16(reader);
    var heightUnit = psdReader_1.readUint16(reader);
    target.resolutionInfo = {
        horizontalResolution: horizontalResolution,
        horizontalResolutionUnit: RESOLUTION_UNITS[horizontalResolutionUnit] || 'PPI',
        widthUnit: MEASUREMENT_UNITS[widthUnit] || 'Inches',
        verticalResolution: verticalResolution,
        verticalResolutionUnit: RESOLUTION_UNITS[verticalResolutionUnit] || 'PPI',
        heightUnit: MEASUREMENT_UNITS[heightUnit] || 'Inches',
    };
}, function (writer, target) {
    var info = target.resolutionInfo;
    psdWriter_1.writeFixedPoint32(writer, info.horizontalResolution || 0);
    psdWriter_1.writeUint16(writer, Math.max(1, RESOLUTION_UNITS.indexOf(info.horizontalResolutionUnit)));
    psdWriter_1.writeUint16(writer, Math.max(1, MEASUREMENT_UNITS.indexOf(info.widthUnit)));
    psdWriter_1.writeFixedPoint32(writer, info.verticalResolution || 0);
    psdWriter_1.writeUint16(writer, Math.max(1, RESOLUTION_UNITS.indexOf(info.verticalResolutionUnit)));
    psdWriter_1.writeUint16(writer, Math.max(1, MEASUREMENT_UNITS.indexOf(info.heightUnit)));
});
var printScaleStyles = ['centered', 'size to fit', 'user defined'];
addHandler(1062, function (target) { return target.printScale !== undefined; }, function (reader, target) {
    target.printScale = {
        style: printScaleStyles[psdReader_1.readInt16(reader)],
        x: psdReader_1.readFloat32(reader),
        y: psdReader_1.readFloat32(reader),
        scale: psdReader_1.readFloat32(reader),
    };
}, function (writer, target) {
    var _a = target.printScale, style = _a.style, x = _a.x, y = _a.y, scale = _a.scale;
    psdWriter_1.writeInt16(writer, Math.max(0, printScaleStyles.indexOf(style)));
    psdWriter_1.writeFloat32(writer, x || 0);
    psdWriter_1.writeFloat32(writer, y || 0);
    psdWriter_1.writeFloat32(writer, scale || 0);
});
addHandler(1006, function (target) { return target.alphaChannelNames !== undefined; }, function (reader, target, left) {
    target.alphaChannelNames = [];
    while (left()) {
        var value = psdReader_1.readPascalString(reader, 1);
        target.alphaChannelNames.push(value);
    }
}, function (writer, target) {
    for (var _i = 0, _a = target.alphaChannelNames; _i < _a.length; _i++) {
        var name_1 = _a[_i];
        psdWriter_1.writePascalString(writer, name_1, 1);
    }
});
addHandler(1045, function (target) { return target.alphaChannelNames !== undefined; }, function (reader, target, left) {
    target.alphaChannelNames = [];
    while (left()) {
        target.alphaChannelNames.push(psdReader_1.readUnicodeString(reader));
    }
}, function (writer, target) {
    for (var _i = 0, _a = target.alphaChannelNames; _i < _a.length; _i++) {
        var name_2 = _a[_i];
        psdWriter_1.writeUnicodeStringWithPadding(writer, name_2);
    }
});
helpers_1.MOCK_HANDLERS && addHandler(1077, function (target) { return target._ir1077 !== undefined; }, function (reader, target, left) {
    LOG_MOCK_HANDLERS && console.log('image resource 1077', left());
    target._ir1077 = psdReader_1.readBytes(reader, left());
}, function (writer, target) {
    psdWriter_1.writeBytes(writer, target._ir1077);
});
addHandler(1053, function (target) { return target.alphaIdentifiers !== undefined; }, function (reader, target, left) {
    target.alphaIdentifiers = [];
    while (left() >= 4) {
        target.alphaIdentifiers.push(psdReader_1.readUint32(reader));
    }
}, function (writer, target) {
    for (var _i = 0, _a = target.alphaIdentifiers; _i < _a.length; _i++) {
        var id = _a[_i];
        psdWriter_1.writeUint32(writer, id);
    }
});
addHandler(1010, function (target) { return target.backgroundColor !== undefined; }, function (reader, target) { return target.backgroundColor = psdReader_1.readColor(reader); }, function (writer, target) { return psdWriter_1.writeColor(writer, target.backgroundColor); });
addHandler(1037, function (target) { return target.globalAngle !== undefined; }, function (reader, target) { return target.globalAngle = psdReader_1.readUint32(reader); }, function (writer, target) { return psdWriter_1.writeUint32(writer, target.globalAngle); });
addHandler(1049, function (target) { return target.globalAltitude !== undefined; }, function (reader, target) { return target.globalAltitude = psdReader_1.readUint32(reader); }, function (writer, target) { return psdWriter_1.writeUint32(writer, target.globalAltitude); });
addHandler(1011, function (target) { return target.printFlags !== undefined; }, function (reader, target) {
    target.printFlags = {
        labels: !!psdReader_1.readUint8(reader),
        cropMarks: !!psdReader_1.readUint8(reader),
        colorBars: !!psdReader_1.readUint8(reader),
        registrationMarks: !!psdReader_1.readUint8(reader),
        negative: !!psdReader_1.readUint8(reader),
        flip: !!psdReader_1.readUint8(reader),
        interpolate: !!psdReader_1.readUint8(reader),
        caption: !!psdReader_1.readUint8(reader),
        printFlags: !!psdReader_1.readUint8(reader),
    };
}, function (writer, target) {
    var flags = target.printFlags;
    psdWriter_1.writeUint8(writer, flags.labels ? 1 : 0);
    psdWriter_1.writeUint8(writer, flags.cropMarks ? 1 : 0);
    psdWriter_1.writeUint8(writer, flags.colorBars ? 1 : 0);
    psdWriter_1.writeUint8(writer, flags.registrationMarks ? 1 : 0);
    psdWriter_1.writeUint8(writer, flags.negative ? 1 : 0);
    psdWriter_1.writeUint8(writer, flags.flip ? 1 : 0);
    psdWriter_1.writeUint8(writer, flags.interpolate ? 1 : 0);
    psdWriter_1.writeUint8(writer, flags.caption ? 1 : 0);
    psdWriter_1.writeUint8(writer, flags.printFlags ? 1 : 0);
});
helpers_1.MOCK_HANDLERS && addHandler(10000, // Print flags
function (// Print flags
target) { return target._ir10000 !== undefined; }, function (reader, target, left) {
    LOG_MOCK_HANDLERS && console.log('image resource 10000', left());
    target._ir10000 = psdReader_1.readBytes(reader, left());
}, function (writer, target) {
    psdWriter_1.writeBytes(writer, target._ir10000);
});
helpers_1.MOCK_HANDLERS && addHandler(1013, // Color halftoning
function (// Color halftoning
target) { return target._ir1013 !== undefined; }, function (reader, target, left) {
    LOG_MOCK_HANDLERS && console.log('image resource 1013', left());
    target._ir1013 = psdReader_1.readBytes(reader, left());
}, function (writer, target) {
    psdWriter_1.writeBytes(writer, target._ir1013);
});
helpers_1.MOCK_HANDLERS && addHandler(1016, // Color transfer functions
function (// Color transfer functions
target) { return target._ir1016 !== undefined; }, function (reader, target, left) {
    LOG_MOCK_HANDLERS && console.log('image resource 1016', left());
    target._ir1016 = psdReader_1.readBytes(reader, left());
}, function (writer, target) {
    psdWriter_1.writeBytes(writer, target._ir1016);
});
addHandler(1024, function (target) { return target.layerState !== undefined; }, function (reader, target) { return target.layerState = psdReader_1.readUint16(reader); }, function (writer, target) { return psdWriter_1.writeUint16(writer, target.layerState); });
addHandler(1026, function (target) { return target.layersGroup !== undefined; }, function (reader, target, left) {
    target.layersGroup = [];
    while (left()) {
        target.layersGroup.push(psdReader_1.readUint16(reader));
    }
}, function (writer, target) {
    for (var _i = 0, _a = target.layersGroup; _i < _a.length; _i++) {
        var g = _a[_i];
        psdWriter_1.writeUint16(writer, g);
    }
});
addHandler(1072, function (target) { return target.layerGroupsEnabledId !== undefined; }, function (reader, target, left) {
    target.layerGroupsEnabledId = [];
    while (left()) {
        target.layerGroupsEnabledId.push(psdReader_1.readUint8(reader));
    }
}, function (writer, target) {
    for (var _i = 0, _a = target.layerGroupsEnabledId; _i < _a.length; _i++) {
        var id = _a[_i];
        psdWriter_1.writeUint8(writer, id);
    }
});
addHandler(1069, function (target) { return target.layerSelectionIds !== undefined; }, function (reader, target) {
    var count = psdReader_1.readUint16(reader);
    target.layerSelectionIds = [];
    while (count--) {
        target.layerSelectionIds.push(psdReader_1.readUint32(reader));
    }
}, function (writer, target) {
    psdWriter_1.writeUint16(writer, target.layerSelectionIds.length);
    for (var _i = 0, _a = target.layerSelectionIds; _i < _a.length; _i++) {
        var id = _a[_i];
        psdWriter_1.writeUint32(writer, id);
    }
});
addHandler(1032, function (target) { return target.gridAndGuidesInformation !== undefined; }, function (reader, target) {
    var version = psdReader_1.readUint32(reader);
    var horizontal = psdReader_1.readUint32(reader);
    var vertical = psdReader_1.readUint32(reader);
    var count = psdReader_1.readUint32(reader);
    if (version !== 1)
        throw new Error("Invalid 1032 resource version: " + version);
    target.gridAndGuidesInformation = {
        grid: { horizontal: horizontal, vertical: vertical },
        guides: [],
    };
    for (var i = 0; i < count; i++) {
        target.gridAndGuidesInformation.guides.push({
            location: psdReader_1.readUint32(reader) / 32,
            direction: psdReader_1.readUint8(reader) ? 'horizontal' : 'vertical'
        });
    }
}, function (writer, target) {
    var info = target.gridAndGuidesInformation;
    var grid = info.grid || { horizontal: 18 * 32, vertical: 18 * 32 };
    var guides = info.guides || [];
    psdWriter_1.writeUint32(writer, 1);
    psdWriter_1.writeUint32(writer, grid.horizontal);
    psdWriter_1.writeUint32(writer, grid.vertical);
    psdWriter_1.writeUint32(writer, guides.length);
    for (var _i = 0, guides_1 = guides; _i < guides_1.length; _i++) {
        var g = guides_1[_i];
        psdWriter_1.writeUint32(writer, g.location * 32);
        psdWriter_1.writeUint8(writer, g.direction === 'horizontal' ? 1 : 0);
    }
});
addHandler(1054, function (target) { return target.urlsList !== undefined; }, function (reader, target, _, options) {
    var count = psdReader_1.readUint32(reader);
    if (count) {
        if (!options.throwForMissingFeatures)
            return;
        throw new Error('Not implemented: URL List');
    }
    // TODO: read actual URL list
    target.urlsList = [];
}, function (writer, target) {
    psdWriter_1.writeUint32(writer, target.urlsList.length);
    // TODO: write actual URL list
    if (target.urlsList.length) {
        throw new Error('Not implemented: URL List');
    }
});
helpers_1.MOCK_HANDLERS && addHandler(1050, // Slices
function (// Slices
target) { return target._ir1050 !== undefined; }, function (reader, target, left) {
    LOG_MOCK_HANDLERS && console.log('image resource 1050', left());
    target._ir1050 = psdReader_1.readBytes(reader, left());
}, function (writer, target) {
    psdWriter_1.writeBytes(writer, target._ir1050);
});
addHandler(1064, function (target) { return target.pixelAspectRatio !== undefined; }, function (reader, target) {
    if (psdReader_1.readUint32(reader) > 2)
        throw new Error('Invalid pixelAspectRatio version');
    target.pixelAspectRatio = { aspect: psdReader_1.readFloat64(reader) };
}, function (writer, target) {
    psdWriter_1.writeUint32(writer, 2); // version
    psdWriter_1.writeFloat64(writer, target.pixelAspectRatio.aspect);
});
addHandler(1041, function (target) { return target.iccUntaggedProfile !== undefined; }, function (reader, target) {
    target.iccUntaggedProfile = !!psdReader_1.readUint8(reader);
}, function (writer, target) {
    psdWriter_1.writeUint8(writer, target.iccUntaggedProfile ? 1 : 0);
});
helpers_1.MOCK_HANDLERS && addHandler(1039, // ICC Profile
function (// ICC Profile
target) { return target._ir1039 !== undefined; }, function (reader, target, left) {
    LOG_MOCK_HANDLERS && console.log('image resource 1039', left());
    target._ir1039 = psdReader_1.readBytes(reader, left());
}, function (writer, target) {
    psdWriter_1.writeBytes(writer, target._ir1039);
});
addHandler(1044, function (target) { return target.idsSeedNumber !== undefined; }, function (reader, target) { return target.idsSeedNumber = psdReader_1.readUint32(reader); }, function (writer, target) { return psdWriter_1.writeUint32(writer, target.idsSeedNumber); });
addHandler(1036, function (target) { return target.thumbnail !== undefined || target.thumbnailRaw !== undefined; }, function (reader, target, left, options) {
    var format = psdReader_1.readUint32(reader); // 1 = kJpegRGB, 0 = kRawRGB
    var width = psdReader_1.readUint32(reader);
    var height = psdReader_1.readUint32(reader);
    psdReader_1.readUint32(reader); // widthBytes = (width * bits_per_pixel + 31) / 32 * 4.
    psdReader_1.readUint32(reader); // totalSize = widthBytes * height * planes
    psdReader_1.readUint32(reader); // sizeAfterCompression
    var bitsPerPixel = psdReader_1.readUint16(reader); // 24
    var planes = psdReader_1.readUint16(reader); // 1
    if (format !== 1 || bitsPerPixel !== 24 || planes !== 1) {
        options.logMissingFeatures && console.log("Invalid thumbnail data (format: " + format + ", bitsPerPixel: " + bitsPerPixel + ", planes: " + planes + ")");
        psdReader_1.skipBytes(reader, left());
        return;
    }
    var size = left();
    var data = psdReader_1.readBytes(reader, size);
    if (options.useRawThumbnail) {
        target.thumbnailRaw = { width: width, height: height, data: data };
    }
    else {
        target.thumbnail = helpers_1.createCanvasFromData(data);
    }
}, function (writer, target) {
    var width = 0;
    var height = 0;
    var data;
    if (target.thumbnailRaw) {
        width = target.thumbnailRaw.width;
        height = target.thumbnailRaw.height;
        data = target.thumbnailRaw.data;
    }
    else {
        width = target.thumbnail.width;
        height = target.thumbnail.height;
        data = base64_js_1.toByteArray(target.thumbnail.toDataURL('image/jpeg', 1).substr('data:image/jpeg;base64,'.length));
    }
    var bitsPerPixel = 24;
    var widthBytes = Math.floor((width * bitsPerPixel + 31) / 32) * 4;
    var planes = 1;
    var totalSize = widthBytes * height * planes;
    var sizeAfterCompression = data.length;
    psdWriter_1.writeUint32(writer, 1); // 1 = kJpegRGB
    psdWriter_1.writeUint32(writer, width);
    psdWriter_1.writeUint32(writer, height);
    psdWriter_1.writeUint32(writer, widthBytes);
    psdWriter_1.writeUint32(writer, totalSize);
    psdWriter_1.writeUint32(writer, sizeAfterCompression);
    psdWriter_1.writeUint16(writer, bitsPerPixel);
    psdWriter_1.writeUint16(writer, planes);
    psdWriter_1.writeBytes(writer, data);
});
addHandler(1057, function (target) { return target.versionInfo !== undefined; }, function (reader, target, left) {
    var version = psdReader_1.readUint32(reader);
    if (version !== 1)
        throw new Error('Invalid versionInfo version');
    target.versionInfo = {
        hasRealMergedData: !!psdReader_1.readUint8(reader),
        writerName: psdReader_1.readUnicodeString(reader),
        readerName: psdReader_1.readUnicodeString(reader),
        fileVersion: psdReader_1.readUint32(reader),
    };
    psdReader_1.skipBytes(reader, left());
}, function (writer, target) {
    var versionInfo = target.versionInfo;
    psdWriter_1.writeUint32(writer, 1); // version
    psdWriter_1.writeUint8(writer, versionInfo.hasRealMergedData ? 1 : 0);
    psdWriter_1.writeUnicodeString(writer, versionInfo.writerName);
    psdWriter_1.writeUnicodeString(writer, versionInfo.readerName);
    psdWriter_1.writeUint32(writer, versionInfo.fileVersion);
});
helpers_1.MOCK_HANDLERS && addHandler(1058, // EXIF data 1.
function (// EXIF data 1.
target) { return target._ir1058 !== undefined; }, function (reader, target, left) {
    LOG_MOCK_HANDLERS && console.log('image resource 1058', left());
    target._ir1058 = psdReader_1.readBytes(reader, left());
}, function (writer, target) {
    psdWriter_1.writeBytes(writer, target._ir1058);
});
addHandler(1088, function (target) { return target.pathSelectionState !== undefined; }, function (reader, target, _left) {
    var desc = descriptor_1.readVersionAndDescriptor(reader);
    // console.log(require('util').inspect(desc, false, 99, true));
    target.pathSelectionState = desc['null'];
}, function (writer, target) {
    var desc = { 'null': target.pathSelectionState };
    descriptor_1.writeVersionAndDescriptor(writer, '', 'null', desc);
});
helpers_1.MOCK_HANDLERS && addHandler(1025, function (target) { return target._ir1025 !== undefined; }, function (reader, target, left) {
    LOG_MOCK_HANDLERS && console.log('image resource 1025', left());
    target._ir1025 = psdReader_1.readBytes(reader, left());
}, function (writer, target) {
    psdWriter_1.writeBytes(writer, target._ir1025);
});
var FrmD = helpers_1.createEnum('FrmD', '', {
    auto: 'Auto',
    none: 'None',
    dispose: 'Disp',
});
// TODO: Unfinished
helpers_1.MOCK_HANDLERS && addHandler(4000, function (target) { return target._ir4000 !== undefined; }, function (reader, target, left, _a) {
    var logMissingFeatures = _a.logMissingFeatures, logDevFeatures = _a.logDevFeatures;
    if (helpers_1.MOCK_HANDLERS) {
        LOG_MOCK_HANDLERS && console.log('image resource 4000', left());
        target._ir4000 = psdReader_1.readBytes(reader, left());
        return;
    }
    var key = psdReader_1.readSignature(reader);
    if (key === 'mani') {
        psdReader_1.checkSignature(reader, 'IRFR');
        psdReader_1.readSection(reader, 1, function (left) {
            var _loop_1 = function () {
                psdReader_1.checkSignature(reader, '8BIM');
                var key_1 = psdReader_1.readSignature(reader);
                psdReader_1.readSection(reader, 1, function (left) {
                    if (key_1 === 'AnDs') {
                        var desc = descriptor_1.readVersionAndDescriptor(reader);
                        // console.log('AnDs', desc);
                        logDevFeatures && console.log('#4000 AnDs', desc);
                        // logDevFeatures && console.log('#4000 AnDs', require('util').inspect(desc, false, 99, true));
                        var result = {
                            // desc.AFSt ???
                            frames: desc.FrIn.map(function (x) { return ({
                                id: x.FrID,
                                delay: x.FrDl / 100,
                                dispose: x.FrDs ? FrmD.decode(x.FrDs) : 'auto', // missing == auto
                                // x.FrGA ???
                            }); }),
                            animations: desc.FSts.map(function (x) { return ({
                                id: x.FsID,
                                frames: x.FsFr,
                                repeats: x.LCnt,
                                // x.AFrm ???
                            }); }),
                        };
                        logDevFeatures && console.log('#4000 AnDs:result', result);
                        // logDevFeatures && console.log('#4000 AnDs:result', require('util').inspect(result, false, 99, true));
                    }
                    else if (key_1 === 'Roll') {
                        var bytes = psdReader_1.readBytes(reader, left());
                        logDevFeatures && console.log('#4000 Roll', bytes);
                    }
                    else {
                        logMissingFeatures && console.log('Unhandled subsection in #4000', key_1);
                    }
                });
            };
            while (left()) {
                _loop_1();
            }
        });
    }
    else if (key === 'mopt') {
        var bytes = psdReader_1.readBytes(reader, left());
        logDevFeatures && console.log('#4000 mopt', bytes);
    }
    else {
        logMissingFeatures && console.log('Unhandled key in #4000:', key);
        return;
    }
}, function (writer, target) {
    psdWriter_1.writeBytes(writer, target._ir4000);
});
// TODO: Unfinished
helpers_1.MOCK_HANDLERS && addHandler(4001, function (target) { return target._ir4001 !== undefined; }, function (reader, target, left, _a) {
    var logMissingFeatures = _a.logMissingFeatures, logDevFeatures = _a.logDevFeatures;
    if (helpers_1.MOCK_HANDLERS) {
        LOG_MOCK_HANDLERS && console.log('image resource 4001', left());
        target._ir4001 = psdReader_1.readBytes(reader, left());
        return;
    }
    var key = psdReader_1.readSignature(reader);
    if (key === 'mfri') {
        var version = psdReader_1.readUint32(reader);
        if (version !== 2)
            throw new Error('Invalid mfri version');
        var length_1 = psdReader_1.readUint32(reader);
        var bytes = psdReader_1.readBytes(reader, length_1);
        logDevFeatures && console.log('mfri', bytes);
    }
    else if (key === 'mset') {
        var desc = descriptor_1.readVersionAndDescriptor(reader);
        logDevFeatures && console.log('mset', desc);
    }
    else {
        logMissingFeatures && console.log('Unhandled key in #4001', key);
    }
}, function (writer, target) {
    psdWriter_1.writeBytes(writer, target._ir4001);
});

//# sourceMappingURL=data:application/json;charset=utf8;base64,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UUFDOUMsY0FBYyxJQUFJLE9BQU8sQ0FBQyxHQUFHLENBQUMsTUFBTSxFQUFFLElBQUksQ0FBQyxDQUFDO0tBQzVDO1NBQU07UUFDTixrQkFBa0IsSUFBSSxPQUFPLENBQUMsR0FBRyxDQUFDLHdCQUF3QixFQUFFLEdBQUcsQ0FBQyxDQUFDO0tBQ2pFO0FBQ0YsQ0FBQyxFQUNELFVBQUMsTUFBTSxFQUFFLE1BQU07SUFDZCxzQkFBVSxDQUFDLE1BQU0sRUFBRyxNQUFjLENBQUMsT0FBTyxDQUFDLENBQUM7QUFDN0MsQ0FBQyxDQUNELENBQUMiLCJmaWxlIjoiaW1hZ2VSZXNvdXJjZXMuanMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyB0b0J5dGVBcnJheSB9IGZyb20gJ2Jhc2U2NC1qcyc7XG5pbXBvcnQgeyBJbWFnZVJlc291cmNlcywgUmVhZE9wdGlvbnMsIFJlbmRlcmluZ0ludGVudCB9IGZyb20gJy4vcHNkJztcbmltcG9ydCB7XG5cdFBzZFJlYWRlciwgcmVhZFBhc2NhbFN0cmluZywgcmVhZFVuaWNvZGVTdHJpbmcsIHJlYWRVaW50MzIsIHJlYWRVaW50MTYsIHJlYWRVaW50OCwgcmVhZEZsb2F0NjQsXG5cdHJlYWRCeXRlcywgc2tpcEJ5dGVzLCByZWFkRmxvYXQzMiwgcmVhZEludDE2LCByZWFkRml4ZWRQb2ludDMyLCByZWFkU2lnbmF0dXJlLCBjaGVja1NpZ25hdHVyZSxcblx0cmVhZFNlY3Rpb24sIHJlYWRDb2xvclxufSBmcm9tICcuL3BzZFJlYWRlcic7XG5pbXBvcnQge1xuXHRQc2RXcml0ZXIsIHdyaXRlUGFzY2FsU3RyaW5nLCB3cml0ZVVuaWNvZGVTdHJpbmcsIHdyaXRlVWludDMyLCB3cml0ZVVpbnQ4LCB3cml0ZUZsb2F0NjQsIHdyaXRlVWludDE2LFxuXHR3cml0ZUJ5dGVzLCB3cml0ZUludDE2LCB3cml0ZUZsb2F0MzIsIHdyaXRlRml4ZWRQb2ludDMyLCB3cml0ZVVuaWNvZGVTdHJpbmdXaXRoUGFkZGluZywgd3JpdGVDb2xvcixcbn0gZnJvbSAnLi9wc2RXcml0ZXInO1xuaW1wb3J0IHsgY3JlYXRlQ2FudmFzRnJvbURhdGEsIGNyZWF0ZUVudW0sIE1PQ0tfSEFORExFUlMgfSBmcm9tICcuL2hlbHBlcnMnO1xuaW1wb3J0IHsgZGVjb2RlU3RyaW5nLCBlbmNvZGVTdHJpbmcgfSBmcm9tICcuL3V0ZjgnO1xuaW1wb3J0IHsgcmVhZFZlcnNpb25BbmREZXNjcmlwdG9yLCB3cml0ZVZlcnNpb25BbmREZXNjcmlwdG9yIH0gZnJvbSAnLi9kZXNjcmlwdG9yJztcblxuZXhwb3J0IGludGVyZmFjZSBSZXNvdXJjZUhhbmRsZXIge1xuXHRrZXk6IG51bWJlcjtcblx0aGFzOiAodGFyZ2V0OiBJbWFnZVJlc291cmNlcykgPT4gYm9vbGVhbjtcblx0cmVhZDogKHJlYWRlcjogUHNkUmVhZGVyLCB0YXJnZXQ6IEltYWdlUmVzb3VyY2VzLCBsZWZ0OiAoKSA9PiBudW1iZXIsIG9wdGlvbnM6IFJlYWRPcHRpb25zKSA9PiB2b2lkO1xuXHR3cml0ZTogKHdyaXRlcjogUHNkV3JpdGVyLCB0YXJnZXQ6IEltYWdlUmVzb3VyY2VzKSA9PiB2b2lkO1xufVxuXG5leHBvcnQgY29uc3QgcmVzb3VyY2VIYW5kbGVyczogUmVzb3VyY2VIYW5kbGVyW10gPSBbXTtcbmV4cG9ydCBjb25zdCByZXNvdXJjZUhhbmRsZXJzTWFwOiB7IFtrZXk6IG51bWJlcl06IFJlc291cmNlSGFuZGxlciB9ID0ge307XG5cbmZ1bmN0aW9uIGFkZEhhbmRsZXIoXG5cdGtleTogbnVtYmVyLFxuXHRoYXM6ICh0YXJnZXQ6IEltYWdlUmVzb3VyY2VzKSA9PiBib29sZWFuLFxuXHRyZWFkOiAocmVhZGVyOiBQc2RSZWFkZXIsIHRhcmdldDogSW1hZ2VSZXNvdXJjZXMsIGxlZnQ6ICgpID0+IG51bWJlciwgb3B0aW9uczogUmVhZE9wdGlvbnMpID0+IHZvaWQsXG5cdHdyaXRlOiAod3JpdGVyOiBQc2RXcml0ZXIsIHRhcmdldDogSW1hZ2VSZXNvdXJjZXMpID0+IHZvaWQsXG4pIHtcblx0Y29uc3QgaGFuZGxlcjogUmVzb3VyY2VIYW5kbGVyID0geyBrZXksIGhhcywgcmVhZCwgd3JpdGUgfTtcblx0cmVzb3VyY2VIYW5kbGVycy5wdXNoKGhhbmRsZXIpO1xuXHRyZXNvdXJjZUhhbmRsZXJzTWFwW2hhbmRsZXIua2V5XSA9IGhhbmRsZXI7XG59XG5cbmNvbnN0IExPR19NT0NLX0hBTkRMRVJTID0gZmFsc2U7XG5jb25zdCBSRVNPTFVUSU9OX1VOSVRTID0gW3VuZGVmaW5lZCwgJ1BQSScsICdQUENNJ107XG5jb25zdCBNRUFTVVJFTUVOVF9VTklUUyA9IFt1bmRlZmluZWQsICdJbmNoZXMnLCAnQ2VudGltZXRlcnMnLCAnUG9pbnRzJywgJ1BpY2FzJywgJ0NvbHVtbnMnXTtcbmNvbnN0IGhleCA9ICcwMTIzNDU2Nzg5YWJjZGVmJztcblxuZnVuY3Rpb24gY2hhclRvTmliYmxlKGNvZGU6IG51bWJlcikge1xuXHRyZXR1cm4gY29kZSA8PSA1NyA/IGNvZGUgLSA0OCA6IGNvZGUgLSA4Nztcbn1cblxuZnVuY3Rpb24gYnl0ZUF0KHZhbHVlOiBzdHJpbmcsIGluZGV4OiBudW1iZXIpIHtcblx0cmV0dXJuIChjaGFyVG9OaWJibGUodmFsdWUuY2hhckNvZGVBdChpbmRleCkpIDw8IDQpIHwgY2hhclRvTmliYmxlKHZhbHVlLmNoYXJDb2RlQXQoaW5kZXggKyAxKSk7XG59XG5cbmZ1bmN0aW9uIHJlYWRVdGY4U3RyaW5nKHJlYWRlcjogUHNkUmVhZGVyLCBsZW5ndGg6IG51bWJlcikge1xuXHRjb25zdCBidWZmZXIgPSByZWFkQnl0ZXMocmVhZGVyLCBsZW5ndGgpO1xuXHRyZXR1cm4gZGVjb2RlU3RyaW5nKGJ1ZmZlcik7XG59XG5cbmZ1bmN0aW9uIHdyaXRlVXRmOFN0cmluZyh3cml0ZXI6IFBzZFdyaXRlciwgdmFsdWU6IHN0cmluZykge1xuXHRjb25zdCBidWZmZXIgPSBlbmNvZGVTdHJpbmcodmFsdWUpO1xuXHR3cml0ZUJ5dGVzKHdyaXRlciwgYnVmZmVyKTtcbn1cblxuTU9DS19IQU5ETEVSUyAmJiBhZGRIYW5kbGVyKFxuXHQxMDI4LCAvLyBJUFRDLU5BQSByZWNvcmRcblx0dGFyZ2V0ID0+ICh0YXJnZXQgYXMgYW55KS5faXIxMDI4ICE9PSB1bmRlZmluZWQsXG5cdChyZWFkZXIsIHRhcmdldCwgbGVmdCkgPT4ge1xuXHRcdExPR19NT0NLX0hBTkRMRVJTICYmIGNvbnNvbGUubG9nKCdpbWFnZSByZXNvdXJjZSAxMDI4JywgbGVmdCgpKTtcblx0XHQodGFyZ2V0IGFzIGFueSkuX2lyMTAyOCA9IHJlYWRCeXRlcyhyZWFkZXIsIGxlZnQoKSk7XG5cdH0sXG5cdCh3cml0ZXIsIHRhcmdldCkgPT4ge1xuXHRcdHdyaXRlQnl0ZXMod3JpdGVyLCAodGFyZ2V0IGFzIGFueSkuX2lyMTAyOCk7XG5cdH0sXG4pO1xuXG5hZGRIYW5kbGVyKFxuXHQxMDYxLFxuXHR0YXJnZXQgPT4gdGFyZ2V0LmNhcHRpb25EaWdlc3QgIT09IHVuZGVmaW5lZCxcblx0KHJlYWRlciwgdGFyZ2V0KSA9PiB7XG5cdFx0bGV0IGNhcHRpb25EaWdlc3QgPSAnJztcblxuXHRcdGZvciAobGV0IGkgPSAwOyBpIDwgMTY7IGkrKykge1xuXHRcdFx0Y29uc3QgYnl0ZSA9IHJlYWRVaW50OChyZWFkZXIpO1xuXHRcdFx0Y2FwdGlvbkRpZ2VzdCArPSBoZXhbYnl0ZSA+PiA0XTtcblx0XHRcdGNhcHRpb25EaWdlc3QgKz0gaGV4W2J5dGUgJiAweGZdO1xuXHRcdH1cblxuXHRcdHRhcmdldC5jYXB0aW9uRGlnZXN0ID0gY2FwdGlvbkRpZ2VzdDtcblx0fSxcblx0KHdyaXRlciwgdGFyZ2V0KSA9PiB7XG5cdFx0Zm9yIChsZXQgaSA9IDA7IGkgPCAxNjsgaSsrKSB7XG5cdFx0XHR3cml0ZVVpbnQ4KHdyaXRlciwgYnl0ZUF0KHRhcmdldC5jYXB0aW9uRGlnZXN0ISwgaSAqIDIpKTtcblx0XHR9XG5cdH0sXG4pO1xuXG5hZGRIYW5kbGVyKFxuXHQxMDYwLFxuXHR0YXJnZXQgPT4gdGFyZ2V0LnhtcE1ldGFkYXRhICE9PSB1bmRlZmluZWQsXG5cdChyZWFkZXIsIHRhcmdldCwgbGVmdCkgPT4gdGFyZ2V0LnhtcE1ldGFkYXRhID0gcmVhZFV0ZjhTdHJpbmcocmVhZGVyLCBsZWZ0KCkpLFxuXHQod3JpdGVyLCB0YXJnZXQpID0+IHdyaXRlVXRmOFN0cmluZyh3cml0ZXIsIHRhcmdldC54bXBNZXRhZGF0YSEpLFxuKTtcblxuY29uc3QgSW50ZSA9IGNyZWF0ZUVudW08UmVuZGVyaW5nSW50ZW50PignSW50ZScsICdwZXJjZXB0dWFsJywge1xuXHQncGVyY2VwdHVhbCc6ICdJbWcgJyxcblx0J3NhdHVyYXRpb24nOiAnR3JwICcsXG5cdCdyZWxhdGl2ZSBjb2xvcmltZXRyaWMnOiAnQ2xybScsXG5cdCdhYnNvbHV0ZSBjb2xvcmltZXRyaWMnOiAnQUNscicsXG59KTtcblxuaW50ZXJmYWNlIFByaW50SW5mb3JtYXRpb25EZXNjcmlwdG9yIHtcblx0J05tICAnPzogc3RyaW5nO1xuXHRDbHJTPzogc3RyaW5nO1xuXHRQc3RTPzogYm9vbGVhbjtcblx0TXBCbD86IGJvb2xlYW47XG5cdEludGU/OiBzdHJpbmc7XG5cdGhhcmRQcm9vZj86IGJvb2xlYW47XG5cdHByaW50U2l4dGVlbkJpdD86IGJvb2xlYW47XG5cdHByaW50ZXJOYW1lPzogc3RyaW5nO1xuXHRwcmludFByb29mU2V0dXA/OiB7XG5cdFx0Qmx0bjogc3RyaW5nO1xuXHR9IHwge1xuXHRcdHByb2ZpbGU6IHN0cmluZztcblx0XHRJbnRlOiBzdHJpbmc7XG5cdFx0TXBCbDogYm9vbGVhbjtcblx0XHRwYXBlcldoaXRlOiBib29sZWFuO1xuXHR9O1xufVxuXG5hZGRIYW5kbGVyKFxuXHQxMDgyLFxuXHR0YXJnZXQgPT4gdGFyZ2V0LnByaW50SW5mb3JtYXRpb24gIT09IHVuZGVmaW5lZCxcblx0KHJlYWRlciwgdGFyZ2V0KSA9PiB7XG5cdFx0Y29uc3QgZGVzYzogUHJpbnRJbmZvcm1hdGlvbkRlc2NyaXB0b3IgPSByZWFkVmVyc2lvbkFuZERlc2NyaXB0b3IocmVhZGVyKTtcblxuXHRcdHRhcmdldC5wcmludEluZm9ybWF0aW9uID0ge1xuXHRcdFx0cHJpbnRlck5hbWU6IGRlc2MucHJpbnRlck5hbWUgfHwgJycsXG5cdFx0XHRyZW5kZXJpbmdJbnRlbnQ6IEludGUuZGVjb2RlKGRlc2MuSW50ZSA/PyAnSW50ZS5JbWcgJyksXG5cdFx0fTtcblxuXHRcdGNvbnN0IGluZm8gPSB0YXJnZXQucHJpbnRJbmZvcm1hdGlvbjtcblxuXHRcdGlmIChkZXNjLlBzdFMgIT09IHVuZGVmaW5lZCkgaW5mby5wcmludGVyTWFuYWdlc0NvbG9ycyA9IGRlc2MuUHN0Uztcblx0XHRpZiAoZGVzY1snTm0gICddICE9PSB1bmRlZmluZWQpIGluZm8ucHJpbnRlclByb2ZpbGUgPSBkZXNjWydObSAgJ107XG5cdFx0aWYgKGRlc2MuTXBCbCAhPT0gdW5kZWZpbmVkKSBpbmZvLmJsYWNrUG9pbnRDb21wZW5zYXRpb24gPSBkZXNjLk1wQmw7XG5cdFx0aWYgKGRlc2MucHJpbnRTaXh0ZWVuQml0ICE9PSB1bmRlZmluZWQpIGluZm8ucHJpbnRTaXh0ZWVuQml0ID0gZGVzYy5wcmludFNpeHRlZW5CaXQ7XG5cdFx0aWYgKGRlc2MuaGFyZFByb29mICE9PSB1bmRlZmluZWQpIGluZm8uaGFyZFByb29mID0gZGVzYy5oYXJkUHJvb2Y7XG5cdFx0aWYgKGRlc2MucHJpbnRQcm9vZlNldHVwKSB7XG5cdFx0XHRpZiAoJ0JsdG4nIGluIGRlc2MucHJpbnRQcm9vZlNldHVwKSB7XG5cdFx0XHRcdGluZm8ucHJvb2ZTZXR1cCA9IHsgYnVpbHRpbjogZGVzYy5wcmludFByb29mU2V0dXAuQmx0bi5zcGxpdCgnLicpWzFdIH07XG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRpbmZvLnByb29mU2V0dXAgPSB7XG5cdFx0XHRcdFx0cHJvZmlsZTogZGVzYy5wcmludFByb29mU2V0dXAucHJvZmlsZSxcblx0XHRcdFx0XHRyZW5kZXJpbmdJbnRlbnQ6IEludGUuZGVjb2RlKGRlc2MucHJpbnRQcm9vZlNldHVwLkludGUgPz8gJ0ludGUuSW1nICcpLFxuXHRcdFx0XHRcdGJsYWNrUG9pbnRDb21wZW5zYXRpb246ICEhZGVzYy5wcmludFByb29mU2V0dXAuTXBCbCxcblx0XHRcdFx0XHRwYXBlcldoaXRlOiAhIWRlc2MucHJpbnRQcm9vZlNldHVwLnBhcGVyV2hpdGUsXG5cdFx0XHRcdH07XG5cdFx0XHR9XG5cdFx0fVxuXHR9LFxuXHQod3JpdGVyLCB0YXJnZXQpID0+IHtcblx0XHRjb25zdCBpbmZvID0gdGFyZ2V0LnByaW50SW5mb3JtYXRpb24hO1xuXHRcdGNvbnN0IGRlc2M6IFByaW50SW5mb3JtYXRpb25EZXNjcmlwdG9yID0ge307XG5cblx0XHRpZiAoaW5mby5wcmludGVyTWFuYWdlc0NvbG9ycykge1xuXHRcdFx0ZGVzYy5Qc3RTID0gdHJ1ZTtcblx0XHR9IGVsc2Uge1xuXHRcdFx0aWYgKGluZm8uaGFyZFByb29mICE9PSB1bmRlZmluZWQpIGRlc2MuaGFyZFByb29mID0gISFpbmZvLmhhcmRQcm9vZjtcblx0XHRcdGRlc2MuQ2xyUyA9ICdDbHJTLlJHQkMnOyAvLyBUT0RPOiA/Pz9cblx0XHRcdGRlc2NbJ05tICAnXSA9IGluZm8ucHJpbnRlclByb2ZpbGUgPz8gJ0NJRSBSR0InO1xuXHRcdH1cblxuXHRcdGRlc2MuSW50ZSA9IEludGUuZW5jb2RlKGluZm8ucmVuZGVyaW5nSW50ZW50KTtcblxuXHRcdGlmICghaW5mby5wcmludGVyTWFuYWdlc0NvbG9ycykgZGVzYy5NcEJsID0gISFpbmZvLmJsYWNrUG9pbnRDb21wZW5zYXRpb247XG5cblx0XHRkZXNjLnByaW50U2l4dGVlbkJpdCA9ICEhaW5mby5wcmludFNpeHRlZW5CaXQ7XG5cdFx0ZGVzYy5wcmludGVyTmFtZSA9IGluZm8ucHJpbnRlck5hbWUgfHwgJyc7XG5cblx0XHRpZiAoaW5mby5wcm9vZlNldHVwICYmICdwcm9maWxlJyBpbiBpbmZvLnByb29mU2V0dXApIHtcblx0XHRcdGRlc2MucHJpbnRQcm9vZlNldHVwID0ge1xuXHRcdFx0XHRwcm9maWxlOiBpbmZvLnByb29mU2V0dXAucHJvZmlsZSB8fCAnJyxcblx0XHRcdFx0SW50ZTogSW50ZS5lbmNvZGUoaW5mby5wcm9vZlNldHVwLnJlbmRlcmluZ0ludGVudCksXG5cdFx0XHRcdE1wQmw6ICEhaW5mby5wcm9vZlNldHVwLmJsYWNrUG9pbnRDb21wZW5zYXRpb24sXG5cdFx0XHRcdHBhcGVyV2hpdGU6ICEhaW5mby5wcm9vZlNldHVwLnBhcGVyV2hpdGUsXG5cdFx0XHR9O1xuXHRcdH0gZWxzZSB7XG5cdFx0XHRkZXNjLnByaW50UHJvb2ZTZXR1cCA9IHtcblx0XHRcdFx0Qmx0bjogaW5mby5wcm9vZlNldHVwPy5idWlsdGluID8gYGJ1aWx0aW5Qcm9vZi4ke2luZm8ucHJvb2ZTZXR1cC5idWlsdGlufWAgOiAnYnVpbHRpblByb29mLnByb29mQ01ZSycsXG5cdFx0XHR9O1xuXHRcdH1cblxuXHRcdHdyaXRlVmVyc2lvbkFuZERlc2NyaXB0b3Iod3JpdGVyLCAnJywgJ3ByaW50T3V0cHV0JywgZGVzYyk7XG5cdH0sXG4pO1xuXG5NT0NLX0hBTkRMRVJTICYmIGFkZEhhbmRsZXIoXG5cdDEwODMsIC8vIFByaW50IHN0eWxlXG5cdHRhcmdldCA9PiAodGFyZ2V0IGFzIGFueSkuX2lyMTA4MyAhPT0gdW5kZWZpbmVkLFxuXHQocmVhZGVyLCB0YXJnZXQsIGxlZnQpID0+IHtcblx0XHRMT0dfTU9DS19IQU5ETEVSUyAmJiBjb25zb2xlLmxvZygnaW1hZ2UgcmVzb3VyY2UgMTA4MycsIGxlZnQoKSk7XG5cdFx0KHRhcmdldCBhcyBhbnkpLl9pcjEwODMgPSByZWFkQnl0ZXMocmVhZGVyLCBsZWZ0KCkpO1xuXG5cdFx0Ly8gVE9ETzpcblx0XHQvLyBjb25zdCBkZXNjID0gcmVhZFZlcnNpb25BbmREZXNjcmlwdG9yKHJlYWRlcik7XG5cdFx0Ly8gY29uc29sZS5sb2coJzEwODMnLCByZXF1aXJlKCd1dGlsJykuaW5zcGVjdChkZXNjLCBmYWxzZSwgOTksIHRydWUpKTtcblx0fSxcblx0KHdyaXRlciwgdGFyZ2V0KSA9PiB7XG5cdFx0d3JpdGVCeXRlcyh3cml0ZXIsICh0YXJnZXQgYXMgYW55KS5faXIxMDgzKTtcblx0fSxcbik7XG5cbmFkZEhhbmRsZXIoXG5cdDEwMDUsXG5cdHRhcmdldCA9PiB0YXJnZXQucmVzb2x1dGlvbkluZm8gIT09IHVuZGVmaW5lZCxcblx0KHJlYWRlciwgdGFyZ2V0KSA9PiB7XG5cdFx0Y29uc3QgaG9yaXpvbnRhbFJlc29sdXRpb24gPSByZWFkRml4ZWRQb2ludDMyKHJlYWRlcik7XG5cdFx0Y29uc3QgaG9yaXpvbnRhbFJlc29sdXRpb25Vbml0ID0gcmVhZFVpbnQxNihyZWFkZXIpO1xuXHRcdGNvbnN0IHdpZHRoVW5pdCA9IHJlYWRVaW50MTYocmVhZGVyKTtcblx0XHRjb25zdCB2ZXJ0aWNhbFJlc29sdXRpb24gPSByZWFkRml4ZWRQb2ludDMyKHJlYWRlcik7XG5cdFx0Y29uc3QgdmVydGljYWxSZXNvbHV0aW9uVW5pdCA9IHJlYWRVaW50MTYocmVhZGVyKTtcblx0XHRjb25zdCBoZWlnaHRVbml0ID0gcmVhZFVpbnQxNihyZWFkZXIpO1xuXG5cdFx0dGFyZ2V0LnJlc29sdXRpb25JbmZvID0ge1xuXHRcdFx0aG9yaXpvbnRhbFJlc29sdXRpb24sXG5cdFx0XHRob3Jpem9udGFsUmVzb2x1dGlvblVuaXQ6IFJFU09MVVRJT05fVU5JVFNbaG9yaXpvbnRhbFJlc29sdXRpb25Vbml0XSB8fCAnUFBJJyBhcyBhbnksXG5cdFx0XHR3aWR0aFVuaXQ6IE1FQVNVUkVNRU5UX1VOSVRTW3dpZHRoVW5pdF0gfHwgJ0luY2hlcycgYXMgYW55LFxuXHRcdFx0dmVydGljYWxSZXNvbHV0aW9uLFxuXHRcdFx0dmVydGljYWxSZXNvbHV0aW9uVW5pdDogUkVTT0xVVElPTl9VTklUU1t2ZXJ0aWNhbFJlc29sdXRpb25Vbml0XSB8fCAnUFBJJyBhcyBhbnksXG5cdFx0XHRoZWlnaHRVbml0OiBNRUFTVVJFTUVOVF9VTklUU1toZWlnaHRVbml0XSB8fCAnSW5jaGVzJyBhcyBhbnksXG5cdFx0fTtcblx0fSxcblx0KHdyaXRlciwgdGFyZ2V0KSA9PiB7XG5cdFx0Y29uc3QgaW5mbyA9IHRhcmdldC5yZXNvbHV0aW9uSW5mbyE7XG5cblx0XHR3cml0ZUZpeGVkUG9pbnQzMih3cml0ZXIsIGluZm8uaG9yaXpvbnRhbFJlc29sdXRpb24gfHwgMCk7XG5cdFx0d3JpdGVVaW50MTYod3JpdGVyLCBNYXRoLm1heCgxLCBSRVNPTFVUSU9OX1VOSVRTLmluZGV4T2YoaW5mby5ob3Jpem9udGFsUmVzb2x1dGlvblVuaXQpKSk7XG5cdFx0d3JpdGVVaW50MTYod3JpdGVyLCBNYXRoLm1heCgxLCBNRUFTVVJFTUVOVF9VTklUUy5pbmRleE9mKGluZm8ud2lkdGhVbml0KSkpO1xuXHRcdHdyaXRlRml4ZWRQb2ludDMyKHdyaXRlciwgaW5mby52ZXJ0aWNhbFJlc29sdXRpb24gfHwgMCk7XG5cdFx0d3JpdGVVaW50MTYod3JpdGVyLCBNYXRoLm1heCgxLCBSRVNPTFVUSU9OX1VOSVRTLmluZGV4T2YoaW5mby52ZXJ0aWNhbFJlc29sdXRpb25Vbml0KSkpO1xuXHRcdHdyaXRlVWludDE2KHdyaXRlciwgTWF0aC5tYXgoMSwgTUVBU1VSRU1FTlRfVU5JVFMuaW5kZXhPZihpbmZvLmhlaWdodFVuaXQpKSk7XG5cdH0sXG4pO1xuXG5jb25zdCBwcmludFNjYWxlU3R5bGVzID0gWydjZW50ZXJlZCcsICdzaXplIHRvIGZpdCcsICd1c2VyIGRlZmluZWQnXTtcblxuYWRkSGFuZGxlcihcblx0MTA2Mixcblx0dGFyZ2V0ID0+IHRhcmdldC5wcmludFNjYWxlICE9PSB1bmRlZmluZWQsXG5cdChyZWFkZXIsIHRhcmdldCkgPT4ge1xuXHRcdHRhcmdldC5wcmludFNjYWxlID0ge1xuXHRcdFx0c3R5bGU6IHByaW50U2NhbGVTdHlsZXNbcmVhZEludDE2KHJlYWRlcildIGFzIGFueSxcblx0XHRcdHg6IHJlYWRGbG9hdDMyKHJlYWRlciksXG5cdFx0XHR5OiByZWFkRmxvYXQzMihyZWFkZXIpLFxuXHRcdFx0c2NhbGU6IHJlYWRGbG9hdDMyKHJlYWRlciksXG5cdFx0fTtcblx0fSxcblx0KHdyaXRlciwgdGFyZ2V0KSA9PiB7XG5cdFx0Y29uc3QgeyBzdHlsZSwgeCwgeSwgc2NhbGUgfSA9IHRhcmdldC5wcmludFNjYWxlITtcblx0XHR3cml0ZUludDE2KHdyaXRlciwgTWF0aC5tYXgoMCwgcHJpbnRTY2FsZVN0eWxlcy5pbmRleE9mKHN0eWxlISkpKTtcblx0XHR3cml0ZUZsb2F0MzIod3JpdGVyLCB4IHx8IDApO1xuXHRcdHdyaXRlRmxvYXQzMih3cml0ZXIsIHkgfHwgMCk7XG5cdFx0d3JpdGVGbG9hdDMyKHdyaXRlciwgc2NhbGUgfHwgMCk7XG5cdH0sXG4pO1xuXG5hZGRIYW5kbGVyKFxuXHQxMDA2LFxuXHR0YXJnZXQgPT4gdGFyZ2V0LmFscGhhQ2hhbm5lbE5hbWVzICE9PSB1bmRlZmluZWQsXG5cdChyZWFkZXIsIHRhcmdldCwgbGVmdCkgPT4ge1xuXHRcdHRhcmdldC5hbHBoYUNoYW5uZWxOYW1lcyA9IFtdO1xuXG5cdFx0d2hpbGUgKGxlZnQoKSkge1xuXHRcdFx0Y29uc3QgdmFsdWUgPSByZWFkUGFzY2FsU3RyaW5nKHJlYWRlciwgMSk7XG5cdFx0XHR0YXJnZXQuYWxwaGFDaGFubmVsTmFtZXMucHVzaCh2YWx1ZSk7XG5cdFx0fVxuXHR9LFxuXHQod3JpdGVyLCB0YXJnZXQpID0+IHtcblx0XHRmb3IgKGNvbnN0IG5hbWUgb2YgdGFyZ2V0LmFscGhhQ2hhbm5lbE5hbWVzISkge1xuXHRcdFx0d3JpdGVQYXNjYWxTdHJpbmcod3JpdGVyLCBuYW1lLCAxKTtcblx0XHR9XG5cdH0sXG4pO1xuXG5hZGRIYW5kbGVyKFxuXHQxMDQ1LFxuXHR0YXJnZXQgPT4gdGFyZ2V0LmFscGhhQ2hhbm5lbE5hbWVzICE9PSB1bmRlZmluZWQsXG5cdChyZWFkZXIsIHRhcmdldCwgbGVmdCkgPT4ge1xuXHRcdHRhcmdldC5hbHBoYUNoYW5uZWxOYW1lcyA9IFtdO1xuXG5cdFx0d2hpbGUgKGxlZnQoKSkge1xuXHRcdFx0dGFyZ2V0LmFscGhhQ2hhbm5lbE5hbWVzLnB1c2gocmVhZFVuaWNvZGVTdHJpbmcocmVhZGVyKSk7XG5cdFx0fVxuXHR9LFxuXHQod3JpdGVyLCB0YXJnZXQpID0+IHtcblx0XHRmb3IgKGNvbnN0IG5hbWUgb2YgdGFyZ2V0LmFscGhhQ2hhbm5lbE5hbWVzISkge1xuXHRcdFx0d3JpdGVVbmljb2RlU3RyaW5nV2l0aFBhZGRpbmcod3JpdGVyLCBuYW1lKTtcblx0XHR9XG5cdH0sXG4pO1xuXG5NT0NLX0hBTkRMRVJTICYmIGFkZEhhbmRsZXIoXG5cdDEwNzcsXG5cdHRhcmdldCA9PiAodGFyZ2V0IGFzIGFueSkuX2lyMTA3NyAhPT0gdW5kZWZpbmVkLFxuXHQocmVhZGVyLCB0YXJnZXQsIGxlZnQpID0+IHtcblx0XHRMT0dfTU9DS19IQU5ETEVSUyAmJiBjb25zb2xlLmxvZygnaW1hZ2UgcmVzb3VyY2UgMTA3NycsIGxlZnQoKSk7XG5cdFx0KHRhcmdldCBhcyBhbnkpLl9pcjEwNzcgPSByZWFkQnl0ZXMocmVhZGVyLCBsZWZ0KCkpO1xuXHR9LFxuXHQod3JpdGVyLCB0YXJnZXQpID0+IHtcblx0XHR3cml0ZUJ5dGVzKHdyaXRlciwgKHRhcmdldCBhcyBhbnkpLl9pcjEwNzcpO1xuXHR9LFxuKTtcblxuYWRkSGFuZGxlcihcblx0MTA1Myxcblx0dGFyZ2V0ID0+IHRhcmdldC5hbHBoYUlkZW50aWZpZXJzICE9PSB1bmRlZmluZWQsXG5cdChyZWFkZXIsIHRhcmdldCwgbGVmdCkgPT4ge1xuXHRcdHRhcmdldC5hbHBoYUlkZW50aWZpZXJzID0gW107XG5cblx0XHR3aGlsZSAobGVmdCgpID49IDQpIHtcblx0XHRcdHRhcmdldC5hbHBoYUlkZW50aWZpZXJzLnB1c2gocmVhZFVpbnQzMihyZWFkZXIpKTtcblx0XHR9XG5cdH0sXG5cdCh3cml0ZXIsIHRhcmdldCkgPT4ge1xuXHRcdGZvciAoY29uc3QgaWQgb2YgdGFyZ2V0LmFscGhhSWRlbnRpZmllcnMhKSB7XG5cdFx0XHR3cml0ZVVpbnQzMih3cml0ZXIsIGlkKTtcblx0XHR9XG5cdH0sXG4pO1xuXG5hZGRIYW5kbGVyKFxuXHQxMDEwLFxuXHR0YXJnZXQgPT4gdGFyZ2V0LmJhY2tncm91bmRDb2xvciAhPT0gdW5kZWZpbmVkLFxuXHQocmVhZGVyLCB0YXJnZXQpID0+IHRhcmdldC5iYWNrZ3JvdW5kQ29sb3IgPSByZWFkQ29sb3IocmVhZGVyKSxcblx0KHdyaXRlciwgdGFyZ2V0KSA9PiB3cml0ZUNvbG9yKHdyaXRlciwgdGFyZ2V0LmJhY2tncm91bmRDb2xvciEpLFxuKTtcblxuYWRkSGFuZGxlcihcblx0MTAzNyxcblx0dGFyZ2V0ID0+IHRhcmdldC5nbG9iYWxBbmdsZSAhPT0gdW5kZWZpbmVkLFxuXHQocmVhZGVyLCB0YXJnZXQpID0+IHRhcmdldC5nbG9iYWxBbmdsZSA9IHJlYWRVaW50MzIocmVhZGVyKSxcblx0KHdyaXRlciwgdGFyZ2V0KSA9PiB3cml0ZVVpbnQzMih3cml0ZXIsIHRhcmdldC5nbG9iYWxBbmdsZSEpLFxuKTtcblxuYWRkSGFuZGxlcihcblx0MTA0OSxcblx0dGFyZ2V0ID0+IHRhcmdldC5nbG9iYWxBbHRpdHVkZSAhPT0gdW5kZWZpbmVkLFxuXHQocmVhZGVyLCB0YXJnZXQpID0+IHRhcmdldC5nbG9iYWxBbHRpdHVkZSA9IHJlYWRVaW50MzIocmVhZGVyKSxcblx0KHdyaXRlciwgdGFyZ2V0KSA9PiB3cml0ZVVpbnQzMih3cml0ZXIsIHRhcmdldC5nbG9iYWxBbHRpdHVkZSEpLFxuKTtcblxuYWRkSGFuZGxlcihcblx0MTAxMSxcblx0dGFyZ2V0ID0+IHRhcmdldC5wcmludEZsYWdzICE9PSB1bmRlZmluZWQsXG5cdChyZWFkZXIsIHRhcmdldCkgPT4ge1xuXHRcdHRhcmdldC5wcmludEZsYWdzID0ge1xuXHRcdFx0bGFiZWxzOiAhIXJlYWRVaW50OChyZWFkZXIpLFxuXHRcdFx0Y3JvcE1hcmtzOiAhIXJlYWRVaW50OChyZWFkZXIpLFxuXHRcdFx0Y29sb3JCYXJzOiAhIXJlYWRVaW50OChyZWFkZXIpLFxuXHRcdFx0cmVnaXN0cmF0aW9uTWFya3M6ICEhcmVhZFVpbnQ4KHJlYWRlciksXG5cdFx0XHRuZWdhdGl2ZTogISFyZWFkVWludDgocmVhZGVyKSxcblx0XHRcdGZsaXA6ICEhcmVhZFVpbnQ4KHJlYWRlciksXG5cdFx0XHRpbnRlcnBvbGF0ZTogISFyZWFkVWludDgocmVhZGVyKSxcblx0XHRcdGNhcHRpb246ICEhcmVhZFVpbnQ4KHJlYWRlciksXG5cdFx0XHRwcmludEZsYWdzOiAhIXJlYWRVaW50OChyZWFkZXIpLFxuXHRcdH07XG5cdH0sXG5cdCh3cml0ZXIsIHRhcmdldCkgPT4ge1xuXHRcdGNvbnN0IGZsYWdzID0gdGFyZ2V0LnByaW50RmxhZ3MhO1xuXHRcdHdyaXRlVWludDgod3JpdGVyLCBmbGFncy5sYWJlbHMgPyAxIDogMCk7XG5cdFx0d3JpdGVVaW50OCh3cml0ZXIsIGZsYWdzLmNyb3BNYXJrcyA/IDEgOiAwKTtcblx0XHR3cml0ZVVpbnQ4KHdyaXRlciwgZmxhZ3MuY29sb3JCYXJzID8gMSA6IDApO1xuXHRcdHdyaXRlVWludDgod3JpdGVyLCBmbGFncy5yZWdpc3RyYXRpb25NYXJrcyA/IDEgOiAwKTtcblx0XHR3cml0ZVVpbnQ4KHdyaXRlciwgZmxhZ3MubmVnYXRpdmUgPyAxIDogMCk7XG5cdFx0d3JpdGVVaW50OCh3cml0ZXIsIGZsYWdzLmZsaXAgPyAxIDogMCk7XG5cdFx0d3JpdGVVaW50OCh3cml0ZXIsIGZsYWdzLmludGVycG9sYXRlID8gMSA6IDApO1xuXHRcdHdyaXRlVWludDgod3JpdGVyLCBmbGFncy5jYXB0aW9uID8gMSA6IDApO1xuXHRcdHdyaXRlVWludDgod3JpdGVyLCBmbGFncy5wcmludEZsYWdzID8gMSA6IDApO1xuXHR9LFxuKTtcblxuTU9DS19IQU5ETEVSUyAmJiBhZGRIYW5kbGVyKFxuXHQxMDAwMCwgLy8gUHJpbnQgZmxhZ3Ncblx0dGFyZ2V0ID0+ICh0YXJnZXQgYXMgYW55KS5faXIxMDAwMCAhPT0gdW5kZWZpbmVkLFxuXHQocmVhZGVyLCB0YXJnZXQsIGxlZnQpID0+IHtcblx0XHRMT0dfTU9DS19IQU5ETEVSUyAmJiBjb25zb2xlLmxvZygnaW1hZ2UgcmVzb3VyY2UgMTAwMDAnLCBsZWZ0KCkpO1xuXHRcdCh0YXJnZXQgYXMgYW55KS5faXIxMDAwMCA9IHJlYWRCeXRlcyhyZWFkZXIsIGxlZnQoKSk7XG5cdH0sXG5cdCh3cml0ZXIsIHRhcmdldCkgPT4ge1xuXHRcdHdyaXRlQnl0ZXMod3JpdGVyLCAodGFyZ2V0IGFzIGFueSkuX2lyMTAwMDApO1xuXHR9LFxuKTtcblxuTU9DS19IQU5ETEVSUyAmJiBhZGRIYW5kbGVyKFxuXHQxMDEzLCAvLyBDb2xvciBoYWxmdG9uaW5nXG5cdHRhcmdldCA9PiAodGFyZ2V0IGFzIGFueSkuX2lyMTAxMyAhPT0gdW5kZWZpbmVkLFxuXHQocmVhZGVyLCB0YXJnZXQsIGxlZnQpID0+IHtcblx0XHRMT0dfTU9DS19IQU5ETEVSUyAmJiBjb25zb2xlLmxvZygnaW1hZ2UgcmVzb3VyY2UgMTAxMycsIGxlZnQoKSk7XG5cdFx0KHRhcmdldCBhcyBhbnkpLl9pcjEwMTMgPSByZWFkQnl0ZXMocmVhZGVyLCBsZWZ0KCkpO1xuXHR9LFxuXHQod3JpdGVyLCB0YXJnZXQpID0+IHtcblx0XHR3cml0ZUJ5dGVzKHdyaXRlciwgKHRhcmdldCBhcyBhbnkpLl9pcjEwMTMpO1xuXHR9LFxuKTtcblxuTU9DS19IQU5ETEVSUyAmJiBhZGRIYW5kbGVyKFxuXHQxMDE2LCAvLyBDb2xvciB0cmFuc2ZlciBmdW5jdGlvbnNcblx0dGFyZ2V0ID0+ICh0YXJnZXQgYXMgYW55KS5faXIxMDE2ICE9PSB1bmRlZmluZWQsXG5cdChyZWFkZXIsIHRhcmdldCwgbGVmdCkgPT4ge1xuXHRcdExPR19NT0NLX0hBTkRMRVJTICYmIGNvbnNvbGUubG9nKCdpbWFnZSByZXNvdXJjZSAxMDE2JywgbGVmdCgpKTtcblx0XHQodGFyZ2V0IGFzIGFueSkuX2lyMTAxNiA9IHJlYWRCeXRlcyhyZWFkZXIsIGxlZnQoKSk7XG5cdH0sXG5cdCh3cml0ZXIsIHRhcmdldCkgPT4ge1xuXHRcdHdyaXRlQnl0ZXMod3JpdGVyLCAodGFyZ2V0IGFzIGFueSkuX2lyMTAxNik7XG5cdH0sXG4pO1xuXG5hZGRIYW5kbGVyKFxuXHQxMDI0LFxuXHR0YXJnZXQgPT4gdGFyZ2V0LmxheWVyU3RhdGUgIT09IHVuZGVmaW5lZCxcblx0KHJlYWRlciwgdGFyZ2V0KSA9PiB0YXJnZXQubGF5ZXJTdGF0ZSA9IHJlYWRVaW50MTYocmVhZGVyKSxcblx0KHdyaXRlciwgdGFyZ2V0KSA9PiB3cml0ZVVpbnQxNih3cml0ZXIsIHRhcmdldC5sYXllclN0YXRlISksXG4pO1xuXG5hZGRIYW5kbGVyKFxuXHQxMDI2LFxuXHR0YXJnZXQgPT4gdGFyZ2V0LmxheWVyc0dyb3VwICE9PSB1bmRlZmluZWQsXG5cdChyZWFkZXIsIHRhcmdldCwgbGVmdCkgPT4ge1xuXHRcdHRhcmdldC5sYXllcnNHcm91cCA9IFtdO1xuXG5cdFx0d2hpbGUgKGxlZnQoKSkge1xuXHRcdFx0dGFyZ2V0LmxheWVyc0dyb3VwLnB1c2gocmVhZFVpbnQxNihyZWFkZXIpKTtcblx0XHR9XG5cdH0sXG5cdCh3cml0ZXIsIHRhcmdldCkgPT4ge1xuXHRcdGZvciAoY29uc3QgZyBvZiB0YXJnZXQubGF5ZXJzR3JvdXAhKSB7XG5cdFx0XHR3cml0ZVVpbnQxNih3cml0ZXIsIGcpO1xuXHRcdH1cblx0fSxcbik7XG5cbmFkZEhhbmRsZXIoXG5cdDEwNzIsXG5cdHRhcmdldCA9PiB0YXJnZXQubGF5ZXJHcm91cHNFbmFibGVkSWQgIT09IHVuZGVmaW5lZCxcblx0KHJlYWRlciwgdGFyZ2V0LCBsZWZ0KSA9PiB7XG5cdFx0dGFyZ2V0LmxheWVyR3JvdXBzRW5hYmxlZElkID0gW107XG5cblx0XHR3aGlsZSAobGVmdCgpKSB7XG5cdFx0XHR0YXJnZXQubGF5ZXJHcm91cHNFbmFibGVkSWQucHVzaChyZWFkVWludDgocmVhZGVyKSk7XG5cdFx0fVxuXHR9LFxuXHQod3JpdGVyLCB0YXJnZXQpID0+IHtcblx0XHRmb3IgKGNvbnN0IGlkIG9mIHRhcmdldC5sYXllckdyb3Vwc0VuYWJsZWRJZCEpIHtcblx0XHRcdHdyaXRlVWludDgod3JpdGVyLCBpZCk7XG5cdFx0fVxuXHR9LFxuKTtcblxuYWRkSGFuZGxlcihcblx0MTA2OSxcblx0dGFyZ2V0ID0+IHRhcmdldC5sYXllclNlbGVjdGlvbklkcyAhPT0gdW5kZWZpbmVkLFxuXHQocmVhZGVyLCB0YXJnZXQpID0+IHtcblx0XHRsZXQgY291bnQgPSByZWFkVWludDE2KHJlYWRlcik7XG5cdFx0dGFyZ2V0LmxheWVyU2VsZWN0aW9uSWRzID0gW107XG5cblx0XHR3aGlsZSAoY291bnQtLSkge1xuXHRcdFx0dGFyZ2V0LmxheWVyU2VsZWN0aW9uSWRzLnB1c2gocmVhZFVpbnQzMihyZWFkZXIpKTtcblx0XHR9XG5cdH0sXG5cdCh3cml0ZXIsIHRhcmdldCkgPT4ge1xuXHRcdHdyaXRlVWludDE2KHdyaXRlciwgdGFyZ2V0LmxheWVyU2VsZWN0aW9uSWRzIS5sZW5ndGgpO1xuXG5cdFx0Zm9yIChjb25zdCBpZCBvZiB0YXJnZXQubGF5ZXJTZWxlY3Rpb25JZHMhKSB7XG5cdFx0XHR3cml0ZVVpbnQzMih3cml0ZXIsIGlkKTtcblx0XHR9XG5cdH0sXG4pO1xuXG5hZGRIYW5kbGVyKFxuXHQxMDMyLFxuXHR0YXJnZXQgPT4gdGFyZ2V0LmdyaWRBbmRHdWlkZXNJbmZvcm1hdGlvbiAhPT0gdW5kZWZpbmVkLFxuXHQocmVhZGVyLCB0YXJnZXQpID0+IHtcblx0XHRjb25zdCB2ZXJzaW9uID0gcmVhZFVpbnQzMihyZWFkZXIpO1xuXHRcdGNvbnN0IGhvcml6b250YWwgPSByZWFkVWludDMyKHJlYWRlcik7XG5cdFx0Y29uc3QgdmVydGljYWwgPSByZWFkVWludDMyKHJlYWRlcik7XG5cdFx0Y29uc3QgY291bnQgPSByZWFkVWludDMyKHJlYWRlcik7XG5cblx0XHRpZiAodmVyc2lvbiAhPT0gMSkgdGhyb3cgbmV3IEVycm9yKGBJbnZhbGlkIDEwMzIgcmVzb3VyY2UgdmVyc2lvbjogJHt2ZXJzaW9ufWApO1xuXG5cdFx0dGFyZ2V0LmdyaWRBbmRHdWlkZXNJbmZvcm1hdGlvbiA9IHtcblx0XHRcdGdyaWQ6IHsgaG9yaXpvbnRhbCwgdmVydGljYWwgfSxcblx0XHRcdGd1aWRlczogW10sXG5cdFx0fTtcblxuXHRcdGZvciAobGV0IGkgPSAwOyBpIDwgY291bnQ7IGkrKykge1xuXHRcdFx0dGFyZ2V0LmdyaWRBbmRHdWlkZXNJbmZvcm1hdGlvbi5ndWlkZXMhLnB1c2goe1xuXHRcdFx0XHRsb2NhdGlvbjogcmVhZFVpbnQzMihyZWFkZXIpIC8gMzIsXG5cdFx0XHRcdGRpcmVjdGlvbjogcmVhZFVpbnQ4KHJlYWRlcikgPyAnaG9yaXpvbnRhbCcgOiAndmVydGljYWwnXG5cdFx0XHR9KTtcblx0XHR9XG5cdH0sXG5cdCh3cml0ZXIsIHRhcmdldCkgPT4ge1xuXHRcdGNvbnN0IGluZm8gPSB0YXJnZXQuZ3JpZEFuZEd1aWRlc0luZm9ybWF0aW9uITtcblx0XHRjb25zdCBncmlkID0gaW5mby5ncmlkIHx8IHsgaG9yaXpvbnRhbDogMTggKiAzMiwgdmVydGljYWw6IDE4ICogMzIgfTtcblx0XHRjb25zdCBndWlkZXMgPSBpbmZvLmd1aWRlcyB8fCBbXTtcblxuXHRcdHdyaXRlVWludDMyKHdyaXRlciwgMSk7XG5cdFx0d3JpdGVVaW50MzIod3JpdGVyLCBncmlkLmhvcml6b250YWwpO1xuXHRcdHdyaXRlVWludDMyKHdyaXRlciwgZ3JpZC52ZXJ0aWNhbCk7XG5cdFx0d3JpdGVVaW50MzIod3JpdGVyLCBndWlkZXMubGVuZ3RoKTtcblxuXHRcdGZvciAoY29uc3QgZyBvZiBndWlkZXMpIHtcblx0XHRcdHdyaXRlVWludDMyKHdyaXRlciwgZy5sb2NhdGlvbiAqIDMyKTtcblx0XHRcdHdyaXRlVWludDgod3JpdGVyLCBnLmRpcmVjdGlvbiA9PT0gJ2hvcml6b250YWwnID8gMSA6IDApO1xuXHRcdH1cblx0fSxcbik7XG5cbmFkZEhhbmRsZXIoXG5cdDEwNTQsXG5cdHRhcmdldCA9PiB0YXJnZXQudXJsc0xpc3QgIT09IHVuZGVmaW5lZCxcblx0KHJlYWRlciwgdGFyZ2V0LCBfLCBvcHRpb25zKSA9PiB7XG5cdFx0Y29uc3QgY291bnQgPSByZWFkVWludDMyKHJlYWRlcik7XG5cblx0XHRpZiAoY291bnQpIHtcblx0XHRcdGlmICghb3B0aW9ucy50aHJvd0Zvck1pc3NpbmdGZWF0dXJlcykgcmV0dXJuO1xuXHRcdFx0dGhyb3cgbmV3IEVycm9yKCdOb3QgaW1wbGVtZW50ZWQ6IFVSTCBMaXN0Jyk7XG5cdFx0fVxuXG5cdFx0Ly8gVE9ETzogcmVhZCBhY3R1YWwgVVJMIGxpc3Rcblx0XHR0YXJnZXQudXJsc0xpc3QgPSBbXTtcblx0fSxcblx0KHdyaXRlciwgdGFyZ2V0KSA9PiB7XG5cdFx0d3JpdGVVaW50MzIod3JpdGVyLCB0YXJnZXQudXJsc0xpc3QhLmxlbmd0aCk7XG5cblx0XHQvLyBUT0RPOiB3cml0ZSBhY3R1YWwgVVJMIGxpc3Rcblx0XHRpZiAodGFyZ2V0LnVybHNMaXN0IS5sZW5ndGgpIHtcblx0XHRcdHRocm93IG5ldyBFcnJvcignTm90IGltcGxlbWVudGVkOiBVUkwgTGlzdCcpO1xuXHRcdH1cblx0fSxcbik7XG5cbk1PQ0tfSEFORExFUlMgJiYgYWRkSGFuZGxlcihcblx0MTA1MCwgLy8gU2xpY2VzXG5cdHRhcmdldCA9PiAodGFyZ2V0IGFzIGFueSkuX2lyMTA1MCAhPT0gdW5kZWZpbmVkLFxuXHQocmVhZGVyLCB0YXJnZXQsIGxlZnQpID0+IHtcblx0XHRMT0dfTU9DS19IQU5ETEVSUyAmJiBjb25zb2xlLmxvZygnaW1hZ2UgcmVzb3VyY2UgMTA1MCcsIGxlZnQoKSk7XG5cdFx0KHRhcmdldCBhcyBhbnkpLl9pcjEwNTAgPSByZWFkQnl0ZXMocmVhZGVyLCBsZWZ0KCkpO1xuXHR9LFxuXHQod3JpdGVyLCB0YXJnZXQpID0+IHtcblx0XHR3cml0ZUJ5dGVzKHdyaXRlciwgKHRhcmdldCBhcyBhbnkpLl9pcjEwNTApO1xuXHR9LFxuKTtcblxuYWRkSGFuZGxlcihcblx0MTA2NCxcblx0dGFyZ2V0ID0+IHRhcmdldC5waXhlbEFzcGVjdFJhdGlvICE9PSB1bmRlZmluZWQsXG5cdChyZWFkZXIsIHRhcmdldCkgPT4ge1xuXHRcdGlmIChyZWFkVWludDMyKHJlYWRlcikgPiAyKSB0aHJvdyBuZXcgRXJyb3IoJ0ludmFsaWQgcGl4ZWxBc3BlY3RSYXRpbyB2ZXJzaW9uJyk7XG5cdFx0dGFyZ2V0LnBpeGVsQXNwZWN0UmF0aW8gPSB7IGFzcGVjdDogcmVhZEZsb2F0NjQocmVhZGVyKSB9O1xuXHR9LFxuXHQod3JpdGVyLCB0YXJnZXQpID0+IHtcblx0XHR3cml0ZVVpbnQzMih3cml0ZXIsIDIpOyAvLyB2ZXJzaW9uXG5cdFx0d3JpdGVGbG9hdDY0KHdyaXRlciwgdGFyZ2V0LnBpeGVsQXNwZWN0UmF0aW8hLmFzcGVjdCk7XG5cdH0sXG4pO1xuXG5hZGRIYW5kbGVyKFxuXHQxMDQxLFxuXHR0YXJnZXQgPT4gdGFyZ2V0LmljY1VudGFnZ2VkUHJvZmlsZSAhPT0gdW5kZWZpbmVkLFxuXHQocmVhZGVyLCB0YXJnZXQpID0+IHtcblx0XHR0YXJnZXQuaWNjVW50YWdnZWRQcm9maWxlID0gISFyZWFkVWludDgocmVhZGVyKTtcblx0fSxcblx0KHdyaXRlciwgdGFyZ2V0KSA9PiB7XG5cdFx0d3JpdGVVaW50OCh3cml0ZXIsIHRhcmdldC5pY2NVbnRhZ2dlZFByb2ZpbGUgPyAxIDogMCk7XG5cdH0sXG4pO1xuXG5NT0NLX0hBTkRMRVJTICYmIGFkZEhhbmRsZXIoXG5cdDEwMzksIC8vIElDQyBQcm9maWxlXG5cdHRhcmdldCA9PiAodGFyZ2V0IGFzIGFueSkuX2lyMTAzOSAhPT0gdW5kZWZpbmVkLFxuXHQocmVhZGVyLCB0YXJnZXQsIGxlZnQpID0+IHtcblx0XHRMT0dfTU9DS19IQU5ETEVSUyAmJiBjb25zb2xlLmxvZygnaW1hZ2UgcmVzb3VyY2UgMTAzOScsIGxlZnQoKSk7XG5cdFx0KHRhcmdldCBhcyBhbnkpLl9pcjEwMzkgPSByZWFkQnl0ZXMocmVhZGVyLCBsZWZ0KCkpO1xuXHR9LFxuXHQod3JpdGVyLCB0YXJnZXQpID0+IHtcblx0XHR3cml0ZUJ5dGVzKHdyaXRlciwgKHRhcmdldCBhcyBhbnkpLl9pcjEwMzkpO1xuXHR9LFxuKTtcblxuYWRkSGFuZGxlcihcblx0MTA0NCxcblx0dGFyZ2V0ID0+IHRhcmdldC5pZHNTZWVkTnVtYmVyICE9PSB1bmRlZmluZWQsXG5cdChyZWFkZXIsIHRhcmdldCkgPT4gdGFyZ2V0Lmlkc1NlZWROdW1iZXIgPSByZWFkVWludDMyKHJlYWRlciksXG5cdCh3cml0ZXIsIHRhcmdldCkgPT4gd3JpdGVVaW50MzIod3JpdGVyLCB0YXJnZXQuaWRzU2VlZE51bWJlciEpLFxuKTtcblxuYWRkSGFuZGxlcihcblx0MTAzNixcblx0dGFyZ2V0ID0+IHRhcmdldC50aHVtYm5haWwgIT09IHVuZGVmaW5lZCB8fCB0YXJnZXQudGh1bWJuYWlsUmF3ICE9PSB1bmRlZmluZWQsXG5cdChyZWFkZXIsIHRhcmdldCwgbGVmdCwgb3B0aW9ucykgPT4ge1xuXHRcdGNvbnN0IGZvcm1hdCA9IHJlYWRVaW50MzIocmVhZGVyKTsgLy8gMSA9IGtKcGVnUkdCLCAwID0ga1Jhd1JHQlxuXHRcdGNvbnN0IHdpZHRoID0gcmVhZFVpbnQzMihyZWFkZXIpO1xuXHRcdGNvbnN0IGhlaWdodCA9IHJlYWRVaW50MzIocmVhZGVyKTtcblx0XHRyZWFkVWludDMyKHJlYWRlcik7IC8vIHdpZHRoQnl0ZXMgPSAod2lkdGggKiBiaXRzX3Blcl9waXhlbCArIDMxKSAvIDMyICogNC5cblx0XHRyZWFkVWludDMyKHJlYWRlcik7IC8vIHRvdGFsU2l6ZSA9IHdpZHRoQnl0ZXMgKiBoZWlnaHQgKiBwbGFuZXNcblx0XHRyZWFkVWludDMyKHJlYWRlcik7IC8vIHNpemVBZnRlckNvbXByZXNzaW9uXG5cdFx0Y29uc3QgYml0c1BlclBpeGVsID0gcmVhZFVpbnQxNihyZWFkZXIpOyAvLyAyNFxuXHRcdGNvbnN0IHBsYW5lcyA9IHJlYWRVaW50MTYocmVhZGVyKTsgLy8gMVxuXG5cdFx0aWYgKGZvcm1hdCAhPT0gMSB8fCBiaXRzUGVyUGl4ZWwgIT09IDI0IHx8IHBsYW5lcyAhPT0gMSkge1xuXHRcdFx0b3B0aW9ucy5sb2dNaXNzaW5nRmVhdHVyZXMgJiYgY29uc29sZS5sb2coYEludmFsaWQgdGh1bWJuYWlsIGRhdGEgKGZvcm1hdDogJHtmb3JtYXR9LCBiaXRzUGVyUGl4ZWw6ICR7Yml0c1BlclBpeGVsfSwgcGxhbmVzOiAke3BsYW5lc30pYCk7XG5cdFx0XHRza2lwQnl0ZXMocmVhZGVyLCBsZWZ0KCkpO1xuXHRcdFx0cmV0dXJuO1xuXHRcdH1cblxuXHRcdGNvbnN0IHNpemUgPSBsZWZ0KCk7XG5cdFx0Y29uc3QgZGF0YSA9IHJlYWRCeXRlcyhyZWFkZXIsIHNpemUpO1xuXG5cdFx0aWYgKG9wdGlvbnMudXNlUmF3VGh1bWJuYWlsKSB7XG5cdFx0XHR0YXJnZXQudGh1bWJuYWlsUmF3ID0geyB3aWR0aCwgaGVpZ2h0LCBkYXRhIH07XG5cdFx0fSBlbHNlIHtcblx0XHRcdHRhcmdldC50aHVtYm5haWwgPSBjcmVhdGVDYW52YXNGcm9tRGF0YShkYXRhKTtcblx0XHR9XG5cdH0sXG5cdCh3cml0ZXIsIHRhcmdldCkgPT4ge1xuXHRcdGxldCB3aWR0aCA9IDA7XG5cdFx0bGV0IGhlaWdodCA9IDA7XG5cdFx0bGV0IGRhdGE6IFVpbnQ4QXJyYXk7XG5cblx0XHRpZiAodGFyZ2V0LnRodW1ibmFpbFJhdykge1xuXHRcdFx0d2lkdGggPSB0YXJnZXQudGh1bWJuYWlsUmF3LndpZHRoO1xuXHRcdFx0aGVpZ2h0ID0gdGFyZ2V0LnRodW1ibmFpbFJhdy5oZWlnaHQ7XG5cdFx0XHRkYXRhID0gdGFyZ2V0LnRodW1ibmFpbFJhdy5kYXRhO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHR3aWR0aCA9IHRhcmdldC50aHVtYm5haWwhLndpZHRoO1xuXHRcdFx0aGVpZ2h0ID0gdGFyZ2V0LnRodW1ibmFpbCEuaGVpZ2h0O1xuXHRcdFx0ZGF0YSA9IHRvQnl0ZUFycmF5KHRhcmdldC50aHVtYm5haWwhLnRvRGF0YVVSTCgnaW1hZ2UvanBlZycsIDEpLnN1YnN0cignZGF0YTppbWFnZS9qcGVnO2Jhc2U2NCwnLmxlbmd0aCkpO1xuXHRcdH1cblxuXHRcdGNvbnN0IGJpdHNQZXJQaXhlbCA9IDI0O1xuXHRcdGNvbnN0IHdpZHRoQnl0ZXMgPSBNYXRoLmZsb29yKCh3aWR0aCAqIGJpdHNQZXJQaXhlbCArIDMxKSAvIDMyKSAqIDQ7XG5cdFx0Y29uc3QgcGxhbmVzID0gMTtcblx0XHRjb25zdCB0b3RhbFNpemUgPSB3aWR0aEJ5dGVzICogaGVpZ2h0ICogcGxhbmVzO1xuXHRcdGNvbnN0IHNpemVBZnRlckNvbXByZXNzaW9uID0gZGF0YS5sZW5ndGg7XG5cblx0XHR3cml0ZVVpbnQzMih3cml0ZXIsIDEpOyAvLyAxID0ga0pwZWdSR0Jcblx0XHR3cml0ZVVpbnQzMih3cml0ZXIsIHdpZHRoKTtcblx0XHR3cml0ZVVpbnQzMih3cml0ZXIsIGhlaWdodCk7XG5cdFx0d3JpdGVVaW50MzIod3JpdGVyLCB3aWR0aEJ5dGVzKTtcblx0XHR3cml0ZVVpbnQzMih3cml0ZXIsIHRvdGFsU2l6ZSk7XG5cdFx0d3JpdGVVaW50MzIod3JpdGVyLCBzaXplQWZ0ZXJDb21wcmVzc2lvbik7XG5cdFx0d3JpdGVVaW50MTYod3JpdGVyLCBiaXRzUGVyUGl4ZWwpO1xuXHRcdHdyaXRlVWludDE2KHdyaXRlciwgcGxhbmVzKTtcblx0XHR3cml0ZUJ5dGVzKHdyaXRlciwgZGF0YSk7XG5cdH0sXG4pO1xuXG5hZGRIYW5kbGVyKFxuXHQxMDU3LFxuXHR0YXJnZXQgPT4gdGFyZ2V0LnZlcnNpb25JbmZvICE9PSB1bmRlZmluZWQsXG5cdChyZWFkZXIsIHRhcmdldCwgbGVmdCkgPT4ge1xuXHRcdGNvbnN0IHZlcnNpb24gPSByZWFkVWludDMyKHJlYWRlcik7XG5cdFx0aWYgKHZlcnNpb24gIT09IDEpIHRocm93IG5ldyBFcnJvcignSW52YWxpZCB2ZXJzaW9uSW5mbyB2ZXJzaW9uJyk7XG5cblx0XHR0YXJnZXQudmVyc2lvbkluZm8gPSB7XG5cdFx0XHRoYXNSZWFsTWVyZ2VkRGF0YTogISFyZWFkVWludDgocmVhZGVyKSxcblx0XHRcdHdyaXRlck5hbWU6IHJlYWRVbmljb2RlU3RyaW5nKHJlYWRlciksXG5cdFx0XHRyZWFkZXJOYW1lOiByZWFkVW5pY29kZVN0cmluZyhyZWFkZXIpLFxuXHRcdFx0ZmlsZVZlcnNpb246IHJlYWRVaW50MzIocmVhZGVyKSxcblx0XHR9O1xuXG5cdFx0c2tpcEJ5dGVzKHJlYWRlciwgbGVmdCgpKTtcblx0fSxcblx0KHdyaXRlciwgdGFyZ2V0KSA9PiB7XG5cdFx0Y29uc3QgdmVyc2lvbkluZm8gPSB0YXJnZXQudmVyc2lvbkluZm8hO1xuXHRcdHdyaXRlVWludDMyKHdyaXRlciwgMSk7IC8vIHZlcnNpb25cblx0XHR3cml0ZVVpbnQ4KHdyaXRlciwgdmVyc2lvbkluZm8uaGFzUmVhbE1lcmdlZERhdGEgPyAxIDogMCk7XG5cdFx0d3JpdGVVbmljb2RlU3RyaW5nKHdyaXRlciwgdmVyc2lvbkluZm8ud3JpdGVyTmFtZSk7XG5cdFx0d3JpdGVVbmljb2RlU3RyaW5nKHdyaXRlciwgdmVyc2lvbkluZm8ucmVhZGVyTmFtZSk7XG5cdFx0d3JpdGVVaW50MzIod3JpdGVyLCB2ZXJzaW9uSW5mby5maWxlVmVyc2lvbik7XG5cdH0sXG4pO1xuXG5NT0NLX0hBTkRMRVJTICYmIGFkZEhhbmRsZXIoXG5cdDEwNTgsIC8vIEVYSUYgZGF0YSAxLlxuXHR0YXJnZXQgPT4gKHRhcmdldCBhcyBhbnkpLl9pcjEwNTggIT09IHVuZGVmaW5lZCxcblx0KHJlYWRlciwgdGFyZ2V0LCBsZWZ0KSA9PiB7XG5cdFx0TE9HX01PQ0tfSEFORExFUlMgJiYgY29uc29sZS5sb2coJ2ltYWdlIHJlc291cmNlIDEwNTgnLCBsZWZ0KCkpO1xuXHRcdCh0YXJnZXQgYXMgYW55KS5faXIxMDU4ID0gcmVhZEJ5dGVzKHJlYWRlciwgbGVmdCgpKTtcblx0fSxcblx0KHdyaXRlciwgdGFyZ2V0KSA9PiB7XG5cdFx0d3JpdGVCeXRlcyh3cml0ZXIsICh0YXJnZXQgYXMgYW55KS5faXIxMDU4KTtcblx0fSxcbik7XG5cbmludGVyZmFjZSBEZXNjcmlwdG9yMTA4OCB7XG5cdCdudWxsJzogc3RyaW5nW107XG59XG5cbmFkZEhhbmRsZXIoXG5cdDEwODgsXG5cdHRhcmdldCA9PiB0YXJnZXQucGF0aFNlbGVjdGlvblN0YXRlICE9PSB1bmRlZmluZWQsXG5cdChyZWFkZXIsIHRhcmdldCwgX2xlZnQpID0+IHtcblx0XHRjb25zdCBkZXNjOiBEZXNjcmlwdG9yMTA4OCA9IHJlYWRWZXJzaW9uQW5kRGVzY3JpcHRvcihyZWFkZXIpO1xuXHRcdC8vIGNvbnNvbGUubG9nKHJlcXVpcmUoJ3V0aWwnKS5pbnNwZWN0KGRlc2MsIGZhbHNlLCA5OSwgdHJ1ZSkpO1xuXHRcdHRhcmdldC5wYXRoU2VsZWN0aW9uU3RhdGUgPSBkZXNjWydudWxsJ107XG5cdH0sXG5cdCh3cml0ZXIsIHRhcmdldCkgPT4ge1xuXHRcdGNvbnN0IGRlc2M6IERlc2NyaXB0b3IxMDg4ID0geyAnbnVsbCc6IHRhcmdldC5wYXRoU2VsZWN0aW9uU3RhdGUhIH07XG5cdFx0d3JpdGVWZXJzaW9uQW5kRGVzY3JpcHRvcih3cml0ZXIsICcnLCAnbnVsbCcsIGRlc2MpO1xuXHR9LFxuKTtcblxuTU9DS19IQU5ETEVSUyAmJiBhZGRIYW5kbGVyKFxuXHQxMDI1LFxuXHR0YXJnZXQgPT4gKHRhcmdldCBhcyBhbnkpLl9pcjEwMjUgIT09IHVuZGVmaW5lZCxcblx0KHJlYWRlciwgdGFyZ2V0LCBsZWZ0KSA9PiB7XG5cdFx0TE9HX01PQ0tfSEFORExFUlMgJiYgY29uc29sZS5sb2coJ2ltYWdlIHJlc291cmNlIDEwMjUnLCBsZWZ0KCkpO1xuXHRcdCh0YXJnZXQgYXMgYW55KS5faXIxMDI1ID0gcmVhZEJ5dGVzKHJlYWRlciwgbGVmdCgpKTtcblx0fSxcblx0KHdyaXRlciwgdGFyZ2V0KSA9PiB7XG5cdFx0d3JpdGVCeXRlcyh3cml0ZXIsICh0YXJnZXQgYXMgYW55KS5faXIxMDI1KTtcblx0fSxcbik7XG5cbmNvbnN0IEZybUQgPSBjcmVhdGVFbnVtPCdhdXRvJyB8ICdub25lJyB8ICdkaXNwb3NlJz4oJ0ZybUQnLCAnJywge1xuXHRhdXRvOiAnQXV0bycsXG5cdG5vbmU6ICdOb25lJyxcblx0ZGlzcG9zZTogJ0Rpc3AnLFxufSk7XG5cbmludGVyZmFjZSBBbmltYXRpb25EZXNjcmlwdG9yIHtcblx0QUZTdDogbnVtYmVyO1xuXHRGckluOiB7XG5cdFx0RnJJRDogbnVtYmVyO1xuXHRcdEZyRGw6IG51bWJlcjtcblx0XHRGckRzOiBzdHJpbmc7XG5cdFx0RnJHQT86IG51bWJlcjtcblx0fVtdO1xuXHRGU3RzOiB7XG5cdFx0RnNJRDogbnVtYmVyO1xuXHRcdEFGcm06IG51bWJlcjtcblx0XHRGc0ZyOiBudW1iZXJbXTtcblx0XHRMQ250OiBudW1iZXI7XG5cdH1bXTtcbn1cblxuaW50ZXJmYWNlIEFuaW1hdGlvbnMge1xuXHRmcmFtZXM6IHtcblx0XHRpZDogbnVtYmVyO1xuXHRcdGRlbGF5OiBudW1iZXI7XG5cdFx0ZGlzcG9zZT86ICdhdXRvJyB8ICdub25lJyB8ICdkaXNwb3NlJztcblx0fVtdO1xuXHRhbmltYXRpb25zOiB7XG5cdFx0aWQ6IG51bWJlcjtcblx0XHRmcmFtZXM6IG51bWJlcltdO1xuXHRcdHJlcGVhdHM/OiBudW1iZXI7XG5cdH1bXTtcbn1cblxuLy8gVE9ETzogVW5maW5pc2hlZFxuTU9DS19IQU5ETEVSUyAmJiBhZGRIYW5kbGVyKFxuXHQ0MDAwLFxuXHR0YXJnZXQgPT4gKHRhcmdldCBhcyBhbnkpLl9pcjQwMDAgIT09IHVuZGVmaW5lZCxcblx0KHJlYWRlciwgdGFyZ2V0LCBsZWZ0LCB7IGxvZ01pc3NpbmdGZWF0dXJlcywgbG9nRGV2RmVhdHVyZXMgfSkgPT4ge1xuXHRcdGlmIChNT0NLX0hBTkRMRVJTKSB7XG5cdFx0XHRMT0dfTU9DS19IQU5ETEVSUyAmJiBjb25zb2xlLmxvZygnaW1hZ2UgcmVzb3VyY2UgNDAwMCcsIGxlZnQoKSk7XG5cdFx0XHQodGFyZ2V0IGFzIGFueSkuX2lyNDAwMCA9IHJlYWRCeXRlcyhyZWFkZXIsIGxlZnQoKSk7XG5cdFx0XHRyZXR1cm47XG5cdFx0fVxuXG5cdFx0Y29uc3Qga2V5ID0gcmVhZFNpZ25hdHVyZShyZWFkZXIpO1xuXG5cdFx0aWYgKGtleSA9PT0gJ21hbmknKSB7XG5cdFx0XHRjaGVja1NpZ25hdHVyZShyZWFkZXIsICdJUkZSJyk7XG5cdFx0XHRyZWFkU2VjdGlvbihyZWFkZXIsIDEsIGxlZnQgPT4ge1xuXHRcdFx0XHR3aGlsZSAobGVmdCgpKSB7XG5cdFx0XHRcdFx0Y2hlY2tTaWduYXR1cmUocmVhZGVyLCAnOEJJTScpO1xuXHRcdFx0XHRcdGNvbnN0IGtleSA9IHJlYWRTaWduYXR1cmUocmVhZGVyKTtcblxuXHRcdFx0XHRcdHJlYWRTZWN0aW9uKHJlYWRlciwgMSwgbGVmdCA9PiB7XG5cdFx0XHRcdFx0XHRpZiAoa2V5ID09PSAnQW5EcycpIHtcblx0XHRcdFx0XHRcdFx0Y29uc3QgZGVzYyA9IHJlYWRWZXJzaW9uQW5kRGVzY3JpcHRvcihyZWFkZXIpIGFzIEFuaW1hdGlvbkRlc2NyaXB0b3I7XG5cdFx0XHRcdFx0XHRcdC8vIGNvbnNvbGUubG9nKCdBbkRzJywgZGVzYyk7XG5cdFx0XHRcdFx0XHRcdGxvZ0RldkZlYXR1cmVzICYmIGNvbnNvbGUubG9nKCcjNDAwMCBBbkRzJywgZGVzYyk7XG5cdFx0XHRcdFx0XHRcdC8vIGxvZ0RldkZlYXR1cmVzICYmIGNvbnNvbGUubG9nKCcjNDAwMCBBbkRzJywgcmVxdWlyZSgndXRpbCcpLmluc3BlY3QoZGVzYywgZmFsc2UsIDk5LCB0cnVlKSk7XG5cblx0XHRcdFx0XHRcdFx0Y29uc3QgcmVzdWx0OiBBbmltYXRpb25zID0ge1xuXHRcdFx0XHRcdFx0XHRcdC8vIGRlc2MuQUZTdCA/Pz9cblx0XHRcdFx0XHRcdFx0XHRmcmFtZXM6IGRlc2MuRnJJbi5tYXAoeCA9PiAoe1xuXHRcdFx0XHRcdFx0XHRcdFx0aWQ6IHguRnJJRCxcblx0XHRcdFx0XHRcdFx0XHRcdGRlbGF5OiB4LkZyRGwgLyAxMDAsXG5cdFx0XHRcdFx0XHRcdFx0XHRkaXNwb3NlOiB4LkZyRHMgPyBGcm1ELmRlY29kZSh4LkZyRHMpIDogJ2F1dG8nLCAvLyBtaXNzaW5nID09IGF1dG9cblx0XHRcdFx0XHRcdFx0XHRcdC8vIHguRnJHQSA/Pz9cblx0XHRcdFx0XHRcdFx0XHR9KSksXG5cdFx0XHRcdFx0XHRcdFx0YW5pbWF0aW9uczogZGVzYy5GU3RzLm1hcCh4ID0+ICh7XG5cdFx0XHRcdFx0XHRcdFx0XHRpZDogeC5Gc0lELFxuXHRcdFx0XHRcdFx0XHRcdFx0ZnJhbWVzOiB4LkZzRnIsXG5cdFx0XHRcdFx0XHRcdFx0XHRyZXBlYXRzOiB4LkxDbnQsXG5cdFx0XHRcdFx0XHRcdFx0XHQvLyB4LkFGcm0gPz8/XG5cdFx0XHRcdFx0XHRcdFx0fSkpLFxuXHRcdFx0XHRcdFx0XHR9O1xuXG5cdFx0XHRcdFx0XHRcdGxvZ0RldkZlYXR1cmVzICYmIGNvbnNvbGUubG9nKCcjNDAwMCBBbkRzOnJlc3VsdCcsIHJlc3VsdCk7XG5cdFx0XHRcdFx0XHRcdC8vIGxvZ0RldkZlYXR1cmVzICYmIGNvbnNvbGUubG9nKCcjNDAwMCBBbkRzOnJlc3VsdCcsIHJlcXVpcmUoJ3V0aWwnKS5pbnNwZWN0KHJlc3VsdCwgZmFsc2UsIDk5LCB0cnVlKSk7XG5cdFx0XHRcdFx0XHR9IGVsc2UgaWYgKGtleSA9PT0gJ1JvbGwnKSB7XG5cdFx0XHRcdFx0XHRcdGNvbnN0IGJ5dGVzID0gcmVhZEJ5dGVzKHJlYWRlciwgbGVmdCgpKTtcblx0XHRcdFx0XHRcdFx0bG9nRGV2RmVhdHVyZXMgJiYgY29uc29sZS5sb2coJyM0MDAwIFJvbGwnLCBieXRlcyk7XG5cdFx0XHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdFx0XHRsb2dNaXNzaW5nRmVhdHVyZXMgJiYgY29uc29sZS5sb2coJ1VuaGFuZGxlZCBzdWJzZWN0aW9uIGluICM0MDAwJywga2V5KTtcblx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHR9KTtcblx0XHRcdFx0fVxuXHRcdFx0fSk7XG5cdFx0fSBlbHNlIGlmIChrZXkgPT09ICdtb3B0Jykge1xuXHRcdFx0Y29uc3QgYnl0ZXMgPSByZWFkQnl0ZXMocmVhZGVyLCBsZWZ0KCkpO1xuXHRcdFx0bG9nRGV2RmVhdHVyZXMgJiYgY29uc29sZS5sb2coJyM0MDAwIG1vcHQnLCBieXRlcyk7XG5cdFx0fSBlbHNlIHtcblx0XHRcdGxvZ01pc3NpbmdGZWF0dXJlcyAmJiBjb25zb2xlLmxvZygnVW5oYW5kbGVkIGtleSBpbiAjNDAwMDonLCBrZXkpO1xuXHRcdFx0cmV0dXJuO1xuXHRcdH1cblx0fSxcblx0KHdyaXRlciwgdGFyZ2V0KSA9PiB7XG5cdFx0d3JpdGVCeXRlcyh3cml0ZXIsICh0YXJnZXQgYXMgYW55KS5faXI0MDAwKTtcblx0fSxcbik7XG5cbi8vIFRPRE86IFVuZmluaXNoZWRcbk1PQ0tfSEFORExFUlMgJiYgYWRkSGFuZGxlcihcblx0NDAwMSxcblx0dGFyZ2V0ID0+ICh0YXJnZXQgYXMgYW55KS5faXI0MDAxICE9PSB1bmRlZmluZWQsXG5cdChyZWFkZXIsIHRhcmdldCwgbGVmdCwgeyBsb2dNaXNzaW5nRmVhdHVyZXMsIGxvZ0RldkZlYXR1cmVzIH0pID0+IHtcblx0XHRpZiAoTU9DS19IQU5ETEVSUykge1xuXHRcdFx0TE9HX01PQ0tfSEFORExFUlMgJiYgY29uc29sZS5sb2coJ2ltYWdlIHJlc291cmNlIDQwMDEnLCBsZWZ0KCkpO1xuXHRcdFx0KHRhcmdldCBhcyBhbnkpLl9pcjQwMDEgPSByZWFkQnl0ZXMocmVhZGVyLCBsZWZ0KCkpO1xuXHRcdFx0cmV0dXJuO1xuXHRcdH1cblxuXHRcdGNvbnN0IGtleSA9IHJlYWRTaWduYXR1cmUocmVhZGVyKTtcblxuXHRcdGlmIChrZXkgPT09ICdtZnJpJykge1xuXHRcdFx0Y29uc3QgdmVyc2lvbiA9IHJlYWRVaW50MzIocmVhZGVyKTtcblx0XHRcdGlmICh2ZXJzaW9uICE9PSAyKSB0aHJvdyBuZXcgRXJyb3IoJ0ludmFsaWQgbWZyaSB2ZXJzaW9uJyk7XG5cblx0XHRcdGNvbnN0IGxlbmd0aCA9IHJlYWRVaW50MzIocmVhZGVyKTtcblx0XHRcdGNvbnN0IGJ5dGVzID0gcmVhZEJ5dGVzKHJlYWRlciwgbGVuZ3RoKTtcblx0XHRcdGxvZ0RldkZlYXR1cmVzICYmIGNvbnNvbGUubG9nKCdtZnJpJywgYnl0ZXMpO1xuXHRcdH0gZWxzZSBpZiAoa2V5ID09PSAnbXNldCcpIHtcblx0XHRcdGNvbnN0IGRlc2MgPSByZWFkVmVyc2lvbkFuZERlc2NyaXB0b3IocmVhZGVyKTtcblx0XHRcdGxvZ0RldkZlYXR1cmVzICYmIGNvbnNvbGUubG9nKCdtc2V0JywgZGVzYyk7XG5cdFx0fSBlbHNlIHtcblx0XHRcdGxvZ01pc3NpbmdGZWF0dXJlcyAmJiBjb25zb2xlLmxvZygnVW5oYW5kbGVkIGtleSBpbiAjNDAwMScsIGtleSk7XG5cdFx0fVxuXHR9LFxuXHQod3JpdGVyLCB0YXJnZXQpID0+IHtcblx0XHR3cml0ZUJ5dGVzKHdyaXRlciwgKHRhcmdldCBhcyBhbnkpLl9pcjQwMDEpO1xuXHR9LFxuKTtcbiJdLCJzb3VyY2VSb290IjoiL2hvbWUvbWFuaC9rYW9waXovZWVsL2FnLXBzZC9zcmMifQ==
