"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.writeEffects = exports.readEffects = void 0;
var helpers_1 = require("./helpers");
var psdReader_1 = require("./psdReader");
var psdWriter_1 = require("./psdWriter");
var bevelStyles = [
    undefined,
    'outer bevel', 'inner bevel', 'emboss', 'pillow emboss', 'stroke emboss'
];
function readBlendMode(reader) {
    psdReader_1.checkSignature(reader, '8BIM');
    return helpers_1.toBlendMode[psdReader_1.readSignature(reader)] || 'normal';
}
function writeBlendMode(writer, mode) {
    psdWriter_1.writeSignature(writer, '8BIM');
    psdWriter_1.writeSignature(writer, helpers_1.fromBlendMode[mode] || 'norm');
}
function readFixedPoint8(reader) {
    return psdReader_1.readUint8(reader) / 0xff;
}
function writeFixedPoint8(writer, value) {
    psdWriter_1.writeUint8(writer, Math.round(value * 0xff) | 0);
}
function readEffects(reader) {
    var version = psdReader_1.readUint16(reader);
    if (version !== 0)
        throw new Error("Invalid effects layer version: " + version);
    var effectsCount = psdReader_1.readUint16(reader);
    var effects = {};
    for (var i = 0; i < effectsCount; i++) {
        psdReader_1.checkSignature(reader, '8BIM');
        var type = psdReader_1.readSignature(reader);
        switch (type) {
            case 'cmnS': { // common state (see See Effects layer, common state info)
                var size = psdReader_1.readUint32(reader);
                var version_1 = psdReader_1.readUint32(reader);
                var visible = !!psdReader_1.readUint8(reader);
                psdReader_1.skipBytes(reader, 2);
                if (size !== 7 || version_1 !== 0 || !visible)
                    throw new Error("Invalid effects common state");
                break;
            }
            case 'dsdw': // drop shadow (see See Effects layer, drop shadow and inner shadow info)
            case 'isdw': { // inner shadow (see See Effects layer, drop shadow and inner shadow info)
                var blockSize = psdReader_1.readUint32(reader);
                var version_2 = psdReader_1.readUint32(reader);
                if (blockSize !== 41 && blockSize !== 51)
                    throw new Error("Invalid shadow size: " + blockSize);
                if (version_2 !== 0 && version_2 !== 2)
                    throw new Error("Invalid shadow version: " + version_2);
                var size = psdReader_1.readFixedPoint32(reader);
                psdReader_1.readFixedPoint32(reader); // intensity
                var angle = psdReader_1.readFixedPoint32(reader);
                var distance = psdReader_1.readFixedPoint32(reader);
                var color = psdReader_1.readColor(reader);
                var blendMode = readBlendMode(reader);
                var enabled = !!psdReader_1.readUint8(reader);
                var useGlobalLight = !!psdReader_1.readUint8(reader);
                var opacity = readFixedPoint8(reader);
                if (blockSize >= 51)
                    psdReader_1.readColor(reader); // native color
                var shadowInfo = {
                    size: { units: 'Pixels', value: size },
                    distance: { units: 'Pixels', value: distance },
                    angle: angle, color: color, blendMode: blendMode, enabled: enabled, useGlobalLight: useGlobalLight, opacity: opacity
                };
                if (type === 'dsdw') {
                    effects.dropShadow = [shadowInfo];
                }
                else {
                    effects.innerShadow = [shadowInfo];
                }
                break;
            }
            case 'oglw': { // outer glow (see See Effects layer, outer glow info)
                var blockSize = psdReader_1.readUint32(reader);
                var version_3 = psdReader_1.readUint32(reader);
                if (blockSize !== 32 && blockSize !== 42)
                    throw new Error("Invalid outer glow size: " + blockSize);
                if (version_3 !== 0 && version_3 !== 2)
                    throw new Error("Invalid outer glow version: " + version_3);
                var size = psdReader_1.readFixedPoint32(reader);
                psdReader_1.readFixedPoint32(reader); // intensity
                var color = psdReader_1.readColor(reader);
                var blendMode = readBlendMode(reader);
                var enabled = !!psdReader_1.readUint8(reader);
                var opacity = readFixedPoint8(reader);
                if (blockSize >= 42)
                    psdReader_1.readColor(reader); // native color
                effects.outerGlow = {
                    size: { units: 'Pixels', value: size },
                    color: color, blendMode: blendMode, enabled: enabled, opacity: opacity
                };
                break;
            }
            case 'iglw': { // inner glow (see See Effects layer, inner glow info)
                var blockSize = psdReader_1.readUint32(reader);
                var version_4 = psdReader_1.readUint32(reader);
                if (blockSize !== 32 && blockSize !== 43)
                    throw new Error("Invalid inner glow size: " + blockSize);
                if (version_4 !== 0 && version_4 !== 2)
                    throw new Error("Invalid inner glow version: " + version_4);
                var size = psdReader_1.readFixedPoint32(reader);
                psdReader_1.readFixedPoint32(reader); // intensity
                var color = psdReader_1.readColor(reader);
                var blendMode = readBlendMode(reader);
                var enabled = !!psdReader_1.readUint8(reader);
                var opacity = readFixedPoint8(reader);
                if (blockSize >= 43) {
                    psdReader_1.readUint8(reader); // inverted
                    psdReader_1.readColor(reader); // native color
                }
                effects.innerGlow = {
                    size: { units: 'Pixels', value: size },
                    color: color, blendMode: blendMode, enabled: enabled, opacity: opacity
                };
                break;
            }
            case 'bevl': { // bevel (see See Effects layer, bevel info)
                var blockSize = psdReader_1.readUint32(reader);
                var version_5 = psdReader_1.readUint32(reader);
                if (blockSize !== 58 && blockSize !== 78)
                    throw new Error("Invalid bevel size: " + blockSize);
                if (version_5 !== 0 && version_5 !== 2)
                    throw new Error("Invalid bevel version: " + version_5);
                var angle = psdReader_1.readFixedPoint32(reader);
                var strength = psdReader_1.readFixedPoint32(reader);
                var size = psdReader_1.readFixedPoint32(reader);
                var highlightBlendMode = readBlendMode(reader);
                var shadowBlendMode = readBlendMode(reader);
                var highlightColor = psdReader_1.readColor(reader);
                var shadowColor = psdReader_1.readColor(reader);
                var style = bevelStyles[psdReader_1.readUint8(reader)] || 'inner bevel';
                var highlightOpacity = readFixedPoint8(reader);
                var shadowOpacity = readFixedPoint8(reader);
                var enabled = !!psdReader_1.readUint8(reader);
                var useGlobalLight = !!psdReader_1.readUint8(reader);
                var direction = psdReader_1.readUint8(reader) ? 'down' : 'up';
                if (blockSize >= 78) {
                    psdReader_1.readColor(reader); // real highlight color
                    psdReader_1.readColor(reader); // real shadow color
                }
                effects.bevel = {
                    size: { units: 'Pixels', value: size },
                    angle: angle, strength: strength, highlightBlendMode: highlightBlendMode, shadowBlendMode: shadowBlendMode, highlightColor: highlightColor, shadowColor: shadowColor,
                    style: style, highlightOpacity: highlightOpacity, shadowOpacity: shadowOpacity, enabled: enabled, useGlobalLight: useGlobalLight, direction: direction,
                };
                break;
            }
            case 'sofi': { // solid fill (Photoshop 7.0) (see See Effects layer, solid fill (added in Photoshop 7.0))
                var size = psdReader_1.readUint32(reader);
                var version_6 = psdReader_1.readUint32(reader);
                if (size !== 34)
                    throw new Error("Invalid effects solid fill info size: " + size);
                if (version_6 !== 2)
                    throw new Error("Invalid effects solid fill info version: " + version_6);
                var blendMode = readBlendMode(reader);
                var color = psdReader_1.readColor(reader);
                var opacity = readFixedPoint8(reader);
                var enabled = !!psdReader_1.readUint8(reader);
                psdReader_1.readColor(reader); // native color
                effects.solidFill = [{ blendMode: blendMode, color: color, opacity: opacity, enabled: enabled }];
                break;
            }
            default:
                throw new Error("Invalid effect type: '" + type + "'");
        }
    }
    return effects;
}
exports.readEffects = readEffects;
function writeShadowInfo(writer, shadow) {
    var _a;
    psdWriter_1.writeUint32(writer, 51);
    psdWriter_1.writeUint32(writer, 2);
    psdWriter_1.writeFixedPoint32(writer, shadow.size && shadow.size.value || 0);
    psdWriter_1.writeFixedPoint32(writer, 0); // intensity
    psdWriter_1.writeFixedPoint32(writer, shadow.angle || 0);
    psdWriter_1.writeFixedPoint32(writer, shadow.distance && shadow.distance.value || 0);
    psdWriter_1.writeColor(writer, shadow.color);
    writeBlendMode(writer, shadow.blendMode);
    psdWriter_1.writeUint8(writer, shadow.enabled ? 1 : 0);
    psdWriter_1.writeUint8(writer, shadow.useGlobalLight ? 1 : 0);
    writeFixedPoint8(writer, (_a = shadow.opacity) !== null && _a !== void 0 ? _a : 1);
    psdWriter_1.writeColor(writer, shadow.color); // native color
}
function writeEffects(writer, effects) {
    var _a, _b, _c, _d, _e, _f;
    var dropShadow = (_a = effects.dropShadow) === null || _a === void 0 ? void 0 : _a[0];
    var innerShadow = (_b = effects.innerShadow) === null || _b === void 0 ? void 0 : _b[0];
    var outerGlow = effects.outerGlow;
    var innerGlow = effects.innerGlow;
    var bevel = effects.bevel;
    var solidFill = (_c = effects.solidFill) === null || _c === void 0 ? void 0 : _c[0];
    var count = 1;
    if (dropShadow)
        count++;
    if (innerShadow)
        count++;
    if (outerGlow)
        count++;
    if (innerGlow)
        count++;
    if (bevel)
        count++;
    if (solidFill)
        count++;
    psdWriter_1.writeUint16(writer, 0);
    psdWriter_1.writeUint16(writer, count);
    psdWriter_1.writeSignature(writer, '8BIM');
    psdWriter_1.writeSignature(writer, 'cmnS');
    psdWriter_1.writeUint32(writer, 7); // size
    psdWriter_1.writeUint32(writer, 0); // version
    psdWriter_1.writeUint8(writer, 1); // visible
    psdWriter_1.writeZeros(writer, 2);
    if (dropShadow) {
        psdWriter_1.writeSignature(writer, '8BIM');
        psdWriter_1.writeSignature(writer, 'dsdw');
        writeShadowInfo(writer, dropShadow);
    }
    if (innerShadow) {
        psdWriter_1.writeSignature(writer, '8BIM');
        psdWriter_1.writeSignature(writer, 'isdw');
        writeShadowInfo(writer, innerShadow);
    }
    if (outerGlow) {
        psdWriter_1.writeSignature(writer, '8BIM');
        psdWriter_1.writeSignature(writer, 'oglw');
        psdWriter_1.writeUint32(writer, 42);
        psdWriter_1.writeUint32(writer, 2);
        psdWriter_1.writeFixedPoint32(writer, ((_d = outerGlow.size) === null || _d === void 0 ? void 0 : _d.value) || 0);
        psdWriter_1.writeFixedPoint32(writer, 0); // intensity
        psdWriter_1.writeColor(writer, outerGlow.color);
        writeBlendMode(writer, outerGlow.blendMode);
        psdWriter_1.writeUint8(writer, outerGlow.enabled ? 1 : 0);
        writeFixedPoint8(writer, outerGlow.opacity || 0);
        psdWriter_1.writeColor(writer, outerGlow.color);
    }
    if (innerGlow) {
        psdWriter_1.writeSignature(writer, '8BIM');
        psdWriter_1.writeSignature(writer, 'iglw');
        psdWriter_1.writeUint32(writer, 43);
        psdWriter_1.writeUint32(writer, 2);
        psdWriter_1.writeFixedPoint32(writer, ((_e = innerGlow.size) === null || _e === void 0 ? void 0 : _e.value) || 0);
        psdWriter_1.writeFixedPoint32(writer, 0); // intensity
        psdWriter_1.writeColor(writer, innerGlow.color);
        writeBlendMode(writer, innerGlow.blendMode);
        psdWriter_1.writeUint8(writer, innerGlow.enabled ? 1 : 0);
        writeFixedPoint8(writer, innerGlow.opacity || 0);
        psdWriter_1.writeUint8(writer, 0); // inverted
        psdWriter_1.writeColor(writer, innerGlow.color);
    }
    if (bevel) {
        psdWriter_1.writeSignature(writer, '8BIM');
        psdWriter_1.writeSignature(writer, 'bevl');
        psdWriter_1.writeUint32(writer, 78);
        psdWriter_1.writeUint32(writer, 2);
        psdWriter_1.writeFixedPoint32(writer, bevel.angle || 0);
        psdWriter_1.writeFixedPoint32(writer, bevel.strength || 0);
        psdWriter_1.writeFixedPoint32(writer, ((_f = bevel.size) === null || _f === void 0 ? void 0 : _f.value) || 0);
        writeBlendMode(writer, bevel.highlightBlendMode);
        writeBlendMode(writer, bevel.shadowBlendMode);
        psdWriter_1.writeColor(writer, bevel.highlightColor);
        psdWriter_1.writeColor(writer, bevel.shadowColor);
        var style = bevelStyles.indexOf(bevel.style);
        psdWriter_1.writeUint8(writer, style <= 0 ? 1 : style);
        writeFixedPoint8(writer, bevel.highlightOpacity || 0);
        writeFixedPoint8(writer, bevel.shadowOpacity || 0);
        psdWriter_1.writeUint8(writer, bevel.enabled ? 1 : 0);
        psdWriter_1.writeUint8(writer, bevel.useGlobalLight ? 1 : 0);
        psdWriter_1.writeUint8(writer, bevel.direction === 'down' ? 1 : 0);
        psdWriter_1.writeColor(writer, bevel.highlightColor);
        psdWriter_1.writeColor(writer, bevel.shadowColor);
    }
    if (solidFill) {
        psdWriter_1.writeSignature(writer, '8BIM');
        psdWriter_1.writeSignature(writer, 'sofi');
        psdWriter_1.writeUint32(writer, 34);
        psdWriter_1.writeUint32(writer, 2);
        writeBlendMode(writer, solidFill.blendMode);
        psdWriter_1.writeColor(writer, solidFill.color);
        writeFixedPoint8(writer, solidFill.opacity || 0);
        psdWriter_1.writeUint8(writer, solidFill.enabled ? 1 : 0);
        psdWriter_1.writeColor(writer, solidFill.color);
    }
}
exports.writeEffects = writeEffects;

