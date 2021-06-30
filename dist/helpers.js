"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.initializeCanvas = exports.createImageData = exports.createCanvasFromData = exports.createCanvas = exports.writeDataRLE = exports.writeDataRaw = exports.decodeBitmap = exports.resetImageData = exports.hasAlpha = exports.clamp = exports.offsetForChannel = exports.Compression = exports.ChannelID = exports.MaskParams = exports.LayerMaskFlags = exports.ColorSpace = exports.createEnum = exports.revMap = exports.largeAdditionalInfoKeys = exports.layerColors = exports.toBlendMode = exports.fromBlendMode = exports.RAW_IMAGE_DATA = exports.MOCK_HANDLERS = void 0;
var base64_js_1 = require("base64-js");
exports.MOCK_HANDLERS = false;
exports.RAW_IMAGE_DATA = false;
exports.fromBlendMode = {};
exports.toBlendMode = {
    'pass': 'pass through',
    'norm': 'normal',
    'diss': 'dissolve',
    'dark': 'darken',
    'mul ': 'multiply',
    'idiv': 'color burn',
    'lbrn': 'linear burn',
    'dkCl': 'darker color',
    'lite': 'lighten',
    'scrn': 'screen',
    'div ': 'color dodge',
    'lddg': 'linear dodge',
    'lgCl': 'lighter color',
    'over': 'overlay',
    'sLit': 'soft light',
    'hLit': 'hard light',
    'vLit': 'vivid light',
    'lLit': 'linear light',
    'pLit': 'pin light',
    'hMix': 'hard mix',
    'diff': 'difference',
    'smud': 'exclusion',
    'fsub': 'subtract',
    'fdiv': 'divide',
    'hue ': 'hue',
    'sat ': 'saturation',
    'colr': 'color',
    'lum ': 'luminosity',
};
Object.keys(exports.toBlendMode).forEach(function (key) { return exports.fromBlendMode[exports.toBlendMode[key]] = key; });
exports.layerColors = [
    'none', 'red', 'orange', 'yellow', 'green', 'blue', 'violet', 'gray'
];
exports.largeAdditionalInfoKeys = [
    // from documentation
    'LMsk', 'Lr16', 'Lr32', 'Layr', 'Mt16', 'Mt32', 'Mtrn', 'Alph', 'FMsk', 'lnk2', 'FEid', 'FXid', 'PxSD',
    // from guessing
    'cinf',
];
function revMap(map) {
    var result = {};
    Object.keys(map).forEach(function (key) { return result[map[key]] = key; });
    return result;
}
exports.revMap = revMap;
function createEnum(prefix, def, map) {
    var rev = revMap(map);
    var decode = function (val) {
        var value = val.split('.')[1];
        if (value && !rev[value])
            throw new Error("Unrecognized value for enum: '" + val + "'");
        return rev[value] || def;
    };
    var encode = function (val) {
        if (val && !map[val])
            throw new Error("Invalid value for enum: '" + val + "'");
        return prefix + "." + (map[val] || map[def]);
    };
    return { decode: decode, encode: encode };
}
exports.createEnum = createEnum;
var ColorSpace;
(function (ColorSpace) {
    ColorSpace[ColorSpace["RGB"] = 0] = "RGB";
    ColorSpace[ColorSpace["HSB"] = 1] = "HSB";
    ColorSpace[ColorSpace["CMYK"] = 2] = "CMYK";
    ColorSpace[ColorSpace["Lab"] = 7] = "Lab";
    ColorSpace[ColorSpace["Grayscale"] = 8] = "Grayscale";
})(ColorSpace = exports.ColorSpace || (exports.ColorSpace = {}));
var LayerMaskFlags;
(function (LayerMaskFlags) {
    LayerMaskFlags[LayerMaskFlags["PositionRelativeToLayer"] = 1] = "PositionRelativeToLayer";
    LayerMaskFlags[LayerMaskFlags["LayerMaskDisabled"] = 2] = "LayerMaskDisabled";
    LayerMaskFlags[LayerMaskFlags["InvertLayerMaskWhenBlending"] = 4] = "InvertLayerMaskWhenBlending";
    LayerMaskFlags[LayerMaskFlags["LayerMaskFromRenderingOtherData"] = 8] = "LayerMaskFromRenderingOtherData";
    LayerMaskFlags[LayerMaskFlags["MaskHasParametersAppliedToIt"] = 16] = "MaskHasParametersAppliedToIt";
})(LayerMaskFlags = exports.LayerMaskFlags || (exports.LayerMaskFlags = {}));
var MaskParams;
(function (MaskParams) {
    MaskParams[MaskParams["UserMaskDensity"] = 1] = "UserMaskDensity";
    MaskParams[MaskParams["UserMaskFeather"] = 2] = "UserMaskFeather";
    MaskParams[MaskParams["VectorMaskDensity"] = 4] = "VectorMaskDensity";
    MaskParams[MaskParams["VectorMaskFeather"] = 8] = "VectorMaskFeather";
})(MaskParams = exports.MaskParams || (exports.MaskParams = {}));
var ChannelID;
(function (ChannelID) {
    ChannelID[ChannelID["Red"] = 0] = "Red";
    ChannelID[ChannelID["Green"] = 1] = "Green";
    ChannelID[ChannelID["Blue"] = 2] = "Blue";
    ChannelID[ChannelID["Transparency"] = -1] = "Transparency";
    ChannelID[ChannelID["UserMask"] = -2] = "UserMask";
    ChannelID[ChannelID["RealUserMask"] = -3] = "RealUserMask";
})(ChannelID = exports.ChannelID || (exports.ChannelID = {}));
var Compression;
(function (Compression) {
    Compression[Compression["RawData"] = 0] = "RawData";
    Compression[Compression["RleCompressed"] = 1] = "RleCompressed";
    Compression[Compression["ZipWithoutPrediction"] = 2] = "ZipWithoutPrediction";
    Compression[Compression["ZipWithPrediction"] = 3] = "ZipWithPrediction";
})(Compression = exports.Compression || (exports.Compression = {}));
function offsetForChannel(channelId) {
    switch (channelId) {
        case 0 /* Red */: return 0;
        case 1 /* Green */: return 1;
        case 2 /* Blue */: return 2;
        case -1 /* Transparency */: return 3;
        default: return channelId + 1;
    }
}
exports.offsetForChannel = offsetForChannel;
function clamp(value, min, max) {
    return value < min ? min : (value > max ? max : value);
}
exports.clamp = clamp;
function hasAlpha(data) {
    var size = data.width * data.height * 4;
    for (var i = 3; i < size; i += 4) {
        if (data.data[i] !== 255) {
            return true;
        }
    }
    return false;
}
exports.hasAlpha = hasAlpha;
function resetImageData(_a) {
    var width = _a.width, height = _a.height, data = _a.data;
    var size = (width * height) | 0;
    var buffer = new Uint32Array(data.buffer);
    for (var p = 0; p < size; p = (p + 1) | 0) {
        buffer[p] = 0xff000000;
    }
}
exports.resetImageData = resetImageData;
function decodeBitmap(input, output, width, height) {
    for (var y = 0, p = 0, o = 0; y < height; y++) {
        for (var x = 0; x < width;) {
            var b = input[o++];
            for (var i = 0; i < 8 && x < width; i++, x++) {
                var v = b & 0x80 ? 0 : 255;
                b = b << 1;
                output[p++] = v;
                output[p++] = v;
                output[p++] = v;
                output[p++] = 255;
            }
        }
    }
}
exports.decodeBitmap = decodeBitmap;
function writeDataRaw(data, offset, width, height) {
    if (!width || !height)
        return undefined;
    var array = new Uint8Array(width * height);
    for (var i = 0; i < array.length; i++) {
        array[i] = data.data[i * 4 + offset];
    }
    return array;
}
exports.writeDataRaw = writeDataRaw;
function writeDataRLE(buffer, _a, width, height, offsets, large) {
    var data = _a.data;
    if (!width || !height)
        return undefined;
    var stride = (4 * width) | 0;
    var ol = 0;
    var o = (offsets.length * (large ? 4 : 2) * height) | 0;
    for (var _i = 0, offsets_1 = offsets; _i < offsets_1.length; _i++) {
        var offset = offsets_1[_i];
        for (var y = 0, p = offset | 0; y < height; y++) {
            var strideStart = (y * stride) | 0;
            var strideEnd = (strideStart + stride) | 0;
            var lastIndex = (strideEnd + offset - 4) | 0;
            var lastIndex2 = (lastIndex - 4) | 0;
            var startOffset = o;
            for (p = (strideStart + offset) | 0; p < strideEnd; p = (p + 4) | 0) {
                if (p < lastIndex2) {
                    var value1 = data[p];
                    p = (p + 4) | 0;
                    var value2 = data[p];
                    p = (p + 4) | 0;
                    var value3 = data[p];
                    if (value1 === value2 && value1 === value3) {
                        var count = 3;
                        while (count < 128 && p < lastIndex && data[(p + 4) | 0] === value1) {
                            count = (count + 1) | 0;
                            p = (p + 4) | 0;
                        }
                        buffer[o++] = 1 - count;
                        buffer[o++] = value1;
                    }
                    else {
                        var countIndex = o;
                        var writeLast = true;
                        var count = 1;
                        buffer[o++] = 0;
                        buffer[o++] = value1;
                        while (p < lastIndex && count < 128) {
                            p = (p + 4) | 0;
                            value1 = value2;
                            value2 = value3;
                            value3 = data[p];
                            if (value1 === value2 && value1 === value3) {
                                p = (p - 12) | 0;
                                writeLast = false;
                                break;
                            }
                            else {
                                count++;
                                buffer[o++] = value1;
                            }
                        }
                        if (writeLast) {
                            if (count < 127) {
                                buffer[o++] = value2;
                                buffer[o++] = value3;
                                count += 2;
                            }
                            else if (count < 128) {
                                buffer[o++] = value2;
                                count++;
                                p = (p - 4) | 0;
                            }
                            else {
                                p = (p - 8) | 0;
                            }
                        }
                        buffer[countIndex] = count - 1;
                    }
                }
                else if (p === lastIndex) {
                    buffer[o++] = 0;
                    buffer[o++] = data[p];
                }
                else { // p === lastIndex2
                    buffer[o++] = 1;
                    buffer[o++] = data[p];
                    p = (p + 4) | 0;
                    buffer[o++] = data[p];
                }
            }
            var length_1 = o - startOffset;
            if (large) {
                buffer[ol++] = (length_1 >> 24) & 0xff;
                buffer[ol++] = (length_1 >> 16) & 0xff;
            }
            buffer[ol++] = (length_1 >> 8) & 0xff;
            buffer[ol++] = length_1 & 0xff;
        }
    }
    return buffer.slice(0, o);
}
exports.writeDataRLE = writeDataRLE;
var createCanvas = function () {
    throw new Error('Canvas not initialized, use initializeCanvas method to set up createCanvas method');
};
exports.createCanvas = createCanvas;
var createCanvasFromData = function () {
    throw new Error('Canvas not initialized, use initializeCanvas method to set up createCanvasFromData method');
};
exports.createCanvasFromData = createCanvasFromData;
var tempCanvas = undefined;
var createImageData = function (width, height) {
    if (!tempCanvas)
        tempCanvas = exports.createCanvas(1, 1);
    return tempCanvas.getContext('2d').createImageData(width, height);
};
exports.createImageData = createImageData;
if (typeof document !== 'undefined') {
    exports.createCanvas = function (width, height) {
        var canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        return canvas;
    };
    exports.createCanvasFromData = function (data) {
        var image = new Image();
        image.src = 'data:image/jpeg;base64,' + base64_js_1.fromByteArray(data);
        var canvas = document.createElement('canvas');
        canvas.width = image.width;
        canvas.height = image.height;
        canvas.getContext('2d').drawImage(image, 0, 0);
        return canvas;
    };
}
function initializeCanvas(createCanvasMethod, createCanvasFromDataMethod, createImageDataMethod) {
    exports.createCanvas = createCanvasMethod;
    exports.createCanvasFromData = createCanvasFromDataMethod || exports.createCanvasFromData;
    exports.createImageData = createImageDataMethod || exports.createImageData;
}
exports.initializeCanvas = initializeCanvas;

