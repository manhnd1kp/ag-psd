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
exports.writeColor = exports.writePsd = exports.writeSection = exports.writeUnicodeStringWithPadding = exports.writeUnicodeString = exports.writePascalString = exports.writeSignature = exports.writeZeros = exports.writeBytes = exports.writeFixedPointPath32 = exports.writeFixedPoint32 = exports.writeFloat64 = exports.writeFloat32 = exports.writeUint32 = exports.writeInt32 = exports.writeUint16 = exports.writeInt16 = exports.writeUint8 = exports.getWriterBufferNoCopy = exports.getWriterBuffer = exports.createWriter = void 0;
var helpers_1 = require("./helpers");
var additionalInfo_1 = require("./additionalInfo");
var imageResources_1 = require("./imageResources");
function createWriter(size) {
    if (size === void 0) { size = 4096; }
    var buffer = new ArrayBuffer(size);
    var view = new DataView(buffer);
    var offset = 0;
    return { buffer: buffer, view: view, offset: offset };
}
exports.createWriter = createWriter;
function getWriterBuffer(writer) {
    return writer.buffer.slice(0, writer.offset);
}
exports.getWriterBuffer = getWriterBuffer;
function getWriterBufferNoCopy(writer) {
    return new Uint8Array(writer.buffer, 0, writer.offset);
}
exports.getWriterBufferNoCopy = getWriterBufferNoCopy;
function writeUint8(writer, value) {
    var offset = addSize(writer, 1);
    writer.view.setUint8(offset, value);
}
exports.writeUint8 = writeUint8;
function writeInt16(writer, value) {
    var offset = addSize(writer, 2);
    writer.view.setInt16(offset, value, false);
}
exports.writeInt16 = writeInt16;
function writeUint16(writer, value) {
    var offset = addSize(writer, 2);
    writer.view.setUint16(offset, value, false);
}
exports.writeUint16 = writeUint16;
function writeInt32(writer, value) {
    var offset = addSize(writer, 4);
    writer.view.setInt32(offset, value, false);
}
exports.writeInt32 = writeInt32;
function writeUint32(writer, value) {
    var offset = addSize(writer, 4);
    writer.view.setUint32(offset, value, false);
}
exports.writeUint32 = writeUint32;
function writeFloat32(writer, value) {
    var offset = addSize(writer, 4);
    writer.view.setFloat32(offset, value, false);
}
exports.writeFloat32 = writeFloat32;
function writeFloat64(writer, value) {
    var offset = addSize(writer, 8);
    writer.view.setFloat64(offset, value, false);
}
exports.writeFloat64 = writeFloat64;
// 32-bit fixed-point number 16.16
function writeFixedPoint32(writer, value) {
    writeInt32(writer, value * (1 << 16));
}
exports.writeFixedPoint32 = writeFixedPoint32;
// 32-bit fixed-point number 8.24
function writeFixedPointPath32(writer, value) {
    writeInt32(writer, value * (1 << 24));
}
exports.writeFixedPointPath32 = writeFixedPointPath32;
function writeBytes(writer, buffer) {
    if (buffer) {
        ensureSize(writer, writer.offset + buffer.length);
        var bytes = new Uint8Array(writer.buffer);
        bytes.set(buffer, writer.offset);
        writer.offset += buffer.length;
    }
}
exports.writeBytes = writeBytes;
function writeZeros(writer, count) {
    for (var i = 0; i < count; i++) {
        writeUint8(writer, 0);
    }
}
exports.writeZeros = writeZeros;
function writeSignature(writer, signature) {
    if (signature.length !== 4)
        throw new Error("Invalid signature: '" + signature + "'");
    for (var i = 0; i < 4; i++) {
        writeUint8(writer, signature.charCodeAt(i));
    }
}
exports.writeSignature = writeSignature;
function writePascalString(writer, text, padTo) {
    var length = text.length;
    writeUint8(writer, length);
    for (var i = 0; i < length; i++) {
        var code = text.charCodeAt(i);
        writeUint8(writer, code < 128 ? code : '?'.charCodeAt(0));
    }
    while (++length % padTo) {
        writeUint8(writer, 0);
    }
}
exports.writePascalString = writePascalString;
function writeUnicodeString(writer, text) {
    writeUint32(writer, text.length);
    for (var i = 0; i < text.length; i++) {
        writeUint16(writer, text.charCodeAt(i));
    }
}
exports.writeUnicodeString = writeUnicodeString;
function writeUnicodeStringWithPadding(writer, text) {
    writeUint32(writer, text.length + 1);
    for (var i = 0; i < text.length; i++) {
        writeUint16(writer, text.charCodeAt(i));
    }
    writeUint16(writer, 0);
}
exports.writeUnicodeStringWithPadding = writeUnicodeStringWithPadding;
function getLargestLayerSize(layers) {
    if (layers === void 0) { layers = []; }
    var max = 0;
    for (var _i = 0, layers_1 = layers; _i < layers_1.length; _i++) {
        var layer = layers_1[_i];
        if (layer.canvas || layer.imageData) {
            var _a = getLayerDimentions(layer), width = _a.width, height = _a.height;
            max = Math.max(max, 2 * height + 2 * width * height);
        }
        if (layer.children) {
            max = Math.max(max, getLargestLayerSize(layer.children));
        }
    }
    return max;
}
function writeSection(writer, round, func, writeTotalLength, large) {
    if (writeTotalLength === void 0) { writeTotalLength = false; }
    if (large === void 0) { large = false; }
    if (large)
        writeUint32(writer, 0);
    var offset = writer.offset;
    writeUint32(writer, 0);
    func();
    var length = writer.offset - offset - 4;
    var len = length;
    while ((len % round) !== 0) {
        writeUint8(writer, 0);
        len++;
    }
    if (writeTotalLength) {
        length = len;
    }
    writer.view.setUint32(offset, length, false);
}
exports.writeSection = writeSection;
function writePsd(writer, psd, options) {
    if (options === void 0) { options = {}; }
    if (!(+psd.width > 0 && +psd.height > 0))
        throw new Error('Invalid document size');
    if ((psd.width > 30000 || psd.height > 30000) && !options.psb)
        throw new Error('Document size is too large (max is 30000x30000, use PSB format instead)');
    var imageResources = psd.imageResources || {};
    var opt = __assign(__assign({}, options), { layerIds: [] });
    if (opt.generateThumbnail) {
        imageResources = __assign(__assign({}, imageResources), { thumbnail: createThumbnail(psd) });
    }
    var imageData = psd.imageData;
    if (!imageData && psd.canvas) {
        imageData = psd.canvas.getContext('2d').getImageData(0, 0, psd.canvas.width, psd.canvas.height);
    }
    if (imageData && (psd.width !== imageData.width || psd.height !== imageData.height))
        throw new Error('Document canvas must have the same size as document');
    var globalAlpha = !!imageData && helpers_1.hasAlpha(imageData);
    var maxBufferSize = Math.max(getLargestLayerSize(psd.children), 4 * 2 * psd.width * psd.height + 2 * psd.height);
    var tempBuffer = new Uint8Array(maxBufferSize);
    // header
    writeSignature(writer, '8BPS');
    writeUint16(writer, options.psb ? 2 : 1); // version
    writeZeros(writer, 6);
    writeUint16(writer, globalAlpha ? 4 : 3); // channels
    writeUint32(writer, psd.height);
    writeUint32(writer, psd.width);
    writeUint16(writer, 8); // bits per channel
    writeUint16(writer, 3 /* RGB */);
    // color mode data
    writeSection(writer, 1, function () {
        // TODO: implement
    });
    // image resources
    writeSection(writer, 1, function () {
        var _loop_1 = function (handler) {
            if (handler.has(imageResources)) {
                writeSignature(writer, '8BIM');
                writeUint16(writer, handler.key);
                writePascalString(writer, '', 2);
                writeSection(writer, 2, function () { return handler.write(writer, imageResources); });
            }
        };
        for (var _i = 0, resourceHandlers_1 = imageResources_1.resourceHandlers; _i < resourceHandlers_1.length; _i++) {
            var handler = resourceHandlers_1[_i];
            _loop_1(handler);
        }
    });
    // layer and mask info
    writeSection(writer, 2, function () {
        writeLayerInfo(tempBuffer, writer, psd, globalAlpha, opt);
        writeGlobalLayerMaskInfo(writer, psd.globalLayerMaskInfo);
        writeAdditionalLayerInfo(writer, psd, psd, opt);
    }, undefined, !!opt.psb);
    // image data
    var channels = globalAlpha ? [0, 1, 2, 3] : [0, 1, 2];
    var data = imageData || {
        data: new Uint8Array(4 * psd.width * psd.height),
        width: psd.width,
        height: psd.height,
    };
    writeUint16(writer, 1 /* RleCompressed */);
    if (helpers_1.RAW_IMAGE_DATA && psd.imageDataRaw) {
        console.log('writing raw image data');
        writeBytes(writer, psd.imageDataRaw);
    }
    else {
        writeBytes(writer, helpers_1.writeDataRLE(tempBuffer, data, psd.width, psd.height, channels, !!options.psb));
    }
}
exports.writePsd = writePsd;
function writeLayerInfo(tempBuffer, writer, psd, globalAlpha, options) {
    writeSection(writer, 4, function () {
        var _a;
        var layers = [];
        addChildren(layers, psd.children);
        if (!layers.length)
            layers.push({});
        writeInt16(writer, globalAlpha ? -layers.length : layers.length);
        var layersData = layers.map(function (l, i) { return getChannels(tempBuffer, l, i === 0, options); });
        var _loop_2 = function (layerData) {
            var layer = layerData.layer, top_1 = layerData.top, left = layerData.left, bottom = layerData.bottom, right = layerData.right, channels = layerData.channels;
            writeInt32(writer, top_1);
            writeInt32(writer, left);
            writeInt32(writer, bottom);
            writeInt32(writer, right);
            writeUint16(writer, channels.length);
            for (var _e = 0, channels_1 = channels; _e < channels_1.length; _e++) {
                var c = channels_1[_e];
                writeInt16(writer, c.channelId);
                if (options.psb)
                    writeUint32(writer, 0);
                writeUint32(writer, c.length);
            }
            writeSignature(writer, '8BIM');
            writeSignature(writer, helpers_1.fromBlendMode[layer.blendMode] || 'norm');
            writeUint8(writer, Math.round(helpers_1.clamp((_a = layer.opacity) !== null && _a !== void 0 ? _a : 1, 0, 1) * 255));
            writeUint8(writer, layer.clipping ? 1 : 0);
            var flags = 0x08; // 1 for Photoshop 5.0 and later, tells if bit 4 has useful information
            if (layer.transparencyProtected)
                flags |= 0x01;
            if (layer.hidden)
                flags |= 0x02;
            if (layer.vectorMask || (layer.sectionDivider && layer.sectionDivider.type !== 0 /* Other */)) {
                flags |= 0x10; // pixel data irrelevant to appearance of document
            }
            if (layer.effects && additionalInfo_1.hasMultiEffects(layer.effects)) {
                flags |= 0x20; // just guessing this one, might be completely incorrect
            }
            writeUint8(writer, flags);
            writeUint8(writer, 0); // filler
            writeSection(writer, 1, function () {
                writeLayerMaskData(writer, layer, layerData);
                writeLayerBlendingRanges(writer, psd);
                writePascalString(writer, layer.name || '', 4);
                writeAdditionalLayerInfo(writer, layer, psd, options);
            });
        };
        // layer records
        for (var _i = 0, layersData_1 = layersData; _i < layersData_1.length; _i++) {
            var layerData = layersData_1[_i];
            _loop_2(layerData);
        }
        // layer channel image data
        for (var _b = 0, layersData_2 = layersData; _b < layersData_2.length; _b++) {
            var layerData = layersData_2[_b];
            for (var _c = 0, _d = layerData.channels; _c < _d.length; _c++) {
                var channel = _d[_c];
                writeUint16(writer, channel.compression);
                if (channel.buffer) {
                    writeBytes(writer, channel.buffer);
                }
            }
        }
    }, true, options.psb);
}
function writeLayerMaskData(writer, _a, layerData) {
    var mask = _a.mask;
    writeSection(writer, 1, function () {
        if (!mask)
            return;
        var m = layerData.mask || {};
        writeInt32(writer, m.top);
        writeInt32(writer, m.left);
        writeInt32(writer, m.bottom);
        writeInt32(writer, m.right);
        writeUint8(writer, mask.defaultColor);
        var params = 0;
        if (mask.userMaskDensity !== undefined)
            params |= 1 /* UserMaskDensity */;
        if (mask.userMaskFeather !== undefined)
            params |= 2 /* UserMaskFeather */;
        if (mask.vectorMaskDensity !== undefined)
            params |= 4 /* VectorMaskDensity */;
        if (mask.vectorMaskFeather !== undefined)
            params |= 8 /* VectorMaskFeather */;
        var flags = 0;
        if (mask.disabled)
            flags |= 2 /* LayerMaskDisabled */;
        if (mask.positionRelativeToLayer)
            flags |= 1 /* PositionRelativeToLayer */;
        if (mask.fromVectorData)
            flags |= 8 /* LayerMaskFromRenderingOtherData */;
        if (params)
            flags |= 16 /* MaskHasParametersAppliedToIt */;
        writeUint8(writer, flags);
        if (params) {
            writeUint8(writer, params);
            if (mask.userMaskDensity !== undefined)
                writeUint8(writer, Math.round(mask.userMaskDensity * 0xff));
            if (mask.userMaskFeather !== undefined)
                writeFloat64(writer, mask.userMaskFeather);
            if (mask.vectorMaskDensity !== undefined)
                writeUint8(writer, Math.round(mask.vectorMaskDensity * 0xff));
            if (mask.vectorMaskFeather !== undefined)
                writeFloat64(writer, mask.vectorMaskFeather);
        }
        // TODO: handle rest of the fields
        writeZeros(writer, 2);
    });
}
function writeLayerBlendingRanges(writer, psd) {
    writeSection(writer, 1, function () {
        writeUint32(writer, 65535);
        writeUint32(writer, 65535);
        var channels = psd.channels || 0; // TODO: use always 4 instead ?
        // channels = 4; // TESTING
        for (var i = 0; i < channels; i++) {
            writeUint32(writer, 65535);
            writeUint32(writer, 65535);
        }
    });
}
function writeGlobalLayerMaskInfo(writer, info) {
    writeSection(writer, 1, function () {
        if (info) {
            writeUint16(writer, info.overlayColorSpace);
            writeUint16(writer, info.colorSpace1);
            writeUint16(writer, info.colorSpace2);
            writeUint16(writer, info.colorSpace3);
            writeUint16(writer, info.colorSpace4);
            writeUint16(writer, info.opacity * 0xff);
            writeUint8(writer, info.kind);
            writeZeros(writer, 3);
        }
    });
}
function writeAdditionalLayerInfo(writer, target, psd, options) {
    var _loop_3 = function (handler) {
        var key = handler.key;
        if (key === 'Txt2' && options.invalidateTextLayers)
            return "continue";
        if (key === 'vmsk' && options.psb)
            key = 'vsms';
        if (handler.has(target)) {
            var large = options.psb && helpers_1.largeAdditionalInfoKeys.indexOf(key) !== -1;
            writeSignature(writer, large ? '8B64' : '8BIM');
            writeSignature(writer, key);
            var fourBytes = key === 'Txt2' || key === 'luni' || key === 'vmsk' || key === 'artb' || key === 'artd' ||
                key === 'vogk' || key === 'SoLd' || key === 'lnk2' || key === 'vscg' || key === 'vsms' || key === 'GdFl' ||
                key === 'lmfx' || key === 'lrFX' || key === 'cinf' || key === 'PlLd' || key === 'Anno';
            writeSection(writer, fourBytes ? 4 : 2, function () {
                handler.write(writer, target, psd, options);
            }, key !== 'Txt2' && key !== 'cinf' && key !== 'extn', large);
        }
    };
    for (var _i = 0, infoHandlers_1 = additionalInfo_1.infoHandlers; _i < infoHandlers_1.length; _i++) {
        var handler = infoHandlers_1[_i];
        _loop_3(handler);
    }
}
function addChildren(layers, children) {
    if (!children)
        return;
    for (var _i = 0, children_1 = children; _i < children_1.length; _i++) {
        var c = children_1[_i];
        if (c.children && c.canvas)
            throw new Error("Invalid layer, cannot have both 'canvas' and 'children' properties");
        if (c.children && c.imageData)
            throw new Error("Invalid layer, cannot have both 'imageData' and 'children' properties");
        if (c.children) {
            layers.push({
                name: '</Layer group>',
                sectionDivider: {
                    type: 3 /* BoundingSectionDivider */,
                },
                // TESTING
                // nameSource: 'lset',
                // id: [4, 0, 0, 8, 11, 0, 0, 0, 0, 14][layers.length] || 0,
                // layerColor: 'none',
                // timestamp: [1611346817.349021, 0, 0, 1611346817.349175, 1611346817.3491833, 0, 0, 0, 0, 1611346817.349832][layers.length] || 0,
                // protected: {},
                // referencePoint: { x: 0, y: 0 },
            });
            addChildren(layers, c.children);
            layers.push(__assign({ sectionDivider: {
                    type: c.opened === false ? 2 /* ClosedFolder */ : 1 /* OpenFolder */,
                    key: helpers_1.fromBlendMode[c.blendMode] || 'pass',
                    subType: 0,
                } }, c));
        }
        else {
            layers.push(__assign({}, c));
        }
    }
}
function resizeBuffer(writer, size) {
    var newLength = writer.buffer.byteLength;
    do {
        newLength *= 2;
    } while (size > newLength);
    var newBuffer = new ArrayBuffer(newLength);
    var newBytes = new Uint8Array(newBuffer);
    var oldBytes = new Uint8Array(writer.buffer);
    newBytes.set(oldBytes);
    writer.buffer = newBuffer;
    writer.view = new DataView(writer.buffer);
}
function ensureSize(writer, size) {
    if (size > writer.buffer.byteLength) {
        resizeBuffer(writer, size);
    }
}
function addSize(writer, size) {
    var offset = writer.offset;
    ensureSize(writer, writer.offset += size);
    return offset;
}
function createThumbnail(psd) {
    var canvas = helpers_1.createCanvas(10, 10);
    var scale = 1;
    if (psd.width > psd.height) {
        canvas.width = 160;
        canvas.height = Math.floor(psd.height * (canvas.width / psd.width));
        scale = canvas.width / psd.width;
    }
    else {
        canvas.height = 160;
        canvas.width = Math.floor(psd.width * (canvas.height / psd.height));
        scale = canvas.height / psd.height;
    }
    var context = canvas.getContext('2d');
    context.scale(scale, scale);
    if (psd.imageData) {
        var temp = helpers_1.createCanvas(psd.imageData.width, psd.imageData.height);
        temp.getContext('2d').putImageData(psd.imageData, 0, 0);
        context.drawImage(temp, 0, 0);
    }
    else if (psd.canvas) {
        context.drawImage(psd.canvas, 0, 0);
    }
    return canvas;
}
function getChannels(tempBuffer, layer, background, options) {
    var layerData = getLayerChannels(tempBuffer, layer, background, options);
    var mask = layer.mask;
    if (mask) {
        var _a = mask.top, top_2 = _a === void 0 ? 0 : _a, _b = mask.left, left = _b === void 0 ? 0 : _b, _c = mask.right, right = _c === void 0 ? 0 : _c, _d = mask.bottom, bottom = _d === void 0 ? 0 : _d;
        var _e = getLayerDimentions(mask), width = _e.width, height = _e.height;
        var imageData = mask.imageData;
        if (!imageData && mask.canvas && width && height) {
            imageData = mask.canvas.getContext('2d').getImageData(0, 0, width, height);
        }
        if (width && height && imageData) {
            right = left + width;
            bottom = top_2 + height;
            var buffer = helpers_1.writeDataRLE(tempBuffer, imageData, width, height, [0], !!options.psb);
            if (helpers_1.RAW_IMAGE_DATA && layer.maskDataRaw) {
                // console.log('written raw layer image data');
                buffer = layer.maskDataRaw;
            }
            layerData.mask = { top: top_2, left: left, right: right, bottom: bottom };
            layerData.channels.push({
                channelId: -2 /* UserMask */,
                compression: 1 /* RleCompressed */,
                buffer: buffer,
                length: 2 + buffer.length,
            });
        }
        else {
            layerData.mask = { top: 0, left: 0, right: 0, bottom: 0 };
            layerData.channels.push({
                channelId: -2 /* UserMask */,
                compression: 0 /* RawData */,
                buffer: new Uint8Array(0),
                length: 0,
            });
        }
    }
    return layerData;
}
function getLayerDimentions(_a) {
    var canvas = _a.canvas, imageData = _a.imageData;
    return imageData || canvas || { width: 0, height: 0 };
}
function cropImageData(data, left, top, width, height) {
    var croppedData = helpers_1.createImageData(width, height);
    var srcData = data.data;
    var dstData = croppedData.data;
    for (var y = 0; y < height; y++) {
        for (var x = 0; x < width; x++) {
            var src = ((x + left) + (y + top) * width) * 4;
            var dst = (x + y * width) * 4;
            dstData[dst] = srcData[src];
            dstData[dst + 1] = srcData[src + 1];
            dstData[dst + 2] = srcData[src + 2];
            dstData[dst + 3] = srcData[src + 3];
        }
    }
    return croppedData;
}
function getLayerChannels(tempBuffer, layer, background, options) {
    var _a;
    var _b = layer.top, top = _b === void 0 ? 0 : _b, _c = layer.left, left = _c === void 0 ? 0 : _c, _d = layer.right, right = _d === void 0 ? 0 : _d, _e = layer.bottom, bottom = _e === void 0 ? 0 : _e;
    var channels = [
        { channelId: -1 /* Transparency */, compression: 0 /* RawData */, buffer: undefined, length: 2 },
        { channelId: 0 /* Red */, compression: 0 /* RawData */, buffer: undefined, length: 2 },
        { channelId: 1 /* Green */, compression: 0 /* RawData */, buffer: undefined, length: 2 },
        { channelId: 2 /* Blue */, compression: 0 /* RawData */, buffer: undefined, length: 2 },
    ];
    var _f = getLayerDimentions(layer), width = _f.width, height = _f.height;
    if (!(layer.canvas || layer.imageData) || !width || !height) {
        right = left;
        bottom = top;
        return { layer: layer, top: top, left: left, right: right, bottom: bottom, channels: channels };
    }
    right = left + width;
    bottom = top + height;
    var data = layer.imageData || layer.canvas.getContext('2d').getImageData(0, 0, width, height);
    if (options.trimImageData) {
        var trimmed = trimData(data);
        if (trimmed.left !== 0 || trimmed.top !== 0 || trimmed.right !== data.width || trimmed.bottom !== data.height) {
            left += trimmed.left;
            top += trimmed.top;
            right -= (data.width - trimmed.right);
            bottom -= (data.height - trimmed.bottom);
            width = right - left;
            height = bottom - top;
            if (!width || !height) {
                return { layer: layer, top: top, left: left, right: right, bottom: bottom, channels: channels };
            }
            if (layer.imageData) {
                data = cropImageData(data, trimmed.left, trimmed.top, width, height);
            }
            else {
                data = layer.canvas.getContext('2d').getImageData(trimmed.left, trimmed.top, width, height);
            }
        }
    }
    var channelIds = [
        0 /* Red */,
        1 /* Green */,
        2 /* Blue */,
    ];
    if (!background || options.noBackground || layer.mask || helpers_1.hasAlpha(data) || (helpers_1.RAW_IMAGE_DATA && ((_a = layer.imageDataRaw) === null || _a === void 0 ? void 0 : _a['-1']))) {
        channelIds.unshift(-1 /* Transparency */);
    }
    channels = channelIds.map(function (channel) {
        var offset = helpers_1.offsetForChannel(channel);
        var buffer = helpers_1.writeDataRLE(tempBuffer, data, width, height, [offset], !!options.psb);
        if (helpers_1.RAW_IMAGE_DATA && layer.imageDataRaw) {
            // console.log('written raw layer image data');
            buffer = layer.imageDataRaw[channel];
        }
        return {
            channelId: channel,
            compression: 1 /* RleCompressed */,
            buffer: buffer,
            length: 2 + buffer.length,
        };
    });
    return { layer: layer, top: top, left: left, right: right, bottom: bottom, channels: channels };
}
function isRowEmpty(_a, y, left, right) {
    var data = _a.data, width = _a.width;
    var start = ((y * width + left) * 4 + 3) | 0;
    var end = (start + (right - left) * 4) | 0;
    for (var i = start; i < end; i = (i + 4) | 0) {
        if (data[i] !== 0) {
            return false;
        }
    }
    return true;
}
function isColEmpty(_a, x, top, bottom) {
    var data = _a.data, width = _a.width;
    var stride = (width * 4) | 0;
    var start = (top * stride + x * 4 + 3) | 0;
    for (var y = top, i = start; y < bottom; y++, i = (i + stride) | 0) {
        if (data[i] !== 0) {
            return false;
        }
    }
    return true;
}
function trimData(data) {
    var top = 0;
    var left = 0;
    var right = data.width;
    var bottom = data.height;
    while (top < bottom && isRowEmpty(data, top, left, right))
        top++;
    while (bottom > top && isRowEmpty(data, bottom - 1, left, right))
        bottom--;
    while (left < right && isColEmpty(data, left, top, bottom))
        left++;
    while (right > left && isColEmpty(data, right - 1, top, bottom))
        right--;
    return { top: top, left: left, right: right, bottom: bottom };
}
function writeColor(writer, color) {
    if (!color) {
        writeUint16(writer, 0 /* RGB */);
        writeZeros(writer, 8);
    }
    else if ('r' in color) {
        writeUint16(writer, 0 /* RGB */);
        writeUint16(writer, Math.round(color.r * 257));
        writeUint16(writer, Math.round(color.g * 257));
        writeUint16(writer, Math.round(color.b * 257));
        writeUint16(writer, 0);
    }
    else if ('l' in color) {
        writeUint16(writer, 7 /* Lab */);
        writeInt16(writer, Math.round(color.l * 10000));
        writeInt16(writer, Math.round(color.a < 0 ? (color.a * 12800) : (color.a * 12700)));
        writeInt16(writer, Math.round(color.b < 0 ? (color.b * 12800) : (color.b * 12700)));
        writeUint16(writer, 0);
    }
    else if ('h' in color) {
        writeUint16(writer, 1 /* HSB */);
        writeUint16(writer, Math.round(color.h * 0xffff));
        writeUint16(writer, Math.round(color.s * 0xffff));
        writeUint16(writer, Math.round(color.b * 0xffff));
        writeUint16(writer, 0);
    }
    else if ('c' in color) {
        writeUint16(writer, 2 /* CMYK */);
        writeUint16(writer, Math.round(color.c * 257));
        writeUint16(writer, Math.round(color.m * 257));
        writeUint16(writer, Math.round(color.y * 257));
        writeUint16(writer, Math.round(color.k * 257));
    }
    else {
        writeUint16(writer, 8 /* Grayscale */);
        writeUint16(writer, Math.round(color.k * 10000 / 255));
        writeZeros(writer, 6);
    }
}
exports.writeColor = writeColor;

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInBzZFdyaXRlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7OztBQUNBLHFDQUltQjtBQUNuQixtREFBdUY7QUFDdkYsbURBQW9EO0FBUXBELFNBQWdCLFlBQVksQ0FBQyxJQUFXO0lBQVgscUJBQUEsRUFBQSxXQUFXO0lBQ3ZDLElBQU0sTUFBTSxHQUFHLElBQUksV0FBVyxDQUFDLElBQUksQ0FBQyxDQUFDO0lBQ3JDLElBQU0sSUFBSSxHQUFHLElBQUksUUFBUSxDQUFDLE1BQU0sQ0FBQyxDQUFDO0lBQ2xDLElBQU0sTUFBTSxHQUFHLENBQUMsQ0FBQztJQUNqQixPQUFPLEVBQUUsTUFBTSxRQUFBLEVBQUUsSUFBSSxNQUFBLEVBQUUsTUFBTSxRQUFBLEVBQUUsQ0FBQztBQUNqQyxDQUFDO0FBTEQsb0NBS0M7QUFFRCxTQUFnQixlQUFlLENBQUMsTUFBaUI7SUFDaEQsT0FBTyxNQUFNLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxDQUFDLEVBQUUsTUFBTSxDQUFDLE1BQU0sQ0FBQyxDQUFDO0FBQzlDLENBQUM7QUFGRCwwQ0FFQztBQUVELFNBQWdCLHFCQUFxQixDQUFDLE1BQWlCO0lBQ3RELE9BQU8sSUFBSSxVQUFVLENBQUMsTUFBTSxDQUFDLE1BQU0sRUFBRSxDQUFDLEVBQUUsTUFBTSxDQUFDLE1BQU0sQ0FBQyxDQUFDO0FBQ3hELENBQUM7QUFGRCxzREFFQztBQUVELFNBQWdCLFVBQVUsQ0FBQyxNQUFpQixFQUFFLEtBQWE7SUFDMUQsSUFBTSxNQUFNLEdBQUcsT0FBTyxDQUFDLE1BQU0sRUFBRSxDQUFDLENBQUMsQ0FBQztJQUNsQyxNQUFNLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxNQUFNLEVBQUUsS0FBSyxDQUFDLENBQUM7QUFDckMsQ0FBQztBQUhELGdDQUdDO0FBRUQsU0FBZ0IsVUFBVSxDQUFDLE1BQWlCLEVBQUUsS0FBYTtJQUMxRCxJQUFNLE1BQU0sR0FBRyxPQUFPLENBQUMsTUFBTSxFQUFFLENBQUMsQ0FBQyxDQUFDO0lBQ2xDLE1BQU0sQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLE1BQU0sRUFBRSxLQUFLLEVBQUUsS0FBSyxDQUFDLENBQUM7QUFDNUMsQ0FBQztBQUhELGdDQUdDO0FBRUQsU0FBZ0IsV0FBVyxDQUFDLE1BQWlCLEVBQUUsS0FBYTtJQUMzRCxJQUFNLE1BQU0sR0FBRyxPQUFPLENBQUMsTUFBTSxFQUFFLENBQUMsQ0FBQyxDQUFDO0lBQ2xDLE1BQU0sQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLE1BQU0sRUFBRSxLQUFLLEVBQUUsS0FBSyxDQUFDLENBQUM7QUFDN0MsQ0FBQztBQUhELGtDQUdDO0FBRUQsU0FBZ0IsVUFBVSxDQUFDLE1BQWlCLEVBQUUsS0FBYTtJQUMxRCxJQUFNLE1BQU0sR0FBRyxPQUFPLENBQUMsTUFBTSxFQUFFLENBQUMsQ0FBQyxDQUFDO0lBQ2xDLE1BQU0sQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLE1BQU0sRUFBRSxLQUFLLEVBQUUsS0FBSyxDQUFDLENBQUM7QUFDNUMsQ0FBQztBQUhELGdDQUdDO0FBRUQsU0FBZ0IsV0FBVyxDQUFDLE1BQWlCLEVBQUUsS0FBYTtJQUMzRCxJQUFNLE1BQU0sR0FBRyxPQUFPLENBQUMsTUFBTSxFQUFFLENBQUMsQ0FBQyxDQUFDO0lBQ2xDLE1BQU0sQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLE1BQU0sRUFBRSxLQUFLLEVBQUUsS0FBSyxDQUFDLENBQUM7QUFDN0MsQ0FBQztBQUhELGtDQUdDO0FBRUQsU0FBZ0IsWUFBWSxDQUFDLE1BQWlCLEVBQUUsS0FBYTtJQUM1RCxJQUFNLE1BQU0sR0FBRyxPQUFPLENBQUMsTUFBTSxFQUFFLENBQUMsQ0FBQyxDQUFDO0lBQ2xDLE1BQU0sQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDLE1BQU0sRUFBRSxLQUFLLEVBQUUsS0FBSyxDQUFDLENBQUM7QUFDOUMsQ0FBQztBQUhELG9DQUdDO0FBRUQsU0FBZ0IsWUFBWSxDQUFDLE1BQWlCLEVBQUUsS0FBYTtJQUM1RCxJQUFNLE1BQU0s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QyxLQUFLLENBQUMsS0FBSyxDQUFDLENBQUMsR0FBRyxLQUFLLEdBQUcsR0FBRyxDQUFDLENBQUMsQ0FBQztRQUN2RCxVQUFVLENBQUMsTUFBTSxFQUFFLENBQUMsQ0FBQyxDQUFDO0tBQ3RCO0FBQ0YsQ0FBQztBQWpDRCxnQ0FpQ0MiLCJmaWxlIjoicHNkV3JpdGVyLmpzIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgUHNkLCBMYXllciwgTGF5ZXJBZGRpdGlvbmFsSW5mbywgQ29sb3JNb2RlLCBTZWN0aW9uRGl2aWRlclR5cGUsIFdyaXRlT3B0aW9ucywgQ29sb3IsIEdsb2JhbExheWVyTWFza0luZm8gfSBmcm9tICcuL3BzZCc7XG5pbXBvcnQge1xuXHRoYXNBbHBoYSwgY3JlYXRlQ2FudmFzLCB3cml0ZURhdGFSTEUsIFBpeGVsRGF0YSwgTGF5ZXJDaGFubmVsRGF0YSwgQ2hhbm5lbERhdGEsXG5cdG9mZnNldEZvckNoYW5uZWwsIGNyZWF0ZUltYWdlRGF0YSwgZnJvbUJsZW5kTW9kZSwgQ2hhbm5lbElELCBDb21wcmVzc2lvbiwgY2xhbXAsXG5cdExheWVyTWFza0ZsYWdzLCBNYXNrUGFyYW1zLCBDb2xvclNwYWNlLCBCb3VuZHMsIGxhcmdlQWRkaXRpb25hbEluZm9LZXlzLCBSQVdfSU1BR0VfREFUQVxufSBmcm9tICcuL2hlbHBlcnMnO1xuaW1wb3J0IHsgRXh0ZW5kZWRXcml0ZU9wdGlvbnMsIGhhc011bHRpRWZmZWN0cywgaW5mb0hhbmRsZXJzIH0gZnJvbSAnLi9hZGRpdGlvbmFsSW5mbyc7XG5pbXBvcnQgeyByZXNvdXJjZUhhbmRsZXJzIH0gZnJvbSAnLi9pbWFnZVJlc291cmNlcyc7XG5cbmV4cG9ydCBpbnRlcmZhY2UgUHNkV3JpdGVyIHtcblx0b2Zmc2V0OiBudW1iZXI7XG5cdGJ1ZmZlcjogQXJyYXlCdWZmZXI7XG5cdHZpZXc6IERhdGFWaWV3O1xufVxuXG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlV3JpdGVyKHNpemUgPSA0MDk2KTogUHNkV3JpdGVyIHtcblx0Y29uc3QgYnVmZmVyID0gbmV3IEFycmF5QnVmZmVyKHNpemUpO1xuXHRjb25zdCB2aWV3ID0gbmV3IERhdGFWaWV3KGJ1ZmZlcik7XG5cdGNvbnN0IG9mZnNldCA9IDA7XG5cdHJldHVybiB7IGJ1ZmZlciwgdmlldywgb2Zmc2V0IH07XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRXcml0ZXJCdWZmZXIod3JpdGVyOiBQc2RXcml0ZXIpIHtcblx0cmV0dXJuIHdyaXRlci5idWZmZXIuc2xpY2UoMCwgd3JpdGVyLm9mZnNldCk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRXcml0ZXJCdWZmZXJOb0NvcHkod3JpdGVyOiBQc2RXcml0ZXIpIHtcblx0cmV0dXJuIG5ldyBVaW50OEFycmF5KHdyaXRlci5idWZmZXIsIDAsIHdyaXRlci5vZmZzZXQpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gd3JpdGVVaW50OCh3cml0ZXI6IFBzZFdyaXRlciwgdmFsdWU6IG51bWJlcikge1xuXHRjb25zdCBvZmZzZXQgPSBhZGRTaXplKHdyaXRlciwgMSk7XG5cdHdyaXRlci52aWV3LnNldFVpbnQ4KG9mZnNldCwgdmFsdWUpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gd3JpdGVJbnQxNih3cml0ZXI6IFBzZFdyaXRlciwgdmFsdWU6IG51bWJlcikge1xuXHRjb25zdCBvZmZzZXQgPSBhZGRTaXplKHdyaXRlciwgMik7XG5cdHdyaXRlci52aWV3LnNldEludDE2KG9mZnNldCwgdmFsdWUsIGZhbHNlKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHdyaXRlVWludDE2KHdyaXRlcjogUHNkV3JpdGVyLCB2YWx1ZTogbnVtYmVyKSB7XG5cdGNvbnN0IG9mZnNldCA9IGFkZFNpemUod3JpdGVyLCAyKTtcblx0d3JpdGVyLnZpZXcuc2V0VWludDE2KG9mZnNldCwgdmFsdWUsIGZhbHNlKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHdyaXRlSW50MzIod3JpdGVyOiBQc2RXcml0ZXIsIHZhbHVlOiBudW1iZXIpIHtcblx0Y29uc3Qgb2Zmc2V0ID0gYWRkU2l6ZSh3cml0ZXIsIDQpO1xuXHR3cml0ZXIudmlldy5zZXRJbnQzMihvZmZzZXQsIHZhbHVlLCBmYWxzZSk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiB3cml0ZVVpbnQzMih3cml0ZXI6IFBzZFdyaXRlciwgdmFsdWU6IG51bWJlcikge1xuXHRjb25zdCBvZmZzZXQgPSBhZGRTaXplKHdyaXRlciwgNCk7XG5cdHdyaXRlci52aWV3LnNldFVpbnQzMihvZmZzZXQsIHZhbHVlLCBmYWxzZSk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiB3cml0ZUZsb2F0MzIod3JpdGVyOiBQc2RXcml0ZXIsIHZhbHVlOiBudW1iZXIpIHtcblx0Y29uc3Qgb2Zmc2V0ID0gYWRkU2l6ZSh3cml0ZXIsIDQpO1xuXHR3cml0ZXIudmlldy5zZXRGbG9hdDMyKG9mZnNldCwgdmFsdWUsIGZhbHNlKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHdyaXRlRmxvYXQ2NCh3cml0ZXI6IFBzZFdyaXRlciwgdmFsdWU6IG51bWJlcikge1xuXHRjb25zdCBvZmZzZXQgPSBhZGRTaXplKHdyaXRlciwgOCk7XG5cdHdyaXRlci52aWV3LnNldEZsb2F0NjQob2Zmc2V0LCB2YWx1ZSwgZmFsc2UpO1xufVxuXG4vLyAzMi1iaXQgZml4ZWQtcG9pbnQgbnVtYmVyIDE2LjE2XG5leHBvcnQgZnVuY3Rpb24gd3JpdGVGaXhlZFBvaW50MzIod3JpdGVyOiBQc2RXcml0ZXIsIHZhbHVlOiBudW1iZXIpIHtcblx0d3JpdGVJbnQzMih3cml0ZXIsIHZhbHVlICogKDEgPDwgMTYpKTtcbn1cblxuLy8gMzItYml0IGZpeGVkLXBvaW50IG51bWJlciA4LjI0XG5leHBvcnQgZnVuY3Rpb24gd3JpdGVGaXhlZFBvaW50UGF0aDMyKHdyaXRlcjogUHNkV3JpdGVyLCB2YWx1ZTogbnVtYmVyKSB7XG5cdHdyaXRlSW50MzIod3JpdGVyLCB2YWx1ZSAqICgxIDw8IDI0KSk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiB3cml0ZUJ5dGVzKHdyaXRlcjogUHNkV3JpdGVyLCBidWZmZXI6IFVpbnQ4QXJyYXkgfCB1bmRlZmluZWQpIHtcblx0aWYgKGJ1ZmZlcikge1xuXHRcdGVuc3VyZVNpemUod3JpdGVyLCB3cml0ZXIub2Zmc2V0ICsgYnVmZmVyLmxlbmd0aCk7XG5cdFx0Y29uc3QgYnl0ZXMgPSBuZXcgVWludDhBcnJheSh3cml0ZXIuYnVmZmVyKTtcblx0XHRieXRlcy5zZXQoYnVmZmVyLCB3cml0ZXIub2Zmc2V0KTtcblx0XHR3cml0ZXIub2Zmc2V0ICs9IGJ1ZmZlci5sZW5ndGg7XG5cdH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHdyaXRlWmVyb3Mod3JpdGVyOiBQc2RXcml0ZXIsIGNvdW50OiBudW1iZXIpIHtcblx0Zm9yIChsZXQgaSA9IDA7IGkgPCBjb3VudDsgaSsrKSB7XG5cdFx0d3JpdGVVaW50OCh3cml0ZXIsIDApO1xuXHR9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiB3cml0ZVNpZ25hdHVyZSh3cml0ZXI6IFBzZFdyaXRlciwgc2lnbmF0dXJlOiBzdHJpbmcpIHtcblx0aWYgKHNpZ25hdHVyZS5sZW5ndGggIT09IDQpIHRocm93IG5ldyBFcnJvcihgSW52YWxpZCBzaWduYXR1cmU6ICcke3NpZ25hdHVyZX0nYCk7XG5cblx0Zm9yIChsZXQgaSA9IDA7IGkgPCA0OyBpKyspIHtcblx0XHR3cml0ZVVpbnQ4KHdyaXRlciwgc2lnbmF0dXJlLmNoYXJDb2RlQXQoaSkpO1xuXHR9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiB3cml0ZVBhc2NhbFN0cmluZyh3cml0ZXI6IFBzZFdyaXRlciwgdGV4dDogc3RyaW5nLCBwYWRUbzogbnVtYmVyKSB7XG5cdGxldCBsZW5ndGggPSB0ZXh0Lmxlbmd0aDtcblx0d3JpdGVVaW50OCh3cml0ZXIsIGxlbmd0aCk7XG5cblx0Zm9yIChsZXQgaSA9IDA7IGkgPCBsZW5ndGg7IGkrKykge1xuXHRcdGNvbnN0IGNvZGUgPSB0ZXh0LmNoYXJDb2RlQXQoaSk7XG5cdFx0d3JpdGVVaW50OCh3cml0ZXIsIGNvZGUgPCAxMjggPyBjb2RlIDogJz8nLmNoYXJDb2RlQXQoMCkpO1xuXHR9XG5cblx0d2hpbGUgKCsrbGVuZ3RoICUgcGFkVG8pIHtcblx0XHR3cml0ZVVpbnQ4KHdyaXRlciwgMCk7XG5cdH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHdyaXRlVW5pY29kZVN0cmluZyh3cml0ZXI6IFBzZFdyaXRlciwgdGV4dDogc3RyaW5nKSB7XG5cdHdyaXRlVWludDMyKHdyaXRlciwgdGV4dC5sZW5ndGgpO1xuXG5cdGZvciAobGV0IGkgPSAwOyBpIDwgdGV4dC5sZW5ndGg7IGkrKykge1xuXHRcdHdyaXRlVWludDE2KHdyaXRlciwgdGV4dC5jaGFyQ29kZUF0KGkpKTtcblx0fVxufVxuXG5leHBvcnQgZnVuY3Rpb24gd3JpdGVVbmljb2RlU3RyaW5nV2l0aFBhZGRpbmcod3JpdGVyOiBQc2RXcml0ZXIsIHRleHQ6IHN0cmluZykge1xuXHR3cml0ZVVpbnQzMih3cml0ZXIsIHRleHQubGVuZ3RoICsgMSk7XG5cblx0Zm9yIChsZXQgaSA9IDA7IGkgPCB0ZXh0Lmxlbmd0aDsgaSsrKSB7XG5cdFx0d3JpdGVVaW50MTYod3JpdGVyLCB0ZXh0LmNoYXJDb2RlQXQoaSkpO1xuXHR9XG5cblx0d3JpdGVVaW50MTYod3JpdGVyLCAwKTtcbn1cblxuZnVuY3Rpb24gZ2V0TGFyZ2VzdExheWVyU2l6ZShsYXllcnM6IExheWVyW10gPSBbXSk6IG51bWJlciB7XG5cdGxldCBtYXggPSAwO1xuXG5cdGZvciAoY29uc3QgbGF5ZXIgb2YgbGF5ZXJzKSB7XG5cdFx0aWYgKGxheWVyLmNhbnZhcyB8fCBsYXllci5pbWFnZURhdGEpIHtcblx0XHRcdGNvbnN0IHsgd2lkdGgsIGhlaWdodCB9ID0gZ2V0TGF5ZXJEaW1lbnRpb25zKGxheWVyKTtcblx0XHRcdG1heCA9IE1hdGgubWF4KG1heCwgMiAqIGhlaWdodCArIDIgKiB3aWR0aCAqIGhlaWdodCk7XG5cdFx0fVxuXG5cdFx0aWYgKGxheWVyLmNoaWxkcmVuKSB7XG5cdFx0XHRtYXggPSBNYXRoLm1heChtYXgsIGdldExhcmdlc3RMYXllclNpemUobGF5ZXIuY2hpbGRyZW4pKTtcblx0XHR9XG5cdH1cblxuXHRyZXR1cm4gbWF4O1xufVxuXG5leHBvcnQgZnVuY3Rpb24gd3JpdGVTZWN0aW9uKHdyaXRlcjogUHNkV3JpdGVyLCByb3VuZDogbnVtYmVyLCBmdW5jOiAoKSA9PiB2b2lkLCB3cml0ZVRvdGFsTGVuZ3RoID0gZmFsc2UsIGxhcmdlID0gZmFsc2UpIHtcblx0aWYgKGxhcmdlKSB3cml0ZVVpbnQzMih3cml0ZXIsIDApO1xuXG5cdGNvbnN0IG9mZnNldCA9IHdyaXRlci5vZmZzZXQ7XG5cdHdyaXRlVWludDMyKHdyaXRlciwgMCk7XG5cblx0ZnVuYygpO1xuXG5cdGxldCBsZW5ndGggPSB3cml0ZXIub2Zmc2V0IC0gb2Zmc2V0IC0gNDtcblx0bGV0IGxlbiA9IGxlbmd0aDtcblxuXHR3aGlsZSAoKGxlbiAlIHJvdW5kKSAhPT0gMCkge1xuXHRcdHdyaXRlVWludDgod3JpdGVyLCAwKTtcblx0XHRsZW4rKztcblx0fVxuXG5cdGlmICh3cml0ZVRvdGFsTGVuZ3RoKSB7XG5cdFx0bGVuZ3RoID0gbGVuO1xuXHR9XG5cblx0d3JpdGVyLnZpZXcuc2V0VWludDMyKG9mZnNldCwgbGVuZ3RoLCBmYWxzZSk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiB3cml0ZVBzZCh3cml0ZXI6IFBzZFdyaXRlciwgcHNkOiBQc2QsIG9wdGlvbnM6IFdyaXRlT3B0aW9ucyA9IHt9KSB7XG5cdGlmICghKCtwc2Qud2lkdGggPiAwICYmICtwc2QuaGVpZ2h0ID4gMCkpXG5cdFx0dGhyb3cgbmV3IEVycm9yKCdJbnZhbGlkIGRvY3VtZW50IHNpemUnKTtcblxuXHRpZiAoKHBzZC53aWR0aCA+IDMwMDAwIHx8IHBzZC5oZWlnaHQgPiAzMDAwMCkgJiYgIW9wdGlvbnMucHNiKVxuXHRcdHRocm93IG5ldyBFcnJvcignRG9jdW1lbnQgc2l6ZSBpcyB0b28gbGFyZ2UgKG1heCBpcyAzMDAwMHgzMDAwMCwgdXNlIFBTQiBmb3JtYXQgaW5zdGVhZCknKTtcblxuXHRsZXQgaW1hZ2VSZXNvdXJjZXMgPSBwc2QuaW1hZ2VSZXNvdXJjZXMgfHwge307XG5cblx0Y29uc3Qgb3B0OiBFeHRlbmRlZFdyaXRlT3B0aW9ucyA9IHsgLi4ub3B0aW9ucywgbGF5ZXJJZHM6IFtdIH07XG5cblx0aWYgKG9wdC5nZW5lcmF0ZVRodW1ibmFpbCkge1xuXHRcdGltYWdlUmVzb3VyY2VzID0geyAuLi5pbWFnZVJlc291cmNlcywgdGh1bWJuYWlsOiBjcmVhdGVUaHVtYm5haWwocHNkKSB9O1xuXHR9XG5cblx0bGV0IGltYWdlRGF0YSA9IHBzZC5pbWFnZURhdGE7XG5cblx0aWYgKCFpbWFnZURhdGEgJiYgcHNkLmNhbnZhcykge1xuXHRcdGltYWdlRGF0YSA9IHBzZC5jYW52YXMuZ2V0Q29udGV4dCgnMmQnKSEuZ2V0SW1hZ2VEYXRhKDAsIDAsIHBzZC5jYW52YXMud2lkdGgsIHBzZC5jYW52YXMuaGVpZ2h0KTtcblx0fVxuXG5cdGlmIChpbWFnZURhdGEgJiYgKHBzZC53aWR0aCAhPT0gaW1hZ2VEYXRhLndpZHRoIHx8IHBzZC5oZWlnaHQgIT09IGltYWdlRGF0YS5oZWlnaHQpKVxuXHRcdHRocm93IG5ldyBFcnJvcignRG9jdW1lbnQgY2FudmFzIG11c3QgaGF2ZSB0aGUgc2FtZSBzaXplIGFzIGRvY3VtZW50Jyk7XG5cblx0Y29uc3QgZ2xvYmFsQWxwaGEgPSAhIWltYWdlRGF0YSAmJiBoYXNBbHBoYShpbWFnZURhdGEpO1xuXHRjb25zdCBtYXhCdWZmZXJTaXplID0gTWF0aC5tYXgoZ2V0TGFyZ2VzdExheWVyU2l6ZShwc2QuY2hpbGRyZW4pLCA0ICogMiAqIHBzZC53aWR0aCAqIHBzZC5oZWlnaHQgKyAyICogcHNkLmhlaWdodCk7XG5cdGNvbnN0IHRlbXBCdWZmZXIgPSBuZXcgVWludDhBcnJheShtYXhCdWZmZXJTaXplKTtcblxuXHQvLyBoZWFkZXJcblx0d3JpdGVTaWduYXR1cmUod3JpdGVyLCAnOEJQUycpO1xuXHR3cml0ZVVpbnQxNih3cml0ZXIsIG9wdGlvbnMucHNiID8gMiA6IDEpOyAvLyB2ZXJzaW9uXG5cdHdyaXRlWmVyb3Mod3JpdGVyLCA2KTtcblx0d3JpdGVVaW50MTYod3JpdGVyLCBnbG9iYWxBbHBoYSA/IDQgOiAzKTsgLy8gY2hhbm5lbHNcblx0d3JpdGVVaW50MzIod3JpdGVyLCBwc2QuaGVpZ2h0KTtcblx0d3JpdGVVaW50MzIod3JpdGVyLCBwc2Qud2lkdGgpO1xuXHR3cml0ZVVpbnQxNih3cml0ZXIsIDgpOyAvLyBiaXRzIHBlciBjaGFubmVsXG5cdHdyaXRlVWludDE2KHdyaXRlciwgQ29sb3JNb2RlLlJHQik7XG5cblx0Ly8gY29sb3IgbW9kZSBkYXRhXG5cdHdyaXRlU2VjdGlvbih3cml0ZXIsIDEsICgpID0+IHtcblx0XHQvLyBUT0RPOiBpbXBsZW1lbnRcblx0fSk7XG5cblx0Ly8gaW1hZ2UgcmVzb3VyY2VzXG5cdHdyaXRlU2VjdGlvbih3cml0ZXIsIDEsICgpID0+IHtcblx0XHRmb3IgKGNvbnN0IGhhbmRsZXIgb2YgcmVzb3VyY2VIYW5kbGVycykge1xuXHRcdFx0aWYgKGhhbmRsZXIuaGFzKGltYWdlUmVzb3VyY2VzKSkge1xuXHRcdFx0XHR3cml0ZVNpZ25hdHVyZSh3cml0ZXIsICc4QklNJyk7XG5cdFx0XHRcdHdyaXRlVWludDE2KHdyaXRlciwgaGFuZGxlci5rZXkpO1xuXHRcdFx0XHR3cml0ZVBhc2NhbFN0cmluZyh3cml0ZXIsICcnLCAyKTtcblx0XHRcdFx0d3JpdGVTZWN0aW9uKHdyaXRlciwgMiwgKCkgPT4gaGFuZGxlci53cml0ZSh3cml0ZXIsIGltYWdlUmVzb3VyY2VzKSk7XG5cdFx0XHR9XG5cdFx0fVxuXHR9KTtcblxuXHQvLyBsYXllciBhbmQgbWFzayBpbmZvXG5cdHdyaXRlU2VjdGlvbih3cml0ZXIsIDIsICgpID0+IHtcblx0XHR3cml0ZUxheWVySW5mbyh0ZW1wQnVmZmVyLCB3cml0ZXIsIHBzZCwgZ2xvYmFsQWxwaGEsIG9wdCk7XG5cdFx0d3JpdGVHbG9iYWxMYXllck1hc2tJbmZvKHdyaXRlciwgcHNkLmdsb2JhbExheWVyTWFza0luZm8pO1xuXHRcdHdyaXRlQWRkaXRpb25hbExheWVySW5mbyh3cml0ZXIsIHBzZCwgcHNkLCBvcHQpO1xuXHR9LCB1bmRlZmluZWQsICEhb3B0LnBzYik7XG5cblx0Ly8gaW1hZ2UgZGF0YVxuXHRjb25zdCBjaGFubmVscyA9IGdsb2JhbEFscGhhID8gWzAsIDEsIDIsIDNdIDogWzAsIDEsIDJdO1xuXHRjb25zdCBkYXRhOiBQaXhlbERhdGEgPSBpbWFnZURhdGEgfHwge1xuXHRcdGRhdGE6IG5ldyBVaW50OEFycmF5KDQgKiBwc2Qud2lkdGggKiBwc2QuaGVpZ2h0KSxcblx0XHR3aWR0aDogcHNkLndpZHRoLFxuXHRcdGhlaWdodDogcHNkLmhlaWdodCxcblx0fTtcblxuXHR3cml0ZVVpbnQxNih3cml0ZXIsIENvbXByZXNzaW9uLlJsZUNvbXByZXNzZWQpO1xuXG5cdGlmIChSQVdfSU1BR0VfREFUQSAmJiAocHNkIGFzIGFueSkuaW1hZ2VEYXRhUmF3KSB7XG5cdFx0Y29uc29sZS5sb2coJ3dyaXRpbmcgcmF3IGltYWdlIGRhdGEnKTtcblx0XHR3cml0ZUJ5dGVzKHdyaXRlciwgKHBzZCBhcyBhbnkpLmltYWdlRGF0YVJhdyk7XG5cdH0gZWxzZSB7XG5cdFx0d3JpdGVCeXRlcyh3cml0ZXIsIHdyaXRlRGF0YVJMRSh0ZW1wQnVmZmVyLCBkYXRhLCBwc2Qud2lkdGgsIHBzZC5oZWlnaHQsIGNoYW5uZWxzLCAhIW9wdGlvbnMucHNiKSk7XG5cdH1cbn1cblxuZnVuY3Rpb24gd3JpdGVMYXllckluZm8odGVtcEJ1ZmZlcjogVWludDhBcnJheSwgd3JpdGVyOiBQc2RXcml0ZXIsIHBzZDogUHNkLCBnbG9iYWxBbHBoYTogYm9vbGVhbiwgb3B0aW9uczogRXh0ZW5kZWRXcml0ZU9wdGlvbnMpIHtcblx0d3JpdGVTZWN0aW9uKHdyaXRlciwgNCwgKCkgPT4ge1xuXHRcdGNvbnN0IGxheWVyczogTGF5ZXJbXSA9IFtdO1xuXG5cdFx0YWRkQ2hpbGRyZW4obGF5ZXJzLCBwc2QuY2hpbGRyZW4pO1xuXG5cdFx0aWYgKCFsYXllcnMubGVuZ3RoKSBsYXllcnMucHVzaCh7fSk7XG5cblx0XHR3cml0ZUludDE2KHdyaXRlciwgZ2xvYmFsQWxwaGEgPyAtbGF5ZXJzLmxlbmd0aCA6IGxheWVycy5sZW5ndGgpO1xuXG5cdFx0Y29uc3QgbGF5ZXJzRGF0YSA9IGxheWVycy5tYXAoKGwsIGkpID0+IGdldENoYW5uZWxzKHRlbXBCdWZmZXIsIGwsIGkgPT09IDAsIG9wdGlvbnMpKTtcblxuXHRcdC8vIGxheWVyIHJlY29yZHNcblx0XHRmb3IgKGNvbnN0IGxheWVyRGF0YSBvZiBsYXllcnNEYXRhKSB7XG5cdFx0XHRjb25zdCB7IGxheWVyLCB0b3AsIGxlZnQsIGJvdHRvbSwgcmlnaHQsIGNoYW5uZWxzIH0gPSBsYXllckRhdGE7XG5cblx0XHRcdHdyaXRlSW50MzIod3JpdGVyLCB0b3ApO1xuXHRcdFx0d3JpdGVJbnQzMih3cml0ZXIsIGxlZnQpO1xuXHRcdFx0d3JpdGVJbnQzMih3cml0ZXIsIGJvdHRvbSk7XG5cdFx0XHR3cml0ZUludDMyKHdyaXRlciwgcmlnaHQpO1xuXHRcdFx0d3JpdGVVaW50MTYod3JpdGVyLCBjaGFubmVscy5sZW5ndGgpO1xuXG5cdFx0XHRmb3IgKGNvbnN0IGMgb2YgY2hhbm5lbHMpIHtcblx0XHRcdFx0d3JpdGVJbnQxNih3cml0ZXIsIGMuY2hhbm5lbElkKTtcblx0XHRcdFx0aWYgKG9wdGlvbnMucHNiKSB3cml0ZVVpbnQzMih3cml0ZXIsIDApO1xuXHRcdFx0XHR3cml0ZVVpbnQzMih3cml0ZXIsIGMubGVuZ3RoKTtcblx0XHRcdH1cblxuXHRcdFx0d3JpdGVTaWduYXR1cmUod3JpdGVyLCAnOEJJTScpO1xuXHRcdFx0d3JpdGVTaWduYXR1cmUod3JpdGVyLCBmcm9tQmxlbmRNb2RlW2xheWVyLmJsZW5kTW9kZSFdIHx8ICdub3JtJyk7XG5cdFx0XHR3cml0ZVVpbnQ4KHdyaXRlciwgTWF0aC5yb3VuZChjbGFtcChsYXllci5vcGFjaXR5ID8/IDEsIDAsIDEpICogMjU1KSk7XG5cdFx0XHR3cml0ZVVpbnQ4KHdyaXRlciwgbGF5ZXIuY2xpcHBpbmcgPyAxIDogMCk7XG5cblx0XHRcdGxldCBmbGFncyA9IDB4MDg7IC8vIDEgZm9yIFBob3Rvc2hvcCA1LjAgYW5kIGxhdGVyLCB0ZWxscyBpZiBiaXQgNCBoYXMgdXNlZnVsIGluZm9ybWF0aW9uXG5cdFx0XHRpZiAobGF5ZXIudHJhbnNwYXJlbmN5UHJvdGVjdGVkKSBmbGFncyB8PSAweDAxO1xuXHRcdFx0aWYgKGxheWVyLmhpZGRlbikgZmxhZ3MgfD0gMHgwMjtcblx0XHRcdGlmIChsYXllci52ZWN0b3JNYXNrIHx8IChsYXllci5zZWN0aW9uRGl2aWRlciAmJiBsYXllci5zZWN0aW9uRGl2aWRlci50eXBlICE9PSBTZWN0aW9uRGl2aWRlclR5cGUuT3RoZXIpKSB7XG5cdFx0XHRcdGZsYWdzIHw9IDB4MTA7IC8vIHBpeGVsIGRhdGEgaXJyZWxldmFudCB0byBhcHBlYXJhbmNlIG9mIGRvY3VtZW50XG5cdFx0XHR9XG5cdFx0XHRpZiAobGF5ZXIuZWZmZWN0cyAmJiBoYXNNdWx0aUVmZmVjdHMobGF5ZXIuZWZmZWN0cykpIHtcblx0XHRcdFx0ZmxhZ3MgfD0gMHgyMDsgLy8ganVzdCBndWVzc2luZyB0aGlzIG9uZSwgbWlnaHQgYmUgY29tcGxldGVseSBpbmNvcnJlY3Rcblx0XHRcdH1cblxuXHRcdFx0d3JpdGVVaW50OCh3cml0ZXIsIGZsYWdzKTtcblx0XHRcdHdyaXRlVWludDgod3JpdGVyLCAwKTsgLy8gZmlsbGVyXG5cdFx0XHR3cml0ZVNlY3Rpb24od3JpdGVyLCAxLCAoKSA9PiB7XG5cdFx0XHRcdHdyaXRlTGF5ZXJNYXNrRGF0YSh3cml0ZXIsIGxheWVyLCBsYXllckRhdGEpO1xuXHRcdFx0XHR3cml0ZUxheWVyQmxlbmRpbmdSYW5nZXMod3JpdGVyLCBwc2QpO1xuXHRcdFx0XHR3cml0ZVBhc2NhbFN0cmluZyh3cml0ZXIsIGxheWVyLm5hbWUgfHwgJycsIDQpO1xuXHRcdFx0XHR3cml0ZUFkZGl0aW9uYWxMYXllckluZm8od3JpdGVyLCBsYXllciwgcHNkLCBvcHRpb25zKTtcblx0XHRcdH0pO1xuXHRcdH1cblxuXHRcdC8vIGxheWVyIGNoYW5uZWwgaW1hZ2UgZGF0YVxuXHRcdGZvciAoY29uc3QgbGF5ZXJEYXRhIG9mIGxheWVyc0RhdGEpIHtcblx0XHRcdGZvciAoY29uc3QgY2hhbm5lbCBvZiBsYXllckRhdGEuY2hhbm5lbHMpIHtcblx0XHRcdFx0d3JpdGVVaW50MTYod3JpdGVyLCBjaGFubmVsLmNvbXByZXNzaW9uKTtcblxuXHRcdFx0XHRpZiAoY2hhbm5lbC5idWZmZXIpIHtcblx0XHRcdFx0XHR3cml0ZUJ5dGVzKHdyaXRlciwgY2hhbm5lbC5idWZmZXIpO1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0fVxuXHR9LCB0cnVlLCBvcHRpb25zLnBzYik7XG59XG5cbmZ1bmN0aW9uIHdyaXRlTGF5ZXJNYXNrRGF0YSh3cml0ZXI6IFBzZFdyaXRlciwgeyBtYXNrIH06IExheWVyLCBsYXllckRhdGE6IExheWVyQ2hhbm5lbERhdGEpIHtcblx0d3JpdGVTZWN0aW9uKHdyaXRlciwgMSwgKCkgPT4ge1xuXHRcdGlmICghbWFzaykgcmV0dXJuO1xuXG5cdFx0Y29uc3QgbSA9IGxheWVyRGF0YS5tYXNrIHx8IHt9IGFzIFBhcnRpYWw8Qm91bmRzPjtcblx0XHR3cml0ZUludDMyKHdyaXRlciwgbS50b3AhKTtcblx0XHR3cml0ZUludDMyKHdyaXRlciwgbS5sZWZ0ISk7XG5cdFx0d3JpdGVJbnQzMih3cml0ZXIsIG0uYm90dG9tISk7XG5cdFx0d3JpdGVJbnQzMih3cml0ZXIsIG0ucmlnaHQhKTtcblx0XHR3cml0ZVVpbnQ4KHdyaXRlciwgbWFzay5kZWZhdWx0Q29sb3IhKTtcblxuXHRcdGxldCBwYXJhbXMgPSAwO1xuXHRcdGlmIChtYXNrLnVzZXJNYXNrRGVuc2l0eSAhPT0gdW5kZWZpbmVkKSBwYXJhbXMgfD0gTWFza1BhcmFtcy5Vc2VyTWFza0RlbnNpdHk7XG5cdFx0aWYgKG1hc2sudXNlck1hc2tGZWF0aGVyICE9PSB1bmRlZmluZWQpIHBhcmFtcyB8PSBNYXNrUGFyYW1zLlVzZXJNYXNrRmVhdGhlcjtcblx0XHRpZiAobWFzay52ZWN0b3JNYXNrRGVuc2l0eSAhPT0gdW5kZWZpbmVkKSBwYXJhbXMgfD0gTWFza1BhcmFtcy5WZWN0b3JNYXNrRGVuc2l0eTtcblx0XHRpZiAobWFzay52ZWN0b3JNYXNrRmVhdGhlciAhPT0gdW5kZWZpbmVkKSBwYXJhbXMgfD0gTWFza1BhcmFtcy5WZWN0b3JNYXNrRmVhdGhlcjtcblxuXHRcdGxldCBmbGFncyA9IDA7XG5cdFx0aWYgKG1hc2suZGlzYWJsZWQpIGZsYWdzIHw9IExheWVyTWFza0ZsYWdzLkxheWVyTWFza0Rpc2FibGVkO1xuXHRcdGlmIChtYXNrLnBvc2l0aW9uUmVsYXRpdmVUb0xheWVyKSBmbGFncyB8PSBMYXllck1hc2tGbGFncy5Qb3NpdGlvblJlbGF0aXZlVG9MYXllcjtcblx0XHRpZiAobWFzay5mcm9tVmVjdG9yRGF0YSkgZmxhZ3MgfD0gTGF5ZXJNYXNrRmxhZ3MuTGF5ZXJNYXNrRnJvbVJlbmRlcmluZ090aGVyRGF0YTtcblx0XHRpZiAocGFyYW1zKSBmbGFncyB8PSBMYXllck1hc2tGbGFncy5NYXNrSGFzUGFyYW1ldGVyc0FwcGxpZWRUb0l0O1xuXG5cdFx0d3JpdGVVaW50OCh3cml0ZXIsIGZsYWdzKTtcblxuXHRcdGlmIChwYXJhbXMpIHtcblx0XHRcdHdyaXRlVWludDgod3JpdGVyLCBwYXJhbXMpO1xuXG5cdFx0XHRpZiAobWFzay51c2VyTWFza0RlbnNpdHkgIT09IHVuZGVmaW5lZCkgd3JpdGVVaW50OCh3cml0ZXIsIE1hdGgucm91bmQobWFzay51c2VyTWFza0RlbnNpdHkgKiAweGZmKSk7XG5cdFx0XHRpZiAobWFzay51c2VyTWFza0ZlYXRoZXIgIT09IHVuZGVmaW5lZCkgd3JpdGVGbG9hdDY0KHdyaXRlciwgbWFzay51c2VyTWFza0ZlYXRoZXIpO1xuXHRcdFx0aWYgKG1hc2sudmVjdG9yTWFza0RlbnNpdHkgIT09IHVuZGVmaW5lZCkgd3JpdGVVaW50OCh3cml0ZXIsIE1hdGgucm91bmQobWFzay52ZWN0b3JNYXNrRGVuc2l0eSAqIDB4ZmYpKTtcblx0XHRcdGlmIChtYXNrLnZlY3Rvck1hc2tGZWF0aGVyICE9PSB1bmRlZmluZWQpIHdyaXRlRmxvYXQ2NCh3cml0ZXIsIG1hc2sudmVjdG9yTWFza0ZlYXRoZXIpO1xuXHRcdH1cblxuXHRcdC8vIFRPRE86IGhhbmRsZSByZXN0IG9mIHRoZSBmaWVsZHNcblxuXHRcdHdyaXRlWmVyb3Mod3JpdGVyLCAyKTtcblx0fSk7XG59XG5cbmZ1bmN0aW9uIHdyaXRlTGF5ZXJCbGVuZGluZ1Jhbmdlcyh3cml0ZXI6IFBzZFdyaXRlciwgcHNkOiBQc2QpIHtcblx0d3JpdGVTZWN0aW9uKHdyaXRlciwgMSwgKCkgPT4ge1xuXHRcdHdyaXRlVWludDMyKHdyaXRlciwgNjU1MzUpO1xuXHRcdHdyaXRlVWludDMyKHdyaXRlciwgNjU1MzUpO1xuXG5cdFx0bGV0IGNoYW5uZWxzID0gcHNkLmNoYW5uZWxzIHx8IDA7IC8vIFRPRE86IHVzZSBhbHdheXMgNCBpbnN0ZWFkID9cblx0XHQvLyBjaGFubmVscyA9IDQ7IC8vIFRFU1RJTkdcblxuXHRcdGZvciAobGV0IGkgPSAwOyBpIDwgY2hhbm5lbHM7IGkrKykge1xuXHRcdFx0d3JpdGVVaW50MzIod3JpdGVyLCA2NTUzNSk7XG5cdFx0XHR3cml0ZVVpbnQzMih3cml0ZXIsIDY1NTM1KTtcblx0XHR9XG5cdH0pO1xufVxuXG5mdW5jdGlvbiB3cml0ZUdsb2JhbExheWVyTWFza0luZm8od3JpdGVyOiBQc2RXcml0ZXIsIGluZm86IEdsb2JhbExheWVyTWFza0luZm8gfCB1bmRlZmluZWQpIHtcblx0d3JpdGVTZWN0aW9uKHdyaXRlciwgMSwgKCkgPT4ge1xuXHRcdGlmIChpbmZvKSB7XG5cdFx0XHR3cml0ZVVpbnQxNih3cml0ZXIsIGluZm8ub3ZlcmxheUNvbG9yU3BhY2UpO1xuXHRcdFx0d3JpdGVVaW50MTYod3JpdGVyLCBpbmZvLmNvbG9yU3BhY2UxKTtcblx0XHRcdHdyaXRlVWludDE2KHdyaXRlciwgaW5mby5jb2xvclNwYWNlMik7XG5cdFx0XHR3cml0ZVVpbnQxNih3cml0ZXIsIGluZm8uY29sb3JTcGFjZTMpO1xuXHRcdFx0d3JpdGVVaW50MTYod3JpdGVyLCBpbmZvLmNvbG9yU3BhY2U0KTtcblx0XHRcdHdyaXRlVWludDE2KHdyaXRlciwgaW5mby5vcGFjaXR5ICogMHhmZik7XG5cdFx0XHR3cml0ZVVpbnQ4KHdyaXRlciwgaW5mby5raW5kKTtcblx0XHRcdHdyaXRlWmVyb3Mod3JpdGVyLCAzKTtcblx0XHR9XG5cdH0pO1xufVxuXG5mdW5jdGlvbiB3cml0ZUFkZGl0aW9uYWxMYXllckluZm8od3JpdGVyOiBQc2RXcml0ZXIsIHRhcmdldDogTGF5ZXJBZGRpdGlvbmFsSW5mbywgcHNkOiBQc2QsIG9wdGlvbnM6IEV4dGVuZGVkV3JpdGVPcHRpb25zKSB7XG5cdGZvciAoY29uc3QgaGFuZGxlciBvZiBpbmZvSGFuZGxlcnMpIHtcblx0XHRsZXQga2V5ID0gaGFuZGxlci5rZXk7XG5cblx0XHRpZiAoa2V5ID09PSAnVHh0MicgJiYgb3B0aW9ucy5pbnZhbGlkYXRlVGV4dExheWVycykgY29udGludWU7XG5cdFx0aWYgKGtleSA9PT0gJ3Ztc2snICYmIG9wdGlvbnMucHNiKSBrZXkgPSAndnNtcyc7XG5cblx0XHRpZiAoaGFuZGxlci5oYXModGFyZ2V0KSkge1xuXHRcdFx0Y29uc3QgbGFyZ2UgPSBvcHRpb25zLnBzYiAmJiBsYXJnZUFkZGl0aW9uYWxJbmZvS2V5cy5pbmRleE9mKGtleSkgIT09IC0xO1xuXG5cdFx0XHR3cml0ZVNpZ25hdHVyZSh3cml0ZXIsIGxhcmdlID8gJzhCNjQnIDogJzhCSU0nKTtcblx0XHRcdHdyaXRlU2lnbmF0dXJlKHdyaXRlciwga2V5KTtcblxuXHRcdFx0Y29uc3QgZm91ckJ5dGVzID0ga2V5ID09PSAnVHh0MicgfHwga2V5ID09PSAnbHVuaScgfHwga2V5ID09PSAndm1zaycgfHwga2V5ID09PSAnYXJ0YicgfHwga2V5ID09PSAnYXJ0ZCcgfHxcblx0XHRcdFx0a2V5ID09PSAndm9naycgfHwga2V5ID09PSAnU29MZCcgfHwga2V5ID09PSAnbG5rMicgfHwga2V5ID09PSAndnNjZycgfHwga2V5ID09PSAndnNtcycgfHwga2V5ID09PSAnR2RGbCcgfHxcblx0XHRcdFx0a2V5ID09PSAnbG1meCcgfHwga2V5ID09PSAnbHJGWCcgfHwga2V5ID09PSAnY2luZicgfHwga2V5ID09PSAnUGxMZCcgfHwga2V5ID09PSAnQW5ubyc7XG5cblx0XHRcdHdyaXRlU2VjdGlvbih3cml0ZXIsIGZvdXJCeXRlcyA/IDQgOiAyLCAoKSA9PiB7XG5cdFx0XHRcdGhhbmRsZXIud3JpdGUod3JpdGVyLCB0YXJnZXQsIHBzZCwgb3B0aW9ucyk7XG5cdFx0XHR9LCBrZXkgIT09ICdUeHQyJyAmJiBrZXkgIT09ICdjaW5mJyAmJiBrZXkgIT09ICdleHRuJywgbGFyZ2UpO1xuXHRcdH1cblx0fVxufVxuXG5mdW5jdGlvbiBhZGRDaGlsZHJlbihsYXllcnM6IExheWVyW10sIGNoaWxkcmVuOiBMYXllcltdIHwgdW5kZWZpbmVkKSB7XG5cdGlmICghY2hpbGRyZW4pIHJldHVybjtcblxuXHRmb3IgKGNvbnN0IGMgb2YgY2hpbGRyZW4pIHtcblx0XHRpZiAoYy5jaGlsZHJlbiAmJiBjLmNhbnZhcykgdGhyb3cgbmV3IEVycm9yKGBJbnZhbGlkIGxheWVyLCBjYW5ub3QgaGF2ZSBib3RoICdjYW52YXMnIGFuZCAnY2hpbGRyZW4nIHByb3BlcnRpZXNgKTtcblx0XHRpZiAoYy5jaGlsZHJlbiAmJiBjLmltYWdlRGF0YSkgdGhyb3cgbmV3IEVycm9yKGBJbnZhbGlkIGxheWVyLCBjYW5ub3QgaGF2ZSBib3RoICdpbWFnZURhdGEnIGFuZCAnY2hpbGRyZW4nIHByb3BlcnRpZXNgKTtcblxuXHRcdGlmIChjLmNoaWxkcmVuKSB7XG5cdFx0XHRsYXllcnMucHVzaCh7XG5cdFx0XHRcdG5hbWU6ICc8L0xheWVyIGdyb3VwPicsXG5cdFx0XHRcdHNlY3Rpb25EaXZpZGVyOiB7XG5cdFx0XHRcdFx0dHlwZTogU2VjdGlvbkRpdmlkZXJUeXBlLkJvdW5kaW5nU2VjdGlvbkRpdmlkZXIsXG5cdFx0XHRcdH0sXG5cdFx0XHRcdC8vIFRFU1RJTkdcblx0XHRcdFx0Ly8gbmFtZVNvdXJjZTogJ2xzZXQnLFxuXHRcdFx0XHQvLyBpZDogWzQsIDAsIDAsIDgsIDExLCAwLCAwLCAwLCAwLCAxNF1bbGF5ZXJzLmxlbmd0aF0gfHwgMCxcblx0XHRcdFx0Ly8gbGF5ZXJDb2xvcjogJ25vbmUnLFxuXHRcdFx0XHQvLyB0aW1lc3RhbXA6IFsxNjExMzQ2ODE3LjM0OTAyMSwgMCwgMCwgMTYxMTM0NjgxNy4zNDkxNzUsIDE2MTEzNDY4MTcuMzQ5MTgzMywgMCwgMCwgMCwgMCwgMTYxMTM0NjgxNy4zNDk4MzJdW2xheWVycy5sZW5ndGhdIHx8IDAsXG5cdFx0XHRcdC8vIHByb3RlY3RlZDoge30sXG5cdFx0XHRcdC8vIHJlZmVyZW5jZVBvaW50OiB7IHg6IDAsIHk6IDAgfSxcblx0XHRcdH0pO1xuXHRcdFx0YWRkQ2hpbGRyZW4obGF5ZXJzLCBjLmNoaWxkcmVuKTtcblx0XHRcdGxheWVycy5wdXNoKHtcblx0XHRcdFx0c2VjdGlvbkRpdmlkZXI6IHtcblx0XHRcdFx0XHR0eXBlOiBjLm9wZW5lZCA9PT0gZmFsc2UgPyBTZWN0aW9uRGl2aWRlclR5cGUuQ2xvc2VkRm9sZGVyIDogU2VjdGlvbkRpdmlkZXJUeXBlLk9wZW5Gb2xkZXIsXG5cdFx0XHRcdFx0a2V5OiBmcm9tQmxlbmRNb2RlW2MuYmxlbmRNb2RlIV0gfHwgJ3Bhc3MnLFxuXHRcdFx0XHRcdHN1YlR5cGU6IDAsXG5cdFx0XHRcdH0sXG5cdFx0XHRcdC4uLmMsXG5cdFx0XHR9KTtcblx0XHR9IGVsc2Uge1xuXHRcdFx0bGF5ZXJzLnB1c2goeyAuLi5jIH0pO1xuXHRcdH1cblx0fVxufVxuXG5mdW5jdGlvbiByZXNpemVCdWZmZXIod3JpdGVyOiBQc2RXcml0ZXIsIHNpemU6IG51bWJlcikge1xuXHRsZXQgbmV3TGVuZ3RoID0gd3JpdGVyLmJ1ZmZlci5ieXRlTGVuZ3RoO1xuXG5cdGRvIHtcblx0XHRuZXdMZW5ndGggKj0gMjtcblx0fSB3aGlsZSAoc2l6ZSA+IG5ld0xlbmd0aCk7XG5cblx0Y29uc3QgbmV3QnVmZmVyID0gbmV3IEFycmF5QnVmZmVyKG5ld0xlbmd0aCk7XG5cdGNvbnN0IG5ld0J5dGVzID0gbmV3IFVpbnQ4QXJyYXkobmV3QnVmZmVyKTtcblx0Y29uc3Qgb2xkQnl0ZXMgPSBuZXcgVWludDhBcnJheSh3cml0ZXIuYnVmZmVyKTtcblx0bmV3Qnl0ZXMuc2V0KG9sZEJ5dGVzKTtcblx0d3JpdGVyLmJ1ZmZlciA9IG5ld0J1ZmZlcjtcblx0d3JpdGVyLnZpZXcgPSBuZXcgRGF0YVZpZXcod3JpdGVyLmJ1ZmZlcik7XG59XG5cbmZ1bmN0aW9uIGVuc3VyZVNpemUod3JpdGVyOiBQc2RXcml0ZXIsIHNpemU6IG51bWJlcikge1xuXHRpZiAoc2l6ZSA+IHdyaXRlci5idWZmZXIuYnl0ZUxlbmd0aCkge1xuXHRcdHJlc2l6ZUJ1ZmZlcih3cml0ZXIsIHNpemUpO1xuXHR9XG59XG5cbmZ1bmN0aW9uIGFkZFNpemUod3JpdGVyOiBQc2RXcml0ZXIsIHNpemU6IG51bWJlcikge1xuXHRjb25zdCBvZmZzZXQgPSB3cml0ZXIub2Zmc2V0O1xuXHRlbnN1cmVTaXplKHdyaXRlciwgd3JpdGVyLm9mZnNldCArPSBzaXplKTtcblx0cmV0dXJuIG9mZnNldDtcbn1cblxuZnVuY3Rpb24gY3JlYXRlVGh1bWJuYWlsKHBzZDogUHNkKSB7XG5cdGNvbnN0IGNhbnZhcyA9IGNyZWF0ZUNhbnZhcygxMCwgMTApO1xuXHRsZXQgc2NhbGUgPSAxO1xuXG5cdGlmIChwc2Qud2lkdGggPiBwc2QuaGVpZ2h0KSB7XG5cdFx0Y2FudmFzLndpZHRoID0gMTYwO1xuXHRcdGNhbnZhcy5oZWlnaHQgPSBNYXRoLmZsb29yKHBzZC5oZWlnaHQgKiAoY2FudmFzLndpZHRoIC8gcHNkLndpZHRoKSk7XG5cdFx0c2NhbGUgPSBjYW52YXMud2lkdGggLyBwc2Qud2lkdGg7XG5cdH0gZWxzZSB7XG5cdFx0Y2FudmFzLmhlaWdodCA9IDE2MDtcblx0XHRjYW52YXMud2lkdGggPSBNYXRoLmZsb29yKHBzZC53aWR0aCAqIChjYW52YXMuaGVpZ2h0IC8gcHNkLmhlaWdodCkpO1xuXHRcdHNjYWxlID0gY2FudmFzLmhlaWdodCAvIHBzZC5oZWlnaHQ7XG5cdH1cblxuXHRjb25zdCBjb250ZXh0ID0gY2FudmFzLmdldENvbnRleHQoJzJkJykhO1xuXHRjb250ZXh0LnNjYWxlKHNjYWxlLCBzY2FsZSk7XG5cblx0aWYgKHBzZC5pbWFnZURhdGEpIHtcblx0XHRjb25zdCB0ZW1wID0gY3JlYXRlQ2FudmFzKHBzZC5pbWFnZURhdGEud2lkdGgsIHBzZC5pbWFnZURhdGEuaGVpZ2h0KTtcblx0XHR0ZW1wLmdldENvbnRleHQoJzJkJykhLnB1dEltYWdlRGF0YShwc2QuaW1hZ2VEYXRhLCAwLCAwKTtcblx0XHRjb250ZXh0LmRyYXdJbWFnZSh0ZW1wLCAwLCAwKTtcblx0fSBlbHNlIGlmIChwc2QuY2FudmFzKSB7XG5cdFx0Y29udGV4dC5kcmF3SW1hZ2UocHNkLmNhbnZhcywgMCwgMCk7XG5cdH1cblxuXHRyZXR1cm4gY2FudmFzO1xufVxuXG5mdW5jdGlvbiBnZXRDaGFubmVscyhcblx0dGVtcEJ1ZmZlcjogVWludDhBcnJheSwgbGF5ZXI6IExheWVyLCBiYWNrZ3JvdW5kOiBib29sZWFuLCBvcHRpb25zOiBXcml0ZU9wdGlvbnNcbik6IExheWVyQ2hhbm5lbERhdGEge1xuXHRjb25zdCBsYXllckRhdGEgPSBnZXRMYXllckNoYW5uZWxzKHRlbXBCdWZmZXIsIGxheWVyLCBiYWNrZ3JvdW5kLCBvcHRpb25zKTtcblx0Y29uc3QgbWFzayA9IGxheWVyLm1hc2s7XG5cblx0aWYgKG1hc2spIHtcblx0XHRsZXQgeyB0b3AgPSAwLCBsZWZ0ID0gMCwgcmlnaHQgPSAwLCBib3R0b20gPSAwIH0gPSBtYXNrO1xuXHRcdGxldCB7IHdpZHRoLCBoZWlnaHQgfSA9IGdldExheWVyRGltZW50aW9ucyhtYXNrKTtcblx0XHRsZXQgaW1hZ2VEYXRhID0gbWFzay5pbWFnZURhdGE7XG5cblx0XHRpZiAoIWltYWdlRGF0YSAmJiBtYXNrLmNhbnZhcyAmJiB3aWR0aCAmJiBoZWlnaHQpIHtcblx0XHRcdGltYWdlRGF0YSA9IG1hc2suY2FudmFzLmdldENvbnRleHQoJzJkJykhLmdldEltYWdlRGF0YSgwLCAwLCB3aWR0aCwgaGVpZ2h0KTtcblx0XHR9XG5cblx0XHRpZiAod2lkdGggJiYgaGVpZ2h0ICYmIGltYWdlRGF0YSkge1xuXHRcdFx0cmlnaHQgPSBsZWZ0ICsgd2lkdGg7XG5cdFx0XHRib3R0b20gPSB0b3AgKyBoZWlnaHQ7XG5cblx0XHRcdGxldCBidWZmZXIgPSB3cml0ZURhdGFSTEUodGVtcEJ1ZmZlciwgaW1hZ2VEYXRhLCB3aWR0aCwgaGVpZ2h0LCBbMF0sICEhb3B0aW9ucy5wc2IpITtcblxuXHRcdFx0aWYgKFJBV19JTUFHRV9EQVRBICYmIChsYXllciBhcyBhbnkpLm1hc2tEYXRhUmF3KSB7XG5cdFx0XHRcdC8vIGNvbnNvbGUubG9nKCd3cml0dGVuIHJhdyBsYXllciBpbWFnZSBkYXRhJyk7XG5cdFx0XHRcdGJ1ZmZlciA9IChsYXllciBhcyBhbnkpLm1hc2tEYXRhUmF3O1xuXHRcdFx0fVxuXG5cdFx0XHRsYXllckRhdGEubWFzayA9IHsgdG9wLCBsZWZ0LCByaWdodCwgYm90dG9tIH07XG5cdFx0XHRsYXllckRhdGEuY2hhbm5lbHMucHVzaCh7XG5cdFx0XHRcdGNoYW5uZWxJZDogQ2hhbm5lbElELlVzZXJNYXNrLFxuXHRcdFx0XHRjb21wcmVzc2lvbjogQ29tcHJlc3Npb24uUmxlQ29tcHJlc3NlZCxcblx0XHRcdFx0YnVmZmVyOiBidWZmZXIsXG5cdFx0XHRcdGxlbmd0aDogMiArIGJ1ZmZlci5sZW5ndGgsXG5cdFx0XHR9KTtcblx0XHR9IGVsc2Uge1xuXHRcdFx0bGF5ZXJEYXRhLm1hc2sgPSB7IHRvcDogMCwgbGVmdDogMCwgcmlnaHQ6IDAsIGJvdHRvbTogMCB9O1xuXHRcdFx0bGF5ZXJEYXRhLmNoYW5uZWxzLnB1c2goe1xuXHRcdFx0XHRjaGFubmVsSWQ6IENoYW5uZWxJRC5Vc2VyTWFzayxcblx0XHRcdFx0Y29tcHJlc3Npb246IENvbXByZXNzaW9uLlJhd0RhdGEsXG5cdFx0XHRcdGJ1ZmZlcjogbmV3IFVpbnQ4QXJyYXkoMCksXG5cdFx0XHRcdGxlbmd0aDogMCxcblx0XHRcdH0pO1xuXHRcdH1cblx0fVxuXG5cdHJldHVybiBsYXllckRhdGE7XG59XG5cbmZ1bmN0aW9uIGdldExheWVyRGltZW50aW9ucyh7IGNhbnZhcywgaW1hZ2VEYXRhIH06IExheWVyKTogeyB3aWR0aDogbnVtYmVyOyBoZWlnaHQ6IG51bWJlcjsgfSB7XG5cdHJldHVybiBpbWFnZURhdGEgfHwgY2FudmFzIHx8IHsgd2lkdGg6IDAsIGhlaWdodDogMCB9O1xufVxuXG5mdW5jdGlvbiBjcm9wSW1hZ2VEYXRhKGRhdGE6IEltYWdlRGF0YSwgbGVmdDogbnVtYmVyLCB0b3A6IG51bWJlciwgd2lkdGg6IG51bWJlciwgaGVpZ2h0OiBudW1iZXIpIHtcblx0Y29uc3QgY3JvcHBlZERhdGEgPSBjcmVhdGVJbWFnZURhdGEod2lkdGgsIGhlaWdodCk7XG5cdGNvbnN0IHNyY0RhdGEgPSBkYXRhLmRhdGE7XG5cdGNvbnN0IGRzdERhdGEgPSBjcm9wcGVkRGF0YS5kYXRhO1xuXG5cdGZvciAobGV0IHkgPSAwOyB5IDwgaGVpZ2h0OyB5KyspIHtcblx0XHRmb3IgKGxldCB4ID0gMDsgeCA8IHdpZHRoOyB4KyspIHtcblx0XHRcdGxldCBzcmMgPSAoKHggKyBsZWZ0KSArICh5ICsgdG9wKSAqIHdpZHRoKSAqIDQ7XG5cdFx0XHRsZXQgZHN0ID0gKHggKyB5ICogd2lkdGgpICogNDtcblx0XHRcdGRzdERhdGFbZHN0XSA9IHNyY0RhdGFbc3JjXTtcblx0XHRcdGRzdERhdGFbZHN0ICsgMV0gPSBzcmNEYXRhW3NyYyArIDFdO1xuXHRcdFx0ZHN0RGF0YVtkc3QgKyAyXSA9IHNyY0RhdGFbc3JjICsgMl07XG5cdFx0XHRkc3REYXRhW2RzdCArIDNdID0gc3JjRGF0YVtzcmMgKyAzXTtcblx0XHR9XG5cdH1cblxuXHRyZXR1cm4gY3JvcHBlZERhdGE7XG59XG5cbmZ1bmN0aW9uIGdldExheWVyQ2hhbm5lbHMoXG5cdHRlbXBCdWZmZXI6IFVpbnQ4QXJyYXksIGxheWVyOiBMYXllciwgYmFja2dyb3VuZDogYm9vbGVhbiwgb3B0aW9uczogV3JpdGVPcHRpb25zXG4pOiBMYXllckNoYW5uZWxEYXRhIHtcblx0bGV0IHsgdG9wID0gMCwgbGVmdCA9IDAsIHJpZ2h0ID0gMCwgYm90dG9tID0gMCB9ID0gbGF5ZXI7XG5cdGxldCBjaGFubmVsczogQ2hhbm5lbERhdGFbXSA9IFtcblx0XHR7IGNoYW5uZWxJZDogQ2hhbm5lbElELlRyYW5zcGFyZW5jeSwgY29tcHJlc3Npb246IENvbXByZXNzaW9uLlJhd0RhdGEsIGJ1ZmZlcjogdW5kZWZpbmVkLCBsZW5ndGg6IDIgfSxcblx0XHR7IGNoYW5uZWxJZDogQ2hhbm5lbElELlJlZCwgY29tcHJlc3Npb246IENvbXByZXNzaW9uLlJhd0RhdGEsIGJ1ZmZlcjogdW5kZWZpbmVkLCBsZW5ndGg6IDIgfSxcblx0XHR7IGNoYW5uZWxJZDogQ2hhbm5lbElELkdyZWVuLCBjb21wcmVzc2lvbjogQ29tcHJlc3Npb24uUmF3RGF0YSwgYnVmZmVyOiB1bmRlZmluZWQsIGxlbmd0aDogMiB9LFxuXHRcdHsgY2hhbm5lbElkOiBDaGFubmVsSUQuQmx1ZSwgY29tcHJlc3Npb246IENvbXByZXNzaW9uLlJhd0RhdGEsIGJ1ZmZlcjogdW5kZWZpbmVkLCBsZW5ndGg6IDIgfSxcblx0XTtcblxuXHRsZXQgeyB3aWR0aCwgaGVpZ2h0IH0gPSBnZXRMYXllckRpbWVudGlvbnMobGF5ZXIpO1xuXG5cdGlmICghKGxheWVyLmNhbnZhcyB8fCBsYXllci5pbWFnZURhdGEpIHx8ICF3aWR0aCB8fCAhaGVpZ2h0KSB7XG5cdFx0cmlnaHQgPSBsZWZ0O1xuXHRcdGJvdHRvbSA9IHRvcDtcblx0XHRyZXR1cm4geyBsYXllciwgdG9wLCBsZWZ0LCByaWdodCwgYm90dG9tLCBjaGFubmVscyB9O1xuXHR9XG5cblx0cmlnaHQgPSBsZWZ0ICsgd2lkdGg7XG5cdGJvdHRvbSA9IHRvcCArIGhlaWdodDtcblxuXHRsZXQgZGF0YSA9IGxheWVyLmltYWdlRGF0YSB8fCBsYXllci5jYW52YXMhLmdldENvbnRleHQoJzJkJykhLmdldEltYWdlRGF0YSgwLCAwLCB3aWR0aCwgaGVpZ2h0KTtcblxuXHRpZiAob3B0aW9ucy50cmltSW1hZ2VEYXRhKSB7XG5cdFx0Y29uc3QgdHJpbW1lZCA9IHRyaW1EYXRhKGRhdGEpO1xuXG5cdFx0aWYgKHRyaW1tZWQubGVmdCAhPT0gMCB8fCB0cmltbWVkLnRvcCAhPT0gMCB8fCB0cmltbWVkLnJpZ2h0ICE9PSBkYXRhLndpZHRoIHx8IHRyaW1tZWQuYm90dG9tICE9PSBkYXRhLmhlaWdodCkge1xuXHRcdFx0bGVmdCArPSB0cmltbWVkLmxlZnQ7XG5cdFx0XHR0b3AgKz0gdHJpbW1lZC50b3A7XG5cdFx0XHRyaWdodCAtPSAoZGF0YS53aWR0aCAtIHRyaW1tZWQucmlnaHQpO1xuXHRcdFx0Ym90dG9tIC09IChkYXRhLmhlaWdodCAtIHRyaW1tZWQuYm90dG9tKTtcblx0XHRcdHdpZHRoID0gcmlnaHQgLSBsZWZ0O1xuXHRcdFx0aGVpZ2h0ID0gYm90dG9tIC0gdG9wO1xuXG5cdFx0XHRpZiAoIXdpZHRoIHx8ICFoZWlnaHQpIHtcblx0XHRcdFx0cmV0dXJuIHsgbGF5ZXIsIHRvcCwgbGVmdCwgcmlnaHQsIGJvdHRvbSwgY2hhbm5lbHMgfTtcblx0XHRcdH1cblxuXHRcdFx0aWYgKGxheWVyLmltYWdlRGF0YSkge1xuXHRcdFx0XHRkYXRhID0gY3JvcEltYWdlRGF0YShkYXRhLCB0cmltbWVkLmxlZnQsIHRyaW1tZWQudG9wLCB3aWR0aCwgaGVpZ2h0KTtcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdGRhdGEgPSBsYXllci5jYW52YXMhLmdldENvbnRleHQoJzJkJykhLmdldEltYWdlRGF0YSh0cmltbWVkLmxlZnQsIHRyaW1tZWQudG9wLCB3aWR0aCwgaGVpZ2h0KTtcblx0XHRcdH1cblx0XHR9XG5cdH1cblxuXHRjb25zdCBjaGFubmVsSWRzID0gW1xuXHRcdENoYW5uZWxJRC5SZWQsXG5cdFx0Q2hhbm5lbElELkdyZWVuLFxuXHRcdENoYW5uZWxJRC5CbHVlLFxuXHRdO1xuXG5cdGlmICghYmFja2dyb3VuZCB8fCBvcHRpb25zLm5vQmFja2dyb3VuZCB8fCBsYXllci5tYXNrIHx8IGhhc0FscGhhKGRhdGEpIHx8IChSQVdfSU1BR0VfREFUQSAmJiAobGF5ZXIgYXMgYW55KS5pbWFnZURhdGFSYXc/LlsnLTEnXSkpIHtcblx0XHRjaGFubmVsSWRzLnVuc2hpZnQoQ2hhbm5lbElELlRyYW5zcGFyZW5jeSk7XG5cdH1cblxuXHRjaGFubmVscyA9IGNoYW5uZWxJZHMubWFwKGNoYW5uZWwgPT4ge1xuXHRcdGNvbnN0IG9mZnNldCA9IG9mZnNldEZvckNoYW5uZWwoY2hhbm5lbCk7XG5cdFx0bGV0IGJ1ZmZlciA9IHdyaXRlRGF0YVJMRSh0ZW1wQnVmZmVyLCBkYXRhLCB3aWR0aCwgaGVpZ2h0LCBbb2Zmc2V0XSwgISFvcHRpb25zLnBzYikhO1xuXG5cdFx0aWYgKFJBV19JTUFHRV9EQVRBICYmIChsYXllciBhcyBhbnkpLmltYWdlRGF0YVJhdykge1xuXHRcdFx0Ly8gY29uc29sZS5sb2coJ3dyaXR0ZW4gcmF3IGxheWVyIGltYWdlIGRhdGEnKTtcblx0XHRcdGJ1ZmZlciA9IChsYXllciBhcyBhbnkpLmltYWdlRGF0YVJhd1tjaGFubmVsXTtcblx0XHR9XG5cblx0XHRyZXR1cm4ge1xuXHRcdFx0Y2hhbm5lbElkOiBjaGFubmVsLFxuXHRcdFx0Y29tcHJlc3Npb246IENvbXByZXNzaW9uLlJsZUNvbXByZXNzZWQsXG5cdFx0XHRidWZmZXI6IGJ1ZmZlcixcblx0XHRcdGxlbmd0aDogMiArIGJ1ZmZlci5sZW5ndGgsXG5cdFx0fTtcblx0fSk7XG5cblx0cmV0dXJuIHsgbGF5ZXIsIHRvcCwgbGVmdCwgcmlnaHQsIGJvdHRvbSwgY2hhbm5lbHMgfTtcbn1cblxuZnVuY3Rpb24gaXNSb3dFbXB0eSh7IGRhdGEsIHdpZHRoIH06IFBpeGVsRGF0YSwgeTogbnVtYmVyLCBsZWZ0OiBudW1iZXIsIHJpZ2h0OiBudW1iZXIpIHtcblx0Y29uc3Qgc3RhcnQgPSAoKHkgKiB3aWR0aCArIGxlZnQpICogNCArIDMpIHwgMDtcblx0Y29uc3QgZW5kID0gKHN0YXJ0ICsgKHJpZ2h0IC0gbGVmdCkgKiA0KSB8IDA7XG5cblx0Zm9yIChsZXQgaSA9IHN0YXJ0OyBpIDwgZW5kOyBpID0gKGkgKyA0KSB8IDApIHtcblx0XHRpZiAoZGF0YVtpXSAhPT0gMCkge1xuXHRcdFx0cmV0dXJuIGZhbHNlO1xuXHRcdH1cblx0fVxuXG5cdHJldHVybiB0cnVlO1xufVxuXG5mdW5jdGlvbiBpc0NvbEVtcHR5KHsgZGF0YSwgd2lkdGggfTogUGl4ZWxEYXRhLCB4OiBudW1iZXIsIHRvcDogbnVtYmVyLCBib3R0b206IG51bWJlcikge1xuXHRjb25zdCBzdHJpZGUgPSAod2lkdGggKiA0KSB8IDA7XG5cdGNvbnN0IHN0YXJ0ID0gKHRvcCAqIHN0cmlkZSArIHggKiA0ICsgMykgfCAwO1xuXG5cdGZvciAobGV0IHkgPSB0b3AsIGkgPSBzdGFydDsgeSA8IGJvdHRvbTsgeSsrLCBpID0gKGkgKyBzdHJpZGUpIHwgMCkge1xuXHRcdGlmIChkYXRhW2ldICE9PSAwKSB7XG5cdFx0XHRyZXR1cm4gZmFsc2U7XG5cdFx0fVxuXHR9XG5cblx0cmV0dXJuIHRydWU7XG59XG5cbmZ1bmN0aW9uIHRyaW1EYXRhKGRhdGE6IFBpeGVsRGF0YSkge1xuXHRsZXQgdG9wID0gMDtcblx0bGV0IGxlZnQgPSAwO1xuXHRsZXQgcmlnaHQgPSBkYXRhLndpZHRoO1xuXHRsZXQgYm90dG9tID0gZGF0YS5oZWlnaHQ7XG5cblx0d2hpbGUgKHRvcCA8IGJvdHRvbSAmJiBpc1Jvd0VtcHR5KGRhdGEsIHRvcCwgbGVmdCwgcmlnaHQpKVxuXHRcdHRvcCsrO1xuXHR3aGlsZSAoYm90dG9tID4gdG9wICYmIGlzUm93RW1wdHkoZGF0YSwgYm90dG9tIC0gMSwgbGVmdCwgcmlnaHQpKVxuXHRcdGJvdHRvbS0tO1xuXHR3aGlsZSAobGVmdCA8IHJpZ2h0ICYmIGlzQ29sRW1wdHkoZGF0YSwgbGVmdCwgdG9wLCBib3R0b20pKVxuXHRcdGxlZnQrKztcblx0d2hpbGUgKHJpZ2h0ID4gbGVmdCAmJiBpc0NvbEVtcHR5KGRhdGEsIHJpZ2h0IC0gMSwgdG9wLCBib3R0b20pKVxuXHRcdHJpZ2h0LS07XG5cblx0cmV0dXJuIHsgdG9wLCBsZWZ0LCByaWdodCwgYm90dG9tIH07XG59XG5cbmV4cG9ydCBmdW5jdGlvbiB3cml0ZUNvbG9yKHdyaXRlcjogUHNkV3JpdGVyLCBjb2xvcjogQ29sb3IgfCB1bmRlZmluZWQpIHtcblx0aWYgKCFjb2xvcikge1xuXHRcdHdyaXRlVWludDE2KHdyaXRlciwgQ29sb3JTcGFjZS5SR0IpO1xuXHRcdHdyaXRlWmVyb3Mod3JpdGVyLCA4KTtcblx0fSBlbHNlIGlmICgncicgaW4gY29sb3IpIHtcblx0XHR3cml0ZVVpbnQxNih3cml0ZXIsIENvbG9yU3BhY2UuUkdCKTtcblx0XHR3cml0ZVVpbnQxNih3cml0ZXIsIE1hdGgucm91bmQoY29sb3IuciAqIDI1NykpO1xuXHRcdHdyaXRlVWludDE2KHdyaXRlciwgTWF0aC5yb3VuZChjb2xvci5nICogMjU3KSk7XG5cdFx0d3JpdGVVaW50MTYod3JpdGVyLCBNYXRoLnJvdW5kKGNvbG9yLmIgKiAyNTcpKTtcblx0XHR3cml0ZVVpbnQxNih3cml0ZXIsIDApO1xuXHR9IGVsc2UgaWYgKCdsJyBpbiBjb2xvcikge1xuXHRcdHdyaXRlVWludDE2KHdyaXRlciwgQ29sb3JTcGFjZS5MYWIpO1xuXHRcdHdyaXRlSW50MTYod3JpdGVyLCBNYXRoLnJvdW5kKGNvbG9yLmwgKiAxMDAwMCkpO1xuXHRcdHdyaXRlSW50MTYod3JpdGVyLCBNYXRoLnJvdW5kKGNvbG9yLmEgPCAwID8gKGNvbG9yLmEgKiAxMjgwMCkgOiAoY29sb3IuYSAqIDEyNzAwKSkpO1xuXHRcdHdyaXRlSW50MTYod3JpdGVyLCBNYXRoLnJvdW5kKGNvbG9yLmIgPCAwID8gKGNvbG9yLmIgKiAxMjgwMCkgOiAoY29sb3IuYiAqIDEyNzAwKSkpO1xuXHRcdHdyaXRlVWludDE2KHdyaXRlciwgMCk7XG5cdH0gZWxzZSBpZiAoJ2gnIGluIGNvbG9yKSB7XG5cdFx0d3JpdGVVaW50MTYod3JpdGVyLCBDb2xvclNwYWNlLkhTQik7XG5cdFx0d3JpdGVVaW50MTYod3JpdGVyLCBNYXRoLnJvdW5kKGNvbG9yLmggKiAweGZmZmYpKTtcblx0XHR3cml0ZVVpbnQxNih3cml0ZXIsIE1hdGgucm91bmQoY29sb3IucyAqIDB4ZmZmZikpO1xuXHRcdHdyaXRlVWludDE2KHdyaXRlciwgTWF0aC5yb3VuZChjb2xvci5iICogMHhmZmZmKSk7XG5cdFx0d3JpdGVVaW50MTYod3JpdGVyLCAwKTtcblx0fSBlbHNlIGlmICgnYycgaW4gY29sb3IpIHtcblx0XHR3cml0ZVVpbnQxNih3cml0ZXIsIENvbG9yU3BhY2UuQ01ZSyk7XG5cdFx0d3JpdGVVaW50MTYod3JpdGVyLCBNYXRoLnJvdW5kKGNvbG9yLmMgKiAyNTcpKTtcblx0XHR3cml0ZVVpbnQxNih3cml0ZXIsIE1hdGgucm91bmQoY29sb3IubSAqIDI1NykpO1xuXHRcdHdyaXRlVWludDE2KHdyaXRlciwgTWF0aC5yb3VuZChjb2xvci55ICogMjU3KSk7XG5cdFx0d3JpdGVVaW50MTYod3JpdGVyLCBNYXRoLnJvdW5kKGNvbG9yLmsgKiAyNTcpKTtcblx0fSBlbHNlIHtcblx0XHR3cml0ZVVpbnQxNih3cml0ZXIsIENvbG9yU3BhY2UuR3JheXNjYWxlKTtcblx0XHR3cml0ZVVpbnQxNih3cml0ZXIsIE1hdGgucm91bmQoY29sb3IuayAqIDEwMDAwIC8gMjU1KSk7XG5cdFx0d3JpdGVaZXJvcyh3cml0ZXIsIDYpO1xuXHR9XG59XG4iXSwic291cmNlUm9vdCI6Ii9ob21lL21hbmgva2FvcGl6L2VlbC9hZy1wc2Qvc3JjIn0=