//# sourceMappingURL=data:application/json;charset=utf8;base64,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QyxDQUFDLENBQUM7UUFDdkIsY0FBYyxDQUFDLE1BQU0sRUFBRSxTQUFTLENBQUMsU0FBUyxDQUFDLENBQUM7UUFDNUMsc0JBQVUsQ0FBQyxNQUFNLEVBQUUsU0FBUyxDQUFDLEtBQUssQ0FBQyxDQUFDO1FBQ3BDLGdCQUFnQixDQUFDLE1BQU0sRUFBRSxTQUFTLENBQUMsT0FBTyxJQUFJLENBQUMsQ0FBQyxDQUFDO1FBQ2pELHNCQUFVLENBQUMsTUFBTSxFQUFFLFNBQVMsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDOUMsc0JBQVUsQ0FBQyxNQUFNLEVBQUUsU0FBUyxDQUFDLEtBQUssQ0FBQyxDQUFDO0tBQ3BDO0FBQ0YsQ0FBQztBQXJHRCxvQ0FxR0MiLCJmaWxlIjoiZWZmZWN0c0hlbHBlcnMuanMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBMYXllckVmZmVjdHNJbmZvLCBCZXZlbFN0eWxlLCBMYXllckVmZmVjdFNoYWRvdyB9IGZyb20gJy4vcHNkJztcbmltcG9ydCB7IHRvQmxlbmRNb2RlLCBmcm9tQmxlbmRNb2RlIH0gZnJvbSAnLi9oZWxwZXJzJztcbmltcG9ydCB7XG5cdFBzZFJlYWRlciwgY2hlY2tTaWduYXR1cmUsIHJlYWRTaWduYXR1cmUsIHNraXBCeXRlcywgcmVhZFVpbnQxNiwgcmVhZFVpbnQ4LFxuXHRyZWFkVWludDMyLCByZWFkRml4ZWRQb2ludDMyLCByZWFkQ29sb3Jcbn0gZnJvbSAnLi9wc2RSZWFkZXInO1xuaW1wb3J0IHtcblx0UHNkV3JpdGVyLCB3cml0ZVNpZ25hdHVyZSwgd3JpdGVVaW50MTYsIHdyaXRlWmVyb3MsIHdyaXRlRml4ZWRQb2ludDMyLFxuXHR3cml0ZVVpbnQ4LCB3cml0ZVVpbnQzMiwgd3JpdGVDb2xvclxufSBmcm9tICcuL3BzZFdyaXRlcic7XG5cbmNvbnN0IGJldmVsU3R5bGVzOiBCZXZlbFN0eWxlW10gPSBbXG5cdHVuZGVmaW5lZCBhcyBhbnksICdvdXRlciBiZXZlbCcsICdpbm5lciBiZXZlbCcsICdlbWJvc3MnLCAncGlsbG93IGVtYm9zcycsICdzdHJva2UgZW1ib3NzJ1xuXTtcblxuZnVuY3Rpb24gcmVhZEJsZW5kTW9kZShyZWFkZXI6IFBzZFJlYWRlcikge1xuXHRjaGVja1NpZ25hdHVyZShyZWFkZXIsICc4QklNJyk7XG5cdHJldHVybiB0b0JsZW5kTW9kZVtyZWFkU2lnbmF0dXJlKHJlYWRlcildIHx8ICdub3JtYWwnO1xufVxuXG5mdW5jdGlvbiB3cml0ZUJsZW5kTW9kZSh3cml0ZXI6IFBzZFdyaXRlciwgbW9kZTogc3RyaW5nIHwgdW5kZWZpbmVkKSB7XG5cdHdyaXRlU2lnbmF0dXJlKHdyaXRlciwgJzhCSU0nKTtcblx0d3JpdGVTaWduYXR1cmUod3JpdGVyLCBmcm9tQmxlbmRNb2RlW21vZGUhXSB8fCAnbm9ybScpO1xufVxuXG5mdW5jdGlvbiByZWFkRml4ZWRQb2ludDgocmVhZGVyOiBQc2RSZWFkZXIpIHtcblx0cmV0dXJuIHJlYWRVaW50OChyZWFkZXIpIC8gMHhmZjtcbn1cblxuZnVuY3Rpb24gd3JpdGVGaXhlZFBvaW50OCh3cml0ZXI6IFBzZFdyaXRlciwgdmFsdWU6IG51bWJlcikge1xuXHR3cml0ZVVpbnQ4KHdyaXRlciwgTWF0aC5yb3VuZCh2YWx1ZSAqIDB4ZmYpIHwgMCk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiByZWFkRWZmZWN0cyhyZWFkZXI6IFBzZFJlYWRlcikge1xuXHRjb25zdCB2ZXJzaW9uID0gcmVhZFVpbnQxNihyZWFkZXIpO1xuXHRpZiAodmVyc2lvbiAhPT0gMCkgdGhyb3cgbmV3IEVycm9yKGBJbnZhbGlkIGVmZmVjdHMgbGF5ZXIgdmVyc2lvbjogJHt2ZXJzaW9ufWApO1xuXG5cdGNvbnN0IGVmZmVjdHNDb3VudCA9IHJlYWRVaW50MTYocmVhZGVyKTtcblx0Y29uc3QgZWZmZWN0czogTGF5ZXJFZmZlY3RzSW5mbyA9IDxhbnk+e307XG5cblx0Zm9yIChsZXQgaSA9IDA7IGkgPCBlZmZlY3RzQ291bnQ7IGkrKykge1xuXHRcdGNoZWNrU2lnbmF0dXJlKHJlYWRlciwgJzhCSU0nKTtcblx0XHRjb25zdCB0eXBlID0gcmVhZFNpZ25hdHVyZShyZWFkZXIpO1xuXG5cdFx0c3dpdGNoICh0eXBlKSB7XG5cdFx0XHRjYXNlICdjbW5TJzogeyAvLyBjb21tb24gc3RhdGUgKHNlZSBTZWUgRWZmZWN0cyBsYXllciwgY29tbW9uIHN0YXRlIGluZm8pXG5cdFx0XHRcdGNvbnN0IHNpemUgPSByZWFkVWludDMyKHJlYWRlcik7XG5cdFx0XHRcdGNvbnN0IHZlcnNpb24gPSByZWFkVWludDMyKHJlYWRlcik7XG5cdFx0XHRcdGNvbnN0IHZpc2libGUgPSAhIXJlYWRVaW50OChyZWFkZXIpO1xuXHRcdFx0XHRza2lwQnl0ZXMocmVhZGVyLCAyKTtcblxuXHRcdFx0XHRpZiAoc2l6ZSAhPT0gNyB8fCB2ZXJzaW9uICE9PSAwIHx8ICF2aXNpYmxlKSB0aHJvdyBuZXcgRXJyb3IoYEludmFsaWQgZWZmZWN0cyBjb21tb24gc3RhdGVgKTtcblx0XHRcdFx0YnJlYWs7XG5cdFx0XHR9XG5cdFx0XHRjYXNlICdkc2R3JzogLy8gZHJvcCBzaGFkb3cgKHNlZSBTZWUgRWZmZWN0cyBsYXllciwgZHJvcCBzaGFkb3cgYW5kIGlubmVyIHNoYWRvdyBpbmZvKVxuXHRcdFx0Y2FzZSAnaXNkdyc6IHsgLy8gaW5uZXIgc2hhZG93IChzZWUgU2VlIEVmZmVjdHMgbGF5ZXIsIGRyb3Agc2hhZG93IGFuZCBpbm5lciBzaGFkb3cgaW5mbylcblx0XHRcdFx0Y29uc3QgYmxvY2tTaXplID0gcmVhZFVpbnQzMihyZWFkZXIpO1xuXHRcdFx0XHRjb25zdCB2ZXJzaW9uID0gcmVhZFVpbnQzMihyZWFkZXIpO1xuXG5cdFx0XHRcdGlmIChibG9ja1NpemUgIT09IDQxICYmIGJsb2NrU2l6ZSAhPT0gNTEpIHRocm93IG5ldyBFcnJvcihgSW52YWxpZCBzaGFkb3cgc2l6ZTogJHtibG9ja1NpemV9YCk7XG5cdFx0XHRcdGlmICh2ZXJzaW9uICE9PSAwICYmIHZlcnNpb24gIT09IDIpIHRocm93IG5ldyBFcnJvcihgSW52YWxpZCBzaGFkb3cgdmVyc2lvbjogJHt2ZXJzaW9ufWApO1xuXG5cdFx0XHRcdGNvbnN0IHNpemUgPSByZWFkRml4ZWRQb2ludDMyKHJlYWRlcik7XG5cdFx0XHRcdHJlYWRGaXhlZFBvaW50MzIocmVhZGVyKTsgLy8gaW50ZW5zaXR5XG5cdFx0XHRcdGNvbnN0IGFuZ2xlID0gcmVhZEZpeGVkUG9pbnQzMihyZWFkZXIpO1xuXHRcdFx0XHRjb25zdCBkaXN0YW5jZSA9IHJlYWRGaXhlZFBvaW50MzIocmVhZGVyKTtcblx0XHRcdFx0Y29uc3QgY29sb3IgPSByZWFkQ29sb3IocmVhZGVyKTtcblx0XHRcdFx0Y29uc3QgYmxlbmRNb2RlID0gcmVhZEJsZW5kTW9kZShyZWFkZXIpO1xuXHRcdFx0XHRjb25zdCBlbmFibGVkID0gISFyZWFkVWludDgocmVhZGVyKTtcblx0XHRcdFx0Y29uc3QgdXNlR2xvYmFsTGlnaHQgPSAhIXJlYWRVaW50OChyZWFkZXIpO1xuXHRcdFx0XHRjb25zdCBvcGFjaXR5ID0gcmVhZEZpeGVkUG9pbnQ4KHJlYWRlcik7XG5cdFx0XHRcdGlmIChibG9ja1NpemUgPj0gNTEpIHJlYWRDb2xvcihyZWFkZXIpOyAvLyBuYXRpdmUgY29sb3Jcblx0XHRcdFx0Y29uc3Qgc2hhZG93SW5mbzogTGF5ZXJFZmZlY3RTaGFkb3cgPSB7XG5cdFx0XHRcdFx0c2l6ZTogeyB1bml0czogJ1BpeGVscycsIHZhbHVlOiBzaXplIH0sXG5cdFx0XHRcdFx0ZGlzdGFuY2U6IHsgdW5pdHM6ICdQaXhlbHMnLCB2YWx1ZTogZGlzdGFuY2UgfSxcblx0XHRcdFx0XHRhbmdsZSwgY29sb3IsIGJsZW5kTW9kZSwgZW5hYmxlZCwgdXNlR2xvYmFsTGlnaHQsIG9wYWNpdHlcblx0XHRcdFx0fTtcblxuXHRcdFx0XHRpZiAodHlwZSA9PT0gJ2RzZHcnKSB7XG5cdFx0XHRcdFx0ZWZmZWN0cy5kcm9wU2hhZG93ID0gW3NoYWRvd0luZm9dO1xuXHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdGVmZmVjdHMuaW5uZXJTaGFkb3cgPSBbc2hhZG93SW5mb107XG5cdFx0XHRcdH1cblx0XHRcdFx0YnJlYWs7XG5cdFx0XHR9XG5cdFx0XHRjYXNlICdvZ2x3JzogeyAvLyBvdXRlciBnbG93IChzZWUgU2VlIEVmZmVjdHMgbGF5ZXIsIG91dGVyIGdsb3cgaW5mbylcblx0XHRcdFx0Y29uc3QgYmxvY2tTaXplID0gcmVhZFVpbnQzMihyZWFkZXIpO1xuXHRcdFx0XHRjb25zdCB2ZXJzaW9uID0gcmVhZFVpbnQzMihyZWFkZXIpO1xuXG5cdFx0XHRcdGlmIChibG9ja1NpemUgIT09IDMyICYmIGJsb2NrU2l6ZSAhPT0gNDIpIHRocm93IG5ldyBFcnJvcihgSW52YWxpZCBvdXRlciBnbG93IHNpemU6ICR7YmxvY2tTaXplfWApO1xuXHRcdFx0XHRpZiAodmVyc2lvbiAhPT0gMCAmJiB2ZXJzaW9uICE9PSAyKSB0aHJvdyBuZXcgRXJyb3IoYEludmFsaWQgb3V0ZXIgZ2xvdyB2ZXJzaW9uOiAke3ZlcnNpb259YCk7XG5cblx0XHRcdFx0Y29uc3Qgc2l6ZSA9IHJlYWRGaXhlZFBvaW50MzIocmVhZGVyKTtcblx0XHRcdFx0cmVhZEZpeGVkUG9pbnQzMihyZWFkZXIpOyAvLyBpbnRlbnNpdHlcblx0XHRcdFx0Y29uc3QgY29sb3IgPSByZWFkQ29sb3IocmVhZGVyKTtcblx0XHRcdFx0Y29uc3QgYmxlbmRNb2RlID0gcmVhZEJsZW5kTW9kZShyZWFkZXIpO1xuXHRcdFx0XHRjb25zdCBlbmFibGVkID0gISFyZWFkVWludDgocmVhZGVyKTtcblx0XHRcdFx0Y29uc3Qgb3BhY2l0eSA9IHJlYWRGaXhlZFBvaW50OChyZWFkZXIpO1xuXHRcdFx0XHRpZiAoYmxvY2tTaXplID49IDQyKSByZWFkQ29sb3IocmVhZGVyKTsgLy8gbmF0aXZlIGNvbG9yXG5cblx0XHRcdFx0ZWZmZWN0cy5vdXRlckdsb3cgPSB7XG5cdFx0XHRcdFx0c2l6ZTogeyB1bml0czogJ1BpeGVscycsIHZhbHVlOiBzaXplIH0sXG5cdFx0XHRcdFx0Y29sb3IsIGJsZW5kTW9kZSwgZW5hYmxlZCwgb3BhY2l0eVxuXHRcdFx0XHR9O1xuXHRcdFx0XHRicmVhaztcblx0XHRcdH1cblx0XHRcdGNhc2UgJ2lnbHcnOiB7IC8vIGlubmVyIGdsb3cgKHNlZSBTZWUgRWZmZWN0cyBsYXllciwgaW5uZXIgZ2xvdyBpbmZvKVxuXHRcdFx0XHRjb25zdCBibG9ja1NpemUgPSByZWFkVWludDMyKHJlYWRlcik7XG5cdFx0XHRcdGNvbnN0IHZlcnNpb24gPSByZWFkVWludDMyKHJlYWRlcik7XG5cblx0XHRcdFx0aWYgKGJsb2NrU2l6ZSAhPT0gMzIgJiYgYmxvY2tTaXplICE9PSA0MykgdGhyb3cgbmV3IEVycm9yKGBJbnZhbGlkIGlubmVyIGdsb3cgc2l6ZTogJHtibG9ja1NpemV9YCk7XG5cdFx0XHRcdGlmICh2ZXJzaW9uICE9PSAwICYmIHZlcnNpb24gIT09IDIpIHRocm93IG5ldyBFcnJvcihgSW52YWxpZCBpbm5lciBnbG93IHZlcnNpb246ICR7dmVyc2lvbn1gKTtcblxuXHRcdFx0XHRjb25zdCBzaXplID0gcmVhZEZpeGVkUG9pbnQzMihyZWFkZXIpO1xuXHRcdFx0XHRyZWFkRml4ZWRQb2ludDMyKHJlYWRlcik7IC8vIGludGVuc2l0eVxuXHRcdFx0XHRjb25zdCBjb2xvciA9IHJlYWRDb2xvcihyZWFkZXIpO1xuXHRcdFx0XHRjb25zdCBibGVuZE1vZGUgPSByZWFkQmxlbmRNb2RlKHJlYWRlcik7XG5cdFx0XHRcdGNvbnN0IGVuYWJsZWQgPSAhIXJlYWRVaW50OChyZWFkZXIpO1xuXHRcdFx0XHRjb25zdCBvcGFjaXR5ID0gcmVhZEZpeGVkUG9pbnQ4KHJlYWRlcik7XG5cblx0XHRcdFx0aWYgKGJsb2NrU2l6ZSA+PSA0Mykge1xuXHRcdFx0XHRcdHJlYWRVaW50OChyZWFkZXIpOyAvLyBpbnZlcnRlZFxuXHRcdFx0XHRcdHJlYWRDb2xvcihyZWFkZXIpOyAvLyBuYXRpdmUgY29sb3Jcblx0XHRcdFx0fVxuXG5cdFx0XHRcdGVmZmVjdHMuaW5uZXJHbG93ID0ge1xuXHRcdFx0XHRcdHNpemU6IHsgdW5pdHM6ICdQaXhlbHMnLCB2YWx1ZTogc2l6ZSB9LFxuXHRcdFx0XHRcdGNvbG9yLCBibGVuZE1vZGUsIGVuYWJsZWQsIG9wYWNpdHlcblx0XHRcdFx0fTtcblx0XHRcdFx0YnJlYWs7XG5cdFx0XHR9XG5cdFx0XHRjYXNlICdiZXZsJzogeyAvLyBiZXZlbCAoc2VlIFNlZSBFZmZlY3RzIGxheWVyLCBiZXZlbCBpbmZvKVxuXHRcdFx0XHRjb25zdCBibG9ja1NpemUgPSByZWFkVWludDMyKHJlYWRlcik7XG5cdFx0XHRcdGNvbnN0IHZlcnNpb24gPSByZWFkVWludDMyKHJlYWRlcik7XG5cblx0XHRcdFx0aWYgKGJsb2NrU2l6ZSAhPT0gNTggJiYgYmxvY2tTaXplICE9PSA3OCkgdGhyb3cgbmV3IEVycm9yKGBJbnZhbGlkIGJldmVsIHNpemU6ICR7YmxvY2tTaXplfWApO1xuXHRcdFx0XHRpZiAodmVyc2lvbiAhPT0gMCAmJiB2ZXJzaW9uICE9PSAyKSB0aHJvdyBuZXcgRXJyb3IoYEludmFsaWQgYmV2ZWwgdmVyc2lvbjogJHt2ZXJzaW9ufWApO1xuXG5cdFx0XHRcdGNvbnN0IGFuZ2xlID0gcmVhZEZpeGVkUG9pbnQzMihyZWFkZXIpO1xuXHRcdFx0XHRjb25zdCBzdHJlbmd0aCA9IHJlYWRGaXhlZFBvaW50MzIocmVhZGVyKTtcblx0XHRcdFx0Y29uc3Qgc2l6ZSA9IHJlYWRGaXhlZFBvaW50MzIocmVhZGVyKTtcblx0XHRcdFx0Y29uc3QgaGlnaGxpZ2h0QmxlbmRNb2RlID0gcmVhZEJsZW5kTW9kZShyZWFkZXIpO1xuXHRcdFx0XHRjb25zdCBzaGFkb3dCbGVuZE1vZGUgPSByZWFkQmxlbmRNb2RlKHJlYWRlcik7XG5cdFx0XHRcdGNvbnN0IGhpZ2hsaWdodENvbG9yID0gcmVhZENvbG9yKHJlYWRlcik7XG5cdFx0XHRcdGNvbnN0IHNoYWRvd0NvbG9yID0gcmVhZENvbG9yKHJlYWRlcik7XG5cdFx0XHRcdGNvbnN0IHN0eWxlID0gYmV2ZWxTdHlsZXNbcmVhZFVpbnQ4KHJlYWRlcildIHx8ICdpbm5lciBiZXZlbCc7XG5cdFx0XHRcdGNvbnN0IGhpZ2hsaWdodE9wYWNpdHkgPSByZWFkRml4ZWRQb2ludDgocmVhZGVyKTtcblx0XHRcdFx0Y29uc3Qgc2hhZG93T3BhY2l0eSA9IHJlYWRGaXhlZFBvaW50OChyZWFkZXIpO1xuXHRcdFx0XHRjb25zdCBlbmFibGVkID0gISFyZWFkVWludDgocmVhZGVyKTtcblx0XHRcdFx0Y29uc3QgdXNlR2xvYmFsTGlnaHQgPSAhIXJlYWRVaW50OChyZWFkZXIpO1xuXHRcdFx0XHRjb25zdCBkaXJlY3Rpb24gPSByZWFkVWludDgocmVhZGVyKSA/ICdkb3duJyA6ICd1cCc7XG5cblx0XHRcdFx0aWYgKGJsb2NrU2l6ZSA+PSA3OCkge1xuXHRcdFx0XHRcdHJlYWRDb2xvcihyZWFkZXIpOyAvLyByZWFsIGhpZ2hsaWdodCBjb2xvclxuXHRcdFx0XHRcdHJlYWRDb2xvcihyZWFkZXIpOyAvLyByZWFsIHNoYWRvdyBjb2xvclxuXHRcdFx0XHR9XG5cblx0XHRcdFx0ZWZmZWN0cy5iZXZlbCA9IHtcblx0XHRcdFx0XHRzaXplOiB7IHVuaXRzOiAnUGl4ZWxzJywgdmFsdWU6IHNpemUgfSxcblx0XHRcdFx0XHRhbmdsZSwgc3RyZW5ndGgsIGhpZ2hsaWdodEJsZW5kTW9kZSwgc2hhZG93QmxlbmRNb2RlLCBoaWdobGlnaHRDb2xvciwgc2hhZG93Q29sb3IsXG5cdFx0XHRcdFx0c3R5bGUsIGhpZ2hsaWdodE9wYWNpdHksIHNoYWRvd09wYWNpdHksIGVuYWJsZWQsIHVzZUdsb2JhbExpZ2h0LCBkaXJlY3Rpb24sXG5cdFx0XHRcdH07XG5cdFx0XHRcdGJyZWFrO1xuXHRcdFx0fVxuXHRcdFx0Y2FzZSAnc29maSc6IHsgLy8gc29saWQgZmlsbCAoUGhvdG9zaG9wIDcuMCkgKHNlZSBTZWUgRWZmZWN0cyBsYXllciwgc29saWQgZmlsbCAoYWRkZWQgaW4gUGhvdG9zaG9wIDcuMCkpXG5cdFx0XHRcdGNvbnN0IHNpemUgPSByZWFkVWludDMyKHJlYWRlcik7XG5cdFx0XHRcdGNvbnN0IHZlcnNpb24gPSByZWFkVWludDMyKHJlYWRlcik7XG5cblx0XHRcdFx0aWYgKHNpemUgIT09IDM0KSB0aHJvdyBuZXcgRXJyb3IoYEludmFsaWQgZWZmZWN0cyBzb2xpZCBmaWxsIGluZm8gc2l6ZTogJHtzaXplfWApO1xuXHRcdFx0XHRpZiAodmVyc2lvbiAhPT0gMikgdGhyb3cgbmV3IEVycm9yKGBJbnZhbGlkIGVmZmVjdHMgc29saWQgZmlsbCBpbmZvIHZlcnNpb246ICR7dmVyc2lvbn1gKTtcblxuXHRcdFx0XHRjb25zdCBibGVuZE1vZGUgPSByZWFkQmxlbmRNb2RlKHJlYWRlcik7XG5cdFx0XHRcdGNvbnN0IGNvbG9yID0gcmVhZENvbG9yKHJlYWRlcik7XG5cdFx0XHRcdGNvbnN0IG9wYWNpdHkgPSByZWFkRml4ZWRQb2ludDgocmVhZGVyKTtcblx0XHRcdFx0Y29uc3QgZW5hYmxlZCA9ICEhcmVhZFVpbnQ4KHJlYWRlcik7XG5cdFx0XHRcdHJlYWRDb2xvcihyZWFkZXIpOyAvLyBuYXRpdmUgY29sb3JcblxuXHRcdFx0XHRlZmZlY3RzLnNvbGlkRmlsbCA9IFt7IGJsZW5kTW9kZSwgY29sb3IsIG9wYWNpdHksIGVuYWJsZWQgfV07XG5cdFx0XHRcdGJyZWFrO1xuXHRcdFx0fVxuXHRcdFx0ZGVmYXVsdDpcblx0XHRcdFx0dGhyb3cgbmV3IEVycm9yKGBJbnZhbGlkIGVmZmVjdCB0eXBlOiAnJHt0eXBlfSdgKTtcblx0XHR9XG5cdH1cblxuXHRyZXR1cm4gZWZmZWN0cztcbn1cblxuZnVuY3Rpb24gd3JpdGVTaGFkb3dJbmZvKHdyaXRlcjogUHNkV3JpdGVyLCBzaGFkb3c6IExheWVyRWZmZWN0U2hhZG93KSB7XG5cdHdyaXRlVWludDMyKHdyaXRlciwgNTEpO1xuXHR3cml0ZVVpbnQzMih3cml0ZXIsIDIpO1xuXHR3cml0ZUZpeGVkUG9pbnQzMih3cml0ZXIsIHNoYWRvdy5zaXplICYmIHNoYWRvdy5zaXplLnZhbHVlIHx8IDApO1xuXHR3cml0ZUZpeGVkUG9pbnQzMih3cml0ZXIsIDApOyAvLyBpbnRlbnNpdHlcblx0d3JpdGVGaXhlZFBvaW50MzIod3JpdGVyLCBzaGFkb3cuYW5nbGUgfHwgMCk7XG5cdHdyaXRlRml4ZWRQb2ludDMyKHdyaXRlciwgc2hhZG93LmRpc3RhbmNlICYmIHNoYWRvdy5kaXN0YW5jZS52YWx1ZSB8fCAwKTtcblx0d3JpdGVDb2xvcih3cml0ZXIsIHNoYWRvdy5jb2xvcik7XG5cdHdyaXRlQmxlbmRNb2RlKHdyaXRlciwgc2hhZG93LmJsZW5kTW9kZSk7XG5cdHdyaXRlVWludDgod3JpdGVyLCBzaGFkb3cuZW5hYmxlZCA/IDEgOiAwKTtcblx0d3JpdGVVaW50OCh3cml0ZXIsIHNoYWRvdy51c2VHbG9iYWxMaWdodCA/IDEgOiAwKTtcblx0d3JpdGVGaXhlZFBvaW50OCh3cml0ZXIsIHNoYWRvdy5vcGFjaXR5ID8/IDEpO1xuXHR3cml0ZUNvbG9yKHdyaXRlciwgc2hhZG93LmNvbG9yKTsgLy8gbmF0aXZlIGNvbG9yXG59XG5cbmV4cG9ydCBmdW5jdGlvbiB3cml0ZUVmZmVjdHMod3JpdGVyOiBQc2RXcml0ZXIsIGVmZmVjdHM6IExheWVyRWZmZWN0c0luZm8pIHtcblx0Y29uc3QgZHJvcFNoYWRvdyA9IGVmZmVjdHMuZHJvcFNoYWRvdz8uWzBdO1xuXHRjb25zdCBpbm5lclNoYWRvdyA9IGVmZmVjdHMuaW5uZXJTaGFkb3c/LlswXTtcblx0Y29uc3Qgb3V0ZXJHbG93ID0gZWZmZWN0cy5vdXRlckdsb3c7XG5cdGNvbnN0IGlubmVyR2xvdyA9IGVmZmVjdHMuaW5uZXJHbG93O1xuXHRjb25zdCBiZXZlbCA9IGVmZmVjdHMuYmV2ZWw7XG5cdGNvbnN0IHNvbGlkRmlsbCA9IGVmZmVjdHMuc29saWRGaWxsPy5bMF07XG5cblx0bGV0IGNvdW50ID0gMTtcblx0aWYgKGRyb3BTaGFkb3cpIGNvdW50Kys7XG5cdGlmIChpbm5lclNoYWRvdykgY291bnQrKztcblx0aWYgKG91dGVyR2xvdykgY291bnQrKztcblx0aWYgKGlubmVyR2xvdykgY291bnQrKztcblx0aWYgKGJldmVsKSBjb3VudCsrO1xuXHRpZiAoc29saWRGaWxsKSBjb3VudCsrO1xuXG5cdHdyaXRlVWludDE2KHdyaXRlciwgMCk7XG5cdHdyaXRlVWludDE2KHdyaXRlciwgY291bnQpO1xuXG5cdHdyaXRlU2lnbmF0dXJlKHdyaXRlciwgJzhCSU0nKTtcblx0d3JpdGVTaWduYXR1cmUod3JpdGVyLCAnY21uUycpO1xuXHR3cml0ZVVpbnQzMih3cml0ZXIsIDcpOyAvLyBzaXplXG5cdHdyaXRlVWludDMyKHdyaXRlciwgMCk7IC8vIHZlcnNpb25cblx0d3JpdGVVaW50OCh3cml0ZXIsIDEpOyAvLyB2aXNpYmxlXG5cdHdyaXRlWmVyb3Mod3JpdGVyLCAyKTtcblxuXHRpZiAoZHJvcFNoYWRvdykge1xuXHRcdHdyaXRlU2lnbmF0dXJlKHdyaXRlciwgJzhCSU0nKTtcblx0XHR3cml0ZVNpZ25hdHVyZSh3cml0ZXIsICdkc2R3Jyk7XG5cdFx0d3JpdGVTaGFkb3dJbmZvKHdyaXRlciwgZHJvcFNoYWRvdyk7XG5cdH1cblxuXHRpZiAoaW5uZXJTaGFkb3cpIHtcblx0XHR3cml0ZVNpZ25hdHVyZSh3cml0ZXIsICc4QklNJyk7XG5cdFx0d3JpdGVTaWduYXR1cmUod3JpdGVyLCAnaXNkdycpO1xuXHRcdHdyaXRlU2hhZG93SW5mbyh3cml0ZXIsIGlubmVyU2hhZG93KTtcblx0fVxuXG5cdGlmIChvdXRlckdsb3cpIHtcblx0XHR3cml0ZVNpZ25hdHVyZSh3cml0ZXIsICc4QklNJyk7XG5cdFx0d3JpdGVTaWduYXR1cmUod3JpdGVyLCAnb2dsdycpO1xuXHRcdHdyaXRlVWludDMyKHdyaXRlciwgNDIpO1xuXHRcdHdyaXRlVWludDMyKHdyaXRlciwgMik7XG5cdFx0d3JpdGVGaXhlZFBvaW50MzIod3JpdGVyLCBvdXRlckdsb3cuc2l6ZT8udmFsdWUgfHwgMCk7XG5cdFx0d3JpdGVGaXhlZFBvaW50MzIod3JpdGVyLCAwKTsgLy8gaW50ZW5zaXR5XG5cdFx0d3JpdGVDb2xvcih3cml0ZXIsIG91dGVyR2xvdy5jb2xvcik7XG5cdFx0d3JpdGVCbGVuZE1vZGUod3JpdGVyLCBvdXRlckdsb3cuYmxlbmRNb2RlKTtcblx0XHR3cml0ZVVpbnQ4KHdyaXRlciwgb3V0ZXJHbG93LmVuYWJsZWQgPyAxIDogMCk7XG5cdFx0d3JpdGVGaXhlZFBvaW50OCh3cml0ZXIsIG91dGVyR2xvdy5vcGFjaXR5IHx8IDApO1xuXHRcdHdyaXRlQ29sb3Iod3JpdGVyLCBvdXRlckdsb3cuY29sb3IpO1xuXHR9XG5cblx0aWYgKGlubmVyR2xvdykge1xuXHRcdHdyaXRlU2lnbmF0dXJlKHdyaXRlciwgJzhCSU0nKTtcblx0XHR3cml0ZVNpZ25hdHVyZSh3cml0ZXIsICdpZ2x3Jyk7XG5cdFx0d3JpdGVVaW50MzIod3JpdGVyLCA0Myk7XG5cdFx0d3JpdGVVaW50MzIod3JpdGVyLCAyKTtcblx0XHR3cml0ZUZpeGVkUG9pbnQzMih3cml0ZXIsIGlubmVyR2xvdy5zaXplPy52YWx1ZSB8fCAwKTtcblx0XHR3cml0ZUZpeGVkUG9pbnQzMih3cml0ZXIsIDApOyAvLyBpbnRlbnNpdHlcblx0XHR3cml0ZUNvbG9yKHdyaXRlciwgaW5uZXJHbG93LmNvbG9yKTtcblx0XHR3cml0ZUJsZW5kTW9kZSh3cml0ZXIsIGlubmVyR2xvdy5ibGVuZE1vZGUpO1xuXHRcdHdyaXRlVWludDgod3JpdGVyLCBpbm5lckdsb3cuZW5hYmxlZCA/IDEgOiAwKTtcblx0XHR3cml0ZUZpeGVkUG9pbnQ4KHdyaXRlciwgaW5uZXJHbG93Lm9wYWNpdHkgfHwgMCk7XG5cdFx0d3JpdGVVaW50OCh3cml0ZXIsIDApOyAvLyBpbnZlcnRlZFxuXHRcdHdyaXRlQ29sb3Iod3JpdGVyLCBpbm5lckdsb3cuY29sb3IpO1xuXHR9XG5cblx0aWYgKGJldmVsKSB7XG5cdFx0d3JpdGVTaWduYXR1cmUod3JpdGVyLCAnOEJJTScpO1xuXHRcdHdyaXRlU2lnbmF0dXJlKHdyaXRlciwgJ2JldmwnKTtcblx0XHR3cml0ZVVpbnQzMih3cml0ZXIsIDc4KTtcblx0XHR3cml0ZVVpbnQzMih3cml0ZXIsIDIpO1xuXHRcdHdyaXRlRml4ZWRQb2ludDMyKHdyaXRlciwgYmV2ZWwuYW5nbGUgfHwgMCk7XG5cdFx0d3JpdGVGaXhlZFBvaW50MzIod3JpdGVyLCBiZXZlbC5zdHJlbmd0aCB8fCAwKTtcblx0XHR3cml0ZUZpeGVkUG9pbnQzMih3cml0ZXIsIGJldmVsLnNpemU/LnZhbHVlIHx8IDApO1xuXHRcdHdyaXRlQmxlbmRNb2RlKHdyaXRlciwgYmV2ZWwuaGlnaGxpZ2h0QmxlbmRNb2RlKTtcblx0XHR3cml0ZUJsZW5kTW9kZSh3cml0ZXIsIGJldmVsLnNoYWRvd0JsZW5kTW9kZSk7XG5cdFx0d3JpdGVDb2xvcih3cml0ZXIsIGJldmVsLmhpZ2hsaWdodENvbG9yKTtcblx0XHR3cml0ZUNvbG9yKHdyaXRlciwgYmV2ZWwuc2hhZG93Q29sb3IpO1xuXHRcdGNvbnN0IHN0eWxlID0gYmV2ZWxTdHlsZXMuaW5kZXhPZihiZXZlbC5zdHlsZSEpO1xuXHRcdHdyaXRlVWludDgod3JpdGVyLCBzdHlsZSA8PSAwID8gMSA6IHN0eWxlKTtcblx0XHR3cml0ZUZpeGVkUG9pbnQ4KHdyaXRlciwgYmV2ZWwuaGlnaGxpZ2h0T3BhY2l0eSB8fCAwKTtcblx0XHR3cml0ZUZpeGVkUG9pbnQ4KHdyaXRlciwgYmV2ZWwuc2hhZG93T3BhY2l0eSB8fCAwKTtcblx0XHR3cml0ZVVpbnQ4KHdyaXRlciwgYmV2ZWwuZW5hYmxlZCA/IDEgOiAwKTtcblx0XHR3cml0ZVVpbnQ4KHdyaXRlciwgYmV2ZWwudXNlR2xvYmFsTGlnaHQgPyAxIDogMCk7XG5cdFx0d3JpdGVVaW50OCh3cml0ZXIsIGJldmVsLmRpcmVjdGlvbiA9PT0gJ2Rvd24nID8gMSA6IDApO1xuXHRcdHdyaXRlQ29sb3Iod3JpdGVyLCBiZXZlbC5oaWdobGlnaHRDb2xvcik7XG5cdFx0d3JpdGVDb2xvcih3cml0ZXIsIGJldmVsLnNoYWRvd0NvbG9yKTtcblx0fVxuXG5cdGlmIChzb2xpZEZpbGwpIHtcblx0XHR3cml0ZVNpZ25hdHVyZSh3cml0ZXIsICc4QklNJyk7XG5cdFx0d3JpdGVTaWduYXR1cmUod3JpdGVyLCAnc29maScpO1xuXHRcdHdyaXRlVWludDMyKHdyaXRlciwgMzQpO1xuXHRcdHdyaXRlVWludDMyKHdyaXRlciwgMik7XG5cdFx0d3JpdGVCbGVuZE1vZGUod3JpdGVyLCBzb2xpZEZpbGwuYmxlbmRNb2RlKTtcblx0XHR3cml0ZUNvbG9yKHdyaXRlciwgc29saWRGaWxsLmNvbG9yKTtcblx0XHR3cml0ZUZpeGVkUG9pbnQ4KHdyaXRlciwgc29saWRGaWxsLm9wYWNpdHkgfHwgMCk7XG5cdFx0d3JpdGVVaW50OCh3cml0ZXIsIHNvbGlkRmlsbC5lbmFibGVkID8gMSA6IDApO1xuXHRcdHdyaXRlQ29sb3Iod3JpdGVyLCBzb2xpZEZpbGwuY29sb3IpO1xuXHR9XG59XG4iXSwic291cmNlUm9vdCI6Ii9ob21lL21hbmgva2FvcGl6L2VlbC9hZy1wc2Qvc3JjIn0=