//# sourceMappingURL=data:application/json;charset=utf8;base64,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QyxLQUFLLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO1FBQ2hELE9BQU8sTUFBTSxDQUFDO0lBQ2YsQ0FBQyxDQUFDO0NBQ0Y7QUFFRCxTQUFnQixnQkFBZ0IsQ0FDL0Isa0JBQXdFLEVBQ3hFLDBCQUFvRSxFQUNwRSxxQkFBb0U7SUFFcEUsb0JBQVksR0FBRyxrQkFBa0IsQ0FBQztJQUNsQyw0QkFBb0IsR0FBRywwQkFBMEIsSUFBSSw0QkFBb0IsQ0FBQztJQUMxRSx1QkFBZSxHQUFHLHFCQUFxQixJQUFJLHVCQUFlLENBQUM7QUFDNUQsQ0FBQztBQVJELDRDQVFDIiwiZmlsZSI6ImhlbHBlcnMuanMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBmcm9tQnl0ZUFycmF5IH0gZnJvbSAnYmFzZTY0LWpzJztcbmltcG9ydCB7IExheWVyLCBCbGVuZE1vZGUsIExheWVyQ29sb3IgfSBmcm9tICcuL3BzZCc7XG5cbmV4cG9ydCBjb25zdCBNT0NLX0hBTkRMRVJTID0gZmFsc2U7XG5leHBvcnQgY29uc3QgUkFXX0lNQUdFX0RBVEEgPSBmYWxzZTtcblxuZXhwb3J0IGNvbnN0IGZyb21CbGVuZE1vZGU6IHsgW2tleTogc3RyaW5nXTogc3RyaW5nIH0gPSB7fTtcbmV4cG9ydCBjb25zdCB0b0JsZW5kTW9kZTogeyBba2V5OiBzdHJpbmddOiBCbGVuZE1vZGUgfSA9IHtcblx0J3Bhc3MnOiAncGFzcyB0aHJvdWdoJyxcblx0J25vcm0nOiAnbm9ybWFsJyxcblx0J2Rpc3MnOiAnZGlzc29sdmUnLFxuXHQnZGFyayc6ICdkYXJrZW4nLFxuXHQnbXVsICc6ICdtdWx0aXBseScsXG5cdCdpZGl2JzogJ2NvbG9yIGJ1cm4nLFxuXHQnbGJybic6ICdsaW5lYXIgYnVybicsXG5cdCdka0NsJzogJ2RhcmtlciBjb2xvcicsXG5cdCdsaXRlJzogJ2xpZ2h0ZW4nLFxuXHQnc2Nybic6ICdzY3JlZW4nLFxuXHQnZGl2ICc6ICdjb2xvciBkb2RnZScsXG5cdCdsZGRnJzogJ2xpbmVhciBkb2RnZScsXG5cdCdsZ0NsJzogJ2xpZ2h0ZXIgY29sb3InLFxuXHQnb3Zlcic6ICdvdmVybGF5Jyxcblx0J3NMaXQnOiAnc29mdCBsaWdodCcsXG5cdCdoTGl0JzogJ2hhcmQgbGlnaHQnLFxuXHQndkxpdCc6ICd2aXZpZCBsaWdodCcsXG5cdCdsTGl0JzogJ2xpbmVhciBsaWdodCcsXG5cdCdwTGl0JzogJ3BpbiBsaWdodCcsXG5cdCdoTWl4JzogJ2hhcmQgbWl4Jyxcblx0J2RpZmYnOiAnZGlmZmVyZW5jZScsXG5cdCdzbXVkJzogJ2V4Y2x1c2lvbicsXG5cdCdmc3ViJzogJ3N1YnRyYWN0Jyxcblx0J2ZkaXYnOiAnZGl2aWRlJyxcblx0J2h1ZSAnOiAnaHVlJyxcblx0J3NhdCAnOiAnc2F0dXJhdGlvbicsXG5cdCdjb2xyJzogJ2NvbG9yJyxcblx0J2x1bSAnOiAnbHVtaW5vc2l0eScsXG59O1xuXG5PYmplY3Qua2V5cyh0b0JsZW5kTW9kZSkuZm9yRWFjaChrZXkgPT4gZnJvbUJsZW5kTW9kZVt0b0JsZW5kTW9kZVtrZXldXSA9IGtleSk7XG5cbmV4cG9ydCBjb25zdCBsYXllckNvbG9yczogTGF5ZXJDb2xvcltdID0gW1xuXHQnbm9uZScsICdyZWQnLCAnb3JhbmdlJywgJ3llbGxvdycsICdncmVlbicsICdibHVlJywgJ3Zpb2xldCcsICdncmF5J1xuXTtcblxuZXhwb3J0IGNvbnN0IGxhcmdlQWRkaXRpb25hbEluZm9LZXlzID0gW1xuXHQvLyBmcm9tIGRvY3VtZW50YXRpb25cblx0J0xNc2snLCAnTHIxNicsICdMcjMyJywgJ0xheXInLCAnTXQxNicsICdNdDMyJywgJ010cm4nLCAnQWxwaCcsICdGTXNrJywgJ2xuazInLCAnRkVpZCcsICdGWGlkJywgJ1B4U0QnLFxuXHQvLyBmcm9tIGd1ZXNzaW5nXG5cdCdjaW5mJyxcbl07XG5cbmV4cG9ydCBpbnRlcmZhY2UgRGljdCB7XG5cdFtrZXk6IHN0cmluZ106IHN0cmluZztcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHJldk1hcChtYXA6IERpY3QpIHtcblx0Y29uc3QgcmVzdWx0OiBEaWN0ID0ge307XG5cdE9iamVjdC5rZXlzKG1hcCkuZm9yRWFjaChrZXkgPT4gcmVzdWx0W21hcFtrZXldXSA9IGtleSk7XG5cdHJldHVybiByZXN1bHQ7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVFbnVtPFQ+KHByZWZpeDogc3RyaW5nLCBkZWY6IHN0cmluZywgbWFwOiBEaWN0KSB7XG5cdGNvbnN0IHJldiA9IHJldk1hcChtYXApO1xuXHRjb25zdCBkZWNvZGUgPSAodmFsOiBzdHJpbmcpOiBUID0+IHtcblx0XHRjb25zdCB2YWx1ZSA9IHZhbC5zcGxpdCgnLicpWzFdO1xuXHRcdGlmICh2YWx1ZSAmJiAhcmV2W3ZhbHVlXSkgdGhyb3cgbmV3IEVycm9yKGBVbnJlY29nbml6ZWQgdmFsdWUgZm9yIGVudW06ICcke3ZhbH0nYCk7XG5cdFx0cmV0dXJuIChyZXZbdmFsdWVdIGFzIGFueSkgfHwgZGVmO1xuXHR9O1xuXHRjb25zdCBlbmNvZGUgPSAodmFsOiBUIHwgdW5kZWZpbmVkKTogc3RyaW5nID0+IHtcblx0XHRpZiAodmFsICYmICFtYXBbdmFsIGFzIGFueV0pIHRocm93IG5ldyBFcnJvcihgSW52YWxpZCB2YWx1ZSBmb3IgZW51bTogJyR7dmFsfSdgKTtcblx0XHRyZXR1cm4gYCR7cHJlZml4fS4ke21hcFt2YWwgYXMgYW55XSB8fCBtYXBbZGVmXX1gO1xuXHR9O1xuXHRyZXR1cm4geyBkZWNvZGUsIGVuY29kZSB9O1xufVxuXG5leHBvcnQgY29uc3QgZW51bSBDb2xvclNwYWNlIHtcblx0UkdCID0gMCxcblx0SFNCID0gMSxcblx0Q01ZSyA9IDIsXG5cdExhYiA9IDcsXG5cdEdyYXlzY2FsZSA9IDgsXG59XG5cbmV4cG9ydCBjb25zdCBlbnVtIExheWVyTWFza0ZsYWdzIHtcblx0UG9zaXRpb25SZWxhdGl2ZVRvTGF5ZXIgPSAxLFxuXHRMYXllck1hc2tEaXNhYmxlZCA9IDIsXG5cdEludmVydExheWVyTWFza1doZW5CbGVuZGluZyA9IDQsIC8vIG9ic29sZXRlXG5cdExheWVyTWFza0Zyb21SZW5kZXJpbmdPdGhlckRhdGEgPSA4LFxuXHRNYXNrSGFzUGFyYW1ldGVyc0FwcGxpZWRUb0l0ID0gMTYsXG59XG5cbmV4cG9ydCBjb25zdCBlbnVtIE1hc2tQYXJhbXMge1xuXHRVc2VyTWFza0RlbnNpdHkgPSAxLFxuXHRVc2VyTWFza0ZlYXRoZXIgPSAyLFxuXHRWZWN0b3JNYXNrRGVuc2l0eSA9IDQsXG5cdFZlY3Rvck1hc2tGZWF0aGVyID0gOCxcbn1cblxuZXhwb3J0IGNvbnN0IGVudW0gQ2hhbm5lbElEIHtcblx0UmVkID0gMCxcblx0R3JlZW4gPSAxLFxuXHRCbHVlID0gMixcblx0VHJhbnNwYXJlbmN5ID0gLTEsXG5cdFVzZXJNYXNrID0gLTIsXG5cdFJlYWxVc2VyTWFzayA9IC0zLFxufVxuXG5leHBvcnQgY29uc3QgZW51bSBDb21wcmVzc2lvbiB7XG5cdFJhd0RhdGEgPSAwLFxuXHRSbGVDb21wcmVzc2VkID0gMSxcblx0WmlwV2l0aG91dFByZWRpY3Rpb24gPSAyLFxuXHRaaXBXaXRoUHJlZGljdGlvbiA9IDMsXG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgQ2hhbm5lbERhdGEge1xuXHRjaGFubmVsSWQ6IENoYW5uZWxJRDtcblx0Y29tcHJlc3Npb246IENvbXByZXNzaW9uO1xuXHRidWZmZXI6IFVpbnQ4QXJyYXkgfCB1bmRlZmluZWQ7XG5cdGxlbmd0aDogbnVtYmVyO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIEJvdW5kcyB7XG5cdHRvcDogbnVtYmVyO1xuXHRsZWZ0OiBudW1iZXI7XG5cdHJpZ2h0OiBudW1iZXI7XG5cdGJvdHRvbTogbnVtYmVyO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIExheWVyQ2hhbm5lbERhdGEge1xuXHRsYXllcjogTGF5ZXI7XG5cdGNoYW5uZWxzOiBDaGFubmVsRGF0YVtdO1xuXHR0b3A6IG51bWJlcjtcblx0bGVmdDogbnVtYmVyO1xuXHRyaWdodDogbnVtYmVyO1xuXHRib3R0b206IG51bWJlcjtcblx0bWFzaz86IEJvdW5kcztcbn1cblxuZXhwb3J0IHR5cGUgUGl4ZWxBcnJheSA9IFVpbnQ4Q2xhbXBlZEFycmF5IHwgVWludDhBcnJheTtcblxuZXhwb3J0IGludGVyZmFjZSBQaXhlbERhdGEge1xuXHRkYXRhOiBQaXhlbEFycmF5O1xuXHR3aWR0aDogbnVtYmVyO1xuXHRoZWlnaHQ6IG51bWJlcjtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIG9mZnNldEZvckNoYW5uZWwoY2hhbm5lbElkOiBDaGFubmVsSUQpIHtcblx0c3dpdGNoIChjaGFubmVsSWQpIHtcblx0XHRjYXNlIENoYW5uZWxJRC5SZWQ6IHJldHVybiAwO1xuXHRcdGNhc2UgQ2hhbm5lbElELkdyZWVuOiByZXR1cm4gMTtcblx0XHRjYXNlIENoYW5uZWxJRC5CbHVlOiByZXR1cm4gMjtcblx0XHRjYXNlIENoYW5uZWxJRC5UcmFuc3BhcmVuY3k6IHJldHVybiAzO1xuXHRcdGRlZmF1bHQ6IHJldHVybiBjaGFubmVsSWQgKyAxO1xuXHR9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBjbGFtcCh2YWx1ZTogbnVtYmVyLCBtaW46IG51bWJlciwgbWF4OiBudW1iZXIpIHtcblx0cmV0dXJuIHZhbHVlIDwgbWluID8gbWluIDogKHZhbHVlID4gbWF4ID8gbWF4IDogdmFsdWUpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gaGFzQWxwaGEoZGF0YTogUGl4ZWxEYXRhKSB7XG5cdGNvbnN0IHNpemUgPSBkYXRhLndpZHRoICogZGF0YS5oZWlnaHQgKiA0O1xuXG5cdGZvciAobGV0IGkgPSAzOyBpIDwgc2l6ZTsgaSArPSA0KSB7XG5cdFx0aWYgKGRhdGEuZGF0YVtpXSAhPT0gMjU1KSB7XG5cdFx0XHRyZXR1cm4gdHJ1ZTtcblx0XHR9XG5cdH1cblxuXHRyZXR1cm4gZmFsc2U7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiByZXNldEltYWdlRGF0YSh7IHdpZHRoLCBoZWlnaHQsIGRhdGEgfTogUGl4ZWxEYXRhKSB7XG5cdGNvbnN0IHNpemUgPSAod2lkdGggKiBoZWlnaHQpIHwgMDtcblx0Y29uc3QgYnVmZmVyID0gbmV3IFVpbnQzMkFycmF5KGRhdGEuYnVmZmVyKTtcblxuXHRmb3IgKGxldCBwID0gMDsgcCA8IHNpemU7IHAgPSAocCArIDEpIHwgMCkge1xuXHRcdGJ1ZmZlcltwXSA9IDB4ZmYwMDAwMDA7XG5cdH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGRlY29kZUJpdG1hcChpbnB1dDogUGl4ZWxBcnJheSwgb3V0cHV0OiBQaXhlbEFycmF5LCB3aWR0aDogbnVtYmVyLCBoZWlnaHQ6IG51bWJlcikge1xuXHRmb3IgKGxldCB5ID0gMCwgcCA9IDAsIG8gPSAwOyB5IDwgaGVpZ2h0OyB5KyspIHtcblx0XHRmb3IgKGxldCB4ID0gMDsgeCA8IHdpZHRoOykge1xuXHRcdFx0bGV0IGIgPSBpbnB1dFtvKytdO1xuXG5cdFx0XHRmb3IgKGxldCBpID0gMDsgaSA8IDggJiYgeCA8IHdpZHRoOyBpKyssIHgrKykge1xuXHRcdFx0XHRjb25zdCB2ID0gYiAmIDB4ODAgPyAwIDogMjU1O1xuXHRcdFx0XHRiID0gYiA8PCAxO1xuXHRcdFx0XHRvdXRwdXRbcCsrXSA9IHY7XG5cdFx0XHRcdG91dHB1dFtwKytdID0gdjtcblx0XHRcdFx0b3V0cHV0W3ArK10gPSB2O1xuXHRcdFx0XHRvdXRwdXRbcCsrXSA9IDI1NTtcblx0XHRcdH1cblx0XHR9XG5cdH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHdyaXRlRGF0YVJhdyhkYXRhOiBQaXhlbERhdGEsIG9mZnNldDogbnVtYmVyLCB3aWR0aDogbnVtYmVyLCBoZWlnaHQ6IG51bWJlcikge1xuXHRpZiAoIXdpZHRoIHx8ICFoZWlnaHQpXG5cdFx0cmV0dXJuIHVuZGVmaW5lZDtcblxuXHRjb25zdCBhcnJheSA9IG5ldyBVaW50OEFycmF5KHdpZHRoICogaGVpZ2h0KTtcblxuXHRmb3IgKGxldCBpID0gMDsgaSA8IGFycmF5Lmxlbmd0aDsgaSsrKSB7XG5cdFx0YXJyYXlbaV0gPSBkYXRhLmRhdGFbaSAqIDQgKyBvZmZzZXRdO1xuXHR9XG5cblx0cmV0dXJuIGFycmF5O1xufVxuXG5leHBvcnQgZnVuY3Rpb24gd3JpdGVEYXRhUkxFKFxuXHRidWZmZXI6IFVpbnQ4QXJyYXksIHsgZGF0YSB9OiBQaXhlbERhdGEsIHdpZHRoOiBudW1iZXIsIGhlaWdodDogbnVtYmVyLCBvZmZzZXRzOiBudW1iZXJbXSxcblx0bGFyZ2U6IGJvb2xlYW5cbikge1xuXHRpZiAoIXdpZHRoIHx8ICFoZWlnaHQpIHJldHVybiB1bmRlZmluZWQ7XG5cblx0Y29uc3Qgc3RyaWRlID0gKDQgKiB3aWR0aCkgfCAwO1xuXG5cdGxldCBvbCA9IDA7XG5cdGxldCBvID0gKG9mZnNldHMubGVuZ3RoICogKGxhcmdlID8gNCA6IDIpICogaGVpZ2h0KSB8IDA7XG5cblx0Zm9yIChjb25zdCBvZmZzZXQgb2Ygb2Zmc2V0cykge1xuXHRcdGZvciAobGV0IHkgPSAwLCBwID0gb2Zmc2V0IHwgMDsgeSA8IGhlaWdodDsgeSsrKSB7XG5cdFx0XHRjb25zdCBzdHJpZGVTdGFydCA9ICh5ICogc3RyaWRlKSB8IDA7XG5cdFx0XHRjb25zdCBzdHJpZGVFbmQgPSAoc3RyaWRlU3RhcnQgKyBzdHJpZGUpIHwgMDtcblx0XHRcdGNvbnN0IGxhc3RJbmRleCA9IChzdHJpZGVFbmQgKyBvZmZzZXQgLSA0KSB8IDA7XG5cdFx0XHRjb25zdCBsYXN0SW5kZXgyID0gKGxhc3RJbmRleCAtIDQpIHwgMDtcblx0XHRcdGNvbnN0IHN0YXJ0T2Zmc2V0ID0gbztcblxuXHRcdFx0Zm9yIChwID0gKHN0cmlkZVN0YXJ0ICsgb2Zmc2V0KSB8IDA7IHAgPCBzdHJpZGVFbmQ7IHAgPSAocCArIDQpIHwgMCkge1xuXHRcdFx0XHRpZiAocCA8IGxhc3RJbmRleDIpIHtcblx0XHRcdFx0XHRsZXQgdmFsdWUxID0gZGF0YVtwXTtcblx0XHRcdFx0XHRwID0gKHAgKyA0KSB8IDA7XG5cdFx0XHRcdFx0bGV0IHZhbHVlMiA9IGRhdGFbcF07XG5cdFx0XHRcdFx0cCA9IChwICsgNCkgfCAwO1xuXHRcdFx0XHRcdGxldCB2YWx1ZTMgPSBkYXRhW3BdO1xuXG5cdFx0XHRcdFx0aWYgKHZhbHVlMSA9PT0gdmFsdWUyICYmIHZhbHVlMSA9PT0gdmFsdWUzKSB7XG5cdFx0XHRcdFx0XHRsZXQgY291bnQgPSAzO1xuXG5cdFx0XHRcdFx0XHR3aGlsZSAoY291bnQgPCAxMjggJiYgcCA8IGxhc3RJbmRleCAmJiBkYXRhWyhwICsgNCkgfCAwXSA9PT0gdmFsdWUxKSB7XG5cdFx0XHRcdFx0XHRcdGNvdW50ID0gKGNvdW50ICsgMSkgfCAwO1xuXHRcdFx0XHRcdFx0XHRwID0gKHAgKyA0KSB8IDA7XG5cdFx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHRcdGJ1ZmZlcltvKytdID0gMSAtIGNvdW50O1xuXHRcdFx0XHRcdFx0YnVmZmVyW28rK10gPSB2YWx1ZTE7XG5cdFx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHRcdGNvbnN0IGNvdW50SW5kZXggPSBvO1xuXHRcdFx0XHRcdFx0bGV0IHdyaXRlTGFzdCA9IHRydWU7XG5cdFx0XHRcdFx0XHRsZXQgY291bnQgPSAxO1xuXHRcdFx0XHRcdFx0YnVmZmVyW28rK10gPSAwO1xuXHRcdFx0XHRcdFx0YnVmZmVyW28rK10gPSB2YWx1ZTE7XG5cblx0XHRcdFx0XHRcdHdoaWxlIChwIDwgbGFzdEluZGV4ICYmIGNvdW50IDwgMTI4KSB7XG5cdFx0XHRcdFx0XHRcdHAgPSAocCArIDQpIHwgMDtcblx0XHRcdFx0XHRcdFx0dmFsdWUxID0gdmFsdWUyO1xuXHRcdFx0XHRcdFx0XHR2YWx1ZTIgPSB2YWx1ZTM7XG5cdFx0XHRcdFx0XHRcdHZhbHVlMyA9IGRhdGFbcF07XG5cblx0XHRcdFx0XHRcdFx0aWYgKHZhbHVlMSA9PT0gdmFsdWUyICYmIHZhbHVlMSA9PT0gdmFsdWUzKSB7XG5cdFx0XHRcdFx0XHRcdFx0cCA9IChwIC0gMTIpIHwgMDtcblx0XHRcdFx0XHRcdFx0XHR3cml0ZUxhc3QgPSBmYWxzZTtcblx0XHRcdFx0XHRcdFx0XHRicmVhaztcblx0XHRcdFx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHRcdFx0XHRjb3VudCsrO1xuXHRcdFx0XHRcdFx0XHRcdGJ1ZmZlcltvKytdID0gdmFsdWUxO1xuXHRcdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHRcdGlmICh3cml0ZUxhc3QpIHtcblx0XHRcdFx0XHRcdFx0aWYgKGNvdW50IDwgMTI3KSB7XG5cdFx0XHRcdFx0XHRcdFx0YnVmZmVyW28rK10gPSB2YWx1ZTI7XG5cdFx0XHRcdFx0XHRcdFx0YnVmZmVyW28rK10gPSB2YWx1ZTM7XG5cdFx0XHRcdFx0XHRcdFx0Y291bnQgKz0gMjtcblx0XHRcdFx0XHRcdFx0fSBlbHNlIGlmIChjb3VudCA8IDEyOCkge1xuXHRcdFx0XHRcdFx0XHRcdGJ1ZmZlcltvKytdID0gdmFsdWUyO1xuXHRcdFx0XHRcdFx0XHRcdGNvdW50Kys7XG5cdFx0XHRcdFx0XHRcdFx0cCA9IChwIC0gNCkgfCAwO1xuXHRcdFx0XHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdFx0XHRcdHAgPSAocCAtIDgpIHwgMDtcblx0XHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0XHRidWZmZXJbY291bnRJbmRleF0gPSBjb3VudCAtIDE7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9IGVsc2UgaWYgKHAgPT09IGxhc3RJbmRleCkge1xuXHRcdFx0XHRcdGJ1ZmZlcltvKytdID0gMDtcblx0XHRcdFx0XHRidWZmZXJbbysrXSA9IGRhdGFbcF07XG5cdFx0XHRcdH0gZWxzZSB7IC8vIHAgPT09IGxhc3RJbmRleDJcblx0XHRcdFx0XHRidWZmZXJbbysrXSA9IDE7XG5cdFx0XHRcdFx0YnVmZmVyW28rK10gPSBkYXRhW3BdO1xuXHRcdFx0XHRcdHAgPSAocCArIDQpIHwgMDtcblx0XHRcdFx0XHRidWZmZXJbbysrXSA9IGRhdGFbcF07XG5cdFx0XHRcdH1cblx0XHRcdH1cblxuXHRcdFx0Y29uc3QgbGVuZ3RoID0gbyAtIHN0YXJ0T2Zmc2V0O1xuXG5cdFx0XHRpZiAobGFyZ2UpIHtcblx0XHRcdFx0YnVmZmVyW29sKytdID0gKGxlbmd0aCA+PiAyNCkgJiAweGZmO1xuXHRcdFx0XHRidWZmZXJbb2wrK10gPSAobGVuZ3RoID4+IDE2KSAmIDB4ZmY7XG5cdFx0XHR9XG5cblx0XHRcdGJ1ZmZlcltvbCsrXSA9IChsZW5ndGggPj4gOCkgJiAweGZmO1xuXHRcdFx0YnVmZmVyW29sKytdID0gbGVuZ3RoICYgMHhmZjtcblx0XHR9XG5cdH1cblxuXHRyZXR1cm4gYnVmZmVyLnNsaWNlKDAsIG8pO1xufVxuXG5leHBvcnQgbGV0IGNyZWF0ZUNhbnZhczogKHdpZHRoOiBudW1iZXIsIGhlaWdodDogbnVtYmVyKSA9PiBIVE1MQ2FudmFzRWxlbWVudCA9ICgpID0+IHtcblx0dGhyb3cgbmV3IEVycm9yKCdDYW52YXMgbm90IGluaXRpYWxpemVkLCB1c2UgaW5pdGlhbGl6ZUNhbnZhcyBtZXRob2QgdG8gc2V0IHVwIGNyZWF0ZUNhbnZhcyBtZXRob2QnKTtcbn07XG5cbmV4cG9ydCBsZXQgY3JlYXRlQ2FudmFzRnJvbURhdGE6IChkYXRhOiBVaW50OEFycmF5KSA9PiBIVE1MQ2FudmFzRWxlbWVudCA9ICgpID0+IHtcblx0dGhyb3cgbmV3IEVycm9yKCdDYW52YXMgbm90IGluaXRpYWxpemVkLCB1c2UgaW5pdGlhbGl6ZUNhbnZhcyBtZXRob2QgdG8gc2V0IHVwIGNyZWF0ZUNhbnZhc0Zyb21EYXRhIG1ldGhvZCcpO1xufTtcblxubGV0IHRlbXBDYW52YXM6IEhUTUxDYW52YXNFbGVtZW50IHwgdW5kZWZpbmVkID0gdW5kZWZpbmVkO1xuXG5leHBvcnQgbGV0IGNyZWF0ZUltYWdlRGF0YTogKHdpZHRoOiBudW1iZXIsIGhlaWdodDogbnVtYmVyKSA9PiBJbWFnZURhdGEgPSAod2lkdGgsIGhlaWdodCkgPT4ge1xuXHRpZiAoIXRlbXBDYW52YXMpIHRlbXBDYW52YXMgPSBjcmVhdGVDYW52YXMoMSwgMSk7XG5cdHJldHVybiB0ZW1wQ2FudmFzLmdldENvbnRleHQoJzJkJykhLmNyZWF0ZUltYWdlRGF0YSh3aWR0aCwgaGVpZ2h0KTtcbn07XG5cbmlmICh0eXBlb2YgZG9jdW1lbnQgIT09ICd1bmRlZmluZWQnKSB7XG5cdGNyZWF0ZUNhbnZhcyA9ICh3aWR0aCwgaGVpZ2h0KSA9PiB7XG5cdFx0Y29uc3QgY2FudmFzID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnY2FudmFzJyk7XG5cdFx0Y2FudmFzLndpZHRoID0gd2lkdGg7XG5cdFx0Y2FudmFzLmhlaWdodCA9IGhlaWdodDtcblx0XHRyZXR1cm4gY2FudmFzO1xuXHR9O1xuXG5cdGNyZWF0ZUNhbnZhc0Zyb21EYXRhID0gKGRhdGEpID0+IHtcblx0XHRjb25zdCBpbWFnZSA9IG5ldyBJbWFnZSgpO1xuXHRcdGltYWdlLnNyYyA9ICdkYXRhOmltYWdlL2pwZWc7YmFzZTY0LCcgKyBmcm9tQnl0ZUFycmF5KGRhdGEpO1xuXHRcdGNvbnN0IGNhbnZhcyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2NhbnZhcycpO1xuXHRcdGNhbnZhcy53aWR0aCA9IGltYWdlLndpZHRoO1xuXHRcdGNhbnZhcy5oZWlnaHQgPSBpbWFnZS5oZWlnaHQ7XG5cdFx0Y2FudmFzLmdldENvbnRleHQoJzJkJykhLmRyYXdJbWFnZShpbWFnZSwgMCwgMCk7XG5cdFx0cmV0dXJuIGNhbnZhcztcblx0fTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGluaXRpYWxpemVDYW52YXMoXG5cdGNyZWF0ZUNhbnZhc01ldGhvZDogKHdpZHRoOiBudW1iZXIsIGhlaWdodDogbnVtYmVyKSA9PiBIVE1MQ2FudmFzRWxlbWVudCxcblx0Y3JlYXRlQ2FudmFzRnJvbURhdGFNZXRob2Q/OiAoZGF0YTogVWludDhBcnJheSkgPT4gSFRNTENhbnZhc0VsZW1lbnQsXG5cdGNyZWF0ZUltYWdlRGF0YU1ldGhvZD86ICh3aWR0aDogbnVtYmVyLCBoZWlnaHQ6IG51bWJlcikgPT4gSW1hZ2VEYXRhXG4pIHtcblx0Y3JlYXRlQ2FudmFzID0gY3JlYXRlQ2FudmFzTWV0aG9kO1xuXHRjcmVhdGVDYW52YXNGcm9tRGF0YSA9IGNyZWF0ZUNhbnZhc0Zyb21EYXRhTWV0aG9kIHx8IGNyZWF0ZUNhbnZhc0Zyb21EYXRhO1xuXHRjcmVhdGVJbWFnZURhdGEgPSBjcmVhdGVJbWFnZURhdGFNZXRob2QgfHwgY3JlYXRlSW1hZ2VEYXRhO1xufVxuIl0sInNvdXJjZVJvb3QiOiIvaG9tZS9tYW5oL2thb3Bpei9lZWwvYWctcHNkL3NyYyJ9
