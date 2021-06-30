"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.readPattern = exports.readColor = exports.readSection = exports.readDataRLE = exports.readPsd = exports.checkSignature = exports.skipBytes = exports.readAsciiString = exports.readUnicodeStringWithLength = exports.readUnicodeString = exports.readPascalString = exports.readSignature = exports.readBytes = exports.readFixedPointPath32 = exports.readFixedPoint32 = exports.readFloat64 = exports.readFloat32 = exports.readUint32 = exports.readInt32LE = exports.readInt32 = exports.readUint16 = exports.readInt16 = exports.peekUint8 = exports.readUint8 = exports.createReader = exports.supportedColorModes = void 0;
var helpers_1 = require("./helpers");
var additionalInfo_1 = require("./additionalInfo");
var imageResources_1 = require("./imageResources");
exports.supportedColorModes = [0 /* Bitmap */, 1 /* Grayscale */, 3 /* RGB */];
var colorModes = ['bitmap', 'grayscale', 'indexed', 'RGB', 'CMYK', 'multichannel', 'duotone', 'lab'];
function setupGrayscale(data) {
    var size = data.width * data.height * 4;
    for (var i = 0; i < size; i += 4) {
        data.data[i + 1] = data.data[i];
        data.data[i + 2] = data.data[i];
    }
}
function createReader(buffer, offset, length) {
    var view = new DataView(buffer, offset, length);
    return { view: view, offset: 0 };
}
exports.createReader = createReader;
function readUint8(reader) {
    reader.offset += 1;
    return reader.view.getUint8(reader.offset - 1);
}
exports.readUint8 = readUint8;
function peekUint8(reader) {
    return reader.view.getUint8(reader.offset);
}
exports.peekUint8 = peekUint8;
function readInt16(reader) {
    reader.offset += 2;
    return reader.view.getInt16(reader.offset - 2, false);
}
exports.readInt16 = readInt16;
function readUint16(reader) {
    reader.offset += 2;
    return reader.view.getUint16(reader.offset - 2, false);
}
exports.readUint16 = readUint16;
function readInt32(reader) {
    reader.offset += 4;
    return reader.view.getInt32(reader.offset - 4, false);
}
exports.readInt32 = readInt32;
function readInt32LE(reader) {
    reader.offset += 4;
    return reader.view.getInt32(reader.offset - 4, true);
}
exports.readInt32LE = readInt32LE;
function readUint32(reader) {
    reader.offset += 4;
    return reader.view.getUint32(reader.offset - 4, false);
}
exports.readUint32 = readUint32;
function readFloat32(reader) {
    reader.offset += 4;
    return reader.view.getFloat32(reader.offset - 4, false);
}
exports.readFloat32 = readFloat32;
function readFloat64(reader) {
    reader.offset += 8;
    return reader.view.getFloat64(reader.offset - 8, false);
}
exports.readFloat64 = readFloat64;
// 32-bit fixed-point number 16.16
function readFixedPoint32(reader) {
    return readInt32(reader) / (1 << 16);
}
exports.readFixedPoint32 = readFixedPoint32;
// 32-bit fixed-point number 8.24
function readFixedPointPath32(reader) {
    return readInt32(reader) / (1 << 24);
}
exports.readFixedPointPath32 = readFixedPointPath32;
function readBytes(reader, length) {
    reader.offset += length;
    return new Uint8Array(reader.view.buffer, reader.view.byteOffset + reader.offset - length, length);
}
exports.readBytes = readBytes;
function readSignature(reader) {
    return readShortString(reader, 4);
}
exports.readSignature = readSignature;
function readPascalString(reader, padTo) {
    var length = readUint8(reader);
    var text = readShortString(reader, length);
    while (++length % padTo) {
        skipBytes(reader, 1);
    }
    return text;
}
exports.readPascalString = readPascalString;
function readUnicodeString(reader) {
    var length = readUint32(reader);
    return readUnicodeStringWithLength(reader, length);
}
exports.readUnicodeString = readUnicodeString;
function readUnicodeStringWithLength(reader, length) {
    var text = '';
    while (length--) {
        var value = readUint16(reader);
        if (value || length > 0) { // remove trailing \0
            text += String.fromCharCode(value);
        }
    }
    return text;
}
exports.readUnicodeStringWithLength = readUnicodeStringWithLength;
function readAsciiString(reader, length) {
    var text = '';
    while (length--) {
        text += String.fromCharCode(readUint8(reader));
    }
    return text;
}
exports.readAsciiString = readAsciiString;
function skipBytes(reader, count) {
    reader.offset += count;
}
exports.skipBytes = skipBytes;
function checkSignature(reader, a, b) {
    var offset = reader.offset;
    var signature = readSignature(reader);
    if (signature !== a && signature !== b) {
        throw new Error("Invalid signature: '" + signature + "' at 0x" + offset.toString(16));
    }
}
exports.checkSignature = checkSignature;
function readShortString(reader, length) {
    var buffer = readBytes(reader, length);
    return String.fromCharCode.apply(String, buffer);
}
function readPsd(reader, options) {
    var _a;
    if (options === void 0) { options = {}; }
    // header
    checkSignature(reader, '8BPS');
    var version = readUint16(reader);
    if (version !== 1 && version !== 2)
        throw new Error("Invalid PSD file version: " + version);
    skipBytes(reader, 6);
    var channels = readUint16(reader);
    var height = readUint32(reader);
    var width = readUint32(reader);
    var bitsPerChannel = readUint16(reader);
    var colorMode = readUint16(reader);
    if (exports.supportedColorModes.indexOf(colorMode) === -1)
        throw new Error("Color mode not supported: " + ((_a = colorModes[colorMode]) !== null && _a !== void 0 ? _a : colorMode));
    var psd = { width: width, height: height, channels: channels, bitsPerChannel: bitsPerChannel, colorMode: colorMode };
    var opt = __assign(__assign({}, options), { large: version === 2 });
    // color mode data
    readSection(reader, 1, function (left) {
        if (opt.throwForMissingFeatures)
            throw new Error('Color mode data not supported');
        skipBytes(reader, left());
    });
    // image resources
    readSection(reader, 1, function (left) {
        var _loop_1 = function () {
            checkSignature(reader, '8BIM');
            var id = readUint16(reader);
            readPascalString(reader, 2); // name
            readSection(reader, 2, function (left) {
                var handler = imageResources_1.resourceHandlersMap[id];
                var skip = id === 1036 && !!opt.skipThumbnail;
                if (!psd.imageResources) {
                    psd.imageResources = {};
                }
                if (handler && !skip) {
                    try {
                        handler.read(reader, psd.imageResources, left, opt);
                    }
                    catch (e) {
                        if (opt.throwForMissingFeatures)
                            throw e;
                        skipBytes(reader, left());
                    }
                }
                else {
                    // options.logMissingFeatures && console.log(`Unhandled image resource: ${id}`);
                    skipBytes(reader, left());
                }
            });
        };
        while (left()) {
            _loop_1();
        }
    });
    // layer and mask info
    var globalAlpha = false;
    readSection(reader, 1, function (left) {
        globalAlpha = readLayerInfo(reader, psd, opt);
        // SAI does not include this section
        if (left() > 0) {
            var globalLayerMaskInfo = readGlobalLayerMaskInfo(reader);
            if (globalLayerMaskInfo)
                psd.globalLayerMaskInfo = globalLayerMaskInfo;
        }
        else {
            // revert back to end of section if exceeded section limits
            // opt.logMissingFeatures && console.log('reverting to end of section');
            skipBytes(reader, left());
        }
        while (left() > 0) {
            // sometimes there are empty bytes here
            while (left() && peekUint8(reader) === 0) {
                // opt.logMissingFeatures && console.log('skipping 0 byte');
                skipBytes(reader, 1);
            }
            if (left() >= 12) {
                readAdditionalLayerInfo(reader, psd, psd, opt);
            }
            else {
                // opt.logMissingFeatures && console.log('skipping leftover bytes', left());
                skipBytes(reader, left());
            }
        }
    }, undefined, opt.large);
    var hasChildren = psd.children && psd.children.length;
    var skipComposite = opt.skipCompositeImageData && (opt.skipLayerImageData || hasChildren);
    if (!skipComposite) {
        readImageData(reader, psd, globalAlpha, opt);
    }
    return psd;
}
exports.readPsd = readPsd;
function readLayerInfo(reader, psd, options) {
    var globalAlpha = false;
    readSection(reader, 2, function (left) {
        var layerCount = readInt16(reader);
        if (layerCount < 0) {
            globalAlpha = true;
            layerCount = -layerCount;
        }
        var layers = [];
        var layerChannels = [];
        for (var i = 0; i < layerCount; i++) {
            var _a = readLayerRecord(reader, psd, options), layer = _a.layer, channels = _a.channels;
            layers.push(layer);
            layerChannels.push(channels);
        }
        if (!options.skipLayerImageData) {
            for (var i = 0; i < layerCount; i++) {
                readLayerChannelImageData(reader, psd, layers[i], layerChannels[i], options);
            }
        }
        skipBytes(reader, left());
        if (!psd.children)
            psd.children = [];
        var stack = [psd];
        for (var i = layers.length - 1; i >= 0; i--) {
            var l = layers[i];
            var type = l.sectionDivider ? l.sectionDivider.type : 0 /* Other */;
            if (type === 1 /* OpenFolder */ || type === 2 /* ClosedFolder */) {
                l.opened = type === 1 /* OpenFolder */;
                l.children = [];
                stack[stack.length - 1].children.unshift(l);
                stack.push(l);
            }
            else if (type === 3 /* BoundingSectionDivider */) {
                stack.pop();
            }
            else if (l.name === '</Layer group>' && !l.sectionDivider && !l.top && !l.left && !l.bottom && !l.right) {
                // sometimes layer group terminator doesn't have sectionDivider, so we just guess here (PS bug ?)
                stack.pop();
            }
            else {
                stack[stack.length - 1].children.unshift(l);
            }
        }
    }, undefined, options.large);
    return globalAlpha;
}
function readLayerRecord(reader, psd, options) {
    var layer = {};
    layer.top = readInt32(reader);
    layer.left = readInt32(reader);
    layer.bottom = readInt32(reader);
    layer.right = readInt32(reader);
    var channelCount = readUint16(reader);
    var channels = [];
    for (var i = 0; i < channelCount; i++) {
        var channelID = readInt16(reader);
        var channelLength = readUint32(reader);
        if (options.large) {
            if (channelLength !== 0)
                throw new Error('Sizes larger than 4GB are not supported');
            channelLength = readUint32(reader);
        }
        channels.push({ id: channelID, length: channelLength });
    }
    checkSignature(reader, '8BIM');
    var blendMode = readSignature(reader);
    if (!helpers_1.toBlendMode[blendMode])
        throw new Error("Invalid blend mode: '" + blendMode + "'");
    layer.blendMode = helpers_1.toBlendMode[blendMode];
    layer.opacity = readUint8(reader) / 0xff;
    layer.clipping = readUint8(reader) === 1;
    var flags = readUint8(reader);
    layer.transparencyProtected = (flags & 0x01) !== 0;
    layer.hidden = (flags & 0x02) !== 0;
    // 0x04 - obsolete
    // 0x08 - 1 for Photoshop 5.0 and later, tells if bit 4 has useful information
    // 0x10 - pixel data irrelevant to appearance of document
    skipBytes(reader, 1);
    readSection(reader, 1, function (left) {
        var mask = readLayerMaskData(reader, options);
        if (mask)
            layer.mask = mask;
        /*const blendingRanges =*/ readLayerBlendingRanges(reader);
        layer.name = readPascalString(reader, 4);
        while (left()) {
            readAdditionalLayerInfo(reader, layer, psd, options);
        }
    });
    return { layer: layer, channels: channels };
}
function readLayerMaskData(reader, options) {
    return readSection(reader, 1, function (left) {
        if (!left())
            return undefined;
        var mask = {};
        mask.top = readInt32(reader);
        mask.left = readInt32(reader);
        mask.bottom = readInt32(reader);
        mask.right = readInt32(reader);
        mask.defaultColor = readUint8(reader);
        var flags = readUint8(reader);
        mask.positionRelativeToLayer = (flags & 1 /* PositionRelativeToLayer */) !== 0;
        mask.disabled = (flags & 2 /* LayerMaskDisabled */) !== 0;
        mask.fromVectorData = (flags & 8 /* LayerMaskFromRenderingOtherData */) !== 0;
        if (flags & 16 /* MaskHasParametersAppliedToIt */) {
            var params = readUint8(reader);
            if (params & 1 /* UserMaskDensity */)
                mask.userMaskDensity = readUint8(reader) / 0xff;
            if (params & 2 /* UserMaskFeather */)
                mask.userMaskFeather = readFloat64(reader);
            if (params & 4 /* VectorMaskDensity */)
                mask.vectorMaskDensity = readUint8(reader) / 0xff;
            if (params & 8 /* VectorMaskFeather */)
                mask.vectorMaskFeather = readFloat64(reader);
        }
        if (left() > 2) {
            options.logMissingFeatures && console.log('Unhandled extra mask params');
            // TODO: handle these values
            /*const realFlags =*/ readUint8(reader);
            /*const realUserMaskBackground =*/ readUint8(reader);
            /*const top2 =*/ readInt32(reader);
            /*const left2 =*/ readInt32(reader);
            /*const bottom2 =*/ readInt32(reader);
            /*const right2 =*/ readInt32(reader);
        }
        skipBytes(reader, left());
        return mask;
    });
}
function readLayerBlendingRanges(reader) {
    return readSection(reader, 1, function (left) {
        var compositeGrayBlendSource = readUint32(reader);
        var compositeGraphBlendDestinationRange = readUint32(reader);
        var ranges = [];
        while (left()) {
            var sourceRange = readUint32(reader);
            var destRange = readUint32(reader);
            ranges.push({ sourceRange: sourceRange, destRange: destRange });
        }
        return { compositeGrayBlendSource: compositeGrayBlendSource, compositeGraphBlendDestinationRange: compositeGraphBlendDestinationRange, ranges: ranges };
    });
}
function readLayerChannelImageData(reader, psd, layer, channels, options) {
    var layerWidth = (layer.right || 0) - (layer.left || 0);
    var layerHeight = (layer.bottom || 0) - (layer.top || 0);
    var imageData;
    if (layerWidth && layerHeight) {
        imageData = helpers_1.createImageData(layerWidth, layerHeight);
        helpers_1.resetImageData(imageData);
    }
    if (helpers_1.RAW_IMAGE_DATA) {
        layer.imageDataRaw = [];
    }
    for (var _i = 0, channels_1 = channels; _i < channels_1.length; _i++) {
        var channel = channels_1[_i];
        var compression = readUint16(reader);
        if (channel.id === -2 /* UserMask */) {
            var mask = layer.mask;
            if (!mask)
                throw new Error("Missing layer mask data");
            var maskWidth = (mask.right || 0) - (mask.left || 0);
            var maskHeight = (mask.bottom || 0) - (mask.top || 0);
            if (maskWidth && maskHeight) {
                var maskData = helpers_1.createImageData(maskWidth, maskHeight);
                helpers_1.resetImageData(maskData);
                var start = reader.offset;
                readData(reader, maskData, compression, maskWidth, maskHeight, 0, options.large);
                if (helpers_1.RAW_IMAGE_DATA) {
                    layer.maskDataRaw = new Uint8Array(reader.view.buffer, reader.view.byteOffset + start, reader.offset - start);
                }
                setupGrayscale(maskData);
                if (options.useImageData) {
                    mask.imageData = maskData;
                }
                else {
                    mask.canvas = helpers_1.createCanvas(maskWidth, maskHeight);
                    mask.canvas.getContext('2d').putImageData(maskData, 0, 0);
                }
            }
        }
        else {
            var offset = helpers_1.offsetForChannel(channel.id);
            var targetData = imageData;
            if (offset < 0) {
                targetData = undefined;
                if (options.throwForMissingFeatures) {
                    throw new Error("Channel not supported: " + channel.id);
                }
            }
            var start = reader.offset;
            readData(reader, targetData, compression, layerWidth, layerHeight, offset, options.large);
            if (helpers_1.RAW_IMAGE_DATA) {
                layer.imageDataRaw[channel.id] = new Uint8Array(reader.view.buffer, reader.view.byteOffset + start, reader.offset - start);
            }
            if (targetData && psd.colorMode === 1 /* Grayscale */) {
                setupGrayscale(targetData);
            }
        }
    }
    if (imageData) {
        if (options.useImageData) {
            layer.imageData = imageData;
        }
        else {
            layer.canvas = helpers_1.createCanvas(layerWidth, layerHeight);
            layer.canvas.getContext('2d').putImageData(imageData, 0, 0);
        }
    }
}
function readData(reader, data, compression, width, height, offset, large) {
    if (compression === 0 /* RawData */) {
        readDataRaw(reader, data, offset, width, height);
    }
    else if (compression === 1 /* RleCompressed */) {
        readDataRLE(reader, data, width, height, 4, [offset], large);
    }
    else {
        throw new Error("Compression type not supported: " + compression);
    }
}
function readGlobalLayerMaskInfo(reader) {
    return readSection(reader, 1, function (left) {
        if (!left())
            return undefined;
        var overlayColorSpace = readUint16(reader);
        var colorSpace1 = readUint16(reader);
        var colorSpace2 = readUint16(reader);
        var colorSpace3 = readUint16(reader);
        var colorSpace4 = readUint16(reader);
        var opacity = readUint16(reader) / 0xff;
        var kind = readUint8(reader);
        skipBytes(reader, left()); // 3 bytes of padding ?
        return { overlayColorSpace: overlayColorSpace, colorSpace1: colorSpace1, colorSpace2: colorSpace2, colorSpace3: colorSpace3, colorSpace4: colorSpace4, opacity: opacity, kind: kind };
    });
}
function readAdditionalLayerInfo(reader, target, psd, options) {
    var sig = readSignature(reader);
    if (sig !== '8BIM' && sig !== '8B64')
        throw new Error("Invalid signature: '" + sig + "' at 0x" + (reader.offset - 4).toString(16));
    var key = readSignature(reader);
    // `largeAdditionalInfoKeys` fallback, because some keys don't have 8B64 signature even when they are 64bit
    var u64 = sig === '8B64' || (options.large && helpers_1.largeAdditionalInfoKeys.indexOf(key) !== -1);
    readSection(reader, 2, function (left) {
        var handler = additionalInfo_1.infoHandlersMap[key];
        if (handler) {
            try {
                handler.read(reader, target, left, psd, options);
            }
            catch (e) {
                if (options.throwForMissingFeatures)
                    throw e;
            }
        }
        else {
            options.logMissingFeatures && console.log("Unhandled additional info: " + key);
            skipBytes(reader, left());
        }
        if (left()) {
            options.logMissingFeatures && console.log("Unread " + left() + " bytes left for tag: " + key);
            skipBytes(reader, left());
        }
    }, false, u64);
}
function readImageData(reader, psd, globalAlpha, options) {
    var compression = readUint16(reader);
    if (exports.supportedColorModes.indexOf(psd.colorMode) === -1)
        throw new Error("Color mode not supported: " + psd.colorMode);
    if (compression !== 0 /* RawData */ && compression !== 1 /* RleCompressed */)
        throw new Error("Compression type not supported: " + compression);
    var imageData = helpers_1.createImageData(psd.width, psd.height);
    helpers_1.resetImageData(imageData);
    if (psd.colorMode === 0 /* Bitmap */) {
        var bytes = void 0;
        if (compression === 0 /* RawData */) {
            bytes = readBytes(reader, Math.ceil(psd.width / 8) * psd.height);
        }
        else if (compression === 1 /* RleCompressed */) {
            bytes = new Uint8Array(psd.width * psd.height);
            readDataRLE(reader, { data: bytes, width: psd.width, height: psd.height }, psd.width, psd.height, 1, [0], options.large);
        }
        else {
            throw new Error("Bitmap compression not supported: " + compression);
        }
        helpers_1.decodeBitmap(bytes, imageData.data, psd.width, psd.height);
    }
    else {
        var channels = psd.colorMode === 1 /* Grayscale */ ? [0] : [0, 1, 2];
        if (psd.channels && psd.channels > 3) {
            for (var i = 3; i < psd.channels; i++) {
                // TODO: store these channels in additional image data
                channels.push(i);
            }
        }
        else if (globalAlpha) {
            channels.push(3);
        }
        if (compression === 0 /* RawData */) {
            for (var i = 0; i < channels.length; i++) {
                readDataRaw(reader, imageData, channels[i], psd.width, psd.height);
            }
        }
        else if (compression === 1 /* RleCompressed */) {
            var start = reader.offset;
            readDataRLE(reader, imageData, psd.width, psd.height, 4, channels, options.large);
            if (helpers_1.RAW_IMAGE_DATA) {
                psd.imageDataRaw = new Uint8Array(reader.view.buffer, reader.view.byteOffset + start, reader.offset - start);
            }
        }
        if (psd.colorMode === 1 /* Grayscale */) {
            setupGrayscale(imageData);
        }
    }
    if (options.useImageData) {
        psd.imageData = imageData;
    }
    else {
        psd.canvas = helpers_1.createCanvas(psd.width, psd.height);
        psd.canvas.getContext('2d').putImageData(imageData, 0, 0);
    }
}
function readDataRaw(reader, pixelData, offset, width, height) {
    var size = width * height;
    var buffer = readBytes(reader, size);
    if (pixelData && offset < 4) {
        var data = pixelData.data;
        for (var i = 0, p = offset | 0; i < size; i++, p = (p + 4) | 0) {
            data[p] = buffer[i];
        }
    }
}
function readDataRLE(reader, pixelData, _width, height, step, offsets, large) {
    var data = pixelData && pixelData.data;
    var lengths;
    if (large) {
        lengths = new Uint32Array(offsets.length * height);
        for (var o = 0, li = 0; o < offsets.length; o++) {
            for (var y = 0; y < height; y++, li++) {
                lengths[li] = readUint32(reader);
            }
        }
    }
    else {
        lengths = new Uint16Array(offsets.length * height);
        for (var o = 0, li = 0; o < offsets.length; o++) {
            for (var y = 0; y < height; y++, li++) {
                lengths[li] = readUint16(reader);
            }
        }
    }
    for (var c = 0, li = 0; c < offsets.length; c++) {
        var offset = offsets[c] | 0;
        var extra = c > 3 || offset > 3;
        if (!data || extra) {
            for (var y = 0; y < height; y++, li++) {
                skipBytes(reader, lengths[li]);
            }
        }
        else {
            for (var y = 0, p = offset | 0; y < height; y++, li++) {
                var length_1 = lengths[li];
                var buffer = readBytes(reader, length_1);
                for (var i = 0; i < length_1; i++) {
                    var header = buffer[i];
                    if (header > 128) {
                        var value = buffer[++i];
                        header = (256 - header) | 0;
                        for (var j = 0; j <= header; j = (j + 1) | 0) {
                            data[p] = value;
                            p = (p + step) | 0;
                        }
                    }
                    else if (header < 128) {
                        for (var j = 0; j <= header; j = (j + 1) | 0) {
                            data[p] = buffer[++i];
                            p = (p + step) | 0;
                        }
                    }
                    else {
                        // ignore 128
                    }
                    if (i >= length_1) {
                        throw new Error("Invalid RLE data: exceeded buffer size " + i + "/" + length_1);
                    }
                }
            }
        }
    }
}
exports.readDataRLE = readDataRLE;
function readSection(reader, round, func, skipEmpty, eightBytes) {
    if (skipEmpty === void 0) { skipEmpty = true; }
    if (eightBytes === void 0) { eightBytes = false; }
    var length = readUint32(reader);
    if (eightBytes) {
        if (length !== 0)
            throw new Error('Sizes larger than 4GB are not supported');
        length = readUint32(reader);
    }
    if (length <= 0 && skipEmpty)
        return undefined;
    var end = reader.offset + length;
    var result = func(function () { return end - reader.offset; });
    // if (reader.offset > end)
    // 	throw new Error('Exceeded section limits');
    // if (reader.offset !== end)
    // 	throw new Error(`Unread section data: ${end - reader.offset} bytes at 0x${reader.offset.toString(16)}`);
    while (end % round)
        end++;
    reader.offset = end;
    return result;
}
exports.readSection = readSection;
function readColor(reader) {
    var colorSpace = readUint16(reader);
    switch (colorSpace) {
        case 0 /* RGB */: {
            var r = readUint16(reader) / 257;
            var g = readUint16(reader) / 257;
            var b = readUint16(reader) / 257;
            skipBytes(reader, 2);
            return { r: r, g: g, b: b };
        }
        case 1 /* HSB */: {
            var h = readUint16(reader) / 0xffff;
            var s = readUint16(reader) / 0xffff;
            var b = readUint16(reader) / 0xffff;
            skipBytes(reader, 2);
            return { h: h, s: s, b: b };
        }
        case 2 /* CMYK */: {
            var c = readUint16(reader) / 257;
            var m = readUint16(reader) / 257;
            var y = readUint16(reader) / 257;
            var k = readUint16(reader) / 257;
            return { c: c, m: m, y: y, k: k };
        }
        case 7 /* Lab */: {
            var l = readInt16(reader) / 10000;
            var ta = readInt16(reader);
            var tb = readInt16(reader);
            var a = ta < 0 ? (ta / 12800) : (ta / 12700);
            var b = tb < 0 ? (tb / 12800) : (tb / 12700);
            skipBytes(reader, 2);
            return { l: l, a: a, b: b };
        }
        case 8 /* Grayscale */: {
            var k = readUint16(reader) * 255 / 10000;
            skipBytes(reader, 6);
            return { k: k };
        }
        default:
            throw new Error('Invalid color space');
    }
}
exports.readColor = readColor;
function readPattern(reader) {
    readUint32(reader); // length
    var version = readUint32(reader);
    if (version !== 1)
        throw new Error("Invalid pattern version: " + version);
    var colorMode = readUint32(reader);
    var x = readInt16(reader);
    var y = readInt16(reader);
    // we only support RGB and grayscale for now
    if (colorMode !== 3 /* RGB */ && colorMode !== 1 /* Grayscale */)
        throw new Error('Unsupported pattern color mode');
    var name = readUnicodeString(reader);
    var id = readPascalString(reader, 1);
    // TODO: index color table here (only for indexed color mode, not supported right now)
    // virtual memory array list
    var version2 = readUint32(reader);
    if (version2 !== 3)
        throw new Error("Invalid pattern VMAL version: " + version2);
    readUint32(reader); // length
    var top = readUint32(reader);
    var left = readUint32(reader);
    var bottom = readUint32(reader);
    var right = readUint32(reader);
    var channelsCount = readUint32(reader);
    var width = right - left;
    var height = bottom - top;
    var data = new Uint8Array(width * height * 4);
    for (var i = 3; i < data.byteLength; i += 4) {
        data[i] = 255;
    }
    for (var i = 0, ch = 0; i < (channelsCount + 2); i++) {
        var has = readUint32(reader);
        if (has) {
            var length_2 = readUint32(reader);
            var pixelDepth = readUint32(reader);
            var ctop = readUint32(reader);
            var cleft = readUint32(reader);
            var cbottom = readUint32(reader);
            var cright = readUint32(reader);
            var pixelDepth2 = readUint16(reader);
            var compressionMode = readUint8(reader); // 0 - raw, 1 - zip
            var dataLength = length_2 - (4 + 16 + 2 + 1);
            var cdata = readBytes(reader, dataLength);
            if (pixelDepth !== 8 || pixelDepth2 !== 8)
                throw new Error('16bit pixel depth not supported for palettes');
            var w = cright - cleft;
            var h = cbottom - ctop;
            var ox = cleft - left;
            var oy = ctop - top;
            if (compressionMode === 0) {
                if (colorMode === 3 /* RGB */ && ch < 3) {
                    for (var y_1 = 0; y_1 < h; y_1++) {
                        for (var x_1 = 0; x_1 < w; x_1++) {
                            var src = x_1 + y_1 * w;
                            var dst = (ox + x_1 + (y_1 + oy) * width) * 4;
                            data[dst + ch] = cdata[src];
                        }
                    }
                }
                if (colorMode === 1 /* Grayscale */ && ch < 1) {
                    for (var y_2 = 0; y_2 < h; y_2++) {
                        for (var x_2 = 0; x_2 < w; x_2++) {
                            var src = x_2 + y_2 * w;
                            var dst = (ox + x_2 + (y_2 + oy) * width) * 4;
                            var value = cdata[src];
                            data[dst + 0] = value;
                            data[dst + 1] = value;
                            data[dst + 2] = value;
                        }
                    }
                }
            }
            else if (compressionMode === 1) {
                throw new Error('Unsupported palette compression mode');
                // console.log({ colorMode });
                // require('fs').writeFileSync('zip.bin', Buffer.from(cdata));
                // const data = zlib.inflateRawSync(cdata);
                // console.log(data);
                // throw new Error('Zip compression not supported for palettes');
            }
            else {
                throw new Error('Invalid palette compression mode');
            }
            ch++;
        }
    }
    // TODO: use canvas instead of data ?
    return { id: id, name: name, x: x, y: y, bounds: { x: left, y: top, w: width, h: height }, data: data };
}
exports.readPattern = readPattern;

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInBzZFJlYWRlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7OztBQUtBLHFDQUdtQjtBQUNuQixtREFBbUQ7QUFDbkQsbURBQXVEO0FBVzFDLFFBQUEsbUJBQW1CLEdBQUcsZ0RBQXNELENBQUM7QUFDMUYsSUFBTSxVQUFVLEdBQUcsQ0FBQyxRQUFRLEVBQUUsV0FBVyxFQUFFLFNBQVMsRUFBRSxLQUFLLEVBQUUsTUFBTSxFQUFFLGNBQWMsRUFBRSxTQUFTLEVBQUUsS0FBSyxDQUFDLENBQUM7QUFFdkcsU0FBUyxjQUFjLENBQUMsSUFBZTtJQUN0QyxJQUFNLElBQUksR0FBRyxJQUFJLENBQUMsS0FBSyxHQUFHLElBQUksQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDO0lBRTFDLEtBQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxJQUFJLEVBQUUsQ0FBQyxJQUFJLENBQUMsRUFBRTtRQUNqQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQ2hDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUM7S0FDaEM7QUFDRixDQUFDO0FBT0QsU0FBZ0IsWUFBWSxDQUFDLE1BQW1CLEVBQUUsTUFBZSxFQUFFLE1BQWU7SUFDakYsSUFBTSxJQUFJLEdBQUcsSUFBSSxRQUFRLENBQUMsTUFBTSxFQUFFLE1BQU0sRUFBRSxNQUFNLENBQUMsQ0FBQztJQUNsRCxPQUFPLEVBQUUsSUFBSSxNQUFBLEVBQUUsTUFBTSxFQUFFLENBQUMsRUFBRSxDQUFDO0FBQzVCLENBQUM7QUFIRCxvQ0FHQztBQUVELFNBQWdCLFNBQVMsQ0FBQyxNQUFpQjtJQUMxQyxNQUFNLENBQUMsTUFBTSxJQUFJLENBQUMsQ0FBQztJQUNuQixPQUFPLE1BQU0sQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLE1BQU0sQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDLENBQUM7QUFDaEQsQ0FBQztBQUhELDhCQUdDO0FBRUQsU0FBZ0IsU0FBUyxDQUFDLE1BQWlCO0lBQzFDLE9BQU8sTUFBTSxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBQyxDQUFDO0FBQzVDLENBQUM7QUFGRCw4QkFFQztBQUVELFNBQWdCLFNBQVMsQ0FBQyxNQUFpQjtJQUMxQyxNQUFNLENBQUMsTUFBTSxJQUFJLENBQUMsQ0FBQztJQUNuQixPQUFPLE1BQU0sQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLE1BQU0sQ0FBQyxNQUFNLEdBQUcsQ0FBQyxFQUFFLEtBQUssQ0FBQyxDQUFDO0FBQ3ZELENBQUM7QUFIRCw4QkFHQztBQUVELFNBQWdCLFVBQVUsQ0FBQyxNQUFpQjtJQUMzQyxNQUFNLENBQUMsTUFBTSxJQUFJLENBQUMsQ0FBQztJQUNuQixPQUFPLE1BQU0sQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLE1BQU0sQ0FBQyxNQUFNLEdBQUcsQ0FBQyxFQUFFLEtBQUssQ0FBQyxDQUFDO0FBQ3hELENBQUM7QUFIRCxnQ0FHQztBQUVELFNBQWdCLFNBQVMsQ0FBQyxNQUFpQjtJQUMxQyxNQUFNLENBQUMsTUFBTSxJQUFJLENBQUMsQ0FBQztJQUNuQixPQUFPLE1BQU0sQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLE1BQU0sQ0FBQyxNQUFNLEdBQUcsQ0FBQyxFQUFFLEtBQUssQ0FBQyxDQUFDO0FBQ3ZELENBQUM7QUFIRCw4QkFHQztBQUVELFNBQWdCLFdBQVcsQ0FBQyxNQUFpQjtJQUM1QyxNQUFNLENBQUMsTUFBTSxJQUFJLENBQUMsQ0FBQztJQUNuQixPQUFPLE1BQU0sQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLE1BQU0sQ0FBQyxNQUFNLEdBQUcsQ0FBQyxFQUFFLElBQUksQ0FBQyxDQUFDO0FBQ3RELENBQUM7QUFIRCxrQ0FHQztBQUVELFNBQWdCLFVBQVUsQ0FBQyxNQUFpQjtJQUMzQyxNQUFNLENBQUMsTUFBTSxJQUFJLENBQUMsQ0FBQztJQUNuQixPQUFPLE1BQU0sQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLE1BQU0sQ0FBQyxNQUFNLEdBQUcsQ0FBQyxFQUFFLEtBQUssQ0FBQyxDQUFDO0FBQ3hELENBQUM7QUFIRCxnQ0FHQztBQUVELFNBQWdCLFdBQVcsQ0FBQyxNQUFpQjtJQUM1QyxNQUFNLENBQUMsTUFBTSxJQUFJLENBQUMsQ0FBQztJQUNuQixPQUFPLE1BQU0sQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDLE1BQU0sQ0FBQyxNQUFNLEdBQUcsQ0FBQyxFQUFFLEtBQUssQ0FBQyxDQUFDO0FBQ3pELENBQUM7QUFIRCxrQ0FHQztBQUVELFNBQWdCLFdBQVcsQ0FBQyxNQUFpQjtJQUM1QyxNQUFNLENBQUMsTUFBTSxJQUFJLENBQUMsQ0FBQztJQUNuQixPQUFPLE1BQU0sQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDLE1BQU0sQ0FBQyxNQUFNLEdBQUcsQ0FBQyxFQUFFLEtBQUssQ0FBQyxDQUFDO0FBQ3pELENBQUM7QUFIRCxrQ0FHQztBQUVELGtDQUFrQztBQUNsQyxTQUFnQixnQkFBZ0IsQ0FBQyxNQUFpQjtJQUNqRCxPQUFPLFNBQVMsQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUMsSUFBSSxFQUFFLENBQUMsQ0FBQztBQUN0QyxDQUFDO0FBRkQsNENBRUM7QUFFRCxpQ0FBaUM7QUFDakMsU0FBZ0Isb0JBQW9CLENBQUMsTUFBaUI7SUFDckQsT0FBTyxTQUFTLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDLElBQUksRUFBRSxDQUFDLENBQUM7QUFDdEMsQ0FBQztBQUZELG9EQUVDO0FBRUQsU0FBZ0IsU0FBUyxDQUFDLE1BQWlCLEVBQUUsTUFBYztJQUMxRCxNQUFNLENBQUMsTUFBTSxJQUFJLE1BQU0sQ0FBQztJQUN4QixPQUFPLElBQUksVUFBVSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsTUFBTSxFQUFFLE1BQU0sQ0FBQyxJQUFJLENBQUMsVUFBVSxHQUFHLE1BQU0sQ0FBQyxNQUFNLEdBQUcsTUFBTSxFQUFFLE1BQU0sQ0FBQyxDQUFDO0FBQ3BHLENBQUM7QUFIRCw4QkFHQztBQUVELFNBQWdCLGFBQWEsQ0FBQyxNQUFpQjtJQUM5QyxPQUFPLGVBQWUsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxDQUFDLENBQUM7QUFDbkMsQ0FBQztBQUZELHNDQUVDO0FBRUQsU0FBZ0IsZ0JBQWdCLENBQUMsTUFBaUIsRUFBRSxLQUFhO0lBQ2hFLElBQUksTUFBTSxHQUFHLFNBQVMsQ0FBQyxNQUFNLENBQUMsQ0FBQztJQUMvQixJQUFNLElBQUksR0FBRyxlQUFlLENBQUMsTUFBTSxFQUFFLE1BQU0sQ0FBQyxDQUFDO0lBRTdDLE9BQU8sRUFBRSxNQUFNLEdBQUcsS0FBSyxFQUFFO1FBQ3hCLFNBQVMsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxDQUFDLENBQUM7S0FDckI7SUFFRCxPQUFPLElBQUksQ0FBQztBQUNiLENBQUM7QUFURCw0Q0FTQztBQUVELFNBQWdCLGlCQUFpQixDQUFDLE1BQWlCO0lBQ2xELElBQU0sTUFBTSxHQUFHLFVBQVUsQ0FBQyxNQUFNLENBQUMsQ0FBQztJQUNsQyxPQUFPLDJCQUEyQixDQUFDLE1BQU0sRUFBRSxNQUFNLENBQUMsQ0FBQztBQUNwRCxDQUFDO0FBSEQsOENBR0M7QUFFRCxTQUFnQiwyQkFBMkIsQ0FBQyxNQUFpQixFQUFFLE1BQWM7SUFDNUUsSUFBSSxJQUFJLEdBQUcsRUFBRSxDQUFDO0lBRWQsT0FBTyxNQUFNLEVBQUUsRUFBRTtRQUNoQixJQUFNLEtBQUssR0FBRyxVQUFVLENBQUMsTUFBTSxDQUFDLENBQUM7UUFFakMsSUFBSSxLQUFLLElBQUksTUFBTSxHQUFHLENBQUMsRUFBRSxFQUFFLHFCQUFxQjtZQUMvQyxJQUFJLElBQUksTUFBTSxDQUFDLFlBQVksQ0FBQyxLQUFLLENBQUMsQ0FBQztTQUNuQztLQUNEO0lBRUQsT0FBTyxJQUFJLENBQUM7QUFDYixDQUFDO0FBWkQsa0VBWUM7QUFFRCxTQUFnQixlQUFlLENBQUMsTUFBaUIsRUFBRSxNQUFjO0lBQ2hFLElBQUksSUFBSSxHQUFHLEVBQUUsQ0FBQztJQUVkLE9BQU8sTUFBTSxFQUFFLEVBQUU7UUFDaEIsSUFBSSxJQUFJLE1BQU0sQ0FBQyxZQUFZLENBQUMsU0FBUyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUM7S0FDL0M7SUFFRCxPQUFPLElBQUksQ0FBQztBQUNiLENBQUM7QUFSRCwwQ0FRQztBQUVELFNBQWdCLFNBQVMsQ0FBQyxNQUFpQixFQUFFLEtBQWE7SUFDekQsTUFBTSxDQUFDLE1BQU0sSUFBSSxLQUFLLENBQUM7QUFDeEIsQ0FBQztBQUZELDhCQUVDO0FBRUQsU0FBZ0IsY0FBYyxDQUFDLE1BQWlCLEVBQUUsQ0FBUyxFQUFFLENBQVU7SUFDdEUsSUFBTSxNQUFNLEdBQUcsTUFBTSxDQUFDLE1BQU0sQ0FBQztJQUM3QixJQUFNLFNBQVMsR0FBRyxhQUFhLENBQUMsTUFBTSxDQUFDLENBQUM7SUFFeEMsSUFBSSxTQUFTLEtBQUssQ0FBQyxJQUFJLFNBQVMsS0FBSyxDQUFDLEVBQUU7UUFDdkMsTUFBTSxJQUFJLEtBQUssQ0FBQyx5QkFBdUIsU0FBUyxlQUFVLE1BQU0sQ0FBQyxRQUFRLENBQUMsRUFBRSxDQUFHLENBQUMsQ0FBQztLQUNqRjtBQUNGLENBQUM7QUFQRCx3Q0FPQztBQUVELFNBQVMsZUFBZSxDQUFDLE1BQWlCLEVBQUUsTUFBYztJQUN6RCxJQUFNLE1BQU0sR0FBUSxTQUFTLENBQUMsTUFBTSxFQUFFLE1BQU0sQ0FBQyxDQUFDO0lBQzlDLE9BQU8sTUFBTSxDQUFDLFlBQVksT0FBbkIsTUFBTSxFQUFpQixNQUFNLEVBQUU7QUFDdkMsQ0FBQztBQUVELFNBQWdCLE9BQU8sQ0FBQyxNQUFpQixFQUFFLE9BQXlCOztJQUF6Qix3QkFBQSxFQUFBLFlBQXlCO0lBQ25FLFNBQVM7SUFDVCxjQUFjLENBQUMsTUFBTSxFQUFFLE1BQU0sQ0FBQyxDQUFDO0lBQy9CLElBQU0sT0FBTyxHQUFHLFVBQVUsQ0FBQyxNQUFNLENBQUMsQ0FBQztJQUNuQyxJQUFJLE9BQU8sS0FBSyxDQUFDLElBQUksT0FBTyxLQUFLLENBQUM7UUFBRSxNQUFNLElBQUksS0FBSyxDQUFDLCtCQUE2QixPQUFTLENBQUMsQ0FBQztJQUU1RixTQUFTLENBQUMsTUFBTSxFQUFFLENBQUMsQ0FBQyxDQUFDO0lBQ3JCLElBQU0sUUFBUSxHQUFHLFVBQVUsQ0FBQyxNQUFNLENBQUMsQ0FBQztJQUNwQyxJQUFNLE1BQU0sR0FBRyxVQUFVLENBQUMsTUFBTSxDQUFDLENBQUM7SUFDbEMsSUFBTSxLQUFLLEdBQUcsVUFBVSxDQUFDLE1BQU0sQ0FBQyxDQUFDO0lBQ2pDLElBQU0sY0FBYyxHQUFHLFVBQVUsQ0FBQyxNQUFNLENBQUMsQ0FBQztJQUMxQyxJQUFNLFNBQVMsR0FBRyxVQUFVLENBQUMsTUFBTSxDQUFDLENBQUM7SUFFckMsSUFBSSwyQkFBbUIsQ0FBQyxPQUFPLENBQUMsU0FBUyxDQUFDLEtBQUssQ0FBQyxDQUFDO1FBQ2hELE1BQU0sSUFBSSxLQUFLLENBQUMsZ0NBQTZCLE1BQUEsVUFBVSxDQUFDLFNBQVMsQ0FBQyxtQ0FBSSxTQUFTLENBQUUsQ0FBQyxDQUFDO0lBRXBGLElBQU0sR0FBRyxHQUFRLEVBQUUsS0FBSyxPQUFBLEVBQUUsTUFBTSxRQUFBLEVBQUUsUUFBUSxVQUFBLEVBQUUsY0FBYyxnQkFBQSxFQUFFLFNBQVMsV0FBQSxFQUFFLENBQUM7SUFDeEUsSUFBTSxHQUFHLHlCQUF3QixPQUFPLEtBQUUsS0FBSyxFQUFFLE9BQU8sS0FBSyxDQUFDLEdBQUUsQ0FBQztJQUVqRSxrQkFBa0I7SUFDbEIsV0FBVyxDQUFDLE1BQU0sRUFBRSxDQUFDLEVBQUUsVUFBQSxJQUFJO1FBQzFCLElBQUksR0FBRyxDQUFDLHVCQUF1QjtZQUFFLE1BQU0sSUFBSSxLQUFLLENBQUMsK0JBQStCLENBQUMsQ0FBQztRQUNsRixTQUFTLENBQUMsTUFBTSxFQUFFLElBQUksRUFBRSxDQUFDLENBQUM7SUFDM0IsQ0FBQyxDQUFDLENBQUM7SUFFSCxrQkFBa0I7SUFDbEIsV0FBVyxDQUFDLE1BQU0sRUFBRSxDQUFDLEVBQUUsVUFBQSxJQUFJOztZQUV6QixjQUFjLENBQUMsTUFBTSxFQUFFLE1BQU0sQ0FBQyxDQUFDO1lBRS9CLElBQU0sRUFBRSxHQUFHLFVBQVUsQ0FBQyxNQUFNLENBQUMsQ0FBQztZQUM5QixnQkFBZ0IsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxPQUFPO1lBRXBDLFdBQVcsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxFQUFFLFVBQUEsSUFBSTtnQkFDMUIsSUFBTSxPQUFPLEdBQUcsb0NBQW1CLENBQUMsRUFBRSxDQUFDLENBQUM7Z0JBQ3hDLElBQU0sSUFBSSxHQUFHLEVBQUUsS0FBSyxJQUFJLElBQUksQ0FBQyxDQUFDLEdBQUcsQ0FBQyxhQUFhLENBQUM7Z0JBRWhELElBQUksQ0FBQyxHQUFHLENBQUMsY0FBYyxFQUFFO29CQUN4QixHQUFHLENBQUMsY0FBYyxHQUFHLEVBQUUsQ0FBQztpQkFDeEI7Z0JBRUQsSUFBSSxPQUFPLElBQUksQ0FBQyxJQUFJLEVBQUU7b0JBQ3JCLElBQUk7d0JBQ0gsT0FBTyxDQUFDLElBQUksQ0FBQyxNQUFNLEVBQUUsR0FBRyxDQUFDLGNBQWMsRUFBRSxJQUFJLEVBQUUsR0FBRyxDQUFDLENBQUM7cUJBQ3BEO29CQUFDLE9BQU8sQ0FBQyxFQUFFO3dCQUNYLElBQUksR0FBRyxDQUFDLHVCQUF1Qjs0QkFBRSxNQUFNLENBQUMsQ0FBQzt3QkFDekMsU0FBUyxDQUFDLE1BQU0sRUFBRSxJQUFJLEVBQUUsQ0FBQyxDQUFDO3FCQUMxQjtpQkFDRDtxQkFBTTtvQkFDTixnRkFBZ0Y7b0JBQ2hGLFNBQVMsQ0FBQyxNQUFNLEVBQUUsSUFBSSxFQUFFLENBQUMsQ0FBQztpQkFDMUI7WUFDRixDQUFDLENBQUMsQ0FBQzs7UUF6QkosT0FBTyxJQUFJLEVBQUU7O1NBMEJaO0lBQ0YsQ0FBQyxDQUFDLENBQUM7SUFFSCxzQkFBc0I7SUFDdEIsSUFBSSxXQUFXLEdBQUcsS0FBSyxDQUFDO0lBRXhCLFdBQVcsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxFQUFFLFVBQUEsSUFBSTtRQUMxQixXQUFXLEdBQUcsYUFBYSxDQUFDLE1BQU0sRUFBRSxHQUFHLEVBQUUsR0FBRyxDQUFDLENBQUM7UUFFOUMsb0NBQW9DO1FBQ3BDLElBQUksSUFBSSxFQUFFLEdBQUcsQ0FBQyxFQUFFO1lBQ2YsSUFBTSxtQkFBbUIsR0FBRyx1QkFBdUIsQ0FBQyxNQUFNLENBQUMsQ0FBQztZQUM1RCxJQUFJLG1CQUFtQjtnQkFBRSxHQUFHLENBQUMsbUJBQW1CLEdBQUcsbUJBQW1CLENBQUM7U0FDdkU7YUFBTTtZQUNOLDJEQUEyRDtZQUMzRCx3RUFBd0U7WUFDeEUsU0FBUyxDQUFDLE1BQU0sRUFBRSxJQUFJLEVBQUUsQ0FBQyxDQUFDO1NBQzFCO1FBRUQsT0FBTyxJQUFJLEVBQUUsR0FBRyxDQUFDLEVBQUU7WUFDbEIsdUNBQXVDO1lBQ3ZDLE9BQU8sSUFBSSxFQUFFLElBQUksU0FBUyxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsRUFBRTtnQkFDekMsNERBQTREO2dCQUM1RCxTQUFTLENBQUMsTUFBTSxFQUFFLENBQUMsQ0FBQyxDQUFDO2FBQ3JCO1lBRUQsSUFBSSxJQUFJLEVBQUUsSUFBSSxFQUFFLEVBQUU7Z0JBQ2pCLHVCQUF1QixDQUFDLE1BQU0sRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsQ0FBQyxDQUFDO2FBQy9DO2lCQUFNO2dCQUNOLDRFQUE0RTtnQkFDNUUsU0FBUyxDQUFDLE1BQU0sRUFBRSxJQUFJLEVBQUUsQ0FBQyxDQUFDO2FBQzFCO1NBQ0Q7SUFDRixDQUFDLEVBQUUsU0FBUyxFQUFFLEdBQUcsQ0FBQyxLQUFLLENBQUMsQ0FBQztJQUV6QixJQUFNLFdBQVcsR0FBRyxHQUFHLENBQUMsUUFBUSxJQUFJLEdBQUcsQ0FBQyxRQUFRLENBQUMsTUFBTSxDQUFDO0lBQ3hELElBQU0sYUFBYSxHQUFHLEdBQUcsQ0FBQyxzQkFBc0IsSUFBSSxDQUFDLEdBQUcsQ0FBQyxrQkFBa0IsSUFBSSxXQUFXLENBQUMsQ0FBQztJQUU1RixJQUFJLENBQUMsYUFBYSxFQUFFO1FBQ25CLGFBQWEsQ0FBQyxNQUFNLEVBQUUsR0FBRyxFQUFFLFdBQVcsRUFBRSxHQUFHLENBQUMsQ0FBQztLQUM3QztJQUVELE9BQU8sR0FBRyxDQUFDO0FBQ1osQ0FBQztBQWhHRCwwQkFnR0M7QUFFRCxTQUFTLGFBQWEsQ0FBQyxNQUFpQixFQUFFLEdBQVEsRUFBRSxPQUF1QjtJQUMxRSxJQUFJLFdBQVcsR0FBRyxLQUFLLENBQUM7SUFFeEIsV0FBVyxDQUFDLE1BQU0sRUFBRSxDQUFDLEVBQUUsVUFBQSxJQUFJO1FBQzFCLElBQUksVUFBVSxHQUFHLFNBQVMsQ0FBQyxNQUFNLENBQUMsQ0FBQztRQUVuQyxJQUFJLFVBQVUsR0FBRyxDQUFDLEVBQUU7WUFDbkIsV0FBVyxHQUFHLElBQUksQ0FBQztZQUNuQixVQUFVLEdBQUcsQ0FBQyxVQUFVLENBQUM7U0FDekI7UUFFRCxJQUFNLE1BQU0sR0FBWSxFQUFFLENBQUM7UUFDM0IsSUFBTSxhQUFhLEdBQW9CLEVBQUUsQ0FBQztRQUUxQyxLQUFLLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsVUFBVSxFQUFFLENBQUMsRUFBRSxFQUFFO1lBQzlCLElBQUEsS0FBc0IsZUFBZSxDQUFDLE1BQU0sRUFBRSxHQUFHLEVBQUUsT0FBTyxDQUFDLEVBQXpELEtBQUssV0FBQSxFQUFFLFFBQVEsY0FBMEMsQ0FBQztZQUNsRSxNQUFNLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDO1lBQ25CLGFBQWEsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUM7U0FDN0I7UUFFRCxJQUFJLENBQUMsT0FBTyxDQUFDLGtCQUFrQixFQUFFO1lBQ2hDLEtBQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxVQUFVLEVBQUUsQ0FBQyxFQUFFLEVBQUU7Z0JBQ3BDLHlCQUF5QixDQUFDLE1BQU0sRUFBRSxHQUFHLEVBQUUsTUFBTSxDQUFDLENBQUMsQ0FBQyxFQUFFLGFBQWEsQ0FBQyxDQUFDLENBQUMsRUFBRSxPQUFPLENBQUMsQ0FBQzthQUM3RTtTQUNEO1FBRUQsU0FBUyxDQUFDLE1BQU0sRUFBRSxJQUFJLEVBQUUsQ0FBQyxDQUFDO1FBRTFCLElBQUksQ0FBQyxHQUFHLENBQUMsUUFBUTtZQUFFLEdBQUcsQ0FBQyxRQUFRLEdBQUcsRUFBRSxDQUFDO1FBRXJDLElBQU0sS0FBSyxHQUFvQixDQUFDLEdBQUcsQ0FBQyxDQUFDO1FBRXJDLEtBQUssSUFBSSxDQUFDLEdBQUcsTUFBTSxDQUFDLE1BQU0sR0FBRyxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLEVBQUUsRUFBRTtZQUM1QyxJQUFNLENBQUMsR0FBRyxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDcEIsSUFBTSxJQUFJLEdBQUcsQ0FBQyxDQUFDLGNBQWMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLGNBQWMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxjQUF5QixDQUFDO1lBRWpGLElBQUksSUFBSSx1QkFBa0MsSUFBSSxJQUFJLHlCQUFvQyxFQUFFO2dCQUN2RixDQUFDLENBQUMsTUFBTSxHQUFHLElBQUksdUJBQWtDLENBQUM7Z0JBQ2xELENBQUMsQ0FBQyxRQUFRLEdBQUcsRUFBRSxDQUFDO2dCQUNoQixLQUFLLENBQUMsS0FBSyxDQUFDLE1BQU0sR0FBRyxDQUFDLENBQUMsQ0FBQyxRQUFTLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxDQUFDO2dCQUM3QyxLQUFLLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDO2FBQ2Q7aUJBQU0sSUFBSSxJQUFJLG1DQUE4QyxFQUFFO2dCQUM5RCxLQUFLLENBQUMsR0FBRyxFQUFFLENBQUM7YUFDWjtpQkFBTSxJQUFJLENBQUMsQ0FBQyxJQUFJLEtBQUssZ0JBQWdCLElBQUksQ0FBQyxDQUFDLENBQUMsY0FBYyxJQUFJLENBQUMsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLENBQUMsQ0FBQyxJQUFJLElBQUksQ0FBQyxDQUFDLENBQUMsTUFBTSxJQUFJLENBQUMsQ0FBQyxDQUFDLEtBQUssRUFBRTtnQkFDMUcsaUdBQWlHO2dCQUNqRyxLQUFLLENBQUMsR0FBRyxFQUFFLENBQUM7YUFDWjtpQkFBTTtnQkFDTixLQUFLLENBQUMsS0FBSyxDQUFDLE1BQU0sR0FBRyxDQUFDLENBQUMsQ0FBQyxRQUFTLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxDQUFDO2FBQzdDO1NBQ0Q7SUFDRixDQUFDLEVBQUUsU0FBUyxFQUFFLE9BQU8sQ0FBQyxLQUFLLENBQUMsQ0FBQztJQUU3QixPQUFPLFdBQVcsQ0FBQztBQUNwQixDQUFDO0FBRUQsU0FBUyxlQUFlLENBQUMsTUFBaUIsRUFBRSxHQUFRLEVBQUUsT0FBdUI7SUFDNUUsSUFBTSxLQUFLLEdBQVUsRUFBRSxDQUFDO0lBQ3hCLEtBQUssQ0FBQyxHQUFHLEdBQUcsU0FBUyxDQUFDLE1BQU0sQ0FBQyxDQUFDO0lBQzlCLEtBQUssQ0FBQyxJQUFJLEdBQUcsU0FBUyxDQUFDLE1BQU0sQ0FBQyxDQUFDO0lBQy9CLEtBQUssQ0FBQyxNQUFNLEdBQUcsU0FBUyxDQUFDLE1BQU0sQ0FBQyxDQUFDO0lBQ2pDLEtBQUssQ0FBQyxLQUFLLEdBQUcsU0FBUyxDQUFDLE1BQU0sQ0FBQyxDQUFDO0lBRWhDLElBQU0sWUFBWSxHQUFHLFVBQVUsQ0FBQyxNQUFNLENBQUMsQ0FBQztJQUN4QyxJQUFNLFFBQVEsR0FBa0IsRUFBRSxDQUFDO0lBRW5DLEtBQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxZQUFZLEVBQUUsQ0FBQyxFQUFFLEVBQUU7UUFDdEMsSUFBSSxTQUFTLEdBQUcsU0FBUyxDQUFDLE1BQU0sQ0FBYyxDQUFDO1FBQy9DLElBQUksYUFBYSxHQUFHLFVBQVUsQ0FBQyxNQUFNLENBQUMsQ0FBQztRQUV2QyxJQUFJLE9BQU8sQ0FBQyxLQUFLLEVBQUU7WUFDbEIsSUFBSSxhQUFhLEtBQUssQ0FBQztnQkFBRSxNQUFNLElBQUksS0FBSyxDQUFDLHlDQUF5QyxDQUFDLENBQUM7WUFDcEYsYUFBYSxHQUFHLFVBQVUsQ0FBQyxNQUFNLENBQUMsQ0FBQztTQUNuQztRQUVELFFBQVEsQ0FBQyxJQUFJLENBQUMsRUFBRSxFQUFFLEVBQUUsU0FBUyxFQUFFLE1BQU0sRUFBRSxhQUFhLEVBQUUsQ0FBQyxDQUFDO0tBQ3hEO0lBRUQsY0FBYyxDQUFDLE1BQU0sRUFBRSxNQUFNLENBQUMsQ0FBQztJQUMvQixJQUFNLFNBQVMsR0FBRyxhQUFhLENBQUMsTUFBTSxDQUFDLENBQUM7SUFDeEMsSUFBSSxDQUFDLHFCQUFXLENBQUMsU0FBUyxDQUFDO1FBQUUsTUFBTSxJQUFJLEtBQUssQ0FBQywwQkFBd0IsU0FBUyxNQUFHLENBQUMsQ0FBQztJQUNuRixLQUFLLENBQUMsU0FBUyxHQUFHLHFCQUFXLENBQUMsU0FBUyxDQUFDLENBQUM7SUFFekMsS0FBSyxDQUFDLE9BQU8sR0FBRyxTQUFTLENBQUMsTUFBTSxDQUFDLEdBQUcsSUFBSSxDQUFDO0lBQ3pDLEtBQUssQ0FBQyxRQUFRLEdBQUcsU0FBUyxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsQ0FBQztJQUV6QyxJQUFNLEtBQUssR0FBRyxTQUFTLENBQUMsTUFBTSxDQUFDLENBQUM7SUFDaEMsS0FBSyxDQUFDLHFCQUFxQixHQUFHLENBQUMsS0FBSyxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQztJQUNuRCxLQUFLLENBQUMsTUFBTSxHQUFHLENBQUMsS0FBSyxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQztJQUNwQyxrQkFBa0I7SUFDbEIsOEVBQThFO0lBQzlFLHlEQUF5RDtJQUV6RCxTQUFTLENBQUMsTUFBTSxFQUFFLENBQUMsQ0FBQyxDQUFDO0lBRXJCLFdBQVcsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxFQUFFLFVBQUEsSUFBSTtRQUMxQixJQUFNLElBQUksR0FBRyxpQkFBaUIsQ0FBQyxNQUFNLEVBQUUsT0FBTyxDQUFDLENBQUM7UUFDaEQsSUFBSSxJQUFJO1lBQUUsS0FBSyxDQUFDLElBQUksR0FBRyxJQUFJLENBQUM7UUFFNUIsMEJBQTBCLENBQUMsdUJBQXVCLENBQUMsTUFBTSxDQUFDLENBQUM7UUFDM0QsS0FBSyxDQUFDLElBQUksR0FBRyxnQkFBZ0IsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxDQUFDLENBQUM7UUFFekMsT0FBTyxJQUFJLEVBQUUsRUFBRTtZQUNkLHVCQUF1QixDQUFDLE1BQU0sRUFBRSxLQUFLLEVBQUUsR0FBRyxFQUFFLE9BQU8sQ0FBQyxDQUFDO1NBQ3JEO0lBQ0YsQ0FBQyxDQUFDLENBQUM7SUFFSCxPQUFPLEVBQUUsS0FBSyxPQUFBLEVBQUUsUUFBUSxVQUFBLEVBQUUsQ0FBQztBQUM1QixDQUFDO0FBRUQsU0FBUyxpQkFBaUIsQ0FBQyxNQUFpQixFQUFFLE9BQW9CO0lBQ2pFLE9BQU8sV0FBVyxDQUE0QixNQUFNLEVBQUUsQ0FBQyxFQUFFLFVBQUEsSUFBSTtRQUM1RCxJQUFJLENBQUMsSUFBSSxFQUFFO1lBQUUsT0FBTyxTQUFTLENBQUM7UUFFOUIsSUFBTSxJQUFJLEdBQWtCLEVBQUUsQ0FBQztRQUMvQixJQUFJLENBQUMsR0FBRyxHQUFHLFNBQVMsQ0FBQyxNQUFNLENBQUMsQ0FBQztRQUM3QixJQUFJLENBQUMsSUFBSSxHQUFHLFNBQVMsQ0FBQyxNQUFNLENBQUMsQ0FBQztRQUM5QixJQUFJLENBQUMsTUFBTSxHQUFHLFNBQVMsQ0FBQyxNQUFNLENBQUMsQ0FBQztRQUNoQyxJQUFJLENBQUMsS0FBSyxHQUFHLFNBQVMsQ0FBQyxNQUFNLENBQUMsQ0FBQztRQUMvQixJQUFJLENBQUMsWUFBWSxHQUFHLFNBQVMsQ0FBQyxNQUFNLENBQUMsQ0FBQztRQUV0QyxJQUFNLEtBQUssR0FBRyxTQUFTLENBQUMsTUFBTSxDQUFDLENBQUM7UUFDaEMsSUFBSSxDQUFDLHVCQUF1QixHQUFHLENBQUMsS0FBSyxrQ0FBeUMsQ0FBQyxLQUFLLENBQUMsQ0FBQztRQUN0RixJQUFJLENBQUMsUUFBUSxHQUFHLENBQUMsS0FBSyw0QkFBbUMsQ0FBQyxLQUFLLENBQUMsQ0FBQztRQUNqRSxJQUFJLENBQUMsY0FBYyxHQUFHLENBQUMsS0FBSywwQ0FBaUQsQ0FBQyxLQUFLLENBQUMsQ0FBQztRQUVyRixJQUFJLEtBQUssd0NBQThDLEVBQUU7WUFDeEQsSUFBTSxNQUFNLEdBQUcsU0FBUyxDQUFDLE1BQU0sQ0FBQyxDQUFDO1lBQ2pDLElBQUksTUFBTSwwQkFBNkI7Z0JBQUUsSUFBSSxDQUFDLGVBQWUsR0FBRyxTQUFTLENBQUMsTUFBTSxDQUFDLEdBQUcsSUFBSSxDQUFDO1lBQ3pGLElBQUksTUFBTSwwQkFBNkI7Z0JBQUUsSUFBSSxDQUFDLGVBQWUsR0FBRyxXQUFXLENBQUMsTUFBTSxDQUFDLENBQUM7WUFDcEYsSUFBSSxNQUFNLDRCQUErQjtnQkFBRSxJQUFJLENBQUMsaUJBQWlCLEdBQUcsU0FBUyxDQUFDLE1BQU0sQ0FBQyxHQUFHLElBQUksQ0FBQztZQUM3RixJQUFJLE1BQU0sNEJBQStCO2dCQUFFLElBQUksQ0FBQyxpQkFBaUIsR0FBRyxXQUFXLENBQUMsTUFBTSxDQUFDLENBQUM7U0FDeEY7UUFFRCxJQUFJLElBQUksRUFBRSxHQUFHLENBQUMsRUFBRTtZQUNmLE9BQU8sQ0FBQyxrQkFBa0IsSUFBSSxPQUFPLENBQUMsR0FBRyxDQUFDLDZCQUE2QixDQUFDLENBQUM7WUFDekUsNEJBQTRCO1lBQzVCLHFCQUFxQixDQUFDLFNBQVMsQ0FBQyxNQUFNLENBQUMsQ0FBQztZQUN4QyxrQ0FBa0MsQ0FBQyxTQUFTLENBQUMsTUFBTSxDQUFDLENBQUM7WUFDckQsZ0JBQWdCLENBQUMsU0FBUyxDQUFDLE1BQU0sQ0FBQyxDQUFDO1lBQ25DLGlCQUFpQixDQUFDLFNBQVMsQ0FBQyxNQUFNLENBQUMsQ0FBQztZQUNwQyxtQkFBbUIsQ0FBQyxTQUFTLENBQUMsTUFBTSxDQUFDLENBQUM7WUFDdEMsa0JBQWtCLENBQUMsU0FBUyxDQUFDLE1BQU0sQ0FBQyxDQUFDO1NBQ3JDO1FBRUQsU0FBUyxDQUFDLE1BQU0sRUFBRSxJQUFJLEVBQUUsQ0FBQyxDQUFDO1FBQzFCLE9BQU8sSUFBSSxDQUFDO0lBQ2IsQ0FBQyxDQUFDLENBQUM7QUFDSixDQUFDO0FBRUQsU0FBUyx1QkFBdUIsQ0FBQyxNQUFpQjtJQUNqRCxPQUFPLFdBQVcsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxFQUFFLFVBQUEsSUFBSTtRQUNqQyxJQUFNLHdCQUF3QixHQUFHLFVBQVUsQ0FBQyxNQUFNLENBQUMsQ0FBQztRQUNwRCxJQUFNLG1DQUFtQyxHQUFHLFVBQVUsQ0FBQyxNQUFNLENBQUMsQ0FBQztRQUMvRCxJQUFNLE1BQU0sR0FBRyxFQUFFLENBQUM7UUFFbEIsT0FBTyxJQUFJLEVBQUUsRUFBRTtZQUNkLElBQU0sV0FBVyxHQUFHLFVBQVUsQ0FBQyxNQUFNLENBQUMsQ0FBQztZQUN2QyxJQUFNLFNBQVMsR0FBRyxVQUFVLENBQUMsTUFBTSxDQUFDLENBQUM7WUFDckMsTUFBTSxDQUFDLElBQUksQ0FBQyxFQUFFLFdBQVcsYUFBQSxFQUFFLFNBQVMsV0FBQSxFQUFFLENBQUMsQ0FBQztTQUN4QztRQUVELE9BQU8sRUFBRSx3QkFBd0IsMEJBQUEsRUFBRSxtQ0FBbUMscUNBQUEsRUFBRSxNQUFNLFFBQUEsRUFBRSxDQUFDO0lBQ2xGLENBQUMsQ0FBQyxDQUFDO0FBQ0osQ0FBQztBQUVELFNBQVMseUJBQXlCLENBQ2pDLE1BQWlCLEVBQUUsR0FBUSxFQUFFLEtBQVksRUFBRSxRQUF1QixFQUFFLE9BQXVCO0lBRTNGLElBQU0sVUFBVSxHQUFHLENBQUMsS0FBSyxDQUFDLEtBQUssSUFBSSxDQUFDLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxJQUFJLElBQUksQ0FBQyxDQUFDLENBQUM7SUFDMUQsSUFBTSxXQUFXLEdBQUcsQ0FBQyxLQUFLLENBQUMsTUFBTSxJQUFJLENBQUMsQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLEdBQUcsSUFBSSxDQUFDLENBQUMsQ0FBQztJQUUzRCxJQUFJLFNBQWdDLENBQUM7SUFFckMsSUFBSSxVQUFVLElBQUksV0FBVyxFQUFFO1FBQzlCLFNBQVMsR0FBRyx5QkFBZSxDQUFDLFVBQVUsRUFBRSxXQUFXLENBQUMsQ0FBQztRQUNyRCx3QkFBYyxDQUFDLFNBQVMsQ0FBQyxDQUFDO0tBQzFCO0lBRUQsSUFBSSx3QkFBYyxFQUFFO1FBQ2xCLEtBQWEsQ0FBQyxZQUFZLEdBQUcsRUFBRSxDQUFDO0tBQ2pDO0lBRUQsS0FBc0IsVUFBUSxFQUFSLHFCQUFRLEVBQVIsc0JBQVEsRUFBUixJQUFRLEVBQUU7UUFBM0IsSUFBTSxPQUFPLGlCQUFBO1FBQ2pCLElBQU0sV0FBVyxHQUFHLFVBQVUsQ0FBQyxNQUFNLENBQWdCLENBQUM7UUFFdEQsSUFBSSxPQUFPLENBQUMsRUFBRSxzQkFBdUIsRUFBRTtZQUN0QyxJQUFNLElBQUksR0FBRyxLQUFLLENBQUMsSUFBSSxDQUFDO1lBRXhCLElBQUksQ0FBQyxJQUFJO2dCQUFFLE1BQU0sSUFBSSxLQUFLLENBQUMseUJBQXlCLENBQUMsQ0FBQztZQUV0RCxJQUFNLFNBQVMsR0FBRyxDQUFDLElBQUksQ0FBQyxLQUFLLElBQUksQ0FBQyxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsSUFBSSxJQUFJLENBQUMsQ0FBQyxDQUFDO1lBQ3ZELElBQU0sVUFBVSxHQUFHLENBQUMsSUFBSSxDQUFDLE1BQU0sSUFBSSxDQUFDLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxHQUFHLElBQUksQ0FBQyxDQUFDLENBQUM7WUFFeEQsSUFBSSxTQUFTLElBQUksVUFBVSxFQUFFO2dCQUM1QixJQUFNLFFBQVEsR0FBRyx5QkFBZSxDQUFDLFNBQVMsRUFBRSxVQUFVLENBQUMsQ0FBQztnQkFDeEQsd0JBQWMsQ0FBQyxRQUFRLENBQUMsQ0FBQztnQkFFekIsSUFBTSxLQUFLLEdBQUcsTUFBTSxDQUFDLE1BQU0sQ0FBQztnQkFDNUIsUUFBUSxDQUFDLE1BQU0sRUFBRSxRQUFRLEVBQUUsV0FBVyxFQUFFLFNBQVMsRUFBRSxVQUFVLEVBQUUsQ0FBQyxFQUFFLE9BQU8sQ0FBQyxLQUFLLENBQUMsQ0FBQztnQkFFakYsSUFBSSx3QkFBYyxFQUFFO29CQUNsQixLQUFhLENBQUMsV0FBVyxHQUFHLElBQUksVUFBVSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsTUFBTSxFQUFFLE1BQU0sQ0FBQyxJQUFJLENBQUMsVUFBVSxHQUFHLEtBQUssRUFBRSxNQUFNLENBQUMsTUFBTSxHQUFHLEtBQUssQ0FBQyxDQUFDO2lCQUN2SDtnQkFFRCxjQUFjLENBQUMsUUFBUSxDQUFDLENBQUM7Z0JBRXpCLElBQUksT0FBTyxDQUFDLFlBQVksRUFBRTtvQkFDekIsSUFBSSxDQUFDLFNBQVMsR0FBRyxRQUFRLENBQUM7aUJBQzFCO3FCQUFNO29CQUNOLElBQUksQ0FBQyxNQUFNLEdBQUcsc0JBQVksQ0FBQyxTQUFTLEVBQUUsVUFBVSxDQUFDLENBQUM7b0JBQ2xELElBQUksQ0FBQyxNQUFNLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBRSxDQUFDLFlBQVksQ0FBQyxRQUFRLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO2lCQUMzRDthQUNEO1NBQ0Q7YUFBTTtZQUNOLElBQU0sTUFBTSxHQUFHLDBCQUFnQixDQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUMsQ0FBQztZQUM1QyxJQUFJLFVBQVUsR0FBRyxTQUFTLENBQUM7WUFFM0IsSUFBSSxNQUFNLEdBQUcsQ0FBQyxFQUFFO2dCQUNmLFVBQVUsR0FBRyxTQUFTLENBQUM7Z0JBRXZCLElBQUksT0FBTyxDQUFDLHVCQUF1QixFQUFFO29CQUNwQyxNQUFNLElBQUksS0FBSyxDQUFDLDRCQUEwQixPQUFPLENBQUMsRUFBSSxDQUFDLENBQUM7aUJBQ3hEO2FBQ0Q7WUFFRCxJQUFNLEtBQUssR0FBRyxNQUFNLENBQUMsTUFBTSxDQUFDO1lBQzVCLFFBQVEsQ0FBQyxNQUFNLEVBQUUsVUFBVSxFQUFFLFdBQVcsRUFBRSxVQUFVLEVBQUUsV0FBVyxFQUFFLE1BQU0sRUFBRSxPQUFPLENBQUMsS0FBSyxDQUFDLENBQUM7WUFFMUYsSUFBSSx3QkFBYyxFQUFFO2dCQUNsQixLQUFhLENBQUMsWUFBWSxDQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUMsR0FBRyxJQUFJLFVBQVUsQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLE1BQU0sRUFBRSxNQUFNLENBQUMsSUFBSSxDQUFDLFVBQVUsR0FBRyxLQUFLLEVBQUUsTUFBTSxDQUFDLE1BQU0sR0FBRyxLQUFLLENBQUMsQ0FBQzthQUNwSTtZQUVELElBQUksVUFBVSxJQUFJLEdBQUcsQ0FBQyxTQUFTLHNCQUF3QixFQUFFO2dCQUN4RCxjQUFjLENBQUMsVUFBVSxDQUFDLENBQUM7YUFDM0I7U0FDRDtLQUNEO0lBRUQsSUFBSSxTQUFTLEVBQUU7UUFDZCxJQUFJLE9BQU8sQ0FBQyxZQUFZLEVBQUU7WUFDekIsS0FBSyxDQUFDLFNBQVMsR0FBRyxTQUFTLENBQUM7U0FDNUI7YUFBTTtZQUNOLEtBQUssQ0FBQyxNQUFNLEdBQUcsc0JBQVksQ0FBQyxVQUFVLEVBQUUsV0FBVyxDQUFDLENBQUM7WUFDckQsS0FBSyxDQUFDLE1BQU0sQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFFLENBQUMsWUFBWSxDQUFDLFNBQVMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7U0FDN0Q7S0FDRDtBQUNGLENBQUM7QUFFRCxTQUFTLFFBQVEsQ0FDaEIsTUFBaUIsRUFBRSxJQUEyQixFQUFFLFdBQXdCLEVBQUUsS0FBYSxFQUFFLE1BQWMsRUFDdkcsTUFBYyxFQUFFLEtBQWM7SUFFOUIsSUFBSSxXQUFXLG9CQUF3QixFQUFFO1FBQ3hDLFdBQVcsQ0FBQyxNQUFNLEVBQUUsSUFBSSxFQUFFLE1BQU0sRUFBRSxLQUFLLEVBQUUsTUFBTSxDQUFDLENBQUM7S0FDakQ7U0FBTSxJQUFJLFdBQVcsMEJBQThCLEVBQUU7UUFDckQsV0FBVyxDQUFDLE1BQU0sRUFBRSxJQUFJLEVBQUUsS0FBSyxFQUFFLE1BQU0sRUFBRSxDQUFDLEVBQUUsQ0FBQyxNQUFNLENBQUMsRUFBRSxLQUFLLENBQUMsQ0FBQztLQUM3RDtTQUFNO1FBQ04sTUFBTSxJQUFJLEtBQUssQ0FBQyxxQ0FBbUMsV0FBYSxDQUFDLENBQUM7S0FDbEU7QUFDRixDQUFDO0FBRUQsU0FBUyx1QkFBdUIsQ0FBQyxNQUFpQjtJQUNqRCxPQUFPLFdBQVcsQ0FBa0MsTUFBTSxFQUFFLENBQUMsRUFBRSxVQUFBLElBQUk7UUFDbEUsSUFBSSxDQUFDLElBQUksRUFBRTtZQUFFLE9BQU8sU0FBUyxDQUFDO1FBRTlCLElBQU0saUJBQWlCLEdBQUcsVUFBVSxDQUFDLE1BQU0sQ0FBQyxDQUFDO1FBQzdDLElBQU0sV0FBVyxHQUFHLFVBQVUsQ0FBQyxNQUFNLENBQUMsQ0FBQztRQUN2QyxJQUFNLFdBQVcsR0FBRyxVQUFVLENBQUMsTUFBTSxDQUFDLENBQUM7UUFDdkMsSUFBTSxXQUFXLEdBQUcsVUFBVSxDQUFDLE1BQU0sQ0FBQyxDQUFDO1FBQ3ZDLElBQU0sV0FBVyxHQUFHLFVBQVUsQ0FBQyxNQUFNLENBQUMsQ0FBQztRQUN2QyxJQUFNLE9BQU8sR0FBRyxVQUFVLENBQUMsTUFBTSxDQUFDLEdBQUcsSUFBSSxDQUFDO1FBQzFDLElBQU0sSUFBSSxHQUFHLFNBQVMsQ0FBQyxNQUFNLENBQUMsQ0FBQztRQUMvQixTQUFTLENBQUMsTUFBTSxFQUFFLElBQUksRUFBRSxDQUFDLENBQUMsQ0FBQyx1QkFBdUI7UUFDbEQsT0FBTyxFQUFFLGlCQUFpQixtQkFBQSxFQUFFLFdBQVcsYUFBQSxFQUFFLFdBQVcsYUFBQSxFQUFFLFdBQVcsYUFBQSxFQUFFLFdBQVcsYUFBQSxFQUFFLE9BQU8sU0FBQSxFQUFFLElBQUksTUFBQSxFQUFFLENBQUM7SUFDakcsQ0FBQyxDQUFDLENBQUM7QUFDSixDQUFDO0FBRUQsU0FBUyx1QkFBdUIsQ0FBQyxNQUFpQixFQUFFLE1BQTJCLEVBQUUsR0FBUSxFQUFFLE9BQXVCO0lBQ2pILElBQU0sR0FBRyxHQUFHLGFBQWEsQ0FBQyxNQUFNLENBQUMsQ0FBQztJQUNsQyxJQUFJLEdBQUcsS0FBSyxNQUFNLElBQUksR0FBRyxLQUFLLE1BQU07UUFBRSxNQUFNLElBQUksS0FBSyxDQUFDLHlCQUF1QixHQUFHLGVBQVUsQ0FBQyxNQUFNLENBQUMsTUFBTSxHQUFHLENBQUMsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxFQUFFLENBQUcsQ0FBQyxDQUFDO0lBQzlILElBQU0sR0FBRyxHQUFHLGFBQWEsQ0FBQyxNQUFNLENBQUMsQ0FBQztJQUVsQywyR0FBMkc7SUFDM0csSUFBTSxHQUFHLEdBQUcsR0FBRyxLQUFLLE1BQU0sSUFBSSxDQUFDLE9BQU8sQ0FBQyxLQUFLLElBQUksaUNBQXVCLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFFN0YsV0FBVyxDQUFDLE1BQU0sRUFBRSxDQUFDLEVBQUUsVUFBQSxJQUFJO1FBQzFCLElBQU0sT0FBTyxHQUFHLGdDQUFlLENBQUMsR0FBRyxDQUFDLENBQUM7UUFFckMsSUFBSSxPQUFPLEVBQUU7WUFDWixJQUFJO2dCQUNILE9BQU8sQ0FBQyxJQUFJLENBQUMsTUFBTSxFQUFFLE1BQU0sRUFBRSxJQUFJLEVBQUUsR0FBRyxFQUFFLE9BQU8sQ0FBQyxDQUFDO2FBQ2pEO1lBQUMsT0FBTyxDQUFDLEVBQUU7Z0JBQ1gsSUFBSSxPQUFPLENBQUMsdUJBQXVCO29CQUFFLE1BQU0sQ0FBQyxDQUFDO2FBQzdDO1NBQ0Q7YUFBTTtZQUNOLE9BQU8sQ0FBQyxrQkFBa0IsSUFBSSxPQUFPLENBQUMsR0FBRyxDQUFDLGdDQUE4QixHQUFLLENBQUMsQ0FBQztZQUMvRSxTQUFTLENBQUMsTUFBTSxFQUFFLElBQUksRUFBRSxDQUFDLENBQUM7U0FDMUI7UUFFRCxJQUFJLElBQUksRUFBRSxFQUFFO1lBQ1gsT0FBTyxDQUFDLGtCQUFrQixJQUFJLE9BQU8sQ0FBQyxHQUFHLENBQUMsWUFBVSxJQUFJLEVBQUUsNkJBQXdCLEdBQUssQ0FBQyxDQUFDO1lBQ3pGLFNBQVMsQ0FBQyxNQUFNLEVBQUUsSUFBSSxFQUFFLENBQUMsQ0FBQztTQUMxQjtJQUNGLENBQUMsRUFBRSxLQUFLLEVBQUUsR0FBRyxDQUFDLENBQUM7QUFDaEIsQ0FBQztBQUVELFNBQVMsYUFBYSxDQUFDLE1BQWlCLEVBQUUsR0FBUSxFQUFFLFdBQW9CLEVBQUUsT0FBdUI7SUFDaEcsSUFBTSxXQUFXLEdBQUcsVUFBVSxDQUFDLE1BQU0sQ0FBZ0IsQ0FBQztJQUV0RCxJQUFJLDJCQUFtQixDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsU0FBVSxDQUFDLEtBQUssQ0FBQyxDQUFDO1FBQ3JELE1BQU0sSUFBSSxLQUFLLENBQUMsK0JBQTZCLEdBQUcsQ0FBQyxTQUFXLENBQUMsQ0FBQztJQUUvRCxJQUFJLFdBQVcsb0JBQXdCLElBQUksV0FBVywwQkFBOEI7UUFDbkYsTUFBTSxJQUFJLEtBQUssQ0FBQyxxQ0FBbUMsV0FBYSxDQUFDLENBQUM7SUFFbkUsSUFBTSxTQUFTLEdBQUcseUJBQWUsQ0FBQyxHQUFHLENBQUMsS0FBSyxFQUFFLEdBQUcsQ0FBQyxNQUFNLENBQUMsQ0FBQztJQUN6RCx3QkFBYyxDQUFDLFNBQVMsQ0FBQyxDQUFDO0lBRTFCLElBQUksR0FBRyxDQUFDLFNBQVMsbUJBQXFCLEVBQUU7UUFDdkMsSUFBSSxLQUFLLFNBQVksQ0FBQztRQUV0QixJQUFJLFdBQVcsb0JBQXdCLEVBQUU7WUFDeEMsS0FBSyxHQUFHLFNBQVMsQ0FBQyxNQUFNLEVBQUUsSUFBSSxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsS0FBSyxHQUFHLENBQUMsQ0FBQyxHQUFHLEdBQUcsQ0FBQyxNQUFNLENBQUMsQ0FBQztTQUNqRTthQUFNLElBQUksV0FBVywwQkFBOEIsRUFBRTtZQUNyRCxLQUFLLEdBQUcsSUFBSSxVQUFVLENBQUMsR0FBRyxDQUFDLEtBQUssR0FBRyxHQUFHLENBQUMsTUFBTSxDQUFDLENBQUM7WUFDL0MsV0FBVyxDQUFDLE1BQU0sRUFBRSxFQUFFLElBQUksRUFBRSxLQUFLLEVBQUUsS0FBSyxFQUFFLEdBQUcsQ0FBQyxLQUFLLEVBQUUsTUFBTSxFQUFFLEdBQUcsQ0FBQyxNQUFNLEVBQUUsRUFBRSxHQUFHLENBQUMsS0FBSyxFQUFFLEdBQUcsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLEVBQUUsT0FBTyxDQUFDLEtBQUssQ0FBQyxDQUFDO1NBQ3pIO2FBQU07WUFDTixNQUFNLElBQUksS0FBSyxDQUFDLHVDQUFxQyxXQUFhLENBQUMsQ0FBQztTQUNwRTtRQUVELHNCQUFZLENBQUMsS0FBSyxFQUFFLFNBQVMsQ0FBQyxJQUFJLEVBQUUsR0FBRyxDQUFDLEtBQUssRUFBRSxHQUFHLENBQUMsTUFBTSxDQUFDLENBQUM7S0FDM0Q7U0FBTTtRQUNOLElBQU0sUUFBUSxHQUFHLEdBQUcsQ0FBQyxTQUFTLHNCQUF3QixDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7UUFFekUsSUFBSSxHQUFHLENBQUMsUUFBUSxJQUFJLEdBQUcsQ0FBQyxRQUFRLEdBQUcsQ0FBQyxFQUFFO1lBQ3JDLEtBQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxHQUFHLENBQUMsUUFBUSxFQUFFLENBQUMsRUFBRSxFQUFFO2dCQUN0QyxzREFBc0Q7Z0JBQ3RELFFBQVEsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUM7YUFDakI7U0FDRDthQUFNLElBQUksV0FBVyxFQUFFO1lBQ3ZCLFFBQVEsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUM7U0FDakI7UUFFRCxJQUFJLFdBQVcsb0JBQXdCLEVBQUU7WUFDeEMsS0FBSyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLFFBQVEsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxFQUFFLEVBQUU7Z0JBQ3pDLFdBQVcsQ0FBQyxNQUFNLEVBQUUsU0FBUyxFQUFFLFFBQVEsQ0FBQyxDQUFDLENBQUMsRUFBRSxHQUFHLENBQUMsS0FBSyxFQUFFLEdBQUcsQ0FBQyxNQUFNLENBQUMsQ0FBQzthQUNuRTtTQUNEO2FBQU0sSUFBSSxXQUFXLDBCQUE4QixFQUFFO1lBQ3JELElBQU0sS0FBSyxHQUFHLE1BQU0sQ0FBQyxNQUFNLENBQUM7WUFDNUIsV0FBVyxDQUFDLE1BQU0sRUFBRSxTQUFTLEVBQUUsR0FBRyxDQUFDLEtBQUssRUFBRSxHQUFHLENBQUMsTUFBTSxFQUFFLENBQUMsRUFBRSxRQUFRLEVBQUUsT0FBTyxDQUFDLEtBQUssQ0FBQyxDQUFDO1lBRWxGLElBQUksd0JBQWMsRUFBRTtnQkFDbEIsR0FBVyxDQUFDLFlBQVksR0FBRyxJQUFJLFVBQVUsQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLE1BQU0sRUFBRSxNQUFNLENBQUMsSUFBSSxDQUFDLFVBQVUsR0FBRyxLQUFLLEVBQUUsTUFBTSxDQUFDLE1BQU0sR0FBRyxLQUFLLENBQUMsQ0FBQzthQUN0SDtTQUNEO1FBRUQsSUFBSSxHQUFHLENBQUMsU0FBUyxzQkFBd0IsRUFBRTtZQUMxQyxjQUFjLENBQUMsU0FBUyxDQUFDLENBQUM7U0FDMUI7S0FDRDtJQUVELElBQUksT0FBTyxDQUFDLFlBQVksRUFBRTtRQUN6QixHQUFHLENBQUMsU0FBUyxHQUFHLFNBQVMsQ0FBQztLQUMxQjtTQUFNO1FBQ04sR0FBRyxDQUFDLE1BQU0sR0FBRyxzQkFBWSxDQUFDLEdBQUcsQ0FBQyxLQUFLLEVBQUUsR0FBRyxDQUFDLE1BQU0sQ0FBQyxDQUFDO1FBQ2pELEdBQUcsQ0FBQyxNQUFNLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBRSxDQUFDLFlBQVksQ0FBQyxTQUFTLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO0tBQzNEO0FBQ0YsQ0FBQztBQUVELFNBQVMsV0FBVyxDQUFDLE1BQWlCLEVBQUUsU0FBZ0MsRUFBRSxNQUFjLEVBQUUsS0FBYSxFQUFFLE1BQWM7SUFDdEgsSUFBTSxJQUFJLEdBQUcsS0FBSyxHQUFHLE1BQU0sQ0FBQztJQUM1QixJQUFNLE1BQU0sR0FBRyxTQUFTLENBQUMsTUFBTSxFQUFFLElBQUksQ0FBQyxDQUFDO0lBRXZDLElBQUksU0FBUyxJQUFJLE1BQU0sR0FBRyxDQUFDLEVBQUU7UUFDNUIsSUFBTSxJQUFJLEdBQUcsU0FBUyxDQUFDLElBQUksQ0FBQztRQUU1QixLQUFLLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsTUFBTSxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsSUFBSSxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUMsR0FBRyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsR0FBRyxDQUFDLEVBQUU7WUFDL0QsSUFBSSxDQUFDLENBQUMsQ0FBQyxHQUFHLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQztTQUNwQjtLQUNEO0FBQ0YsQ0FBQztBQUVELFNBQWdCLFdBQVcsQ0FDMUIsTUFBaUIsRUFBRSxTQUFnQyxFQUFFLE1BQWMsRUFBRSxNQUFjLEVBQUUsSUFBWSxFQUFFLE9BQWlCLEVBQ3BILEtBQWM7SUFFZCxJQUFNLElBQUksR0FBRyxTQUFTLElBQUksU0FBUyxDQUFDLElBQUksQ0FBQztJQUN6QyxJQUFJLE9BQWtDLENBQUM7SUFFdkMsSUFBSSxLQUFLLEVBQUU7UUFDVixPQUFPLEdBQUcsSUFBSSxXQUFXLENBQUMsT0FBTyxDQUFDLE1BQU0sR0FBRyxNQUFNLENBQUMsQ0FBQztRQUVuRCxLQUFLLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxFQUFFLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxPQUFPLENBQUMsTUFBTSxFQUFFLENBQUMsRUFBRSxFQUFFO1lBQ2hELEtBQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxNQUFNLEVBQUUsQ0FBQyxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUU7Z0JBQ3RDLE9BQU8sQ0FBQyxFQUFFLENBQUMsR0FBRyxVQUFVLENBQUMsTUFBTSxDQUFDLENBQUM7YUFDakM7U0FDRDtLQUNEO1NBQU07UUFDTixPQUFPLEdBQUcsSUFBSSxXQUFXLENBQUMsT0FBTyxDQUFDLE1BQU0sR0FBRyxNQUFNLENBQUMsQ0FBQztRQUVuRCxLQUFLLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxFQUFFLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxPQUFPLENBQUMsTUFBTSxFQUFFLENBQUMsRUFBRSxFQUFFO1lBQ2hELEtBQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxNQUFNLEVBQUUsQ0FBQyxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUU7Z0JBQ3RDLE9BQU8sQ0FBQyxFQUFFLENBQUMsR0FBRyxVQUFVLENBQUMsTUFBTSxDQUFDLENBQUM7YUFDakM7U0FDRDtLQUNEO0lBRUQsS0FBSyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsRUFBRSxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsT0FBTyxDQUFDLE1BQU0sRUFBRSxDQUFDLEVBQUUsRUFBRTtRQUNoRCxJQUFNLE1BQU0sR0FBRyxPQUFPLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDO1FBQzlCLElBQU0sS0FBSyxHQUFHLENBQUMsR0FBRyxDQUFDLElBQUksTUFBTSxHQUFHLENBQUMsQ0FBQztRQUVsQyxJQUFJLENBQUMsSUFBSSxJQUFJLEtBQUssRUFBRTtZQUNuQixLQUFLLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsTUFBTSxFQUFFLENBQUMsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFO2dCQUN0QyxTQUFTLENBQUMsTUFBTSxFQUFFLE9BQU8sQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO2FBQy9CO1NBQ0Q7YUFBTTtZQUNOLEtBQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxNQUFNLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxNQUFNLEVBQUUsQ0FBQyxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUU7Z0JBQ3RELElBQU0sUUFBTSxHQUFHLE9BQU8sQ0FBQyxFQUFFLENBQUMsQ0FBQztnQkFDM0IsSUFBTSxNQUFNLEdBQUcsU0FBUyxDQUFDLE1BQU0sRUFBRSxRQUFNLENBQUMsQ0FBQztnQkFFekMsS0FBSyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLFFBQU0sRUFBRSxDQUFDLEVBQUUsRUFBRTtvQkFDaEMsSUFBSSxNQUFNLEdBQUcsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDO29CQUV2QixJQUFJLE1BQU0sR0FBRyxHQUFHLEVBQUU7d0JBQ2pCLElBQU0sS0FBSyxHQUFHLE1BQU0sQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO3dCQUMxQixNQUFNLEdBQUcsQ0FBQyxHQUFHLEdBQUcsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDO3dCQUU1QixLQUFLLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLElBQUksTUFBTSxFQUFFLENBQUMsR0FBRyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsR0FBRyxDQUFDLEVBQUU7NEJBQzdDLElBQUksQ0FBQyxDQUFDLENBQUMsR0FBRyxLQUFLLENBQUM7NEJBQ2hCLENBQUMsR0FBRyxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUM7eUJBQ25CO3FCQUNEO3lCQUFNLElBQUksTUFBTSxHQUFHLEdBQUcsRUFBRTt3QkFDeEIsS0FBSyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxJQUFJLE1BQU0sRUFBRSxDQUFDLEdBQUcsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxFQUFFOzRCQUM3QyxJQUFJLENBQUMsQ0FBQyxDQUFDLEdBQUcsTUFBTSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7NEJBQ3RCLENBQUMsR0FBRyxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUM7eUJBQ25CO3FCQUNEO3lCQUFNO3dCQUNOLGFBQWE7cUJBQ2I7b0JBRUQsSUFBSSxDQUFDLElBQUksUUFBTSxFQUFFO3dCQUNoQixNQUFNLElBQUksS0FBSyxDQUFDLDRDQUEwQyxDQUFDLFNBQUksUUFBUSxDQUFDLENBQUM7cUJBQ3pFO2lCQUNEO2FBQ0Q7U0FDRDtLQUNEO0FBQ0YsQ0FBQztBQWpFRCxrQ0FpRUM7QUFFRCxTQUFnQixXQUFXLENBQzFCLE1BQWlCLEVBQUUsS0FBYSxFQUFFLElBQStCLEVBQUUsU0FBZ0IsRUFBRSxVQUFrQjtJQUFwQywwQkFBQSxFQUFBLGdCQUFnQjtJQUFFLDJCQUFBLEVBQUEsa0JBQWtCO0lBRXZHLElBQUksTUFBTSxHQUFHLFVBQVUsQ0FBQyxNQUFNLENBQUMsQ0FBQztJQUVoQyxJQUFJLFVBQVUsRUFBRTtRQUNmLElBQUksTUFBTSxLQUFLLENBQUM7WUFBRSxNQUFNLElBQUksS0FBSyxDQUFDLHlDQUF5QyxDQUFDLENBQUM7UUFDN0UsTUFBTSxHQUFHLFVBQVUsQ0FBQyxNQUFNLENBQUMsQ0FBQztLQUM1QjtJQUVELElBQUksTUFBTSxJQUFJLENBQUMsSUFBSSxTQUFTO1FBQUUsT0FBTyxTQUFTLENBQUM7SUFFL0MsSUFBSSxHQUFHLEdBQUcsTUFBTSxDQUFDLE1BQU0sR0FBRyxNQUFNLENBQUM7SUFDakMsSUFBTSxNQUFNLEdBQUcsSUFBSSxDQUFDLGNBQU0sT0FBQSxHQUFHLEdBQUcsTUFBTSxDQUFDLE1BQU0sRUFBbkIsQ0FBbUIsQ0FBQyxDQUFDO0lBRS9DLDJCQUEyQjtJQUMzQiwrQ0FBK0M7SUFFL0MsNkJBQTZCO0lBQzdCLDRHQUE0RztJQUU1RyxPQUFPLEdBQUcsR0FBRyxLQUFLO1FBQUUsR0FBRyxFQUFFLENBQUM7SUFFMUIsTUFBTSxDQUFDLE1BQU0sR0FBRyxHQUFHLENBQUM7SUFDcEIsT0FBTyxNQUFNLENBQUM7QUFDZixDQUFDO0FBekJELGtDQXlCQztBQUVELFNBQWdCLFNBQVMsQ0FBQyxNQUFpQjtJQUMxQyxJQUFNLFVBQVUsR0FBRyxVQUFVLENBQUMsTUFBTSxDQUFlLENBQUM7SUFFcEQsUUFBUSxVQUFVLEVBQUU7UUFDbkIsZ0JBQW1CLENBQUMsQ0FBQztZQUNwQixJQUFNLENBQUMsR0FBRyxVQUFVLENBQUMsTUFBTSxDQUFDLEdBQUcsR0FBRyxDQUFDO1lBQ25DLElBQU0sQ0FBQyxHQUFHLFVBQVUsQ0FBQyxNQUFNLENBQUMsR0FBRyxHQUFHLENBQUM7WUFDbkMsSUFBTSxDQUFDLEdBQUcsVUFBVSxDQUFDLE1BQU0sQ0FBQyxHQUFHLEdBQUcsQ0FBQztZQUNuQyxTQUFTLENBQUMsTUFBTSxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQ3JCLE9BQU8sRUFBRSxDQUFDLEdBQUEsRUFBRSxDQUFDLEdBQUEsRUFBRSxDQUFDLEdBQUEsRUFBRSxDQUFDO1NBQ25CO1FBQ0QsZ0JBQW1CLENBQUMsQ0FBQztZQUNwQixJQUFNLENBQUMsR0FBRyxVQUFVLENBQUMsTUFBTSxDQUFDLEdBQUcsTUFBTSxDQUFDO1lBQ3RDLElBQU0sQ0FBQyxHQUFHLFVBQVUsQ0FBQyxNQUFNLENBQUMsR0FBRyxNQUFNLENBQUM7WUFDdEMsSUFBTSxDQUFDLEdBQUcsVUFBVSxDQUFDLE1BQU0sQ0FBQyxHQUFHLE1BQU0sQ0FBQztZQUN0QyxTQUFTLENBQUMsTUFBTSxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQ3JCLE9BQU8sRUFBRSxDQUFDLEdBQUEsRUFBRSxDQUFDLEdBQUEsRUFBRSxDQUFDLEdBQUEsRUFBRSxDQUFDO1NBQ25CO1FBQ0QsaUJBQW9CLENBQUMsQ0FBQztZQUNyQixJQUFNLENBQUMsR0FBRyxVQUFVLENBQUMsTUFBTSxDQUFDLEdBQUcsR0FBRyxDQUFDO1lBQ25DLElBQU0sQ0FBQyxHQUFHLFVBQVUsQ0FBQyxNQUFNLENBQUMsR0FBRyxHQUFHLENBQUM7WUFDbkMsSUFBTSxDQUFDLEdBQUcsVUFBVSxDQUFDLE1BQU0sQ0FBQyxHQUFHLEdBQUcsQ0FBQztZQUNuQyxJQUFNLENBQUMsR0FBRyxVQUFVLENBQUMsTUFBTSxDQUFDLEdBQUcsR0FBRyxDQUFDO1lBQ25DLE9BQU8sRUFBRSxDQUFDLEdBQUEsRUFBRSxDQUFDLEdBQUEsRUFBRSxDQUFDLEdBQUEsRUFBRSxDQUFDLEdBQUEsRUFBRSxDQUFDO1NBQ3RCO1FBQ0QsZ0JBQW1CLENBQUMsQ0FBQztZQUNwQixJQUFNLENBQUMsR0FBRyxTQUFTLENBQUMsTUFBTSxDQUFDLEdBQUcsS0FBSyxDQUFDO1lBQ3BDLElBQU0sRUFBRSxHQUFHLFNBQVMsQ0FBQyxNQUFNLENBQUMsQ0FBQztZQUM3QixJQUFNLEVBQUUsR0FBRyxTQUFTLENBQUMsTUFBTSxDQUFDLENBQUM7WUFDN0IsSUFBTSxDQUFDLEdBQUcsRUFBRSxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLEdBQUcsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxHQUFHLEtBQUssQ0FBQyxDQUFDO1lBQy9DLElBQU0sQ0FBQyxHQUFHLEVBQUUsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxHQUFHLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUUsR0FBRyxLQUFLLENBQUMsQ0FBQztZQUMvQyxTQUFTLENBQUMsTUFBTSxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQ3JCLE9BQU8sRUFBRSxDQUFDLEdBQUEsRUFBRSxDQUFDLEdBQUEsRUFBRSxDQUFDLEdBQUEsRUFBRSxDQUFDO1NBQ25CO1FBQ0Qsc0JBQXlCLENBQUMsQ0FBQztZQUMxQixJQUFNLENBQUMsR0FBRyxVQUFVLENBQUMsTUFBTSxDQUFDLEdBQUcsR0FBRyxHQUFHLEtBQUssQ0FBQztZQUMzQyxTQUFTLENBQUMsTUFBTSxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQ3JCLE9BQU8sRUFBRSxDQUFDLEdBQUEsRUFBRSxDQUFDO1NBQ2I7UUFDRDtZQUNDLE1BQU0sSUFBSSxLQUFLLENBQUMscUJBQXFCLENBQUMsQ0FBQztLQUN4QztBQUNGLENBQUM7QUExQ0QsOEJBMENDO0FBRUQsU0FBZ0IsV0FBVyxDQUFDLE1BQWlCO0lBQzVDLFVBQVUsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLFNBQVM7SUFDN0IsSUFBTSxPQUFPLEdBQUcsVUFBVSxDQUFDLE1BQU0sQ0FBQyxDQUFDO0lBQ25DLElBQUksT0FBTyxLQUFLLENBQUM7UUFBRSxNQUFNLElBQUksS0FBSyxDQUFDLDhCQUE0QixPQUFTLENBQUMsQ0FBQztJQUUxRSxJQUFNLFNBQVMsR0FBRyxVQUFVLENBQUMsTUFBTSxDQUFjLENBQUM7SUFDbEQsSUFBTSxDQUFDLEdBQUcsU0FBUyxDQUFDLE1BQU0sQ0FBQyxDQUFDO0lBQzVCLElBQU0sQ0FBQyxHQUFHLFNBQVMsQ0FBQyxNQUFNLENBQUMsQ0FBQztJQUU1Qiw0Q0FBNEM7SUFDNUMsSUFBSSxTQUFTLGdCQUFrQixJQUFJLFNBQVMsc0JBQXdCO1FBQUUsTUFBTSxJQUFJLEtBQUssQ0FBQyxnQ0FBZ0MsQ0FBQyxDQUFDO0lBRXhILElBQU0sSUFBSSxHQUFHLGlCQUFpQixDQUFDLE1BQU0sQ0FBQyxDQUFDO0lBQ3ZDLElBQU0sRUFBRSxHQUFHLGdCQUFnQixDQUFDLE1BQU0sRUFBRSxDQUFDLENBQUMsQ0FBQztJQUV2QyxzRkFBc0Y7SUFFdEYsNEJBQTRCO0lBQzVCLElBQU0sUUFBUSxHQUFHLFVBQVUsQ0FBQyxNQUFNLENBQUMsQ0FBQztJQUNwQyxJQUFJLFFBQVEsS0FBSyxDQUFDO1FBQUUsTUFBTSxJQUFJLEtBQUssQ0FBQyxtQ0FBaUMsUUFBVSxDQUFDLENBQUM7SUFFakYsVUFBVSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsU0FBUztJQUM3QixJQUFNLEdBQUcsR0FBRyxVQUFVLENBQUMsTUFBTSxDQUFDLENBQUM7SUFDL0IsSUFBTSxJQUFJLEdBQUcsVUFBVSxDQUFDLE1BQU0sQ0FBQyxDQUFDO0lBQ2hDLElBQU0sTUFBTSxHQUFHLFVBQVUsQ0FBQyxNQUFNLENBQUMsQ0FBQztJQUNsQyxJQUFNLEtBQUssR0FBRyxVQUFVLENBQUMsTUFBTSxDQUFDLENBQUM7SUFDakMsSUFBTSxhQUFhLEdBQUcsVUFBVSxDQUFDLE1BQU0sQ0FBQyxDQUFDO0lBQ3pDLElBQU0sS0FBSyxHQUFHLEtBQUssR0FBRyxJQUFJLENBQUM7SUFDM0IsSUFBTSxNQUFNLEdBQUcsTUFBTSxHQUFHLEdBQUcsQ0FBQztJQUM1QixJQUFNLElBQUksR0FBRyxJQUFJLFVBQVUsQ0FBQyxLQUFLLEdBQUcsTUFBTSxHQUFHLENBQUMsQ0FBQyxDQUFDO0lBRWhELEtBQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxJQUFJLENBQUMsVUFBVSxFQUFFLENBQUMsSUFBSSxDQUFDLEVBQUU7UUFDNUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxHQUFHLEdBQUcsQ0FBQztLQUNkO0lBRUQsS0FBSyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsRUFBRSxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsQ0FBQyxhQUFhLEdBQUcsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLEVBQUU7UUFDckQsSUFBTSxHQUFHLEdBQUcsVUFBVSxDQUFDLE1BQU0sQ0FBQyxDQUFDO1FBRS9CLElBQUksR0FBRyxFQUFFO1lBQ1IsSUFBTSxRQUFNLEdBQUcsVUFBVSxDQUFDLE1BQU0sQ0FBQyxDQUFDO1lBQ2xDLElBQU0sVUFBVSxHQUFHLFVBQVUsQ0FBQyxNQUFNLENBQUMsQ0FBQztZQUN0QyxJQUFNLElBQUksR0FBRyxVQUFVLENBQUMsTUFBTSxDQUFDLENBQUM7WUFDaEMsSUFBTSxLQUFLLEdBQUcsVUFBVSxDQUFDLE1BQU0sQ0FBQyxDQUFDO1lBQ2pDLElBQU0sT0FBTyxHQUFHLFVBQVUsQ0FBQyxNQUFNLENBQUMsQ0FBQztZQUNuQyxJQUFNLE1BQU0sR0FBRyxVQUFVLENBQUMsTUFBTSxDQUFDLENBQUM7WUFDbEMsSUFBTSxXQUFXLEdBQUcsVUFBVSxDQUFDLE1BQU0sQ0FBQyxDQUFDO1lBQ3ZDLElBQU0sZUFBZSxHQUFHLFNBQVMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLG1CQUFtQjtZQUM5RCxJQUFNLFVBQVUsR0FBRyxRQUFNLEdBQUcsQ0FBQyxDQUFDLEdBQUcsRUFBRSxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQztZQUM3QyxJQUFNLEtBQUssR0FBRyxTQUFTLENBQUMsTUFBTSxFQUFFLFVBQVUsQ0FBQyxDQUFDO1lBRTVDLElBQUksVUFBVSxLQUFLLENBQUMsSUFBSSxXQUFXLEtBQUssQ0FBQztnQkFBRSxNQUFNLElBQUksS0FBSyxDQUFDLDhDQUE4QyxDQUFDLENBQUM7WUFFM0csSUFBTSxDQUFDLEdBQUcsTUFBTSxHQUFHLEtBQUssQ0FBQztZQUN6QixJQUFNLENBQUMsR0FBRyxPQUFPLEdBQUcsSUFBSSxDQUFDO1lBQ3pCLElBQU0sRUFBRSxHQUFHLEtBQUssR0FBRyxJQUFJLENBQUM7WUFDeEIsSUFBTSxFQUFFLEdBQUcsSUFBSSxHQUFHLEdBQUcsQ0FBQztZQUV0QixJQUFJLGVBQWUsS0FBSyxDQUFDLEVBQUU7Z0JBQzFCLElBQUksU0FBUyxnQkFBa0IsSUFBSSxFQUFFLEdBQUcsQ0FBQyxFQUFFO29CQUMxQyxLQUFLLElBQUksR0FBQyxHQUFHLENBQUMsRUFBRSxHQUFDLEdBQUcsQ0FBQyxFQUFFLEdBQUMsRUFBRSxFQUFFO3dCQUMzQixLQUFLLElBQUksR0FBQyxHQUFHLENBQUMsRUFBRSxHQUFDLEdBQUcsQ0FBQyxFQUFFLEdBQUMsRUFBRSxFQUFFOzRCQUMzQixJQUFNLEdBQUcsR0FBRyxHQUFDLEdBQUcsR0FBQyxHQUFHLENBQUMsQ0FBQzs0QkFDdEIsSUFBTSxHQUFHLEdBQUcsQ0FBQyxFQUFFLEdBQUcsR0FBQyxHQUFHLENBQUMsR0FBQyxHQUFHLEVBQUUsQ0FBQyxHQUFHLEtBQUssQ0FBQyxHQUFHLENBQUMsQ0FBQzs0QkFDNUMsSUFBSSxDQUFDLEdBQUcsR0FBRyxFQUFFLENBQUMsR0FBRyxLQUFLLENBQUMsR0FBRyxDQUFDLENBQUM7eUJBQzVCO3FCQUNEO2lCQUNEO2dCQUVELElBQUksU0FBUyxzQkFBd0IsSUFBSSxFQUFFLEdBQUcsQ0FBQyxFQUFFO29CQUNoRCxLQUFLLElBQUksR0FBQyxHQUFHLENBQUMsRUFBRSxHQUFDLEdBQUcsQ0FBQyxFQUFFLEdBQUMsRUFBRSxFQUFFO3dCQUMzQixLQUFLLElBQUksR0FBQyxHQUFHLENBQUMsRUFBRSxHQUFDLEdBQUcsQ0FBQyxFQUFFLEdBQUMsRUFBRSxFQUFFOzRCQUMzQixJQUFNLEdBQUcsR0FBRyxHQUFDLEdBQUcsR0FBQyxHQUFHLENBQUMsQ0FBQzs0QkFDdEIsSUFBTSxHQUFHLEdBQUcsQ0FBQyxFQUFFLEdBQUcsR0FBQyxHQUFHLENBQUMsR0FBQyxHQUFHLEVBQUUsQ0FBQyxHQUFHLEtBQUssQ0FBQyxHQUFHLENBQUMsQ0FBQzs0QkFDNUMsSUFBTSxLQUFLLEdBQUcsS0FBSyxDQUFDLEdBQUcsQ0FBQyxDQUFDOzRCQUN6QixJQUFJLENBQUMsR0FBRyxHQUFHLENBQUMsQ0FBQyxHQUFHLEtBQUssQ0FBQzs0QkFDdEIsSUFBSSxDQUFDLEdBQUcsR0FBRyxDQUFDLENBQUMsR0FBRyxLQUFLLENBQUM7NEJBQ3RCLElBQUksQ0FBQyxHQUFHLEdBQUcsQ0FBQyxDQUFDLEdBQUcsS0FBSyxDQUFDO3lCQUN0QjtxQkFDRDtpQkFDRDthQUNEO2lCQUFNLElBQUksZUFBZSxLQUFLLENBQUMsRUFBRTtnQkFDakMsTUFBTSxJQUFJLEtBQUssQ0FBQyxzQ0FBc0MsQ0FBQyxDQUFDO2dCQUN4RCw4QkFBOEI7Z0JBQzlCLDhEQUE4RDtnQkFDOUQsMkNBQTJDO2dCQUMzQyxxQkFBcUI7Z0JBQ3JCLGlFQUFpRTthQUNqRTtpQkFBTTtnQkFDTixNQUFNLElBQUksS0FBSyxDQUFDLGtDQUFrQyxDQUFDLENBQUM7YUFDcEQ7WUFFRCxFQUFFLEVBQUUsQ0FBQztTQUNMO0tBQ0Q7SUFFRCxxQ0FBcUM7SUFFckMsT0FBTyxFQUFFLEVBQUUsSUFBQSxFQUFFLElBQUksTUFBQSxFQUFFLENBQUMsR0FBQSxFQUFFLENBQUMsR0FBQSxFQUFFLE1BQU0sRUFBRSxFQUFFLENBQUMsRUFBRSxJQUFJLEVBQUUsQ0FBQyxFQUFFLEdBQUcsRUFBRSxDQUFDLEVBQUUsS0FBSyxFQUFFLENBQUMsRUFBRSxNQUFNLEVBQUUsRUFBRSxJQUFJLE1BQUEsRUFBRSxDQUFDO0FBQ25GLENBQUM7QUFsR0Qsa0NBa0dDIiwiZmlsZSI6InBzZFJlYWRlci5qcyIsInNvdXJjZXNDb250ZW50IjpbIi8vIGltcG9ydCAqIGFzIHpsaWIgZnJvbSAnemxpYic7XG5pbXBvcnQge1xuXHRQc2QsIExheWVyLCBDb2xvck1vZGUsIFNlY3Rpb25EaXZpZGVyVHlwZSwgTGF5ZXJBZGRpdGlvbmFsSW5mbywgUmVhZE9wdGlvbnMsIExheWVyTWFza0RhdGEsIENvbG9yLFxuXHRQYXR0ZXJuSW5mbywgR2xvYmFsTGF5ZXJNYXNrSW5mb1xufSBmcm9tICcuL3BzZCc7XG5pbXBvcnQge1xuXHRyZXNldEltYWdlRGF0YSwgb2Zmc2V0Rm9yQ2hhbm5lbCwgZGVjb2RlQml0bWFwLCBQaXhlbERhdGEsIGNyZWF0ZUNhbnZhcywgY3JlYXRlSW1hZ2VEYXRhLFxuXHR0b0JsZW5kTW9kZSwgQ2hhbm5lbElELCBDb21wcmVzc2lvbiwgTGF5ZXJNYXNrRmxhZ3MsIE1hc2tQYXJhbXMsIENvbG9yU3BhY2UsIFJBV19JTUFHRV9EQVRBLCBsYXJnZUFkZGl0aW9uYWxJbmZvS2V5c1xufSBmcm9tICcuL2hlbHBlcnMnO1xuaW1wb3J0IHsgaW5mb0hhbmRsZXJzTWFwIH0gZnJvbSAnLi9hZGRpdGlvbmFsSW5mbyc7XG5pbXBvcnQgeyByZXNvdXJjZUhhbmRsZXJzTWFwIH0gZnJvbSAnLi9pbWFnZVJlc291cmNlcyc7XG5cbmludGVyZmFjZSBDaGFubmVsSW5mbyB7XG5cdGlkOiBDaGFubmVsSUQ7XG5cdGxlbmd0aDogbnVtYmVyO1xufVxuXG5pbnRlcmZhY2UgUmVhZE9wdGlvbnNFeHQgZXh0ZW5kcyBSZWFkT3B0aW9ucyB7XG5cdGxhcmdlOiBib29sZWFuO1xufVxuXG5leHBvcnQgY29uc3Qgc3VwcG9ydGVkQ29sb3JNb2RlcyA9IFtDb2xvck1vZGUuQml0bWFwLCBDb2xvck1vZGUuR3JheXNjYWxlLCBDb2xvck1vZGUuUkdCXTtcbmNvbnN0IGNvbG9yTW9kZXMgPSBbJ2JpdG1hcCcsICdncmF5c2NhbGUnLCAnaW5kZXhlZCcsICdSR0InLCAnQ01ZSycsICdtdWx0aWNoYW5uZWwnLCAnZHVvdG9uZScsICdsYWInXTtcblxuZnVuY3Rpb24gc2V0dXBHcmF5c2NhbGUoZGF0YTogUGl4ZWxEYXRhKSB7XG5cdGNvbnN0IHNpemUgPSBkYXRhLndpZHRoICogZGF0YS5oZWlnaHQgKiA0O1xuXG5cdGZvciAobGV0IGkgPSAwOyBpIDwgc2l6ZTsgaSArPSA0KSB7XG5cdFx0ZGF0YS5kYXRhW2kgKyAxXSA9IGRhdGEuZGF0YVtpXTtcblx0XHRkYXRhLmRhdGFbaSArIDJdID0gZGF0YS5kYXRhW2ldO1xuXHR9XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgUHNkUmVhZGVyIHtcblx0b2Zmc2V0OiBudW1iZXI7XG5cdHZpZXc6IERhdGFWaWV3O1xufVxuXG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlUmVhZGVyKGJ1ZmZlcjogQXJyYXlCdWZmZXIsIG9mZnNldD86IG51bWJlciwgbGVuZ3RoPzogbnVtYmVyKTogUHNkUmVhZGVyIHtcblx0Y29uc3QgdmlldyA9IG5ldyBEYXRhVmlldyhidWZmZXIsIG9mZnNldCwgbGVuZ3RoKTtcblx0cmV0dXJuIHsgdmlldywgb2Zmc2V0OiAwIH07XG59XG5cbmV4cG9ydCBmdW5jdGlvbiByZWFkVWludDgocmVhZGVyOiBQc2RSZWFkZXIpIHtcblx0cmVhZGVyLm9mZnNldCArPSAxO1xuXHRyZXR1cm4gcmVhZGVyLnZpZXcuZ2V0VWludDgocmVhZGVyLm9mZnNldCAtIDEpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gcGVla1VpbnQ4KHJlYWRlcjogUHNkUmVhZGVyKSB7XG5cdHJldHVybiByZWFkZXIudmlldy5nZXRVaW50OChyZWFkZXIub2Zmc2V0KTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHJlYWRJbnQxNihyZWFkZXI6IFBzZFJlYWRlcikge1xuXHRyZWFkZXIub2Zmc2V0ICs9IDI7XG5cdHJldHVybiByZWFkZXIudmlldy5nZXRJbnQxNihyZWFkZXIub2Zmc2V0IC0gMiwgZmFsc2UpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gcmVhZFVpbnQxNihyZWFkZXI6IFBzZFJlYWRlcikge1xuXHRyZWFkZXIub2Zmc2V0ICs9IDI7XG5cdHJldHVybiByZWFkZXIudmlldy5nZXRVaW50MTYocmVhZGVyLm9mZnNldCAtIDIsIGZhbHNlKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHJlYWRJbnQzMihyZWFkZXI6IFBzZFJlYWRlcikge1xuXHRyZWFkZXIub2Zmc2V0ICs9IDQ7XG5cdHJldHVybiByZWFkZXIudmlldy5nZXRJbnQzMihyZWFkZXIub2Zmc2V0IC0gNCwgZmFsc2UpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gcmVhZEludDMyTEUocmVhZGVyOiBQc2RSZWFkZXIpIHtcblx0cmVhZGVyLm9mZnNldCArPSA0O1xuXHRyZXR1cm4gcmVhZGVyLnZpZXcuZ2V0SW50MzIocmVhZGVyLm9mZnNldCAtIDQsIHRydWUpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gcmVhZFVpbnQzMihyZWFkZXI6IFBzZFJlYWRlcikge1xuXHRyZWFkZXIub2Zmc2V0ICs9IDQ7XG5cdHJldHVybiByZWFkZXIudmlldy5nZXRVaW50MzIocmVhZGVyLm9mZnNldCAtIDQsIGZhbHNlKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHJlYWRGbG9hdDMyKHJlYWRlcjogUHNkUmVhZGVyKSB7XG5cdHJlYWRlci5vZmZzZXQgKz0gNDtcblx0cmV0dXJuIHJlYWRlci52aWV3LmdldEZsb2F0MzIocmVhZGVyLm9mZnNldCAtIDQsIGZhbHNlKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHJlYWRGbG9hdDY0KHJlYWRlcjogUHNkUmVhZGVyKSB7XG5cdHJlYWRlci5vZmZzZXQgKz0gODtcblx0cmV0dXJuIHJlYWRlci52aWV3LmdldEZsb2F0NjQocmVhZGVyLm9mZnNldCAtIDgsIGZhbHNlKTtcbn1cblxuLy8gMzItYml0IGZpeGVkLXBvaW50IG51bWJlciAxNi4xNlxuZXhwb3J0IGZ1bmN0aW9uIHJlYWRGaXhlZFBvaW50MzIocmVhZGVyOiBQc2RSZWFkZXIpOiBudW1iZXIge1xuXHRyZXR1cm4gcmVhZEludDMyKHJlYWRlcikgLyAoMSA8PCAxNik7XG59XG5cbi8vIDMyLWJpdCBmaXhlZC1wb2ludCBudW1iZXIgOC4yNFxuZXhwb3J0IGZ1bmN0aW9uIHJlYWRGaXhlZFBvaW50UGF0aDMyKHJlYWRlcjogUHNkUmVhZGVyKTogbnVtYmVyIHtcblx0cmV0dXJuIHJlYWRJbnQzMihyZWFkZXIpIC8gKDEgPDwgMjQpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gcmVhZEJ5dGVzKHJlYWRlcjogUHNkUmVhZGVyLCBsZW5ndGg6IG51bWJlcikge1xuXHRyZWFkZXIub2Zmc2V0ICs9IGxlbmd0aDtcblx0cmV0dXJuIG5ldyBVaW50OEFycmF5KHJlYWRlci52aWV3LmJ1ZmZlciwgcmVhZGVyLnZpZXcuYnl0ZU9mZnNldCArIHJlYWRlci5vZmZzZXQgLSBsZW5ndGgsIGxlbmd0aCk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiByZWFkU2lnbmF0dXJlKHJlYWRlcjogUHNkUmVhZGVyKSB7XG5cdHJldHVybiByZWFkU2hvcnRTdHJpbmcocmVhZGVyLCA0KTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHJlYWRQYXNjYWxTdHJpbmcocmVhZGVyOiBQc2RSZWFkZXIsIHBhZFRvOiBudW1iZXIpIHtcblx0bGV0IGxlbmd0aCA9IHJlYWRVaW50OChyZWFkZXIpO1xuXHRjb25zdCB0ZXh0ID0gcmVhZFNob3J0U3RyaW5nKHJlYWRlciwgbGVuZ3RoKTtcblxuXHR3aGlsZSAoKytsZW5ndGggJSBwYWRUbykge1xuXHRcdHNraXBCeXRlcyhyZWFkZXIsIDEpO1xuXHR9XG5cblx0cmV0dXJuIHRleHQ7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiByZWFkVW5pY29kZVN0cmluZyhyZWFkZXI6IFBzZFJlYWRlcikge1xuXHRjb25zdCBsZW5ndGggPSByZWFkVWludDMyKHJlYWRlcik7XG5cdHJldHVybiByZWFkVW5pY29kZVN0cmluZ1dpdGhMZW5ndGgocmVhZGVyLCBsZW5ndGgpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gcmVhZFVuaWNvZGVTdHJpbmdXaXRoTGVuZ3RoKHJlYWRlcjogUHNkUmVhZGVyLCBsZW5ndGg6IG51bWJlcikge1xuXHRsZXQgdGV4dCA9ICcnO1xuXG5cdHdoaWxlIChsZW5ndGgtLSkge1xuXHRcdGNvbnN0IHZhbHVlID0gcmVhZFVpbnQxNihyZWFkZXIpO1xuXG5cdFx0aWYgKHZhbHVlIHx8IGxlbmd0aCA+IDApIHsgLy8gcmVtb3ZlIHRyYWlsaW5nIFxcMFxuXHRcdFx0dGV4dCArPSBTdHJpbmcuZnJvbUNoYXJDb2RlKHZhbHVlKTtcblx0XHR9XG5cdH1cblxuXHRyZXR1cm4gdGV4dDtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHJlYWRBc2NpaVN0cmluZyhyZWFkZXI6IFBzZFJlYWRlciwgbGVuZ3RoOiBudW1iZXIpIHtcblx0bGV0IHRleHQgPSAnJztcblxuXHR3aGlsZSAobGVuZ3RoLS0pIHtcblx0XHR0ZXh0ICs9IFN0cmluZy5mcm9tQ2hhckNvZGUocmVhZFVpbnQ4KHJlYWRlcikpO1xuXHR9XG5cblx0cmV0dXJuIHRleHQ7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBza2lwQnl0ZXMocmVhZGVyOiBQc2RSZWFkZXIsIGNvdW50OiBudW1iZXIpIHtcblx0cmVhZGVyLm9mZnNldCArPSBjb3VudDtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGNoZWNrU2lnbmF0dXJlKHJlYWRlcjogUHNkUmVhZGVyLCBhOiBzdHJpbmcsIGI/OiBzdHJpbmcpIHtcblx0Y29uc3Qgb2Zmc2V0ID0gcmVhZGVyLm9mZnNldDtcblx0Y29uc3Qgc2lnbmF0dXJlID0gcmVhZFNpZ25hdHVyZShyZWFkZXIpO1xuXG5cdGlmIChzaWduYXR1cmUgIT09IGEgJiYgc2lnbmF0dXJlICE9PSBiKSB7XG5cdFx0dGhyb3cgbmV3IEVycm9yKGBJbnZhbGlkIHNpZ25hdHVyZTogJyR7c2lnbmF0dXJlfScgYXQgMHgke29mZnNldC50b1N0cmluZygxNil9YCk7XG5cdH1cbn1cblxuZnVuY3Rpb24gcmVhZFNob3J0U3RyaW5nKHJlYWRlcjogUHNkUmVhZGVyLCBsZW5ndGg6IG51bWJlcikge1xuXHRjb25zdCBidWZmZXI6IGFueSA9IHJlYWRCeXRlcyhyZWFkZXIsIGxlbmd0aCk7XG5cdHJldHVybiBTdHJpbmcuZnJvbUNoYXJDb2RlKC4uLmJ1ZmZlcik7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiByZWFkUHNkKHJlYWRlcjogUHNkUmVhZGVyLCBvcHRpb25zOiBSZWFkT3B0aW9ucyA9IHt9KSB7XG5cdC8vIGhlYWRlclxuXHRjaGVja1NpZ25hdHVyZShyZWFkZXIsICc4QlBTJyk7XG5cdGNvbnN0IHZlcnNpb24gPSByZWFkVWludDE2KHJlYWRlcik7XG5cdGlmICh2ZXJzaW9uICE9PSAxICYmIHZlcnNpb24gIT09IDIpIHRocm93IG5ldyBFcnJvcihgSW52YWxpZCBQU0QgZmlsZSB2ZXJzaW9uOiAke3ZlcnNpb259YCk7XG5cblx0c2tpcEJ5dGVzKHJlYWRlciwgNik7XG5cdGNvbnN0IGNoYW5uZWxzID0gcmVhZFVpbnQxNihyZWFkZXIpO1xuXHRjb25zdCBoZWlnaHQgPSByZWFkVWludDMyKHJlYWRlcik7XG5cdGNvbnN0IHdpZHRoID0gcmVhZFVpbnQzMihyZWFkZXIpO1xuXHRjb25zdCBiaXRzUGVyQ2hhbm5lbCA9IHJlYWRVaW50MTYocmVhZGVyKTtcblx0Y29uc3QgY29sb3JNb2RlID0gcmVhZFVpbnQxNihyZWFkZXIpO1xuXG5cdGlmIChzdXBwb3J0ZWRDb2xvck1vZGVzLmluZGV4T2YoY29sb3JNb2RlKSA9PT0gLTEpXG5cdFx0dGhyb3cgbmV3IEVycm9yKGBDb2xvciBtb2RlIG5vdCBzdXBwb3J0ZWQ6ICR7Y29sb3JNb2Rlc1tjb2xvck1vZGVdID8/IGNvbG9yTW9kZX1gKTtcblxuXHRjb25zdCBwc2Q6IFBzZCA9IHsgd2lkdGgsIGhlaWdodCwgY2hhbm5lbHMsIGJpdHNQZXJDaGFubmVsLCBjb2xvck1vZGUgfTtcblx0Y29uc3Qgb3B0OiBSZWFkT3B0aW9uc0V4dCA9IHsgLi4ub3B0aW9ucywgbGFyZ2U6IHZlcnNpb24gPT09IDIgfTtcblxuXHQvLyBjb2xvciBtb2RlIGRhdGFcblx0cmVhZFNlY3Rpb24ocmVhZGVyLCAxLCBsZWZ0ID0+IHtcblx0XHRpZiAob3B0LnRocm93Rm9yTWlzc2luZ0ZlYXR1cmVzKSB0aHJvdyBuZXcgRXJyb3IoJ0NvbG9yIG1vZGUgZGF0YSBub3Qgc3VwcG9ydGVkJyk7XG5cdFx0c2tpcEJ5dGVzKHJlYWRlciwgbGVmdCgpKTtcblx0fSk7XG5cblx0Ly8gaW1hZ2UgcmVzb3VyY2VzXG5cdHJlYWRTZWN0aW9uKHJlYWRlciwgMSwgbGVmdCA9PiB7XG5cdFx0d2hpbGUgKGxlZnQoKSkge1xuXHRcdFx0Y2hlY2tTaWduYXR1cmUocmVhZGVyLCAnOEJJTScpO1xuXG5cdFx0XHRjb25zdCBpZCA9IHJlYWRVaW50MTYocmVhZGVyKTtcblx0XHRcdHJlYWRQYXNjYWxTdHJpbmcocmVhZGVyLCAyKTsgLy8gbmFtZVxuXG5cdFx0XHRyZWFkU2VjdGlvbihyZWFkZXIsIDIsIGxlZnQgPT4ge1xuXHRcdFx0XHRjb25zdCBoYW5kbGVyID0gcmVzb3VyY2VIYW5kbGVyc01hcFtpZF07XG5cdFx0XHRcdGNvbnN0IHNraXAgPSBpZCA9PT0gMTAzNiAmJiAhIW9wdC5za2lwVGh1bWJuYWlsO1xuXG5cdFx0XHRcdGlmICghcHNkLmltYWdlUmVzb3VyY2VzKSB7XG5cdFx0XHRcdFx0cHNkLmltYWdlUmVzb3VyY2VzID0ge307XG5cdFx0XHRcdH1cblxuXHRcdFx0XHRpZiAoaGFuZGxlciAmJiAhc2tpcCkge1xuXHRcdFx0XHRcdHRyeSB7XG5cdFx0XHRcdFx0XHRoYW5kbGVyLnJlYWQocmVhZGVyLCBwc2QuaW1hZ2VSZXNvdXJjZXMsIGxlZnQsIG9wdCk7XG5cdFx0XHRcdFx0fSBjYXRjaCAoZSkge1xuXHRcdFx0XHRcdFx0aWYgKG9wdC50aHJvd0Zvck1pc3NpbmdGZWF0dXJlcykgdGhyb3cgZTtcblx0XHRcdFx0XHRcdHNraXBCeXRlcyhyZWFkZXIsIGxlZnQoKSk7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdC8vIG9wdGlvbnMubG9nTWlzc2luZ0ZlYXR1cmVzICYmIGNvbnNvbGUubG9nKGBVbmhhbmRsZWQgaW1hZ2UgcmVzb3VyY2U6ICR7aWR9YCk7XG5cdFx0XHRcdFx0c2tpcEJ5dGVzKHJlYWRlciwgbGVmdCgpKTtcblx0XHRcdFx0fVxuXHRcdFx0fSk7XG5cdFx0fVxuXHR9KTtcblxuXHQvLyBsYXllciBhbmQgbWFzayBpbmZvXG5cdGxldCBnbG9iYWxBbHBoYSA9IGZhbHNlO1xuXG5cdHJlYWRTZWN0aW9uKHJlYWRlciwgMSwgbGVmdCA9PiB7XG5cdFx0Z2xvYmFsQWxwaGEgPSByZWFkTGF5ZXJJbmZvKHJlYWRlciwgcHNkLCBvcHQpO1xuXG5cdFx0Ly8gU0FJIGRvZXMgbm90IGluY2x1ZGUgdGhpcyBzZWN0aW9uXG5cdFx0aWYgKGxlZnQoKSA+IDApIHtcblx0XHRcdGNvbnN0IGdsb2JhbExheWVyTWFza0luZm8gPSByZWFkR2xvYmFsTGF5ZXJNYXNrSW5mbyhyZWFkZXIpO1xuXHRcdFx0aWYgKGdsb2JhbExheWVyTWFza0luZm8pIHBzZC5nbG9iYWxMYXllck1hc2tJbmZvID0gZ2xvYmFsTGF5ZXJNYXNrSW5mbztcblx0XHR9IGVsc2Uge1xuXHRcdFx0Ly8gcmV2ZXJ0IGJhY2sgdG8gZW5kIG9mIHNlY3Rpb24gaWYgZXhjZWVkZWQgc2VjdGlvbiBsaW1pdHNcblx0XHRcdC8vIG9wdC5sb2dNaXNzaW5nRmVhdHVyZXMgJiYgY29uc29sZS5sb2coJ3JldmVydGluZyB0byBlbmQgb2Ygc2VjdGlvbicpO1xuXHRcdFx0c2tpcEJ5dGVzKHJlYWRlciwgbGVmdCgpKTtcblx0XHR9XG5cblx0XHR3aGlsZSAobGVmdCgpID4gMCkge1xuXHRcdFx0Ly8gc29tZXRpbWVzIHRoZXJlIGFyZSBlbXB0eSBieXRlcyBoZXJlXG5cdFx0XHR3aGlsZSAobGVmdCgpICYmIHBlZWtVaW50OChyZWFkZXIpID09PSAwKSB7XG5cdFx0XHRcdC8vIG9wdC5sb2dNaXNzaW5nRmVhdHVyZXMgJiYgY29uc29sZS5sb2coJ3NraXBwaW5nIDAgYnl0ZScpO1xuXHRcdFx0XHRza2lwQnl0ZXMocmVhZGVyLCAxKTtcblx0XHRcdH1cblxuXHRcdFx0aWYgKGxlZnQoKSA+PSAxMikge1xuXHRcdFx0XHRyZWFkQWRkaXRpb25hbExheWVySW5mbyhyZWFkZXIsIHBzZCwgcHNkLCBvcHQpO1xuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0Ly8gb3B0LmxvZ01pc3NpbmdGZWF0dXJlcyAmJiBjb25zb2xlLmxvZygnc2tpcHBpbmcgbGVmdG92ZXIgYnl0ZXMnLCBsZWZ0KCkpO1xuXHRcdFx0XHRza2lwQnl0ZXMocmVhZGVyLCBsZWZ0KCkpO1xuXHRcdFx0fVxuXHRcdH1cblx0fSwgdW5kZWZpbmVkLCBvcHQubGFyZ2UpO1xuXG5cdGNvbnN0IGhhc0NoaWxkcmVuID0gcHNkLmNoaWxkcmVuICYmIHBzZC5jaGlsZHJlbi5sZW5ndGg7XG5cdGNvbnN0IHNraXBDb21wb3NpdGUgPSBvcHQuc2tpcENvbXBvc2l0ZUltYWdlRGF0YSAmJiAob3B0LnNraXBMYXllckltYWdlRGF0YSB8fCBoYXNDaGlsZHJlbik7XG5cblx0aWYgKCFza2lwQ29tcG9zaXRlKSB7XG5cdFx0cmVhZEltYWdlRGF0YShyZWFkZXIsIHBzZCwgZ2xvYmFsQWxwaGEsIG9wdCk7XG5cdH1cblxuXHRyZXR1cm4gcHNkO1xufVxuXG5mdW5jdGlvbiByZWFkTGF5ZXJJbmZvKHJlYWRlcjogUHNkUmVhZGVyLCBwc2Q6IFBzZCwgb3B0aW9uczogUmVhZE9wdGlvbnNFeHQpIHtcblx0bGV0IGdsb2JhbEFscGhhID0gZmFsc2U7XG5cblx0cmVhZFNlY3Rpb24ocmVhZGVyLCAyLCBsZWZ0ID0+IHtcblx0XHRsZXQgbGF5ZXJDb3VudCA9IHJlYWRJbnQxNihyZWFkZXIpO1xuXG5cdFx0aWYgKGxheWVyQ291bnQgPCAwKSB7XG5cdFx0XHRnbG9iYWxBbHBoYSA9IHRydWU7XG5cdFx0XHRsYXllckNvdW50ID0gLWxheWVyQ291bnQ7XG5cdFx0fVxuXG5cdFx0Y29uc3QgbGF5ZXJzOiBMYXllcltdID0gW107XG5cdFx0Y29uc3QgbGF5ZXJDaGFubmVsczogQ2hhbm5lbEluZm9bXVtdID0gW107XG5cblx0XHRmb3IgKGxldCBpID0gMDsgaSA8IGxheWVyQ291bnQ7IGkrKykge1xuXHRcdFx0Y29uc3QgeyBsYXllciwgY2hhbm5lbHMgfSA9IHJlYWRMYXllclJlY29yZChyZWFkZXIsIHBzZCwgb3B0aW9ucyk7XG5cdFx0XHRsYXllcnMucHVzaChsYXllcik7XG5cdFx0XHRsYXllckNoYW5uZWxzLnB1c2goY2hhbm5lbHMpO1xuXHRcdH1cblxuXHRcdGlmICghb3B0aW9ucy5za2lwTGF5ZXJJbWFnZURhdGEpIHtcblx0XHRcdGZvciAobGV0IGkgPSAwOyBpIDwgbGF5ZXJDb3VudDsgaSsrKSB7XG5cdFx0XHRcdHJlYWRMYXllckNoYW5uZWxJbWFnZURhdGEocmVhZGVyLCBwc2QsIGxheWVyc1tpXSwgbGF5ZXJDaGFubmVsc1tpXSwgb3B0aW9ucyk7XG5cdFx0XHR9XG5cdFx0fVxuXG5cdFx0c2tpcEJ5dGVzKHJlYWRlciwgbGVmdCgpKTtcblxuXHRcdGlmICghcHNkLmNoaWxkcmVuKSBwc2QuY2hpbGRyZW4gPSBbXTtcblxuXHRcdGNvbnN0IHN0YWNrOiAoTGF5ZXIgfCBQc2QpW10gPSBbcHNkXTtcblxuXHRcdGZvciAobGV0IGkgPSBsYXllcnMubGVuZ3RoIC0gMTsgaSA+PSAwOyBpLS0pIHtcblx0XHRcdGNvbnN0IGwgPSBsYXllcnNbaV07XG5cdFx0XHRjb25zdCB0eXBlID0gbC5zZWN0aW9uRGl2aWRlciA/IGwuc2VjdGlvbkRpdmlkZXIudHlwZSA6IFNlY3Rpb25EaXZpZGVyVHlwZS5PdGhlcjtcblxuXHRcdFx0aWYgKHR5cGUgPT09IFNlY3Rpb25EaXZpZGVyVHlwZS5PcGVuRm9sZGVyIHx8IHR5cGUgPT09IFNlY3Rpb25EaXZpZGVyVHlwZS5DbG9zZWRGb2xkZXIpIHtcblx0XHRcdFx0bC5vcGVuZWQgPSB0eXBlID09PSBTZWN0aW9uRGl2aWRlclR5cGUuT3BlbkZvbGRlcjtcblx0XHRcdFx0bC5jaGlsZHJlbiA9IFtdO1xuXHRcdFx0XHRzdGFja1tzdGFjay5sZW5ndGggLSAxXS5jaGlsZHJlbiEudW5zaGlmdChsKTtcblx0XHRcdFx0c3RhY2sucHVzaChsKTtcblx0XHRcdH0gZWxzZSBpZiAodHlwZSA9PT0gU2VjdGlvbkRpdmlkZXJUeXBlLkJvdW5kaW5nU2VjdGlvbkRpdmlkZXIpIHtcblx0XHRcdFx0c3RhY2sucG9wKCk7XG5cdFx0XHR9IGVsc2UgaWYgKGwubmFtZSA9PT0gJzwvTGF5ZXIgZ3JvdXA+JyAmJiAhbC5zZWN0aW9uRGl2aWRlciAmJiAhbC50b3AgJiYgIWwubGVmdCAmJiAhbC5ib3R0b20gJiYgIWwucmlnaHQpIHtcblx0XHRcdFx0Ly8gc29tZXRpbWVzIGxheWVyIGdyb3VwIHRlcm1pbmF0b3IgZG9lc24ndCBoYXZlIHNlY3Rpb25EaXZpZGVyLCBzbyB3ZSBqdXN0IGd1ZXNzIGhlcmUgKFBTIGJ1ZyA/KVxuXHRcdFx0XHRzdGFjay5wb3AoKTtcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdHN0YWNrW3N0YWNrLmxlbmd0aCAtIDFdLmNoaWxkcmVuIS51bnNoaWZ0KGwpO1xuXHRcdFx0fVxuXHRcdH1cblx0fSwgdW5kZWZpbmVkLCBvcHRpb25zLmxhcmdlKTtcblxuXHRyZXR1cm4gZ2xvYmFsQWxwaGE7XG59XG5cbmZ1bmN0aW9uIHJlYWRMYXllclJlY29yZChyZWFkZXI6IFBzZFJlYWRlciwgcHNkOiBQc2QsIG9wdGlvbnM6IFJlYWRPcHRpb25zRXh0KSB7XG5cdGNvbnN0IGxheWVyOiBMYXllciA9IHt9O1xuXHRsYXllci50b3AgPSByZWFkSW50MzIocmVhZGVyKTtcblx0bGF5ZXIubGVmdCA9IHJlYWRJbnQzMihyZWFkZXIpO1xuXHRsYXllci5ib3R0b20gPSByZWFkSW50MzIocmVhZGVyKTtcblx0bGF5ZXIucmlnaHQgPSByZWFkSW50MzIocmVhZGVyKTtcblxuXHRjb25zdCBjaGFubmVsQ291bnQgPSByZWFkVWludDE2KHJlYWRlcik7XG5cdGNvbnN0IGNoYW5uZWxzOiBDaGFubmVsSW5mb1tdID0gW107XG5cblx0Zm9yIChsZXQgaSA9IDA7IGkgPCBjaGFubmVsQ291bnQ7IGkrKykge1xuXHRcdGxldCBjaGFubmVsSUQgPSByZWFkSW50MTYocmVhZGVyKSBhcyBDaGFubmVsSUQ7XG5cdFx0bGV0IGNoYW5uZWxMZW5ndGggPSByZWFkVWludDMyKHJlYWRlcik7XG5cblx0XHRpZiAob3B0aW9ucy5sYXJnZSkge1xuXHRcdFx0aWYgKGNoYW5uZWxMZW5ndGggIT09IDApIHRocm93IG5ldyBFcnJvcignU2l6ZXMgbGFyZ2VyIHRoYW4gNEdCIGFyZSBub3Qgc3VwcG9ydGVkJyk7XG5cdFx0XHRjaGFubmVsTGVuZ3RoID0gcmVhZFVpbnQzMihyZWFkZXIpO1xuXHRcdH1cblxuXHRcdGNoYW5uZWxzLnB1c2goeyBpZDogY2hhbm5lbElELCBsZW5ndGg6IGNoYW5uZWxMZW5ndGggfSk7XG5cdH1cblxuXHRjaGVja1NpZ25hdHVyZShyZWFkZXIsICc4QklNJyk7XG5cdGNvbnN0IGJsZW5kTW9kZSA9IHJlYWRTaWduYXR1cmUocmVhZGVyKTtcblx0aWYgKCF0b0JsZW5kTW9kZVtibGVuZE1vZGVdKSB0aHJvdyBuZXcgRXJyb3IoYEludmFsaWQgYmxlbmQgbW9kZTogJyR7YmxlbmRNb2RlfSdgKTtcblx0bGF5ZXIuYmxlbmRNb2RlID0gdG9CbGVuZE1vZGVbYmxlbmRNb2RlXTtcblxuXHRsYXllci5vcGFjaXR5ID0gcmVhZFVpbnQ4KHJlYWRlcikgLyAweGZmO1xuXHRsYXllci5jbGlwcGluZyA9IHJlYWRVaW50OChyZWFkZXIpID09PSAxO1xuXG5cdGNvbnN0IGZsYWdzID0gcmVhZFVpbnQ4KHJlYWRlcik7XG5cdGxheWVyLnRyYW5zcGFyZW5jeVByb3RlY3RlZCA9IChmbGFncyAmIDB4MDEpICE9PSAwO1xuXHRsYXllci5oaWRkZW4gPSAoZmxhZ3MgJiAweDAyKSAhPT0gMDtcblx0Ly8gMHgwNCAtIG9ic29sZXRlXG5cdC8vIDB4MDggLSAxIGZvciBQaG90b3Nob3AgNS4wIGFuZCBsYXRlciwgdGVsbHMgaWYgYml0IDQgaGFzIHVzZWZ1bCBpbmZvcm1hdGlvblxuXHQvLyAweDEwIC0gcGl4ZWwgZGF0YSBpcnJlbGV2YW50IHRvIGFwcGVhcmFuY2Ugb2YgZG9jdW1lbnRcblxuXHRza2lwQnl0ZXMocmVhZGVyLCAxKTtcblxuXHRyZWFkU2VjdGlvbihyZWFkZXIsIDEsIGxlZnQgPT4ge1xuXHRcdGNvbnN0IG1hc2sgPSByZWFkTGF5ZXJNYXNrRGF0YShyZWFkZXIsIG9wdGlvbnMpO1xuXHRcdGlmIChtYXNrKSBsYXllci5tYXNrID0gbWFzaztcblxuXHRcdC8qY29uc3QgYmxlbmRpbmdSYW5nZXMgPSovIHJlYWRMYXllckJsZW5kaW5nUmFuZ2VzKHJlYWRlcik7XG5cdFx0bGF5ZXIubmFtZSA9IHJlYWRQYXNjYWxTdHJpbmcocmVhZGVyLCA0KTtcblxuXHRcdHdoaWxlIChsZWZ0KCkpIHtcblx0XHRcdHJlYWRBZGRpdGlvbmFsTGF5ZXJJbmZvKHJlYWRlciwgbGF5ZXIsIHBzZCwgb3B0aW9ucyk7XG5cdFx0fVxuXHR9KTtcblxuXHRyZXR1cm4geyBsYXllciwgY2hhbm5lbHMgfTtcbn1cblxuZnVuY3Rpb24gcmVhZExheWVyTWFza0RhdGEocmVhZGVyOiBQc2RSZWFkZXIsIG9wdGlvbnM6IFJlYWRPcHRpb25zKSB7XG5cdHJldHVybiByZWFkU2VjdGlvbjxMYXllck1hc2tEYXRhIHwgdW5kZWZpbmVkPihyZWFkZXIsIDEsIGxlZnQgPT4ge1xuXHRcdGlmICghbGVmdCgpKSByZXR1cm4gdW5kZWZpbmVkO1xuXG5cdFx0Y29uc3QgbWFzazogTGF5ZXJNYXNrRGF0YSA9IHt9O1xuXHRcdG1hc2sudG9wID0gcmVhZEludDMyKHJlYWRlcik7XG5cdFx0bWFzay5sZWZ0ID0gcmVhZEludDMyKHJlYWRlcik7XG5cdFx0bWFzay5ib3R0b20gPSByZWFkSW50MzIocmVhZGVyKTtcblx0XHRtYXNrLnJpZ2h0ID0gcmVhZEludDMyKHJlYWRlcik7XG5cdFx0bWFzay5kZWZhdWx0Q29sb3IgPSByZWFkVWludDgocmVhZGVyKTtcblxuXHRcdGNvbnN0IGZsYWdzID0gcmVhZFVpbnQ4KHJlYWRlcik7XG5cdFx0bWFzay5wb3NpdGlvblJlbGF0aXZlVG9MYXllciA9IChmbGFncyAmIExheWVyTWFza0ZsYWdzLlBvc2l0aW9uUmVsYXRpdmVUb0xheWVyKSAhPT0gMDtcblx0XHRtYXNrLmRpc2FibGVkID0gKGZsYWdzICYgTGF5ZXJNYXNrRmxhZ3MuTGF5ZXJNYXNrRGlzYWJsZWQpICE9PSAwO1xuXHRcdG1hc2suZnJvbVZlY3RvckRhdGEgPSAoZmxhZ3MgJiBMYXllck1hc2tGbGFncy5MYXllck1hc2tGcm9tUmVuZGVyaW5nT3RoZXJEYXRhKSAhPT0gMDtcblxuXHRcdGlmIChmbGFncyAmIExheWVyTWFza0ZsYWdzLk1hc2tIYXNQYXJhbWV0ZXJzQXBwbGllZFRvSXQpIHtcblx0XHRcdGNvbnN0IHBhcmFtcyA9IHJlYWRVaW50OChyZWFkZXIpO1xuXHRcdFx0aWYgKHBhcmFtcyAmIE1hc2tQYXJhbXMuVXNlck1hc2tEZW5zaXR5KSBtYXNrLnVzZXJNYXNrRGVuc2l0eSA9IHJlYWRVaW50OChyZWFkZXIpIC8gMHhmZjtcblx0XHRcdGlmIChwYXJhbXMgJiBNYXNrUGFyYW1zLlVzZXJNYXNrRmVhdGhlcikgbWFzay51c2VyTWFza0ZlYXRoZXIgPSByZWFkRmxvYXQ2NChyZWFkZXIpO1xuXHRcdFx0aWYgKHBhcmFtcyAmIE1hc2tQYXJhbXMuVmVjdG9yTWFza0RlbnNpdHkpIG1hc2sudmVjdG9yTWFza0RlbnNpdHkgPSByZWFkVWludDgocmVhZGVyKSAvIDB4ZmY7XG5cdFx0XHRpZiAocGFyYW1zICYgTWFza1BhcmFtcy5WZWN0b3JNYXNrRmVhdGhlcikgbWFzay52ZWN0b3JNYXNrRmVhdGhlciA9IHJlYWRGbG9hdDY0KHJlYWRlcik7XG5cdFx0fVxuXG5cdFx0aWYgKGxlZnQoKSA+IDIpIHtcblx0XHRcdG9wdGlvbnMubG9nTWlzc2luZ0ZlYXR1cmVzICYmIGNvbnNvbGUubG9nKCdVbmhhbmRsZWQgZXh0cmEgbWFzayBwYXJhbXMnKTtcblx0XHRcdC8vIFRPRE86IGhhbmRsZSB0aGVzZSB2YWx1ZXNcblx0XHRcdC8qY29uc3QgcmVhbEZsYWdzID0qLyByZWFkVWludDgocmVhZGVyKTtcblx0XHRcdC8qY29uc3QgcmVhbFVzZXJNYXNrQmFja2dyb3VuZCA9Ki8gcmVhZFVpbnQ4KHJlYWRlcik7XG5cdFx0XHQvKmNvbnN0IHRvcDIgPSovIHJlYWRJbnQzMihyZWFkZXIpO1xuXHRcdFx0Lypjb25zdCBsZWZ0MiA9Ki8gcmVhZEludDMyKHJlYWRlcik7XG5cdFx0XHQvKmNvbnN0IGJvdHRvbTIgPSovIHJlYWRJbnQzMihyZWFkZXIpO1xuXHRcdFx0Lypjb25zdCByaWdodDIgPSovIHJlYWRJbnQzMihyZWFkZXIpO1xuXHRcdH1cblxuXHRcdHNraXBCeXRlcyhyZWFkZXIsIGxlZnQoKSk7XG5cdFx0cmV0dXJuIG1hc2s7XG5cdH0pO1xufVxuXG5mdW5jdGlvbiByZWFkTGF5ZXJCbGVuZGluZ1JhbmdlcyhyZWFkZXI6IFBzZFJlYWRlcikge1xuXHRyZXR1cm4gcmVhZFNlY3Rpb24ocmVhZGVyLCAxLCBsZWZ0ID0+IHtcblx0XHRjb25zdCBjb21wb3NpdGVHcmF5QmxlbmRTb3VyY2UgPSByZWFkVWludDMyKHJlYWRlcik7XG5cdFx0Y29uc3QgY29tcG9zaXRlR3JhcGhCbGVuZERlc3RpbmF0aW9uUmFuZ2UgPSByZWFkVWludDMyKHJlYWRlcik7XG5cdFx0Y29uc3QgcmFuZ2VzID0gW107XG5cblx0XHR3aGlsZSAobGVmdCgpKSB7XG5cdFx0XHRjb25zdCBzb3VyY2VSYW5nZSA9IHJlYWRVaW50MzIocmVhZGVyKTtcblx0XHRcdGNvbnN0IGRlc3RSYW5nZSA9IHJlYWRVaW50MzIocmVhZGVyKTtcblx0XHRcdHJhbmdlcy5wdXNoKHsgc291cmNlUmFuZ2UsIGRlc3RSYW5nZSB9KTtcblx0XHR9XG5cblx0XHRyZXR1cm4geyBjb21wb3NpdGVHcmF5QmxlbmRTb3VyY2UsIGNvbXBvc2l0ZUdyYXBoQmxlbmREZXN0aW5hdGlvblJhbmdlLCByYW5nZXMgfTtcblx0fSk7XG59XG5cbmZ1bmN0aW9uIHJlYWRMYXllckNoYW5uZWxJbWFnZURhdGEoXG5cdHJlYWRlcjogUHNkUmVhZGVyLCBwc2Q6IFBzZCwgbGF5ZXI6IExheWVyLCBjaGFubmVsczogQ2hhbm5lbEluZm9bXSwgb3B0aW9uczogUmVhZE9wdGlvbnNFeHRcbikge1xuXHRjb25zdCBsYXllcldpZHRoID0gKGxheWVyLnJpZ2h0IHx8IDApIC0gKGxheWVyLmxlZnQgfHwgMCk7XG5cdGNvbnN0IGxheWVySGVpZ2h0ID0gKGxheWVyLmJvdHRvbSB8fCAwKSAtIChsYXllci50b3AgfHwgMCk7XG5cblx0bGV0IGltYWdlRGF0YTogSW1hZ2VEYXRhIHwgdW5kZWZpbmVkO1xuXG5cdGlmIChsYXllcldpZHRoICYmIGxheWVySGVpZ2h0KSB7XG5cdFx0aW1hZ2VEYXRhID0gY3JlYXRlSW1hZ2VEYXRhKGxheWVyV2lkdGgsIGxheWVySGVpZ2h0KTtcblx0XHRyZXNldEltYWdlRGF0YShpbWFnZURhdGEpO1xuXHR9XG5cblx0aWYgKFJBV19JTUFHRV9EQVRBKSB7XG5cdFx0KGxheWVyIGFzIGFueSkuaW1hZ2VEYXRhUmF3ID0gW107XG5cdH1cblxuXHRmb3IgKGNvbnN0IGNoYW5uZWwgb2YgY2hhbm5lbHMpIHtcblx0XHRjb25zdCBjb21wcmVzc2lvbiA9IHJlYWRVaW50MTYocmVhZGVyKSBhcyBDb21wcmVzc2lvbjtcblxuXHRcdGlmIChjaGFubmVsLmlkID09PSBDaGFubmVsSUQuVXNlck1hc2spIHtcblx0XHRcdGNvbnN0IG1hc2sgPSBsYXllci5tYXNrO1xuXG5cdFx0XHRpZiAoIW1hc2spIHRocm93IG5ldyBFcnJvcihgTWlzc2luZyBsYXllciBtYXNrIGRhdGFgKTtcblxuXHRcdFx0Y29uc3QgbWFza1dpZHRoID0gKG1hc2sucmlnaHQgfHwgMCkgLSAobWFzay5sZWZ0IHx8IDApO1xuXHRcdFx0Y29uc3QgbWFza0hlaWdodCA9IChtYXNrLmJvdHRvbSB8fCAwKSAtIChtYXNrLnRvcCB8fCAwKTtcblxuXHRcdFx0aWYgKG1hc2tXaWR0aCAmJiBtYXNrSGVpZ2h0KSB7XG5cdFx0XHRcdGNvbnN0IG1hc2tEYXRhID0gY3JlYXRlSW1hZ2VEYXRhKG1hc2tXaWR0aCwgbWFza0hlaWdodCk7XG5cdFx0XHRcdHJlc2V0SW1hZ2VEYXRhKG1hc2tEYXRhKTtcblxuXHRcdFx0XHRjb25zdCBzdGFydCA9IHJlYWRlci5vZmZzZXQ7XG5cdFx0XHRcdHJlYWREYXRhKHJlYWRlciwgbWFza0RhdGEsIGNvbXByZXNzaW9uLCBtYXNrV2lkdGgsIG1hc2tIZWlnaHQsIDAsIG9wdGlvbnMubGFyZ2UpO1xuXG5cdFx0XHRcdGlmIChSQVdfSU1BR0VfREFUQSkge1xuXHRcdFx0XHRcdChsYXllciBhcyBhbnkpLm1hc2tEYXRhUmF3ID0gbmV3IFVpbnQ4QXJyYXkocmVhZGVyLnZpZXcuYnVmZmVyLCByZWFkZXIudmlldy5ieXRlT2Zmc2V0ICsgc3RhcnQsIHJlYWRlci5vZmZzZXQgLSBzdGFydCk7XG5cdFx0XHRcdH1cblxuXHRcdFx0XHRzZXR1cEdyYXlzY2FsZShtYXNrRGF0YSk7XG5cblx0XHRcdFx0aWYgKG9wdGlvbnMudXNlSW1hZ2VEYXRhKSB7XG5cdFx0XHRcdFx0bWFzay5pbWFnZURhdGEgPSBtYXNrRGF0YTtcblx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHRtYXNrLmNhbnZhcyA9IGNyZWF0ZUNhbnZhcyhtYXNrV2lkdGgsIG1hc2tIZWlnaHQpO1xuXHRcdFx0XHRcdG1hc2suY2FudmFzLmdldENvbnRleHQoJzJkJykhLnB1dEltYWdlRGF0YShtYXNrRGF0YSwgMCwgMCk7XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHR9IGVsc2Uge1xuXHRcdFx0Y29uc3Qgb2Zmc2V0ID0gb2Zmc2V0Rm9yQ2hhbm5lbChjaGFubmVsLmlkKTtcblx0XHRcdGxldCB0YXJnZXREYXRhID0gaW1hZ2VEYXRhO1xuXG5cdFx0XHRpZiAob2Zmc2V0IDwgMCkge1xuXHRcdFx0XHR0YXJnZXREYXRhID0gdW5kZWZpbmVkO1xuXG5cdFx0XHRcdGlmIChvcHRpb25zLnRocm93Rm9yTWlzc2luZ0ZlYXR1cmVzKSB7XG5cdFx0XHRcdFx0dGhyb3cgbmV3IEVycm9yKGBDaGFubmVsIG5vdCBzdXBwb3J0ZWQ6ICR7Y2hhbm5lbC5pZH1gKTtcblx0XHRcdFx0fVxuXHRcdFx0fVxuXG5cdFx0XHRjb25zdCBzdGFydCA9IHJlYWRlci5vZmZzZXQ7XG5cdFx0XHRyZWFkRGF0YShyZWFkZXIsIHRhcmdldERhdGEsIGNvbXByZXNzaW9uLCBsYXllcldpZHRoLCBsYXllckhlaWdodCwgb2Zmc2V0LCBvcHRpb25zLmxhcmdlKTtcblxuXHRcdFx0aWYgKFJBV19JTUFHRV9EQVRBKSB7XG5cdFx0XHRcdChsYXllciBhcyBhbnkpLmltYWdlRGF0YVJhd1tjaGFubmVsLmlkXSA9IG5ldyBVaW50OEFycmF5KHJlYWRlci52aWV3LmJ1ZmZlciwgcmVhZGVyLnZpZXcuYnl0ZU9mZnNldCArIHN0YXJ0LCByZWFkZXIub2Zmc2V0IC0gc3RhcnQpO1xuXHRcdFx0fVxuXG5cdFx0XHRpZiAodGFyZ2V0RGF0YSAmJiBwc2QuY29sb3JNb2RlID09PSBDb2xvck1vZGUuR3JheXNjYWxlKSB7XG5cdFx0XHRcdHNldHVwR3JheXNjYWxlKHRhcmdldERhdGEpO1xuXHRcdFx0fVxuXHRcdH1cblx0fVxuXG5cdGlmIChpbWFnZURhdGEpIHtcblx0XHRpZiAob3B0aW9ucy51c2VJbWFnZURhdGEpIHtcblx0XHRcdGxheWVyLmltYWdlRGF0YSA9IGltYWdlRGF0YTtcblx0XHR9IGVsc2Uge1xuXHRcdFx0bGF5ZXIuY2FudmFzID0gY3JlYXRlQ2FudmFzKGxheWVyV2lkdGgsIGxheWVySGVpZ2h0KTtcblx0XHRcdGxheWVyLmNhbnZhcy5nZXRDb250ZXh0KCcyZCcpIS5wdXRJbWFnZURhdGEoaW1hZ2VEYXRhLCAwLCAwKTtcblx0XHR9XG5cdH1cbn1cblxuZnVuY3Rpb24gcmVhZERhdGEoXG5cdHJlYWRlcjogUHNkUmVhZGVyLCBkYXRhOiBJbWFnZURhdGEgfCB1bmRlZmluZWQsIGNvbXByZXNzaW9uOiBDb21wcmVzc2lvbiwgd2lkdGg6IG51bWJlciwgaGVpZ2h0OiBudW1iZXIsXG5cdG9mZnNldDogbnVtYmVyLCBsYXJnZTogYm9vbGVhblxuKSB7XG5cdGlmIChjb21wcmVzc2lvbiA9PT0gQ29tcHJlc3Npb24uUmF3RGF0YSkge1xuXHRcdHJlYWREYXRhUmF3KHJlYWRlciwgZGF0YSwgb2Zmc2V0LCB3aWR0aCwgaGVpZ2h0KTtcblx0fSBlbHNlIGlmIChjb21wcmVzc2lvbiA9PT0gQ29tcHJlc3Npb24uUmxlQ29tcHJlc3NlZCkge1xuXHRcdHJlYWREYXRhUkxFKHJlYWRlciwgZGF0YSwgd2lkdGgsIGhlaWdodCwgNCwgW29mZnNldF0sIGxhcmdlKTtcblx0fSBlbHNlIHtcblx0XHR0aHJvdyBuZXcgRXJyb3IoYENvbXByZXNzaW9uIHR5cGUgbm90IHN1cHBvcnRlZDogJHtjb21wcmVzc2lvbn1gKTtcblx0fVxufVxuXG5mdW5jdGlvbiByZWFkR2xvYmFsTGF5ZXJNYXNrSW5mbyhyZWFkZXI6IFBzZFJlYWRlcikge1xuXHRyZXR1cm4gcmVhZFNlY3Rpb248R2xvYmFsTGF5ZXJNYXNrSW5mbyB8IHVuZGVmaW5lZD4ocmVhZGVyLCAxLCBsZWZ0ID0+IHtcblx0XHRpZiAoIWxlZnQoKSkgcmV0dXJuIHVuZGVmaW5lZDtcblxuXHRcdGNvbnN0IG92ZXJsYXlDb2xvclNwYWNlID0gcmVhZFVpbnQxNihyZWFkZXIpO1xuXHRcdGNvbnN0IGNvbG9yU3BhY2UxID0gcmVhZFVpbnQxNihyZWFkZXIpO1xuXHRcdGNvbnN0IGNvbG9yU3BhY2UyID0gcmVhZFVpbnQxNihyZWFkZXIpO1xuXHRcdGNvbnN0IGNvbG9yU3BhY2UzID0gcmVhZFVpbnQxNihyZWFkZXIpO1xuXHRcdGNvbnN0IGNvbG9yU3BhY2U0ID0gcmVhZFVpbnQxNihyZWFkZXIpO1xuXHRcdGNvbnN0IG9wYWNpdHkgPSByZWFkVWludDE2KHJlYWRlcikgLyAweGZmO1xuXHRcdGNvbnN0IGtpbmQgPSByZWFkVWludDgocmVhZGVyKTtcblx0XHRza2lwQnl0ZXMocmVhZGVyLCBsZWZ0KCkpOyAvLyAzIGJ5dGVzIG9mIHBhZGRpbmcgP1xuXHRcdHJldHVybiB7IG92ZXJsYXlDb2xvclNwYWNlLCBjb2xvclNwYWNlMSwgY29sb3JTcGFjZTIsIGNvbG9yU3BhY2UzLCBjb2xvclNwYWNlNCwgb3BhY2l0eSwga2luZCB9O1xuXHR9KTtcbn1cblxuZnVuY3Rpb24gcmVhZEFkZGl0aW9uYWxMYXllckluZm8ocmVhZGVyOiBQc2RSZWFkZXIsIHRhcmdldDogTGF5ZXJBZGRpdGlvbmFsSW5mbywgcHNkOiBQc2QsIG9wdGlvbnM6IFJlYWRPcHRpb25zRXh0KSB7XG5cdGNvbnN0IHNpZyA9IHJlYWRTaWduYXR1cmUocmVhZGVyKTtcblx0aWYgKHNpZyAhPT0gJzhCSU0nICYmIHNpZyAhPT0gJzhCNjQnKSB0aHJvdyBuZXcgRXJyb3IoYEludmFsaWQgc2lnbmF0dXJlOiAnJHtzaWd9JyBhdCAweCR7KHJlYWRlci5vZmZzZXQgLSA0KS50b1N0cmluZygxNil9YCk7XG5cdGNvbnN0IGtleSA9IHJlYWRTaWduYXR1cmUocmVhZGVyKTtcblxuXHQvLyBgbGFyZ2VBZGRpdGlvbmFsSW5mb0tleXNgIGZhbGxiYWNrLCBiZWNhdXNlIHNvbWUga2V5cyBkb24ndCBoYXZlIDhCNjQgc2lnbmF0dXJlIGV2ZW4gd2hlbiB0aGV5IGFyZSA2NGJpdFxuXHRjb25zdCB1NjQgPSBzaWcgPT09ICc4QjY0JyB8fCAob3B0aW9ucy5sYXJnZSAmJiBsYXJnZUFkZGl0aW9uYWxJbmZvS2V5cy5pbmRleE9mKGtleSkgIT09IC0xKTtcblxuXHRyZWFkU2VjdGlvbihyZWFkZXIsIDIsIGxlZnQgPT4ge1xuXHRcdGNvbnN0IGhhbmRsZXIgPSBpbmZvSGFuZGxlcnNNYXBba2V5XTtcblxuXHRcdGlmIChoYW5kbGVyKSB7XG5cdFx0XHR0cnkge1xuXHRcdFx0XHRoYW5kbGVyLnJlYWQocmVhZGVyLCB0YXJnZXQsIGxlZnQsIHBzZCwgb3B0aW9ucyk7XG5cdFx0XHR9IGNhdGNoIChlKSB7XG5cdFx0XHRcdGlmIChvcHRpb25zLnRocm93Rm9yTWlzc2luZ0ZlYXR1cmVzKSB0aHJvdyBlO1xuXHRcdFx0fVxuXHRcdH0gZWxzZSB7XG5cdFx0XHRvcHRpb25zLmxvZ01pc3NpbmdGZWF0dXJlcyAmJiBjb25zb2xlLmxvZyhgVW5oYW5kbGVkIGFkZGl0aW9uYWwgaW5mbzogJHtrZXl9YCk7XG5cdFx0XHRza2lwQnl0ZXMocmVhZGVyLCBsZWZ0KCkpO1xuXHRcdH1cblxuXHRcdGlmIChsZWZ0KCkpIHtcblx0XHRcdG9wdGlvbnMubG9nTWlzc2luZ0ZlYXR1cmVzICYmIGNvbnNvbGUubG9nKGBVbnJlYWQgJHtsZWZ0KCl9IGJ5dGVzIGxlZnQgZm9yIHRhZzogJHtrZXl9YCk7XG5cdFx0XHRza2lwQnl0ZXMocmVhZGVyLCBsZWZ0KCkpO1xuXHRcdH1cblx0fSwgZmFsc2UsIHU2NCk7XG59XG5cbmZ1bmN0aW9uIHJlYWRJbWFnZURhdGEocmVhZGVyOiBQc2RSZWFkZXIsIHBzZDogUHNkLCBnbG9iYWxBbHBoYTogYm9vbGVhbiwgb3B0aW9uczogUmVhZE9wdGlvbnNFeHQpIHtcblx0Y29uc3QgY29tcHJlc3Npb24gPSByZWFkVWludDE2KHJlYWRlcikgYXMgQ29tcHJlc3Npb247XG5cblx0aWYgKHN1cHBvcnRlZENvbG9yTW9kZXMuaW5kZXhPZihwc2QuY29sb3JNb2RlISkgPT09IC0xKVxuXHRcdHRocm93IG5ldyBFcnJvcihgQ29sb3IgbW9kZSBub3Qgc3VwcG9ydGVkOiAke3BzZC5jb2xvck1vZGV9YCk7XG5cblx0aWYgKGNvbXByZXNzaW9uICE9PSBDb21wcmVzc2lvbi5SYXdEYXRhICYmIGNvbXByZXNzaW9uICE9PSBDb21wcmVzc2lvbi5SbGVDb21wcmVzc2VkKVxuXHRcdHRocm93IG5ldyBFcnJvcihgQ29tcHJlc3Npb24gdHlwZSBub3Qgc3VwcG9ydGVkOiAke2NvbXByZXNzaW9ufWApO1xuXG5cdGNvbnN0IGltYWdlRGF0YSA9IGNyZWF0ZUltYWdlRGF0YShwc2Qud2lkdGgsIHBzZC5oZWlnaHQpO1xuXHRyZXNldEltYWdlRGF0YShpbWFnZURhdGEpO1xuXG5cdGlmIChwc2QuY29sb3JNb2RlID09PSBDb2xvck1vZGUuQml0bWFwKSB7XG5cdFx0bGV0IGJ5dGVzOiBVaW50OEFycmF5O1xuXG5cdFx0aWYgKGNvbXByZXNzaW9uID09PSBDb21wcmVzc2lvbi5SYXdEYXRhKSB7XG5cdFx0XHRieXRlcyA9IHJlYWRCeXRlcyhyZWFkZXIsIE1hdGguY2VpbChwc2Qud2lkdGggLyA4KSAqIHBzZC5oZWlnaHQpO1xuXHRcdH0gZWxzZSBpZiAoY29tcHJlc3Npb24gPT09IENvbXByZXNzaW9uLlJsZUNvbXByZXNzZWQpIHtcblx0XHRcdGJ5dGVzID0gbmV3IFVpbnQ4QXJyYXkocHNkLndpZHRoICogcHNkLmhlaWdodCk7XG5cdFx0XHRyZWFkRGF0YVJMRShyZWFkZXIsIHsgZGF0YTogYnl0ZXMsIHdpZHRoOiBwc2Qud2lkdGgsIGhlaWdodDogcHNkLmhlaWdodCB9LCBwc2Qud2lkdGgsIHBzZC5oZWlnaHQsIDEsIFswXSwgb3B0aW9ucy5sYXJnZSk7XG5cdFx0fSBlbHNlIHtcblx0XHRcdHRocm93IG5ldyBFcnJvcihgQml0bWFwIGNvbXByZXNzaW9uIG5vdCBzdXBwb3J0ZWQ6ICR7Y29tcHJlc3Npb259YCk7XG5cdFx0fVxuXG5cdFx0ZGVjb2RlQml0bWFwKGJ5dGVzLCBpbWFnZURhdGEuZGF0YSwgcHNkLndpZHRoLCBwc2QuaGVpZ2h0KTtcblx0fSBlbHNlIHtcblx0XHRjb25zdCBjaGFubmVscyA9IHBzZC5jb2xvck1vZGUgPT09IENvbG9yTW9kZS5HcmF5c2NhbGUgPyBbMF0gOiBbMCwgMSwgMl07XG5cblx0XHRpZiAocHNkLmNoYW5uZWxzICYmIHBzZC5jaGFubmVscyA+IDMpIHtcblx0XHRcdGZvciAobGV0IGkgPSAzOyBpIDwgcHNkLmNoYW5uZWxzOyBpKyspIHtcblx0XHRcdFx0Ly8gVE9ETzogc3RvcmUgdGhlc2UgY2hhbm5lbHMgaW4gYWRkaXRpb25hbCBpbWFnZSBkYXRhXG5cdFx0XHRcdGNoYW5uZWxzLnB1c2goaSk7XG5cdFx0XHR9XG5cdFx0fSBlbHNlIGlmIChnbG9iYWxBbHBoYSkge1xuXHRcdFx0Y2hhbm5lbHMucHVzaCgzKTtcblx0XHR9XG5cblx0XHRpZiAoY29tcHJlc3Npb24gPT09IENvbXByZXNzaW9uLlJhd0RhdGEpIHtcblx0XHRcdGZvciAobGV0IGkgPSAwOyBpIDwgY2hhbm5lbHMubGVuZ3RoOyBpKyspIHtcblx0XHRcdFx0cmVhZERhdGFSYXcocmVhZGVyLCBpbWFnZURhdGEsIGNoYW5uZWxzW2ldLCBwc2Qud2lkdGgsIHBzZC5oZWlnaHQpO1xuXHRcdFx0fVxuXHRcdH0gZWxzZSBpZiAoY29tcHJlc3Npb24gPT09IENvbXByZXNzaW9uLlJsZUNvbXByZXNzZWQpIHtcblx0XHRcdGNvbnN0IHN0YXJ0ID0gcmVhZGVyLm9mZnNldDtcblx0XHRcdHJlYWREYXRhUkxFKHJlYWRlciwgaW1hZ2VEYXRhLCBwc2Qud2lkdGgsIHBzZC5oZWlnaHQsIDQsIGNoYW5uZWxzLCBvcHRpb25zLmxhcmdlKTtcblxuXHRcdFx0aWYgKFJBV19JTUFHRV9EQVRBKSB7XG5cdFx0XHRcdChwc2QgYXMgYW55KS5pbWFnZURhdGFSYXcgPSBuZXcgVWludDhBcnJheShyZWFkZXIudmlldy5idWZmZXIsIHJlYWRlci52aWV3LmJ5dGVPZmZzZXQgKyBzdGFydCwgcmVhZGVyLm9mZnNldCAtIHN0YXJ0KTtcblx0XHRcdH1cblx0XHR9XG5cblx0XHRpZiAocHNkLmNvbG9yTW9kZSA9PT0gQ29sb3JNb2RlLkdyYXlzY2FsZSkge1xuXHRcdFx0c2V0dXBHcmF5c2NhbGUoaW1hZ2VEYXRhKTtcblx0XHR9XG5cdH1cblxuXHRpZiAob3B0aW9ucy51c2VJbWFnZURhdGEpIHtcblx0XHRwc2QuaW1hZ2VEYXRhID0gaW1hZ2VEYXRhO1xuXHR9IGVsc2Uge1xuXHRcdHBzZC5jYW52YXMgPSBjcmVhdGVDYW52YXMocHNkLndpZHRoLCBwc2QuaGVpZ2h0KTtcblx0XHRwc2QuY2FudmFzLmdldENvbnRleHQoJzJkJykhLnB1dEltYWdlRGF0YShpbWFnZURhdGEsIDAsIDApO1xuXHR9XG59XG5cbmZ1bmN0aW9uIHJlYWREYXRhUmF3KHJlYWRlcjogUHNkUmVhZGVyLCBwaXhlbERhdGE6IFBpeGVsRGF0YSB8IHVuZGVmaW5lZCwgb2Zmc2V0OiBudW1iZXIsIHdpZHRoOiBudW1iZXIsIGhlaWdodDogbnVtYmVyKSB7XG5cdGNvbnN0IHNpemUgPSB3aWR0aCAqIGhlaWdodDtcblx0Y29uc3QgYnVmZmVyID0gcmVhZEJ5dGVzKHJlYWRlciwgc2l6ZSk7XG5cblx0aWYgKHBpeGVsRGF0YSAmJiBvZmZzZXQgPCA0KSB7XG5cdFx0Y29uc3QgZGF0YSA9IHBpeGVsRGF0YS5kYXRhO1xuXG5cdFx0Zm9yIChsZXQgaSA9IDAsIHAgPSBvZmZzZXQgfCAwOyBpIDwgc2l6ZTsgaSsrLCBwID0gKHAgKyA0KSB8IDApIHtcblx0XHRcdGRhdGFbcF0gPSBidWZmZXJbaV07XG5cdFx0fVxuXHR9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiByZWFkRGF0YVJMRShcblx0cmVhZGVyOiBQc2RSZWFkZXIsIHBpeGVsRGF0YTogUGl4ZWxEYXRhIHwgdW5kZWZpbmVkLCBfd2lkdGg6IG51bWJlciwgaGVpZ2h0OiBudW1iZXIsIHN0ZXA6IG51bWJlciwgb2Zmc2V0czogbnVtYmVyW10sXG5cdGxhcmdlOiBib29sZWFuXG4pIHtcblx0Y29uc3QgZGF0YSA9IHBpeGVsRGF0YSAmJiBwaXhlbERhdGEuZGF0YTtcblx0bGV0IGxlbmd0aHM6IFVpbnQxNkFycmF5IHwgVWludDMyQXJyYXk7XG5cblx0aWYgKGxhcmdlKSB7XG5cdFx0bGVuZ3RocyA9IG5ldyBVaW50MzJBcnJheShvZmZzZXRzLmxlbmd0aCAqIGhlaWdodCk7XG5cblx0XHRmb3IgKGxldCBvID0gMCwgbGkgPSAwOyBvIDwgb2Zmc2V0cy5sZW5ndGg7IG8rKykge1xuXHRcdFx0Zm9yIChsZXQgeSA9IDA7IHkgPCBoZWlnaHQ7IHkrKywgbGkrKykge1xuXHRcdFx0XHRsZW5ndGhzW2xpXSA9IHJlYWRVaW50MzIocmVhZGVyKTtcblx0XHRcdH1cblx0XHR9XG5cdH0gZWxzZSB7XG5cdFx0bGVuZ3RocyA9IG5ldyBVaW50MTZBcnJheShvZmZzZXRzLmxlbmd0aCAqIGhlaWdodCk7XG5cblx0XHRmb3IgKGxldCBvID0gMCwgbGkgPSAwOyBvIDwgb2Zmc2V0cy5sZW5ndGg7IG8rKykge1xuXHRcdFx0Zm9yIChsZXQgeSA9IDA7IHkgPCBoZWlnaHQ7IHkrKywgbGkrKykge1xuXHRcdFx0XHRsZW5ndGhzW2xpXSA9IHJlYWRVaW50MTYocmVhZGVyKTtcblx0XHRcdH1cblx0XHR9XG5cdH1cblxuXHRmb3IgKGxldCBjID0gMCwgbGkgPSAwOyBjIDwgb2Zmc2V0cy5sZW5ndGg7IGMrKykge1xuXHRcdGNvbnN0IG9mZnNldCA9IG9mZnNldHNbY10gfCAwO1xuXHRcdGNvbnN0IGV4dHJhID0gYyA+IDMgfHwgb2Zmc2V0ID4gMztcblxuXHRcdGlmICghZGF0YSB8fCBleHRyYSkge1xuXHRcdFx0Zm9yIChsZXQgeSA9IDA7IHkgPCBoZWlnaHQ7IHkrKywgbGkrKykge1xuXHRcdFx0XHRza2lwQnl0ZXMocmVhZGVyLCBsZW5ndGhzW2xpXSk7XG5cdFx0XHR9XG5cdFx0fSBlbHNlIHtcblx0XHRcdGZvciAobGV0IHkgPSAwLCBwID0gb2Zmc2V0IHwgMDsgeSA8IGhlaWdodDsgeSsrLCBsaSsrKSB7XG5cdFx0XHRcdGNvbnN0IGxlbmd0aCA9IGxlbmd0aHNbbGldO1xuXHRcdFx0XHRjb25zdCBidWZmZXIgPSByZWFkQnl0ZXMocmVhZGVyLCBsZW5ndGgpO1xuXG5cdFx0XHRcdGZvciAobGV0IGkgPSAwOyBpIDwgbGVuZ3RoOyBpKyspIHtcblx0XHRcdFx0XHRsZXQgaGVhZGVyID0gYnVmZmVyW2ldO1xuXG5cdFx0XHRcdFx0aWYgKGhlYWRlciA+IDEyOCkge1xuXHRcdFx0XHRcdFx0Y29uc3QgdmFsdWUgPSBidWZmZXJbKytpXTtcblx0XHRcdFx0XHRcdGhlYWRlciA9ICgyNTYgLSBoZWFkZXIpIHwgMDtcblxuXHRcdFx0XHRcdFx0Zm9yIChsZXQgaiA9IDA7IGogPD0gaGVhZGVyOyBqID0gKGogKyAxKSB8IDApIHtcblx0XHRcdFx0XHRcdFx0ZGF0YVtwXSA9IHZhbHVlO1xuXHRcdFx0XHRcdFx0XHRwID0gKHAgKyBzdGVwKSB8IDA7XG5cdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0fSBlbHNlIGlmIChoZWFkZXIgPCAxMjgpIHtcblx0XHRcdFx0XHRcdGZvciAobGV0IGogPSAwOyBqIDw9IGhlYWRlcjsgaiA9IChqICsgMSkgfCAwKSB7XG5cdFx0XHRcdFx0XHRcdGRhdGFbcF0gPSBidWZmZXJbKytpXTtcblx0XHRcdFx0XHRcdFx0cCA9IChwICsgc3RlcCkgfCAwO1xuXHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0XHQvLyBpZ25vcmUgMTI4XG5cdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0aWYgKGkgPj0gbGVuZ3RoKSB7XG5cdFx0XHRcdFx0XHR0aHJvdyBuZXcgRXJyb3IoYEludmFsaWQgUkxFIGRhdGE6IGV4Y2VlZGVkIGJ1ZmZlciBzaXplICR7aX0vJHtsZW5ndGh9YCk7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0fVxuXHR9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiByZWFkU2VjdGlvbjxUPihcblx0cmVhZGVyOiBQc2RSZWFkZXIsIHJvdW5kOiBudW1iZXIsIGZ1bmM6IChsZWZ0OiAoKSA9PiBudW1iZXIpID0+IFQsIHNraXBFbXB0eSA9IHRydWUsIGVpZ2h0Qnl0ZXMgPSBmYWxzZVxuKTogVCB8IHVuZGVmaW5lZCB7XG5cdGxldCBsZW5ndGggPSByZWFkVWludDMyKHJlYWRlcik7XG5cblx0aWYgKGVpZ2h0Qnl0ZXMpIHtcblx0XHRpZiAobGVuZ3RoICE9PSAwKSB0aHJvdyBuZXcgRXJyb3IoJ1NpemVzIGxhcmdlciB0aGFuIDRHQiBhcmUgbm90IHN1cHBvcnRlZCcpO1xuXHRcdGxlbmd0aCA9IHJlYWRVaW50MzIocmVhZGVyKTtcblx0fVxuXG5cdGlmIChsZW5ndGggPD0gMCAmJiBza2lwRW1wdHkpIHJldHVybiB1bmRlZmluZWQ7XG5cblx0bGV0IGVuZCA9IHJlYWRlci5vZmZzZXQgKyBsZW5ndGg7XG5cdGNvbnN0IHJlc3VsdCA9IGZ1bmMoKCkgPT4gZW5kIC0gcmVhZGVyLm9mZnNldCk7XG5cblx0Ly8gaWYgKHJlYWRlci5vZmZzZXQgPiBlbmQpXG5cdC8vIFx0dGhyb3cgbmV3IEVycm9yKCdFeGNlZWRlZCBzZWN0aW9uIGxpbWl0cycpO1xuXG5cdC8vIGlmIChyZWFkZXIub2Zmc2V0ICE9PSBlbmQpXG5cdC8vIFx0dGhyb3cgbmV3IEVycm9yKGBVbnJlYWQgc2VjdGlvbiBkYXRhOiAke2VuZCAtIHJlYWRlci5vZmZzZXR9IGJ5dGVzIGF0IDB4JHtyZWFkZXIub2Zmc2V0LnRvU3RyaW5nKDE2KX1gKTtcblxuXHR3aGlsZSAoZW5kICUgcm91bmQpIGVuZCsrO1xuXG5cdHJlYWRlci5vZmZzZXQgPSBlbmQ7XG5cdHJldHVybiByZXN1bHQ7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiByZWFkQ29sb3IocmVhZGVyOiBQc2RSZWFkZXIpOiBDb2xvciB7XG5cdGNvbnN0IGNvbG9yU3BhY2UgPSByZWFkVWludDE2KHJlYWRlcikgYXMgQ29sb3JTcGFjZTtcblxuXHRzd2l0Y2ggKGNvbG9yU3BhY2UpIHtcblx0XHRjYXNlIENvbG9yU3BhY2UuUkdCOiB7XG5cdFx0XHRjb25zdCByID0gcmVhZFVpbnQxNihyZWFkZXIpIC8gMjU3O1xuXHRcdFx0Y29uc3QgZyA9IHJlYWRVaW50MTYocmVhZGVyKSAvIDI1Nztcblx0XHRcdGNvbnN0IGIgPSByZWFkVWludDE2KHJlYWRlcikgLyAyNTc7XG5cdFx0XHRza2lwQnl0ZXMocmVhZGVyLCAyKTtcblx0XHRcdHJldHVybiB7IHIsIGcsIGIgfTtcblx0XHR9XG5cdFx0Y2FzZSBDb2xvclNwYWNlLkhTQjoge1xuXHRcdFx0Y29uc3QgaCA9IHJlYWRVaW50MTYocmVhZGVyKSAvIDB4ZmZmZjtcblx0XHRcdGNvbnN0IHMgPSByZWFkVWludDE2KHJlYWRlcikgLyAweGZmZmY7XG5cdFx0XHRjb25zdCBiID0gcmVhZFVpbnQxNihyZWFkZXIpIC8gMHhmZmZmO1xuXHRcdFx0c2tpcEJ5dGVzKHJlYWRlciwgMik7XG5cdFx0XHRyZXR1cm4geyBoLCBzLCBiIH07XG5cdFx0fVxuXHRcdGNhc2UgQ29sb3JTcGFjZS5DTVlLOiB7XG5cdFx0XHRjb25zdCBjID0gcmVhZFVpbnQxNihyZWFkZXIpIC8gMjU3O1xuXHRcdFx0Y29uc3QgbSA9IHJlYWRVaW50MTYocmVhZGVyKSAvIDI1Nztcblx0XHRcdGNvbnN0IHkgPSByZWFkVWludDE2KHJlYWRlcikgLyAyNTc7XG5cdFx0XHRjb25zdCBrID0gcmVhZFVpbnQxNihyZWFkZXIpIC8gMjU3O1xuXHRcdFx0cmV0dXJuIHsgYywgbSwgeSwgayB9O1xuXHRcdH1cblx0XHRjYXNlIENvbG9yU3BhY2UuTGFiOiB7XG5cdFx0XHRjb25zdCBsID0gcmVhZEludDE2KHJlYWRlcikgLyAxMDAwMDtcblx0XHRcdGNvbnN0IHRhID0gcmVhZEludDE2KHJlYWRlcik7XG5cdFx0XHRjb25zdCB0YiA9IHJlYWRJbnQxNihyZWFkZXIpO1xuXHRcdFx0Y29uc3QgYSA9IHRhIDwgMCA/ICh0YSAvIDEyODAwKSA6ICh0YSAvIDEyNzAwKTtcblx0XHRcdGNvbnN0IGIgPSB0YiA8IDAgPyAodGIgLyAxMjgwMCkgOiAodGIgLyAxMjcwMCk7XG5cdFx0XHRza2lwQnl0ZXMocmVhZGVyLCAyKTtcblx0XHRcdHJldHVybiB7IGwsIGEsIGIgfTtcblx0XHR9XG5cdFx0Y2FzZSBDb2xvclNwYWNlLkdyYXlzY2FsZToge1xuXHRcdFx0Y29uc3QgayA9IHJlYWRVaW50MTYocmVhZGVyKSAqIDI1NSAvIDEwMDAwO1xuXHRcdFx0c2tpcEJ5dGVzKHJlYWRlciwgNik7XG5cdFx0XHRyZXR1cm4geyBrIH07XG5cdFx0fVxuXHRcdGRlZmF1bHQ6XG5cdFx0XHR0aHJvdyBuZXcgRXJyb3IoJ0ludmFsaWQgY29sb3Igc3BhY2UnKTtcblx0fVxufVxuXG5leHBvcnQgZnVuY3Rpb24gcmVhZFBhdHRlcm4ocmVhZGVyOiBQc2RSZWFkZXIpOiBQYXR0ZXJuSW5mbyB7XG5cdHJlYWRVaW50MzIocmVhZGVyKTsgLy8gbGVuZ3RoXG5cdGNvbnN0IHZlcnNpb24gPSByZWFkVWludDMyKHJlYWRlcik7XG5cdGlmICh2ZXJzaW9uICE9PSAxKSB0aHJvdyBuZXcgRXJyb3IoYEludmFsaWQgcGF0dGVybiB2ZXJzaW9uOiAke3ZlcnNpb259YCk7XG5cblx0Y29uc3QgY29sb3JNb2RlID0gcmVhZFVpbnQzMihyZWFkZXIpIGFzIENvbG9yTW9kZTtcblx0Y29uc3QgeCA9IHJlYWRJbnQxNihyZWFkZXIpO1xuXHRjb25zdCB5ID0gcmVhZEludDE2KHJlYWRlcik7XG5cblx0Ly8gd2Ugb25seSBzdXBwb3J0IFJHQiBhbmQgZ3JheXNjYWxlIGZvciBub3dcblx0aWYgKGNvbG9yTW9kZSAhPT0gQ29sb3JNb2RlLlJHQiAmJiBjb2xvck1vZGUgIT09IENvbG9yTW9kZS5HcmF5c2NhbGUpIHRocm93IG5ldyBFcnJvcignVW5zdXBwb3J0ZWQgcGF0dGVybiBjb2xvciBtb2RlJyk7XG5cblx0Y29uc3QgbmFtZSA9IHJlYWRVbmljb2RlU3RyaW5nKHJlYWRlcik7XG5cdGNvbnN0IGlkID0gcmVhZFBhc2NhbFN0cmluZyhyZWFkZXIsIDEpO1xuXG5cdC8vIFRPRE86IGluZGV4IGNvbG9yIHRhYmxlIGhlcmUgKG9ubHkgZm9yIGluZGV4ZWQgY29sb3IgbW9kZSwgbm90IHN1cHBvcnRlZCByaWdodCBub3cpXG5cblx0Ly8gdmlydHVhbCBtZW1vcnkgYXJyYXkgbGlzdFxuXHRjb25zdCB2ZXJzaW9uMiA9IHJlYWRVaW50MzIocmVhZGVyKTtcblx0aWYgKHZlcnNpb24yICE9PSAzKSB0aHJvdyBuZXcgRXJyb3IoYEludmFsaWQgcGF0dGVybiBWTUFMIHZlcnNpb246ICR7dmVyc2lvbjJ9YCk7XG5cblx0cmVhZFVpbnQzMihyZWFkZXIpOyAvLyBsZW5ndGhcblx0Y29uc3QgdG9wID0gcmVhZFVpbnQzMihyZWFkZXIpO1xuXHRjb25zdCBsZWZ0ID0gcmVhZFVpbnQzMihyZWFkZXIpO1xuXHRjb25zdCBib3R0b20gPSByZWFkVWludDMyKHJlYWRlcik7XG5cdGNvbnN0IHJpZ2h0ID0gcmVhZFVpbnQzMihyZWFkZXIpO1xuXHRjb25zdCBjaGFubmVsc0NvdW50ID0gcmVhZFVpbnQzMihyZWFkZXIpO1xuXHRjb25zdCB3aWR0aCA9IHJpZ2h0IC0gbGVmdDtcblx0Y29uc3QgaGVpZ2h0ID0gYm90dG9tIC0gdG9wO1xuXHRjb25zdCBkYXRhID0gbmV3IFVpbnQ4QXJyYXkod2lkdGggKiBoZWlnaHQgKiA0KTtcblxuXHRmb3IgKGxldCBpID0gMzsgaSA8IGRhdGEuYnl0ZUxlbmd0aDsgaSArPSA0KSB7XG5cdFx0ZGF0YVtpXSA9IDI1NTtcblx0fVxuXG5cdGZvciAobGV0IGkgPSAwLCBjaCA9IDA7IGkgPCAoY2hhbm5lbHNDb3VudCArIDIpOyBpKyspIHtcblx0XHRjb25zdCBoYXMgPSByZWFkVWludDMyKHJlYWRlcik7XG5cblx0XHRpZiAoaGFzKSB7XG5cdFx0XHRjb25zdCBsZW5ndGggPSByZWFkVWludDMyKHJlYWRlcik7XG5cdFx0XHRjb25zdCBwaXhlbERlcHRoID0gcmVhZFVpbnQzMihyZWFkZXIpO1xuXHRcdFx0Y29uc3QgY3RvcCA9IHJlYWRVaW50MzIocmVhZGVyKTtcblx0XHRcdGNvbnN0IGNsZWZ0ID0gcmVhZFVpbnQzMihyZWFkZXIpO1xuXHRcdFx0Y29uc3QgY2JvdHRvbSA9IHJlYWRVaW50MzIocmVhZGVyKTtcblx0XHRcdGNvbnN0IGNyaWdodCA9IHJlYWRVaW50MzIocmVhZGVyKTtcblx0XHRcdGNvbnN0IHBpeGVsRGVwdGgyID0gcmVhZFVpbnQxNihyZWFkZXIpO1xuXHRcdFx0Y29uc3QgY29tcHJlc3Npb25Nb2RlID0gcmVhZFVpbnQ4KHJlYWRlcik7IC8vIDAgLSByYXcsIDEgLSB6aXBcblx0XHRcdGNvbnN0IGRhdGFMZW5ndGggPSBsZW5ndGggLSAoNCArIDE2ICsgMiArIDEpO1xuXHRcdFx0Y29uc3QgY2RhdGEgPSByZWFkQnl0ZXMocmVhZGVyLCBkYXRhTGVuZ3RoKTtcblxuXHRcdFx0aWYgKHBpeGVsRGVwdGggIT09IDggfHwgcGl4ZWxEZXB0aDIgIT09IDgpIHRocm93IG5ldyBFcnJvcignMTZiaXQgcGl4ZWwgZGVwdGggbm90IHN1cHBvcnRlZCBmb3IgcGFsZXR0ZXMnKTtcblxuXHRcdFx0Y29uc3QgdyA9IGNyaWdodCAtIGNsZWZ0O1xuXHRcdFx0Y29uc3QgaCA9IGNib3R0b20gLSBjdG9wO1xuXHRcdFx0Y29uc3Qgb3ggPSBjbGVmdCAtIGxlZnQ7XG5cdFx0XHRjb25zdCBveSA9IGN0b3AgLSB0b3A7XG5cblx0XHRcdGlmIChjb21wcmVzc2lvbk1vZGUgPT09IDApIHtcblx0XHRcdFx0aWYgKGNvbG9yTW9kZSA9PT0gQ29sb3JNb2RlLlJHQiAmJiBjaCA8IDMpIHtcblx0XHRcdFx0XHRmb3IgKGxldCB5ID0gMDsgeSA8IGg7IHkrKykge1xuXHRcdFx0XHRcdFx0Zm9yIChsZXQgeCA9IDA7IHggPCB3OyB4KyspIHtcblx0XHRcdFx0XHRcdFx0Y29uc3Qgc3JjID0geCArIHkgKiB3O1xuXHRcdFx0XHRcdFx0XHRjb25zdCBkc3QgPSAob3ggKyB4ICsgKHkgKyBveSkgKiB3aWR0aCkgKiA0O1xuXHRcdFx0XHRcdFx0XHRkYXRhW2RzdCArIGNoXSA9IGNkYXRhW3NyY107XG5cdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9XG5cblx0XHRcdFx0aWYgKGNvbG9yTW9kZSA9PT0gQ29sb3JNb2RlLkdyYXlzY2FsZSAmJiBjaCA8IDEpIHtcblx0XHRcdFx0XHRmb3IgKGxldCB5ID0gMDsgeSA8IGg7IHkrKykge1xuXHRcdFx0XHRcdFx0Zm9yIChsZXQgeCA9IDA7IHggPCB3OyB4KyspIHtcblx0XHRcdFx0XHRcdFx0Y29uc3Qgc3JjID0geCArIHkgKiB3O1xuXHRcdFx0XHRcdFx0XHRjb25zdCBkc3QgPSAob3ggKyB4ICsgKHkgKyBveSkgKiB3aWR0aCkgKiA0O1xuXHRcdFx0XHRcdFx0XHRjb25zdCB2YWx1ZSA9IGNkYXRhW3NyY107XG5cdFx0XHRcdFx0XHRcdGRhdGFbZHN0ICsgMF0gPSB2YWx1ZTtcblx0XHRcdFx0XHRcdFx0ZGF0YVtkc3QgKyAxXSA9IHZhbHVlO1xuXHRcdFx0XHRcdFx0XHRkYXRhW2RzdCArIDJdID0gdmFsdWU7XG5cdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9XG5cdFx0XHR9IGVsc2UgaWYgKGNvbXByZXNzaW9uTW9kZSA9PT0gMSkge1xuXHRcdFx0XHR0aHJvdyBuZXcgRXJyb3IoJ1Vuc3VwcG9ydGVkIHBhbGV0dGUgY29tcHJlc3Npb24gbW9kZScpO1xuXHRcdFx0XHQvLyBjb25zb2xlLmxvZyh7IGNvbG9yTW9kZSB9KTtcblx0XHRcdFx0Ly8gcmVxdWlyZSgnZnMnKS53cml0ZUZpbGVTeW5jKCd6aXAuYmluJywgQnVmZmVyLmZyb20oY2RhdGEpKTtcblx0XHRcdFx0Ly8gY29uc3QgZGF0YSA9IHpsaWIuaW5mbGF0ZVJhd1N5bmMoY2RhdGEpO1xuXHRcdFx0XHQvLyBjb25zb2xlLmxvZyhkYXRhKTtcblx0XHRcdFx0Ly8gdGhyb3cgbmV3IEVycm9yKCdaaXAgY29tcHJlc3Npb24gbm90IHN1cHBvcnRlZCBmb3IgcGFsZXR0ZXMnKTtcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdHRocm93IG5ldyBFcnJvcignSW52YWxpZCBwYWxldHRlIGNvbXByZXNzaW9uIG1vZGUnKTtcblx0XHRcdH1cblxuXHRcdFx0Y2grKztcblx0XHR9XG5cdH1cblxuXHQvLyBUT0RPOiB1c2UgY2FudmFzIGluc3RlYWQgb2YgZGF0YSA/XG5cblx0cmV0dXJuIHsgaWQsIG5hbWUsIHgsIHksIGJvdW5kczogeyB4OiBsZWZ0LCB5OiB0b3AsIHc6IHdpZHRoLCBoOiBoZWlnaHQgfSwgZGF0YSB9O1xufVxuIl0sInNvdXJjZVJvb3QiOiIvaG9tZS9tYW5oL2thb3Bpei9lZWwvYWctcHNkL3NyYyJ9
