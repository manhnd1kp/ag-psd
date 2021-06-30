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
exports.hasMultiEffects = exports.infoHandlersMap = exports.infoHandlers = void 0;
var base64_js_1 = require("base64-js");
var effectsHelpers_1 = require("./effectsHelpers");
var helpers_1 = require("./helpers");
var psdReader_1 = require("./psdReader");
var psdWriter_1 = require("./psdWriter");
var descriptor_1 = require("./descriptor");
var engineData_1 = require("./engineData");
var text_1 = require("./text");
exports.infoHandlers = [];
exports.infoHandlersMap = {};
function addHandler(key, has, read, write) {
    var handler = { key: key, has: has, read: read, write: write };
    exports.infoHandlers.push(handler);
    exports.infoHandlersMap[handler.key] = handler;
}
function addHandlerAlias(key, target) {
    exports.infoHandlersMap[key] = exports.infoHandlersMap[target];
}
function hasKey(key) {
    return function (target) { return target[key] !== undefined; };
}
function readLength64(reader) {
    if (psdReader_1.readUint32(reader))
        throw new Error("Resource size above 4 GB limit at " + reader.offset.toString(16));
    return psdReader_1.readUint32(reader);
}
function writeLength64(writer, length) {
    psdWriter_1.writeUint32(writer, 0);
    psdWriter_1.writeUint32(writer, length);
}
addHandler('TySh', hasKey('text'), function (reader, target, leftBytes) {
    if (psdReader_1.readInt16(reader) !== 1)
        throw new Error("Invalid TySh version");
    var transform = [];
    for (var i = 0; i < 6; i++)
        transform.push(psdReader_1.readFloat64(reader));
    if (psdReader_1.readInt16(reader) !== 50)
        throw new Error("Invalid TySh text version");
    var text = descriptor_1.readVersionAndDescriptor(reader);
    if (psdReader_1.readInt16(reader) !== 1)
        throw new Error("Invalid TySh warp version");
    var warp = descriptor_1.readVersionAndDescriptor(reader);
    target.text = {
        transform: transform,
        left: psdReader_1.readFloat32(reader),
        top: psdReader_1.readFloat32(reader),
        right: psdReader_1.readFloat32(reader),
        bottom: psdReader_1.readFloat32(reader),
        text: text['Txt '].replace(/\r/g, '\n'),
        index: text.TextIndex || 0,
        gridding: descriptor_1.textGridding.decode(text.textGridding),
        antiAlias: descriptor_1.Annt.decode(text.AntA),
        orientation: descriptor_1.Ornt.decode(text.Ornt),
        warp: {
            style: descriptor_1.warpStyle.decode(warp.warpStyle),
            value: warp.warpValue || 0,
            perspective: warp.warpPerspective || 0,
            perspectiveOther: warp.warpPerspectiveOther || 0,
            rotate: descriptor_1.Ornt.decode(warp.warpRotate),
        },
    };
    if (text.EngineData) {
        var engineData = text_1.decodeEngineData(engineData_1.parseEngineData(text.EngineData));
        // const before = parseEngineData(text.EngineData);
        // const after = encodeEngineData(engineData);
        // require('fs').writeFileSync('before.txt', require('util').inspect(before, false, 99, false), 'utf8');
        // require('fs').writeFileSync('after.txt', require('util').inspect(after, false, 99, false), 'utf8');
        // console.log(require('util').inspect(parseEngineData(text.EngineData), false, 99, true));
        target.text = __assign(__assign({}, target.text), engineData);
        // console.log(require('util').inspect(target.text, false, 99, true));
    }
    psdReader_1.skipBytes(reader, leftBytes());
}, function (writer, target) {
    var text = target.text;
    var warp = text.warp || {};
    var transform = text.transform || [1, 0, 0, 1, 0, 0];
    var textDescriptor = {
        'Txt ': (text.text || '').replace(/\r?\n/g, '\r'),
        textGridding: descriptor_1.textGridding.encode(text.gridding),
        Ornt: descriptor_1.Ornt.encode(text.orientation),
        AntA: descriptor_1.Annt.encode(text.antiAlias),
        TextIndex: text.index || 0,
        EngineData: engineData_1.serializeEngineData(text_1.encodeEngineData(text)),
    };
    psdWriter_1.writeInt16(writer, 1); // version
    for (var i = 0; i < 6; i++) {
        psdWriter_1.writeFloat64(writer, transform[i]);
    }
    psdWriter_1.writeInt16(writer, 50); // text version
    descriptor_1.writeVersionAndDescriptor(writer, '', 'TxLr', textDescriptor);
    psdWriter_1.writeInt16(writer, 1); // warp version
    descriptor_1.writeVersionAndDescriptor(writer, '', 'warp', encodeWarp(warp));
    psdWriter_1.writeFloat32(writer, text.left);
    psdWriter_1.writeFloat32(writer, text.top);
    psdWriter_1.writeFloat32(writer, text.right);
    psdWriter_1.writeFloat32(writer, text.bottom);
    // writeZeros(writer, 2);
});
// vector fills
addHandler('SoCo', function (target) { return target.vectorFill !== undefined && target.vectorStroke === undefined &&
    target.vectorFill.type === 'color'; }, function (reader, target) {
    var descriptor = descriptor_1.readVersionAndDescriptor(reader);
    target.vectorFill = parseVectorContent(descriptor);
}, function (writer, target) {
    var descriptor = serializeVectorContent(target.vectorFill).descriptor;
    descriptor_1.writeVersionAndDescriptor(writer, '', 'null', descriptor);
});
addHandler('GdFl', function (target) { return target.vectorFill !== undefined && target.vectorStroke === undefined &&
    (target.vectorFill.type === 'solid' || target.vectorFill.type === 'noise'); }, function (reader, target, left) {
    var descriptor = descriptor_1.readVersionAndDescriptor(reader);
    target.vectorFill = parseVectorContent(descriptor);
    psdReader_1.skipBytes(reader, left());
}, function (writer, target) {
    var descriptor = serializeVectorContent(target.vectorFill).descriptor;
    descriptor_1.writeVersionAndDescriptor(writer, '', 'null', descriptor);
});
addHandler('PtFl', function (target) { return target.vectorFill !== undefined && target.vectorStroke === undefined &&
    target.vectorFill.type === 'pattern'; }, function (reader, target) {
    var descriptor = descriptor_1.readVersionAndDescriptor(reader);
    target.vectorFill = parseVectorContent(descriptor);
}, function (writer, target) {
    var descriptor = serializeVectorContent(target.vectorFill).descriptor;
    descriptor_1.writeVersionAndDescriptor(writer, '', 'null', descriptor);
});
addHandler('vscg', function (target) { return target.vectorFill !== undefined && target.vectorStroke !== undefined; }, function (reader, target, left) {
    psdReader_1.readSignature(reader); // key
    var desc = descriptor_1.readVersionAndDescriptor(reader);
    target.vectorFill = parseVectorContent(desc);
    psdReader_1.skipBytes(reader, left());
}, function (writer, target) {
    var _a = serializeVectorContent(target.vectorFill), descriptor = _a.descriptor, key = _a.key;
    psdWriter_1.writeSignature(writer, key);
    descriptor_1.writeVersionAndDescriptor(writer, '', 'null', descriptor);
});
function readBezierKnot(reader, width, height) {
    var y0 = psdReader_1.readFixedPointPath32(reader) * height;
    var x0 = psdReader_1.readFixedPointPath32(reader) * width;
    var y1 = psdReader_1.readFixedPointPath32(reader) * height;
    var x1 = psdReader_1.readFixedPointPath32(reader) * width;
    var y2 = psdReader_1.readFixedPointPath32(reader) * height;
    var x2 = psdReader_1.readFixedPointPath32(reader) * width;
    return [x0, y0, x1, y1, x2, y2];
}
function writeBezierKnot(writer, points, width, height) {
    psdWriter_1.writeFixedPointPath32(writer, points[1] / height); // y0
    psdWriter_1.writeFixedPointPath32(writer, points[0] / width); // x0
    psdWriter_1.writeFixedPointPath32(writer, points[3] / height); // y1
    psdWriter_1.writeFixedPointPath32(writer, points[2] / width); // x1
    psdWriter_1.writeFixedPointPath32(writer, points[5] / height); // y2
    psdWriter_1.writeFixedPointPath32(writer, points[4] / width); // x2
}
var booleanOperations = ['exclude', 'combine', 'subtract', 'intersect'];
addHandler('vmsk', hasKey('vectorMask'), function (reader, target, left, _a) {
    var width = _a.width, height = _a.height;
    if (psdReader_1.readUint32(reader) !== 3)
        throw new Error('Invalid vmsk version');
    target.vectorMask = { paths: [] };
    var vectorMask = target.vectorMask;
    var flags = psdReader_1.readUint32(reader);
    vectorMask.invert = (flags & 1) !== 0;
    vectorMask.notLink = (flags & 2) !== 0;
    vectorMask.disable = (flags & 4) !== 0;
    var paths = vectorMask.paths;
    var path = undefined;
    while (left() >= 26) {
        var selector = psdReader_1.readUint16(reader);
        switch (selector) {
            case 0: // Closed subpath length record
            case 3: { // Open subpath length record
                psdReader_1.readUint16(reader); // count
                var boolOp = psdReader_1.readUint16(reader);
                psdReader_1.readUint16(reader); // always 1 ?
                psdReader_1.skipBytes(reader, 18);
                path = { open: selector === 3, operation: booleanOperations[boolOp], knots: [] };
                paths.push(path);
                break;
            }
            case 1: // Closed subpath Bezier knot, linked
            case 2: // Closed subpath Bezier knot, unlinked
            case 4: // Open subpath Bezier knot, linked
            case 5: // Open subpath Bezier knot, unlinked
                path.knots.push({ linked: (selector === 1 || selector === 4), points: readBezierKnot(reader, width, height) });
                break;
            case 6: // Path fill rule record
                psdReader_1.skipBytes(reader, 24);
                break;
            case 7: { // Clipboard record
                // TODO: check if these need to be multiplied by document size
                var top_1 = psdReader_1.readFixedPointPath32(reader);
                var left_1 = psdReader_1.readFixedPointPath32(reader);
                var bottom = psdReader_1.readFixedPointPath32(reader);
                var right = psdReader_1.readFixedPointPath32(reader);
                var resolution = psdReader_1.readFixedPointPath32(reader);
                psdReader_1.skipBytes(reader, 4);
                vectorMask.clipboard = { top: top_1, left: left_1, bottom: bottom, right: right, resolution: resolution };
                break;
            }
            case 8: // Initial fill rule record
                vectorMask.fillStartsWithAllPixels = !!psdReader_1.readUint16(reader);
                psdReader_1.skipBytes(reader, 22);
                break;
            default: throw new Error('Invalid vmsk section');
        }
    }
    // const canvas = require('canvas').createCanvas(width, height);
    // const context = canvas.getContext('2d')!;
    // context.fillStyle = 'red';
    // for (const path of paths) {
    // 	context.beginPath();
    // 	context.moveTo(path.knots[0].points[2], path.knots[0].points[3]);
    // 	for (let i = 1; i < path.knots.length; i++) {
    // 		console.log(path.knots[i].points.map(x => x.toFixed(2)));
    // 		context.bezierCurveTo(
    // 			path.knots[i - 1].points[4], path.knots[i - 1].points[5],
    // 			path.knots[i].points[0], path.knots[i].points[1], path.knots[i].points[2], path.knots[i].points[3]);
    // 	}
    // 	if (!path.open) context.closePath();
    // 	context.fill();
    // }
    // require('fs').writeFileSync('out.png', canvas.toBuffer());
    psdReader_1.skipBytes(reader, left());
}, function (writer, target, _a) {
    var width = _a.width, height = _a.height;
    var vectorMask = target.vectorMask;
    var flags = (vectorMask.invert ? 1 : 0) |
        (vectorMask.notLink ? 2 : 0) |
        (vectorMask.disable ? 4 : 0);
    psdWriter_1.writeUint32(writer, 3); // version
    psdWriter_1.writeUint32(writer, flags);
    // initial entry
    psdWriter_1.writeUint16(writer, 6);
    psdWriter_1.writeZeros(writer, 24);
    var clipboard = vectorMask.clipboard;
    if (clipboard) {
        psdWriter_1.writeUint16(writer, 7);
        psdWriter_1.writeFixedPointPath32(writer, clipboard.top);
        psdWriter_1.writeFixedPointPath32(writer, clipboard.left);
        psdWriter_1.writeFixedPointPath32(writer, clipboard.bottom);
        psdWriter_1.writeFixedPointPath32(writer, clipboard.right);
        psdWriter_1.writeFixedPointPath32(writer, clipboard.resolution);
        psdWriter_1.writeZeros(writer, 4);
    }
    if (vectorMask.fillStartsWithAllPixels !== undefined) {
        psdWriter_1.writeUint16(writer, 8);
        psdWriter_1.writeUint16(writer, vectorMask.fillStartsWithAllPixels ? 1 : 0);
        psdWriter_1.writeZeros(writer, 22);
    }
    for (var _i = 0, _b = vectorMask.paths; _i < _b.length; _i++) {
        var path = _b[_i];
        psdWriter_1.writeUint16(writer, path.open ? 3 : 0);
        psdWriter_1.writeUint16(writer, path.knots.length);
        psdWriter_1.writeUint16(writer, Math.abs(booleanOperations.indexOf(path.operation))); // default to 1 if not found
        psdWriter_1.writeUint16(writer, 1);
        psdWriter_1.writeZeros(writer, 18); // TODO: these are sometimes non-zero
        var linkedKnot = path.open ? 4 : 1;
        var unlinkedKnot = path.open ? 5 : 2;
        for (var _c = 0, _d = path.knots; _c < _d.length; _c++) {
            var _e = _d[_c], linked = _e.linked, points = _e.points;
            psdWriter_1.writeUint16(writer, linked ? linkedKnot : unlinkedKnot);
            writeBezierKnot(writer, points, width, height);
        }
    }
});
// TODO: need to write vmsk if has outline ?
addHandlerAlias('vsms', 'vmsk');
addHandler('vogk', hasKey('vectorOrigination'), function (reader, target, left) {
    if (psdReader_1.readInt32(reader) !== 1)
        throw new Error("Invalid vogk version");
    var desc = descriptor_1.readVersionAndDescriptor(reader);
    // console.log(require('util').inspect(desc, false, 99, true));
    target.vectorOrigination = { keyDescriptorList: [] };
    for (var _i = 0, _a = desc.keyDescriptorList; _i < _a.length; _i++) {
        var i = _a[_i];
        var item = {};
        if (i.keyShapeInvalidated != null)
            item.keyShapeInvalidated = i.keyShapeInvalidated;
        if (i.keyOriginType != null)
            item.keyOriginType = i.keyOriginType;
        if (i.keyOriginResolution != null)
            item.keyOriginResolution = i.keyOriginResolution;
        if (i.keyOriginShapeBBox) {
            item.keyOriginShapeBoundingBox = {
                top: descriptor_1.parseUnits(i.keyOriginShapeBBox['Top ']),
                left: descriptor_1.parseUnits(i.keyOriginShapeBBox.Left),
                bottom: descriptor_1.parseUnits(i.keyOriginShapeBBox.Btom),
                right: descriptor_1.parseUnits(i.keyOriginShapeBBox.Rght),
            };
        }
        if (i.keyOriginRRectRadii) {
            item.keyOriginRRectRadii = {
                topRight: descriptor_1.parseUnits(i.keyOriginRRectRadii.topRight),
                topLeft: descriptor_1.parseUnits(i.keyOriginRRectRadii.topLeft),
                bottomLeft: descriptor_1.parseUnits(i.keyOriginRRectRadii.bottomLeft),
                bottomRight: descriptor_1.parseUnits(i.keyOriginRRectRadii.bottomRight),
            };
        }
        if (i.keyOriginBoxCorners) {
            item.keyOriginBoxCorners = [
                { x: i.keyOriginBoxCorners.rectangleCornerA.Hrzn, y: i.keyOriginBoxCorners.rectangleCornerA.Vrtc },
                { x: i.keyOriginBoxCorners.rectangleCornerB.Hrzn, y: i.keyOriginBoxCorners.rectangleCornerB.Vrtc },
                { x: i.keyOriginBoxCorners.rectangleCornerC.Hrzn, y: i.keyOriginBoxCorners.rectangleCornerC.Vrtc },
                { x: i.keyOriginBoxCorners.rectangleCornerD.Hrzn, y: i.keyOriginBoxCorners.rectangleCornerD.Vrtc },
            ];
        }
        if (i.Trnf) {
            item.transform = [i.Trnf.xx, i.Trnf.xy, i.Trnf.xy, i.Trnf.yy, i.Trnf.tx, i.Trnf.ty];
        }
        target.vectorOrigination.keyDescriptorList.push(item);
    }
    psdReader_1.skipBytes(reader, left());
}, function (writer, target) {
    var _a, _b;
    target;
    var orig = target.vectorOrigination;
    var desc = { keyDescriptorList: [] };
    for (var i = 0; i < orig.keyDescriptorList.length; i++) {
        var item = orig.keyDescriptorList[i];
        if (item.keyShapeInvalidated) {
            desc.keyDescriptorList.push({ keyShapeInvalidated: true, keyOriginIndex: i });
        }
        else {
            desc.keyDescriptorList.push({
                keyOriginType: (_a = item.keyOriginType) !== null && _a !== void 0 ? _a : 4,
                keyOriginResolution: (_b = item.keyOriginResolution) !== null && _b !== void 0 ? _b : 72,
            });
            var out = desc.keyDescriptorList[desc.keyDescriptorList.length - 1];
            if (item.keyOriginRRectRadii) {
                out.keyOriginRRectRadii = {
                    unitValueQuadVersion: 1,
                    topRight: descriptor_1.unitsValue(item.keyOriginRRectRadii.topRight, 'topRight'),
                    topLeft: descriptor_1.unitsValue(item.keyOriginRRectRadii.topLeft, 'topLeft'),
                    bottomLeft: descriptor_1.unitsValue(item.keyOriginRRectRadii.bottomLeft, 'bottomLeft'),
                    bottomRight: descriptor_1.unitsValue(item.keyOriginRRectRadii.bottomRight, 'bottomRight'),
                };
            }
            if (item.keyOriginShapeBoundingBox) {
                out.keyOriginShapeBBox = {
                    unitValueQuadVersion: 1,
                    'Top ': descriptor_1.unitsValue(item.keyOriginShapeBoundingBox.top, 'top'),
                    Left: descriptor_1.unitsValue(item.keyOriginShapeBoundingBox.left, 'left'),
                    Btom: descriptor_1.unitsValue(item.keyOriginShapeBoundingBox.bottom, 'bottom'),
                    Rght: descriptor_1.unitsValue(item.keyOriginShapeBoundingBox.right, 'right'),
                };
            }
            if (item.keyOriginBoxCorners && item.keyOriginBoxCorners.length === 4) {
                out.keyOriginBoxCorners = {
                    rectangleCornerA: { Hrzn: item.keyOriginBoxCorners[0].x, Vrtc: item.keyOriginBoxCorners[0].y },
                    rectangleCornerB: { Hrzn: item.keyOriginBoxCorners[1].x, Vrtc: item.keyOriginBoxCorners[1].y },
                    rectangleCornerC: { Hrzn: item.keyOriginBoxCorners[2].x, Vrtc: item.keyOriginBoxCorners[2].y },
                    rectangleCornerD: { Hrzn: item.keyOriginBoxCorners[3].x, Vrtc: item.keyOriginBoxCorners[3].y },
                };
            }
            if (item.transform && item.transform.length === 6) {
                out.Trnf = {
                    xx: item.transform[0],
                    xy: item.transform[1],
                    yx: item.transform[2],
                    yy: item.transform[3],
                    tx: item.transform[4],
                    ty: item.transform[5],
                };
            }
            out.keyOriginIndex = i;
        }
    }
    psdWriter_1.writeInt32(writer, 1); // version
    descriptor_1.writeVersionAndDescriptor(writer, '', 'null', desc);
});
addHandler('lmfx', function (target) { return target.effects !== undefined && hasMultiEffects(target.effects); }, function (reader, target, left, _, options) {
    var version = psdReader_1.readUint32(reader);
    if (version !== 0)
        throw new Error('Invalid lmfx version');
    var desc = descriptor_1.readVersionAndDescriptor(reader);
    // console.log(require('util').inspect(info, false, 99, true));
    // discard if read in 'lrFX' or 'lfx2' section
    target.effects = parseEffects(desc, !!options.logMissingFeatures);
    psdReader_1.skipBytes(reader, left());
}, function (writer, target, _, options) {
    var desc = serializeEffects(target.effects, !!options.logMissingFeatures, true);
    psdWriter_1.writeUint32(writer, 0); // version
    descriptor_1.writeVersionAndDescriptor(writer, '', 'null', desc);
});
addHandler('lrFX', hasKey('effects'), function (reader, target, left) {
    if (!target.effects)
        target.effects = effectsHelpers_1.readEffects(reader);
    psdReader_1.skipBytes(reader, left());
}, function (writer, target) {
    effectsHelpers_1.writeEffects(writer, target.effects);
});
addHandler('luni', hasKey('name'), function (reader, target, left) {
    target.name = psdReader_1.readUnicodeString(reader);
    psdReader_1.skipBytes(reader, left());
}, function (writer, target) {
    psdWriter_1.writeUnicodeString(writer, target.name);
    // writeUint16(writer, 0); // padding (but not extending string length)
});
addHandler('lnsr', hasKey('nameSource'), function (reader, target) { return target.nameSource = psdReader_1.readSignature(reader); }, function (writer, target) { return psdWriter_1.writeSignature(writer, target.nameSource); });
addHandler('lyid', hasKey('id'), function (reader, target) { return target.id = psdReader_1.readUint32(reader); }, function (writer, target, _psd, options) {
    var id = target.id;
    while (options.layerIds.indexOf(id) !== -1)
        id += 100; // make sure we don't have duplicate layer ids
    psdWriter_1.writeUint32(writer, id);
    options.layerIds.push(id);
});
// some kind of ID ? ignore
addHandler('lsdk', function (target) { return target._lsdk !== undefined; }, function (reader, target) {
    var id = psdReader_1.readInt32(reader);
    if (helpers_1.MOCK_HANDLERS)
        target._lsdk = id;
}, function (writer, target) {
    if (helpers_1.MOCK_HANDLERS)
        psdWriter_1.writeInt32(writer, target._lsdk);
});
addHandler('lsct', hasKey('sectionDivider'), function (reader, target, left) {
    target.sectionDivider = { type: psdReader_1.readUint32(reader) };
    if (left()) {
        psdReader_1.checkSignature(reader, '8BIM');
        target.sectionDivider.key = psdReader_1.readSignature(reader);
    }
    if (left()) {
        // 0 = normal
        // 1 = scene group, affects the animation timeline.
        target.sectionDivider.subType = psdReader_1.readUint32(reader);
    }
}, function (writer, target) {
    psdWriter_1.writeUint32(writer, target.sectionDivider.type);
    if (target.sectionDivider.key) {
        psdWriter_1.writeSignature(writer, '8BIM');
        psdWriter_1.writeSignature(writer, target.sectionDivider.key);
        if (target.sectionDivider.subType !== undefined) {
            psdWriter_1.writeUint32(writer, target.sectionDivider.subType);
        }
    }
});
addHandler('clbl', hasKey('blendClippendElements'), function (reader, target) {
    target.blendClippendElements = !!psdReader_1.readUint8(reader);
    psdReader_1.skipBytes(reader, 3);
}, function (writer, target) {
    psdWriter_1.writeUint8(writer, target.blendClippendElements ? 1 : 0);
    psdWriter_1.writeZeros(writer, 3);
});
addHandler('infx', hasKey('blendInteriorElements'), function (reader, target) {
    target.blendInteriorElements = !!psdReader_1.readUint8(reader);
    psdReader_1.skipBytes(reader, 3);
}, function (writer, target) {
    psdWriter_1.writeUint8(writer, target.blendInteriorElements ? 1 : 0);
    psdWriter_1.writeZeros(writer, 3);
});
addHandler('knko', hasKey('knockout'), function (reader, target) {
    target.knockout = !!psdReader_1.readUint8(reader);
    psdReader_1.skipBytes(reader, 3);
}, function (writer, target) {
    psdWriter_1.writeUint8(writer, target.knockout ? 1 : 0);
    psdWriter_1.writeZeros(writer, 3);
});
addHandler('lspf', hasKey('protected'), function (reader, target) {
    var flags = psdReader_1.readUint32(reader);
    target.protected = {
        transparency: (flags & 0x01) !== 0,
        composite: (flags & 0x02) !== 0,
        position: (flags & 0x04) !== 0,
    };
    if (flags & 0x08)
        target.protected.artboards = true;
}, function (writer, target) {
    var flags = (target.protected.transparency ? 0x01 : 0) |
        (target.protected.composite ? 0x02 : 0) |
        (target.protected.position ? 0x04 : 0) |
        (target.protected.artboards ? 0x08 : 0);
    psdWriter_1.writeUint32(writer, flags);
});
addHandler('lclr', hasKey('layerColor'), function (reader, target) {
    var color = psdReader_1.readUint16(reader);
    psdReader_1.skipBytes(reader, 6);
    target.layerColor = helpers_1.layerColors[color];
}, function (writer, target) {
    var index = helpers_1.layerColors.indexOf(target.layerColor);
    psdWriter_1.writeUint16(writer, index === -1 ? 0 : index);
    psdWriter_1.writeZeros(writer, 6);
});
addHandler('shmd', hasKey('timestamp'), function (reader, target, left, _, options) {
    var count = psdReader_1.readUint32(reader);
    var _loop_1 = function (i) {
        psdReader_1.checkSignature(reader, '8BIM');
        var key = psdReader_1.readSignature(reader);
        psdReader_1.readUint8(reader); // copy
        psdReader_1.skipBytes(reader, 3);
        psdReader_1.readSection(reader, 1, function (left) {
            if (key === 'cust') {
                var desc = descriptor_1.readVersionAndDescriptor(reader);
                if (desc.layerTime !== undefined)
                    target.timestamp = desc.layerTime;
            }
            else if (key === 'mlst') {
                var desc = descriptor_1.readVersionAndDescriptor(reader);
                options.logDevFeatures && console.log('mlst', desc);
                // options.logDevFeatures && console.log('mlst', require('util').inspect(desc, false, 99, true));
            }
            else if (key === 'mdyn') {
                // frame flags
                var unknown = psdReader_1.readUint16(reader);
                var propagate = psdReader_1.readUint8(reader);
                var flags = psdReader_1.readUint8(reader);
                var unifyLayerPosition = (flags & 1) !== 0;
                var unifyLayerStyle = (flags & 2) !== 0;
                var unifyLayerVisibility = (flags & 4) !== 0;
                options.logDevFeatures && console.log('mdyn', 'unknown:', unknown, 'propagate:', propagate, 'flags:', flags, { unifyLayerPosition: unifyLayerPosition, unifyLayerStyle: unifyLayerStyle, unifyLayerVisibility: unifyLayerVisibility });
                // const desc = readVersionAndDescriptor(reader) as FrameListDescriptor;
                // console.log('mdyn', require('util').inspect(desc, false, 99, true));
            }
            else {
                options.logDevFeatures && console.log('Unhandled metadata', key);
            }
            psdReader_1.skipBytes(reader, left());
        });
    };
    for (var i = 0; i < count; i++) {
        _loop_1(i);
    }
    psdReader_1.skipBytes(reader, left());
}, function (writer, target) {
    var desc = {
        layerTime: target.timestamp,
    };
    psdWriter_1.writeUint32(writer, 1); // count
    psdWriter_1.writeSignature(writer, '8BIM');
    psdWriter_1.writeSignature(writer, 'cust');
    psdWriter_1.writeUint8(writer, 0); // copy (always false)
    psdWriter_1.writeZeros(writer, 3);
    psdWriter_1.writeSection(writer, 2, function () { return descriptor_1.writeVersionAndDescriptor(writer, '', 'metadata', desc); }, true);
});
addHandler('vstk', hasKey('vectorStroke'), function (reader, target, left) {
    var desc = descriptor_1.readVersionAndDescriptor(reader);
    // console.log(require('util').inspect(desc, false, 99, true));
    target.vectorStroke = {
        strokeEnabled: desc.strokeEnabled,
        fillEnabled: desc.fillEnabled,
        lineWidth: descriptor_1.parseUnits(desc.strokeStyleLineWidth),
        lineDashOffset: descriptor_1.parseUnits(desc.strokeStyleLineDashOffset),
        miterLimit: desc.strokeStyleMiterLimit,
        lineCapType: descriptor_1.strokeStyleLineCapType.decode(desc.strokeStyleLineCapType),
        lineJoinType: descriptor_1.strokeStyleLineJoinType.decode(desc.strokeStyleLineJoinType),
        lineAlignment: descriptor_1.strokeStyleLineAlignment.decode(desc.strokeStyleLineAlignment),
        scaleLock: desc.strokeStyleScaleLock,
        strokeAdjust: desc.strokeStyleStrokeAdjust,
        lineDashSet: desc.strokeStyleLineDashSet.map(descriptor_1.parseUnits),
        blendMode: descriptor_1.BlnM.decode(desc.strokeStyleBlendMode),
        opacity: descriptor_1.parsePercent(desc.strokeStyleOpacity),
        content: parseVectorContent(desc.strokeStyleContent),
        resolution: desc.strokeStyleResolution,
    };
    psdReader_1.skipBytes(reader, left());
}, function (writer, target) {
    var _a, _b, _c;
    var stroke = target.vectorStroke;
    var descriptor = {
        strokeStyleVersion: 2,
        strokeEnabled: !!stroke.strokeEnabled,
        fillEnabled: !!stroke.fillEnabled,
        strokeStyleLineWidth: stroke.lineWidth || { value: 3, units: 'Points' },
        strokeStyleLineDashOffset: stroke.lineDashOffset || { value: 0, units: 'Points' },
        strokeStyleMiterLimit: (_a = stroke.miterLimit) !== null && _a !== void 0 ? _a : 100,
        strokeStyleLineCapType: descriptor_1.strokeStyleLineCapType.encode(stroke.lineCapType),
        strokeStyleLineJoinType: descriptor_1.strokeStyleLineJoinType.encode(stroke.lineJoinType),
        strokeStyleLineAlignment: descriptor_1.strokeStyleLineAlignment.encode(stroke.lineAlignment),
        strokeStyleScaleLock: !!stroke.scaleLock,
        strokeStyleStrokeAdjust: !!stroke.strokeAdjust,
        strokeStyleLineDashSet: stroke.lineDashSet || [],
        strokeStyleBlendMode: descriptor_1.BlnM.encode(stroke.blendMode),
        strokeStyleOpacity: descriptor_1.unitsPercent((_b = stroke.opacity) !== null && _b !== void 0 ? _b : 1),
        strokeStyleContent: serializeVectorContent(stroke.content || { type: 'color', color: { r: 0, g: 0, b: 0 } }).descriptor,
        strokeStyleResolution: (_c = stroke.resolution) !== null && _c !== void 0 ? _c : 72,
    };
    descriptor_1.writeVersionAndDescriptor(writer, '', 'strokeStyle', descriptor);
});
addHandler('artb', // per-layer arboard info
hasKey('artboard'), function (reader, target, left) {
    var desc = descriptor_1.readVersionAndDescriptor(reader);
    target.artboard = {
        rect: { top: desc.artboardRect['Top '], left: desc.artboardRect.Left, bottom: desc.artboardRect.Btom, right: desc.artboardRect.Rght },
        guideIndices: desc.guideIndeces,
        presetName: desc.artboardPresetName,
        color: parseColor(desc['Clr ']),
        backgroundType: desc.artboardBackgroundType,
    };
    psdReader_1.skipBytes(reader, left());
}, function (writer, target) {
    var _a;
    var artb = target.artboard;
    var desc = {
        artboardRect: { 'Top ': artb.rect.top, Left: artb.rect.left, Btom: artb.rect.bottom, Rght: artb.rect.right },
        guideIndeces: artb.guideIndices || [],
        artboardPresetName: artb.presetName || '',
        'Clr ': serializeColor(artb.color),
        artboardBackgroundType: (_a = artb.backgroundType) !== null && _a !== void 0 ? _a : 1,
    };
    descriptor_1.writeVersionAndDescriptor(writer, '', 'artboard', desc);
});
addHandler('sn2P', hasKey('usingAlignedRendering'), function (reader, target) { return target.usingAlignedRendering = !!psdReader_1.readUint32(reader); }, function (writer, target) { return psdWriter_1.writeUint32(writer, target.usingAlignedRendering ? 1 : 0); });
var placedLayerTypes = ['unknown', 'vector', 'raster', 'image stack'];
function parseWarp(warp) {
    var _a, _b, _c, _d, _e, _f;
    var result = {
        style: descriptor_1.warpStyle.decode(warp.warpStyle),
        value: warp.warpValue || 0,
        perspective: warp.warpPerspective || 0,
        perspectiveOther: warp.warpPerspectiveOther || 0,
        rotate: descriptor_1.Ornt.decode(warp.warpRotate),
        bounds: warp.bounds && {
            top: descriptor_1.parseUnitsOrNumber(warp.bounds['Top ']),
            left: descriptor_1.parseUnitsOrNumber(warp.bounds.Left),
            bottom: descriptor_1.parseUnitsOrNumber(warp.bounds.Btom),
            right: descriptor_1.parseUnitsOrNumber(warp.bounds.Rght),
        },
        uOrder: warp.uOrder,
        vOrder: warp.vOrder,
    };
    if (warp.deformNumRows != null || warp.deformNumCols != null) {
        result.deformNumRows = warp.deformNumRows;
        result.deformNumCols = warp.deformNumCols;
    }
    if (warp.customEnvelopeWarp) {
        result.customEnvelopeWarp = {
            meshPoints: [],
        };
        var xs = ((_a = warp.customEnvelopeWarp.meshPoints.find(function (i) { return i.type === 'Hrzn'; })) === null || _a === void 0 ? void 0 : _a.values) || [];
        var ys = ((_b = warp.customEnvelopeWarp.meshPoints.find(function (i) { return i.type === 'Vrtc'; })) === null || _b === void 0 ? void 0 : _b.values) || [];
        for (var i = 0; i < xs.length; i++) {
            result.customEnvelopeWarp.meshPoints.push({ x: xs[i], y: ys[i] });
        }
        if (warp.customEnvelopeWarp.quiltSliceX || warp.customEnvelopeWarp.quiltSliceY) {
            result.customEnvelopeWarp.quiltSliceX = ((_d = (_c = warp.customEnvelopeWarp.quiltSliceX) === null || _c === void 0 ? void 0 : _c[0]) === null || _d === void 0 ? void 0 : _d.values) || [];
            result.customEnvelopeWarp.quiltSliceY = ((_f = (_e = warp.customEnvelopeWarp.quiltSliceY) === null || _e === void 0 ? void 0 : _e[0]) === null || _f === void 0 ? void 0 : _f.values) || [];
        }
    }
    return result;
}
function isQuiltWarp(warp) {
    var _a, _b;
    return warp.deformNumCols != null || warp.deformNumRows != null ||
        ((_a = warp.customEnvelopeWarp) === null || _a === void 0 ? void 0 : _a.quiltSliceX) || ((_b = warp.customEnvelopeWarp) === null || _b === void 0 ? void 0 : _b.quiltSliceY);
}
function encodeWarp(warp) {
    var _a, _b, _c, _d;
    var desc = {
        warpStyle: descriptor_1.warpStyle.encode(warp.style),
        warpValue: warp.value || 0,
        warpPerspective: warp.perspective || 0,
        warpPerspectiveOther: warp.perspectiveOther || 0,
        warpRotate: descriptor_1.Ornt.encode(warp.rotate),
        bounds: {
            'Top ': descriptor_1.unitsValue(((_a = warp.bounds) === null || _a === void 0 ? void 0 : _a.top) || { units: 'Pixels', value: 0 }, 'bounds.top'),
            Left: descriptor_1.unitsValue(((_b = warp.bounds) === null || _b === void 0 ? void 0 : _b.left) || { units: 'Pixels', value: 0 }, 'bounds.left'),
            Btom: descriptor_1.unitsValue(((_c = warp.bounds) === null || _c === void 0 ? void 0 : _c.bottom) || { units: 'Pixels', value: 0 }, 'bounds.bottom'),
            Rght: descriptor_1.unitsValue(((_d = warp.bounds) === null || _d === void 0 ? void 0 : _d.right) || { units: 'Pixels', value: 0 }, 'bounds.right'),
        },
        uOrder: warp.uOrder || 0,
        vOrder: warp.vOrder || 0,
    };
    var isQuilt = isQuiltWarp(warp);
    if (isQuilt) {
        var desc2 = desc;
        desc2.deformNumRows = warp.deformNumRows || 0;
        desc2.deformNumCols = warp.deformNumCols || 0;
    }
    if (warp.customEnvelopeWarp) {
        var meshPoints = warp.customEnvelopeWarp.meshPoints || [];
        if (isQuilt) {
            var desc2 = desc;
            desc2.customEnvelopeWarp = {
                quiltSliceX: [{
                        type: 'quiltSliceX',
                        values: warp.customEnvelopeWarp.quiltSliceX || [],
                    }],
                quiltSliceY: [{
                        type: 'quiltSliceY',
                        values: warp.customEnvelopeWarp.quiltSliceY || [],
                    }],
                meshPoints: [
                    { type: 'Hrzn', values: meshPoints.map(function (p) { return p.x; }) },
                    { type: 'Vrtc', values: meshPoints.map(function (p) { return p.y; }) },
                ],
            };
        }
        else {
            desc.customEnvelopeWarp = {
                meshPoints: [
                    { type: 'Hrzn', values: meshPoints.map(function (p) { return p.x; }) },
                    { type: 'Vrtc', values: meshPoints.map(function (p) { return p.y; }) },
                ],
            };
        }
    }
    return desc;
}
addHandler('PlLd', hasKey('placedLayer'), function (reader, target, left) {
    if (psdReader_1.readSignature(reader) !== 'plcL')
        throw new Error("Invalid PlLd signature");
    if (psdReader_1.readInt32(reader) !== 3)
        throw new Error("Invalid PlLd version");
    var id = psdReader_1.readPascalString(reader, 1);
    psdReader_1.readInt32(reader); // pageNumber
    psdReader_1.readInt32(reader); // totalPages, TODO: check how this works ?
    psdReader_1.readInt32(reader); // anitAliasPolicy 16
    var placedLayerType = psdReader_1.readInt32(reader); // 0 = unknown, 1 = vector, 2 = raster, 3 = image stack
    if (!placedLayerTypes[placedLayerType])
        throw new Error('Invalid PlLd type');
    var transform = [];
    for (var i = 0; i < 8; i++)
        transform.push(psdReader_1.readFloat64(reader)); // x, y of 4 corners of the transform
    var warpVersion = psdReader_1.readInt32(reader);
    if (warpVersion !== 0)
        throw new Error("Invalid Warp version " + warpVersion);
    var warp = descriptor_1.readVersionAndDescriptor(reader);
    target.placedLayer = target.placedLayer || {
        id: id,
        type: placedLayerTypes[placedLayerType],
        // pageNumber,
        // totalPages,
        transform: transform,
        warp: parseWarp(warp),
    };
    // console.log('PlLd warp', require('util').inspect(warp, false, 99, true));
    // console.log('PlLd', require('util').inspect(target.placedLayer, false, 99, true));
    psdReader_1.skipBytes(reader, left());
}, function (writer, target) {
    var placed = target.placedLayer;
    psdWriter_1.writeSignature(writer, 'plcL');
    psdWriter_1.writeInt32(writer, 3); // version
    psdWriter_1.writePascalString(writer, placed.id, 1);
    psdWriter_1.writeInt32(writer, 1); // pageNumber
    psdWriter_1.writeInt32(writer, 1); // totalPages
    psdWriter_1.writeInt32(writer, 16); // anitAliasPolicy
    if (placedLayerTypes.indexOf(placed.type) === -1)
        throw new Error('Invalid placedLayer type');
    psdWriter_1.writeInt32(writer, placedLayerTypes.indexOf(placed.type));
    for (var i = 0; i < 8; i++)
        psdWriter_1.writeFloat64(writer, placed.transform[i]);
    psdWriter_1.writeInt32(writer, 0); // warp version
    var isQuilt = placed.warp && isQuiltWarp(placed.warp);
    var type = isQuilt ? 'quiltWarp' : 'warp';
    descriptor_1.writeVersionAndDescriptor(writer, '', type, encodeWarp(placed.warp || {}), type);
});
addHandler('SoLd', hasKey('placedLayer'), function (reader, target, left) {
    if (psdReader_1.readSignature(reader) !== 'soLD')
        throw new Error("Invalid SoLd type");
    if (psdReader_1.readInt32(reader) !== 4)
        throw new Error("Invalid SoLd version");
    var desc = descriptor_1.readVersionAndDescriptor(reader);
    // console.log('SoLd', require('util').inspect(desc, false, 99, true));
    // console.log('SoLd.warp', require('util').inspect(desc.warp, false, 99, true));
    // console.log('SoLd.quiltWarp', require('util').inspect(desc.quiltWarp, false, 99, true));
    target.placedLayer = {
        id: desc.Idnt,
        placed: desc.placed,
        type: placedLayerTypes[desc.Type],
        // pageNumber: info.PgNm,
        // totalPages: info.totalPages,
        // frameStep: info.frameStep,
        // duration: info.duration,
        // frameCount: info.frameCount,
        transform: desc.Trnf,
        width: desc['Sz  '].Wdth,
        height: desc['Sz  '].Hght,
        resolution: descriptor_1.parseUnits(desc.Rslt),
        warp: parseWarp((desc.quiltWarp || desc.warp)),
    };
    if (desc.Crop)
        target.placedLayer.crop = desc.Crop;
    if (desc.comp)
        target.placedLayer.comp = desc.comp;
    if (desc.compInfo)
        target.placedLayer.compInfo = desc.compInfo;
    psdReader_1.skipBytes(reader, left()); // HACK
}, function (writer, target) {
    var _a;
    psdWriter_1.writeSignature(writer, 'soLD');
    psdWriter_1.writeInt32(writer, 4); // version
    var placed = target.placedLayer;
    var desc = __assign(__assign({ Idnt: placed.id, placed: (_a = placed.placed) !== null && _a !== void 0 ? _a : placed.id, PgNm: 1, totalPages: 1 }, (placed.crop ? { Crop: placed.crop } : {})), { frameStep: {
            numerator: 0,
            denominator: 600
        }, duration: {
            numerator: 0,
            denominator: 600
        }, frameCount: 1, Annt: 16, Type: placedLayerTypes.indexOf(placed.type), Trnf: placed.transform, nonAffineTransform: placed.transform, quiltWarp: {}, warp: encodeWarp(placed.warp || {}), 'Sz  ': {
            Wdth: placed.width || 0,
            Hght: placed.height || 0, // TODO: find size ?
        }, Rslt: placed.resolution ? descriptor_1.unitsValue(placed.resolution, 'resolution') : { units: 'Density', value: 72 } });
    if (placed.warp && isQuiltWarp(placed.warp)) {
        var quiltWarp = encodeWarp(placed.warp);
        desc.quiltWarp = quiltWarp;
        desc.warp = {
            warpStyle: 'warpStyle.warpNone',
            warpValue: quiltWarp.warpValue,
            warpPerspective: quiltWarp.warpPerspective,
            warpPerspectiveOther: quiltWarp.warpPerspectiveOther,
            warpRotate: quiltWarp.warpRotate,
            bounds: quiltWarp.bounds,
            uOrder: quiltWarp.uOrder,
            vOrder: quiltWarp.vOrder,
        };
    }
    else {
        delete desc.quiltWarp;
    }
    if (placed.comp)
        desc.comp = placed.comp;
    if (placed.compInfo)
        desc.compInfo = placed.compInfo;
    descriptor_1.writeVersionAndDescriptor(writer, '', 'null', desc, desc.quiltWarp ? 'quiltWarp' : 'warp');
});
addHandler('fxrp', hasKey('referencePoint'), function (reader, target) {
    target.referencePoint = {
        x: psdReader_1.readFloat64(reader),
        y: psdReader_1.readFloat64(reader),
    };
}, function (writer, target) {
    psdWriter_1.writeFloat64(writer, target.referencePoint.x);
    psdWriter_1.writeFloat64(writer, target.referencePoint.y);
});
if (helpers_1.MOCK_HANDLERS) {
    addHandler('Patt', function (target) { return target._Patt !== undefined; }, function (reader, target, left) {
        // console.log('additional info: Patt');
        target._Patt = psdReader_1.readBytes(reader, left());
    }, function (writer, target) { return false && psdWriter_1.writeBytes(writer, target._Patt); });
}
else {
    addHandler('Patt', // TODO: handle also Pat2 & Pat3
    function (// TODO: handle also Pat2 & Pat3
    target) { return !target; }, function (reader, target, left) {
        if (!left())
            return;
        psdReader_1.skipBytes(reader, left());
        return; // not supported yet
        target;
        psdReader_1.readPattern;
        // if (!target.patterns) target.patterns = [];
        // target.patterns.push(readPattern(reader));
        // skipBytes(reader, left());
    }, function (_writer, _target) {
    });
}
function readRect(reader) {
    var top = psdReader_1.readInt32(reader);
    var left = psdReader_1.readInt32(reader);
    var bottom = psdReader_1.readInt32(reader);
    var right = psdReader_1.readInt32(reader);
    return { top: top, left: left, bottom: bottom, right: right };
}
function writeRect(writer, rect) {
    psdWriter_1.writeInt32(writer, rect.top);
    psdWriter_1.writeInt32(writer, rect.left);
    psdWriter_1.writeInt32(writer, rect.bottom);
    psdWriter_1.writeInt32(writer, rect.right);
}
addHandler('Anno', function (target) { return target.annotations !== undefined; }, function (reader, target, left) {
    var major = psdReader_1.readUint16(reader);
    var minor = psdReader_1.readUint16(reader);
    if (major !== 2 || minor !== 1)
        throw new Error('Invalid Anno version');
    var count = psdReader_1.readUint32(reader);
    var annotations = [];
    for (var i = 0; i < count; i++) {
        /*const length =*/ psdReader_1.readUint32(reader);
        var type = psdReader_1.readSignature(reader);
        var open_1 = !!psdReader_1.readUint8(reader);
        /*const flags =*/ psdReader_1.readUint8(reader); // always 28
        /*const optionalBlocks =*/ psdReader_1.readUint16(reader);
        var iconLocation = readRect(reader);
        var popupLocation = readRect(reader);
        var color = psdReader_1.readColor(reader);
        var author = psdReader_1.readPascalString(reader, 2);
        var name_1 = psdReader_1.readPascalString(reader, 2);
        var date = psdReader_1.readPascalString(reader, 2);
        /*const contentLength =*/ psdReader_1.readUint32(reader);
        /*const dataType =*/ psdReader_1.readSignature(reader);
        var dataLength = psdReader_1.readUint32(reader);
        var data = void 0;
        if (type === 'txtA') {
            if (dataLength >= 2 && psdReader_1.readUint16(reader) === 0xfeff) {
                data = psdReader_1.readUnicodeStringWithLength(reader, (dataLength - 2) / 2);
            }
            else {
                reader.offset -= 2;
                data = psdReader_1.readAsciiString(reader, dataLength);
            }
            data = data.replace(/\r/g, '\n');
        }
        else if (type === 'sndA') {
            data = psdReader_1.readBytes(reader, dataLength);
        }
        else {
            throw new Error('Unknown annotation type');
        }
        annotations.push({
            type: type === 'txtA' ? 'text' : 'sound',
            open: open_1, iconLocation: iconLocation, popupLocation: popupLocation, color: color, author: author, name: name_1, date: date, data: data,
        });
    }
    target.annotations = annotations;
    psdReader_1.skipBytes(reader, left());
}, function (writer, target) {
    var annotations = target.annotations;
    psdWriter_1.writeUint16(writer, 2);
    psdWriter_1.writeUint16(writer, 1);
    psdWriter_1.writeUint32(writer, annotations.length);
    for (var _i = 0, annotations_1 = annotations; _i < annotations_1.length; _i++) {
        var annotation = annotations_1[_i];
        var sound = annotation.type === 'sound';
        if (sound && !(annotation.data instanceof Uint8Array))
            throw new Error('Sound annotation data should be Uint8Array');
        if (!sound && typeof annotation.data !== 'string')
            throw new Error('Text annotation data should be string');
        var lengthOffset = writer.offset;
        psdWriter_1.writeUint32(writer, 0); // length
        psdWriter_1.writeSignature(writer, sound ? 'sndA' : 'txtA');
        psdWriter_1.writeUint8(writer, annotation.open ? 1 : 0);
        psdWriter_1.writeUint8(writer, 28);
        psdWriter_1.writeUint16(writer, 1);
        writeRect(writer, annotation.iconLocation);
        writeRect(writer, annotation.popupLocation);
        psdWriter_1.writeColor(writer, annotation.color);
        psdWriter_1.writePascalString(writer, annotation.author || '', 2);
        psdWriter_1.writePascalString(writer, annotation.name || '', 2);
        psdWriter_1.writePascalString(writer, annotation.date || '', 2);
        var contentOffset = writer.offset;
        psdWriter_1.writeUint32(writer, 0); // content length
        psdWriter_1.writeSignature(writer, sound ? 'sndM' : 'txtC');
        psdWriter_1.writeUint32(writer, 0); // data length
        var dataOffset = writer.offset;
        if (sound) {
            psdWriter_1.writeBytes(writer, annotation.data);
        }
        else {
            psdWriter_1.writeUint16(writer, 0xfeff); // unicode string indicator
            var text = annotation.data.replace(/\n/g, '\r');
            for (var i = 0; i < text.length; i++)
                psdWriter_1.writeUint16(writer, text.charCodeAt(i));
        }
        writer.view.setUint32(lengthOffset, writer.offset - lengthOffset, false);
        writer.view.setUint32(contentOffset, writer.offset - contentOffset, false);
        writer.view.setUint32(dataOffset - 4, writer.offset - dataOffset, false);
    }
});
addHandler('lnk2', function (target) { return !!target.linkedFiles && target.linkedFiles.length > 0; }, function (reader, target, left, _, options) {
    var psd = target;
    psd.linkedFiles = [];
    while (left() > 8) {
        var size = readLength64(reader); // size
        var startOffset = reader.offset;
        var type = psdReader_1.readSignature(reader);
        var version = psdReader_1.readInt32(reader);
        var id = psdReader_1.readPascalString(reader, 1);
        var name_2 = psdReader_1.readUnicodeString(reader);
        var fileType = psdReader_1.readSignature(reader).trim(); // '    ' if empty
        var fileCreator = psdReader_1.readSignature(reader).trim(); // '    ' or '\0\0\0\0' if empty
        var dataSize = readLength64(reader);
        var hasFileOpenDescriptor = psdReader_1.readUint8(reader);
        var fileOpenDescriptor = hasFileOpenDescriptor ? descriptor_1.readVersionAndDescriptor(reader) : undefined;
        var linkedFileDescriptor = type === 'liFE' ? descriptor_1.readVersionAndDescriptor(reader) : undefined;
        var file = { id: id, name: name_2, data: undefined };
        if (fileType)
            file.type = fileType;
        if (fileCreator)
            file.creator = fileCreator;
        if (fileOpenDescriptor)
            file.descriptor = fileOpenDescriptor;
        if (type === 'liFE' && version > 3) {
            var year = psdReader_1.readInt32(reader);
            var month = psdReader_1.readUint8(reader);
            var day = psdReader_1.readUint8(reader);
            var hour = psdReader_1.readUint8(reader);
            var minute = psdReader_1.readUint8(reader);
            var seconds = psdReader_1.readFloat64(reader);
            var wholeSeconds = Math.floor(seconds);
            var ms = (seconds - wholeSeconds) * 1000;
            file.time = new Date(year, month, day, hour, minute, wholeSeconds, ms);
        }
        var fileSize = type === 'liFE' ? readLength64(reader) : 0;
        if (type === 'liFA')
            psdReader_1.skipBytes(reader, 8);
        if (type === 'liFD')
            file.data = psdReader_1.readBytes(reader, dataSize);
        if (version >= 5)
            file.childDocumentID = psdReader_1.readUnicodeString(reader);
        if (version >= 6)
            file.assetModTime = psdReader_1.readFloat64(reader);
        if (version >= 7)
            file.assetLockedState = psdReader_1.readUint8(reader);
        if (type === 'liFE')
            file.data = psdReader_1.readBytes(reader, fileSize);
        if (options.skipLinkedFilesData)
            file.data = undefined;
        psd.linkedFiles.push(file);
        linkedFileDescriptor;
        while (size % 4)
            size++;
        reader.offset = startOffset + size;
    }
    psdReader_1.skipBytes(reader, left()); // ?
}, function (writer, target) {
    var psd = target;
    for (var _i = 0, _a = psd.linkedFiles; _i < _a.length; _i++) {
        var file = _a[_i];
        var version = 2;
        if (file.assetLockedState != null)
            version = 7;
        else if (file.assetModTime != null)
            version = 6;
        else if (file.childDocumentID != null)
            version = 5;
        // TODO: else if (file.time != null) version = 3; (only for liFE)
        psdWriter_1.writeUint32(writer, 0);
        psdWriter_1.writeUint32(writer, 0); // size
        var sizeOffset = writer.offset;
        psdWriter_1.writeSignature(writer, file.data ? 'liFD' : 'liFA');
        psdWriter_1.writeInt32(writer, version);
        psdWriter_1.writePascalString(writer, file.id || '', 1);
        psdWriter_1.writeUnicodeStringWithPadding(writer, file.name || '');
        psdWriter_1.writeSignature(writer, file.type ? (file.type + "    ").substr(0, 4) : '    ');
        psdWriter_1.writeSignature(writer, file.creator ? (file.creator + "    ").substr(0, 4) : '\0\0\0\0');
        writeLength64(writer, file.data ? file.data.byteLength : 0);
        if (file.descriptor && file.descriptor.compInfo) {
            var desc = {
                compInfo: file.descriptor.compInfo,
            };
            psdWriter_1.writeUint8(writer, 1);
            descriptor_1.writeVersionAndDescriptor(writer, '', 'null', desc);
        }
        else {
            psdWriter_1.writeUint8(writer, 0);
        }
        if (file.data)
            psdWriter_1.writeBytes(writer, file.data);
        else
            writeLength64(writer, 0);
        if (version >= 5)
            psdWriter_1.writeUnicodeStringWithPadding(writer, file.childDocumentID || '');
        if (version >= 6)
            psdWriter_1.writeFloat64(writer, file.assetModTime || 0);
        if (version >= 7)
            psdWriter_1.writeUint8(writer, file.assetLockedState || 0);
        var size = writer.offset - sizeOffset;
        writer.view.setUint32(sizeOffset - 4, size, false); // write size
        while (size % 4) {
            size++;
            psdWriter_1.writeUint8(writer, 0);
        }
    }
});
addHandlerAlias('lnkD', 'lnk2');
addHandlerAlias('lnk3', 'lnk2');
// this seems to just be zero size block, ignore it
addHandler('lnkE', function (target) { return target._lnkE !== undefined; }, function (reader, target, left, _psds, options) {
    if (options.logMissingFeatures && left()) {
        console.log("Non-empty lnkE layer info (" + left() + " bytes)");
    }
    if (helpers_1.MOCK_HANDLERS) {
        target._lnkE = psdReader_1.readBytes(reader, left());
    }
}, function (writer, target) { return helpers_1.MOCK_HANDLERS && psdWriter_1.writeBytes(writer, target._lnkE); });
addHandler('pths', hasKey('pathList'), function (reader, target) {
    var descriptor = descriptor_1.readVersionAndDescriptor(reader);
    target.pathList = []; // TODO: read paths (find example with non-empty list)
    descriptor;
    // console.log('pths', descriptor); // TODO: remove this
}, function (writer, _target) {
    var descriptor = {
        pathList: [], // TODO: write paths
    };
    descriptor_1.writeVersionAndDescriptor(writer, '', 'pathsDataClass', descriptor);
});
addHandler('lyvr', hasKey('version'), function (reader, target) { return target.version = psdReader_1.readUint32(reader); }, function (writer, target) { return psdWriter_1.writeUint32(writer, target.version); });
function adjustmentType(type) {
    return function (target) { return !!target.adjustment && target.adjustment.type === type; };
}
addHandler('brit', adjustmentType('brightness/contrast'), function (reader, target, left) {
    if (!target.adjustment) { // ignore if got one from CgEd block
        target.adjustment = {
            type: 'brightness/contrast',
            brightness: psdReader_1.readInt16(reader),
            contrast: psdReader_1.readInt16(reader),
            meanValue: psdReader_1.readInt16(reader),
            labColorOnly: !!psdReader_1.readUint8(reader),
            useLegacy: true,
        };
    }
    psdReader_1.skipBytes(reader, left());
}, function (writer, target) {
    var _a;
    var info = target.adjustment;
    psdWriter_1.writeInt16(writer, info.brightness || 0);
    psdWriter_1.writeInt16(writer, info.contrast || 0);
    psdWriter_1.writeInt16(writer, (_a = info.meanValue) !== null && _a !== void 0 ? _a : 127);
    psdWriter_1.writeUint8(writer, info.labColorOnly ? 1 : 0);
    psdWriter_1.writeZeros(writer, 1);
});
function readLevelsChannel(reader) {
    var shadowInput = psdReader_1.readInt16(reader);
    var highlightInput = psdReader_1.readInt16(reader);
    var shadowOutput = psdReader_1.readInt16(reader);
    var highlightOutput = psdReader_1.readInt16(reader);
    var midtoneInput = psdReader_1.readInt16(reader) / 100;
    return { shadowInput: shadowInput, highlightInput: highlightInput, shadowOutput: shadowOutput, highlightOutput: highlightOutput, midtoneInput: midtoneInput };
}
function writeLevelsChannel(writer, channel) {
    psdWriter_1.writeInt16(writer, channel.shadowInput);
    psdWriter_1.writeInt16(writer, channel.highlightInput);
    psdWriter_1.writeInt16(writer, channel.shadowOutput);
    psdWriter_1.writeInt16(writer, channel.highlightOutput);
    psdWriter_1.writeInt16(writer, Math.round(channel.midtoneInput * 100));
}
addHandler('levl', adjustmentType('levels'), function (reader, target, left) {
    if (psdReader_1.readUint16(reader) !== 2)
        throw new Error('Invalid levl version');
    target.adjustment = __assign(__assign({}, target.adjustment), { type: 'levels', rgb: readLevelsChannel(reader), red: readLevelsChannel(reader), green: readLevelsChannel(reader), blue: readLevelsChannel(reader) });
    psdReader_1.skipBytes(reader, left());
}, function (writer, target) {
    var info = target.adjustment;
    var defaultChannel = {
        shadowInput: 0,
        highlightInput: 255,
        shadowOutput: 0,
        highlightOutput: 255,
        midtoneInput: 1,
    };
    psdWriter_1.writeUint16(writer, 2); // version
    writeLevelsChannel(writer, info.rgb || defaultChannel);
    writeLevelsChannel(writer, info.red || defaultChannel);
    writeLevelsChannel(writer, info.blue || defaultChannel);
    writeLevelsChannel(writer, info.green || defaultChannel);
    for (var i = 0; i < 59; i++)
        writeLevelsChannel(writer, defaultChannel);
});
function readCurveChannel(reader) {
    var nodes = psdReader_1.readUint16(reader);
    var channel = [];
    for (var j = 0; j < nodes; j++) {
        var output = psdReader_1.readInt16(reader);
        var input = psdReader_1.readInt16(reader);
        channel.push({ input: input, output: output });
    }
    return channel;
}
function writeCurveChannel(writer, channel) {
    psdWriter_1.writeUint16(writer, channel.length);
    for (var _i = 0, channel_1 = channel; _i < channel_1.length; _i++) {
        var n = channel_1[_i];
        psdWriter_1.writeUint16(writer, n.output);
        psdWriter_1.writeUint16(writer, n.input);
    }
}
addHandler('curv', adjustmentType('curves'), function (reader, target, left) {
    psdReader_1.readUint8(reader);
    if (psdReader_1.readUint16(reader) !== 1)
        throw new Error('Invalid curv version');
    psdReader_1.readUint16(reader);
    var channels = psdReader_1.readUint16(reader);
    var info = { type: 'curves' };
    if (channels & 1)
        info.rgb = readCurveChannel(reader);
    if (channels & 2)
        info.red = readCurveChannel(reader);
    if (channels & 4)
        info.green = readCurveChannel(reader);
    if (channels & 8)
        info.blue = readCurveChannel(reader);
    target.adjustment = __assign(__assign({}, target.adjustment), info);
    // ignoring, duplicate information
    // checkSignature(reader, 'Crv ');
    // const cVersion = readUint16(reader);
    // readUint16(reader);
    // const channelCount = readUint16(reader);
    // for (let i = 0; i < channelCount; i++) {
    // 	const index = readUint16(reader);
    // 	const nodes = readUint16(reader);
    // 	for (let j = 0; j < nodes; j++) {
    // 		const output = readInt16(reader);
    // 		const input = readInt16(reader);
    // 	}
    // }
    psdReader_1.skipBytes(reader, left());
}, function (writer, target) {
    var info = target.adjustment;
    var rgb = info.rgb, red = info.red, green = info.green, blue = info.blue;
    var channels = 0;
    var channelCount = 0;
    if (rgb && rgb.length) {
        channels |= 1;
        channelCount++;
    }
    if (red && red.length) {
        channels |= 2;
        channelCount++;
    }
    if (green && green.length) {
        channels |= 4;
        channelCount++;
    }
    if (blue && blue.length) {
        channels |= 8;
        channelCount++;
    }
    psdWriter_1.writeUint8(writer, 0);
    psdWriter_1.writeUint16(writer, 1); // version
    psdWriter_1.writeUint16(writer, 0);
    psdWriter_1.writeUint16(writer, channels);
    if (rgb && rgb.length)
        writeCurveChannel(writer, rgb);
    if (red && red.length)
        writeCurveChannel(writer, red);
    if (green && green.length)
        writeCurveChannel(writer, green);
    if (blue && blue.length)
        writeCurveChannel(writer, blue);
    psdWriter_1.writeSignature(writer, 'Crv ');
    psdWriter_1.writeUint16(writer, 4); // version
    psdWriter_1.writeUint16(writer, 0);
    psdWriter_1.writeUint16(writer, channelCount);
    if (rgb && rgb.length) {
        psdWriter_1.writeUint16(writer, 0);
        writeCurveChannel(writer, rgb);
    }
    if (red && red.length) {
        psdWriter_1.writeUint16(writer, 1);
        writeCurveChannel(writer, red);
    }
    if (green && green.length) {
        psdWriter_1.writeUint16(writer, 2);
        writeCurveChannel(writer, green);
    }
    if (blue && blue.length) {
        psdWriter_1.writeUint16(writer, 3);
        writeCurveChannel(writer, blue);
    }
    psdWriter_1.writeZeros(writer, 2);
});
addHandler('expA', adjustmentType('exposure'), function (reader, target, left) {
    if (psdReader_1.readUint16(reader) !== 1)
        throw new Error('Invalid expA version');
    target.adjustment = __assign(__assign({}, target.adjustment), { type: 'exposure', exposure: psdReader_1.readFloat32(reader), offset: psdReader_1.readFloat32(reader), gamma: psdReader_1.readFloat32(reader) });
    psdReader_1.skipBytes(reader, left());
}, function (writer, target) {
    var info = target.adjustment;
    psdWriter_1.writeUint16(writer, 1); // version
    psdWriter_1.writeFloat32(writer, info.exposure);
    psdWriter_1.writeFloat32(writer, info.offset);
    psdWriter_1.writeFloat32(writer, info.gamma);
    psdWriter_1.writeZeros(writer, 2);
});
addHandler('vibA', adjustmentType('vibrance'), function (reader, target, left) {
    var desc = descriptor_1.readVersionAndDescriptor(reader);
    target.adjustment = { type: 'vibrance' };
    if (desc.vibrance !== undefined)
        target.adjustment.vibrance = desc.vibrance;
    if (desc.Strt !== undefined)
        target.adjustment.saturation = desc.Strt;
    psdReader_1.skipBytes(reader, left());
}, function (writer, target) {
    var info = target.adjustment;
    var desc = {};
    if (info.vibrance !== undefined)
        desc.vibrance = info.vibrance;
    if (info.saturation !== undefined)
        desc.Strt = info.saturation;
    descriptor_1.writeVersionAndDescriptor(writer, '', 'null', desc);
});
function readHueChannel(reader) {
    return {
        a: psdReader_1.readInt16(reader),
        b: psdReader_1.readInt16(reader),
        c: psdReader_1.readInt16(reader),
        d: psdReader_1.readInt16(reader),
        hue: psdReader_1.readInt16(reader),
        saturation: psdReader_1.readInt16(reader),
        lightness: psdReader_1.readInt16(reader),
    };
}
function writeHueChannel(writer, channel) {
    var c = channel || {};
    psdWriter_1.writeInt16(writer, c.a || 0);
    psdWriter_1.writeInt16(writer, c.b || 0);
    psdWriter_1.writeInt16(writer, c.c || 0);
    psdWriter_1.writeInt16(writer, c.d || 0);
    psdWriter_1.writeInt16(writer, c.hue || 0);
    psdWriter_1.writeInt16(writer, c.saturation || 0);
    psdWriter_1.writeInt16(writer, c.lightness || 0);
}
addHandler('hue2', adjustmentType('hue/saturation'), function (reader, target, left) {
    if (psdReader_1.readUint16(reader) !== 2)
        throw new Error('Invalid hue2 version');
    target.adjustment = __assign(__assign({}, target.adjustment), { type: 'hue/saturation', master: readHueChannel(reader), reds: readHueChannel(reader), yellows: readHueChannel(reader), greens: readHueChannel(reader), cyans: readHueChannel(reader), blues: readHueChannel(reader), magentas: readHueChannel(reader) });
    psdReader_1.skipBytes(reader, left());
}, function (writer, target) {
    var info = target.adjustment;
    psdWriter_1.writeUint16(writer, 2); // version
    writeHueChannel(writer, info.master);
    writeHueChannel(writer, info.reds);
    writeHueChannel(writer, info.yellows);
    writeHueChannel(writer, info.greens);
    writeHueChannel(writer, info.cyans);
    writeHueChannel(writer, info.blues);
    writeHueChannel(writer, info.magentas);
});
function readColorBalance(reader) {
    return {
        cyanRed: psdReader_1.readInt16(reader),
        magentaGreen: psdReader_1.readInt16(reader),
        yellowBlue: psdReader_1.readInt16(reader),
    };
}
function writeColorBalance(writer, value) {
    psdWriter_1.writeInt16(writer, value.cyanRed || 0);
    psdWriter_1.writeInt16(writer, value.magentaGreen || 0);
    psdWriter_1.writeInt16(writer, value.yellowBlue || 0);
}
addHandler('blnc', adjustmentType('color balance'), function (reader, target, left) {
    target.adjustment = {
        type: 'color balance',
        shadows: readColorBalance(reader),
        midtones: readColorBalance(reader),
        highlights: readColorBalance(reader),
        preserveLuminosity: !!psdReader_1.readUint8(reader),
    };
    psdReader_1.skipBytes(reader, left());
}, function (writer, target) {
    var info = target.adjustment;
    writeColorBalance(writer, info.shadows || {});
    writeColorBalance(writer, info.midtones || {});
    writeColorBalance(writer, info.highlights || {});
    psdWriter_1.writeUint8(writer, info.preserveLuminosity ? 1 : 0);
    psdWriter_1.writeZeros(writer, 1);
});
addHandler('blwh', adjustmentType('black & white'), function (reader, target, left) {
    var desc = descriptor_1.readVersionAndDescriptor(reader);
    target.adjustment = {
        type: 'black & white',
        reds: desc['Rd  '],
        yellows: desc.Yllw,
        greens: desc['Grn '],
        cyans: desc['Cyn '],
        blues: desc['Bl  '],
        magentas: desc.Mgnt,
        useTint: !!desc.useTint,
        presetKind: desc.bwPresetKind,
        presetFileName: desc.blackAndWhitePresetFileName,
    };
    if (desc.tintColor !== undefined)
        target.adjustment.tintColor = parseColor(desc.tintColor);
    psdReader_1.skipBytes(reader, left());
}, function (writer, target) {
    var info = target.adjustment;
    var desc = {
        'Rd  ': info.reds || 0,
        Yllw: info.yellows || 0,
        'Grn ': info.greens || 0,
        'Cyn ': info.cyans || 0,
        'Bl  ': info.blues || 0,
        Mgnt: info.magentas || 0,
        useTint: !!info.useTint,
        tintColor: serializeColor(info.tintColor),
        bwPresetKind: info.presetKind || 0,
        blackAndWhitePresetFileName: info.presetFileName || '',
    };
    descriptor_1.writeVersionAndDescriptor(writer, '', 'null', desc);
});
addHandler('phfl', adjustmentType('photo filter'), function (reader, target, left) {
    var version = psdReader_1.readUint16(reader);
    if (version !== 2 && version !== 3)
        throw new Error('Invalid phfl version');
    var color;
    if (version === 2) {
        color = psdReader_1.readColor(reader);
    }
    else { // version 3
        // TODO: test this, this is probably wrong
        color = {
            l: psdReader_1.readInt32(reader) / 100,
            a: psdReader_1.readInt32(reader) / 100,
            b: psdReader_1.readInt32(reader) / 100,
        };
    }
    target.adjustment = {
        type: 'photo filter',
        color: color,
        density: psdReader_1.readUint32(reader) / 100,
        preserveLuminosity: !!psdReader_1.readUint8(reader),
    };
    psdReader_1.skipBytes(reader, left());
}, function (writer, target) {
    var info = target.adjustment;
    psdWriter_1.writeUint16(writer, 2); // version
    psdWriter_1.writeColor(writer, info.color || { l: 0, a: 0, b: 0 });
    psdWriter_1.writeUint32(writer, (info.density || 0) * 100);
    psdWriter_1.writeUint8(writer, info.preserveLuminosity ? 1 : 0);
    psdWriter_1.writeZeros(writer, 3);
});
function readMixrChannel(reader) {
    var red = psdReader_1.readInt16(reader);
    var green = psdReader_1.readInt16(reader);
    var blue = psdReader_1.readInt16(reader);
    psdReader_1.skipBytes(reader, 2);
    var constant = psdReader_1.readInt16(reader);
    return { red: red, green: green, blue: blue, constant: constant };
}
function writeMixrChannel(writer, channel) {
    var c = channel || {};
    psdWriter_1.writeInt16(writer, c.red);
    psdWriter_1.writeInt16(writer, c.green);
    psdWriter_1.writeInt16(writer, c.blue);
    psdWriter_1.writeZeros(writer, 2);
    psdWriter_1.writeInt16(writer, c.constant);
}
addHandler('mixr', adjustmentType('channel mixer'), function (reader, target, left) {
    if (psdReader_1.readUint16(reader) !== 1)
        throw new Error('Invalid mixr version');
    var adjustment = target.adjustment = __assign(__assign({}, target.adjustment), { type: 'channel mixer', monochrome: !!psdReader_1.readUint16(reader) });
    if (!adjustment.monochrome) {
        adjustment.red = readMixrChannel(reader);
        adjustment.green = readMixrChannel(reader);
        adjustment.blue = readMixrChannel(reader);
    }
    adjustment.gray = readMixrChannel(reader);
    psdReader_1.skipBytes(reader, left());
}, function (writer, target) {
    var info = target.adjustment;
    psdWriter_1.writeUint16(writer, 1); // version
    psdWriter_1.writeUint16(writer, info.monochrome ? 1 : 0);
    if (info.monochrome) {
        writeMixrChannel(writer, info.gray);
        psdWriter_1.writeZeros(writer, 3 * 5 * 2);
    }
    else {
        writeMixrChannel(writer, info.red);
        writeMixrChannel(writer, info.green);
        writeMixrChannel(writer, info.blue);
        writeMixrChannel(writer, info.gray);
    }
});
var colorLookupType = helpers_1.createEnum('colorLookupType', '3DLUT', {
    '3dlut': '3DLUT',
    abstractProfile: 'abstractProfile',
    deviceLinkProfile: 'deviceLinkProfile',
});
var LUTFormatType = helpers_1.createEnum('LUTFormatType', 'look', {
    look: 'LUTFormatLOOK',
    cube: 'LUTFormatCUBE',
    '3dl': 'LUTFormat3DL',
});
var colorLookupOrder = helpers_1.createEnum('colorLookupOrder', 'rgb', {
    rgb: 'rgbOrder',
    bgr: 'bgrOrder',
});
addHandler('clrL', adjustmentType('color lookup'), function (reader, target, left) {
    if (psdReader_1.readUint16(reader) !== 1)
        throw new Error('Invalid clrL version');
    var desc = descriptor_1.readVersionAndDescriptor(reader);
    target.adjustment = { type: 'color lookup' };
    var info = target.adjustment;
    if (desc.lookupType !== undefined)
        info.lookupType = colorLookupType.decode(desc.lookupType);
    if (desc['Nm  '] !== undefined)
        info.name = desc['Nm  '];
    if (desc.Dthr !== undefined)
        info.dither = desc.Dthr;
    if (desc.profile !== undefined)
        info.profile = desc.profile;
    if (desc.LUTFormat !== undefined)
        info.lutFormat = LUTFormatType.decode(desc.LUTFormat);
    if (desc.dataOrder !== undefined)
        info.dataOrder = colorLookupOrder.decode(desc.dataOrder);
    if (desc.tableOrder !== undefined)
        info.tableOrder = colorLookupOrder.decode(desc.tableOrder);
    if (desc.LUT3DFileData !== undefined)
        info.lut3DFileData = desc.LUT3DFileData;
    if (desc.LUT3DFileName !== undefined)
        info.lut3DFileName = desc.LUT3DFileName;
    psdReader_1.skipBytes(reader, left());
}, function (writer, target) {
    var info = target.adjustment;
    var desc = {};
    if (info.lookupType !== undefined)
        desc.lookupType = colorLookupType.encode(info.lookupType);
    if (info.name !== undefined)
        desc['Nm  '] = info.name;
    if (info.dither !== undefined)
        desc.Dthr = info.dither;
    if (info.profile !== undefined)
        desc.profile = info.profile;
    if (info.lutFormat !== undefined)
        desc.LUTFormat = LUTFormatType.encode(info.lutFormat);
    if (info.dataOrder !== undefined)
        desc.dataOrder = colorLookupOrder.encode(info.dataOrder);
    if (info.tableOrder !== undefined)
        desc.tableOrder = colorLookupOrder.encode(info.tableOrder);
    if (info.lut3DFileData !== undefined)
        desc.LUT3DFileData = info.lut3DFileData;
    if (info.lut3DFileName !== undefined)
        desc.LUT3DFileName = info.lut3DFileName;
    psdWriter_1.writeUint16(writer, 1); // version
    descriptor_1.writeVersionAndDescriptor(writer, '', 'null', desc);
});
addHandler('nvrt', adjustmentType('invert'), function (reader, target, left) {
    target.adjustment = { type: 'invert' };
    psdReader_1.skipBytes(reader, left());
}, function () {
    // nothing to write here
});
addHandler('post', adjustmentType('posterize'), function (reader, target, left) {
    target.adjustment = {
        type: 'posterize',
        levels: psdReader_1.readUint16(reader),
    };
    psdReader_1.skipBytes(reader, left());
}, function (writer, target) {
    var _a;
    var info = target.adjustment;
    psdWriter_1.writeUint16(writer, (_a = info.levels) !== null && _a !== void 0 ? _a : 4);
    psdWriter_1.writeZeros(writer, 2);
});
addHandler('thrs', adjustmentType('threshold'), function (reader, target, left) {
    target.adjustment = {
        type: 'threshold',
        level: psdReader_1.readUint16(reader),
    };
    psdReader_1.skipBytes(reader, left());
}, function (writer, target) {
    var _a;
    var info = target.adjustment;
    psdWriter_1.writeUint16(writer, (_a = info.level) !== null && _a !== void 0 ? _a : 128);
    psdWriter_1.writeZeros(writer, 2);
});
var grdmColorModels = ['', '', '', 'rgb', 'hsb', '', 'lab'];
addHandler('grdm', adjustmentType('gradient map'), function (reader, target, left) {
    if (psdReader_1.readUint16(reader) !== 1)
        throw new Error('Invalid grdm version');
    var info = {
        type: 'gradient map',
        gradientType: 'solid',
    };
    info.reverse = !!psdReader_1.readUint8(reader);
    info.dither = !!psdReader_1.readUint8(reader);
    info.name = psdReader_1.readUnicodeString(reader);
    info.colorStops = [];
    info.opacityStops = [];
    var stopsCount = psdReader_1.readUint16(reader);
    for (var i = 0; i < stopsCount; i++) {
        info.colorStops.push({
            location: psdReader_1.readUint32(reader),
            midpoint: psdReader_1.readUint32(reader) / 100,
            color: psdReader_1.readColor(reader),
        });
        psdReader_1.skipBytes(reader, 2);
    }
    var opacityStopsCount = psdReader_1.readUint16(reader);
    for (var i = 0; i < opacityStopsCount; i++) {
        info.opacityStops.push({
            location: psdReader_1.readUint32(reader),
            midpoint: psdReader_1.readUint32(reader) / 100,
            opacity: psdReader_1.readUint16(reader) / 0xff,
        });
    }
    var expansionCount = psdReader_1.readUint16(reader);
    if (expansionCount !== 2)
        throw new Error('Invalid grdm expansion count');
    var interpolation = psdReader_1.readUint16(reader);
    info.smoothness = interpolation / 4096;
    var length = psdReader_1.readUint16(reader);
    if (length !== 32)
        throw new Error('Invalid grdm length');
    info.gradientType = psdReader_1.readUint16(reader) ? 'noise' : 'solid';
    info.randomSeed = psdReader_1.readUint32(reader);
    info.addTransparency = !!psdReader_1.readUint16(reader);
    info.restrictColors = !!psdReader_1.readUint16(reader);
    info.roughness = psdReader_1.readUint32(reader) / 4096;
    info.colorModel = (grdmColorModels[psdReader_1.readUint16(reader)] || 'rgb');
    info.min = [
        psdReader_1.readUint16(reader) / 0x8000,
        psdReader_1.readUint16(reader) / 0x8000,
        psdReader_1.readUint16(reader) / 0x8000,
        psdReader_1.readUint16(reader) / 0x8000,
    ];
    info.max = [
        psdReader_1.readUint16(reader) / 0x8000,
        psdReader_1.readUint16(reader) / 0x8000,
        psdReader_1.readUint16(reader) / 0x8000,
        psdReader_1.readUint16(reader) / 0x8000,
    ];
    psdReader_1.skipBytes(reader, left());
    for (var _i = 0, _a = info.colorStops; _i < _a.length; _i++) {
        var s = _a[_i];
        s.location /= interpolation;
    }
    for (var _b = 0, _c = info.opacityStops; _b < _c.length; _b++) {
        var s = _c[_b];
        s.location /= interpolation;
    }
    target.adjustment = info;
}, function (writer, target) {
    var _a, _b, _c;
    var info = target.adjustment;
    psdWriter_1.writeUint16(writer, 1); // version
    psdWriter_1.writeUint8(writer, info.reverse ? 1 : 0);
    psdWriter_1.writeUint8(writer, info.dither ? 1 : 0);
    psdWriter_1.writeUnicodeStringWithPadding(writer, info.name || '');
    psdWriter_1.writeUint16(writer, info.colorStops && info.colorStops.length || 0);
    var interpolation = Math.round(((_a = info.smoothness) !== null && _a !== void 0 ? _a : 1) * 4096);
    for (var _i = 0, _d = info.colorStops || []; _i < _d.length; _i++) {
        var s = _d[_i];
        psdWriter_1.writeUint32(writer, Math.round(s.location * interpolation));
        psdWriter_1.writeUint32(writer, Math.round(s.midpoint * 100));
        psdWriter_1.writeColor(writer, s.color);
        psdWriter_1.writeZeros(writer, 2);
    }
    psdWriter_1.writeUint16(writer, info.opacityStops && info.opacityStops.length || 0);
    for (var _e = 0, _f = info.opacityStops || []; _e < _f.length; _e++) {
        var s = _f[_e];
        psdWriter_1.writeUint32(writer, Math.round(s.location * interpolation));
        psdWriter_1.writeUint32(writer, Math.round(s.midpoint * 100));
        psdWriter_1.writeUint16(writer, Math.round(s.opacity * 0xff));
    }
    psdWriter_1.writeUint16(writer, 2); // expansion count
    psdWriter_1.writeUint16(writer, interpolation);
    psdWriter_1.writeUint16(writer, 32); // length
    psdWriter_1.writeUint16(writer, info.gradientType === 'noise' ? 1 : 0);
    psdWriter_1.writeUint32(writer, info.randomSeed || 0);
    psdWriter_1.writeUint16(writer, info.addTransparency ? 1 : 0);
    psdWriter_1.writeUint16(writer, info.restrictColors ? 1 : 0);
    psdWriter_1.writeUint32(writer, Math.round(((_b = info.roughness) !== null && _b !== void 0 ? _b : 1) * 4096));
    var colorModel = grdmColorModels.indexOf((_c = info.colorModel) !== null && _c !== void 0 ? _c : 'rgb');
    psdWriter_1.writeUint16(writer, colorModel === -1 ? 3 : colorModel);
    for (var i = 0; i < 4; i++)
        psdWriter_1.writeUint16(writer, Math.round((info.min && info.min[i] || 0) * 0x8000));
    for (var i = 0; i < 4; i++)
        psdWriter_1.writeUint16(writer, Math.round((info.max && info.max[i] || 0) * 0x8000));
    psdWriter_1.writeZeros(writer, 4);
});
function readSelectiveColors(reader) {
    return {
        c: psdReader_1.readInt16(reader),
        m: psdReader_1.readInt16(reader),
        y: psdReader_1.readInt16(reader),
        k: psdReader_1.readInt16(reader),
    };
}
function writeSelectiveColors(writer, cmyk) {
    var c = cmyk || {};
    psdWriter_1.writeInt16(writer, c.c);
    psdWriter_1.writeInt16(writer, c.m);
    psdWriter_1.writeInt16(writer, c.y);
    psdWriter_1.writeInt16(writer, c.k);
}
addHandler('selc', adjustmentType('selective color'), function (reader, target) {
    if (psdReader_1.readUint16(reader) !== 1)
        throw new Error('Invalid selc version');
    var mode = psdReader_1.readUint16(reader) ? 'absolute' : 'relative';
    psdReader_1.skipBytes(reader, 8);
    target.adjustment = {
        type: 'selective color',
        mode: mode,
        reds: readSelectiveColors(reader),
        yellows: readSelectiveColors(reader),
        greens: readSelectiveColors(reader),
        cyans: readSelectiveColors(reader),
        blues: readSelectiveColors(reader),
        magentas: readSelectiveColors(reader),
        whites: readSelectiveColors(reader),
        neutrals: readSelectiveColors(reader),
        blacks: readSelectiveColors(reader),
    };
}, function (writer, target) {
    var info = target.adjustment;
    psdWriter_1.writeUint16(writer, 1); // version
    psdWriter_1.writeUint16(writer, info.mode === 'absolute' ? 1 : 0);
    psdWriter_1.writeZeros(writer, 8);
    writeSelectiveColors(writer, info.reds);
    writeSelectiveColors(writer, info.yellows);
    writeSelectiveColors(writer, info.greens);
    writeSelectiveColors(writer, info.cyans);
    writeSelectiveColors(writer, info.blues);
    writeSelectiveColors(writer, info.magentas);
    writeSelectiveColors(writer, info.whites);
    writeSelectiveColors(writer, info.neutrals);
    writeSelectiveColors(writer, info.blacks);
});
addHandler('CgEd', function (target) {
    var a = target.adjustment;
    if (!a)
        return false;
    return (a.type === 'brightness/contrast' && !a.useLegacy) ||
        ((a.type === 'levels' || a.type === 'curves' || a.type === 'exposure' || a.type === 'channel mixer' ||
            a.type === 'hue/saturation') && a.presetFileName !== undefined);
}, function (reader, target, left) {
    var desc = descriptor_1.readVersionAndDescriptor(reader);
    if (desc.Vrsn !== 1)
        throw new Error('Invalid CgEd version');
    // this section can specify preset file name for other adjustment types
    if ('presetFileName' in desc) {
        target.adjustment = __assign(__assign({}, target.adjustment), { presetKind: desc.presetKind, presetFileName: desc.presetFileName });
    }
    else if ('curvesPresetFileName' in desc) {
        target.adjustment = __assign(__assign({}, target.adjustment), { presetKind: desc.curvesPresetKind, presetFileName: desc.curvesPresetFileName });
    }
    else if ('mixerPresetFileName' in desc) {
        target.adjustment = __assign(__assign({}, target.adjustment), { presetKind: desc.mixerPresetKind, presetFileName: desc.mixerPresetFileName });
    }
    else {
        target.adjustment = {
            type: 'brightness/contrast',
            brightness: desc.Brgh,
            contrast: desc.Cntr,
            meanValue: desc.means,
            useLegacy: !!desc.useLegacy,
            labColorOnly: !!desc['Lab '],
            auto: !!desc.Auto,
        };
    }
    psdReader_1.skipBytes(reader, left());
}, function (writer, target) {
    var _a, _b, _c, _d;
    var info = target.adjustment;
    if (info.type === 'levels' || info.type === 'exposure' || info.type === 'hue/saturation') {
        var desc = {
            Vrsn: 1,
            presetKind: (_a = info.presetKind) !== null && _a !== void 0 ? _a : 1,
            presetFileName: info.presetFileName || '',
        };
        descriptor_1.writeVersionAndDescriptor(writer, '', 'null', desc);
    }
    else if (info.type === 'curves') {
        var desc = {
            Vrsn: 1,
            curvesPresetKind: (_b = info.presetKind) !== null && _b !== void 0 ? _b : 1,
            curvesPresetFileName: info.presetFileName || '',
        };
        descriptor_1.writeVersionAndDescriptor(writer, '', 'null', desc);
    }
    else if (info.type === 'channel mixer') {
        var desc = {
            Vrsn: 1,
            mixerPresetKind: (_c = info.presetKind) !== null && _c !== void 0 ? _c : 1,
            mixerPresetFileName: info.presetFileName || '',
        };
        descriptor_1.writeVersionAndDescriptor(writer, '', 'null', desc);
    }
    else if (info.type === 'brightness/contrast') {
        var desc = {
            Vrsn: 1,
            Brgh: info.brightness || 0,
            Cntr: info.contrast || 0,
            means: (_d = info.meanValue) !== null && _d !== void 0 ? _d : 127,
            'Lab ': !!info.labColorOnly,
            useLegacy: !!info.useLegacy,
            Auto: !!info.auto,
        };
        descriptor_1.writeVersionAndDescriptor(writer, '', 'null', desc);
    }
    else {
        throw new Error('Unhandled CgEd case');
    }
});
addHandler('Txt2', hasKey('engineData'), function (reader, target, left) {
    var data = psdReader_1.readBytes(reader, left());
    target.engineData = base64_js_1.fromByteArray(data);
    // const engineData = parseEngineData(data);
    // console.log(require('util').inspect(engineData, false, 99, true));
    // require('fs').writeFileSync('resources/engineData2Simple.txt', require('util').inspect(engineData, false, 99, false), 'utf8');
    // require('fs').writeFileSync('test_data.json', JSON.stringify(ed, null, 2), 'utf8');
}, function (writer, target) {
    var buffer = base64_js_1.toByteArray(target.engineData);
    psdWriter_1.writeBytes(writer, buffer);
});
addHandler('FMsk', hasKey('filterMask'), function (reader, target) {
    target.filterMask = {
        colorSpace: psdReader_1.readColor(reader),
        opacity: psdReader_1.readUint16(reader) / 0xff,
    };
}, function (writer, target) {
    var _a;
    psdWriter_1.writeColor(writer, target.filterMask.colorSpace);
    psdWriter_1.writeUint16(writer, helpers_1.clamp((_a = target.filterMask.opacity) !== null && _a !== void 0 ? _a : 1, 0, 1) * 0xff);
});
addHandler('artd', // document-wide artboard info
function (// document-wide artboard info
target) { return target.artboards !== undefined; }, function (reader, target, left) {
    var desc = descriptor_1.readVersionAndDescriptor(reader);
    target.artboards = {
        count: desc['Cnt '],
        autoExpandOffset: { horizontal: desc.autoExpandOffset.Hrzn, vertical: desc.autoExpandOffset.Vrtc },
        origin: { horizontal: desc.origin.Hrzn, vertical: desc.origin.Vrtc },
        autoExpandEnabled: desc.autoExpandEnabled,
        autoNestEnabled: desc.autoNestEnabled,
        autoPositionEnabled: desc.autoPositionEnabled,
        shrinkwrapOnSaveEnabled: desc.shrinkwrapOnSaveEnabled,
        docDefaultNewArtboardBackgroundColor: parseColor(desc.docDefaultNewArtboardBackgroundColor),
        docDefaultNewArtboardBackgroundType: desc.docDefaultNewArtboardBackgroundType,
    };
    psdReader_1.skipBytes(reader, left());
}, function (writer, target) {
    var _a, _b, _c, _d, _e;
    var artb = target.artboards;
    var desc = {
        'Cnt ': artb.count,
        autoExpandOffset: artb.autoExpandOffset ? { Hrzn: artb.autoExpandOffset.horizontal, Vrtc: artb.autoExpandOffset.vertical } : { Hrzn: 0, Vrtc: 0 },
        origin: artb.origin ? { Hrzn: artb.origin.horizontal, Vrtc: artb.origin.vertical } : { Hrzn: 0, Vrtc: 0 },
        autoExpandEnabled: (_a = artb.autoExpandEnabled) !== null && _a !== void 0 ? _a : true,
        autoNestEnabled: (_b = artb.autoNestEnabled) !== null && _b !== void 0 ? _b : true,
        autoPositionEnabled: (_c = artb.autoPositionEnabled) !== null && _c !== void 0 ? _c : true,
        shrinkwrapOnSaveEnabled: (_d = artb.shrinkwrapOnSaveEnabled) !== null && _d !== void 0 ? _d : true,
        docDefaultNewArtboardBackgroundColor: serializeColor(artb.docDefaultNewArtboardBackgroundColor),
        docDefaultNewArtboardBackgroundType: (_e = artb.docDefaultNewArtboardBackgroundType) !== null && _e !== void 0 ? _e : 1,
    };
    descriptor_1.writeVersionAndDescriptor(writer, '', 'null', desc, 'artd');
});
function parseFxObject(fx) {
    var stroke = {
        enabled: !!fx.enab,
        position: descriptor_1.FStl.decode(fx.Styl),
        fillType: descriptor_1.FrFl.decode(fx.PntT),
        blendMode: descriptor_1.BlnM.decode(fx['Md  ']),
        opacity: descriptor_1.parsePercent(fx.Opct),
        size: descriptor_1.parseUnits(fx['Sz  ']),
    };
    if (fx.present !== undefined)
        stroke.present = fx.present;
    if (fx.showInDialog !== undefined)
        stroke.showInDialog = fx.showInDialog;
    if (fx.overprint !== undefined)
        stroke.overprint = fx.overprint;
    if (fx['Clr '])
        stroke.color = parseColor(fx['Clr ']);
    if (fx.Grad)
        stroke.gradient = parseGradientContent(fx);
    if (fx.Ptrn)
        stroke.pattern = parsePatternContent(fx);
    return stroke;
}
function serializeFxObject(stroke) {
    var FrFX = {};
    FrFX.enab = !!stroke.enabled;
    if (stroke.present !== undefined)
        FrFX.present = !!stroke.present;
    if (stroke.showInDialog !== undefined)
        FrFX.showInDialog = !!stroke.showInDialog;
    FrFX.Styl = descriptor_1.FStl.encode(stroke.position);
    FrFX.PntT = descriptor_1.FrFl.encode(stroke.fillType);
    FrFX['Md  '] = descriptor_1.BlnM.encode(stroke.blendMode);
    FrFX.Opct = descriptor_1.unitsPercent(stroke.opacity);
    FrFX['Sz  '] = descriptor_1.unitsValue(stroke.size, 'size');
    if (stroke.color)
        FrFX['Clr '] = serializeColor(stroke.color);
    if (stroke.gradient)
        FrFX = __assign(__assign({}, FrFX), serializeGradientContent(stroke.gradient));
    if (stroke.pattern)
        FrFX = __assign(__assign({}, FrFX), serializePatternContent(stroke.pattern));
    if (stroke.overprint !== undefined)
        FrFX.overprint = !!stroke.overprint;
    return FrFX;
}
function parseEffects(info, log) {
    var effects = {};
    if (!info.masterFXSwitch)
        effects.disabled = true;
    if (info['Scl '])
        effects.scale = descriptor_1.parsePercent(info['Scl ']);
    if (info.DrSh)
        effects.dropShadow = [parseEffectObject(info.DrSh, log)];
    if (info.dropShadowMulti)
        effects.dropShadow = info.dropShadowMulti.map(function (i) { return parseEffectObject(i, log); });
    if (info.IrSh)
        effects.innerShadow = [parseEffectObject(info.IrSh, log)];
    if (info.innerShadowMulti)
        effects.innerShadow = info.innerShadowMulti.map(function (i) { return parseEffectObject(i, log); });
    if (info.OrGl)
        effects.outerGlow = parseEffectObject(info.OrGl, log);
    if (info.IrGl)
        effects.innerGlow = parseEffectObject(info.IrGl, log);
    if (info.ebbl)
        effects.bevel = parseEffectObject(info.ebbl, log);
    if (info.SoFi)
        effects.solidFill = [parseEffectObject(info.SoFi, log)];
    if (info.solidFillMulti)
        effects.solidFill = info.solidFillMulti.map(function (i) { return parseEffectObject(i, log); });
    if (info.patternFill)
        effects.patternOverlay = parseEffectObject(info.patternFill, log);
    if (info.GrFl)
        effects.gradientOverlay = [parseEffectObject(info.GrFl, log)];
    if (info.gradientFillMulti)
        effects.gradientOverlay = info.gradientFillMulti.map(function (i) { return parseEffectObject(i, log); });
    if (info.ChFX)
        effects.satin = parseEffectObject(info.ChFX, log);
    if (info.FrFX)
        effects.stroke = [parseFxObject(info.FrFX)];
    if (info.frameFXMulti)
        effects.stroke = info.frameFXMulti.map(function (i) { return parseFxObject(i); });
    return effects;
}
function serializeEffects(e, log, multi) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o;
    var info = multi ? {
        'Scl ': descriptor_1.unitsPercent((_a = e.scale) !== null && _a !== void 0 ? _a : 1),
        masterFXSwitch: !e.disabled,
    } : {
        masterFXSwitch: !e.disabled,
        'Scl ': descriptor_1.unitsPercent((_b = e.scale) !== null && _b !== void 0 ? _b : 1),
    };
    var arrayKeys = ['dropShadow', 'innerShadow', 'solidFill', 'gradientOverlay', 'stroke'];
    for (var _i = 0, arrayKeys_1 = arrayKeys; _i < arrayKeys_1.length; _i++) {
        var key = arrayKeys_1[_i];
        if (e[key] && !Array.isArray(e[key]))
            throw new Error(key + " should be an array");
    }
    if (((_c = e.dropShadow) === null || _c === void 0 ? void 0 : _c[0]) && !multi)
        info.DrSh = serializeEffectObject(e.dropShadow[0], 'dropShadow', log);
    if (((_d = e.dropShadow) === null || _d === void 0 ? void 0 : _d[0]) && multi)
        info.dropShadowMulti = e.dropShadow.map(function (i) { return serializeEffectObject(i, 'dropShadow', log); });
    if (((_e = e.innerShadow) === null || _e === void 0 ? void 0 : _e[0]) && !multi)
        info.IrSh = serializeEffectObject(e.innerShadow[0], 'innerShadow', log);
    if (((_f = e.innerShadow) === null || _f === void 0 ? void 0 : _f[0]) && multi)
        info.innerShadowMulti = e.innerShadow.map(function (i) { return serializeEffectObject(i, 'innerShadow', log); });
    if (e.outerGlow)
        info.OrGl = serializeEffectObject(e.outerGlow, 'outerGlow', log);
    if (((_g = e.solidFill) === null || _g === void 0 ? void 0 : _g[0]) && multi)
        info.solidFillMulti = e.solidFill.map(function (i) { return serializeEffectObject(i, 'solidFill', log); });
    if (((_h = e.gradientOverlay) === null || _h === void 0 ? void 0 : _h[0]) && multi)
        info.gradientFillMulti = e.gradientOverlay.map(function (i) { return serializeEffectObject(i, 'gradientOverlay', log); });
    if (((_j = e.stroke) === null || _j === void 0 ? void 0 : _j[0]) && multi)
        info.frameFXMulti = e.stroke.map(function (i) { return serializeFxObject(i); });
    if (e.innerGlow)
        info.IrGl = serializeEffectObject(e.innerGlow, 'innerGlow', log);
    if (e.bevel)
        info.ebbl = serializeEffectObject(e.bevel, 'bevel', log);
    if (((_k = e.solidFill) === null || _k === void 0 ? void 0 : _k[0]) && !multi)
        info.SoFi = serializeEffectObject(e.solidFill[0], 'solidFill', log);
    if (e.patternOverlay)
        info.patternFill = serializeEffectObject(e.patternOverlay, 'patternOverlay', log);
    if (((_l = e.gradientOverlay) === null || _l === void 0 ? void 0 : _l[0]) && !multi)
        info.GrFl = serializeEffectObject(e.gradientOverlay[0], 'gradientOverlay', log);
    if (e.satin)
        info.ChFX = serializeEffectObject(e.satin, 'satin', log);
    if (((_m = e.stroke) === null || _m === void 0 ? void 0 : _m[0]) && !multi)
        info.FrFX = serializeFxObject((_o = e.stroke) === null || _o === void 0 ? void 0 : _o[0]);
    if (multi) {
        info.numModifyingFX = 0;
        for (var _p = 0, _q = Object.keys(e); _p < _q.length; _p++) {
            var key = _q[_p];
            var value = e[key];
            if (Array.isArray(value)) {
                for (var _r = 0, value_1 = value; _r < value_1.length; _r++) {
                    var effect = value_1[_r];
                    if (effect.enabled)
                        info.numModifyingFX++;
                }
            }
        }
    }
    return info;
}
function hasMultiEffects(effects) {
    return Object.keys(effects).map(function (key) { return effects[key]; }).some(function (v) { return Array.isArray(v) && v.length > 1; });
}
exports.hasMultiEffects = hasMultiEffects;
addHandler('lfx2', function (target) { return target.effects !== undefined && !hasMultiEffects(target.effects); }, function (reader, target, left, _, options) {
    var version = psdReader_1.readUint32(reader);
    if (version !== 0)
        throw new Error("Invalid lfx2 version");
    var desc = descriptor_1.readVersionAndDescriptor(reader);
    // console.log(require('util').inspect(desc, false, 99, true));
    // TODO: don't discard if we got it from lmfx
    // discard if read in 'lrFX' section
    target.effects = parseEffects(desc, !!options.logMissingFeatures);
    psdReader_1.skipBytes(reader, left());
}, function (writer, target, _, options) {
    var desc = serializeEffects(target.effects, !!options.logMissingFeatures, false);
    // console.log(require('util').inspect(desc, false, 99, true));
    psdWriter_1.writeUint32(writer, 0); // version
    descriptor_1.writeVersionAndDescriptor(writer, '', 'null', desc);
});
addHandler('cinf', hasKey('compositorUsed'), function (reader, target, left) {
    var desc = descriptor_1.readVersionAndDescriptor(reader);
    // console.log(require('util').inspect(desc, false, 99, true));
    target.compositorUsed = {
        description: desc.description,
        reason: desc.reason,
        engine: desc.Engn.split('.')[1],
        enableCompCore: desc.enableCompCore.split('.')[1],
        enableCompCoreGPU: desc.enableCompCoreGPU.split('.')[1],
        compCoreSupport: desc.compCoreSupport.split('.')[1],
        compCoreGPUSupport: desc.compCoreGPUSupport.split('.')[1],
    };
    psdReader_1.skipBytes(reader, left());
}, function (writer, target) {
    var cinf = target.compositorUsed;
    var desc = {
        Vrsn: { major: 1, minor: 0, fix: 0 },
        // psVersion: { major: 22, minor: 3, fix: 1 }, // TESTING
        description: cinf.description,
        reason: cinf.reason,
        Engn: "Engn." + cinf.engine,
        enableCompCore: "enable." + cinf.enableCompCore,
        enableCompCoreGPU: "enable." + cinf.enableCompCoreGPU,
        // enableCompCoreThreads: `enable.feature`, // TESTING
        compCoreSupport: "reason." + cinf.compCoreSupport,
        compCoreGPUSupport: "reason." + cinf.compCoreGPUSupport,
    };
    descriptor_1.writeVersionAndDescriptor(writer, '', 'null', desc);
});
// extension settings ?, ignore it
addHandler('extn', function (target) { return target._extn !== undefined; }, function (reader, target) {
    var desc = descriptor_1.readVersionAndDescriptor(reader);
    // console.log(require('util').inspect(desc, false, 99, true));
    if (helpers_1.MOCK_HANDLERS)
        target._extn = desc;
}, function (writer, target) {
    // TODO: need to add correct types for desc fields (resources/src.psd)
    if (helpers_1.MOCK_HANDLERS)
        descriptor_1.writeVersionAndDescriptor(writer, '', 'null', target._extn);
});
// descriptor helpers
function parseGradient(grad) {
    if (grad.GrdF === 'GrdF.CstS') {
        var samples_1 = grad.Intr || 4096;
        return {
            type: 'solid',
            name: grad['Nm  '],
            smoothness: grad.Intr / 4096,
            colorStops: grad.Clrs.map(function (s) { return ({
                color: parseColor(s['Clr ']),
                location: s.Lctn / samples_1,
                midpoint: s.Mdpn / 100,
            }); }),
            opacityStops: grad.Trns.map(function (s) { return ({
                opacity: descriptor_1.parsePercent(s.Opct),
                location: s.Lctn / samples_1,
                midpoint: s.Mdpn / 100,
            }); }),
        };
    }
    else {
        return {
            type: 'noise',
            name: grad['Nm  '],
            roughness: grad.Smth / 4096,
            colorModel: descriptor_1.ClrS.decode(grad.ClrS),
            randomSeed: grad.RndS,
            restrictColors: !!grad.VctC,
            addTransparency: !!grad.ShTr,
            min: grad['Mnm '].map(function (x) { return x / 100; }),
            max: grad['Mxm '].map(function (x) { return x / 100; }),
        };
    }
}
function serializeGradient(grad) {
    var _a, _b;
    if (grad.type === 'solid') {
        var samples_2 = Math.round(((_a = grad.smoothness) !== null && _a !== void 0 ? _a : 1) * 4096);
        return {
            'Nm  ': grad.name || '',
            GrdF: 'GrdF.CstS',
            Intr: samples_2,
            Clrs: grad.colorStops.map(function (s) {
                var _a;
                return ({
                    'Clr ': serializeColor(s.color),
                    Type: 'Clry.UsrS',
                    Lctn: Math.round(s.location * samples_2),
                    Mdpn: Math.round(((_a = s.midpoint) !== null && _a !== void 0 ? _a : 0.5) * 100),
                });
            }),
            Trns: grad.opacityStops.map(function (s) {
                var _a;
                return ({
                    Opct: descriptor_1.unitsPercent(s.opacity),
                    Lctn: Math.round(s.location * samples_2),
                    Mdpn: Math.round(((_a = s.midpoint) !== null && _a !== void 0 ? _a : 0.5) * 100),
                });
            }),
        };
    }
    else {
        return {
            GrdF: 'GrdF.ClNs',
            'Nm  ': grad.name || '',
            ShTr: !!grad.addTransparency,
            VctC: !!grad.restrictColors,
            ClrS: descriptor_1.ClrS.encode(grad.colorModel),
            RndS: grad.randomSeed || 0,
            Smth: Math.round(((_b = grad.roughness) !== null && _b !== void 0 ? _b : 1) * 4096),
            'Mnm ': (grad.min || [0, 0, 0, 0]).map(function (x) { return x * 100; }),
            'Mxm ': (grad.max || [1, 1, 1, 1]).map(function (x) { return x * 100; }),
        };
    }
}
function parseGradientContent(descriptor) {
    var result = parseGradient(descriptor.Grad);
    result.style = descriptor_1.GrdT.decode(descriptor.Type);
    if (descriptor.Dthr !== undefined)
        result.dither = descriptor.Dthr;
    if (descriptor.Rvrs !== undefined)
        result.reverse = descriptor.Rvrs;
    if (descriptor.Angl !== undefined)
        result.angle = descriptor_1.parseAngle(descriptor.Angl);
    if (descriptor['Scl '] !== undefined)
        result.scale = descriptor_1.parsePercent(descriptor['Scl ']);
    if (descriptor.Algn !== undefined)
        result.align = descriptor.Algn;
    if (descriptor.Ofst !== undefined) {
        result.offset = {
            x: descriptor_1.parsePercent(descriptor.Ofst.Hrzn),
            y: descriptor_1.parsePercent(descriptor.Ofst.Vrtc)
        };
    }
    return result;
}
function parsePatternContent(descriptor) {
    var result = {
        name: descriptor.Ptrn['Nm  '],
        id: descriptor.Ptrn.Idnt,
    };
    if (descriptor.Lnkd !== undefined)
        result.linked = descriptor.Lnkd;
    if (descriptor.phase !== undefined)
        result.phase = { x: descriptor.phase.Hrzn, y: descriptor.phase.Vrtc };
    return result;
}
function parseVectorContent(descriptor) {
    if ('Grad' in descriptor) {
        return parseGradientContent(descriptor);
    }
    else if ('Ptrn' in descriptor) {
        return __assign({ type: 'pattern' }, parsePatternContent(descriptor));
    }
    else if ('Clr ' in descriptor) {
        return { type: 'color', color: parseColor(descriptor['Clr ']) };
    }
    else {
        throw new Error('Invalid vector content');
    }
}
function serializeGradientContent(content) {
    var result = {};
    if (content.dither !== undefined)
        result.Dthr = content.dither;
    if (content.reverse !== undefined)
        result.Rvrs = content.reverse;
    if (content.angle !== undefined)
        result.Angl = descriptor_1.unitsAngle(content.angle);
    result.Type = descriptor_1.GrdT.encode(content.style);
    if (content.align !== undefined)
        result.Algn = content.align;
    if (content.scale !== undefined)
        result['Scl '] = descriptor_1.unitsPercent(content.scale);
    if (content.offset) {
        result.Ofst = {
            Hrzn: descriptor_1.unitsPercent(content.offset.x),
            Vrtc: descriptor_1.unitsPercent(content.offset.y),
        };
    }
    result.Grad = serializeGradient(content);
    return result;
}
function serializePatternContent(content) {
    var result = {
        Ptrn: {
            'Nm  ': content.name || '',
            Idnt: content.id || '',
        }
    };
    if (content.linked !== undefined)
        result.Lnkd = !!content.linked;
    if (content.phase !== undefined)
        result.phase = { Hrzn: content.phase.x, Vrtc: content.phase.y };
    return result;
}
function serializeVectorContent(content) {
    if (content.type === 'color') {
        return { key: 'SoCo', descriptor: { 'Clr ': serializeColor(content.color) } };
    }
    else if (content.type === 'pattern') {
        return { key: 'PtFl', descriptor: serializePatternContent(content) };
    }
    else {
        return { key: 'GdFl', descriptor: serializeGradientContent(content) };
    }
}
function parseColor(color) {
    if ('H   ' in color) {
        return { h: descriptor_1.parsePercentOrAngle(color['H   ']), s: color.Strt, b: color.Brgh };
    }
    else if ('Rd  ' in color) {
        return { r: color['Rd  '], g: color['Grn '], b: color['Bl  '] };
    }
    else if ('Cyn ' in color) {
        return { c: color['Cyn '], m: color.Mgnt, y: color['Ylw '], k: color.Blck };
    }
    else if ('Gry ' in color) {
        return { k: color['Gry '] };
    }
    else if ('Lmnc' in color) {
        return { l: color.Lmnc, a: color['A   '], b: color['B   '] };
    }
    else {
        throw new Error('Unsupported color descriptor');
    }
}
function serializeColor(color) {
    if (!color) {
        return { 'Rd  ': 0, 'Grn ': 0, 'Bl  ': 0 };
    }
    else if ('r' in color) {
        return { 'Rd  ': color.r || 0, 'Grn ': color.g || 0, 'Bl  ': color.b || 0 };
    }
    else if ('h' in color) {
        return { 'H   ': descriptor_1.unitsAngle(color.h * 360), Strt: color.s || 0, Brgh: color.b || 0 };
    }
    else if ('c' in color) {
        return { 'Cyn ': color.c || 0, Mgnt: color.m || 0, 'Ylw ': color.y || 0, Blck: color.k || 0 };
    }
    else if ('l' in color) {
        return { Lmnc: color.l || 0, 'A   ': color.a || 0, 'B   ': color.b || 0 };
    }
    else if ('k' in color) {
        return { 'Gry ': color.k };
    }
    else {
        throw new Error('Invalid color value');
    }
}
function parseEffectObject(obj, reportErrors) {
    var result = {};
    for (var _i = 0, _a = Object.keys(obj); _i < _a.length; _i++) {
        var key = _a[_i];
        var val = obj[key];
        switch (key) {
            case 'enab':
                result.enabled = !!val;
                break;
            case 'uglg':
                result.useGlobalLight = !!val;
                break;
            case 'AntA':
                result.antialiased = !!val;
                break;
            case 'Algn':
                result.align = !!val;
                break;
            case 'Dthr':
                result.dither = !!val;
                break;
            case 'Invr':
                result.invert = !!val;
                break;
            case 'Rvrs':
                result.reverse = !!val;
                break;
            case 'Clr ':
                result.color = parseColor(val);
                break;
            case 'hglC':
                result.highlightColor = parseColor(val);
                break;
            case 'sdwC':
                result.shadowColor = parseColor(val);
                break;
            case 'Styl':
                result.position = descriptor_1.FStl.decode(val);
                break;
            case 'Md  ':
                result.blendMode = descriptor_1.BlnM.decode(val);
                break;
            case 'hglM':
                result.highlightBlendMode = descriptor_1.BlnM.decode(val);
                break;
            case 'sdwM':
                result.shadowBlendMode = descriptor_1.BlnM.decode(val);
                break;
            case 'bvlS':
                result.style = descriptor_1.BESl.decode(val);
                break;
            case 'bvlD':
                result.direction = descriptor_1.BESs.decode(val);
                break;
            case 'bvlT':
                result.technique = descriptor_1.bvlT.decode(val);
                break;
            case 'GlwT':
                result.technique = descriptor_1.BETE.decode(val);
                break;
            case 'glwS':
                result.source = descriptor_1.IGSr.decode(val);
                break;
            case 'Type':
                result.type = descriptor_1.GrdT.decode(val);
                break;
            case 'Opct':
                result.opacity = descriptor_1.parsePercent(val);
                break;
            case 'hglO':
                result.highlightOpacity = descriptor_1.parsePercent(val);
                break;
            case 'sdwO':
                result.shadowOpacity = descriptor_1.parsePercent(val);
                break;
            case 'lagl':
                result.angle = descriptor_1.parseAngle(val);
                break;
            case 'Angl':
                result.angle = descriptor_1.parseAngle(val);
                break;
            case 'Lald':
                result.altitude = descriptor_1.parseAngle(val);
                break;
            case 'Sftn':
                result.soften = descriptor_1.parseUnits(val);
                break;
            case 'srgR':
                result.strength = descriptor_1.parsePercent(val);
                break;
            case 'blur':
                result.size = descriptor_1.parseUnits(val);
                break;
            case 'Nose':
                result.noise = descriptor_1.parsePercent(val);
                break;
            case 'Inpr':
                result.range = descriptor_1.parsePercent(val);
                break;
            case 'Ckmt':
                result.choke = descriptor_1.parseUnits(val);
                break;
            case 'ShdN':
                result.jitter = descriptor_1.parsePercent(val);
                break;
            case 'Dstn':
                result.distance = descriptor_1.parseUnits(val);
                break;
            case 'Scl ':
                result.scale = descriptor_1.parsePercent(val);
                break;
            case 'Ptrn':
                result.pattern = { name: val['Nm  '], id: val.Idnt };
                break;
            case 'phase':
                result.phase = { x: val.Hrzn, y: val.Vrtc };
                break;
            case 'Ofst':
                result.offset = { x: descriptor_1.parsePercent(val.Hrzn), y: descriptor_1.parsePercent(val.Vrtc) };
                break;
            case 'MpgS':
            case 'TrnS':
                result.contour = {
                    name: val['Nm  '],
                    curve: val['Crv '].map(function (p) { return ({ x: p.Hrzn, y: p.Vrtc }); }),
                };
                break;
            case 'Grad':
                result.gradient = parseGradient(val);
                break;
            case 'useTexture':
            case 'useShape':
            case 'layerConceals':
            case 'present':
            case 'showInDialog':
            case 'antialiasGloss':
                result[key] = val;
                break;
            default:
                reportErrors && console.log("Invalid effect key: '" + key + "':", val);
        }
    }
    return result;
}
function serializeEffectObject(obj, objName, reportErrors) {
    var result = {};
    for (var _i = 0, _a = Object.keys(obj); _i < _a.length; _i++) {
        var objKey = _a[_i];
        var key = objKey;
        var val = obj[key];
        switch (key) {
            case 'enabled':
                result.enab = !!val;
                break;
            case 'useGlobalLight':
                result.uglg = !!val;
                break;
            case 'antialiased':
                result.AntA = !!val;
                break;
            case 'align':
                result.Algn = !!val;
                break;
            case 'dither':
                result.Dthr = !!val;
                break;
            case 'invert':
                result.Invr = !!val;
                break;
            case 'reverse':
                result.Rvrs = !!val;
                break;
            case 'color':
                result['Clr '] = serializeColor(val);
                break;
            case 'highlightColor':
                result.hglC = serializeColor(val);
                break;
            case 'shadowColor':
                result.sdwC = serializeColor(val);
                break;
            case 'position':
                result.Styl = descriptor_1.FStl.encode(val);
                break;
            case 'blendMode':
                result['Md  '] = descriptor_1.BlnM.encode(val);
                break;
            case 'highlightBlendMode':
                result.hglM = descriptor_1.BlnM.encode(val);
                break;
            case 'shadowBlendMode':
                result.sdwM = descriptor_1.BlnM.encode(val);
                break;
            case 'style':
                result.bvlS = descriptor_1.BESl.encode(val);
                break;
            case 'direction':
                result.bvlD = descriptor_1.BESs.encode(val);
                break;
            case 'technique':
                if (objName === 'bevel') {
                    result.bvlT = descriptor_1.bvlT.encode(val);
                }
                else {
                    result.GlwT = descriptor_1.BETE.encode(val);
                }
                break;
            case 'source':
                result.glwS = descriptor_1.IGSr.encode(val);
                break;
            case 'type':
                result.Type = descriptor_1.GrdT.encode(val);
                break;
            case 'opacity':
                result.Opct = descriptor_1.unitsPercent(val);
                break;
            case 'highlightOpacity':
                result.hglO = descriptor_1.unitsPercent(val);
                break;
            case 'shadowOpacity':
                result.sdwO = descriptor_1.unitsPercent(val);
                break;
            case 'angle':
                if (objName === 'gradientOverlay') {
                    result.Angl = descriptor_1.unitsAngle(val);
                }
                else {
                    result.lagl = descriptor_1.unitsAngle(val);
                }
                break;
            case 'altitude':
                result.Lald = descriptor_1.unitsAngle(val);
                break;
            case 'soften':
                result.Sftn = descriptor_1.unitsValue(val, key);
                break;
            case 'strength':
                result.srgR = descriptor_1.unitsPercent(val);
                break;
            case 'size':
                result.blur = descriptor_1.unitsValue(val, key);
                break;
            case 'noise':
                result.Nose = descriptor_1.unitsPercent(val);
                break;
            case 'range':
                result.Inpr = descriptor_1.unitsPercent(val);
                break;
            case 'choke':
                result.Ckmt = descriptor_1.unitsValue(val, key);
                break;
            case 'jitter':
                result.ShdN = descriptor_1.unitsPercent(val);
                break;
            case 'distance':
                result.Dstn = descriptor_1.unitsValue(val, key);
                break;
            case 'scale':
                result['Scl '] = descriptor_1.unitsPercent(val);
                break;
            case 'pattern':
                result.Ptrn = { 'Nm  ': val.name, Idnt: val.id };
                break;
            case 'phase':
                result.phase = { Hrzn: val.x, Vrtc: val.y };
                break;
            case 'offset':
                result.Ofst = { Hrzn: descriptor_1.unitsPercent(val.x), Vrtc: descriptor_1.unitsPercent(val.y) };
                break;
            case 'contour': {
                result[objName === 'satin' ? 'MpgS' : 'TrnS'] = {
                    'Nm  ': val.name,
                    'Crv ': val.curve.map(function (p) { return ({ Hrzn: p.x, Vrtc: p.y }); }),
                };
                break;
            }
            case 'gradient':
                result.Grad = serializeGradient(val);
                break;
            case 'useTexture':
            case 'useShape':
            case 'layerConceals':
            case 'present':
            case 'showInDialog':
            case 'antialiasGloss':
                result[key] = val;
                break;
            default:
                reportErrors && console.log("Invalid effect key: '" + key + "' value:", val);
        }
    }
    return result;
}

//# sourceMappingURL=data:application/json;charset=utf8;base64,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UUFDM0IsT0FBTyxFQUFFLENBQUMsRUFBRSxLQUFLLENBQUMsTUFBTSxDQUFDLEVBQUUsQ0FBQyxFQUFFLEtBQUssQ0FBQyxJQUFJLEVBQUUsQ0FBQyxFQUFFLEtBQUssQ0FBQyxNQUFNLENBQUMsRUFBRSxDQUFDLEVBQUUsS0FBSyxDQUFDLElBQUksRUFBRSxDQUFDO0tBQzVFO1NBQU0sSUFBSSxNQUFNLElBQUksS0FBSyxFQUFFO1FBQzNCLE9BQU8sRUFBRSxDQUFDLEVBQUUsS0FBSyxDQUFDLE1BQU0sQ0FBQyxFQUFFLENBQUM7S0FDNUI7U0FBTSxJQUFJLE1BQU0sSUFBSSxLQUFLLEVBQUU7UUFDM0IsT0FBTyxFQUFFLENBQUMsRUFBRSxLQUFLLENBQUMsSUFBSSxFQUFFLENBQUMsRUFBRSxLQUFLLENBQUMsTUFBTSxDQUFDLEVBQUUsQ0FBQyxFQUFFLEtBQUssQ0FBQyxNQUFNLENBQUMsRUFBRSxDQUFDO0tBQzdEO1NBQU07UUFDTixNQUFNLElBQUksS0FBSyxDQUFDLDhCQUE4QixDQUFDLENBQUM7S0FDaEQ7QUFDRixDQUFDO0FBRUQsU0FBUyxjQUFjLENBQUMsS0FBd0I7SUFDL0MsSUFBSSxDQUFDLEtBQUssRUFBRTtRQUNYLE9BQU8sRUFBRSxNQUFNLEVBQUUsQ0FBQyxFQUFFLE1BQU0sRUFBRSxDQUFDLEVBQUUsTUFBTSxFQUFFLENBQUMsRUFBRSxDQUFDO0tBQzNDO1NBQU0sSUFBSSxHQUFHLElBQUksS0FBSyxFQUFFO1FBQ3hCLE9BQU8sRUFBRSxNQUFNLEVBQUUsS0FBSyxDQUFDLENBQUMsSUFBSSxDQUFDLEVBQUUsTUFBTSxFQUFFLEtBQUssQ0FBQyxDQUFDLElBQUksQ0FBQyxFQUFFLE1BQU0sRUFBRSxLQUFLLENBQUMsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDO0tBQzVFO1NBQU0sSUFBSSxHQUFHLElBQUksS0FBSyxFQUFFO1FBQ3hCLE9BQU8sRUFBRSxNQUFNLEVBQUUsdUJBQVUsQ0FBQyxLQUFLLENBQUMsQ0FBQyxHQUFHLEdBQUcsQ0FBQyxFQUFFLElBQUksRUFBRSxLQUFL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QUcseUJBQVksQ0FBQyxHQUFHLENBQUMsQ0FBQztnQkFBQyxNQUFNO1lBQzdELEtBQUssTUFBTTtnQkFBRSxNQUFNLENBQUMsS0FBSyxHQUFHLHVCQUFVLENBQUMsR0FBRyxDQUFDLENBQUM7Z0JBQUMsTUFBTTtZQUNuRCxLQUFLLE1BQU07Z0JBQUUsTUFBTSxDQUFDLEtBQUssR0FBRyx1QkFBVSxDQUFDLEdBQUcsQ0FBQyxDQUFDO2dCQUFDLE1BQU07WUFDbkQsS0FBSyxNQUFNO2dCQUFFLE1BQU0sQ0FBQyxRQUFRLEdBQUcsdUJBQVUsQ0FBQyxHQUFHLENBQUMsQ0FBQztnQkFBQyxNQUFNO1lBQ3RELEtBQUssTUFBTTtnQkFBRSxNQUFNLENBQUMsTUFBTSxHQUFHLHVCQUFVLENBQUMsR0FBRyxDQUFDLENBQUM7Z0JBQUMsTUFBTTtZQUNwRCxLQUFLLE1BQU07Z0JBQUUsTUFBTSxDQUFDLFFBQVEsR0FBRyx5QkFBWSxDQUFDLEdBQUcsQ0FBQyxDQUFDO2dCQUFDLE1BQU07WUFDeEQsS0FBSyxNQUFNO2dCQUFFLE1BQU0sQ0FBQyxJQUFJLEdBQUcsdUJBQVUsQ0FBQyxHQUFHLENBQUMsQ0FBQztnQkFBQyxNQUFNO1lBQ2xELEtBQUssTUFBTTtnQkFBRSxNQUFNLENBQUMsS0FBSyxHQUFHLHlCQUFZLENBQUMsR0FBRyxDQUFDLENBQUM7Z0JBQUMsTUFBTTtZQUNyRCxLQUFLLE1BQU07Z0JBQUUsTUFBTSxDQUFDLEtBQUssR0FBRyx5QkFBWSxDQUFDLEdBQUcsQ0FBQyxDQUFDO2dCQUFDLE1BQU07WUFDckQsS0FBSyxNQUFNO2dCQUFFLE1BQU0sQ0FBQyxLQUFLLEdBQUcsdUJBQVUsQ0FBQyxHQUFHLENBQUMsQ0FBQztnQkFBQyxNQUFNO1lBQ25ELEtBQUssTUFBTTtnQkFBRSxNQUFNLENBQUMsTUFBTSxHQUFHLHlCQUFZLENBQUMsR0FBRyxDQUFDLENBQUM7Z0JBQUMsTUFBTTtZQUN0RCxLQUFLLE1BQU07Z0JBQUUsTUFBTSxDQUFDLFFBQVEsR0FBRyx1QkFBVSxDQUFDLEdBQUcsQ0FBQyxDQUFDO2dC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Q0FBQztnQkFBQyxNQUFNO1lBQ3RELEtBQUssUUFBUTtnQkFBRSxNQUFNLENBQUMsSUFBSSxHQUFHLHVCQUFVLENBQUMsR0FBRyxFQUFFLEdBQUcsQ0FBQyxDQUFDO2dCQUFDLE1BQU07WUFDekQsS0FBSyxVQUFVO2dCQUFFLE1BQU0sQ0FBQyxJQUFJLEdBQUcseUJBQVksQ0FBQyxHQUFHLENBQUMsQ0FBQztnQkFBQyxNQUFNO1lBQ3hELEtBQUssTUFBTTtnQkFBRSxNQUFNLENBQUMsSUFBSSxHQUFHLHVCQUFVLENBQUMsR0FBRyxFQUFFLEdBQUcsQ0FBQyxDQUFDO2dCQUFDLE1BQU07WUFDdkQsS0FBSyxPQUFPO2dCQUFFLE1BQU0sQ0FBQyxJQUFJLEdBQUcseUJBQVksQ0FBQyxHQUFHLENBQUMsQ0FBQztnQkFBQyxNQUFNO1lBQ3JELEtBQUssT0FBTztnQkFBRSxNQUFNLENBQUMsSUFBSSxHQUFHLHlCQUFZLENBQUMsR0FBRyxDQUFDLENBQUM7Z0JBQUMsTUFBTTtZQUNyRCxLQUFLLE9BQU87Z0JBQUUsTUFBTSxDQUFDLElBQUksR0FBRyx1QkFBVSxDQUFDLEdBQUcsRUFBRSxHQUFHLENBQUMsQ0FBQztnQkFBQyxNQUFNO1lBQ3hELEtBQUssUUFBUTtnQkFBRSxNQUFNLENBQUMsSUFBSSxHQUFHLHlCQUFZLENBQUMsR0FBRyxDQUFDLENBQUM7Z0JBQUMsTUFBTTtZQUN0RCxLQUFLLFVBQVU7Z0JBQUUsTUFBTSxDQUFDLElBQUksR0FBRyx1QkFBVSxDQUFDLEdBQUcsRUFBRSxHQUFHLENBQUMsQ0FBQztnQkFBQyxNQUFNO1lBQzNELEtBQUssT0FBTztnQkFBRSxNQUFNLENBQUMsTUFBTSxDQUFDLEdBQUcseUJBQVksQ0FBQyxHQUFHLENBQUMsQ0FBQztnQkFBQyxNQUFNO1lBQ3hELEtBQUssU0FBUztnQkFBRSxNQUFNLENBQUMsSUFBSSxHQUFHLEVBQUUsTUFBTSxFQUFFLEdBQUcsQ0FBQyxJQUFJLEVBQUUsSUFBSSxFQUFFLEdBQUcsQ0FBQyxFQUFFLEVBQUUsQ0FBQztnQkFBQyxNQUFNO1lBQ3hFLEtBQUssT0FBTztnQkFBRSxNQUFNLENBQUMsS0FBSyxHQUFHLEVBQUUsSUFBSSxFQUFFLEdBQUcsQ0FBQyxDQUFDLEVBQUUsSUFBSSxFQUFFLEdBQUcsQ0FBQyxDQUFDLEVBQUUsQ0FBQztnQkFBQyxNQUFNO1lBQ2pFLEtBQUssUUFBUTtnQkFBRSxNQUFNLENBQUMsSUFBSSxHQUFHLEVBQUUsSUFBSSxFQUFFLHlCQUFZLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxFQUFFLElBQUksRUFBRSx5QkFBWSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDO2dCQUFDLE1BQU07WUFDN0YsS0FBSyxTQUFTLENBQUMsQ0FBQztnQkFDZixNQUFNLENBQUMsT0FBTyxLQUFLLE9BQU8sQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsR0FBRztvQkFDL0MsTUFBTSxFQUFHLEdBQXFCLENBQUMsSUFBSTtvQkFDbkMsTUFBTSxFQUFHLEdBQXFCLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxVQUFBLENBQUMsSUFBSSxPQUFBLENBQUMsRUFBRSxJQUFJLEVBQUUsQ0FBQyxDQUFDLENBQUMsRUFBRSxJQUFJLEVBQUUsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQTFCLENBQTBCLENBQUM7aUJBQ3pFLENBQUM7Z0JBQ0YsTUFBTTthQUNOO1lBQ0QsS0FBSyxVQUFVO2dCQUFFLE1BQU0sQ0FBQyxJQUFJLEdBQUcsaUJBQWlCLENBQUMsR0FBRyxDQUFDLENBQUM7Z0JBQUMsTUFBTTtZQUM3RCxLQUFLLFlBQVksQ0FBQztZQUNsQixLQUFLLFVBQVUsQ0FBQztZQUNoQixLQUFLLGVBQWUsQ0FBQztZQUNyQixLQUFLLFNBQVMsQ0FBQztZQUNmLEtBQUssY0FBYyxDQUFDO1lBQ3BCLEtBQUssZ0JBQWdCO2dCQUNwQixNQUFNLENBQUMsR0FBRyxDQUFDLEdBQUcsR0FBRyxDQUFDO2dCQUNsQixNQUFNO1lBQ1A7Z0JBQ0MsWUFBWSxJQUFJLE9BQU8sQ0FBQyxHQUFHLENBQUMsMEJBQXdCLEdBQUcsYUFBVSxFQUFFLEdBQUcsQ0FBQyxDQUFDO1NBQ3pFO0tBQ0Q7SUFFRCxPQUFPLE1BQU0sQ0FBQztBQUNmLENBQUMiLCJmaWxlIjoiYWRkaXRpb25hbEluZm8uanMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBmcm9tQnl0ZUFycmF5LCB0b0J5dGVBcnJheSB9IGZyb20gJ2Jhc2U2NC1qcyc7XG5pbXBvcnQgeyByZWFkRWZmZWN0cywgd3JpdGVFZmZlY3RzIH0gZnJvbSAnLi9lZmZlY3RzSGVscGVycyc7XG5pbXBvcnQgeyBjbGFtcCwgY3JlYXRlRW51bSwgbGF5ZXJDb2xvcnMsIE1PQ0tfSEFORExFUlMgfSBmcm9tICcuL2hlbHBlcnMnO1xuaW1wb3J0IHtcblx0TGF5ZXJBZGRpdGlvbmFsSW5mbywgTGF5ZXJFZmZlY3RTaGFkb3csIExheWVyRWZmZWN0c091dGVyR2xvdywgTGF5ZXJFZmZlY3RJbm5lckdsb3csIExheWVyRWZmZWN0QmV2ZWwsXG5cdExheWVyRWZmZWN0U29saWRGaWxsLCBMYXllckVmZmVjdFBhdHRlcm5PdmVybGF5LCBMYXllckVmZmVjdEdyYWRpZW50T3ZlcmxheSwgTGF5ZXJFZmZlY3RTYXRpbiwgRWZmZWN0Q29udG91cixcblx0RWZmZWN0Tm9pc2VHcmFkaWVudCwgQmV6aWVyUGF0aCwgUHNkLCBWZWN0b3JDb250ZW50LCBMYXllckVmZmVjdFN0cm9rZSwgRXh0cmFHcmFkaWVudEluZm8sIEVmZmVjdFBhdHRlcm4sXG5cdEV4dHJhUGF0dGVybkluZm8sIFJlYWRPcHRpb25zLCBCcmlnaHRuZXNzQWRqdXN0bWVudCwgRXhwb3N1cmVBZGp1c3RtZW50LCBWaWJyYW5jZUFkanVzdG1lbnQsXG5cdENvbG9yQmFsYW5jZUFkanVzdG1lbnQsIEJsYWNrQW5kV2hpdGVBZGp1c3RtZW50LCBQaG90b0ZpbHRlckFkanVzdG1lbnQsIENoYW5uZWxNaXhlckNoYW5uZWwsXG5cdENoYW5uZWxNaXhlckFkanVzdG1lbnQsIFBvc3Rlcml6ZUFkanVzdG1lbnQsIFRocmVzaG9sZEFkanVzdG1lbnQsIEdyYWRpZW50TWFwQWRqdXN0bWVudCwgQ01ZSyxcblx0U2VsZWN0aXZlQ29sb3JBZGp1c3RtZW50LCBDb2xvckxvb2t1cEFkanVzdG1lbnQsIExldmVsc0FkanVzdG1lbnRDaGFubmVsLCBMZXZlbHNBZGp1c3RtZW50LFxuXHRDdXJ2ZXNBZGp1c3RtZW50LCBDdXJ2ZXNBZGp1c3RtZW50Q2hhbm5lbCwgSHVlU2F0dXJhdGlvbkFkanVzdG1lbnQsIEh1ZVNhdHVyYXRpb25BZGp1c3RtZW50Q2hhbm5lbCxcblx0UHJlc2V0SW5mbywgQ29sb3IsIENvbG9yQmFsYW5jZVZhbHVlcywgV3JpdGVPcHRpb25zLCBMaW5rZWRGaWxlLCBQbGFjZWRMYXllclR5cGUsIFdhcnAsIEVmZmVjdFNvbGlkR3JhZGllbnQsXG5cdEtleURlc2NyaXB0b3JJdGVtLCBCb29sZWFuT3BlcmF0aW9uLCBMYXllckVmZmVjdHNJbmZvLCBBbm5vdGF0aW9uLFxufSBmcm9tICcuL3BzZCc7XG5pbXBvcnQge1xuXHRQc2RSZWFkZXIsIHJlYWRTaWduYXR1cmUsIHJlYWRVbmljb2RlU3RyaW5nLCBza2lwQnl0ZXMsIHJlYWRVaW50MzIsIHJlYWRVaW50OCwgcmVhZEZsb2F0NjQsIHJlYWRVaW50MTYsXG5cdHJlYWRCeXRlcywgcmVhZEludDE2LCBjaGVja1NpZ25hdHVyZSwgcmVhZEZsb2F0MzIsIHJlYWRGaXhlZFBvaW50UGF0aDMyLCByZWFkU2VjdGlvbiwgcmVhZENvbG9yLCByZWFkSW50MzIsXG5cdHJlYWRQYXNjYWxTdHJpbmcsIHJlYWRVbmljb2RlU3RyaW5nV2l0aExlbmd0aCwgcmVhZEFzY2lpU3RyaW5nLCByZWFkUGF0dGVybixcbn0gZnJvbSAnLi9wc2RSZWFkZXInO1xuaW1wb3J0IHtcblx0UHNkV3JpdGVyLCB3cml0ZVplcm9zLCB3cml0ZVNpZ25hdHVyZSwgd3JpdGVCeXRlcywgd3JpdGVVaW50MzIsIHdyaXRlVWludDE2LCB3cml0ZUZsb2F0NjQsIHdyaXRlVWludDgsXG5cdHdyaXRlSW50MTYsIHdyaXRlRmxvYXQzMiwgd3JpdGVGaXhlZFBvaW50UGF0aDMyLCB3cml0ZVVuaWNvZGVTdHJpbmcsIHdyaXRlU2VjdGlvbiwgd3JpdGVVbmljb2RlU3RyaW5nV2l0aFBhZGRpbmcsXG5cdHdyaXRlQ29sb3IsIHdyaXRlUGFzY2FsU3RyaW5nLCB3cml0ZUludDMyLFxufSBmcm9tICcuL3BzZFdyaXRlcic7XG5pbXBvcnQge1xuXHRBbm50LCBCRVNsLCBCRVNzLCBCRVRFLCBCbG5NLCBidmxULCBDbHJTLCBEZXNjaXB0b3JHcmFkaWVudCwgRGVzY3JpcHRvckNvbG9yLCBEZXNjcmlwdG9yR3JhZGllbnRDb250ZW50LFxuXHREZXNjcmlwdG9yUGF0dGVybkNvbnRlbnQsIERlc2NyaXB0b3JVbml0c1ZhbHVlLCBEZXNjcmlwdG9yVmVjdG9yQ29udGVudCwgRnJGbCwgRlN0bCwgR3JkVCwgSUdTciwgT3JudCxcblx0cGFyc2VBbmdsZSwgcGFyc2VQZXJjZW50LCBwYXJzZVBlcmNlbnRPckFuZ2xlLCBwYXJzZVVuaXRzLCBwYXJzZVVuaXRzT3JOdW1iZXIsIFF1aWx0V2FycERlc2NyaXB0b3IsIHJlYWRWZXJzaW9uQW5kRGVzY3JpcHRvciwgU3Ryb2tlRGVzY3JpcHRvcixcblx0c3Ryb2tlU3R5bGVMaW5lQWxpZ25tZW50LCBzdHJva2VTdHlsZUxpbmVDYXBUeXBlLCBzdHJva2VTdHlsZUxpbmVKb2luVHlwZSwgVGV4dERlc2NyaXB0b3IsIHRleHRHcmlkZGluZyxcblx0dW5pdHNBbmdsZSwgdW5pdHNQZXJjZW50LCB1bml0c1ZhbHVlLCBXYXJwRGVzY3JpcHRvciwgd2FycFN0eWxlLCB3cml0ZVZlcnNpb25BbmREZXNjcmlwdG9yXG59IGZyb20gJy4vZGVzY3JpcHRvcic7XG5pbXBvcnQgeyBzZXJpYWxpemVFbmdpbmVEYXRhLCBwYXJzZUVuZ2luZURhdGEgfSBmcm9tICcuL2VuZ2luZURhdGEnO1xuaW1wb3J0IHsgZW5jb2RlRW5naW5lRGF0YSwgZGVjb2RlRW5naW5lRGF0YSB9IGZyb20gJy4vdGV4dCc7XG5cbmV4cG9ydCBpbnRlcmZhY2UgRXh0ZW5kZWRXcml0ZU9wdGlvbnMgZXh0ZW5kcyBXcml0ZU9wdGlvbnMge1xuXHRsYXllcklkczogbnVtYmVyW107XG59XG5cbnR5cGUgSGFzTWV0aG9kID0gKHRhcmdldDogTGF5ZXJBZGRpdGlvbmFsSW5mbykgPT4gYm9vbGVhbjtcbnR5cGUgUmVhZE1ldGhvZCA9IChyZWFkZXI6IFBzZFJlYWRlciwgdGFyZ2V0OiBMYXllckFkZGl0aW9uYWxJbmZvLCBsZWZ0OiAoKSA9PiBudW1iZXIsIHBzZDogUHNkLCBvcHRpb25zOiBSZWFkT3B0aW9ucykgPT4gdm9pZDtcbnR5cGUgV3JpdGVNZXRob2QgPSAod3JpdGVyOiBQc2RXcml0ZXIsIHRhcmdldDogTGF5ZXJBZGRpdGlvbmFsSW5mbywgcHNkOiBQc2QsIG9wdGlvbnM6IEV4dGVuZGVkV3JpdGVPcHRpb25zKSA9PiB2b2lkO1xuXG5leHBvcnQgaW50ZXJmYWNlIEluZm9IYW5kbGVyIHtcblx0a2V5OiBzdHJpbmc7XG5cdGhhczogSGFzTWV0aG9kO1xuXHRyZWFkOiBSZWFkTWV0aG9kO1xuXHR3cml0ZTogV3JpdGVNZXRob2Q7XG59XG5cbmV4cG9ydCBjb25zdCBpbmZvSGFuZGxlcnM6IEluZm9IYW5kbGVyW10gPSBbXTtcbmV4cG9ydCBjb25zdCBpbmZvSGFuZGxlcnNNYXA6IHsgW2tleTogc3RyaW5nXTogSW5mb0hhbmRsZXIgfSA9IHt9O1xuXG5mdW5jdGlvbiBhZGRIYW5kbGVyKGtleTogc3RyaW5nLCBoYXM6IEhhc01ldGhvZCwgcmVhZDogUmVhZE1ldGhvZCwgd3JpdGU6IFdyaXRlTWV0aG9kKSB7XG5cdGNvbnN0IGhhbmRsZXI6IEluZm9IYW5kbGVyID0geyBrZXksIGhhcywgcmVhZCwgd3JpdGUgfTtcblx0aW5mb0hhbmRsZXJzLnB1c2goaGFuZGxlcik7XG5cdGluZm9IYW5kbGVyc01hcFtoYW5kbGVyLmtleV0gPSBoYW5kbGVyO1xufVxuXG5mdW5jdGlvbiBhZGRIYW5kbGVyQWxpYXMoa2V5OiBzdHJpbmcsIHRhcmdldDogc3RyaW5nKSB7XG5cdGluZm9IYW5kbGVyc01hcFtrZXldID0gaW5mb0hhbmRsZXJzTWFwW3RhcmdldF07XG59XG5cbmZ1bmN0aW9uIGhhc0tleShrZXk6IGtleW9mIExheWVyQWRkaXRpb25hbEluZm8pIHtcblx0cmV0dXJuICh0YXJnZXQ6IExheWVyQWRkaXRpb25hbEluZm8pID0+IHRhcmdldFtrZXldICE9PSB1bmRlZmluZWQ7XG59XG5cbmZ1bmN0aW9uIHJlYWRMZW5ndGg2NChyZWFkZXI6IFBzZFJlYWRlcikge1xuXHRpZiAocmVhZFVpbnQzMihyZWFkZXIpKSB0aHJvdyBuZXcgRXJyb3IoYFJlc291cmNlIHNpemUgYWJvdmUgNCBHQiBsaW1pdCBhdCAke3JlYWRlci5vZmZzZXQudG9TdHJpbmcoMTYpfWApO1xuXHRyZXR1cm4gcmVhZFVpbnQzMihyZWFkZXIpO1xufVxuXG5mdW5jdGlvbiB3cml0ZUxlbmd0aDY0KHdyaXRlcjogUHNkV3JpdGVyLCBsZW5ndGg6IG51bWJlcikge1xuXHR3cml0ZVVpbnQzMih3cml0ZXIsIDApO1xuXHR3cml0ZVVpbnQzMih3cml0ZXIsIGxlbmd0aCk7XG59XG5cbmFkZEhhbmRsZXIoXG5cdCdUeVNoJyxcblx0aGFzS2V5KCd0ZXh0JyksXG5cdChyZWFkZXIsIHRhcmdldCwgbGVmdEJ5dGVzKSA9PiB7XG5cdFx0aWYgKHJlYWRJbnQxNihyZWFkZXIpICE9PSAxKSB0aHJvdyBuZXcgRXJyb3IoYEludmFsaWQgVHlTaCB2ZXJzaW9uYCk7XG5cblx0XHRjb25zdCB0cmFuc2Zvcm06IG51bWJlcltdID0gW107XG5cdFx0Zm9yIChsZXQgaSA9IDA7IGkgPCA2OyBpKyspIHRyYW5zZm9ybS5wdXNoKHJlYWRGbG9hdDY0KHJlYWRlcikpO1xuXG5cdFx0aWYgKHJlYWRJbnQxNihyZWFkZXIpICE9PSA1MCkgdGhyb3cgbmV3IEVycm9yKGBJbnZhbGlkIFR5U2ggdGV4dCB2ZXJzaW9uYCk7XG5cdFx0Y29uc3QgdGV4dDogVGV4dERlc2NyaXB0b3IgPSByZWFkVmVyc2lvbkFuZERlc2NyaXB0b3IocmVhZGVyKTtcblxuXHRcdGlmIChyZWFkSW50MTYocmVhZGVyKSAhPT0gMSkgdGhyb3cgbmV3IEVycm9yKGBJbnZhbGlkIFR5U2ggd2FycCB2ZXJzaW9uYCk7XG5cdFx0Y29uc3Qgd2FycDogV2FycERlc2NyaXB0b3IgPSByZWFkVmVyc2lvbkFuZERlc2NyaXB0b3IocmVhZGVyKTtcblxuXHRcdHRhcmdldC50ZXh0ID0ge1xuXHRcdFx0dHJhbnNmb3JtLFxuXHRcdFx0bGVmdDogcmVhZEZsb2F0MzIocmVhZGVyKSxcblx0XHRcdHRvcDogcmVhZEZsb2F0MzIocmVhZGVyKSxcblx0XHRcdHJpZ2h0OiByZWFkRmxvYXQzMihyZWFkZXIpLFxuXHRcdFx0Ym90dG9tOiByZWFkRmxvYXQzMihyZWFkZXIpLFxuXHRcdFx0dGV4dDogdGV4dFsnVHh0ICddLnJlcGxhY2UoL1xcci9nLCAnXFxuJyksXG5cdFx0XHRpbmRleDogdGV4dC5UZXh0SW5kZXggfHwgMCxcblx0XHRcdGdyaWRkaW5nOiB0ZXh0R3JpZGRpbmcuZGVjb2RlKHRleHQudGV4dEdyaWRkaW5nKSxcblx0XHRcdGFudGlBbGlhczogQW5udC5kZWNvZGUodGV4dC5BbnRBKSxcblx0XHRcdG9yaWVudGF0aW9uOiBPcm50LmRlY29kZSh0ZXh0Lk9ybnQpLFxuXHRcdFx0d2FycDoge1xuXHRcdFx0XHRzdHlsZTogd2FycFN0eWxlLmRlY29kZSh3YXJwLndhcnBTdHlsZSksXG5cdFx0XHRcdHZhbHVlOiB3YXJwLndhcnBWYWx1ZSB8fCAwLFxuXHRcdFx0XHRwZXJzcGVjdGl2ZTogd2FycC53YXJwUGVyc3BlY3RpdmUgfHwgMCxcblx0XHRcdFx0cGVyc3BlY3RpdmVPdGhlcjogd2FycC53YXJwUGVyc3BlY3RpdmVPdGhlciB8fCAwLFxuXHRcdFx0XHRyb3RhdGU6IE9ybnQuZGVjb2RlKHdhcnAud2FycFJvdGF0ZSksXG5cdFx0XHR9LFxuXHRcdH07XG5cblx0XHRpZiAodGV4dC5FbmdpbmVEYXRhKSB7XG5cdFx0XHRjb25zdCBlbmdpbmVEYXRhID0gZGVjb2RlRW5naW5lRGF0YShwYXJzZUVuZ2luZURhdGEodGV4dC5FbmdpbmVEYXRhKSk7XG5cblx0XHRcdC8vIGNvbnN0IGJlZm9yZSA9IHBhcnNlRW5naW5lRGF0YSh0ZXh0LkVuZ2luZURhdGEpO1xuXHRcdFx0Ly8gY29uc3QgYWZ0ZXIgPSBlbmNvZGVFbmdpbmVEYXRhKGVuZ2luZURhdGEpO1xuXHRcdFx0Ly8gcmVxdWlyZSgnZnMnKS53cml0ZUZpbGVTeW5jKCdiZWZvcmUudHh0JywgcmVxdWlyZSgndXRpbCcpLmluc3BlY3QoYmVmb3JlLCBmYWxzZSwgOTksIGZhbHNlKSwgJ3V0ZjgnKTtcblx0XHRcdC8vIHJlcXVpcmUoJ2ZzJykud3JpdGVGaWxlU3luYygnYWZ0ZXIudHh0JywgcmVxdWlyZSgndXRpbCcpLmluc3BlY3QoYWZ0ZXIsIGZhbHNlLCA5OSwgZmFsc2UpLCAndXRmOCcpO1xuXG5cdFx0XHQvLyBjb25zb2xlLmxvZyhyZXF1aXJlKCd1dGlsJykuaW5zcGVjdChwYXJzZUVuZ2luZURhdGEodGV4dC5FbmdpbmVEYXRhKSwgZmFsc2UsIDk5LCB0cnVlKSk7XG5cdFx0XHR0YXJnZXQudGV4dCA9IHsgLi4udGFyZ2V0LnRleHQsIC4uLmVuZ2luZURhdGEgfTtcblx0XHRcdC8vIGNvbnNvbGUubG9nKHJlcXVpcmUoJ3V0aWwnKS5pbnNwZWN0KHRhcmdldC50ZXh0LCBmYWxzZSwgOTksIHRydWUpKTtcblx0XHR9XG5cblx0XHRza2lwQnl0ZXMocmVhZGVyLCBsZWZ0Qnl0ZXMoKSk7XG5cdH0sXG5cdCh3cml0ZXIsIHRhcmdldCkgPT4ge1xuXHRcdGNvbnN0IHRleHQgPSB0YXJnZXQudGV4dCE7XG5cdFx0Y29uc3Qgd2FycCA9IHRleHQud2FycCB8fCB7fTtcblx0XHRjb25zdCB0cmFuc2Zvcm0gPSB0ZXh0LnRyYW5zZm9ybSB8fCBbMSwgMCwgMCwgMSwgMCwgMF07XG5cblx0XHRjb25zdCB0ZXh0RGVzY3JpcHRvcjogVGV4dERlc2NyaXB0b3IgPSB7XG5cdFx0XHQnVHh0ICc6ICh0ZXh0LnRleHQgfHwgJycpLnJlcGxhY2UoL1xccj9cXG4vZywgJ1xccicpLFxuXHRcdFx0dGV4dEdyaWRkaW5nOiB0ZXh0R3JpZGRpbmcuZW5jb2RlKHRleHQuZ3JpZGRpbmcpLFxuXHRcdFx0T3JudDogT3JudC5lbmNvZGUodGV4dC5vcmllbnRhdGlvbiksXG5cdFx0XHRBbnRBOiBBbm50LmVuY29kZSh0ZXh0LmFudGlBbGlhcyksXG5cdFx0XHRUZXh0SW5kZXg6IHRleHQuaW5kZXggfHwgMCxcblx0XHRcdEVuZ2luZURhdGE6IHNlcmlhbGl6ZUVuZ2luZURhdGEoZW5jb2RlRW5naW5lRGF0YSh0ZXh0KSksXG5cdFx0fTtcblxuXHRcdHdyaXRlSW50MTYod3JpdGVyLCAxKTsgLy8gdmVyc2lvblxuXG5cdFx0Zm9yIChsZXQgaSA9IDA7IGkgPCA2OyBpKyspIHtcblx0XHRcdHdyaXRlRmxvYXQ2NCh3cml0ZXIsIHRyYW5zZm9ybVtpXSk7XG5cdFx0fVxuXG5cdFx0d3JpdGVJbnQxNih3cml0ZXIsIDUwKTsgLy8gdGV4dCB2ZXJzaW9uXG5cdFx0d3JpdGVWZXJzaW9uQW5kRGVzY3JpcHRvcih3cml0ZXIsICcnLCAnVHhMcicsIHRleHREZXNjcmlwdG9yKTtcblxuXHRcdHdyaXRlSW50MTYod3JpdGVyLCAxKTsgLy8gd2FycCB2ZXJzaW9uXG5cdFx0d3JpdGVWZXJzaW9uQW5kRGVzY3JpcHRvcih3cml0ZXIsICcnLCAnd2FycCcsIGVuY29kZVdhcnAod2FycCkpO1xuXG5cdFx0d3JpdGVGbG9hdDMyKHdyaXRlciwgdGV4dC5sZWZ0ISk7XG5cdFx0d3JpdGVGbG9hdDMyKHdyaXRlciwgdGV4dC50b3AhKTtcblx0XHR3cml0ZUZsb2F0MzIod3JpdGVyLCB0ZXh0LnJpZ2h0ISk7XG5cdFx0d3JpdGVGbG9hdDMyKHdyaXRlciwgdGV4dC5ib3R0b20hKTtcblxuXHRcdC8vIHdyaXRlWmVyb3Mod3JpdGVyLCAyKTtcblx0fSxcbik7XG5cbi8vIHZlY3RvciBmaWxsc1xuXG5hZGRIYW5kbGVyKFxuXHQnU29DbycsXG5cdHRhcmdldCA9PiB0YXJnZXQudmVjdG9yRmlsbCAhPT0gdW5kZWZpbmVkICYmIHRhcmdldC52ZWN0b3JTdHJva2UgPT09IHVuZGVmaW5lZCAmJlxuXHRcdHRhcmdldC52ZWN0b3JGaWxsLnR5cGUgPT09ICdjb2xvcicsXG5cdChyZWFkZXIsIHRhcmdldCkgPT4ge1xuXHRcdGNvbnN0IGRlc2NyaXB0b3IgPSByZWFkVmVyc2lvbkFuZERlc2NyaXB0b3IocmVhZGVyKTtcblx0XHR0YXJnZXQudmVjdG9yRmlsbCA9IHBhcnNlVmVjdG9yQ29udGVudChkZXNjcmlwdG9yKTtcblx0fSxcblx0KHdyaXRlciwgdGFyZ2V0KSA9PiB7XG5cdFx0Y29uc3QgeyBkZXNjcmlwdG9yIH0gPSBzZXJpYWxpemVWZWN0b3JDb250ZW50KHRhcmdldC52ZWN0b3JGaWxsISk7XG5cdFx0d3JpdGVWZXJzaW9uQW5kRGVzY3JpcHRvcih3cml0ZXIsICcnLCAnbnVsbCcsIGRlc2NyaXB0b3IpO1xuXHR9LFxuKTtcblxuYWRkSGFuZGxlcihcblx0J0dkRmwnLFxuXHR0YXJnZXQgPT4gdGFyZ2V0LnZlY3RvckZpbGwgIT09IHVuZGVmaW5lZCAmJiB0YXJnZXQudmVjdG9yU3Ryb2tlID09PSB1bmRlZmluZWQgJiZcblx0XHQodGFyZ2V0LnZlY3RvckZpbGwudHlwZSA9PT0gJ3NvbGlkJyB8fCB0YXJnZXQudmVjdG9yRmlsbC50eXBlID09PSAnbm9pc2UnKSxcblx0KHJlYWRlciwgdGFyZ2V0LCBsZWZ0KSA9PiB7XG5cdFx0Y29uc3QgZGVzY3JpcHRvciA9IHJlYWRWZXJzaW9uQW5kRGVzY3JpcHRvcihyZWFkZXIpO1xuXHRcdHRhcmdldC52ZWN0b3JGaWxsID0gcGFyc2VWZWN0b3JDb250ZW50KGRlc2NyaXB0b3IpO1xuXHRcdHNraXBCeXRlcyhyZWFkZXIsIGxlZnQoKSk7XG5cdH0sXG5cdCh3cml0ZXIsIHRhcmdldCkgPT4ge1xuXHRcdGNvbnN0IHsgZGVzY3JpcHRvciB9ID0gc2VyaWFsaXplVmVjdG9yQ29udGVudCh0YXJnZXQudmVjdG9yRmlsbCEpO1xuXHRcdHdyaXRlVmVyc2lvbkFuZERlc2NyaXB0b3Iod3JpdGVyLCAnJywgJ251bGwnLCBkZXNjcmlwdG9yKTtcblx0fSxcbik7XG5cbmFkZEhhbmRsZXIoXG5cdCdQdEZsJyxcblx0dGFyZ2V0ID0+IHRhcmdldC52ZWN0b3JGaWxsICE9PSB1bmRlZmluZWQgJiYgdGFyZ2V0LnZlY3RvclN0cm9rZSA9PT0gdW5kZWZpbmVkICYmXG5cdFx0dGFyZ2V0LnZlY3RvckZpbGwudHlwZSA9PT0gJ3BhdHRlcm4nLFxuXHQocmVhZGVyLCB0YXJnZXQpID0+IHtcblx0XHRjb25zdCBkZXNjcmlwdG9yID0gcmVhZFZlcnNpb25BbmREZXNjcmlwdG9yKHJlYWRlcik7XG5cdFx0dGFyZ2V0LnZlY3RvckZpbGwgPSBwYXJzZVZlY3RvckNvbnRlbnQoZGVzY3JpcHRvcik7XG5cdH0sXG5cdCh3cml0ZXIsIHRhcmdldCkgPT4ge1xuXHRcdGNvbnN0IHsgZGVzY3JpcHRvciB9ID0gc2VyaWFsaXplVmVjdG9yQ29udGVudCh0YXJnZXQudmVjdG9yRmlsbCEpO1xuXHRcdHdyaXRlVmVyc2lvbkFuZERlc2NyaXB0b3Iod3JpdGVyLCAnJywgJ251bGwnLCBkZXNjcmlwdG9yKTtcblx0fSxcbik7XG5cbmFkZEhhbmRsZXIoXG5cdCd2c2NnJyxcblx0dGFyZ2V0ID0+IHRhcmdldC52ZWN0b3JGaWxsICE9PSB1bmRlZmluZWQgJiYgdGFyZ2V0LnZlY3RvclN0cm9rZSAhPT0gdW5kZWZpbmVkLFxuXHQocmVhZGVyLCB0YXJnZXQsIGxlZnQpID0+IHtcblx0XHRyZWFkU2lnbmF0dXJlKHJlYWRlcik7IC8vIGtleVxuXHRcdGNvbnN0IGRlc2MgPSByZWFkVmVyc2lvbkFuZERlc2NyaXB0b3IocmVhZGVyKTtcblx0XHR0YXJnZXQudmVjdG9yRmlsbCA9IHBhcnNlVmVjdG9yQ29udGVudChkZXNjKTtcblx0XHRza2lwQnl0ZXMocmVhZGVyLCBsZWZ0KCkpO1xuXHR9LFxuXHQod3JpdGVyLCB0YXJnZXQpID0+IHtcblx0XHRjb25zdCB7IGRlc2NyaXB0b3IsIGtleSB9ID0gc2VyaWFsaXplVmVjdG9yQ29udGVudCh0YXJnZXQudmVjdG9yRmlsbCEpO1xuXHRcdHdyaXRlU2lnbmF0dXJlKHdyaXRlciwga2V5KTtcblx0XHR3cml0ZVZlcnNpb25BbmREZXNjcmlwdG9yKHdyaXRlciwgJycsICdudWxsJywgZGVzY3JpcHRvcik7XG5cdH0sXG4pO1xuXG5mdW5jdGlvbiByZWFkQmV6aWVyS25vdChyZWFkZXI6IFBzZFJlYWRlciwgd2lkdGg6IG51bWJlciwgaGVpZ2h0OiBudW1iZXIpIHtcblx0Y29uc3QgeTAgPSByZWFkRml4ZWRQb2ludFBhdGgzMihyZWFkZXIpICogaGVpZ2h0O1xuXHRjb25zdCB4MCA9IHJlYWRGaXhlZFBvaW50UGF0aDMyKHJlYWRlcikgKiB3aWR0aDtcblx0Y29uc3QgeTEgPSByZWFkRml4ZWRQb2ludFBhdGgzMihyZWFkZXIpICogaGVpZ2h0O1xuXHRjb25zdCB4MSA9IHJlYWRGaXhlZFBvaW50UGF0aDMyKHJlYWRlcikgKiB3aWR0aDtcblx0Y29uc3QgeTIgPSByZWFkRml4ZWRQb2ludFBhdGgzMihyZWFkZXIpICogaGVpZ2h0O1xuXHRjb25zdCB4MiA9IHJlYWRGaXhlZFBvaW50UGF0aDMyKHJlYWRlcikgKiB3aWR0aDtcblx0cmV0dXJuIFt4MCwgeTAsIHgxLCB5MSwgeDIsIHkyXTtcbn1cblxuZnVuY3Rpb24gd3JpdGVCZXppZXJLbm90KHdyaXRlcjogUHNkV3JpdGVyLCBwb2ludHM6IG51bWJlcltdLCB3aWR0aDogbnVtYmVyLCBoZWlnaHQ6IG51bWJlcikge1xuXHR3cml0ZUZpeGVkUG9pbnRQYXRoMzIod3JpdGVyLCBwb2ludHNbMV0gLyBoZWlnaHQpOyAvLyB5MFxuXHR3cml0ZUZpeGVkUG9pbnRQYXRoMzIod3JpdGVyLCBwb2ludHNbMF0gLyB3aWR0aCk7IC8vIHgwXG5cdHdyaXRlRml4ZWRQb2ludFBhdGgzMih3cml0ZXIsIHBvaW50c1szXSAvIGhlaWdodCk7IC8vIHkxXG5cdHdyaXRlRml4ZWRQb2ludFBhdGgzMih3cml0ZXIsIHBvaW50c1syXSAvIHdpZHRoKTsgLy8geDFcblx0d3JpdGVGaXhlZFBvaW50UGF0aDMyKHdyaXRlciwgcG9pbnRzWzVdIC8gaGVpZ2h0KTsgLy8geTJcblx0d3JpdGVGaXhlZFBvaW50UGF0aDMyKHdyaXRlciwgcG9pbnRzWzRdIC8gd2lkdGgpOyAvLyB4MlxufVxuXG5jb25zdCBib29sZWFuT3BlcmF0aW9uczogQm9vbGVhbk9wZXJhdGlvbltdID0gWydleGNsdWRlJywgJ2NvbWJpbmUnLCAnc3VidHJhY3QnLCAnaW50ZXJzZWN0J107XG5cbmFkZEhhbmRsZXIoXG5cdCd2bXNrJyxcblx0aGFzS2V5KCd2ZWN0b3JNYXNrJyksXG5cdChyZWFkZXIsIHRhcmdldCwgbGVmdCwgeyB3aWR0aCwgaGVpZ2h0IH0pID0+IHtcblx0XHRpZiAocmVhZFVpbnQzMihyZWFkZXIpICE9PSAzKSB0aHJvdyBuZXcgRXJyb3IoJ0ludmFsaWQgdm1zayB2ZXJzaW9uJyk7XG5cblx0XHR0YXJnZXQudmVjdG9yTWFzayA9IHsgcGF0aHM6IFtdIH07XG5cdFx0Y29uc3QgdmVjdG9yTWFzayA9IHRhcmdldC52ZWN0b3JNYXNrO1xuXG5cdFx0Y29uc3QgZmxhZ3MgPSByZWFkVWludDMyKHJlYWRlcik7XG5cdFx0dmVjdG9yTWFzay5pbnZlcnQgPSAoZmxhZ3MgJiAxKSAhPT0gMDtcblx0XHR2ZWN0b3JNYXNrLm5vdExpbmsgPSAoZmxhZ3MgJiAyKSAhPT0gMDtcblx0XHR2ZWN0b3JNYXNrLmRpc2FibGUgPSAoZmxhZ3MgJiA0KSAhPT0gMDtcblxuXHRcdGNvbnN0IHBhdGhzID0gdmVjdG9yTWFzay5wYXRocztcblx0XHRsZXQgcGF0aDogQmV6aWVyUGF0aCB8IHVuZGVmaW5lZCA9IHVuZGVmaW5lZDtcblxuXHRcdHdoaWxlIChsZWZ0KCkgPj0gMjYpIHtcblx0XHRcdGNvbnN0IHNlbGVjdG9yID0gcmVhZFVpbnQxNihyZWFkZXIpO1xuXG5cdFx0XHRzd2l0Y2ggKHNlbGVjdG9yKSB7XG5cdFx0XHRcdGNhc2UgMDogLy8gQ2xvc2VkIHN1YnBhdGggbGVuZ3RoIHJlY29yZFxuXHRcdFx0XHRjYXNlIDM6IHsgLy8gT3BlbiBzdWJwYXRoIGxlbmd0aCByZWNvcmRcblx0XHRcdFx0XHRyZWFkVWludDE2KHJlYWRlcik7IC8vIGNvdW50XG5cdFx0XHRcdFx0Y29uc3QgYm9vbE9wID0gcmVhZFVpbnQxNihyZWFkZXIpO1xuXHRcdFx0XHRcdHJlYWRVaW50MTYocmVhZGVyKTsgLy8gYWx3YXlzIDEgP1xuXHRcdFx0XHRcdHNraXBCeXRlcyhyZWFkZXIsIDE4KTtcblx0XHRcdFx0XHRwYXRoID0geyBvcGVuOiBzZWxlY3RvciA9PT0gMywgb3BlcmF0aW9uOiBib29sZWFuT3BlcmF0aW9uc1tib29sT3BdLCBrbm90czogW10gfTtcblx0XHRcdFx0XHRwYXRocy5wdXNoKHBhdGgpO1xuXHRcdFx0XHRcdGJyZWFrO1xuXHRcdFx0XHR9XG5cdFx0XHRcdGNhc2UgMTogLy8gQ2xvc2VkIHN1YnBhdGggQmV6aWVyIGtub3QsIGxpbmtlZFxuXHRcdFx0XHRjYXNlIDI6IC8vIENsb3NlZCBzdWJwYXRoIEJlemllciBrbm90LCB1bmxpbmtlZFxuXHRcdFx0XHRjYXNlIDQ6IC8vIE9wZW4gc3VicGF0aCBCZXppZXIga25vdCwgbGlua2VkXG5cdFx0XHRcdGNhc2UgNTogLy8gT3BlbiBzdWJwYXRoIEJlemllciBrbm90LCB1bmxpbmtlZFxuXHRcdFx0XHRcdHBhdGghLmtub3RzLnB1c2goeyBsaW5rZWQ6IChzZWxlY3RvciA9PT0gMSB8fCBzZWxlY3RvciA9PT0gNCksIHBvaW50czogcmVhZEJlemllcktub3QocmVhZGVyLCB3aWR0aCwgaGVpZ2h0KSB9KTtcblx0XHRcdFx0XHRicmVhaztcblx0XHRcdFx0Y2FzZSA2OiAvLyBQYXRoIGZpbGwgcnVsZSByZWNvcmRcblx0XHRcdFx0XHRza2lwQnl0ZXMocmVhZGVyLCAyNCk7XG5cdFx0XHRcdFx0YnJlYWs7XG5cdFx0XHRcdGNhc2UgNzogeyAvLyBDbGlwYm9hcmQgcmVjb3JkXG5cdFx0XHRcdFx0Ly8gVE9ETzogY2hlY2sgaWYgdGhlc2UgbmVlZCB0byBiZSBtdWx0aXBsaWVkIGJ5IGRvY3VtZW50IHNpemVcblx0XHRcdFx0XHRjb25zdCB0b3AgPSByZWFkRml4ZWRQb2ludFBhdGgzMihyZWFkZXIpO1xuXHRcdFx0XHRcdGNvbnN0IGxlZnQgPSByZWFkRml4ZWRQb2ludFBhdGgzMihyZWFkZXIpO1xuXHRcdFx0XHRcdGNvbnN0IGJvdHRvbSA9IHJlYWRGaXhlZFBvaW50UGF0aDMyKHJlYWRlcik7XG5cdFx0XHRcdFx0Y29uc3QgcmlnaHQgPSByZWFkRml4ZWRQb2ludFBhdGgzMihyZWFkZXIpO1xuXHRcdFx0XHRcdGNvbnN0IHJlc29sdXRpb24gPSByZWFkRml4ZWRQb2ludFBhdGgzMihyZWFkZXIpO1xuXHRcdFx0XHRcdHNraXBCeXRlcyhyZWFkZXIsIDQpO1xuXHRcdFx0XHRcdHZlY3Rvck1hc2suY2xpcGJvYXJkID0geyB0b3AsIGxlZnQsIGJvdHRvbSwgcmlnaHQsIHJlc29sdXRpb24gfTtcblx0XHRcdFx0XHRicmVhaztcblx0XHRcdFx0fVxuXHRcdFx0XHRjYXNlIDg6IC8vIEluaXRpYWwgZmlsbCBydWxlIHJlY29yZFxuXHRcdFx0XHRcdHZlY3Rvck1hc2suZmlsbFN0YXJ0c1dpdGhBbGxQaXhlbHMgPSAhIXJlYWRVaW50MTYocmVhZGVyKTtcblx0XHRcdFx0XHRza2lwQnl0ZXMocmVhZGVyLCAyMik7XG5cdFx0XHRcdFx0YnJlYWs7XG5cdFx0XHRcdGRlZmF1bHQ6IHRocm93IG5ldyBFcnJvcignSW52YWxpZCB2bXNrIHNlY3Rpb24nKTtcblx0XHRcdH1cblx0XHR9XG5cblx0XHQvLyBjb25zdCBjYW52YXMgPSByZXF1aXJlKCdjYW52YXMnKS5jcmVhdGVDYW52YXMod2lkdGgsIGhlaWdodCk7XG5cdFx0Ly8gY29uc3QgY29udGV4dCA9IGNhbnZhcy5nZXRDb250ZXh0KCcyZCcpITtcblx0XHQvLyBjb250ZXh0LmZpbGxTdHlsZSA9ICdyZWQnO1xuXHRcdC8vIGZvciAoY29uc3QgcGF0aCBvZiBwYXRocykge1xuXHRcdC8vIFx0Y29udGV4dC5iZWdpblBhdGgoKTtcblx0XHQvLyBcdGNvbnRleHQubW92ZVRvKHBhdGgua25vdHNbMF0ucG9pbnRzWzJdLCBwYXRoLmtub3RzWzBdLnBvaW50c1szXSk7XG5cdFx0Ly8gXHRmb3IgKGxldCBpID0gMTsgaSA8IHBhdGgua25vdHMubGVuZ3RoOyBpKyspIHtcblx0XHQvLyBcdFx0Y29uc29sZS5sb2cocGF0aC5rbm90c1tpXS5wb2ludHMubWFwKHggPT4geC50b0ZpeGVkKDIpKSk7XG5cdFx0Ly8gXHRcdGNvbnRleHQuYmV6aWVyQ3VydmVUbyhcblx0XHQvLyBcdFx0XHRwYXRoLmtub3RzW2kgLSAxXS5wb2ludHNbNF0sIHBhdGgua25vdHNbaSAtIDFdLnBvaW50c1s1XSxcblx0XHQvLyBcdFx0XHRwYXRoLmtub3RzW2ldLnBvaW50c1swXSwgcGF0aC5rbm90c1tpXS5wb2ludHNbMV0sIHBhdGgua25vdHNbaV0ucG9pbnRzWzJdLCBwYXRoLmtub3RzW2ldLnBvaW50c1szXSk7XG5cdFx0Ly8gXHR9XG5cdFx0Ly8gXHRpZiAoIXBhdGgub3BlbikgY29udGV4dC5jbG9zZVBhdGgoKTtcblx0XHQvLyBcdGNvbnRleHQuZmlsbCgpO1xuXHRcdC8vIH1cblx0XHQvLyByZXF1aXJlKCdmcycpLndyaXRlRmlsZVN5bmMoJ291dC5wbmcnLCBjYW52YXMudG9CdWZmZXIoKSk7XG5cblx0XHRza2lwQnl0ZXMocmVhZGVyLCBsZWZ0KCkpO1xuXHR9LFxuXHQod3JpdGVyLCB0YXJnZXQsIHsgd2lkdGgsIGhlaWdodCB9KSA9PiB7XG5cdFx0Y29uc3QgdmVjdG9yTWFzayA9IHRhcmdldC52ZWN0b3JNYXNrITtcblx0XHRjb25zdCBmbGFncyA9XG5cdFx0XHQodmVjdG9yTWFzay5pbnZlcnQgPyAxIDogMCkgfFxuXHRcdFx0KHZlY3Rvck1hc2subm90TGluayA/IDIgOiAwKSB8XG5cdFx0XHQodmVjdG9yTWFzay5kaXNhYmxlID8gNCA6IDApO1xuXG5cdFx0d3JpdGVVaW50MzIod3JpdGVyLCAzKTsgLy8gdmVyc2lvblxuXHRcdHdyaXRlVWludDMyKHdyaXRlciwgZmxhZ3MpO1xuXG5cdFx0Ly8gaW5pdGlhbCBlbnRyeVxuXHRcdHdyaXRlVWludDE2KHdyaXRlciwgNik7XG5cdFx0d3JpdGVaZXJvcyh3cml0ZXIsIDI0KTtcblxuXHRcdGNvbnN0IGNsaXBib2FyZCA9IHZlY3Rvck1hc2suY2xpcGJvYXJkO1xuXHRcdGlmIChjbGlwYm9hcmQpIHtcblx0XHRcdHdyaXRlVWludDE2KHdyaXRlciwgNyk7XG5cdFx0XHR3cml0ZUZpeGVkUG9pbnRQYXRoMzIod3JpdGVyLCBjbGlwYm9hcmQudG9wKTtcblx0XHRcdHdyaXRlRml4ZWRQb2ludFBhdGgzMih3cml0ZXIsIGNsaXBib2FyZC5sZWZ0KTtcblx0XHRcdHdyaXRlRml4ZWRQb2ludFBhdGgzMih3cml0ZXIsIGNsaXBib2FyZC5ib3R0b20pO1xuXHRcdFx0d3JpdGVGaXhlZFBvaW50UGF0aDMyKHdyaXRlciwgY2xpcGJvYXJkLnJpZ2h0KTtcblx0XHRcdHdyaXRlRml4ZWRQb2ludFBhdGgzMih3cml0ZXIsIGNsaXBib2FyZC5yZXNvbHV0aW9uKTtcblx0XHRcdHdyaXRlWmVyb3Mod3JpdGVyLCA0KTtcblx0XHR9XG5cblx0XHRpZiAodmVjdG9yTWFzay5maWxsU3RhcnRzV2l0aEFsbFBpeGVscyAhPT0gdW5kZWZpbmVkKSB7XG5cdFx0XHR3cml0ZVVpbnQxNih3cml0ZXIsIDgpO1xuXHRcdFx0d3JpdGVVaW50MTYod3JpdGVyLCB2ZWN0b3JNYXNrLmZpbGxTdGFydHNXaXRoQWxsUGl4ZWxzID8gMSA6IDApO1xuXHRcdFx0d3JpdGVaZXJvcyh3cml0ZXIsIDIyKTtcblx0XHR9XG5cblx0XHRmb3IgKGNvbnN0IHBhdGggb2YgdmVjdG9yTWFzay5wYXRocykge1xuXHRcdFx0d3JpdGVVaW50MTYod3JpdGVyLCBwYXRoLm9wZW4gPyAzIDogMCk7XG5cdFx0XHR3cml0ZVVpbnQxNih3cml0ZXIsIHBhdGgua25vdHMubGVuZ3RoKTtcblx0XHRcdHdyaXRlVWludDE2KHdyaXRlciwgTWF0aC5hYnMoYm9vbGVhbk9wZXJhdGlvbnMuaW5kZXhPZihwYXRoLm9wZXJhdGlvbikpKTsgLy8gZGVmYXVsdCB0byAxIGlmIG5vdCBmb3VuZFxuXHRcdFx0d3JpdGVVaW50MTYod3JpdGVyLCAxKTtcblx0XHRcdHdyaXRlWmVyb3Mod3JpdGVyLCAxOCk7IC8vIFRPRE86IHRoZXNlIGFyZSBzb21ldGltZXMgbm9uLXplcm9cblxuXHRcdFx0Y29uc3QgbGlua2VkS25vdCA9IHBhdGgub3BlbiA/IDQgOiAxO1xuXHRcdFx0Y29uc3QgdW5saW5rZWRLbm90ID0gcGF0aC5vcGVuID8gNSA6IDI7XG5cblx0XHRcdGZvciAoY29uc3QgeyBsaW5rZWQsIHBvaW50cyB9IG9mIHBhdGgua25vdHMpIHtcblx0XHRcdFx0d3JpdGVVaW50MTYod3JpdGVyLCBsaW5rZWQgPyBsaW5rZWRLbm90IDogdW5saW5rZWRLbm90KTtcblx0XHRcdFx0d3JpdGVCZXppZXJLbm90KHdyaXRlciwgcG9pbnRzLCB3aWR0aCwgaGVpZ2h0KTtcblx0XHRcdH1cblx0XHR9XG5cdH0sXG4pO1xuXG4vLyBUT0RPOiBuZWVkIHRvIHdyaXRlIHZtc2sgaWYgaGFzIG91dGxpbmUgP1xuYWRkSGFuZGxlckFsaWFzKCd2c21zJywgJ3Ztc2snKTtcbi8vIGFkZEhhbmRsZXJBbGlhcygndm1zaycsICd2c21zJyk7XG5cbmludGVyZmFjZSBWb2drRGVzY3JpcHRvciB7XG5cdGtleURlc2NyaXB0b3JMaXN0OiB7XG5cdFx0a2V5U2hhcGVJbnZhbGlkYXRlZD86IGJvb2xlYW47XG5cdFx0a2V5T3JpZ2luVHlwZT86IG51bWJlcjtcblx0XHRrZXlPcmlnaW5SZXNvbHV0aW9uPzogbnVtYmVyO1xuXHRcdGtleU9yaWdpblJSZWN0UmFkaWk/OiB7XG5cdFx0XHR1bml0VmFsdWVRdWFkVmVyc2lvbjogbnVtYmVyO1xuXHRcdFx0dG9wUmlnaHQ6IERlc2NyaXB0b3JVbml0c1ZhbHVlO1xuXHRcdFx0dG9wTGVmdDogRGVzY3JpcHRvclVuaXRzVmFsdWU7XG5cdFx0XHRib3R0b21MZWZ0OiBEZXNjcmlwdG9yVW5pdHNWYWx1ZTtcblx0XHRcdGJvdHRvbVJpZ2h0OiBEZXNjcmlwdG9yVW5pdHNWYWx1ZTtcblx0XHR9O1xuXHRcdGtleU9yaWdpblNoYXBlQkJveD86IHtcblx0XHRcdHVuaXRWYWx1ZVF1YWRWZXJzaW9uOiBudW1iZXI7XG5cdFx0XHQnVG9wICc6IERlc2NyaXB0b3JVbml0c1ZhbHVlO1xuXHRcdFx0TGVmdDogRGVzY3JpcHRvclVuaXRzVmFsdWU7XG5cdFx0XHRCdG9tOiBEZXNjcmlwdG9yVW5pdHNWYWx1ZTtcblx0XHRcdFJnaHQ6IERlc2NyaXB0b3JVbml0c1ZhbHVlO1xuXHRcdH07XG5cdFx0a2V5T3JpZ2luQm94Q29ybmVycz86IHtcblx0XHRcdHJlY3RhbmdsZUNvcm5lckE6IHsgSHJ6bjogbnVtYmVyOyBWcnRjOiBudW1iZXI7IH07XG5cdFx0XHRyZWN0YW5nbGVDb3JuZXJCOiB7IEhyem46IG51bWJlcjsgVnJ0YzogbnVtYmVyOyB9O1xuXHRcdFx0cmVjdGFuZ2xlQ29ybmVyQzogeyBIcnpuOiBudW1iZXI7IFZydGM6IG51bWJlcjsgfTtcblx0XHRcdHJlY3RhbmdsZUNvcm5lckQ6IHsgSHJ6bjogbnVtYmVyOyBWcnRjOiBudW1iZXI7IH07XG5cdFx0fTtcblx0XHRUcm5mPzogeyB4eDogbnVtYmVyOyB4eTogbnVtYmVyOyB5eDogbnVtYmVyOyB5eTogbnVtYmVyOyB0eDogbnVtYmVyOyB0eTogbnVtYmVyOyB9LFxuXHRcdGtleU9yaWdpbkluZGV4OiBudW1iZXI7XG5cdH1bXTtcbn1cblxuYWRkSGFuZGxlcihcblx0J3ZvZ2snLFxuXHRoYXNLZXkoJ3ZlY3Rvck9yaWdpbmF0aW9uJyksXG5cdChyZWFkZXIsIHRhcmdldCwgbGVmdCkgPT4ge1xuXHRcdGlmIChyZWFkSW50MzIocmVhZGVyKSAhPT0gMSkgdGhyb3cgbmV3IEVycm9yKGBJbnZhbGlkIHZvZ2sgdmVyc2lvbmApO1xuXHRcdGNvbnN0IGRlc2MgPSByZWFkVmVyc2lvbkFuZERlc2NyaXB0b3IocmVhZGVyKSBhcyBWb2drRGVzY3JpcHRvcjtcblx0XHQvLyBjb25zb2xlLmxvZyhyZXF1aXJlKCd1dGlsJykuaW5zcGVjdChkZXNjLCBmYWxzZSwgOTksIHRydWUpKTtcblxuXHRcdHRhcmdldC52ZWN0b3JPcmlnaW5hdGlvbiA9IHsga2V5RGVzY3JpcHRvckxpc3Q6IFtdIH07XG5cblx0XHRmb3IgKGNvbnN0IGkgb2YgZGVzYy5rZXlEZXNjcmlwdG9yTGlzdCkge1xuXHRcdFx0Y29uc3QgaXRlbTogS2V5RGVzY3JpcHRvckl0ZW0gPSB7fTtcblxuXHRcdFx0aWYgKGkua2V5U2hhcGVJbnZhbGlkYXRlZCAhPSBudWxsKSBpdGVtLmtleVNoYXBlSW52YWxpZGF0ZWQgPSBpLmtleVNoYXBlSW52YWxpZGF0ZWQ7XG5cdFx0XHRpZiAoaS5rZXlPcmlnaW5UeXBlICE9IG51bGwpIGl0ZW0ua2V5T3JpZ2luVHlwZSA9IGkua2V5T3JpZ2luVHlwZTtcblx0XHRcdGlmIChpLmtleU9yaWdpblJlc29sdXRpb24gIT0gbnVsbCkgaXRlbS5rZXlPcmlnaW5SZXNvbHV0aW9uID0gaS5rZXlPcmlnaW5SZXNvbHV0aW9uO1xuXHRcdFx0aWYgKGkua2V5T3JpZ2luU2hhcGVCQm94KSB7XG5cdFx0XHRcdGl0ZW0ua2V5T3JpZ2luU2hhcGVCb3VuZGluZ0JveCA9IHtcblx0XHRcdFx0XHR0b3A6IHBhcnNlVW5pdHMoaS5rZXlPcmlnaW5TaGFwZUJCb3hbJ1RvcCAnXSksXG5cdFx0XHRcdFx0bGVmdDogcGFyc2VVbml0cyhpLmtleU9yaWdpblNoYXBlQkJveC5MZWZ0KSxcblx0XHRcdFx0XHRib3R0b206IHBhcnNlVW5pdHMoaS5rZXlPcmlnaW5TaGFwZUJCb3guQnRvbSksXG5cdFx0XHRcdFx0cmlnaHQ6IHBhcnNlVW5pdHMoaS5rZXlPcmlnaW5TaGFwZUJCb3guUmdodCksXG5cdFx0XHRcdH07XG5cdFx0XHR9XG5cdFx0XHRpZiAoaS5rZXlPcmlnaW5SUmVjdFJhZGlpKSB7XG5cdFx0XHRcdGl0ZW0ua2V5T3JpZ2luUlJlY3RSYWRpaSA9IHtcblx0XHRcdFx0XHR0b3BSaWdodDogcGFyc2VVbml0cyhpLmtleU9yaWdpblJSZWN0UmFkaWkudG9wUmlnaHQpLFxuXHRcdFx0XHRcdHRvcExlZnQ6IHBhcnNlVW5pdHMoaS5rZXlPcmlnaW5SUmVjdFJhZGlpLnRvcExlZnQpLFxuXHRcdFx0XHRcdGJvdHRvbUxlZnQ6IHBhcnNlVW5pdHMoaS5rZXlPcmlnaW5SUmVjdFJhZGlpLmJvdHRvbUxlZnQpLFxuXHRcdFx0XHRcdGJvdHRvbVJpZ2h0OiBwYXJzZVVuaXRzKGkua2V5T3JpZ2luUlJlY3RSYWRpaS5ib3R0b21SaWdodCksXG5cdFx0XHRcdH07XG5cdFx0XHR9XG5cdFx0XHRpZiAoaS5rZXlPcmlnaW5Cb3hDb3JuZXJzKSB7XG5cdFx0XHRcdGl0ZW0ua2V5T3JpZ2luQm94Q29ybmVycyA9IFtcblx0XHRcdFx0XHR7IHg6IGkua2V5T3JpZ2luQm94Q29ybmVycy5yZWN0YW5nbGVDb3JuZXJBLkhyem4sIHk6IGkua2V5T3JpZ2luQm94Q29ybmVycy5yZWN0YW5nbGVDb3JuZXJBLlZydGMgfSxcblx0XHRcdFx0XHR7IHg6IGkua2V5T3JpZ2luQm94Q29ybmVycy5yZWN0YW5nbGVDb3JuZXJCLkhyem4sIHk6IGkua2V5T3JpZ2luQm94Q29ybmVycy5yZWN0YW5nbGVDb3JuZXJCLlZydGMgfSxcblx0XHRcdFx0XHR7IHg6IGkua2V5T3JpZ2luQm94Q29ybmVycy5yZWN0YW5nbGVDb3JuZXJDLkhyem4sIHk6IGkua2V5T3JpZ2luQm94Q29ybmVycy5yZWN0YW5nbGVDb3JuZXJDLlZydGMgfSxcblx0XHRcdFx0XHR7IHg6IGkua2V5T3JpZ2luQm94Q29ybmVycy5yZWN0YW5nbGVDb3JuZXJELkhyem4sIHk6IGkua2V5T3JpZ2luQm94Q29ybmVycy5yZWN0YW5nbGVDb3JuZXJELlZydGMgfSxcblx0XHRcdFx0XTtcblx0XHRcdH1cblx0XHRcdGlmIChpLlRybmYpIHtcblx0XHRcdFx0aXRlbS50cmFuc2Zvcm0gPSBbaS5Ucm5mLnh4LCBpLlRybmYueHksIGkuVHJuZi54eSwgaS5Ucm5mLnl5LCBpLlRybmYudHgsIGkuVHJuZi50eV07XG5cdFx0XHR9XG5cblx0XHRcdHRhcmdldC52ZWN0b3JPcmlnaW5hdGlvbi5rZXlEZXNjcmlwdG9yTGlzdC5wdXNoKGl0ZW0pO1xuXHRcdH1cblxuXHRcdHNraXBCeXRlcyhyZWFkZXIsIGxlZnQoKSk7XG5cdH0sXG5cdCh3cml0ZXIsIHRhcmdldCkgPT4ge1xuXHRcdHRhcmdldDtcblx0XHRjb25zdCBvcmlnID0gdGFyZ2V0LnZlY3Rvck9yaWdpbmF0aW9uITtcblx0XHRjb25zdCBkZXNjOiBWb2drRGVzY3JpcHRvciA9IHsga2V5RGVzY3JpcHRvckxpc3Q6IFtdIH07XG5cblx0XHRmb3IgKGxldCBpID0gMDsgaSA8IG9yaWcua2V5RGVzY3JpcHRvckxpc3QubGVuZ3RoOyBpKyspIHtcblx0XHRcdGNvbnN0IGl0ZW0gPSBvcmlnLmtleURlc2NyaXB0b3JMaXN0W2ldO1xuXG5cdFx0XHRpZiAoaXRlbS5rZXlTaGFwZUludmFsaWRhdGVkKSB7XG5cdFx0XHRcdGRlc2Mua2V5RGVzY3JpcHRvckxpc3QucHVzaCh7IGtleVNoYXBlSW52YWxpZGF0ZWQ6IHRydWUsIGtleU9yaWdpbkluZGV4OiBpIH0pO1xuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0ZGVzYy5rZXlEZXNjcmlwdG9yTGlzdC5wdXNoKHtcblx0XHRcdFx0XHRrZXlPcmlnaW5UeXBlOiBpdGVtLmtleU9yaWdpblR5cGUgPz8gNCxcblx0XHRcdFx0XHRrZXlPcmlnaW5SZXNvbHV0aW9uOiBpdGVtLmtleU9yaWdpblJlc29sdXRpb24gPz8gNzIsXG5cdFx0XHRcdH0gYXMgYW55KTtcblxuXHRcdFx0XHRjb25zdCBvdXQgPSBkZXNjLmtleURlc2NyaXB0b3JMaXN0W2Rlc2Mua2V5RGVzY3JpcHRvckxpc3QubGVuZ3RoIC0gMV07XG5cblx0XHRcdFx0aWYgKGl0ZW0ua2V5T3JpZ2luUlJlY3RSYWRpaSkge1xuXHRcdFx0XHRcdG91dC5rZXlPcmlnaW5SUmVjdFJhZGlpID0ge1xuXHRcdFx0XHRcdFx0dW5pdFZhbHVlUXVhZFZlcnNpb246IDEsXG5cdFx0XHRcdFx0XHR0b3BSaWdodDogdW5pdHNWYWx1ZShpdGVtLmtleU9yaWdpblJSZWN0UmFkaWkudG9wUmlnaHQsICd0b3BSaWdodCcpLFxuXHRcdFx0XHRcdFx0dG9wTGVmdDogdW5pdHNWYWx1ZShpdGVtLmtleU9yaWdpblJSZWN0UmFkaWkudG9wTGVmdCwgJ3RvcExlZnQnKSxcblx0XHRcdFx0XHRcdGJvdHRvbUxlZnQ6IHVuaXRzVmFsdWUoaXRlbS5rZXlPcmlnaW5SUmVjdFJhZGlpLmJvdHRvbUxlZnQsICdib3R0b21MZWZ0JyksXG5cdFx0XHRcdFx0XHRib3R0b21SaWdodDogdW5pdHNWYWx1ZShpdGVtLmtleU9yaWdpblJSZWN0UmFkaWkuYm90dG9tUmlnaHQsICdib3R0b21SaWdodCcpLFxuXHRcdFx0XHRcdH07XG5cdFx0XHRcdH1cblxuXHRcdFx0XHRpZiAoaXRlbS5rZXlPcmlnaW5TaGFwZUJvdW5kaW5nQm94KSB7XG5cdFx0XHRcdFx0b3V0LmtleU9yaWdpblNoYXBlQkJveCA9IHtcblx0XHRcdFx0XHRcdHVuaXRWYWx1ZVF1YWRWZXJzaW9uOiAxLFxuXHRcdFx0XHRcdFx0J1RvcCAnOiB1bml0c1ZhbHVlKGl0ZW0ua2V5T3JpZ2luU2hhcGVCb3VuZGluZ0JveC50b3AsICd0b3AnKSxcblx0XHRcdFx0XHRcdExlZnQ6IHVuaXRzVmFsdWUoaXRlbS5rZXlPcmlnaW5TaGFwZUJvdW5kaW5nQm94LmxlZnQsICdsZWZ0JyksXG5cdFx0XHRcdFx0XHRCdG9tOiB1bml0c1ZhbHVlKGl0ZW0ua2V5T3JpZ2luU2hhcGVCb3VuZGluZ0JveC5ib3R0b20sICdib3R0b20nKSxcblx0XHRcdFx0XHRcdFJnaHQ6IHVuaXRzVmFsdWUoaXRlbS5rZXlPcmlnaW5TaGFwZUJvdW5kaW5nQm94LnJpZ2h0LCAncmlnaHQnKSxcblx0XHRcdFx0XHR9O1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0aWYgKGl0ZW0ua2V5T3JpZ2luQm94Q29ybmVycyAmJiBpdGVtLmtleU9yaWdpbkJveENvcm5lcnMubGVuZ3RoID09PSA0KSB7XG5cdFx0XHRcdFx0b3V0LmtleU9yaWdpbkJveENvcm5lcnMgPSB7XG5cdFx0XHRcdFx0XHRyZWN0YW5nbGVDb3JuZXJBOiB7IEhyem46IGl0ZW0ua2V5T3JpZ2luQm94Q29ybmVyc1swXS54LCBWcnRjOiBpdGVtLmtleU9yaWdpbkJveENvcm5lcnNbMF0ueSB9LFxuXHRcdFx0XHRcdFx0cmVjdGFuZ2xlQ29ybmVyQjogeyBIcnpuOiBpdGVtLmtleU9yaWdpbkJveENvcm5lcnNbMV0ueCwgVnJ0YzogaXRlbS5rZXlPcmlnaW5Cb3hDb3JuZXJzWzFdLnkgfSxcblx0XHRcdFx0XHRcdHJlY3RhbmdsZUNvcm5lckM6IHsgSHJ6bjogaXRlbS5rZXlPcmlnaW5Cb3hDb3JuZXJzWzJdLngsIFZydGM6IGl0ZW0ua2V5T3JpZ2luQm94Q29ybmVyc1syXS55IH0sXG5cdFx0XHRcdFx0XHRyZWN0YW5nbGVDb3JuZXJEOiB7IEhyem46IGl0ZW0ua2V5T3JpZ2luQm94Q29ybmVyc1szXS54LCBWcnRjOiBpdGVtLmtleU9yaWdpbkJveENvcm5lcnNbM10ueSB9LFxuXHRcdFx0XHRcdH07XG5cdFx0XHRcdH1cblxuXHRcdFx0XHRpZiAoaXRlbS50cmFuc2Zvcm0gJiYgaXRlbS50cmFuc2Zvcm0ubGVuZ3RoID09PSA2KSB7XG5cdFx0XHRcdFx0b3V0LlRybmYgPSB7XG5cdFx0XHRcdFx0XHR4eDogaXRlbS50cmFuc2Zvcm1bMF0sXG5cdFx0XHRcdFx0XHR4eTogaXRlbS50cmFuc2Zvcm1bMV0sXG5cdFx0XHRcdFx0XHR5eDogaXRlbS50cmFuc2Zvcm1bMl0sXG5cdFx0XHRcdFx0XHR5eTogaXRlbS50cmFuc2Zvcm1bM10sXG5cdFx0XHRcdFx0XHR0eDogaXRlbS50cmFuc2Zvcm1bNF0sXG5cdFx0XHRcdFx0XHR0eTogaXRlbS50cmFuc2Zvcm1bNV0sXG5cdFx0XHRcdFx0fTtcblx0XHRcdFx0fVxuXG5cdFx0XHRcdG91dC5rZXlPcmlnaW5JbmRleCA9IGk7XG5cdFx0XHR9XG5cdFx0fVxuXG5cdFx0d3JpdGVJbnQzMih3cml0ZXIsIDEpOyAvLyB2ZXJzaW9uXG5cdFx0d3JpdGVWZXJzaW9uQW5kRGVzY3JpcHRvcih3cml0ZXIsICcnLCAnbnVsbCcsIGRlc2MpO1xuXHR9XG4pO1xuXG5hZGRIYW5kbGVyKFxuXHQnbG1meCcsXG5cdHRhcmdldCA9PiB0YXJnZXQuZWZmZWN0cyAhPT0gdW5kZWZpbmVkICYmIGhhc011bHRpRWZmZWN0cyh0YXJnZXQuZWZmZWN0cyksXG5cdChyZWFkZXIsIHRhcmdldCwgbGVmdCwgXywgb3B0aW9ucykgPT4ge1xuXHRcdGNvbnN0IHZlcnNpb24gPSByZWFkVWludDMyKHJlYWRlcik7XG5cdFx0aWYgKHZlcnNpb24gIT09IDApIHRocm93IG5ldyBFcnJvcignSW52YWxpZCBsbWZ4IHZlcnNpb24nKTtcblxuXHRcdGNvbnN0IGRlc2M6IExtZnhEZXNjcmlwdG9yID0gcmVhZFZlcnNpb25BbmREZXNjcmlwdG9yKHJlYWRlcik7XG5cdFx0Ly8gY29uc29sZS5sb2cocmVxdWlyZSgndXRpbCcpLmluc3BlY3QoaW5mbywgZmFsc2UsIDk5LCB0cnVlKSk7XG5cblx0XHQvLyBkaXNjYXJkIGlmIHJlYWQgaW4gJ2xyRlgnIG9yICdsZngyJyBzZWN0aW9uXG5cdFx0dGFyZ2V0LmVmZmVjdHMgPSBwYXJzZUVmZmVjdHMoZGVzYywgISFvcHRpb25zLmxvZ01pc3NpbmdGZWF0dXJlcyk7XG5cblx0XHRza2lwQnl0ZXMocmVhZGVyLCBsZWZ0KCkpO1xuXHR9LFxuXHQod3JpdGVyLCB0YXJnZXQsIF8sIG9wdGlvbnMpID0+IHtcblx0XHRjb25zdCBkZXNjID0gc2VyaWFsaXplRWZmZWN0cyh0YXJnZXQuZWZmZWN0cyEsICEhb3B0aW9ucy5sb2dNaXNzaW5nRmVhdHVyZXMsIHRydWUpO1xuXG5cdFx0d3JpdGVVaW50MzIod3JpdGVyLCAwKTsgLy8gdmVyc2lvblxuXHRcdHdyaXRlVmVyc2lvbkFuZERlc2NyaXB0b3Iod3JpdGVyLCAnJywgJ251bGwnLCBkZXNjKTtcblx0fSxcbik7XG5cbmFkZEhhbmRsZXIoXG5cdCdsckZYJyxcblx0aGFzS2V5KCdlZmZlY3RzJyksXG5cdChyZWFkZXIsIHRhcmdldCwgbGVmdCkgPT4ge1xuXHRcdGlmICghdGFyZ2V0LmVmZmVjdHMpIHRhcmdldC5lZmZlY3RzID0gcmVhZEVmZmVjdHMocmVhZGVyKTtcblxuXHRcdHNraXBCeXRlcyhyZWFkZXIsIGxlZnQoKSk7XG5cdH0sXG5cdCh3cml0ZXIsIHRhcmdldCkgPT4ge1xuXHRcdHdyaXRlRWZmZWN0cyh3cml0ZXIsIHRhcmdldC5lZmZlY3RzISk7XG5cdH0sXG4pO1xuXG5hZGRIYW5kbGVyKFxuXHQnbHVuaScsXG5cdGhhc0tleSgnbmFtZScpLFxuXHQocmVhZGVyLCB0YXJnZXQsIGxlZnQpID0+IHtcblx0XHR0YXJnZXQubmFtZSA9IHJlYWRVbmljb2RlU3RyaW5nKHJlYWRlcik7XG5cdFx0c2tpcEJ5dGVzKHJlYWRlciwgbGVmdCgpKTtcblx0fSxcblx0KHdyaXRlciwgdGFyZ2V0KSA9PiB7XG5cdFx0d3JpdGVVbmljb2RlU3RyaW5nKHdyaXRlciwgdGFyZ2V0Lm5hbWUhKTtcblx0XHQvLyB3cml0ZVVpbnQxNih3cml0ZXIsIDApOyAvLyBwYWRkaW5nIChidXQgbm90IGV4dGVuZGluZyBzdHJpbmcgbGVuZ3RoKVxuXHR9LFxuKTtcblxuYWRkSGFuZGxlcihcblx0J2xuc3InLFxuXHRoYXNLZXkoJ25hbWVTb3VyY2UnKSxcblx0KHJlYWRlciwgdGFyZ2V0KSA9PiB0YXJnZXQubmFtZVNvdXJjZSA9IHJlYWRTaWduYXR1cmUocmVhZGVyKSxcblx0KHdyaXRlciwgdGFyZ2V0KSA9PiB3cml0ZVNpZ25hdHVyZSh3cml0ZXIsIHRhcmdldC5uYW1lU291cmNlISksXG4pO1xuXG5hZGRIYW5kbGVyKFxuXHQnbHlpZCcsXG5cdGhhc0tleSgnaWQnKSxcblx0KHJlYWRlciwgdGFyZ2V0KSA9PiB0YXJnZXQuaWQgPSByZWFkVWludDMyKHJlYWRlciksXG5cdCh3cml0ZXIsIHRhcmdldCwgX3BzZCwgb3B0aW9ucykgPT4ge1xuXHRcdGxldCBpZCA9IHRhcmdldC5pZCE7XG5cdFx0d2hpbGUgKG9wdGlvbnMubGF5ZXJJZHMuaW5kZXhPZihpZCkgIT09IC0xKSBpZCArPSAxMDA7IC8vIG1ha2Ugc3VyZSB3ZSBkb24ndCBoYXZlIGR1cGxpY2F0ZSBsYXllciBpZHNcblx0XHR3cml0ZVVpbnQzMih3cml0ZXIsIGlkKTtcblx0XHRvcHRpb25zLmxheWVySWRzLnB1c2goaWQpO1xuXHR9LFxuKTtcblxuLy8gc29tZSBraW5kIG9mIElEID8gaWdub3JlXG5hZGRIYW5kbGVyKFxuXHQnbHNkaycsXG5cdHRhcmdldCA9PiAodGFyZ2V0IGFzIGFueSkuX2xzZGsgIT09IHVuZGVmaW5lZCxcblx0KHJlYWRlciwgdGFyZ2V0KSA9PiB7XG5cdFx0Y29uc3QgaWQgPSByZWFkSW50MzIocmVhZGVyKTtcblx0XHRpZiAoTU9DS19IQU5ETEVSUykgKHRhcmdldCBhcyBhbnkpLl9sc2RrID0gaWQ7XG5cdH0sXG5cdCh3cml0ZXIsIHRhcmdldCkgPT4ge1xuXHRcdGlmIChNT0NLX0hBTkRMRVJTKSB3cml0ZUludDMyKHdyaXRlciwgKHRhcmdldCBhcyBhbnkpLl9sc2RrKTtcblx0fSxcbik7XG5cbmFkZEhhbmRsZXIoXG5cdCdsc2N0Jyxcblx0aGFzS2V5KCdzZWN0aW9uRGl2aWRlcicpLFxuXHQocmVhZGVyLCB0YXJnZXQsIGxlZnQpID0+IHtcblx0XHR0YXJnZXQuc2VjdGlvbkRpdmlkZXIgPSB7IHR5cGU6IHJlYWRVaW50MzIocmVhZGVyKSB9O1xuXG5cdFx0aWYgKGxlZnQoKSkge1xuXHRcdFx0Y2hlY2tTaWduYXR1cmUocmVhZGVyLCAnOEJJTScpO1xuXHRcdFx0dGFyZ2V0LnNlY3Rpb25EaXZpZGVyLmtleSA9IHJlYWRTaWduYXR1cmUocmVhZGVyKTtcblx0XHR9XG5cblx0XHRpZiAobGVmdCgpKSB7XG5cdFx0XHQvLyAwID0gbm9ybWFsXG5cdFx0XHQvLyAxID0gc2NlbmUgZ3JvdXAsIGFmZmVjdHMgdGhlIGFuaW1hdGlvbiB0aW1lbGluZS5cblx0XHRcdHRhcmdldC5zZWN0aW9uRGl2aWRlci5zdWJUeXBlID0gcmVhZFVpbnQzMihyZWFkZXIpO1xuXHRcdH1cblx0fSxcblx0KHdyaXRlciwgdGFyZ2V0KSA9PiB7XG5cdFx0d3JpdGVVaW50MzIod3JpdGVyLCB0YXJnZXQuc2VjdGlvbkRpdmlkZXIhLnR5cGUpO1xuXG5cdFx0aWYgKHRhcmdldC5zZWN0aW9uRGl2aWRlciEua2V5KSB7XG5cdFx0XHR3cml0ZVNpZ25hdHVyZSh3cml0ZXIsICc4QklNJyk7XG5cdFx0XHR3cml0ZVNpZ25hdHVyZSh3cml0ZXIsIHRhcmdldC5zZWN0aW9uRGl2aWRlciEua2V5KTtcblxuXHRcdFx0aWYgKHRhcmdldC5zZWN0aW9uRGl2aWRlciEuc3ViVHlwZSAhPT0gdW5kZWZpbmVkKSB7XG5cdFx0XHRcdHdyaXRlVWludDMyKHdyaXRlciwgdGFyZ2V0LnNlY3Rpb25EaXZpZGVyIS5zdWJUeXBlKTtcblx0XHRcdH1cblx0XHR9XG5cdH0sXG4pO1xuXG5hZGRIYW5kbGVyKFxuXHQnY2xibCcsXG5cdGhhc0tleSgnYmxlbmRDbGlwcGVuZEVsZW1lbnRzJyksXG5cdChyZWFkZXIsIHRhcmdldCkgPT4ge1xuXHRcdHRhcmdldC5ibGVuZENsaXBwZW5kRWxlbWVudHMgPSAhIXJlYWRVaW50OChyZWFkZXIpO1xuXHRcdHNraXBCeXRlcyhyZWFkZXIsIDMpO1xuXHR9LFxuXHQod3JpdGVyLCB0YXJnZXQpID0+IHtcblx0XHR3cml0ZVVpbnQ4KHdyaXRlciwgdGFyZ2V0LmJsZW5kQ2xpcHBlbmRFbGVtZW50cyA/IDEgOiAwKTtcblx0XHR3cml0ZVplcm9zKHdyaXRlciwgMyk7XG5cdH0sXG4pO1xuXG5hZGRIYW5kbGVyKFxuXHQnaW5meCcsXG5cdGhhc0tleSgnYmxlbmRJbnRlcmlvckVsZW1lbnRzJyksXG5cdChyZWFkZXIsIHRhcmdldCkgPT4ge1xuXHRcdHRhcmdldC5ibGVuZEludGVyaW9yRWxlbWVudHMgPSAhIXJlYWRVaW50OChyZWFkZXIpO1xuXHRcdHNraXBCeXRlcyhyZWFkZXIsIDMpO1xuXHR9LFxuXHQod3JpdGVyLCB0YXJnZXQpID0+IHtcblx0XHR3cml0ZVVpbnQ4KHdyaXRlciwgdGFyZ2V0LmJsZW5kSW50ZXJpb3JFbGVtZW50cyA/IDEgOiAwKTtcblx0XHR3cml0ZVplcm9zKHdyaXRlciwgMyk7XG5cdH0sXG4pO1xuXG5hZGRIYW5kbGVyKFxuXHQna25rbycsXG5cdGhhc0tleSgna25vY2tvdXQnKSxcblx0KHJlYWRlciwgdGFyZ2V0KSA9PiB7XG5cdFx0dGFyZ2V0Lmtub2Nrb3V0ID0gISFyZWFkVWludDgocmVhZGVyKTtcblx0XHRza2lwQnl0ZXMocmVhZGVyLCAzKTtcblx0fSxcblx0KHdyaXRlciwgdGFyZ2V0KSA9PiB7XG5cdFx0d3JpdGVVaW50OCh3cml0ZXIsIHRhcmdldC5rbm9ja291dCA/IDEgOiAwKTtcblx0XHR3cml0ZVplcm9zKHdyaXRlciwgMyk7XG5cdH0sXG4pO1xuXG5hZGRIYW5kbGVyKFxuXHQnbHNwZicsXG5cdGhhc0tleSgncHJvdGVjdGVkJyksXG5cdChyZWFkZXIsIHRhcmdldCkgPT4ge1xuXHRcdGNvbnN0IGZsYWdzID0gcmVhZFVpbnQzMihyZWFkZXIpO1xuXHRcdHRhcmdldC5wcm90ZWN0ZWQgPSB7XG5cdFx0XHR0cmFuc3BhcmVuY3k6IChmbGFncyAmIDB4MDEpICE9PSAwLFxuXHRcdFx0Y29tcG9zaXRlOiAoZmxhZ3MgJiAweDAyKSAhPT0gMCxcblx0XHRcdHBvc2l0aW9uOiAoZmxhZ3MgJiAweDA0KSAhPT0gMCxcblx0XHR9O1xuXG5cdFx0aWYgKGZsYWdzICYgMHgwOCkgdGFyZ2V0LnByb3RlY3RlZC5hcnRib2FyZHMgPSB0cnVlO1xuXHR9LFxuXHQod3JpdGVyLCB0YXJnZXQpID0+IHtcblx0XHRjb25zdCBmbGFncyA9XG5cdFx0XHQodGFyZ2V0LnByb3RlY3RlZCEudHJhbnNwYXJlbmN5ID8gMHgwMSA6IDApIHxcblx0XHRcdCh0YXJnZXQucHJvdGVjdGVkIS5jb21wb3NpdGUgPyAweDAyIDogMCkgfFxuXHRcdFx0KHRhcmdldC5wcm90ZWN0ZWQhLnBvc2l0aW9uID8gMHgwNCA6IDApIHxcblx0XHRcdCh0YXJnZXQucHJvdGVjdGVkIS5hcnRib2FyZHMgPyAweDA4IDogMCk7XG5cblx0XHR3cml0ZVVpbnQzMih3cml0ZXIsIGZsYWdzKTtcblx0fSxcbik7XG5cbmFkZEhhbmRsZXIoXG5cdCdsY2xyJyxcblx0aGFzS2V5KCdsYXllckNvbG9yJyksXG5cdChyZWFkZXIsIHRhcmdldCkgPT4ge1xuXHRcdGNvbnN0IGNvbG9yID0gcmVhZFVpbnQxNihyZWFkZXIpO1xuXHRcdHNraXBCeXRlcyhyZWFkZXIsIDYpO1xuXHRcdHRhcmdldC5sYXllckNvbG9yID0gbGF5ZXJDb2xvcnNbY29sb3JdO1xuXHR9LFxuXHQod3JpdGVyLCB0YXJnZXQpID0+IHtcblx0XHRjb25zdCBpbmRleCA9IGxheWVyQ29sb3JzLmluZGV4T2YodGFyZ2V0LmxheWVyQ29sb3IhKTtcblx0XHR3cml0ZVVpbnQxNih3cml0ZXIsIGluZGV4ID09PSAtMSA/IDAgOiBpbmRleCk7XG5cdFx0d3JpdGVaZXJvcyh3cml0ZXIsIDYpO1xuXHR9LFxuKTtcblxuaW50ZXJmYWNlIEN1c3RvbURlc2NyaXB0b3Ige1xuXHRsYXllclRpbWU/OiBudW1iZXI7XG59XG5cbmludGVyZmFjZSBGcmFtZUxpc3REZXNjcmlwdG9yIHtcblx0TGFJRDogbnVtYmVyO1xuXHRMYVN0OiB7XG5cdFx0ZW5hYj86IGJvb2xlYW47XG5cdFx0SU1zaz86IHsgT2ZzdDogeyBIcnpuOiBudW1iZXI7IFZydGM6IG51bWJlcjsgfSB9O1xuXHRcdFZNc2s/OiB7IE9mc3Q6IHsgSHJ6bjogbnVtYmVyOyBWcnRjOiBudW1iZXI7IH0gfTtcblx0XHRGWFJmPzogeyBIcnpuOiBudW1iZXI7IFZydGM6IG51bWJlcjsgfTtcblx0XHRGckxzOiBudW1iZXJbXTtcblx0fVtdO1xufVxuXG5hZGRIYW5kbGVyKFxuXHQnc2htZCcsXG5cdGhhc0tleSgndGltZXN0YW1wJyksXG5cdChyZWFkZXIsIHRhcmdldCwgbGVmdCwgXywgb3B0aW9ucykgPT4ge1xuXHRcdGNvbnN0IGNvdW50ID0gcmVhZFVpbnQzMihyZWFkZXIpO1xuXG5cdFx0Zm9yIChsZXQgaSA9IDA7IGkgPCBjb3VudDsgaSsrKSB7XG5cdFx0XHRjaGVja1NpZ25hdHVyZShyZWFkZXIsICc4QklNJyk7XG5cdFx0XHRjb25zdCBrZXkgPSByZWFkU2lnbmF0dXJlKHJlYWRlcik7XG5cdFx0XHRyZWFkVWludDgocmVhZGVyKTsgLy8gY29weVxuXHRcdFx0c2tpcEJ5dGVzKHJlYWRlciwgMyk7XG5cblx0XHRcdHJlYWRTZWN0aW9uKHJlYWRlciwgMSwgbGVmdCA9PiB7XG5cdFx0XHRcdGlmIChrZXkgPT09ICdjdXN0Jykge1xuXHRcdFx0XHRcdGNvbnN0IGRlc2MgPSByZWFkVmVyc2lvbkFuZERlc2NyaXB0b3IocmVhZGVyKSBhcyBDdXN0b21EZXNjcmlwdG9yO1xuXHRcdFx0XHRcdGlmIChkZXNjLmxheWVyVGltZSAhPT0gdW5kZWZpbmVkKSB0YXJnZXQudGltZXN0YW1wID0gZGVzYy5sYXllclRpbWU7XG5cdFx0XHRcdH0gZWxzZSBpZiAoa2V5ID09PSAnbWxzdCcpIHtcblx0XHRcdFx0XHRjb25zdCBkZXNjID0gcmVhZFZlcnNpb25BbmREZXNjcmlwdG9yKHJlYWRlcikgYXMgRnJhbWVMaXN0RGVzY3JpcHRvcjtcblx0XHRcdFx0XHRvcHRpb25zLmxvZ0RldkZlYXR1cmVzICYmIGNvbnNvbGUubG9nKCdtbHN0JywgZGVzYyk7XG5cdFx0XHRcdFx0Ly8gb3B0aW9ucy5sb2dEZXZGZWF0dXJlcyAmJiBjb25zb2xlLmxvZygnbWxzdCcsIHJlcXVpcmUoJ3V0aWwnKS5pbnNwZWN0KGRlc2MsIGZhbHNlLCA5OSwgdHJ1ZSkpO1xuXHRcdFx0XHR9IGVsc2UgaWYgKGtleSA9PT0gJ21keW4nKSB7XG5cdFx0XHRcdFx0Ly8gZnJhbWUgZmxhZ3Ncblx0XHRcdFx0XHRjb25zdCB1bmtub3duID0gcmVhZFVpbnQxNihyZWFkZXIpO1xuXHRcdFx0XHRcdGNvbnN0IHByb3BhZ2F0ZSA9IHJlYWRVaW50OChyZWFkZXIpO1xuXHRcdFx0XHRcdGNvbnN0IGZsYWdzID0gcmVhZFVpbnQ4KHJlYWRlcik7XG5cdFx0XHRcdFx0Y29uc3QgdW5pZnlMYXllclBvc2l0aW9uID0gKGZsYWdzICYgMSkgIT09IDA7XG5cdFx0XHRcdFx0Y29uc3QgdW5pZnlMYXllclN0eWxlID0gKGZsYWdzICYgMikgIT09IDA7XG5cdFx0XHRcdFx0Y29uc3QgdW5pZnlMYXllclZpc2liaWxpdHkgPSAoZmxhZ3MgJiA0KSAhPT0gMDtcblx0XHRcdFx0XHRvcHRpb25zLmxvZ0RldkZlYXR1cmVzICYmIGNvbnNvbGUubG9nKFxuXHRcdFx0XHRcdFx0J21keW4nLCAndW5rbm93bjonLCB1bmtub3duLCAncHJvcGFnYXRlOicsIHByb3BhZ2F0ZSxcblx0XHRcdFx0XHRcdCdmbGFnczonLCBmbGFncywgeyB1bmlmeUxheWVyUG9zaXRpb24sIHVuaWZ5TGF5ZXJTdHlsZSwgdW5pZnlMYXllclZpc2liaWxpdHkgfSk7XG5cblx0XHRcdFx0XHQvLyBjb25zdCBkZXNjID0gcmVhZFZlcnNpb25BbmREZXNjcmlwdG9yKHJlYWRlcikgYXMgRnJhbWVMaXN0RGVzY3JpcHRvcjtcblx0XHRcdFx0XHQvLyBjb25zb2xlLmxvZygnbWR5bicsIHJlcXVpcmUoJ3V0aWwnKS5pbnNwZWN0KGRlc2MsIGZhbHNlLCA5OSwgdHJ1ZSkpO1xuXHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdG9wdGlvbnMubG9nRGV2RmVhdHVyZXMgJiYgY29uc29sZS5sb2coJ1VuaGFuZGxlZCBtZXRhZGF0YScsIGtleSk7XG5cdFx0XHRcdH1cblxuXHRcdFx0XHRza2lwQnl0ZXMocmVhZGVyLCBsZWZ0KCkpO1xuXHRcdFx0fSk7XG5cdFx0fVxuXG5cdFx0c2tpcEJ5dGVzKHJlYWRlciwgbGVmdCgpKTtcblx0fSxcblx0KHdyaXRlciwgdGFyZ2V0KSA9PiB7XG5cdFx0Y29uc3QgZGVzYzogQ3VzdG9tRGVzY3JpcHRvciA9IHtcblx0XHRcdGxheWVyVGltZTogdGFyZ2V0LnRpbWVzdGFtcCEsXG5cdFx0fTtcblxuXHRcdHdyaXRlVWludDMyKHdyaXRlciwgMSk7IC8vIGNvdW50XG5cblx0XHR3cml0ZVNpZ25hdHVyZSh3cml0ZXIsICc4QklNJyk7XG5cdFx0d3JpdGVTaWduYXR1cmUod3JpdGVyLCAnY3VzdCcpO1xuXHRcdHdyaXRlVWludDgod3JpdGVyLCAwKTsgLy8gY29weSAoYWx3YXlzIGZhbHNlKVxuXHRcdHdyaXRlWmVyb3Mod3JpdGVyLCAzKTtcblx0XHR3cml0ZVNlY3Rpb24od3JpdGVyLCAyLCAoKSA9PiB3cml0ZVZlcnNpb25BbmREZXNjcmlwdG9yKHdyaXRlciwgJycsICdtZXRhZGF0YScsIGRlc2MpLCB0cnVlKTtcblx0fSxcbik7XG5cbmFkZEhhbmRsZXIoXG5cdCd2c3RrJyxcblx0aGFzS2V5KCd2ZWN0b3JTdHJva2UnKSxcblx0KHJlYWRlciwgdGFyZ2V0LCBsZWZ0KSA9PiB7XG5cdFx0Y29uc3QgZGVzYyA9IHJlYWRWZXJzaW9uQW5kRGVzY3JpcHRvcihyZWFkZXIpIGFzIFN0cm9rZURlc2NyaXB0b3I7XG5cdFx0Ly8gY29uc29sZS5sb2cocmVxdWlyZSgndXRpbCcpLmluc3BlY3QoZGVzYywgZmFsc2UsIDk5LCB0cnVlKSk7XG5cblx0XHR0YXJnZXQudmVjdG9yU3Ryb2tlID0ge1xuXHRcdFx0c3Ryb2tlRW5hYmxlZDogZGVzYy5zdHJva2VFbmFibGVkLFxuXHRcdFx0ZmlsbEVuYWJsZWQ6IGRlc2MuZmlsbEVuYWJsZWQsXG5cdFx0XHRsaW5lV2lkdGg6IHBhcnNlVW5pdHMoZGVzYy5zdHJva2VTdHlsZUxpbmVXaWR0aCksXG5cdFx0XHRsaW5lRGFzaE9mZnNldDogcGFyc2VVbml0cyhkZXNjLnN0cm9rZVN0eWxlTGluZURhc2hPZmZzZXQpLFxuXHRcdFx0bWl0ZXJMaW1pdDogZGVzYy5zdHJva2VTdHlsZU1pdGVyTGltaXQsXG5cdFx0XHRsaW5lQ2FwVHlwZTogc3Ryb2tlU3R5bGVMaW5lQ2FwVHlwZS5kZWNvZGUoZGVzYy5zdHJva2VTdHlsZUxpbmVDYXBUeXBlKSxcblx0XHRcdGxpbmVKb2luVHlwZTogc3Ryb2tlU3R5bGVMaW5lSm9pblR5cGUuZGVjb2RlKGRlc2Muc3Ryb2tlU3R5bGVMaW5lSm9pblR5cGUpLFxuXHRcdFx0bGluZUFsaWdubWVudDogc3Ryb2tlU3R5bGVMaW5lQWxpZ25tZW50LmRlY29kZShkZXNjLnN0cm9rZVN0eWxlTGluZUFsaWdubWVudCksXG5cdFx0XHRzY2FsZUxvY2s6IGRlc2Muc3Ryb2tlU3R5bGVTY2FsZUxvY2ssXG5cdFx0XHRzdHJva2VBZGp1c3Q6IGRlc2Muc3Ryb2tlU3R5bGVTdHJva2VBZGp1c3QsXG5cdFx0XHRsaW5lRGFzaFNldDogZGVzYy5zdHJva2VTdHlsZUxpbmVEYXNoU2V0Lm1hcChwYXJzZVVuaXRzKSxcblx0XHRcdGJsZW5kTW9kZTogQmxuTS5kZWNvZGUoZGVzYy5zdHJva2VTdHlsZUJsZW5kTW9kZSksXG5cdFx0XHRvcGFjaXR5OiBwYXJzZVBlcmNlbnQoZGVzYy5zdHJva2VTdHlsZU9wYWNpdHkpLFxuXHRcdFx0Y29udGVudDogcGFyc2VWZWN0b3JDb250ZW50KGRlc2Muc3Ryb2tlU3R5bGVDb250ZW50KSxcblx0XHRcdHJlc29sdXRpb246IGRlc2Muc3Ryb2tlU3R5bGVSZXNvbHV0aW9uLFxuXHRcdH07XG5cblx0XHRza2lwQnl0ZXMocmVhZGVyLCBsZWZ0KCkpO1xuXHR9LFxuXHQod3JpdGVyLCB0YXJnZXQpID0+IHtcblx0XHRjb25zdCBzdHJva2UgPSB0YXJnZXQudmVjdG9yU3Ryb2tlITtcblx0XHRjb25zdCBkZXNjcmlwdG9yOiBTdHJva2VEZXNjcmlwdG9yID0ge1xuXHRcdFx0c3Ryb2tlU3R5bGVWZXJzaW9uOiAyLFxuXHRcdFx0c3Ryb2tlRW5hYmxlZDogISFzdHJva2Uuc3Ryb2tlRW5hYmxlZCxcblx0XHRcdGZpbGxFbmFibGVkOiAhIXN0cm9rZS5maWxsRW5hYmxlZCxcblx0XHRcdHN0cm9rZVN0eWxlTGluZVdpZHRoOiBzdHJva2UubGluZVdpZHRoIHx8IHsgdmFsdWU6IDMsIHVuaXRzOiAnUG9pbnRzJyB9LFxuXHRcdFx0c3Ryb2tlU3R5bGVMaW5lRGFzaE9mZnNldDogc3Ryb2tlLmxpbmVEYXNoT2Zmc2V0IHx8IHsgdmFsdWU6IDAsIHVuaXRzOiAnUG9pbnRzJyB9LFxuXHRcdFx0c3Ryb2tlU3R5bGVNaXRlckxpbWl0OiBzdHJva2UubWl0ZXJMaW1pdCA/PyAxMDAsXG5cdFx0XHRzdHJva2VTdHlsZUxpbmVDYXBUeXBlOiBzdHJva2VTdHlsZUxpbmVDYXBUeXBlLmVuY29kZShzdHJva2UubGluZUNhcFR5cGUpLFxuXHRcdFx0c3Ryb2tlU3R5bGVMaW5lSm9pblR5cGU6IHN0cm9rZVN0eWxlTGluZUpvaW5UeXBlLmVuY29kZShzdHJva2UubGluZUpvaW5UeXBlKSxcblx0XHRcdHN0cm9rZVN0eWxlTGluZUFsaWdubWVudDogc3Ryb2tlU3R5bGVMaW5lQWxpZ25tZW50LmVuY29kZShzdHJva2UubGluZUFsaWdubWVudCksXG5cdFx0XHRzdHJva2VTdHlsZVNjYWxlTG9jazogISFzdHJva2Uuc2NhbGVMb2NrLFxuXHRcdFx0c3Ryb2tlU3R5bGVTdHJva2VBZGp1c3Q6ICEhc3Ryb2tlLnN0cm9rZUFkanVzdCxcblx0XHRcdHN0cm9rZVN0eWxlTGluZURhc2hTZXQ6IHN0cm9rZS5saW5lRGFzaFNldCB8fCBbXSxcblx0XHRcdHN0cm9rZVN0eWxlQmxlbmRNb2RlOiBCbG5NLmVuY29kZShzdHJva2UuYmxlbmRNb2RlKSxcblx0XHRcdHN0cm9rZVN0eWxlT3BhY2l0eTogdW5pdHNQZXJjZW50KHN0cm9rZS5vcGFjaXR5ID8/IDEpLFxuXHRcdFx0c3Ryb2tlU3R5bGVDb250ZW50OiBzZXJpYWxpemVWZWN0b3JDb250ZW50KFxuXHRcdFx0XHRzdHJva2UuY29udGVudCB8fCB7IHR5cGU6ICdjb2xvcicsIGNvbG9yOiB7IHI6IDAsIGc6IDAsIGI6IDAgfSB9KS5kZXNjcmlwdG9yLFxuXHRcdFx0c3Ryb2tlU3R5bGVSZXNvbHV0aW9uOiBzdHJva2UucmVzb2x1dGlvbiA/PyA3Mixcblx0XHR9O1xuXG5cdFx0d3JpdGVWZXJzaW9uQW5kRGVzY3JpcHRvcih3cml0ZXIsICcnLCAnc3Ryb2tlU3R5bGUnLCBkZXNjcmlwdG9yKTtcblx0fSxcbik7XG5cbmludGVyZmFjZSBBcnRiRGVzY3JpcHRvciB7XG5cdGFydGJvYXJkUmVjdDogeyAnVG9wICc6IG51bWJlcjsgTGVmdDogbnVtYmVyOyBCdG9tOiBudW1iZXI7IFJnaHQ6IG51bWJlcjsgfTtcblx0Z3VpZGVJbmRlY2VzOiBhbnlbXTtcblx0YXJ0Ym9hcmRQcmVzZXROYW1lOiBzdHJpbmc7XG5cdCdDbHIgJzogRGVzY3JpcHRvckNvbG9yO1xuXHRhcnRib2FyZEJhY2tncm91bmRUeXBlOiBudW1iZXI7XG59XG5cbmFkZEhhbmRsZXIoXG5cdCdhcnRiJywgLy8gcGVyLWxheWVyIGFyYm9hcmQgaW5mb1xuXHRoYXNLZXkoJ2FydGJvYXJkJyksXG5cdChyZWFkZXIsIHRhcmdldCwgbGVmdCkgPT4ge1xuXHRcdGNvbnN0IGRlc2MgPSByZWFkVmVyc2lvbkFuZERlc2NyaXB0b3IocmVhZGVyKSBhcyBBcnRiRGVzY3JpcHRvcjtcblx0XHR0YXJnZXQuYXJ0Ym9hcmQgPSB7XG5cdFx0XHRyZWN0OiB7IHRvcDogZGVzYy5hcnRib2FyZFJlY3RbJ1RvcCAnXSwgbGVmdDogZGVzYy5hcnRib2FyZFJlY3QuTGVmdCwgYm90dG9tOiBkZXNjLmFydGJvYXJkUmVjdC5CdG9tLCByaWdodDogZGVzYy5hcnRib2FyZFJlY3QuUmdodCB9LFxuXHRcdFx0Z3VpZGVJbmRpY2VzOiBkZXNjLmd1aWRlSW5kZWNlcyxcblx0XHRcdHByZXNldE5hbWU6IGRlc2MuYXJ0Ym9hcmRQcmVzZXROYW1lLFxuXHRcdFx0Y29sb3I6IHBhcnNlQ29sb3IoZGVzY1snQ2xyICddKSxcblx0XHRcdGJhY2tncm91bmRUeXBlOiBkZXNjLmFydGJvYXJkQmFja2dyb3VuZFR5cGUsXG5cdFx0fTtcblxuXHRcdHNraXBCeXRlcyhyZWFkZXIsIGxlZnQoKSk7XG5cdH0sXG5cdCh3cml0ZXIsIHRhcmdldCkgPT4ge1xuXHRcdGNvbnN0IGFydGIgPSB0YXJnZXQuYXJ0Ym9hcmQhO1xuXHRcdGNvbnN0IGRlc2M6IEFydGJEZXNjcmlwdG9yID0ge1xuXHRcdFx0YXJ0Ym9hcmRSZWN0OiB7ICdUb3AgJzogYXJ0Yi5yZWN0LnRvcCwgTGVmdDogYXJ0Yi5yZWN0LmxlZnQsIEJ0b206IGFydGIucmVjdC5ib3R0b20sIFJnaHQ6IGFydGIucmVjdC5yaWdodCB9LFxuXHRcdFx0Z3VpZGVJbmRlY2VzOiBhcnRiLmd1aWRlSW5kaWNlcyB8fCBbXSxcblx0XHRcdGFydGJvYXJkUHJlc2V0TmFtZTogYXJ0Yi5wcmVzZXROYW1lIHx8ICcnLFxuXHRcdFx0J0NsciAnOiBzZXJpYWxpemVDb2xvcihhcnRiLmNvbG9yKSxcblx0XHRcdGFydGJvYXJkQmFja2dyb3VuZFR5cGU6IGFydGIuYmFja2dyb3VuZFR5cGUgPz8gMSxcblx0XHR9O1xuXG5cdFx0d3JpdGVWZXJzaW9uQW5kRGVzY3JpcHRvcih3cml0ZXIsICcnLCAnYXJ0Ym9hcmQnLCBkZXNjKTtcblx0fSxcbik7XG5cbmFkZEhhbmRsZXIoXG5cdCdzbjJQJyxcblx0aGFzS2V5KCd1c2luZ0FsaWduZWRSZW5kZXJpbmcnKSxcblx0KHJlYWRlciwgdGFyZ2V0KSA9PiB0YXJnZXQudXNpbmdBbGlnbmVkUmVuZGVyaW5nID0gISFyZWFkVWludDMyKHJlYWRlciksXG5cdCh3cml0ZXIsIHRhcmdldCkgPT4gd3JpdGVVaW50MzIod3JpdGVyLCB0YXJnZXQudXNpbmdBbGlnbmVkUmVuZGVyaW5nID8gMSA6IDApLFxuKTtcblxuY29uc3QgcGxhY2VkTGF5ZXJUeXBlczogUGxhY2VkTGF5ZXJUeXBlW10gPSBbJ3Vua25vd24nLCAndmVjdG9yJywgJ3Jhc3RlcicsICdpbWFnZSBzdGFjayddO1xuXG5mdW5jdGlvbiBwYXJzZVdhcnAod2FycDogV2FycERlc2NyaXB0b3IgJiBRdWlsdFdhcnBEZXNjcmlwdG9yKTogV2FycCB7XG5cdGNvbnN0IHJlc3VsdDogV2FycCA9IHtcblx0XHRzdHlsZTogd2FycFN0eWxlLmRlY29kZSh3YXJwLndhcnBTdHlsZSksXG5cdFx0dmFsdWU6IHdhcnAud2FycFZhbHVlIHx8IDAsXG5cdFx0cGVyc3BlY3RpdmU6IHdhcnAud2FycFBlcnNwZWN0aXZlIHx8IDAsXG5cdFx0cGVyc3BlY3RpdmVPdGhlcjogd2FycC53YXJwUGVyc3BlY3RpdmVPdGhlciB8fCAwLFxuXHRcdHJvdGF0ZTogT3JudC5kZWNvZGUod2FycC53YXJwUm90YXRlKSxcblx0XHRib3VuZHM6IHdhcnAuYm91bmRzICYmIHtcblx0XHRcdHRvcDogcGFyc2VVbml0c09yTnVtYmVyKHdhcnAuYm91bmRzWydUb3AgJ10pLFxuXHRcdFx0bGVmdDogcGFyc2VVbml0c09yTnVtYmVyKHdhcnAuYm91bmRzLkxlZnQpLFxuXHRcdFx0Ym90dG9tOiBwYXJzZVVuaXRzT3JOdW1iZXIod2FycC5ib3VuZHMuQnRvbSksXG5cdFx0XHRyaWdodDogcGFyc2VVbml0c09yTnVtYmVyKHdhcnAuYm91bmRzLlJnaHQpLFxuXHRcdH0sXG5cdFx0dU9yZGVyOiB3YXJwLnVPcmRlcixcblx0XHR2T3JkZXI6IHdhcnAudk9yZGVyLFxuXHR9O1xuXG5cdGlmICh3YXJwLmRlZm9ybU51bVJvd3MgIT0gbnVsbCB8fCB3YXJwLmRlZm9ybU51bUNvbHMgIT0gbnVsbCkge1xuXHRcdHJlc3VsdC5kZWZvcm1OdW1Sb3dzID0gd2FycC5kZWZvcm1OdW1Sb3dzO1xuXHRcdHJlc3VsdC5kZWZvcm1OdW1Db2xzID0gd2FycC5kZWZvcm1OdW1Db2xzO1xuXHR9XG5cblx0aWYgKHdhcnAuY3VzdG9tRW52ZWxvcGVXYXJwKSB7XG5cdFx0cmVzdWx0LmN1c3RvbUVudmVsb3BlV2FycCA9IHtcblx0XHRcdG1lc2hQb2ludHM6IFtdLFxuXHRcdH07XG5cblx0XHRjb25zdCB4cyA9IHdhcnAuY3VzdG9tRW52ZWxvcGVXYXJwIS5tZXNoUG9pbnRzLmZpbmQoaSA9PiBpLnR5cGUgPT09ICdIcnpuJyk/LnZhbHVlcyB8fCBbXTtcblx0XHRjb25zdCB5cyA9IHdhcnAuY3VzdG9tRW52ZWxvcGVXYXJwIS5tZXNoUG9pbnRzLmZpbmQoaSA9PiBpLnR5cGUgPT09ICdWcnRjJyk/LnZhbHVlcyB8fCBbXTtcblxuXHRcdGZvciAobGV0IGkgPSAwOyBpIDwgeHMubGVuZ3RoOyBpKyspIHtcblx0XHRcdHJlc3VsdC5jdXN0b21FbnZlbG9wZVdhcnAhLm1lc2hQb2ludHMucHVzaCh7IHg6IHhzW2ldLCB5OiB5c1tpXSB9KTtcblx0XHR9XG5cblx0XHRpZiAod2FycC5jdXN0b21FbnZlbG9wZVdhcnAucXVpbHRTbGljZVggfHwgd2FycC5jdXN0b21FbnZlbG9wZVdhcnAucXVpbHRTbGljZVkpIHtcblx0XHRcdHJlc3VsdC5jdXN0b21FbnZlbG9wZVdhcnAucXVpbHRTbGljZVggPSB3YXJwLmN1c3RvbUVudmVsb3BlV2FycC5xdWlsdFNsaWNlWD8uWzBdPy52YWx1ZXMgfHwgW107XG5cdFx0XHRyZXN1bHQuY3VzdG9tRW52ZWxvcGVXYXJwLnF1aWx0U2xpY2VZID0gd2FycC5jdXN0b21FbnZlbG9wZVdhcnAucXVpbHRTbGljZVk/LlswXT8udmFsdWVzIHx8IFtdO1xuXHRcdH1cblx0fVxuXG5cdHJldHVybiByZXN1bHQ7XG59XG5cbmZ1bmN0aW9uIGlzUXVpbHRXYXJwKHdhcnA6IFdhcnApIHtcblx0cmV0dXJuIHdhcnAuZGVmb3JtTnVtQ29scyAhPSBudWxsIHx8IHdhcnAuZGVmb3JtTnVtUm93cyAhPSBudWxsIHx8XG5cdFx0d2FycC5jdXN0b21FbnZlbG9wZVdhcnA/LnF1aWx0U2xpY2VYIHx8IHdhcnAuY3VzdG9tRW52ZWxvcGVXYXJwPy5xdWlsdFNsaWNlWTtcbn1cblxuZnVuY3Rpb24gZW5jb2RlV2FycCh3YXJwOiBXYXJwKTogV2FycERlc2NyaXB0b3Ige1xuXHRjb25zdCBkZXNjOiBXYXJwRGVzY3JpcHRvciA9IHtcblx0XHR3YXJwU3R5bGU6IHdhcnBTdHlsZS5lbmNvZGUod2FycC5zdHlsZSksXG5cdFx0d2FycFZhbHVlOiB3YXJwLnZhbHVlIHx8IDAsXG5cdFx0d2FycFBlcnNwZWN0aXZlOiB3YXJwLnBlcnNwZWN0aXZlIHx8IDAsXG5cdFx0d2FycFBlcnNwZWN0aXZlT3RoZXI6IHdhcnAucGVyc3BlY3RpdmVPdGhlciB8fCAwLFxuXHRcdHdhcnBSb3RhdGU6IE9ybnQuZW5jb2RlKHdhcnAucm90YXRlKSxcblx0XHRib3VuZHM6IHtcblx0XHRcdCdUb3AgJzogdW5pdHNWYWx1ZSh3YXJwLmJvdW5kcz8udG9wIHx8IHsgdW5pdHM6ICdQaXhlbHMnLCB2YWx1ZTogMCB9LCAnYm91bmRzLnRvcCcpLFxuXHRcdFx0TGVmdDogdW5pdHNWYWx1ZSh3YXJwLmJvdW5kcz8ubGVmdCB8fCB7IHVuaXRzOiAnUGl4ZWxzJywgdmFsdWU6IDAgfSwgJ2JvdW5kcy5sZWZ0JyksXG5cdFx0XHRCdG9tOiB1bml0c1ZhbHVlKHdhcnAuYm91bmRzPy5ib3R0b20gfHwgeyB1bml0czogJ1BpeGVscycsIHZhbHVlOiAwIH0sICdib3VuZHMuYm90dG9tJyksXG5cdFx0XHRSZ2h0OiB1bml0c1ZhbHVlKHdhcnAuYm91bmRzPy5yaWdodCB8fCB7IHVuaXRzOiAnUGl4ZWxzJywgdmFsdWU6IDAgfSwgJ2JvdW5kcy5yaWdodCcpLFxuXHRcdH0sXG5cdFx0dU9yZGVyOiB3YXJwLnVPcmRlciB8fCAwLFxuXHRcdHZPcmRlcjogd2FycC52T3JkZXIgfHwgMCxcblx0fTtcblxuXHRjb25zdCBpc1F1aWx0ID0gaXNRdWlsdFdhcnAod2FycCk7XG5cblx0aWYgKGlzUXVpbHQpIHtcblx0XHRjb25zdCBkZXNjMiA9IGRlc2MgYXMgUXVpbHRXYXJwRGVzY3JpcHRvcjtcblx0XHRkZXNjMi5kZWZvcm1OdW1Sb3dzID0gd2FycC5kZWZvcm1OdW1Sb3dzIHx8IDA7XG5cdFx0ZGVzYzIuZGVmb3JtTnVtQ29scyA9IHdhcnAuZGVmb3JtTnVtQ29scyB8fCAwO1xuXHR9XG5cblx0aWYgKHdhcnAuY3VzdG9tRW52ZWxvcGVXYXJwKSB7XG5cdFx0Y29uc3QgbWVzaFBvaW50cyA9IHdhcnAuY3VzdG9tRW52ZWxvcGVXYXJwLm1lc2hQb2ludHMgfHwgW107XG5cblx0XHRpZiAoaXNRdWlsdCkge1xuXHRcdFx0Y29uc3QgZGVzYzIgPSBkZXNjIGFzIFF1aWx0V2FycERlc2NyaXB0b3I7XG5cdFx0XHRkZXNjMi5jdXN0b21FbnZlbG9wZVdhcnAgPSB7XG5cdFx0XHRcdHF1aWx0U2xpY2VYOiBbe1xuXHRcdFx0XHRcdHR5cGU6ICdxdWlsdFNsaWNlWCcsXG5cdFx0XHRcdFx0dmFsdWVzOiB3YXJwLmN1c3RvbUVudmVsb3BlV2FycC5xdWlsdFNsaWNlWCB8fCBbXSxcblx0XHRcdFx0fV0sXG5cdFx0XHRcdHF1aWx0U2xpY2VZOiBbe1xuXHRcdFx0XHRcdHR5cGU6ICdxdWlsdFNsaWNlWScsXG5cdFx0XHRcdFx0dmFsdWVzOiB3YXJwLmN1c3RvbUVudmVsb3BlV2FycC5xdWlsdFNsaWNlWSB8fCBbXSxcblx0XHRcdFx0fV0sXG5cdFx0XHRcdG1lc2hQb2ludHM6IFtcblx0XHRcdFx0XHR7IHR5cGU6ICdIcnpuJywgdmFsdWVzOiBtZXNoUG9pbnRzLm1hcChwID0+IHAueCkgfSxcblx0XHRcdFx0XHR7IHR5cGU6ICdWcnRjJywgdmFsdWVzOiBtZXNoUG9pbnRzLm1hcChwID0+IHAueSkgfSxcblx0XHRcdFx0XSxcblx0XHRcdH07XG5cdFx0fSBlbHNlIHtcblx0XHRcdGRlc2MuY3VzdG9tRW52ZWxvcGVXYXJwID0ge1xuXHRcdFx0XHRtZXNoUG9pbnRzOiBbXG5cdFx0XHRcdFx0eyB0eXBlOiAnSHJ6bicsIHZhbHVlczogbWVzaFBvaW50cy5tYXAocCA9PiBwLngpIH0sXG5cdFx0XHRcdFx0eyB0eXBlOiAnVnJ0YycsIHZhbHVlczogbWVzaFBvaW50cy5tYXAocCA9PiBwLnkpIH0sXG5cdFx0XHRcdF0sXG5cdFx0XHR9O1xuXHRcdH1cblx0fVxuXG5cdHJldHVybiBkZXNjO1xufVxuXG5hZGRIYW5kbGVyKFxuXHQnUGxMZCcsXG5cdGhhc0tleSgncGxhY2VkTGF5ZXInKSxcblx0KHJlYWRlciwgdGFyZ2V0LCBsZWZ0KSA9PiB7XG5cdFx0aWYgKHJlYWRTaWduYXR1cmUocmVhZGVyKSAhPT0gJ3BsY0wnKSB0aHJvdyBuZXcgRXJyb3IoYEludmFsaWQgUGxMZCBzaWduYXR1cmVgKTtcblx0XHRpZiAocmVhZEludDMyKHJlYWRlcikgIT09IDMpIHRocm93IG5ldyBFcnJvcihgSW52YWxpZCBQbExkIHZlcnNpb25gKTtcblx0XHRjb25zdCBpZCA9IHJlYWRQYXNjYWxTdHJpbmcocmVhZGVyLCAxKTtcblx0XHRyZWFkSW50MzIocmVhZGVyKTsgLy8gcGFnZU51bWJlclxuXHRcdHJlYWRJbnQzMihyZWFkZXIpOyAvLyB0b3RhbFBhZ2VzLCBUT0RPOiBjaGVjayBob3cgdGhpcyB3b3JrcyA/XG5cdFx0cmVhZEludDMyKHJlYWRlcik7IC8vIGFuaXRBbGlhc1BvbGljeSAxNlxuXHRcdGNvbnN0IHBsYWNlZExheWVyVHlwZSA9IHJlYWRJbnQzMihyZWFkZXIpOyAvLyAwID0gdW5rbm93biwgMSA9IHZlY3RvciwgMiA9IHJhc3RlciwgMyA9IGltYWdlIHN0YWNrXG5cdFx0aWYgKCFwbGFjZWRMYXllclR5cGVzW3BsYWNlZExheWVyVHlwZV0pIHRocm93IG5ldyBFcnJvcignSW52YWxpZCBQbExkIHR5cGUnKTtcblx0XHRjb25zdCB0cmFuc2Zvcm06IG51bWJlcltdID0gW107XG5cdFx0Zm9yIChsZXQgaSA9IDA7IGkgPCA4OyBpKyspIHRyYW5zZm9ybS5wdXNoKHJlYWRGbG9hdDY0KHJlYWRlcikpOyAvLyB4LCB5IG9mIDQgY29ybmVycyBvZiB0aGUgdHJhbnNmb3JtXG5cdFx0Y29uc3Qgd2FycFZlcnNpb24gPSByZWFkSW50MzIocmVhZGVyKTtcblx0XHRpZiAod2FycFZlcnNpb24gIT09IDApIHRocm93IG5ldyBFcnJvcihgSW52YWxpZCBXYXJwIHZlcnNpb24gJHt3YXJwVmVyc2lvbn1gKTtcblx0XHRjb25zdCB3YXJwOiBXYXJwRGVzY3JpcHRvciAmIFF1aWx0V2FycERlc2NyaXB0b3IgPSByZWFkVmVyc2lvbkFuZERlc2NyaXB0b3IocmVhZGVyKTtcblxuXHRcdHRhcmdldC5wbGFjZWRMYXllciA9IHRhcmdldC5wbGFjZWRMYXllciB8fCB7IC8vIHNraXAgaWYgU29MZCBhbHJlYWR5IHNldCBpdFxuXHRcdFx0aWQsXG5cdFx0XHR0eXBlOiBwbGFjZWRMYXllclR5cGVzW3BsYWNlZExheWVyVHlwZV0sXG5cdFx0XHQvLyBwYWdlTnVtYmVyLFxuXHRcdFx0Ly8gdG90YWxQYWdlcyxcblx0XHRcdHRyYW5zZm9ybSxcblx0XHRcdHdhcnA6IHBhcnNlV2FycCh3YXJwKSxcblx0XHR9O1xuXG5cdFx0Ly8gY29uc29sZS5sb2coJ1BsTGQgd2FycCcsIHJlcXVpcmUoJ3V0aWwnKS5pbnNwZWN0KHdhcnAsIGZhbHNlLCA5OSwgdHJ1ZSkpO1xuXHRcdC8vIGNvbnNvbGUubG9nKCdQbExkJywgcmVxdWlyZSgndXRpbCcpLmluc3BlY3QodGFyZ2V0LnBsYWNlZExheWVyLCBmYWxzZSwgOTksIHRydWUpKTtcblxuXHRcdHNraXBCeXRlcyhyZWFkZXIsIGxlZnQoKSk7XG5cdH0sXG5cdCh3cml0ZXIsIHRhcmdldCkgPT4ge1xuXHRcdGNvbnN0IHBsYWNlZCA9IHRhcmdldC5wbGFjZWRMYXllciE7XG5cdFx0d3JpdGVTaWduYXR1cmUod3JpdGVyLCAncGxjTCcpO1xuXHRcdHdyaXRlSW50MzIod3JpdGVyLCAzKTsgLy8gdmVyc2lvblxuXHRcdHdyaXRlUGFzY2FsU3RyaW5nKHdyaXRlciwgcGxhY2VkLmlkLCAxKTtcblx0XHR3cml0ZUludDMyKHdyaXRlciwgMSk7IC8vIHBhZ2VOdW1iZXJcblx0XHR3cml0ZUludDMyKHdyaXRlciwgMSk7IC8vIHRvdGFsUGFnZXNcblx0XHR3cml0ZUludDMyKHdyaXRlciwgMTYpOyAvLyBhbml0QWxpYXNQb2xpY3lcblx0XHRpZiAocGxhY2VkTGF5ZXJUeXBlcy5pbmRleE9mKHBsYWNlZC50eXBlKSA9PT0gLTEpIHRocm93IG5ldyBFcnJvcignSW52YWxpZCBwbGFjZWRMYXllciB0eXBlJyk7XG5cdFx0d3JpdGVJbnQzMih3cml0ZXIsIHBsYWNlZExheWVyVHlwZXMuaW5kZXhPZihwbGFjZWQudHlwZSkpO1xuXHRcdGZvciAobGV0IGkgPSAwOyBpIDwgODsgaSsrKSB3cml0ZUZsb2F0NjQod3JpdGVyLCBwbGFjZWQudHJhbnNmb3JtW2ldKTtcblx0XHR3cml0ZUludDMyKHdyaXRlciwgMCk7IC8vIHdhcnAgdmVyc2lvblxuXHRcdGNvbnN0IGlzUXVpbHQgPSBwbGFjZWQud2FycCAmJiBpc1F1aWx0V2FycChwbGFjZWQud2FycCk7XG5cdFx0Y29uc3QgdHlwZSA9IGlzUXVpbHQgPyAncXVpbHRXYXJwJyA6ICd3YXJwJztcblx0XHR3cml0ZVZlcnNpb25BbmREZXNjcmlwdG9yKHdyaXRlciwgJycsIHR5cGUsIGVuY29kZVdhcnAocGxhY2VkLndhcnAgfHwge30pLCB0eXBlKTtcblx0fSxcbik7XG5cbmludGVyZmFjZSBTb0xkRGVzY3JpcHRvciB7XG5cdElkbnQ6IHN0cmluZztcblx0cGxhY2VkOiBzdHJpbmc7XG5cdFBnTm06IG51bWJlcjtcblx0dG90YWxQYWdlczogbnVtYmVyO1xuXHRDcm9wPzogbnVtYmVyO1xuXHRmcmFtZVN0ZXA6IHsgbnVtZXJhdG9yOiBudW1iZXI7IGRlbm9taW5hdG9yOiBudW1iZXI7IH07XG5cdGR1cmF0aW9uOiB7IG51bWVyYXRvcjogbnVtYmVyOyBkZW5vbWluYXRvcjogbnVtYmVyOyB9O1xuXHRmcmFtZUNvdW50OiBudW1iZXI7XG5cdEFubnQ6IG51bWJlcjtcblx0VHlwZTogbnVtYmVyO1xuXHRUcm5mOiBudW1iZXJbXTtcblx0bm9uQWZmaW5lVHJhbnNmb3JtOiBudW1iZXJbXTtcblx0cXVpbHRXYXJwPzogUXVpbHRXYXJwRGVzY3JpcHRvcjtcblx0d2FycDogV2FycERlc2NyaXB0b3I7XG5cdCdTeiAgJzogeyBXZHRoOiBudW1iZXI7IEhnaHQ6IG51bWJlcjsgfTtcblx0UnNsdDogRGVzY3JpcHRvclVuaXRzVmFsdWU7XG5cdGNvbXA/OiBudW1iZXI7XG5cdGNvbXBJbmZvPzogeyBjb21wSUQ6IG51bWJlcjsgb3JpZ2luYWxDb21wSUQ6IG51bWJlcjsgfTtcbn1cblxuYWRkSGFuZGxlcihcblx0J1NvTGQnLFxuXHRoYXNLZXkoJ3BsYWNlZExheWVyJyksXG5cdChyZWFkZXIsIHRhcmdldCwgbGVmdCkgPT4ge1xuXHRcdGlmIChyZWFkU2lnbmF0dXJlKHJlYWRlcikgIT09ICdzb0xEJykgdGhyb3cgbmV3IEVycm9yKGBJbnZhbGlkIFNvTGQgdHlwZWApO1xuXHRcdGlmIChyZWFkSW50MzIocmVhZGVyKSAhPT0gNCkgdGhyb3cgbmV3IEVycm9yKGBJbnZhbGlkIFNvTGQgdmVyc2lvbmApO1xuXHRcdGNvbnN0IGRlc2M6IFNvTGREZXNjcmlwdG9yID0gcmVhZFZlcnNpb25BbmREZXNjcmlwdG9yKHJlYWRlcik7XG5cdFx0Ly8gY29uc29sZS5sb2coJ1NvTGQnLCByZXF1aXJlKCd1dGlsJykuaW5zcGVjdChkZXNjLCBmYWxzZSwgOTksIHRydWUpKTtcblx0XHQvLyBjb25zb2xlLmxvZygnU29MZC53YXJwJywgcmVxdWlyZSgndXRpbCcpLmluc3BlY3QoZGVzYy53YXJwLCBmYWxzZSwgOTksIHRydWUpKTtcblx0XHQvLyBjb25zb2xlLmxvZygnU29MZC5xdWlsdFdhcnAnLCByZXF1aXJlKCd1dGlsJykuaW5zcGVjdChkZXNjLnF1aWx0V2FycCwgZmFsc2UsIDk5LCB0cnVlKSk7XG5cblx0XHR0YXJnZXQucGxhY2VkTGF5ZXIgPSB7XG5cdFx0XHRpZDogZGVzYy5JZG50LFxuXHRcdFx0cGxhY2VkOiBkZXNjLnBsYWNlZCxcblx0XHRcdHR5cGU6IHBsYWNlZExheWVyVHlwZXNbZGVzYy5UeXBlXSxcblx0XHRcdC8vIHBhZ2VOdW1iZXI6IGluZm8uUGdObSxcblx0XHRcdC8vIHRvdGFsUGFnZXM6IGluZm8udG90YWxQYWdlcyxcblx0XHRcdC8vIGZyYW1lU3RlcDogaW5mby5mcmFtZVN0ZXAsXG5cdFx0XHQvLyBkdXJhdGlvbjogaW5mby5kdXJhdGlvbixcblx0XHRcdC8vIGZyYW1lQ291bnQ6IGluZm8uZnJhbWVDb3VudCxcblx0XHRcdHRyYW5zZm9ybTogZGVzYy5Ucm5mLFxuXHRcdFx0d2lkdGg6IGRlc2NbJ1N6ICAnXS5XZHRoLFxuXHRcdFx0aGVpZ2h0OiBkZXNjWydTeiAgJ10uSGdodCxcblx0XHRcdHJlc29sdXRpb246IHBhcnNlVW5pdHMoZGVzYy5Sc2x0KSxcblx0XHRcdHdhcnA6IHBhcnNlV2FycCgoZGVzYy5xdWlsdFdhcnAgfHwgZGVzYy53YXJwKSBhcyBhbnkpLFxuXHRcdH07XG5cblx0XHRpZiAoZGVzYy5Dcm9wKSB0YXJnZXQucGxhY2VkTGF5ZXIuY3JvcCA9IGRlc2MuQ3JvcDtcblx0XHRpZiAoZGVzYy5jb21wKSB0YXJnZXQucGxhY2VkTGF5ZXIuY29tcCA9IGRlc2MuY29tcDtcblx0XHRpZiAoZGVzYy5jb21wSW5mbykgdGFyZ2V0LnBsYWNlZExheWVyLmNvbXBJbmZvID0gZGVzYy5jb21wSW5mbztcblxuXHRcdHNraXBCeXRlcyhyZWFkZXIsIGxlZnQoKSk7IC8vIEhBQ0tcblx0fSxcblx0KHdyaXRlciwgdGFyZ2V0KSA9PiB7XG5cdFx0d3JpdGVTaWduYXR1cmUod3JpdGVyLCAnc29MRCcpO1xuXHRcdHdyaXRlSW50MzIod3JpdGVyLCA0KTsgLy8gdmVyc2lvblxuXG5cdFx0Y29uc3QgcGxhY2VkID0gdGFyZ2V0LnBsYWNlZExheWVyITtcblx0XHRjb25zdCBkZXNjOiBTb0xkRGVzY3JpcHRvciA9IHtcblx0XHRcdElkbnQ6IHBsYWNlZC5pZCxcblx0XHRcdHBsYWNlZDogcGxhY2VkLnBsYWNlZCA/PyBwbGFjZWQuaWQsIC8vID8/P1xuXHRcdFx0UGdObTogMSxcblx0XHRcdHRvdGFsUGFnZXM6IDEsXG5cdFx0XHQuLi4ocGxhY2VkLmNyb3AgPyB7IENyb3A6IHBsYWNlZC5jcm9wIH0gOiB7fSksXG5cdFx0XHRmcmFtZVN0ZXA6IHtcblx0XHRcdFx0bnVtZXJhdG9yOiAwLFxuXHRcdFx0XHRkZW5vbWluYXRvcjogNjAwXG5cdFx0XHR9LFxuXHRcdFx0ZHVyYXRpb246IHtcblx0XHRcdFx0bnVtZXJhdG9yOiAwLFxuXHRcdFx0XHRkZW5vbWluYXRvcjogNjAwXG5cdFx0XHR9LFxuXHRcdFx0ZnJhbWVDb3VudDogMSxcblx0XHRcdEFubnQ6IDE2LFxuXHRcdFx0VHlwZTogcGxhY2VkTGF5ZXJUeXBlcy5pbmRleE9mKHBsYWNlZC50eXBlKSxcblx0XHRcdFRybmY6IHBsYWNlZC50cmFuc2Zvcm0sXG5cdFx0XHRub25BZmZpbmVUcmFuc2Zvcm06IHBsYWNlZC50cmFuc2Zvcm0sXG5cdFx0XHRxdWlsdFdhcnA6IHt9IGFzIGFueSxcblx0XHRcdHdhcnA6IGVuY29kZVdhcnAocGxhY2VkLndhcnAgfHwge30pLFxuXHRcdFx0J1N6ICAnOiB7XG5cdFx0XHRcdFdkdGg6IHBsYWNlZC53aWR0aCB8fCAwLCAvLyBUT0RPOiBmaW5kIHNpemUgP1xuXHRcdFx0XHRIZ2h0OiBwbGFjZWQuaGVpZ2h0IHx8IDAsIC8vIFRPRE86IGZpbmQgc2l6ZSA/XG5cdFx0XHR9LFxuXHRcdFx0UnNsdDogcGxhY2VkLnJlc29sdXRpb24gPyB1bml0c1ZhbHVlKHBsYWNlZC5yZXNvbHV0aW9uLCAncmVzb2x1dGlvbicpIDogeyB1bml0czogJ0RlbnNpdHknLCB2YWx1ZTogNzIgfSxcblx0XHR9O1xuXG5cdFx0aWYgKHBsYWNlZC53YXJwICYmIGlzUXVpbHRXYXJwKHBsYWNlZC53YXJwKSkge1xuXHRcdFx0Y29uc3QgcXVpbHRXYXJwID0gZW5jb2RlV2FycChwbGFjZWQud2FycCkgYXMgUXVpbHRXYXJwRGVzY3JpcHRvcjtcblx0XHRcdGRlc2MucXVpbHRXYXJwID0gcXVpbHRXYXJwO1xuXHRcdFx0ZGVzYy53YXJwID0ge1xuXHRcdFx0XHR3YXJwU3R5bGU6ICd3YXJwU3R5bGUud2FycE5vbmUnLFxuXHRcdFx0XHR3YXJwVmFsdWU6IHF1aWx0V2FycC53YXJwVmFsdWUsXG5cdFx0XHRcdHdhcnBQZXJzcGVjdGl2ZTogcXVpbHRXYXJwLndhcnBQZXJzcGVjdGl2ZSxcblx0XHRcdFx0d2FycFBlcnNwZWN0aXZlT3RoZXI6IHF1aWx0V2FycC53YXJwUGVyc3BlY3RpdmVPdGhlcixcblx0XHRcdFx0d2FycFJvdGF0ZTogcXVpbHRXYXJwLndhcnBSb3RhdGUsXG5cdFx0XHRcdGJvdW5kczogcXVpbHRXYXJwLmJvdW5kcyxcblx0XHRcdFx0dU9yZGVyOiBxdWlsdFdhcnAudU9yZGVyLFxuXHRcdFx0XHR2T3JkZXI6IHF1aWx0V2FycC52T3JkZXIsXG5cdFx0XHR9O1xuXHRcdH0gZWxzZSB7XG5cdFx0XHRkZWxldGUgZGVzYy5xdWlsdFdhcnA7XG5cdFx0fVxuXG5cdFx0aWYgKHBsYWNlZC5jb21wKSBkZXNjLmNvbXAgPSBwbGFjZWQuY29tcDtcblx0XHRpZiAocGxhY2VkLmNvbXBJbmZvKSBkZXNjLmNvbXBJbmZvID0gcGxhY2VkLmNvbXBJbmZvO1xuXG5cdFx0d3JpdGVWZXJzaW9uQW5kRGVzY3JpcHRvcih3cml0ZXIsICcnLCAnbnVsbCcsIGRlc2MsIGRlc2MucXVpbHRXYXJwID8gJ3F1aWx0V2FycCcgOiAnd2FycCcpO1xuXHR9LFxuKTtcblxuYWRkSGFuZGxlcihcblx0J2Z4cnAnLFxuXHRoYXNLZXkoJ3JlZmVyZW5jZVBvaW50JyksXG5cdChyZWFkZXIsIHRhcmdldCkgPT4ge1xuXHRcdHRhcmdldC5yZWZlcmVuY2VQb2ludCA9IHtcblx0XHRcdHg6IHJlYWRGbG9hdDY0KHJlYWRlciksXG5cdFx0XHR5OiByZWFkRmxvYXQ2NChyZWFkZXIpLFxuXHRcdH07XG5cdH0sXG5cdCh3cml0ZXIsIHRhcmdldCkgPT4ge1xuXHRcdHdyaXRlRmxvYXQ2NCh3cml0ZXIsIHRhcmdldC5yZWZlcmVuY2VQb2ludCEueCk7XG5cdFx0d3JpdGVGbG9hdDY0KHdyaXRlciwgdGFyZ2V0LnJlZmVyZW5jZVBvaW50IS55KTtcblx0fSxcbik7XG5cbmlmIChNT0NLX0hBTkRMRVJTKSB7XG5cdGFkZEhhbmRsZXIoXG5cdFx0J1BhdHQnLFxuXHRcdHRhcmdldCA9PiAodGFyZ2V0IGFzIGFueSkuX1BhdHQgIT09IHVuZGVmaW5lZCxcblx0XHQocmVhZGVyLCB0YXJnZXQsIGxlZnQpID0+IHtcblx0XHRcdC8vIGNvbnNvbGUubG9nKCdhZGRpdGlvbmFsIGluZm86IFBhdHQnKTtcblx0XHRcdCh0YXJnZXQgYXMgYW55KS5fUGF0dCA9IHJlYWRCeXRlcyhyZWFkZXIsIGxlZnQoKSk7XG5cdFx0fSxcblx0XHQod3JpdGVyLCB0YXJnZXQpID0+IGZhbHNlICYmIHdyaXRlQnl0ZXMod3JpdGVyLCAodGFyZ2V0IGFzIGFueSkuX1BhdHQpLFxuXHQpO1xufSBlbHNlIHtcblx0YWRkSGFuZGxlcihcblx0XHQnUGF0dCcsIC8vIFRPRE86IGhhbmRsZSBhbHNvIFBhdDIgJiBQYXQzXG5cdFx0dGFyZ2V0ID0+ICF0YXJnZXQsXG5cdFx0KHJlYWRlciwgdGFyZ2V0LCBsZWZ0KSA9PiB7XG5cdFx0XHRpZiAoIWxlZnQoKSkgcmV0dXJuO1xuXG5cdFx0XHRza2lwQnl0ZXMocmVhZGVyLCBsZWZ0KCkpOyByZXR1cm47IC8vIG5vdCBzdXBwb3J0ZWQgeWV0XG5cdFx0XHR0YXJnZXQ7IHJlYWRQYXR0ZXJuO1xuXG5cdFx0XHQvLyBpZiAoIXRhcmdldC5wYXR0ZXJucykgdGFyZ2V0LnBhdHRlcm5zID0gW107XG5cdFx0XHQvLyB0YXJnZXQucGF0dGVybnMucHVzaChyZWFkUGF0dGVybihyZWFkZXIpKTtcblx0XHRcdC8vIHNraXBCeXRlcyhyZWFkZXIsIGxlZnQoKSk7XG5cdFx0fSxcblx0XHQoX3dyaXRlciwgX3RhcmdldCkgPT4ge1xuXHRcdH0sXG5cdCk7XG59XG5cbmZ1bmN0aW9uIHJlYWRSZWN0KHJlYWRlcjogUHNkUmVhZGVyKSB7XG5cdGNvbnN0IHRvcCA9IHJlYWRJbnQzMihyZWFkZXIpO1xuXHRjb25zdCBsZWZ0ID0gcmVhZEludDMyKHJlYWRlcik7XG5cdGNvbnN0IGJvdHRvbSA9IHJlYWRJbnQzMihyZWFkZXIpO1xuXHRjb25zdCByaWdodCA9IHJlYWRJbnQzMihyZWFkZXIpO1xuXHRyZXR1cm4geyB0b3AsIGxlZnQsIGJvdHRvbSwgcmlnaHQgfTtcbn1cblxuZnVuY3Rpb24gd3JpdGVSZWN0KHdyaXRlcjogUHNkV3JpdGVyLCByZWN0OiB7IGxlZnQ6IG51bWJlcjsgdG9wOiBudW1iZXI7IHJpZ2h0OiBudW1iZXI7IGJvdHRvbTogbnVtYmVyIH0pIHtcblx0d3JpdGVJbnQzMih3cml0ZXIsIHJlY3QudG9wKTtcblx0d3JpdGVJbnQzMih3cml0ZXIsIHJlY3QubGVmdCk7XG5cdHdyaXRlSW50MzIod3JpdGVyLCByZWN0LmJvdHRvbSk7XG5cdHdyaXRlSW50MzIod3JpdGVyLCByZWN0LnJpZ2h0KTtcbn1cblxuYWRkSGFuZGxlcihcblx0J0Fubm8nLFxuXHR0YXJnZXQgPT4gKHRhcmdldCBhcyBQc2QpLmFubm90YXRpb25zICE9PSB1bmRlZmluZWQsXG5cdChyZWFkZXIsIHRhcmdldCwgbGVmdCkgPT4ge1xuXHRcdGNvbnN0IG1ham9yID0gcmVhZFVpbnQxNihyZWFkZXIpO1xuXHRcdGNvbnN0IG1pbm9yID0gcmVhZFVpbnQxNihyZWFkZXIpO1xuXHRcdGlmIChtYWpvciAhPT0gMiB8fCBtaW5vciAhPT0gMSkgdGhyb3cgbmV3IEVycm9yKCdJbnZhbGlkIEFubm8gdmVyc2lvbicpO1xuXHRcdGNvbnN0IGNvdW50ID0gcmVhZFVpbnQzMihyZWFkZXIpO1xuXHRcdGNvbnN0IGFubm90YXRpb25zOiBBbm5vdGF0aW9uW10gPSBbXTtcblxuXHRcdGZvciAobGV0IGkgPSAwOyBpIDwgY291bnQ7IGkrKykge1xuXHRcdFx0Lypjb25zdCBsZW5ndGggPSovIHJlYWRVaW50MzIocmVhZGVyKTtcblx0XHRcdGNvbnN0IHR5cGUgPSByZWFkU2lnbmF0dXJlKHJlYWRlcik7XG5cdFx0XHRjb25zdCBvcGVuID0gISFyZWFkVWludDgocmVhZGVyKTtcblx0XHRcdC8qY29uc3QgZmxhZ3MgPSovIHJlYWRVaW50OChyZWFkZXIpOyAvLyBhbHdheXMgMjhcblx0XHRcdC8qY29uc3Qgb3B0aW9uYWxCbG9ja3MgPSovIHJlYWRVaW50MTYocmVhZGVyKTtcblx0XHRcdGNvbnN0IGljb25Mb2NhdGlvbiA9IHJlYWRSZWN0KHJlYWRlcik7XG5cdFx0XHRjb25zdCBwb3B1cExvY2F0aW9uID0gcmVhZFJlY3QocmVhZGVyKTtcblx0XHRcdGNvbnN0IGNvbG9yID0gcmVhZENvbG9yKHJlYWRlcik7XG5cdFx0XHRjb25zdCBhdXRob3IgPSByZWFkUGFzY2FsU3RyaW5nKHJlYWRlciwgMik7XG5cdFx0XHRjb25zdCBuYW1lID0gcmVhZFBhc2NhbFN0cmluZyhyZWFkZXIsIDIpO1xuXHRcdFx0Y29uc3QgZGF0ZSA9IHJlYWRQYXNjYWxTdHJpbmcocmVhZGVyLCAyKTtcblx0XHRcdC8qY29uc3QgY29udGVudExlbmd0aCA9Ki8gcmVhZFVpbnQzMihyZWFkZXIpO1xuXHRcdFx0Lypjb25zdCBkYXRhVHlwZSA9Ki8gcmVhZFNpZ25hdHVyZShyZWFkZXIpO1xuXHRcdFx0Y29uc3QgZGF0YUxlbmd0aCA9IHJlYWRVaW50MzIocmVhZGVyKTtcblx0XHRcdGxldCBkYXRhOiBzdHJpbmcgfCBVaW50OEFycmF5O1xuXG5cdFx0XHRpZiAodHlwZSA9PT0gJ3R4dEEnKSB7XG5cdFx0XHRcdGlmIChkYXRhTGVuZ3RoID49IDIgJiYgcmVhZFVpbnQxNihyZWFkZXIpID09PSAweGZlZmYpIHtcblx0XHRcdFx0XHRkYXRhID0gcmVhZFVuaWNvZGVTdHJpbmdXaXRoTGVuZ3RoKHJlYWRlciwgKGRhdGFMZW5ndGggLSAyKSAvIDIpO1xuXHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdHJlYWRlci5vZmZzZXQgLT0gMjtcblx0XHRcdFx0XHRkYXRhID0gcmVhZEFzY2lpU3RyaW5nKHJlYWRlciwgZGF0YUxlbmd0aCk7XG5cdFx0XHRcdH1cblxuXHRcdFx0XHRkYXRhID0gZGF0YS5yZXBsYWNlKC9cXHIvZywgJ1xcbicpO1xuXHRcdFx0fSBlbHNlIGlmICh0eXBlID09PSAnc25kQScpIHtcblx0XHRcdFx0ZGF0YSA9IHJlYWRCeXRlcyhyZWFkZXIsIGRhdGFMZW5ndGgpO1xuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0dGhyb3cgbmV3IEVycm9yKCdVbmtub3duIGFubm90YXRpb24gdHlwZScpO1xuXHRcdFx0fVxuXG5cdFx0XHRhbm5vdGF0aW9ucy5wdXNoKHtcblx0XHRcdFx0dHlwZTogdHlwZSA9PT0gJ3R4dEEnID8gJ3RleHQnIDogJ3NvdW5kJywgb3BlbiwgaWNvbkxvY2F0aW9uLCBwb3B1cExvY2F0aW9uLCBjb2xvciwgYXV0aG9yLCBuYW1lLCBkYXRlLCBkYXRhLFxuXHRcdFx0fSk7XG5cdFx0fVxuXG5cdFx0KHRhcmdldCBhcyBQc2QpLmFubm90YXRpb25zID0gYW5ub3RhdGlvbnM7XG5cdFx0c2tpcEJ5dGVzKHJlYWRlciwgbGVmdCgpKTtcblx0fSxcblx0KHdyaXRlciwgdGFyZ2V0KSA9PiB7XG5cdFx0Y29uc3QgYW5ub3RhdGlvbnMgPSAodGFyZ2V0IGFzIFBzZCkuYW5ub3RhdGlvbnMhO1xuXG5cdFx0d3JpdGVVaW50MTYod3JpdGVyLCAyKTtcblx0XHR3cml0ZVVpbnQxNih3cml0ZXIsIDEpO1xuXHRcdHdyaXRlVWludDMyKHdyaXRlciwgYW5ub3RhdGlvbnMubGVuZ3RoKTtcblxuXHRcdGZvciAoY29uc3QgYW5ub3RhdGlvbiBvZiBhbm5vdGF0aW9ucykge1xuXHRcdFx0Y29uc3Qgc291bmQgPSBhbm5vdGF0aW9uLnR5cGUgPT09ICdzb3VuZCc7XG5cblx0XHRcdGlmIChzb3VuZCAmJiAhKGFubm90YXRpb24uZGF0YSBpbnN0YW5jZW9mIFVpbnQ4QXJyYXkpKSB0aHJvdyBuZXcgRXJyb3IoJ1NvdW5kIGFubm90YXRpb24gZGF0YSBzaG91bGQgYmUgVWludDhBcnJheScpO1xuXHRcdFx0aWYgKCFzb3VuZCAmJiB0eXBlb2YgYW5ub3RhdGlvbi5kYXRhICE9PSAnc3RyaW5nJykgdGhyb3cgbmV3IEVycm9yKCdUZXh0IGFubm90YXRpb24gZGF0YSBzaG91bGQgYmUgc3RyaW5nJyk7XG5cblx0XHRcdGNvbnN0IGxlbmd0aE9mZnNldCA9IHdyaXRlci5vZmZzZXQ7XG5cdFx0XHR3cml0ZVVpbnQzMih3cml0ZXIsIDApOyAvLyBsZW5ndGhcblx0XHRcdHdyaXRlU2lnbmF0dXJlKHdyaXRlciwgc291bmQgPyAnc25kQScgOiAndHh0QScpO1xuXHRcdFx0d3JpdGVVaW50OCh3cml0ZXIsIGFubm90YXRpb24ub3BlbiA/IDEgOiAwKTtcblx0XHRcdHdyaXRlVWludDgod3JpdGVyLCAyOCk7XG5cdFx0XHR3cml0ZVVpbnQxNih3cml0ZXIsIDEpO1xuXHRcdFx0d3JpdGVSZWN0KHdyaXRlciwgYW5ub3RhdGlvbi5pY29uTG9jYXRpb24pO1xuXHRcdFx0d3JpdGVSZWN0KHdyaXRlciwgYW5ub3RhdGlvbi5wb3B1cExvY2F0aW9uKTtcblx0XHRcdHdyaXRlQ29sb3Iod3JpdGVyLCBhbm5vdGF0aW9uLmNvbG9yKTtcblx0XHRcdHdyaXRlUGFzY2FsU3RyaW5nKHdyaXRlciwgYW5ub3RhdGlvbi5hdXRob3IgfHwgJycsIDIpO1xuXHRcdFx0d3JpdGVQYXNjYWxTdHJpbmcod3JpdGVyLCBhbm5vdGF0aW9uLm5hbWUgfHwgJycsIDIpO1xuXHRcdFx0d3JpdGVQYXNjYWxTdHJpbmcod3JpdGVyLCBhbm5vdGF0aW9uLmRhdGUgfHwgJycsIDIpO1xuXHRcdFx0Y29uc3QgY29udGVudE9mZnNldCA9IHdyaXRlci5vZmZzZXQ7XG5cdFx0XHR3cml0ZVVpbnQzMih3cml0ZXIsIDApOyAvLyBjb250ZW50IGxlbmd0aFxuXHRcdFx0d3JpdGVTaWduYXR1cmUod3JpdGVyLCBzb3VuZCA/ICdzbmRNJyA6ICd0eHRDJyk7XG5cdFx0XHR3cml0ZVVpbnQzMih3cml0ZXIsIDApOyAvLyBkYXRhIGxlbmd0aFxuXHRcdFx0Y29uc3QgZGF0YU9mZnNldCA9IHdyaXRlci5vZmZzZXQ7XG5cblx0XHRcdGlmIChzb3VuZCkge1xuXHRcdFx0XHR3cml0ZUJ5dGVzKHdyaXRlciwgYW5ub3RhdGlvbi5kYXRhIGFzIFVpbnQ4QXJyYXkpO1xuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0d3JpdGVVaW50MTYod3JpdGVyLCAweGZlZmYpOyAvLyB1bmljb2RlIHN0cmluZyBpbmRpY2F0b3Jcblx0XHRcdFx0Y29uc3QgdGV4dCA9IChhbm5vdGF0aW9uLmRhdGEgYXMgc3RyaW5nKS5yZXBsYWNlKC9cXG4vZywgJ1xccicpO1xuXHRcdFx0XHRmb3IgKGxldCBpID0gMDsgaSA8IHRleHQubGVuZ3RoOyBpKyspIHdyaXRlVWludDE2KHdyaXRlciwgdGV4dC5jaGFyQ29kZUF0KGkpKTtcblx0XHRcdH1cblxuXHRcdFx0d3JpdGVyLnZpZXcuc2V0VWludDMyKGxlbmd0aE9mZnNldCwgd3JpdGVyLm9mZnNldCAtIGxlbmd0aE9mZnNldCwgZmFsc2UpO1xuXHRcdFx0d3JpdGVyLnZpZXcuc2V0VWludDMyKGNvbnRlbnRPZmZzZXQsIHdyaXRlci5vZmZzZXQgLSBjb250ZW50T2Zmc2V0LCBmYWxzZSk7XG5cdFx0XHR3cml0ZXIudmlldy5zZXRVaW50MzIoZGF0YU9mZnNldCAtIDQsIHdyaXRlci5vZmZzZXQgLSBkYXRhT2Zmc2V0LCBmYWxzZSk7XG5cdFx0fVxuXHR9XG4pO1xuXG5pbnRlcmZhY2UgRmlsZU9wZW5EZXNjcmlwdG9yIHtcblx0Y29tcEluZm86IHsgY29tcElEOiBudW1iZXI7IG9yaWdpbmFsQ29tcElEOiBudW1iZXI7IH07XG59XG5cbmFkZEhhbmRsZXIoXG5cdCdsbmsyJyxcblx0KHRhcmdldDogYW55KSA9PiAhISh0YXJnZXQgYXMgUHNkKS5saW5rZWRGaWxlcyAmJiAodGFyZ2V0IGFzIFBzZCkubGlua2VkRmlsZXMhLmxlbmd0aCA+IDAsXG5cdChyZWFkZXIsIHRhcmdldCwgbGVmdCwgXywgb3B0aW9ucykgPT4ge1xuXHRcdGNvbnN0IHBzZCA9IHRhcmdldCBhcyBQc2Q7XG5cdFx0cHNkLmxpbmtlZEZpbGVzID0gW107XG5cblx0XHR3aGlsZSAobGVmdCgpID4gOCkge1xuXHRcdFx0bGV0IHNpemUgPSByZWFkTGVuZ3RoNjQocmVhZGVyKTsgLy8gc2l6ZVxuXHRcdFx0Y29uc3Qgc3RhcnRPZmZzZXQgPSByZWFkZXIub2Zmc2V0O1xuXHRcdFx0Y29uc3QgdHlwZSA9IHJlYWRTaWduYXR1cmUocmVhZGVyKSBhcyAnbGlGRCcgfCAnbGlGRScgfCAnbGlGQSc7XG5cdFx0XHRjb25zdCB2ZXJzaW9uID0gcmVhZEludDMyKHJlYWRlcik7XG5cdFx0XHRjb25zdCBpZCA9IHJlYWRQYXNjYWxTdHJpbmcocmVhZGVyLCAxKTtcblx0XHRcdGNvbnN0IG5hbWUgPSByZWFkVW5pY29kZVN0cmluZyhyZWFkZXIpO1xuXHRcdFx0Y29uc3QgZmlsZVR5cGUgPSByZWFkU2lnbmF0dXJlKHJlYWRlcikudHJpbSgpOyAvLyAnICAgICcgaWYgZW1wdHlcblx0XHRcdGNvbnN0IGZpbGVDcmVhdG9yID0gcmVhZFNpZ25hdHVyZShyZWFkZXIpLnRyaW0oKTsgLy8gJyAgICAnIG9yICdcXDBcXDBcXDBcXDAnIGlmIGVtcHR5XG5cdFx0XHRjb25zdCBkYXRhU2l6ZSA9IHJlYWRMZW5ndGg2NChyZWFkZXIpO1xuXHRcdFx0Y29uc3QgaGFzRmlsZU9wZW5EZXNjcmlwdG9yID0gcmVhZFVpbnQ4KHJlYWRlcik7XG5cdFx0XHRjb25zdCBmaWxlT3BlbkRlc2NyaXB0b3IgPSBoYXNGaWxlT3BlbkRlc2NyaXB0b3IgPyByZWFkVmVyc2lvbkFuZERlc2NyaXB0b3IocmVhZGVyKSBhcyBGaWxlT3BlbkRlc2NyaXB0b3IgOiB1bmRlZmluZWQ7XG5cdFx0XHRjb25zdCBsaW5rZWRGaWxlRGVzY3JpcHRvciA9IHR5cGUgPT09ICdsaUZFJyA/IHJlYWRWZXJzaW9uQW5kRGVzY3JpcHRvcihyZWFkZXIpIDogdW5kZWZpbmVkO1xuXHRcdFx0Y29uc3QgZmlsZTogTGlua2VkRmlsZSA9IHsgaWQsIG5hbWUsIGRhdGE6IHVuZGVmaW5lZCB9O1xuXG5cdFx0XHRpZiAoZmlsZVR5cGUpIGZpbGUudHlwZSA9IGZpbGVUeXBlO1xuXHRcdFx0aWYgKGZpbGVDcmVhdG9yKSBmaWxlLmNyZWF0b3IgPSBmaWxlQ3JlYXRvcjtcblx0XHRcdGlmIChmaWxlT3BlbkRlc2NyaXB0b3IpIGZpbGUuZGVzY3JpcHRvciA9IGZpbGVPcGVuRGVzY3JpcHRvcjtcblxuXHRcdFx0aWYgKHR5cGUgPT09ICdsaUZFJyAmJiB2ZXJzaW9uID4gMykge1xuXHRcdFx0XHRjb25zdCB5ZWFyID0gcmVhZEludDMyKHJlYWRlcik7XG5cdFx0XHRcdGNvbnN0IG1vbnRoID0gcmVhZFVpbnQ4KHJlYWRlcik7XG5cdFx0XHRcdGNvbnN0IGRheSA9IHJlYWRVaW50OChyZWFkZXIpO1xuXHRcdFx0XHRjb25zdCBob3VyID0gcmVhZFVpbnQ4KHJlYWRlcik7XG5cdFx0XHRcdGNvbnN0IG1pbnV0ZSA9IHJlYWRVaW50OChyZWFkZXIpO1xuXHRcdFx0XHRjb25zdCBzZWNvbmRzID0gcmVhZEZsb2F0NjQocmVhZGVyKTtcblx0XHRcdFx0Y29uc3Qgd2hvbGVTZWNvbmRzID0gTWF0aC5mbG9vcihzZWNvbmRzKTtcblx0XHRcdFx0Y29uc3QgbXMgPSAoc2Vjb25kcyAtIHdob2xlU2Vjb25kcykgKiAxMDAwO1xuXHRcdFx0XHRmaWxlLnRpbWUgPSBuZXcgRGF0ZSh5ZWFyLCBtb250aCwgZGF5LCBob3VyLCBtaW51dGUsIHdob2xlU2Vjb25kcywgbXMpO1xuXHRcdFx0fVxuXG5cdFx0XHRjb25zdCBmaWxlU2l6ZSA9IHR5cGUgPT09ICdsaUZFJyA/IHJlYWRMZW5ndGg2NChyZWFkZXIpIDogMDtcblx0XHRcdGlmICh0eXBlID09PSAnbGlGQScpIHNraXBCeXRlcyhyZWFkZXIsIDgpO1xuXHRcdFx0aWYgKHR5cGUgPT09ICdsaUZEJykgZmlsZS5kYXRhID0gcmVhZEJ5dGVzKHJlYWRlciwgZGF0YVNpemUpO1xuXHRcdFx0aWYgKHZlcnNpb24gPj0gNSkgZmlsZS5jaGlsZERvY3VtZW50SUQgPSByZWFkVW5pY29kZVN0cmluZyhyZWFkZXIpO1xuXHRcdFx0aWYgKHZlcnNpb24gPj0gNikgZmlsZS5hc3NldE1vZFRpbWUgPSByZWFkRmxvYXQ2NChyZWFkZXIpO1xuXHRcdFx0aWYgKHZlcnNpb24gPj0gNykgZmlsZS5hc3NldExvY2tlZFN0YXRlID0gcmVhZFVpbnQ4KHJlYWRlcik7XG5cdFx0XHRpZiAodHlwZSA9PT0gJ2xpRkUnKSBmaWxlLmRhdGEgPSByZWFkQnl0ZXMocmVhZGVyLCBmaWxlU2l6ZSk7XG5cblx0XHRcdGlmIChvcHRpb25zLnNraXBMaW5rZWRGaWxlc0RhdGEpIGZpbGUuZGF0YSA9IHVuZGVmaW5lZDtcblxuXHRcdFx0cHNkLmxpbmtlZEZpbGVzLnB1c2goZmlsZSk7XG5cdFx0XHRsaW5rZWRGaWxlRGVzY3JpcHRvcjtcblxuXHRcdFx0d2hpbGUgKHNpemUgJSA0KSBzaXplKys7XG5cdFx0XHRyZWFkZXIub2Zmc2V0ID0gc3RhcnRPZmZzZXQgKyBzaXplO1xuXHRcdH1cblxuXHRcdHNraXBCeXRlcyhyZWFkZXIsIGxlZnQoKSk7IC8vID9cblx0fSxcblx0KHdyaXRlciwgdGFyZ2V0KSA9PiB7XG5cdFx0Y29uc3QgcHNkID0gdGFyZ2V0IGFzIFBzZDtcblxuXHRcdGZvciAoY29uc3QgZmlsZSBvZiBwc2QubGlua2VkRmlsZXMhKSB7XG5cdFx0XHRsZXQgdmVyc2lvbiA9IDI7XG5cblx0XHRcdGlmIChmaWxlLmFzc2V0TG9ja2VkU3RhdGUgIT0gbnVsbCkgdmVyc2lvbiA9IDc7XG5cdFx0XHRlbHNlIGlmIChmaWxlLmFzc2V0TW9kVGltZSAhPSBudWxsKSB2ZXJzaW9uID0gNjtcblx0XHRcdGVsc2UgaWYgKGZpbGUuY2hpbGREb2N1bWVudElEICE9IG51bGwpIHZlcnNpb24gPSA1O1xuXHRcdFx0Ly8gVE9ETzogZWxzZSBpZiAoZmlsZS50aW1lICE9IG51bGwpIHZlcnNpb24gPSAzOyAob25seSBmb3IgbGlGRSlcblxuXHRcdFx0d3JpdGVVaW50MzIod3JpdGVyLCAwKTtcblx0XHRcdHdyaXRlVWludDMyKHdyaXRlciwgMCk7IC8vIHNpemVcblx0XHRcdGNvbnN0IHNpemVPZmZzZXQgPSB3cml0ZXIub2Zmc2V0O1xuXHRcdFx0d3JpdGVTaWduYXR1cmUod3JpdGVyLCBmaWxlLmRhdGEgPyAnbGlGRCcgOiAnbGlGQScpO1xuXHRcdFx0d3JpdGVJbnQzMih3cml0ZXIsIHZlcnNpb24pO1xuXHRcdFx0d3JpdGVQYXNjYWxTdHJpbmcod3JpdGVyLCBmaWxlLmlkIHx8ICcnLCAxKTtcblx0XHRcdHdyaXRlVW5pY29kZVN0cmluZ1dpdGhQYWRkaW5nKHdyaXRlciwgZmlsZS5uYW1lIHx8ICcnKTtcblx0XHRcdHdyaXRlU2lnbmF0dXJlKHdyaXRlciwgZmlsZS50eXBlID8gYCR7ZmlsZS50eXBlfSAgICBgLnN1YnN0cigwLCA0KSA6ICcgICAgJyk7XG5cdFx0XHR3cml0ZVNpZ25hdHVyZSh3cml0ZXIsIGZpbGUuY3JlYXRvciA/IGAke2ZpbGUuY3JlYXRvcn0gICAgYC5zdWJzdHIoMCwgNCkgOiAnXFwwXFwwXFwwXFwwJyk7XG5cdFx0XHR3cml0ZUxlbmd0aDY0KHdyaXRlciwgZmlsZS5kYXRhID8gZmlsZS5kYXRhLmJ5dGVMZW5ndGggOiAwKTtcblxuXHRcdFx0aWYgKGZpbGUuZGVzY3JpcHRvciAmJiBmaWxlLmRlc2NyaXB0b3IuY29tcEluZm8pIHtcblx0XHRcdFx0Y29uc3QgZGVzYzogRmlsZU9wZW5EZXNjcmlwdG9yID0ge1xuXHRcdFx0XHRcdGNvbXBJbmZvOiBmaWxlLmRlc2NyaXB0b3IuY29tcEluZm8sXG5cdFx0XHRcdH07XG5cblx0XHRcdFx0d3JpdGVVaW50OCh3cml0ZXIsIDEpO1xuXHRcdFx0XHR3cml0ZVZlcnNpb25BbmREZXNjcmlwdG9yKHdyaXRlciwgJycsICdudWxsJywgZGVzYyk7XG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHR3cml0ZVVpbnQ4KHdyaXRlciwgMCk7XG5cdFx0XHR9XG5cblx0XHRcdGlmIChmaWxlLmRhdGEpIHdyaXRlQnl0ZXMod3JpdGVyLCBmaWxlLmRhdGEpO1xuXHRcdFx0ZWxzZSB3cml0ZUxlbmd0aDY0KHdyaXRlciwgMCk7XG5cdFx0XHRpZiAodmVyc2lvbiA+PSA1KSB3cml0ZVVuaWNvZGVTdHJpbmdXaXRoUGFkZGluZyh3cml0ZXIsIGZpbGUuY2hpbGREb2N1bWVudElEIHx8ICcnKTtcblx0XHRcdGlmICh2ZXJzaW9uID49IDYpIHdyaXRlRmxvYXQ2NCh3cml0ZXIsIGZpbGUuYXNzZXRNb2RUaW1lIHx8IDApO1xuXHRcdFx0aWYgKHZlcnNpb24gPj0gNykgd3JpdGVVaW50OCh3cml0ZXIsIGZpbGUuYXNzZXRMb2NrZWRTdGF0ZSB8fCAwKTtcblxuXHRcdFx0bGV0IHNpemUgPSB3cml0ZXIub2Zmc2V0IC0gc2l6ZU9mZnNldDtcblx0XHRcdHdyaXRlci52aWV3LnNldFVpbnQzMihzaXplT2Zmc2V0IC0gNCwgc2l6ZSwgZmFsc2UpOyAvLyB3cml0ZSBzaXplXG5cblx0XHRcdHdoaWxlIChzaXplICUgNCkge1xuXHRcdFx0XHRzaXplKys7XG5cdFx0XHRcdHdyaXRlVWludDgod3JpdGVyLCAwKTtcblx0XHRcdH1cblx0XHR9XG5cdH0sXG4pO1xuYWRkSGFuZGxlckFsaWFzKCdsbmtEJywgJ2xuazInKTtcbmFkZEhhbmRsZXJBbGlhcygnbG5rMycsICdsbmsyJyk7XG5cbi8vIHRoaXMgc2VlbXMgdG8ganVzdCBiZSB6ZXJvIHNpemUgYmxvY2ssIGlnbm9yZSBpdFxuYWRkSGFuZGxlcihcblx0J2xua0UnLFxuXHR0YXJnZXQgPT4gKHRhcmdldCBhcyBhbnkpLl9sbmtFICE9PSB1bmRlZmluZWQsXG5cdChyZWFkZXIsIHRhcmdldCwgbGVmdCwgX3BzZHMsIG9wdGlvbnMpID0+IHtcblx0XHRpZiAob3B0aW9ucy5sb2dNaXNzaW5nRmVhdHVyZXMgJiYgbGVmdCgpKSB7XG5cdFx0XHRjb25zb2xlLmxvZyhgTm9uLWVtcHR5IGxua0UgbGF5ZXIgaW5mbyAoJHtsZWZ0KCl9IGJ5dGVzKWApO1xuXHRcdH1cblxuXHRcdGlmIChNT0NLX0hBTkRMRVJTKSB7XG5cdFx0XHQodGFyZ2V0IGFzIGFueSkuX2xua0UgPSByZWFkQnl0ZXMocmVhZGVyLCBsZWZ0KCkpO1xuXHRcdH1cblx0fSxcblx0KHdyaXRlciwgdGFyZ2V0KSA9PiBNT0NLX0hBTkRMRVJTICYmIHdyaXRlQnl0ZXMod3JpdGVyLCAodGFyZ2V0IGFzIGFueSkuX2xua0UpLFxuKTtcblxuaW50ZXJmYWNlIEV4dGVuc2lvbkRlc2Mge1xuXHRnZW5lcmF0b3JTZXR0aW5nczoge1xuXHRcdGdlbmVyYXRvcl80NV9hc3NldHM6IHsganNvbjogc3RyaW5nOyB9O1xuXHRcdGxheWVyVGltZTogbnVtYmVyO1xuXHR9O1xufVxuXG5hZGRIYW5kbGVyKFxuXHQncHRocycsXG5cdGhhc0tleSgncGF0aExpc3QnKSxcblx0KHJlYWRlciwgdGFyZ2V0KSA9PiB7XG5cdFx0Y29uc3QgZGVzY3JpcHRvciA9IHJlYWRWZXJzaW9uQW5kRGVzY3JpcHRvcihyZWFkZXIpO1xuXG5cdFx0dGFyZ2V0LnBhdGhMaXN0ID0gW107IC8vIFRPRE86IHJlYWQgcGF0aHMgKGZpbmQgZXhhbXBsZSB3aXRoIG5vbi1lbXB0eSBsaXN0KVxuXG5cdFx0ZGVzY3JpcHRvcjtcblx0XHQvLyBjb25zb2xlLmxvZygncHRocycsIGRlc2NyaXB0b3IpOyAvLyBUT0RPOiByZW1vdmUgdGhpc1xuXHR9LFxuXHQod3JpdGVyLCBfdGFyZ2V0KSA9PiB7XG5cdFx0Y29uc3QgZGVzY3JpcHRvciA9IHtcblx0XHRcdHBhdGhMaXN0OiBbXSwgLy8gVE9ETzogd3JpdGUgcGF0aHNcblx0XHR9O1xuXG5cdFx0d3JpdGVWZXJzaW9uQW5kRGVzY3JpcHRvcih3cml0ZXIsICcnLCAncGF0aHNEYXRhQ2xhc3MnLCBkZXNjcmlwdG9yKTtcblx0fSxcbik7XG5cbmFkZEhhbmRsZXIoXG5cdCdseXZyJyxcblx0aGFzS2V5KCd2ZXJzaW9uJyksXG5cdChyZWFkZXIsIHRhcmdldCkgPT4gdGFyZ2V0LnZlcnNpb24gPSByZWFkVWludDMyKHJlYWRlciksXG5cdCh3cml0ZXIsIHRhcmdldCkgPT4gd3JpdGVVaW50MzIod3JpdGVyLCB0YXJnZXQudmVyc2lvbiEpLFxuKTtcblxuZnVuY3Rpb24gYWRqdXN0bWVudFR5cGUodHlwZTogc3RyaW5nKSB7XG5cdHJldHVybiAodGFyZ2V0OiBMYXllckFkZGl0aW9uYWxJbmZvKSA9PiAhIXRhcmdldC5hZGp1c3RtZW50ICYmIHRhcmdldC5hZGp1c3RtZW50LnR5cGUgPT09IHR5cGU7XG59XG5cbmFkZEhhbmRsZXIoXG5cdCdicml0Jyxcblx0YWRqdXN0bWVudFR5cGUoJ2JyaWdodG5lc3MvY29udHJhc3QnKSxcblx0KHJlYWRlciwgdGFyZ2V0LCBsZWZ0KSA9PiB7XG5cdFx0aWYgKCF0YXJnZXQuYWRqdXN0bWVudCkgeyAvLyBpZ25vcmUgaWYgZ290IG9uZSBmcm9tIENnRWQgYmxvY2tcblx0XHRcdHRhcmdldC5hZGp1c3RtZW50ID0ge1xuXHRcdFx0XHR0eXBlOiAnYnJpZ2h0bmVzcy9jb250cmFzdCcsXG5cdFx0XHRcdGJyaWdodG5lc3M6IHJlYWRJbnQxNihyZWFkZXIpLFxuXHRcdFx0XHRjb250cmFzdDogcmVhZEludDE2KHJlYWRlciksXG5cdFx0XHRcdG1lYW5WYWx1ZTogcmVhZEludDE2KHJlYWRlciksXG5cdFx0XHRcdGxhYkNvbG9yT25seTogISFyZWFkVWludDgocmVhZGVyKSxcblx0XHRcdFx0dXNlTGVnYWN5OiB0cnVlLFxuXHRcdFx0fTtcblx0XHR9XG5cblx0XHRza2lwQnl0ZXMocmVhZGVyLCBsZWZ0KCkpO1xuXHR9LFxuXHQod3JpdGVyLCB0YXJnZXQpID0+IHtcblx0XHRjb25zdCBpbmZvID0gdGFyZ2V0LmFkanVzdG1lbnQgYXMgQnJpZ2h0bmVzc0FkanVzdG1lbnQ7XG5cdFx0d3JpdGVJbnQxNih3cml0ZXIsIGluZm8uYnJpZ2h0bmVzcyB8fCAwKTtcblx0XHR3cml0ZUludDE2KHdyaXRlciwgaW5mby5jb250cmFzdCB8fCAwKTtcblx0XHR3cml0ZUludDE2KHdyaXRlciwgaW5mby5tZWFuVmFsdWUgPz8gMTI3KTtcblx0XHR3cml0ZVVpbnQ4KHdyaXRlciwgaW5mby5sYWJDb2xvck9ubHkgPyAxIDogMCk7XG5cdFx0d3JpdGVaZXJvcyh3cml0ZXIsIDEpO1xuXHR9LFxuKTtcblxuZnVuY3Rpb24gcmVhZExldmVsc0NoYW5uZWwocmVhZGVyOiBQc2RSZWFkZXIpOiBMZXZlbHNBZGp1c3RtZW50Q2hhbm5lbCB7XG5cdGNvbnN0IHNoYWRvd0lucHV0ID0gcmVhZEludDE2KHJlYWRlcik7XG5cdGNvbnN0IGhpZ2hsaWdodElucHV0ID0gcmVhZEludDE2KHJlYWRlcik7XG5cdGNvbnN0IHNoYWRvd091dHB1dCA9IHJlYWRJbnQxNihyZWFkZXIpO1xuXHRjb25zdCBoaWdobGlnaHRPdXRwdXQgPSByZWFkSW50MTYocmVhZGVyKTtcblx0Y29uc3QgbWlkdG9uZUlucHV0ID0gcmVhZEludDE2KHJlYWRlcikgLyAxMDA7XG5cdHJldHVybiB7IHNoYWRvd0lucHV0LCBoaWdobGlnaHRJbnB1dCwgc2hhZG93T3V0cHV0LCBoaWdobGlnaHRPdXRwdXQsIG1pZHRvbmVJbnB1dCB9O1xufVxuXG5mdW5jdGlvbiB3cml0ZUxldmVsc0NoYW5uZWwod3JpdGVyOiBQc2RXcml0ZXIsIGNoYW5uZWw6IExldmVsc0FkanVzdG1lbnRDaGFubmVsKSB7XG5cdHdyaXRlSW50MTYod3JpdGVyLCBjaGFubmVsLnNoYWRvd0lucHV0KTtcblx0d3JpdGVJbnQxNih3cml0ZXIsIGNoYW5uZWwuaGlnaGxpZ2h0SW5wdXQpO1xuXHR3cml0ZUludDE2KHdyaXRlciwgY2hhbm5lbC5zaGFkb3dPdXRwdXQpO1xuXHR3cml0ZUludDE2KHdyaXRlciwgY2hhbm5lbC5oaWdobGlnaHRPdXRwdXQpO1xuXHR3cml0ZUludDE2KHdyaXRlciwgTWF0aC5yb3VuZChjaGFubmVsLm1pZHRvbmVJbnB1dCAqIDEwMCkpO1xufVxuXG5hZGRIYW5kbGVyKFxuXHQnbGV2bCcsXG5cdGFkanVzdG1lbnRUeXBlKCdsZXZlbHMnKSxcblx0KHJlYWRlciwgdGFyZ2V0LCBsZWZ0KSA9PiB7XG5cdFx0aWYgKHJlYWRVaW50MTYocmVhZGVyKSAhPT0gMikgdGhyb3cgbmV3IEVycm9yKCdJbnZhbGlkIGxldmwgdmVyc2lvbicpO1xuXG5cdFx0dGFyZ2V0LmFkanVzdG1lbnQgPSB7XG5cdFx0XHQuLi50YXJnZXQuYWRqdXN0bWVudCBhcyBQcmVzZXRJbmZvLFxuXHRcdFx0dHlwZTogJ2xldmVscycsXG5cdFx0XHRyZ2I6IHJlYWRMZXZlbHNDaGFubmVsKHJlYWRlciksXG5cdFx0XHRyZWQ6IHJlYWRMZXZlbHNDaGFubmVsKHJlYWRlciksXG5cdFx0XHRncmVlbjogcmVhZExldmVsc0NoYW5uZWwocmVhZGVyKSxcblx0XHRcdGJsdWU6IHJlYWRMZXZlbHNDaGFubmVsKHJlYWRlciksXG5cdFx0fTtcblxuXHRcdHNraXBCeXRlcyhyZWFkZXIsIGxlZnQoKSk7XG5cdH0sXG5cdCh3cml0ZXIsIHRhcmdldCkgPT4ge1xuXHRcdGNvbnN0IGluZm8gPSB0YXJnZXQuYWRqdXN0bWVudCBhcyBMZXZlbHNBZGp1c3RtZW50O1xuXHRcdGNvbnN0IGRlZmF1bHRDaGFubmVsID0ge1xuXHRcdFx0c2hhZG93SW5wdXQ6IDAsXG5cdFx0XHRoaWdobGlnaHRJbnB1dDogMjU1LFxuXHRcdFx0c2hhZG93T3V0cHV0OiAwLFxuXHRcdFx0aGlnaGxpZ2h0T3V0cHV0OiAyNTUsXG5cdFx0XHRtaWR0b25lSW5wdXQ6IDEsXG5cdFx0fTtcblxuXHRcdHdyaXRlVWludDE2KHdyaXRlciwgMik7IC8vIHZlcnNpb25cblx0XHR3cml0ZUxldmVsc0NoYW5uZWwod3JpdGVyLCBpbmZvLnJnYiB8fCBkZWZhdWx0Q2hhbm5lbCk7XG5cdFx0d3JpdGVMZXZlbHNDaGFubmVsKHdyaXRlciwgaW5mby5yZWQgfHwgZGVmYXVsdENoYW5uZWwpO1xuXHRcdHdyaXRlTGV2ZWxzQ2hhbm5lbCh3cml0ZXIsIGluZm8uYmx1ZSB8fCBkZWZhdWx0Q2hhbm5lbCk7XG5cdFx0d3JpdGVMZXZlbHNDaGFubmVsKHdyaXRlciwgaW5mby5ncmVlbiB8fCBkZWZhdWx0Q2hhbm5lbCk7XG5cdFx0Zm9yIChsZXQgaSA9IDA7IGkgPCA1OTsgaSsrKSB3cml0ZUxldmVsc0NoYW5uZWwod3JpdGVyLCBkZWZhdWx0Q2hhbm5lbCk7XG5cdH0sXG4pO1xuXG5mdW5jdGlvbiByZWFkQ3VydmVDaGFubmVsKHJlYWRlcjogUHNkUmVhZGVyKSB7XG5cdGNvbnN0IG5vZGVzID0gcmVhZFVpbnQxNihyZWFkZXIpO1xuXHRjb25zdCBjaGFubmVsOiBDdXJ2ZXNBZGp1c3RtZW50Q2hhbm5lbCA9IFtdO1xuXG5cdGZvciAobGV0IGogPSAwOyBqIDwgbm9kZXM7IGorKykge1xuXHRcdGNvbnN0IG91dHB1dCA9IHJlYWRJbnQxNihyZWFkZXIpO1xuXHRcdGNvbnN0IGlucHV0ID0gcmVhZEludDE2KHJlYWRlcik7XG5cdFx0Y2hhbm5lbC5wdXNoKHsgaW5wdXQsIG91dHB1dCB9KTtcblx0fVxuXG5cdHJldHVybiBjaGFubmVsO1xufVxuXG5mdW5jdGlvbiB3cml0ZUN1cnZlQ2hhbm5lbCh3cml0ZXI6IFBzZFdyaXRlciwgY2hhbm5lbDogQ3VydmVzQWRqdXN0bWVudENoYW5uZWwpIHtcblx0d3JpdGVVaW50MTYod3JpdGVyLCBjaGFubmVsLmxlbmd0aCk7XG5cblx0Zm9yIChjb25zdCBuIG9mIGNoYW5uZWwpIHtcblx0XHR3cml0ZVVpbnQxNih3cml0ZXIsIG4ub3V0cHV0KTtcblx0XHR3cml0ZVVpbnQxNih3cml0ZXIsIG4uaW5wdXQpO1xuXHR9XG59XG5cbmFkZEhhbmRsZXIoXG5cdCdjdXJ2Jyxcblx0YWRqdXN0bWVudFR5cGUoJ2N1cnZlcycpLFxuXHQocmVhZGVyLCB0YXJnZXQsIGxlZnQpID0+IHtcblx0XHRyZWFkVWludDgocmVhZGVyKTtcblx0XHRpZiAocmVhZFVpbnQxNihyZWFkZXIpICE9PSAxKSB0aHJvdyBuZXcgRXJyb3IoJ0ludmFsaWQgY3VydiB2ZXJzaW9uJyk7XG5cdFx0cmVhZFVpbnQxNihyZWFkZXIpO1xuXHRcdGNvbnN0IGNoYW5uZWxzID0gcmVhZFVpbnQxNihyZWFkZXIpO1xuXHRcdGNvbnN0IGluZm86IEN1cnZlc0FkanVzdG1lbnQgPSB7IHR5cGU6ICdjdXJ2ZXMnIH07XG5cblx0XHRpZiAoY2hhbm5lbHMgJiAxKSBpbmZvLnJnYiA9IHJlYWRDdXJ2ZUNoYW5uZWwocmVhZGVyKTtcblx0XHRpZiAoY2hhbm5lbHMgJiAyKSBpbmZvLnJlZCA9IHJlYWRDdXJ2ZUNoYW5uZWwocmVhZGVyKTtcblx0XHRpZiAoY2hhbm5lbHMgJiA0KSBpbmZvLmdyZWVuID0gcmVhZEN1cnZlQ2hhbm5lbChyZWFkZXIpO1xuXHRcdGlmIChjaGFubmVscyAmIDgpIGluZm8uYmx1ZSA9IHJlYWRDdXJ2ZUNoYW5uZWwocmVhZGVyKTtcblxuXHRcdHRhcmdldC5hZGp1c3RtZW50ID0ge1xuXHRcdFx0Li4udGFyZ2V0LmFkanVzdG1lbnQgYXMgUHJlc2V0SW5mbyxcblx0XHRcdC4uLmluZm8sXG5cdFx0fTtcblxuXHRcdC8vIGlnbm9yaW5nLCBkdXBsaWNhdGUgaW5mb3JtYXRpb25cblx0XHQvLyBjaGVja1NpZ25hdHVyZShyZWFkZXIsICdDcnYgJyk7XG5cblx0XHQvLyBjb25zdCBjVmVyc2lvbiA9IHJlYWRVaW50MTYocmVhZGVyKTtcblx0XHQvLyByZWFkVWludDE2KHJlYWRlcik7XG5cdFx0Ly8gY29uc3QgY2hhbm5lbENvdW50ID0gcmVhZFVpbnQxNihyZWFkZXIpO1xuXG5cdFx0Ly8gZm9yIChsZXQgaSA9IDA7IGkgPCBjaGFubmVsQ291bnQ7IGkrKykge1xuXHRcdC8vIFx0Y29uc3QgaW5kZXggPSByZWFkVWludDE2KHJlYWRlcik7XG5cdFx0Ly8gXHRjb25zdCBub2RlcyA9IHJlYWRVaW50MTYocmVhZGVyKTtcblxuXHRcdC8vIFx0Zm9yIChsZXQgaiA9IDA7IGogPCBub2RlczsgaisrKSB7XG5cdFx0Ly8gXHRcdGNvbnN0IG91dHB1dCA9IHJlYWRJbnQxNihyZWFkZXIpO1xuXHRcdC8vIFx0XHRjb25zdCBpbnB1dCA9IHJlYWRJbnQxNihyZWFkZXIpO1xuXHRcdC8vIFx0fVxuXHRcdC8vIH1cblxuXHRcdHNraXBCeXRlcyhyZWFkZXIsIGxlZnQoKSk7XG5cdH0sXG5cdCh3cml0ZXIsIHRhcmdldCkgPT4ge1xuXHRcdGNvbnN0IGluZm8gPSB0YXJnZXQuYWRqdXN0bWVudCBhcyBDdXJ2ZXNBZGp1c3RtZW50O1xuXHRcdGNvbnN0IHsgcmdiLCByZWQsIGdyZWVuLCBibHVlIH0gPSBpbmZvO1xuXHRcdGxldCBjaGFubmVscyA9IDA7XG5cdFx0bGV0IGNoYW5uZWxDb3VudCA9IDA7XG5cblx0XHRpZiAocmdiICYmIHJnYi5sZW5ndGgpIHsgY2hhbm5lbHMgfD0gMTsgY2hhbm5lbENvdW50Kys7IH1cblx0XHRpZiAocmVkICYmIHJlZC5sZW5ndGgpIHsgY2hhbm5lbHMgfD0gMjsgY2hhbm5lbENvdW50Kys7IH1cblx0XHRpZiAoZ3JlZW4gJiYgZ3JlZW4ubGVuZ3RoKSB7IGNoYW5uZWxzIHw9IDQ7IGNoYW5uZWxDb3VudCsrOyB9XG5cdFx0aWYgKGJsdWUgJiYgYmx1ZS5sZW5ndGgpIHsgY2hhbm5lbHMgfD0gODsgY2hhbm5lbENvdW50Kys7IH1cblxuXHRcdHdyaXRlVWludDgod3JpdGVyLCAwKTtcblx0XHR3cml0ZVVpbnQxNih3cml0ZXIsIDEpOyAvLyB2ZXJzaW9uXG5cdFx0d3JpdGVVaW50MTYod3JpdGVyLCAwKTtcblx0XHR3cml0ZVVpbnQxNih3cml0ZXIsIGNoYW5uZWxzKTtcblxuXHRcdGlmIChyZ2IgJiYgcmdiLmxlbmd0aCkgd3JpdGVDdXJ2ZUNoYW5uZWwod3JpdGVyLCByZ2IpO1xuXHRcdGlmIChyZWQgJiYgcmVkLmxlbmd0aCkgd3JpdGVDdXJ2ZUNoYW5uZWwod3JpdGVyLCByZWQpO1xuXHRcdGlmIChncmVlbiAmJiBncmVlbi5sZW5ndGgpIHdyaXRlQ3VydmVDaGFubmVsKHdyaXRlciwgZ3JlZW4pO1xuXHRcdGlmIChibHVlICYmIGJsdWUubGVuZ3RoKSB3cml0ZUN1cnZlQ2hhbm5lbCh3cml0ZXIsIGJsdWUpO1xuXG5cdFx0d3JpdGVTaWduYXR1cmUod3JpdGVyLCAnQ3J2ICcpO1xuXHRcdHdyaXRlVWludDE2KHdyaXRlciwgNCk7IC8vIHZlcnNpb25cblx0XHR3cml0ZVVpbnQxNih3cml0ZXIsIDApO1xuXHRcdHdyaXRlVWludDE2KHdyaXRlciwgY2hhbm5lbENvdW50KTtcblxuXHRcdGlmIChyZ2IgJiYgcmdiLmxlbmd0aCkgeyB3cml0ZVVpbnQxNih3cml0ZXIsIDApOyB3cml0ZUN1cnZlQ2hhbm5lbCh3cml0ZXIsIHJnYik7IH1cblx0XHRpZiAocmVkICYmIHJlZC5sZW5ndGgpIHsgd3JpdGVVaW50MTYod3JpdGVyLCAxKTsgd3JpdGVDdXJ2ZUNoYW5uZWwod3JpdGVyLCByZWQpOyB9XG5cdFx0aWYgKGdyZWVuICYmIGdyZWVuLmxlbmd0aCkgeyB3cml0ZVVpbnQxNih3cml0ZXIsIDIpOyB3cml0ZUN1cnZlQ2hhbm5lbCh3cml0ZXIsIGdyZWVuKTsgfVxuXHRcdGlmIChibHVlICYmIGJsdWUubGVuZ3RoKSB7IHdyaXRlVWludDE2KHdyaXRlciwgMyk7IHdyaXRlQ3VydmVDaGFubmVsKHdyaXRlciwgYmx1ZSk7IH1cblxuXHRcdHdyaXRlWmVyb3Mod3JpdGVyLCAyKTtcblx0fSxcbik7XG5cbmFkZEhhbmRsZXIoXG5cdCdleHBBJyxcblx0YWRqdXN0bWVudFR5cGUoJ2V4cG9zdXJlJyksXG5cdChyZWFkZXIsIHRhcmdldCwgbGVmdCkgPT4ge1xuXHRcdGlmIChyZWFkVWludDE2KHJlYWRlcikgIT09IDEpIHRocm93IG5ldyBFcnJvcignSW52YWxpZCBleHBBIHZlcnNpb24nKTtcblxuXHRcdHRhcmdldC5hZGp1c3RtZW50ID0ge1xuXHRcdFx0Li4udGFyZ2V0LmFkanVzdG1lbnQgYXMgUHJlc2V0SW5mbyxcblx0XHRcdHR5cGU6ICdleHBvc3VyZScsXG5cdFx0XHRleHBvc3VyZTogcmVhZEZsb2F0MzIocmVhZGVyKSxcblx0XHRcdG9mZnNldDogcmVhZEZsb2F0MzIocmVhZGVyKSxcblx0XHRcdGdhbW1hOiByZWFkRmxvYXQzMihyZWFkZXIpLFxuXHRcdH07XG5cblx0XHRza2lwQnl0ZXMocmVhZGVyLCBsZWZ0KCkpO1xuXHR9LFxuXHQod3JpdGVyLCB0YXJnZXQpID0+IHtcblx0XHRjb25zdCBpbmZvID0gdGFyZ2V0LmFkanVzdG1lbnQgYXMgRXhwb3N1cmVBZGp1c3RtZW50O1xuXHRcdHdyaXRlVWludDE2KHdyaXRlciwgMSk7IC8vIHZlcnNpb25cblx0XHR3cml0ZUZsb2F0MzIod3JpdGVyLCBpbmZvLmV4cG9zdXJlISk7XG5cdFx0d3JpdGVGbG9hdDMyKHdyaXRlciwgaW5mby5vZmZzZXQhKTtcblx0XHR3cml0ZUZsb2F0MzIod3JpdGVyLCBpbmZvLmdhbW1hISk7XG5cdFx0d3JpdGVaZXJvcyh3cml0ZXIsIDIpO1xuXHR9LFxuKTtcblxuaW50ZXJmYWNlIFZpYnJhbmNlRGVzY3JpcHRvciB7XG5cdHZpYnJhbmNlPzogbnVtYmVyO1xuXHRTdHJ0PzogbnVtYmVyO1xufVxuXG5hZGRIYW5kbGVyKFxuXHQndmliQScsXG5cdGFkanVzdG1lbnRUeXBlKCd2aWJyYW5jZScpLFxuXHQocmVhZGVyLCB0YXJnZXQsIGxlZnQpID0+IHtcblx0XHRjb25zdCBkZXNjOiBWaWJyYW5jZURlc2NyaXB0b3IgPSByZWFkVmVyc2lvbkFuZERlc2NyaXB0b3IocmVhZGVyKTtcblx0XHR0YXJnZXQuYWRqdXN0bWVudCA9IHsgdHlwZTogJ3ZpYnJhbmNlJyB9O1xuXHRcdGlmIChkZXNjLnZpYnJhbmNlICE9PSB1bmRlZmluZWQpIHRhcmdldC5hZGp1c3RtZW50LnZpYnJhbmNlID0gZGVzYy52aWJyYW5jZTtcblx0XHRpZiAoZGVzYy5TdHJ0ICE9PSB1bmRlZmluZWQpIHRhcmdldC5hZGp1c3RtZW50LnNhdHVyYXRpb24gPSBkZXNjLlN0cnQ7XG5cblx0XHRza2lwQnl0ZXMocmVhZGVyLCBsZWZ0KCkpO1xuXHR9LFxuXHQod3JpdGVyLCB0YXJnZXQpID0+IHtcblx0XHRjb25zdCBpbmZvID0gdGFyZ2V0LmFkanVzdG1lbnQgYXMgVmlicmFuY2VBZGp1c3RtZW50O1xuXHRcdGNvbnN0IGRlc2M6IFZpYnJhbmNlRGVzY3JpcHRvciA9IHt9O1xuXHRcdGlmIChpbmZvLnZpYnJhbmNlICE9PSB1bmRlZmluZWQpIGRlc2MudmlicmFuY2UgPSBpbmZvLnZpYnJhbmNlO1xuXHRcdGlmIChpbmZvLnNhdHVyYXRpb24gIT09IHVuZGVmaW5lZCkgZGVzYy5TdHJ0ID0gaW5mby5zYXR1cmF0aW9uO1xuXG5cdFx0d3JpdGVWZXJzaW9uQW5kRGVzY3JpcHRvcih3cml0ZXIsICcnLCAnbnVsbCcsIGRlc2MpO1xuXHR9LFxuKTtcblxuZnVuY3Rpb24gcmVhZEh1ZUNoYW5uZWwocmVhZGVyOiBQc2RSZWFkZXIpOiBIdWVTYXR1cmF0aW9uQWRqdXN0bWVudENoYW5uZWwge1xuXHRyZXR1cm4ge1xuXHRcdGE6IHJlYWRJbnQxNihyZWFkZXIpLFxuXHRcdGI6IHJlYWRJbnQxNihyZWFkZXIpLFxuXHRcdGM6IHJlYWRJbnQxNihyZWFkZXIpLFxuXHRcdGQ6IHJlYWRJbnQxNihyZWFkZXIpLFxuXHRcdGh1ZTogcmVhZEludDE2KHJlYWRlciksXG5cdFx0c2F0dXJhdGlvbjogcmVhZEludDE2KHJlYWRlciksXG5cdFx0bGlnaHRuZXNzOiByZWFkSW50MTYocmVhZGVyKSxcblx0fTtcbn1cblxuZnVuY3Rpb24gd3JpdGVIdWVDaGFubmVsKHdyaXRlcjogUHNkV3JpdGVyLCBjaGFubmVsOiBIdWVTYXR1cmF0aW9uQWRqdXN0bWVudENoYW5uZWwgfCB1bmRlZmluZWQpIHtcblx0Y29uc3QgYyA9IGNoYW5uZWwgfHwge30gYXMgUGFydGlhbDxIdWVTYXR1cmF0aW9uQWRqdXN0bWVudENoYW5uZWw+O1xuXHR3cml0ZUludDE2KHdyaXRlciwgYy5hIHx8IDApO1xuXHR3cml0ZUludDE2KHdyaXRlciwgYy5iIHx8IDApO1xuXHR3cml0ZUludDE2KHdyaXRlciwgYy5jIHx8IDApO1xuXHR3cml0ZUludDE2KHdyaXRlciwgYy5kIHx8IDApO1xuXHR3cml0ZUludDE2KHdyaXRlciwgYy5odWUgfHwgMCk7XG5cdHdyaXRlSW50MTYod3JpdGVyLCBjLnNhdHVyYXRpb24gfHwgMCk7XG5cdHdyaXRlSW50MTYod3JpdGVyLCBjLmxpZ2h0bmVzcyB8fCAwKTtcbn1cblxuYWRkSGFuZGxlcihcblx0J2h1ZTInLFxuXHRhZGp1c3RtZW50VHlwZSgnaHVlL3NhdHVyYXRpb24nKSxcblx0KHJlYWRlciwgdGFyZ2V0LCBsZWZ0KSA9PiB7XG5cdFx0aWYgKHJlYWRVaW50MTYocmVhZGVyKSAhPT0gMikgdGhyb3cgbmV3IEVycm9yKCdJbnZhbGlkIGh1ZTIgdmVyc2lvbicpO1xuXG5cdFx0dGFyZ2V0LmFkanVzdG1lbnQgPSB7XG5cdFx0XHQuLi50YXJnZXQuYWRqdXN0bWVudCBhcyBQcmVzZXRJbmZvLFxuXHRcdFx0dHlwZTogJ2h1ZS9zYXR1cmF0aW9uJyxcblx0XHRcdG1hc3RlcjogcmVhZEh1ZUNoYW5uZWwocmVhZGVyKSxcblx0XHRcdHJlZHM6IHJlYWRIdWVDaGFubmVsKHJlYWRlciksXG5cdFx0XHR5ZWxsb3dzOiByZWFkSHVlQ2hhbm5lbChyZWFkZXIpLFxuXHRcdFx0Z3JlZW5zOiByZWFkSHVlQ2hhbm5lbChyZWFkZXIpLFxuXHRcdFx0Y3lhbnM6IHJlYWRIdWVDaGFubmVsKHJlYWRlciksXG5cdFx0XHRibHVlczogcmVhZEh1ZUNoYW5uZWwocmVhZGVyKSxcblx0XHRcdG1hZ2VudGFzOiByZWFkSHVlQ2hhbm5lbChyZWFkZXIpLFxuXHRcdH07XG5cblx0XHRza2lwQnl0ZXMocmVhZGVyLCBsZWZ0KCkpO1xuXHR9LFxuXHQod3JpdGVyLCB0YXJnZXQpID0+IHtcblx0XHRjb25zdCBpbmZvID0gdGFyZ2V0LmFkanVzdG1lbnQgYXMgSHVlU2F0dXJhdGlvbkFkanVzdG1lbnQ7XG5cblx0XHR3cml0ZVVpbnQxNih3cml0ZXIsIDIpOyAvLyB2ZXJzaW9uXG5cdFx0d3JpdGVIdWVDaGFubmVsKHdyaXRlciwgaW5mby5tYXN0ZXIpO1xuXHRcdHdyaXRlSHVlQ2hhbm5lbCh3cml0ZXIsIGluZm8ucmVkcyk7XG5cdFx0d3JpdGVIdWVDaGFubmVsKHdyaXRlciwgaW5mby55ZWxsb3dzKTtcblx0XHR3cml0ZUh1ZUNoYW5uZWwod3JpdGVyLCBpbmZvLmdyZWVucyk7XG5cdFx0d3JpdGVIdWVDaGFubmVsKHdyaXRlciwgaW5mby5jeWFucyk7XG5cdFx0d3JpdGVIdWVDaGFubmVsKHdyaXRlciwgaW5mby5ibHVlcyk7XG5cdFx0d3JpdGVIdWVDaGFubmVsKHdyaXRlciwgaW5mby5tYWdlbnRhcyk7XG5cdH0sXG4pO1xuXG5mdW5jdGlvbiByZWFkQ29sb3JCYWxhbmNlKHJlYWRlcjogUHNkUmVhZGVyKTogQ29sb3JCYWxhbmNlVmFsdWVzIHtcblx0cmV0dXJuIHtcblx0XHRjeWFuUmVkOiByZWFkSW50MTYocmVhZGVyKSxcblx0XHRtYWdlbnRhR3JlZW46IHJlYWRJbnQxNihyZWFkZXIpLFxuXHRcdHllbGxvd0JsdWU6IHJlYWRJbnQxNihyZWFkZXIpLFxuXHR9O1xufVxuXG5mdW5jdGlvbiB3cml0ZUNvbG9yQmFsYW5jZSh3cml0ZXI6IFBzZFdyaXRlciwgdmFsdWU6IFBhcnRpYWw8Q29sb3JCYWxhbmNlVmFsdWVzPikge1xuXHR3cml0ZUludDE2KHdyaXRlciwgdmFsdWUuY3lhblJlZCB8fCAwKTtcblx0d3JpdGVJbnQxNih3cml0ZXIsIHZhbHVlLm1hZ2VudGFHcmVlbiB8fCAwKTtcblx0d3JpdGVJbnQxNih3cml0ZXIsIHZhbHVlLnllbGxvd0JsdWUgfHwgMCk7XG59XG5cbmFkZEhhbmRsZXIoXG5cdCdibG5jJyxcblx0YWRqdXN0bWVudFR5cGUoJ2NvbG9yIGJhbGFuY2UnKSxcblx0KHJlYWRlciwgdGFyZ2V0LCBsZWZ0KSA9PiB7XG5cdFx0dGFyZ2V0LmFkanVzdG1lbnQgPSB7XG5cdFx0XHR0eXBlOiAnY29sb3IgYmFsYW5jZScsXG5cdFx0XHRzaGFkb3dzOiByZWFkQ29sb3JCYWxhbmNlKHJlYWRlciksXG5cdFx0XHRtaWR0b25lczogcmVhZENvbG9yQmFsYW5jZShyZWFkZXIpLFxuXHRcdFx0aGlnaGxpZ2h0czogcmVhZENvbG9yQmFsYW5jZShyZWFkZXIpLFxuXHRcdFx0cHJlc2VydmVMdW1pbm9zaXR5OiAhIXJlYWRVaW50OChyZWFkZXIpLFxuXHRcdH07XG5cblx0XHRza2lwQnl0ZXMocmVhZGVyLCBsZWZ0KCkpO1xuXHR9LFxuXHQod3JpdGVyLCB0YXJnZXQpID0+IHtcblx0XHRjb25zdCBpbmZvID0gdGFyZ2V0LmFkanVzdG1lbnQgYXMgQ29sb3JCYWxhbmNlQWRqdXN0bWVudDtcblx0XHR3cml0ZUNvbG9yQmFsYW5jZSh3cml0ZXIsIGluZm8uc2hhZG93cyB8fCB7fSk7XG5cdFx0d3JpdGVDb2xvckJhbGFuY2Uod3JpdGVyLCBpbmZvLm1pZHRvbmVzIHx8IHt9KTtcblx0XHR3cml0ZUNvbG9yQmFsYW5jZSh3cml0ZXIsIGluZm8uaGlnaGxpZ2h0cyB8fCB7fSk7XG5cdFx0d3JpdGVVaW50OCh3cml0ZXIsIGluZm8ucHJlc2VydmVMdW1pbm9zaXR5ID8gMSA6IDApO1xuXHRcdHdyaXRlWmVyb3Mod3JpdGVyLCAxKTtcblx0fSxcbik7XG5cbmludGVyZmFjZSBCbGFja0FuZFdoaXRlRGVzY3JpcHRvciB7XG5cdCdSZCAgJzogbnVtYmVyO1xuXHRZbGx3OiBudW1iZXI7XG5cdCdHcm4gJzogbnVtYmVyO1xuXHQnQ3luICc6IG51bWJlcjtcblx0J0JsICAnOiBudW1iZXI7XG5cdE1nbnQ6IG51bWJlcjtcblx0dXNlVGludDogYm9vbGVhbjtcblx0dGludENvbG9yPzogRGVzY3JpcHRvckNvbG9yO1xuXHRid1ByZXNldEtpbmQ6IG51bWJlcjtcblx0YmxhY2tBbmRXaGl0ZVByZXNldEZpbGVOYW1lOiBzdHJpbmc7XG59XG5cbmFkZEhhbmRsZXIoXG5cdCdibHdoJyxcblx0YWRqdXN0bWVudFR5cGUoJ2JsYWNrICYgd2hpdGUnKSxcblx0KHJlYWRlciwgdGFyZ2V0LCBsZWZ0KSA9PiB7XG5cdFx0Y29uc3QgZGVzYzogQmxhY2tBbmRXaGl0ZURlc2NyaXB0b3IgPSByZWFkVmVyc2lvbkFuZERlc2NyaXB0b3IocmVhZGVyKTtcblx0XHR0YXJnZXQuYWRqdXN0bWVudCA9IHtcblx0XHRcdHR5cGU6ICdibGFjayAmIHdoaXRlJyxcblx0XHRcdHJlZHM6IGRlc2NbJ1JkICAnXSxcblx0XHRcdHllbGxvd3M6IGRlc2MuWWxsdyxcblx0XHRcdGdyZWVuczogZGVzY1snR3JuICddLFxuXHRcdFx0Y3lhbnM6IGRlc2NbJ0N5biAnXSxcblx0XHRcdGJsdWVzOiBkZXNjWydCbCAgJ10sXG5cdFx0XHRtYWdlbnRhczogZGVzYy5NZ250LFxuXHRcdFx0dXNlVGludDogISFkZXNjLnVzZVRpbnQsXG5cdFx0XHRwcmVzZXRLaW5kOiBkZXNjLmJ3UHJlc2V0S2luZCxcblx0XHRcdHByZXNldEZpbGVOYW1lOiBkZXNjLmJsYWNrQW5kV2hpdGVQcmVzZXRGaWxlTmFtZSxcblx0XHR9O1xuXG5cdFx0aWYgKGRlc2MudGludENvbG9yICE9PSB1bmRlZmluZWQpIHRhcmdldC5hZGp1c3RtZW50LnRpbnRDb2xvciA9IHBhcnNlQ29sb3IoZGVzYy50aW50Q29sb3IpO1xuXG5cdFx0c2tpcEJ5dGVzKHJlYWRlciwgbGVmdCgpKTtcblx0fSxcblx0KHdyaXRlciwgdGFyZ2V0KSA9PiB7XG5cdFx0Y29uc3QgaW5mbyA9IHRhcmdldC5hZGp1c3RtZW50IGFzIEJsYWNrQW5kV2hpdGVBZGp1c3RtZW50O1xuXHRcdGNvbnN0IGRlc2M6IEJsYWNrQW5kV2hpdGVEZXNjcmlwdG9yID0ge1xuXHRcdFx0J1JkICAnOiBpbmZvLnJlZHMgfHwgMCxcblx0XHRcdFlsbHc6IGluZm8ueWVsbG93cyB8fCAwLFxuXHRcdFx0J0dybiAnOiBpbmZvLmdyZWVucyB8fCAwLFxuXHRcdFx0J0N5biAnOiBpbmZvLmN5YW5zIHx8IDAsXG5cdFx0XHQnQmwgICc6IGluZm8uYmx1ZXMgfHwgMCxcblx0XHRcdE1nbnQ6IGluZm8ubWFnZW50YXMgfHwgMCxcblx0XHRcdHVzZVRpbnQ6ICEhaW5mby51c2VUaW50LFxuXHRcdFx0dGludENvbG9yOiBzZXJpYWxpemVDb2xvcihpbmZvLnRpbnRDb2xvciksXG5cdFx0XHRid1ByZXNldEtpbmQ6IGluZm8ucHJlc2V0S2luZCB8fCAwLFxuXHRcdFx0YmxhY2tBbmRXaGl0ZVByZXNldEZpbGVOYW1lOiBpbmZvLnByZXNldEZpbGVOYW1lIHx8ICcnLFxuXHRcdH07XG5cblx0XHR3cml0ZVZlcnNpb25BbmREZXNjcmlwdG9yKHdyaXRlciwgJycsICdudWxsJywgZGVzYyk7XG5cdH0sXG4pO1xuXG5hZGRIYW5kbGVyKFxuXHQncGhmbCcsXG5cdGFkanVzdG1lbnRUeXBlKCdwaG90byBmaWx0ZXInKSxcblx0KHJlYWRlciwgdGFyZ2V0LCBsZWZ0KSA9PiB7XG5cdFx0Y29uc3QgdmVyc2lvbiA9IHJlYWRVaW50MTYocmVhZGVyKTtcblx0XHRpZiAodmVyc2lvbiAhPT0gMiAmJiB2ZXJzaW9uICE9PSAzKSB0aHJvdyBuZXcgRXJyb3IoJ0ludmFsaWQgcGhmbCB2ZXJzaW9uJyk7XG5cblx0XHRsZXQgY29sb3I6IENvbG9yO1xuXG5cdFx0aWYgKHZlcnNpb24gPT09IDIpIHtcblx0XHRcdGNvbG9yID0gcmVhZENvbG9yKHJlYWRlcik7XG5cdFx0fSBlbHNlIHsgLy8gdmVyc2lvbiAzXG5cdFx0XHQvLyBUT0RPOiB0ZXN0IHRoaXMsIHRoaXMgaXMgcHJvYmFibHkgd3Jvbmdcblx0XHRcdGNvbG9yID0ge1xuXHRcdFx0XHRsOiByZWFkSW50MzIocmVhZGVyKSAvIDEwMCxcblx0XHRcdFx0YTogcmVhZEludDMyKHJlYWRlcikgLyAxMDAsXG5cdFx0XHRcdGI6IHJlYWRJbnQzMihyZWFkZXIpIC8gMTAwLFxuXHRcdFx0fTtcblx0XHR9XG5cblx0XHR0YXJnZXQuYWRqdXN0bWVudCA9IHtcblx0XHRcdHR5cGU6ICdwaG90byBmaWx0ZXInLFxuXHRcdFx0Y29sb3IsXG5cdFx0XHRkZW5zaXR5OiByZWFkVWludDMyKHJlYWRlcikgLyAxMDAsXG5cdFx0XHRwcmVzZXJ2ZUx1bWlub3NpdHk6ICEhcmVhZFVpbnQ4KHJlYWRlciksXG5cdFx0fTtcblxuXHRcdHNraXBCeXRlcyhyZWFkZXIsIGxlZnQoKSk7XG5cdH0sXG5cdCh3cml0ZXIsIHRhcmdldCkgPT4ge1xuXHRcdGNvbnN0IGluZm8gPSB0YXJnZXQuYWRqdXN0bWVudCBhcyBQaG90b0ZpbHRlckFkanVzdG1lbnQ7XG5cdFx0d3JpdGVVaW50MTYod3JpdGVyLCAyKTsgLy8gdmVyc2lvblxuXHRcdHdyaXRlQ29sb3Iod3JpdGVyLCBpbmZvLmNvbG9yIHx8IHsgbDogMCwgYTogMCwgYjogMCB9KTtcblx0XHR3cml0ZVVpbnQzMih3cml0ZXIsIChpbmZvLmRlbnNpdHkgfHwgMCkgKiAxMDApO1xuXHRcdHdyaXRlVWludDgod3JpdGVyLCBpbmZvLnByZXNlcnZlTHVtaW5vc2l0eSA/IDEgOiAwKTtcblx0XHR3cml0ZVplcm9zKHdyaXRlciwgMyk7XG5cdH0sXG4pO1xuXG5mdW5jdGlvbiByZWFkTWl4ckNoYW5uZWwocmVhZGVyOiBQc2RSZWFkZXIpOiBDaGFubmVsTWl4ZXJDaGFubmVsIHtcblx0Y29uc3QgcmVkID0gcmVhZEludDE2KHJlYWRlcik7XG5cdGNvbnN0IGdyZWVuID0gcmVhZEludDE2KHJlYWRlcik7XG5cdGNvbnN0IGJsdWUgPSByZWFkSW50MTYocmVhZGVyKTtcblx0c2tpcEJ5dGVzKHJlYWRlciwgMik7XG5cdGNvbnN0IGNvbnN0YW50ID0gcmVhZEludDE2KHJlYWRlcik7XG5cdHJldHVybiB7IHJlZCwgZ3JlZW4sIGJsdWUsIGNvbnN0YW50IH07XG59XG5cbmZ1bmN0aW9uIHdyaXRlTWl4ckNoYW5uZWwod3JpdGVyOiBQc2RXcml0ZXIsIGNoYW5uZWw6IENoYW5uZWxNaXhlckNoYW5uZWwgfCB1bmRlZmluZWQpIHtcblx0Y29uc3QgYyA9IGNoYW5uZWwgfHwge30gYXMgUGFydGlhbDxDaGFubmVsTWl4ZXJDaGFubmVsPjtcblx0d3JpdGVJbnQxNih3cml0ZXIsIGMucmVkISk7XG5cdHdyaXRlSW50MTYod3JpdGVyLCBjLmdyZWVuISk7XG5cdHdyaXRlSW50MTYod3JpdGVyLCBjLmJsdWUhKTtcblx0d3JpdGVaZXJvcyh3cml0ZXIsIDIpO1xuXHR3cml0ZUludDE2KHdyaXRlciwgYy5jb25zdGFudCEpO1xufVxuXG5hZGRIYW5kbGVyKFxuXHQnbWl4cicsXG5cdGFkanVzdG1lbnRUeXBlKCdjaGFubmVsIG1peGVyJyksXG5cdChyZWFkZXIsIHRhcmdldCwgbGVmdCkgPT4ge1xuXHRcdGlmIChyZWFkVWludDE2KHJlYWRlcikgIT09IDEpIHRocm93IG5ldyBFcnJvcignSW52YWxpZCBtaXhyIHZlcnNpb24nKTtcblxuXHRcdGNvbnN0IGFkanVzdG1lbnQ6IENoYW5uZWxNaXhlckFkanVzdG1lbnQgPSB0YXJnZXQuYWRqdXN0bWVudCA9IHtcblx0XHRcdC4uLnRhcmdldC5hZGp1c3RtZW50IGFzIFByZXNldEluZm8sXG5cdFx0XHR0eXBlOiAnY2hhbm5lbCBtaXhlcicsXG5cdFx0XHRtb25vY2hyb21lOiAhIXJlYWRVaW50MTYocmVhZGVyKSxcblx0XHR9O1xuXG5cdFx0aWYgKCFhZGp1c3RtZW50Lm1vbm9jaHJvbWUpIHtcblx0XHRcdGFkanVzdG1lbnQucmVkID0gcmVhZE1peHJDaGFubmVsKHJlYWRlcik7XG5cdFx0XHRhZGp1c3RtZW50LmdyZWVuID0gcmVhZE1peHJDaGFubmVsKHJlYWRlcik7XG5cdFx0XHRhZGp1c3RtZW50LmJsdWUgPSByZWFkTWl4ckNoYW5uZWwocmVhZGVyKTtcblx0XHR9XG5cblx0XHRhZGp1c3RtZW50LmdyYXkgPSByZWFkTWl4ckNoYW5uZWwocmVhZGVyKTtcblxuXHRcdHNraXBCeXRlcyhyZWFkZXIsIGxlZnQoKSk7XG5cdH0sXG5cdCh3cml0ZXIsIHRhcmdldCkgPT4ge1xuXHRcdGNvbnN0IGluZm8gPSB0YXJnZXQuYWRqdXN0bWVudCBhcyBDaGFubmVsTWl4ZXJBZGp1c3RtZW50O1xuXHRcdHdyaXRlVWludDE2KHdyaXRlciwgMSk7IC8vIHZlcnNpb25cblx0XHR3cml0ZVVpbnQxNih3cml0ZXIsIGluZm8ubW9ub2Nocm9tZSA/IDEgOiAwKTtcblxuXHRcdGlmIChpbmZvLm1vbm9jaHJvbWUpIHtcblx0XHRcdHdyaXRlTWl4ckNoYW5uZWwod3JpdGVyLCBpbmZvLmdyYXkpO1xuXHRcdFx0d3JpdGVaZXJvcyh3cml0ZXIsIDMgKiA1ICogMik7XG5cdFx0fSBlbHNlIHtcblx0XHRcdHdyaXRlTWl4ckNoYW5uZWwod3JpdGVyLCBpbmZvLnJlZCk7XG5cdFx0XHR3cml0ZU1peHJDaGFubmVsKHdyaXRlciwgaW5mby5ncmVlbik7XG5cdFx0XHR3cml0ZU1peHJDaGFubmVsKHdyaXRlciwgaW5mby5ibHVlKTtcblx0XHRcdHdyaXRlTWl4ckNoYW5uZWwod3JpdGVyLCBpbmZvLmdyYXkpO1xuXHRcdH1cblx0fSxcbik7XG5cbmNvbnN0IGNvbG9yTG9va3VwVHlwZSA9IGNyZWF0ZUVudW08JzNkbHV0JyB8ICdhYnN0cmFjdFByb2ZpbGUnIHwgJ2RldmljZUxpbmtQcm9maWxlJz4oJ2NvbG9yTG9va3VwVHlwZScsICczRExVVCcsIHtcblx0JzNkbHV0JzogJzNETFVUJyxcblx0YWJzdHJhY3RQcm9maWxlOiAnYWJzdHJhY3RQcm9maWxlJyxcblx0ZGV2aWNlTGlua1Byb2ZpbGU6ICdkZXZpY2VMaW5rUHJvZmlsZScsXG59KTtcblxuY29uc3QgTFVURm9ybWF0VHlwZSA9IGNyZWF0ZUVudW08J2xvb2snIHwgJ2N1YmUnIHwgJzNkbCc+KCdMVVRGb3JtYXRUeXBlJywgJ2xvb2snLCB7XG5cdGxvb2s6ICdMVVRGb3JtYXRMT09LJyxcblx0Y3ViZTogJ0xVVEZvcm1hdENVQkUnLFxuXHQnM2RsJzogJ0xVVEZvcm1hdDNETCcsXG59KTtcblxuY29uc3QgY29sb3JMb29rdXBPcmRlciA9IGNyZWF0ZUVudW08J3JnYicgfCAnYmdyJz4oJ2NvbG9yTG9va3VwT3JkZXInLCAncmdiJywge1xuXHRyZ2I6ICdyZ2JPcmRlcicsXG5cdGJncjogJ2Jnck9yZGVyJyxcbn0pO1xuXG5pbnRlcmZhY2UgQ29sb3JMb29rdXBEZXNjcmlwdG9yIHtcblx0bG9va3VwVHlwZT86IHN0cmluZztcblx0J05tICAnPzogc3RyaW5nO1xuXHREdGhyPzogYm9vbGVhbjtcblx0cHJvZmlsZT86IFVpbnQ4QXJyYXk7XG5cdExVVEZvcm1hdD86IHN0cmluZztcblx0ZGF0YU9yZGVyPzogc3RyaW5nO1xuXHR0YWJsZU9yZGVyPzogc3RyaW5nO1xuXHRMVVQzREZpbGVEYXRhPzogVWludDhBcnJheTtcblx0TFVUM0RGaWxlTmFtZT86IHN0cmluZztcbn1cblxuYWRkSGFuZGxlcihcblx0J2NsckwnLFxuXHRhZGp1c3RtZW50VHlwZSgnY29sb3IgbG9va3VwJyksXG5cdChyZWFkZXIsIHRhcmdldCwgbGVmdCkgPT4ge1xuXHRcdGlmIChyZWFkVWludDE2KHJlYWRlcikgIT09IDEpIHRocm93IG5ldyBFcnJvcignSW52YWxpZCBjbHJMIHZlcnNpb24nKTtcblxuXHRcdGNvbnN0IGRlc2M6IENvbG9yTG9va3VwRGVzY3JpcHRvciA9IHJlYWRWZXJzaW9uQW5kRGVzY3JpcHRvcihyZWFkZXIpO1xuXHRcdHRhcmdldC5hZGp1c3RtZW50ID0geyB0eXBlOiAnY29sb3IgbG9va3VwJyB9O1xuXHRcdGNvbnN0IGluZm8gPSB0YXJnZXQuYWRqdXN0bWVudDtcblxuXHRcdGlmIChkZXNjLmxvb2t1cFR5cGUgIT09IHVuZGVmaW5lZCkgaW5mby5sb29rdXBUeXBlID0gY29sb3JMb29rdXBUeXBlLmRlY29kZShkZXNjLmxvb2t1cFR5cGUpO1xuXHRcdGlmIChkZXNjWydObSAgJ10gIT09IHVuZGVmaW5lZCkgaW5mby5uYW1lID0gZGVzY1snTm0gICddO1xuXHRcdGlmIChkZXNjLkR0aHIgIT09IHVuZGVmaW5lZCkgaW5mby5kaXRoZXIgPSBkZXNjLkR0aHI7XG5cdFx0aWYgKGRlc2MucHJvZmlsZSAhPT0gdW5kZWZpbmVkKSBpbmZvLnByb2ZpbGUgPSBkZXNjLnByb2ZpbGU7XG5cdFx0aWYgKGRlc2MuTFVURm9ybWF0ICE9PSB1bmRlZmluZWQpIGluZm8ubHV0Rm9ybWF0ID0gTFVURm9ybWF0VHlwZS5kZWNvZGUoZGVzYy5MVVRGb3JtYXQpO1xuXHRcdGlmIChkZXNjLmRhdGFPcmRlciAhPT0gdW5kZWZpbmVkKSBpbmZvLmRhdGFPcmRlciA9IGNvbG9yTG9va3VwT3JkZXIuZGVjb2RlKGRlc2MuZGF0YU9yZGVyKTtcblx0XHRpZiAoZGVzYy50YWJsZU9yZGVyICE9PSB1bmRlZmluZWQpIGluZm8udGFibGVPcmRlciA9IGNvbG9yTG9va3VwT3JkZXIuZGVjb2RlKGRlc2MudGFibGVPcmRlcik7XG5cdFx0aWYgKGRlc2MuTFVUM0RGaWxlRGF0YSAhPT0gdW5kZWZpbmVkKSBpbmZvLmx1dDNERmlsZURhdGEgPSBkZXNjLkxVVDNERmlsZURhdGE7XG5cdFx0aWYgKGRlc2MuTFVUM0RGaWxlTmFtZSAhPT0gdW5kZWZpbmVkKSBpbmZvLmx1dDNERmlsZU5hbWUgPSBkZXNjLkxVVDNERmlsZU5hbWU7XG5cblx0XHRza2lwQnl0ZXMocmVhZGVyLCBsZWZ0KCkpO1xuXHR9LFxuXHQod3JpdGVyLCB0YXJnZXQpID0+IHtcblx0XHRjb25zdCBpbmZvID0gdGFyZ2V0LmFkanVzdG1lbnQgYXMgQ29sb3JMb29rdXBBZGp1c3RtZW50O1xuXHRcdGNvbnN0IGRlc2M6IENvbG9yTG9va3VwRGVzY3JpcHRvciA9IHt9O1xuXG5cdFx0aWYgKGluZm8ubG9va3VwVHlwZSAhPT0gdW5kZWZpbmVkKSBkZXNjLmxvb2t1cFR5cGUgPSBjb2xvckxvb2t1cFR5cGUuZW5jb2RlKGluZm8ubG9va3VwVHlwZSk7XG5cdFx0aWYgKGluZm8ubmFtZSAhPT0gdW5kZWZpbmVkKSBkZXNjWydObSAgJ10gPSBpbmZvLm5hbWU7XG5cdFx0aWYgKGluZm8uZGl0aGVyICE9PSB1bmRlZmluZWQpIGRlc2MuRHRociA9IGluZm8uZGl0aGVyO1xuXHRcdGlmIChpbmZvLnByb2ZpbGUgIT09IHVuZGVmaW5lZCkgZGVzYy5wcm9maWxlID0gaW5mby5wcm9maWxlO1xuXHRcdGlmIChpbmZvLmx1dEZvcm1hdCAhPT0gdW5kZWZpbmVkKSBkZXNjLkxVVEZvcm1hdCA9IExVVEZvcm1hdFR5cGUuZW5jb2RlKGluZm8ubHV0Rm9ybWF0KTtcblx0XHRpZiAoaW5mby5kYXRhT3JkZXIgIT09IHVuZGVmaW5lZCkgZGVzYy5kYXRhT3JkZXIgPSBjb2xvckxvb2t1cE9yZGVyLmVuY29kZShpbmZvLmRhdGFPcmRlcik7XG5cdFx0aWYgKGluZm8udGFibGVPcmRlciAhPT0gdW5kZWZpbmVkKSBkZXNjLnRhYmxlT3JkZXIgPSBjb2xvckxvb2t1cE9yZGVyLmVuY29kZShpbmZvLnRhYmxlT3JkZXIpO1xuXHRcdGlmIChpbmZvLmx1dDNERmlsZURhdGEgIT09IHVuZGVmaW5lZCkgZGVzYy5MVVQzREZpbGVEYXRhID0gaW5mby5sdXQzREZpbGVEYXRhO1xuXHRcdGlmIChpbmZvLmx1dDNERmlsZU5hbWUgIT09IHVuZGVmaW5lZCkgZGVzYy5MVVQzREZpbGVOYW1lID0gaW5mby5sdXQzREZpbGVOYW1lO1xuXG5cdFx0d3JpdGVVaW50MTYod3JpdGVyLCAxKTsgLy8gdmVyc2lvblxuXHRcdHdyaXRlVmVyc2lvbkFuZERlc2NyaXB0b3Iod3JpdGVyLCAnJywgJ251bGwnLCBkZXNjKTtcblx0fSxcbik7XG5cbmFkZEhhbmRsZXIoXG5cdCdudnJ0Jyxcblx0YWRqdXN0bWVudFR5cGUoJ2ludmVydCcpLFxuXHQocmVhZGVyLCB0YXJnZXQsIGxlZnQpID0+IHtcblx0XHR0YXJnZXQuYWRqdXN0bWVudCA9IHsgdHlwZTogJ2ludmVydCcgfTtcblx0XHRza2lwQnl0ZXMocmVhZGVyLCBsZWZ0KCkpO1xuXHR9LFxuXHQoKSA9PiB7XG5cdFx0Ly8gbm90aGluZyB0byB3cml0ZSBoZXJlXG5cdH0sXG4pO1xuXG5hZGRIYW5kbGVyKFxuXHQncG9zdCcsXG5cdGFkanVzdG1lbnRUeXBlKCdwb3N0ZXJpemUnKSxcblx0KHJlYWRlciwgdGFyZ2V0LCBsZWZ0KSA9PiB7XG5cdFx0dGFyZ2V0LmFkanVzdG1lbnQgPSB7XG5cdFx0XHR0eXBlOiAncG9zdGVyaXplJyxcblx0XHRcdGxldmVsczogcmVhZFVpbnQxNihyZWFkZXIpLFxuXHRcdH07XG5cdFx0c2tpcEJ5dGVzKHJlYWRlciwgbGVmdCgpKTtcblx0fSxcblx0KHdyaXRlciwgdGFyZ2V0KSA9PiB7XG5cdFx0Y29uc3QgaW5mbyA9IHRhcmdldC5hZGp1c3RtZW50IGFzIFBvc3Rlcml6ZUFkanVzdG1lbnQ7XG5cdFx0d3JpdGVVaW50MTYod3JpdGVyLCBpbmZvLmxldmVscyA/PyA0KTtcblx0XHR3cml0ZVplcm9zKHdyaXRlciwgMik7XG5cdH0sXG4pO1xuXG5hZGRIYW5kbGVyKFxuXHQndGhycycsXG5cdGFkanVzdG1lbnRUeXBlKCd0aHJlc2hvbGQnKSxcblx0KHJlYWRlciwgdGFyZ2V0LCBsZWZ0KSA9PiB7XG5cdFx0dGFyZ2V0LmFkanVzdG1lbnQgPSB7XG5cdFx0XHR0eXBlOiAndGhyZXNob2xkJyxcblx0XHRcdGxldmVsOiByZWFkVWludDE2KHJlYWRlciksXG5cdFx0fTtcblx0XHRza2lwQnl0ZXMocmVhZGVyLCBsZWZ0KCkpO1xuXHR9LFxuXHQod3JpdGVyLCB0YXJnZXQpID0+IHtcblx0XHRjb25zdCBpbmZvID0gdGFyZ2V0LmFkanVzdG1lbnQgYXMgVGhyZXNob2xkQWRqdXN0bWVudDtcblx0XHR3cml0ZVVpbnQxNih3cml0ZXIsIGluZm8ubGV2ZWwgPz8gMTI4KTtcblx0XHR3cml0ZVplcm9zKHdyaXRlciwgMik7XG5cdH0sXG4pO1xuXG5jb25zdCBncmRtQ29sb3JNb2RlbHMgPSBbJycsICcnLCAnJywgJ3JnYicsICdoc2InLCAnJywgJ2xhYiddO1xuXG5hZGRIYW5kbGVyKFxuXHQnZ3JkbScsXG5cdGFkanVzdG1lbnRUeXBlKCdncmFkaWVudCBtYXAnKSxcblx0KHJlYWRlciwgdGFyZ2V0LCBsZWZ0KSA9PiB7XG5cdFx0aWYgKHJlYWRVaW50MTYocmVhZGVyKSAhPT0gMSkgdGhyb3cgbmV3IEVycm9yKCdJbnZhbGlkIGdyZG0gdmVyc2lvbicpO1xuXG5cdFx0Y29uc3QgaW5mbzogR3JhZGllbnRNYXBBZGp1c3RtZW50ID0ge1xuXHRcdFx0dHlwZTogJ2dyYWRpZW50IG1hcCcsXG5cdFx0XHRncmFkaWVudFR5cGU6ICdzb2xpZCcsXG5cdFx0fTtcblxuXHRcdGluZm8ucmV2ZXJzZSA9ICEhcmVhZFVpbnQ4KHJlYWRlcik7XG5cdFx0aW5mby5kaXRoZXIgPSAhIXJlYWRVaW50OChyZWFkZXIpO1xuXHRcdGluZm8ubmFtZSA9IHJlYWRVbmljb2RlU3RyaW5nKHJlYWRlcik7XG5cdFx0aW5mby5jb2xvclN0b3BzID0gW107XG5cdFx0aW5mby5vcGFjaXR5U3RvcHMgPSBbXTtcblxuXHRcdGNvbnN0IHN0b3BzQ291bnQgPSByZWFkVWludDE2KHJlYWRlcik7XG5cblx0XHRmb3IgKGxldCBpID0gMDsgaSA8IHN0b3BzQ291bnQ7IGkrKykge1xuXHRcdFx0aW5mby5jb2xvclN0b3BzLnB1c2goe1xuXHRcdFx0XHRsb2NhdGlvbjogcmVhZFVpbnQzMihyZWFkZXIpLFxuXHRcdFx0XHRtaWRwb2ludDogcmVhZFVpbnQzMihyZWFkZXIpIC8gMTAwLFxuXHRcdFx0XHRjb2xvcjogcmVhZENvbG9yKHJlYWRlciksXG5cdFx0XHR9KTtcblx0XHRcdHNraXBCeXRlcyhyZWFkZXIsIDIpO1xuXHRcdH1cblxuXHRcdGNvbnN0IG9wYWNpdHlTdG9wc0NvdW50ID0gcmVhZFVpbnQxNihyZWFkZXIpO1xuXG5cdFx0Zm9yIChsZXQgaSA9IDA7IGkgPCBvcGFjaXR5U3RvcHNDb3VudDsgaSsrKSB7XG5cdFx0XHRpbmZvLm9wYWNpdHlTdG9wcy5wdXNoKHtcblx0XHRcdFx0bG9jYXRpb246IHJlYWRVaW50MzIocmVhZGVyKSxcblx0XHRcdFx0bWlkcG9pbnQ6IHJlYWRVaW50MzIocmVhZGVyKSAvIDEwMCxcblx0XHRcdFx0b3BhY2l0eTogcmVhZFVpbnQxNihyZWFkZXIpIC8gMHhmZixcblx0XHRcdH0pO1xuXHRcdH1cblxuXHRcdGNvbnN0IGV4cGFuc2lvbkNvdW50ID0gcmVhZFVpbnQxNihyZWFkZXIpO1xuXHRcdGlmIChleHBhbnNpb25Db3VudCAhPT0gMikgdGhyb3cgbmV3IEVycm9yKCdJbnZhbGlkIGdyZG0gZXhwYW5zaW9uIGNvdW50Jyk7XG5cblx0XHRjb25zdCBpbnRlcnBvbGF0aW9uID0gcmVhZFVpbnQxNihyZWFkZXIpO1xuXHRcdGluZm8uc21vb3RobmVzcyA9IGludGVycG9sYXRpb24gLyA0MDk2O1xuXG5cdFx0Y29uc3QgbGVuZ3RoID0gcmVhZFVpbnQxNihyZWFkZXIpO1xuXHRcdGlmIChsZW5ndGggIT09IDMyKSB0aHJvdyBuZXcgRXJyb3IoJ0ludmFsaWQgZ3JkbSBsZW5ndGgnKTtcblxuXHRcdGluZm8uZ3JhZGllbnRUeXBlID0gcmVhZFVpbnQxNihyZWFkZXIpID8gJ25vaXNlJyA6ICdzb2xpZCc7XG5cdFx0aW5mby5yYW5kb21TZWVkID0gcmVhZFVpbnQzMihyZWFkZXIpO1xuXHRcdGluZm8uYWRkVHJhbnNwYXJlbmN5ID0gISFyZWFkVWludDE2KHJlYWRlcik7XG5cdFx0aW5mby5yZXN0cmljdENvbG9ycyA9ICEhcmVhZFVpbnQxNihyZWFkZXIpO1xuXHRcdGluZm8ucm91Z2huZXNzID0gcmVhZFVpbnQzMihyZWFkZXIpIC8gNDA5Njtcblx0XHRpbmZvLmNvbG9yTW9kZWwgPSAoZ3JkbUNvbG9yTW9kZWxzW3JlYWRVaW50MTYocmVhZGVyKV0gfHwgJ3JnYicpIGFzICdyZ2InIHwgJ2hzYicgfCAnbGFiJztcblxuXHRcdGluZm8ubWluID0gW1xuXHRcdFx0cmVhZFVpbnQxNihyZWFkZXIpIC8gMHg4MDAwLFxuXHRcdFx0cmVhZFVpbnQxNihyZWFkZXIpIC8gMHg4MDAwLFxuXHRcdFx0cmVhZFVpbnQxNihyZWFkZXIpIC8gMHg4MDAwLFxuXHRcdFx0cmVhZFVpbnQxNihyZWFkZXIpIC8gMHg4MDAwLFxuXHRcdF07XG5cblx0XHRpbmZvLm1heCA9IFtcblx0XHRcdHJlYWRVaW50MTYocmVhZGVyKSAvIDB4ODAwMCxcblx0XHRcdHJlYWRVaW50MTYocmVhZGVyKSAvIDB4ODAwMCxcblx0XHRcdHJlYWRVaW50MTYocmVhZGVyKSAvIDB4ODAwMCxcblx0XHRcdHJlYWRVaW50MTYocmVhZGVyKSAvIDB4ODAwMCxcblx0XHRdO1xuXG5cdFx0c2tpcEJ5dGVzKHJlYWRlciwgbGVmdCgpKTtcblxuXHRcdGZvciAoY29uc3QgcyBvZiBpbmZvLmNvbG9yU3RvcHMpIHMubG9jYXRpb24gLz0gaW50ZXJwb2xhdGlvbjtcblx0XHRmb3IgKGNvbnN0IHMgb2YgaW5mby5vcGFjaXR5U3RvcHMpIHMubG9jYXRpb24gLz0gaW50ZXJwb2xhdGlvbjtcblxuXHRcdHRhcmdldC5hZGp1c3RtZW50ID0gaW5mbztcblx0fSxcblx0KHdyaXRlciwgdGFyZ2V0KSA9PiB7XG5cdFx0Y29uc3QgaW5mbyA9IHRhcmdldC5hZGp1c3RtZW50IGFzIEdyYWRpZW50TWFwQWRqdXN0bWVudDtcblxuXHRcdHdyaXRlVWludDE2KHdyaXRlciwgMSk7IC8vIHZlcnNpb25cblx0XHR3cml0ZVVpbnQ4KHdyaXRlciwgaW5mby5yZXZlcnNlID8gMSA6IDApO1xuXHRcdHdyaXRlVWludDgod3JpdGVyLCBpbmZvLmRpdGhlciA/IDEgOiAwKTtcblx0XHR3cml0ZVVuaWNvZGVTdHJpbmdXaXRoUGFkZGluZyh3cml0ZXIsIGluZm8ubmFtZSB8fCAnJyk7XG5cdFx0d3JpdGVVaW50MTYod3JpdGVyLCBpbmZvLmNvbG9yU3RvcHMgJiYgaW5mby5jb2xvclN0b3BzLmxlbmd0aCB8fCAwKTtcblxuXHRcdGNvbnN0IGludGVycG9sYXRpb24gPSBNYXRoLnJvdW5kKChpbmZvLnNtb290aG5lc3MgPz8gMSkgKiA0MDk2KTtcblxuXHRcdGZvciAoY29uc3QgcyBvZiBpbmZvLmNvbG9yU3RvcHMgfHwgW10pIHtcblx0XHRcdHdyaXRlVWludDMyKHdyaXRlciwgTWF0aC5yb3VuZChzLmxvY2F0aW9uICogaW50ZXJwb2xhdGlvbikpO1xuXHRcdFx0d3JpdGVVaW50MzIod3JpdGVyLCBNYXRoLnJvdW5kKHMubWlkcG9pbnQgKiAxMDApKTtcblx0XHRcdHdyaXRlQ29sb3Iod3JpdGVyLCBzLmNvbG9yKTtcblx0XHRcdHdyaXRlWmVyb3Mod3JpdGVyLCAyKTtcblx0XHR9XG5cblx0XHR3cml0ZVVpbnQxNih3cml0ZXIsIGluZm8ub3BhY2l0eVN0b3BzICYmIGluZm8ub3BhY2l0eVN0b3BzLmxlbmd0aCB8fCAwKTtcblxuXHRcdGZvciAoY29uc3QgcyBvZiBpbmZvLm9wYWNpdHlTdG9wcyB8fCBbXSkge1xuXHRcdFx0d3JpdGVVaW50MzIod3JpdGVyLCBNYXRoLnJvdW5kKHMubG9jYXRpb24gKiBpbnRlcnBvbGF0aW9uKSk7XG5cdFx0XHR3cml0ZVVpbnQzMih3cml0ZXIsIE1hdGgucm91bmQocy5taWRwb2ludCAqIDEwMCkpO1xuXHRcdFx0d3JpdGVVaW50MTYod3JpdGVyLCBNYXRoLnJvdW5kKHMub3BhY2l0eSAqIDB4ZmYpKTtcblx0XHR9XG5cblx0XHR3cml0ZVVpbnQxNih3cml0ZXIsIDIpOyAvLyBleHBhbnNpb24gY291bnRcblx0XHR3cml0ZVVpbnQxNih3cml0ZXIsIGludGVycG9sYXRpb24pO1xuXHRcdHdyaXRlVWludDE2KHdyaXRlciwgMzIpOyAvLyBsZW5ndGhcblx0XHR3cml0ZVVpbnQxNih3cml0ZXIsIGluZm8uZ3JhZGllbnRUeXBlID09PSAnbm9pc2UnID8gMSA6IDApO1xuXHRcdHdyaXRlVWludDMyKHdyaXRlciwgaW5mby5yYW5kb21TZWVkIHx8IDApO1xuXHRcdHdyaXRlVWludDE2KHdyaXRlciwgaW5mby5hZGRUcmFuc3BhcmVuY3kgPyAxIDogMCk7XG5cdFx0d3JpdGVVaW50MTYod3JpdGVyLCBpbmZvLnJlc3RyaWN0Q29sb3JzID8gMSA6IDApO1xuXHRcdHdyaXRlVWludDMyKHdyaXRlciwgTWF0aC5yb3VuZCgoaW5mby5yb3VnaG5lc3MgPz8gMSkgKiA0MDk2KSk7XG5cdFx0Y29uc3QgY29sb3JNb2RlbCA9IGdyZG1Db2xvck1vZGVscy5pbmRleE9mKGluZm8uY29sb3JNb2RlbCA/PyAncmdiJyk7XG5cdFx0d3JpdGVVaW50MTYod3JpdGVyLCBjb2xvck1vZGVsID09PSAtMSA/IDMgOiBjb2xvck1vZGVsKTtcblxuXHRcdGZvciAobGV0IGkgPSAwOyBpIDwgNDsgaSsrKVxuXHRcdFx0d3JpdGVVaW50MTYod3JpdGVyLCBNYXRoLnJvdW5kKChpbmZvLm1pbiAmJiBpbmZvLm1pbltpXSB8fCAwKSAqIDB4ODAwMCkpO1xuXG5cdFx0Zm9yIChsZXQgaSA9IDA7IGkgPCA0OyBpKyspXG5cdFx0XHR3cml0ZVVpbnQxNih3cml0ZXIsIE1hdGgucm91bmQoKGluZm8ubWF4ICYmIGluZm8ubWF4W2ldIHx8IDApICogMHg4MDAwKSk7XG5cblx0XHR3cml0ZVplcm9zKHdyaXRlciwgNCk7XG5cdH0sXG4pO1xuXG5mdW5jdGlvbiByZWFkU2VsZWN0aXZlQ29sb3JzKHJlYWRlcjogUHNkUmVhZGVyKTogQ01ZSyB7XG5cdHJldHVybiB7XG5cdFx0YzogcmVhZEludDE2KHJlYWRlciksXG5cdFx0bTogcmVhZEludDE2KHJlYWRlciksXG5cdFx0eTogcmVhZEludDE2KHJlYWRlciksXG5cdFx0azogcmVhZEludDE2KHJlYWRlciksXG5cdH07XG59XG5cbmZ1bmN0aW9uIHdyaXRlU2VsZWN0aXZlQ29sb3JzKHdyaXRlcjogUHNkV3JpdGVyLCBjbXlrOiBDTVlLIHwgdW5kZWZpbmVkKSB7XG5cdGNvbnN0IGMgPSBjbXlrIHx8IHt9IGFzIFBhcnRpYWw8Q01ZSz47XG5cdHdyaXRlSW50MTYod3JpdGVyLCBjLmMhKTtcblx0d3JpdGVJbnQxNih3cml0ZXIsIGMubSEpO1xuXHR3cml0ZUludDE2KHdyaXRlciwgYy55ISk7XG5cdHdyaXRlSW50MTYod3JpdGVyLCBjLmshKTtcbn1cblxuYWRkSGFuZGxlcihcblx0J3NlbGMnLFxuXHRhZGp1c3RtZW50VHlwZSgnc2VsZWN0aXZlIGNvbG9yJyksXG5cdChyZWFkZXIsIHRhcmdldCkgPT4ge1xuXHRcdGlmIChyZWFkVWludDE2KHJlYWRlcikgIT09IDEpIHRocm93IG5ldyBFcnJvcignSW52YWxpZCBzZWxjIHZlcnNpb24nKTtcblxuXHRcdGNvbnN0IG1vZGUgPSByZWFkVWludDE2KHJlYWRlcikgPyAnYWJzb2x1dGUnIDogJ3JlbGF0aXZlJztcblx0XHRza2lwQnl0ZXMocmVhZGVyLCA4KTtcblxuXHRcdHRhcmdldC5hZGp1c3RtZW50ID0ge1xuXHRcdFx0dHlwZTogJ3NlbGVjdGl2ZSBjb2xvcicsXG5cdFx0XHRtb2RlLFxuXHRcdFx0cmVkczogcmVhZFNlbGVjdGl2ZUNvbG9ycyhyZWFkZXIpLFxuXHRcdFx0eWVsbG93czogcmVhZFNlbGVjdGl2ZUNvbG9ycyhyZWFkZXIpLFxuXHRcdFx0Z3JlZW5zOiByZWFkU2VsZWN0aXZlQ29sb3JzKHJlYWRlciksXG5cdFx0XHRjeWFuczogcmVhZFNlbGVjdGl2ZUNvbG9ycyhyZWFkZXIpLFxuXHRcdFx0Ymx1ZXM6IHJlYWRTZWxlY3RpdmVDb2xvcnMocmVhZGVyKSxcblx0XHRcdG1hZ2VudGFzOiByZWFkU2VsZWN0aXZlQ29sb3JzKHJlYWRlciksXG5cdFx0XHR3aGl0ZXM6IHJlYWRTZWxlY3RpdmVDb2xvcnMocmVhZGVyKSxcblx0XHRcdG5ldXRyYWxzOiByZWFkU2VsZWN0aXZlQ29sb3JzKHJlYWRlciksXG5cdFx0XHRibGFja3M6IHJlYWRTZWxlY3RpdmVDb2xvcnMocmVhZGVyKSxcblx0XHR9O1xuXHR9LFxuXHQod3JpdGVyLCB0YXJnZXQpID0+IHtcblx0XHRjb25zdCBpbmZvID0gdGFyZ2V0LmFkanVzdG1lbnQgYXMgU2VsZWN0aXZlQ29sb3JBZGp1c3RtZW50O1xuXG5cdFx0d3JpdGVVaW50MTYod3JpdGVyLCAxKTsgLy8gdmVyc2lvblxuXHRcdHdyaXRlVWludDE2KHdyaXRlciwgaW5mby5tb2RlID09PSAnYWJzb2x1dGUnID8gMSA6IDApO1xuXHRcdHdyaXRlWmVyb3Mod3JpdGVyLCA4KTtcblx0XHR3cml0ZVNlbGVjdGl2ZUNvbG9ycyh3cml0ZXIsIGluZm8ucmVkcyk7XG5cdFx0d3JpdGVTZWxlY3RpdmVDb2xvcnMod3JpdGVyLCBpbmZvLnllbGxvd3MpO1xuXHRcdHdyaXRlU2VsZWN0aXZlQ29sb3JzKHdyaXRlciwgaW5mby5ncmVlbnMpO1xuXHRcdHdyaXRlU2VsZWN0aXZlQ29sb3JzKHdyaXRlciwgaW5mby5jeWFucyk7XG5cdFx0d3JpdGVTZWxlY3RpdmVDb2xvcnMod3JpdGVyLCBpbmZvLmJsdWVzKTtcblx0XHR3cml0ZVNlbGVjdGl2ZUNvbG9ycyh3cml0ZXIsIGluZm8ubWFnZW50YXMpO1xuXHRcdHdyaXRlU2VsZWN0aXZlQ29sb3JzKHdyaXRlciwgaW5mby53aGl0ZXMpO1xuXHRcdHdyaXRlU2VsZWN0aXZlQ29sb3JzKHdyaXRlciwgaW5mby5uZXV0cmFscyk7XG5cdFx0d3JpdGVTZWxlY3RpdmVDb2xvcnMod3JpdGVyLCBpbmZvLmJsYWNrcyk7XG5cdH0sXG4pO1xuXG5pbnRlcmZhY2UgQnJpZ2h0bmVzc0NvbnRyYXN0RGVzY3JpcHRvciB7XG5cdFZyc246IG51bWJlcjtcblx0QnJnaDogbnVtYmVyO1xuXHRDbnRyOiBudW1iZXI7XG5cdG1lYW5zOiBudW1iZXI7XG5cdCdMYWIgJzogYm9vbGVhbjtcblx0dXNlTGVnYWN5OiBib29sZWFuO1xuXHRBdXRvOiBib29sZWFuO1xufVxuXG5pbnRlcmZhY2UgUHJlc2V0RGVzY3JpcHRvciB7XG5cdFZyc246IG51bWJlcjtcblx0cHJlc2V0S2luZDogbnVtYmVyO1xuXHRwcmVzZXRGaWxlTmFtZTogc3RyaW5nO1xufVxuXG5pbnRlcmZhY2UgQ3VydmVzUHJlc2V0RGVzY3JpcHRvciB7XG5cdFZyc246IG51bWJlcjtcblx0Y3VydmVzUHJlc2V0S2luZDogbnVtYmVyO1xuXHRjdXJ2ZXNQcmVzZXRGaWxlTmFtZTogc3RyaW5nO1xufVxuXG5pbnRlcmZhY2UgTWl4ZXJQcmVzZXREZXNjcmlwdG9yIHtcblx0VnJzbjogbnVtYmVyO1xuXHRtaXhlclByZXNldEtpbmQ6IG51bWJlcjtcblx0bWl4ZXJQcmVzZXRGaWxlTmFtZTogc3RyaW5nO1xufVxuXG5hZGRIYW5kbGVyKFxuXHQnQ2dFZCcsXG5cdHRhcmdldCA9PiB7XG5cdFx0Y29uc3QgYSA9IHRhcmdldC5hZGp1c3RtZW50O1xuXG5cdFx0aWYgKCFhKSByZXR1cm4gZmFsc2U7XG5cblx0XHRyZXR1cm4gKGEudHlwZSA9PT0gJ2JyaWdodG5lc3MvY29udHJhc3QnICYmICFhLnVzZUxlZ2FjeSkgfHxcblx0XHRcdCgoYS50eXBlID09PSAnbGV2ZWxzJyB8fCBhLnR5cGUgPT09ICdjdXJ2ZXMnIHx8IGEudHlwZSA9PT0gJ2V4cG9zdXJlJyB8fCBhLnR5cGUgPT09ICdjaGFubmVsIG1peGVyJyB8fFxuXHRcdFx0XHRhLnR5cGUgPT09ICdodWUvc2F0dXJhdGlvbicpICYmIGEucHJlc2V0RmlsZU5hbWUgIT09IHVuZGVmaW5lZCk7XG5cdH0sXG5cdChyZWFkZXIsIHRhcmdldCwgbGVmdCkgPT4ge1xuXHRcdGNvbnN0IGRlc2MgPSByZWFkVmVyc2lvbkFuZERlc2NyaXB0b3IocmVhZGVyKSBhc1xuXHRcdFx0QnJpZ2h0bmVzc0NvbnRyYXN0RGVzY3JpcHRvciB8IFByZXNldERlc2NyaXB0b3IgfCBDdXJ2ZXNQcmVzZXREZXNjcmlwdG9yIHwgTWl4ZXJQcmVzZXREZXNjcmlwdG9yO1xuXHRcdGlmIChkZXNjLlZyc24gIT09IDEpIHRocm93IG5ldyBFcnJvcignSW52YWxpZCBDZ0VkIHZlcnNpb24nKTtcblxuXHRcdC8vIHRoaXMgc2VjdGlvbiBjYW4gc3BlY2lmeSBwcmVzZXQgZmlsZSBuYW1lIGZvciBvdGhlciBhZGp1c3RtZW50IHR5cGVzXG5cdFx0aWYgKCdwcmVzZXRGaWxlTmFtZScgaW4gZGVzYykge1xuXHRcdFx0dGFyZ2V0LmFkanVzdG1lbnQgPSB7XG5cdFx0XHRcdC4uLnRhcmdldC5hZGp1c3RtZW50IGFzIExldmVsc0FkanVzdG1lbnQgfCBFeHBvc3VyZUFkanVzdG1lbnQgfCBIdWVTYXR1cmF0aW9uQWRqdXN0bWVudCxcblx0XHRcdFx0cHJlc2V0S2luZDogZGVzYy5wcmVzZXRLaW5kLFxuXHRcdFx0XHRwcmVzZXRGaWxlTmFtZTogZGVzYy5wcmVzZXRGaWxlTmFtZSxcblx0XHRcdH07XG5cdFx0fSBlbHNlIGlmICgnY3VydmVzUHJlc2V0RmlsZU5hbWUnIGluIGRlc2MpIHtcblx0XHRcdHRhcmdldC5hZGp1c3RtZW50ID0ge1xuXHRcdFx0XHQuLi50YXJnZXQuYWRqdXN0bWVudCBhcyBDdXJ2ZXNBZGp1c3RtZW50LFxuXHRcdFx0XHRwcmVzZXRLaW5kOiBkZXNjLmN1cnZlc1ByZXNldEtpbmQsXG5cdFx0XHRcdHByZXNldEZpbGVOYW1lOiBkZXNjLmN1cnZlc1ByZXNldEZpbGVOYW1lLFxuXHRcdFx0fTtcblx0XHR9IGVsc2UgaWYgKCdtaXhlclByZXNldEZpbGVOYW1lJyBpbiBkZXNjKSB7XG5cdFx0XHR0YXJnZXQuYWRqdXN0bWVudCA9IHtcblx0XHRcdFx0Li4udGFyZ2V0LmFkanVzdG1lbnQgYXMgQ3VydmVzQWRqdXN0bWVudCxcblx0XHRcdFx0cHJlc2V0S2luZDogZGVzYy5taXhlclByZXNldEtpbmQsXG5cdFx0XHRcdHByZXNldEZpbGVOYW1lOiBkZXNjLm1peGVyUHJlc2V0RmlsZU5hbWUsXG5cdFx0XHR9O1xuXHRcdH0gZWxzZSB7XG5cdFx0XHR0YXJnZXQuYWRqdXN0bWVudCA9IHtcblx0XHRcdFx0dHlwZTogJ2JyaWdodG5lc3MvY29udHJhc3QnLFxuXHRcdFx0XHRicmlnaHRuZXNzOiBkZXNjLkJyZ2gsXG5cdFx0XHRcdGNvbnRyYXN0OiBkZXNjLkNudHIsXG5cdFx0XHRcdG1lYW5WYWx1ZTogZGVzYy5tZWFucyxcblx0XHRcdFx0dXNlTGVnYWN5OiAhIWRlc2MudXNlTGVnYWN5LFxuXHRcdFx0XHRsYWJDb2xvck9ubHk6ICEhZGVzY1snTGFiICddLFxuXHRcdFx0XHRhdXRvOiAhIWRlc2MuQXV0byxcblx0XHRcdH07XG5cdFx0fVxuXG5cdFx0c2tpcEJ5dGVzKHJlYWRlciwgbGVmdCgpKTtcblx0fSxcblx0KHdyaXRlciwgdGFyZ2V0KSA9PiB7XG5cdFx0Y29uc3QgaW5mbyA9IHRhcmdldC5hZGp1c3RtZW50ITtcblxuXHRcdGlmIChpbmZvLnR5cGUgPT09ICdsZXZlbHMnIHx8IGluZm8udHlwZSA9PT0gJ2V4cG9zdXJlJyB8fCBpbmZvLnR5cGUgPT09ICdodWUvc2F0dXJhdGlvbicpIHtcblx0XHRcdGNvbnN0IGRlc2M6IFByZXNldERlc2NyaXB0b3IgPSB7XG5cdFx0XHRcdFZyc246IDEsXG5cdFx0XHRcdHByZXNldEtpbmQ6IGluZm8ucHJlc2V0S2luZCA/PyAxLFxuXHRcdFx0XHRwcmVzZXRGaWxlTmFtZTogaW5mby5wcmVzZXRGaWxlTmFtZSB8fCAnJyxcblx0XHRcdH07XG5cdFx0XHR3cml0ZVZlcnNpb25BbmREZXNjcmlwdG9yKHdyaXRlciwgJycsICdudWxsJywgZGVzYyk7XG5cdFx0fSBlbHNlIGlmIChpbmZvLnR5cGUgPT09ICdjdXJ2ZXMnKSB7XG5cdFx0XHRjb25zdCBkZXNjOiBDdXJ2ZXNQcmVzZXREZXNjcmlwdG9yID0ge1xuXHRcdFx0XHRWcnNuOiAxLFxuXHRcdFx0XHRjdXJ2ZXNQcmVzZXRLaW5kOiBpbmZvLnByZXNldEtpbmQgPz8gMSxcblx0XHRcdFx0Y3VydmVzUHJlc2V0RmlsZU5hbWU6IGluZm8ucHJlc2V0RmlsZU5hbWUgfHwgJycsXG5cdFx0XHR9O1xuXHRcdFx0d3JpdGVWZXJzaW9uQW5kRGVzY3JpcHRvcih3cml0ZXIsICcnLCAnbnVsbCcsIGRlc2MpO1xuXHRcdH0gZWxzZSBpZiAoaW5mby50eXBlID09PSAnY2hhbm5lbCBtaXhlcicpIHtcblx0XHRcdGNvbnN0IGRlc2M6IE1peGVyUHJlc2V0RGVzY3JpcHRvciA9IHtcblx0XHRcdFx0VnJzbjogMSxcblx0XHRcdFx0bWl4ZXJQcmVzZXRLaW5kOiBpbmZvLnByZXNldEtpbmQgPz8gMSxcblx0XHRcdFx0bWl4ZXJQcmVzZXRGaWxlTmFtZTogaW5mby5wcmVzZXRGaWxlTmFtZSB8fCAnJyxcblx0XHRcdH07XG5cdFx0XHR3cml0ZVZlcnNpb25BbmREZXNjcmlwdG9yKHdyaXRlciwgJycsICdudWxsJywgZGVzYyk7XG5cdFx0fSBlbHNlIGlmIChpbmZvLnR5cGUgPT09ICdicmlnaHRuZXNzL2NvbnRyYXN0Jykge1xuXHRcdFx0Y29uc3QgZGVzYzogQnJpZ2h0bmVzc0NvbnRyYXN0RGVzY3JpcHRvciA9IHtcblx0XHRcdFx0VnJzbjogMSxcblx0XHRcdFx0QnJnaDogaW5mby5icmlnaHRuZXNzIHx8IDAsXG5cdFx0XHRcdENudHI6IGluZm8uY29udHJhc3QgfHwgMCxcblx0XHRcdFx0bWVhbnM6IGluZm8ubWVhblZhbHVlID8/IDEyNyxcblx0XHRcdFx0J0xhYiAnOiAhIWluZm8ubGFiQ29sb3JPbmx5LFxuXHRcdFx0XHR1c2VMZWdhY3k6ICEhaW5mby51c2VMZWdhY3ksXG5cdFx0XHRcdEF1dG86ICEhaW5mby5hdXRvLFxuXHRcdFx0fTtcblx0XHRcdHdyaXRlVmVyc2lvbkFuZERlc2NyaXB0b3Iod3JpdGVyLCAnJywgJ251bGwnLCBkZXNjKTtcblx0XHR9IGVsc2Uge1xuXHRcdFx0dGhyb3cgbmV3IEVycm9yKCdVbmhhbmRsZWQgQ2dFZCBjYXNlJyk7XG5cdFx0fVxuXHR9LFxuKTtcblxuYWRkSGFuZGxlcihcblx0J1R4dDInLFxuXHRoYXNLZXkoJ2VuZ2luZURhdGEnKSxcblx0KHJlYWRlciwgdGFyZ2V0LCBsZWZ0KSA9PiB7XG5cdFx0Y29uc3QgZGF0YSA9IHJlYWRCeXRlcyhyZWFkZXIsIGxlZnQoKSk7XG5cdFx0dGFyZ2V0LmVuZ2luZURhdGEgPSBmcm9tQnl0ZUFycmF5KGRhdGEpO1xuXHRcdC8vIGNvbnN0IGVuZ2luZURhdGEgPSBwYXJzZUVuZ2luZURhdGEoZGF0YSk7XG5cdFx0Ly8gY29uc29sZS5sb2cocmVxdWlyZSgndXRpbCcpLmluc3BlY3QoZW5naW5lRGF0YSwgZmFsc2UsIDk5LCB0cnVlKSk7XG5cdFx0Ly8gcmVxdWlyZSgnZnMnKS53cml0ZUZpbGVTeW5jKCdyZXNvdXJjZXMvZW5naW5lRGF0YTJTaW1wbGUudHh0JywgcmVxdWlyZSgndXRpbCcpLmluc3BlY3QoZW5naW5lRGF0YSwgZmFsc2UsIDk5LCBmYWxzZSksICd1dGY4Jyk7XG5cdFx0Ly8gcmVxdWlyZSgnZnMnKS53cml0ZUZpbGVTeW5jKCd0ZXN0X2RhdGEuanNvbicsIEpTT04uc3RyaW5naWZ5KGVkLCBudWxsLCAyKSwgJ3V0ZjgnKTtcblx0fSxcblx0KHdyaXRlciwgdGFyZ2V0KSA9PiB7XG5cdFx0Y29uc3QgYnVmZmVyID0gdG9CeXRlQXJyYXkodGFyZ2V0LmVuZ2luZURhdGEhKTtcblx0XHR3cml0ZUJ5dGVzKHdyaXRlciwgYnVmZmVyKTtcblx0fSxcbik7XG5cbmFkZEhhbmRsZXIoXG5cdCdGTXNrJyxcblx0aGFzS2V5KCdmaWx0ZXJNYXNrJyksXG5cdChyZWFkZXIsIHRhcmdldCkgPT4ge1xuXHRcdHRhcmdldC5maWx0ZXJNYXNrID0ge1xuXHRcdFx0Y29sb3JTcGFjZTogcmVhZENvbG9yKHJlYWRlciksXG5cdFx0XHRvcGFjaXR5OiByZWFkVWludDE2KHJlYWRlcikgLyAweGZmLFxuXHRcdH07XG5cdH0sXG5cdCh3cml0ZXIsIHRhcmdldCkgPT4ge1xuXHRcdHdyaXRlQ29sb3Iod3JpdGVyLCB0YXJnZXQuZmlsdGVyTWFzayEuY29sb3JTcGFjZSk7XG5cdFx0d3JpdGVVaW50MTYod3JpdGVyLCBjbGFtcCh0YXJnZXQuZmlsdGVyTWFzayEub3BhY2l0eSA/PyAxLCAwLCAxKSAqIDB4ZmYpO1xuXHR9LFxuKTtcblxuaW50ZXJmYWNlIEFydGREZXNjcmlwdG9yIHtcblx0J0NudCAnOiBudW1iZXI7XG5cdGF1dG9FeHBhbmRPZmZzZXQ6IHsgSHJ6bjogbnVtYmVyOyBWcnRjOiBudW1iZXI7IH07XG5cdG9yaWdpbjogeyBIcnpuOiBudW1iZXI7IFZydGM6IG51bWJlcjsgfTtcblx0YXV0b0V4cGFuZEVuYWJsZWQ6IGJvb2xlYW47XG5cdGF1dG9OZXN0RW5hYmxlZDogYm9vbGVhbjtcblx0YXV0b1Bvc2l0aW9uRW5hYmxlZDogYm9vbGVhbjtcblx0c2hyaW5rd3JhcE9uU2F2ZUVuYWJsZWQ6IGJvb2xlYW47XG5cdGRvY0RlZmF1bHROZXdBcnRib2FyZEJhY2tncm91bmRDb2xvcjogRGVzY3JpcHRvckNvbG9yO1xuXHRkb2NEZWZhdWx0TmV3QXJ0Ym9hcmRCYWNrZ3JvdW5kVHlwZTogbnVtYmVyO1xufVxuXG5hZGRIYW5kbGVyKFxuXHQnYXJ0ZCcsIC8vIGRvY3VtZW50LXdpZGUgYXJ0Ym9hcmQgaW5mb1xuXHR0YXJnZXQgPT4gKHRhcmdldCBhcyBQc2QpLmFydGJvYXJkcyAhPT0gdW5kZWZpbmVkLFxuXHQocmVhZGVyLCB0YXJnZXQsIGxlZnQpID0+IHtcblx0XHRjb25zdCBkZXNjID0gcmVhZFZlcnNpb25BbmREZXNjcmlwdG9yKHJlYWRlcikgYXMgQXJ0ZERlc2NyaXB0b3I7XG5cdFx0KHRhcmdldCBhcyBQc2QpLmFydGJvYXJkcyA9IHtcblx0XHRcdGNvdW50OiBkZXNjWydDbnQgJ10sXG5cdFx0XHRhdXRvRXhwYW5kT2Zmc2V0OiB7IGhvcml6b250YWw6IGRlc2MuYXV0b0V4cGFuZE9mZnNldC5IcnpuLCB2ZXJ0aWNhbDogZGVzYy5hdXRvRXhwYW5kT2Zmc2V0LlZydGMgfSxcblx0XHRcdG9yaWdpbjogeyBob3Jpem9udGFsOiBkZXNjLm9yaWdpbi5IcnpuLCB2ZXJ0aWNhbDogZGVzYy5vcmlnaW4uVnJ0YyB9LFxuXHRcdFx0YXV0b0V4cGFuZEVuYWJsZWQ6IGRlc2MuYXV0b0V4cGFuZEVuYWJsZWQsXG5cdFx0XHRhdXRvTmVzdEVuYWJsZWQ6IGRlc2MuYXV0b05lc3RFbmFibGVkLFxuXHRcdFx0YXV0b1Bvc2l0aW9uRW5hYmxlZDogZGVzYy5hdXRvUG9zaXRpb25FbmFibGVkLFxuXHRcdFx0c2hyaW5rd3JhcE9uU2F2ZUVuYWJsZWQ6IGRlc2Muc2hyaW5rd3JhcE9uU2F2ZUVuYWJsZWQsXG5cdFx0XHRkb2NEZWZhdWx0TmV3QXJ0Ym9hcmRCYWNrZ3JvdW5kQ29sb3I6IHBhcnNlQ29sb3IoZGVzYy5kb2NEZWZhdWx0TmV3QXJ0Ym9hcmRCYWNrZ3JvdW5kQ29sb3IpLFxuXHRcdFx0ZG9jRGVmYXVsdE5ld0FydGJvYXJkQmFja2dyb3VuZFR5cGU6IGRlc2MuZG9jRGVmYXVsdE5ld0FydGJvYXJkQmFja2dyb3VuZFR5cGUsXG5cdFx0fTtcblxuXHRcdHNraXBCeXRlcyhyZWFkZXIsIGxlZnQoKSk7XG5cdH0sXG5cdCh3cml0ZXIsIHRhcmdldCkgPT4ge1xuXHRcdGNvbnN0IGFydGIgPSAodGFyZ2V0IGFzIFBzZCkuYXJ0Ym9hcmRzITtcblx0XHRjb25zdCBkZXNjOiBBcnRkRGVzY3JpcHRvciA9IHtcblx0XHRcdCdDbnQgJzogYXJ0Yi5jb3VudCxcblx0XHRcdGF1dG9FeHBhbmRPZmZzZXQ6IGFydGIuYXV0b0V4cGFuZE9mZnNldCA/IHsgSHJ6bjogYXJ0Yi5hdXRvRXhwYW5kT2Zmc2V0Lmhvcml6b250YWwsIFZydGM6IGFydGIuYXV0b0V4cGFuZE9mZnNldC52ZXJ0aWNhbCB9IDogeyBIcnpuOiAwLCBWcnRjOiAwIH0sXG5cdFx0XHRvcmlnaW46IGFydGIub3JpZ2luID8geyBIcnpuOiBhcnRiLm9yaWdpbi5ob3Jpem9udGFsLCBWcnRjOiBhcnRiLm9yaWdpbi52ZXJ0aWNhbCB9IDogeyBIcnpuOiAwLCBWcnRjOiAwIH0sXG5cdFx0XHRhdXRvRXhwYW5kRW5hYmxlZDogYXJ0Yi5hdXRvRXhwYW5kRW5hYmxlZCA/PyB0cnVlLFxuXHRcdFx0YXV0b05lc3RFbmFibGVkOiBhcnRiLmF1dG9OZXN0RW5hYmxlZCA/PyB0cnVlLFxuXHRcdFx0YXV0b1Bvc2l0aW9uRW5hYmxlZDogYXJ0Yi5hdXRvUG9zaXRpb25FbmFibGVkID8/IHRydWUsXG5cdFx0XHRzaHJpbmt3cmFwT25TYXZlRW5hYmxlZDogYXJ0Yi5zaHJpbmt3cmFwT25TYXZlRW5hYmxlZCA/PyB0cnVlLFxuXHRcdFx0ZG9jRGVmYXVsdE5ld0FydGJvYXJkQmFja2dyb3VuZENvbG9yOiBzZXJpYWxpemVDb2xvcihhcnRiLmRvY0RlZmF1bHROZXdBcnRib2FyZEJhY2tncm91bmRDb2xvciksXG5cdFx0XHRkb2NEZWZhdWx0TmV3QXJ0Ym9hcmRCYWNrZ3JvdW5kVHlwZTogYXJ0Yi5kb2NEZWZhdWx0TmV3QXJ0Ym9hcmRCYWNrZ3JvdW5kVHlwZSA/PyAxLFxuXHRcdH07XG5cdFx0d3JpdGVWZXJzaW9uQW5kRGVzY3JpcHRvcih3cml0ZXIsICcnLCAnbnVsbCcsIGRlc2MsICdhcnRkJyk7XG5cdH0sXG4pO1xuXG5pbnRlcmZhY2UgRWZmZWN0RGVzY3JpcHRvciBleHRlbmRzIFBhcnRpYWw8RGVzY3JpcHRvckdyYWRpZW50Q29udGVudD4sIFBhcnRpYWw8RGVzY3JpcHRvclBhdHRlcm5Db250ZW50PiB7XG5cdGVuYWI/OiBib29sZWFuO1xuXHRTdHlsOiBzdHJpbmc7XG5cdFBudFQ/OiBzdHJpbmc7XG5cdCdNZCAgJz86IHN0cmluZztcblx0T3BjdD86IERlc2NyaXB0b3JVbml0c1ZhbHVlO1xuXHQnU3ogICc/OiBEZXNjcmlwdG9yVW5pdHNWYWx1ZTtcblx0J0NsciAnPzogRGVzY3JpcHRvckNvbG9yO1xuXHRwcmVzZW50PzogYm9vbGVhbjtcblx0c2hvd0luRGlhbG9nPzogYm9vbGVhbjtcblx0b3ZlcnByaW50PzogYm9vbGVhbjtcbn1cblxuaW50ZXJmYWNlIExmeDJEZXNjcmlwdG9yIHtcblx0J1NjbCAnPzogRGVzY3JpcHRvclVuaXRzVmFsdWU7XG5cdG1hc3RlckZYU3dpdGNoPzogYm9vbGVhbjtcblx0RHJTaD86IEVmZmVjdERlc2NyaXB0b3I7XG5cdElyU2g/OiBFZmZlY3REZXNjcmlwdG9yO1xuXHRPckdsPzogRWZmZWN0RGVzY3JpcHRvcjtcblx0SXJHbD86IEVmZmVjdERlc2NyaXB0b3I7XG5cdGViYmw/OiBFZmZlY3REZXNjcmlwdG9yO1xuXHRTb0ZpPzogRWZmZWN0RGVzY3JpcHRvcjtcblx0cGF0dGVybkZpbGw/OiBFZmZlY3REZXNjcmlwdG9yO1xuXHRHckZsPzogRWZmZWN0RGVzY3JpcHRvcjtcblx0Q2hGWD86IEVmZmVjdERlc2NyaXB0b3I7XG5cdEZyRlg/OiBFZmZlY3REZXNjcmlwdG9yO1xufVxuXG5pbnRlcmZhY2UgTG1meERlc2NyaXB0b3Ige1xuXHQnU2NsICc/OiBEZXNjcmlwdG9yVW5pdHNWYWx1ZTtcblx0bWFzdGVyRlhTd2l0Y2g/OiBib29sZWFuO1xuXHRudW1Nb2RpZnlpbmdGWD86IG51bWJlcjtcblx0T3JHbD86IEVmZmVjdERlc2NyaXB0b3I7XG5cdElyR2w/OiBFZmZlY3REZXNjcmlwdG9yO1xuXHRlYmJsPzogRWZmZWN0RGVzY3JpcHRvcjtcblx0Q2hGWD86IEVmZmVjdERlc2NyaXB0b3I7XG5cdGRyb3BTaGFkb3dNdWx0aT86IEVmZmVjdERlc2NyaXB0b3JbXTtcblx0aW5uZXJTaGFkb3dNdWx0aT86IEVmZmVjdERlc2NyaXB0b3JbXTtcblx0c29saWRGaWxsTXVsdGk/OiBFZmZlY3REZXNjcmlwdG9yW107XG5cdGdyYWRpZW50RmlsbE11bHRpPzogRWZmZWN0RGVzY3JpcHRvcltdO1xuXHRmcmFtZUZYTXVsdGk/OiBFZmZlY3REZXNjcmlwdG9yW107XG5cdHBhdHRlcm5GaWxsPzogRWZmZWN0RGVzY3JpcHRvcjsgLy8gPz8/XG59XG5cbmZ1bmN0aW9uIHBhcnNlRnhPYmplY3QoZng6IEVmZmVjdERlc2NyaXB0b3IpIHtcblx0Y29uc3Qgc3Ryb2tlOiBMYXllckVmZmVjdFN0cm9rZSA9IHtcblx0XHRlbmFibGVkOiAhIWZ4LmVuYWIsXG5cdFx0cG9zaXRpb246IEZTdGwuZGVjb2RlKGZ4LlN0eWwpLFxuXHRcdGZpbGxUeXBlOiBGckZsLmRlY29kZShmeC5QbnRUISksXG5cdFx0YmxlbmRNb2RlOiBCbG5NLmRlY29kZShmeFsnTWQgICddISksXG5cdFx0b3BhY2l0eTogcGFyc2VQZXJjZW50KGZ4Lk9wY3QpLFxuXHRcdHNpemU6IHBhcnNlVW5pdHMoZnhbJ1N6ICAnXSEpLFxuXHR9O1xuXG5cdGlmIChmeC5wcmVzZW50ICE9PSB1bmRlZmluZWQpIHN0cm9rZS5wcmVzZW50ID0gZngucHJlc2VudDtcblx0aWYgKGZ4LnNob3dJbkRpYWxvZyAhPT0gdW5kZWZpbmVkKSBzdHJva2Uuc2hvd0luRGlhbG9nID0gZnguc2hvd0luRGlhbG9nO1xuXHRpZiAoZngub3ZlcnByaW50ICE9PSB1bmRlZmluZWQpIHN0cm9rZS5vdmVycHJpbnQgPSBmeC5vdmVycHJpbnQ7XG5cdGlmIChmeFsnQ2xyICddKSBzdHJva2UuY29sb3IgPSBwYXJzZUNvbG9yKGZ4WydDbHIgJ10pO1xuXHRpZiAoZnguR3JhZCkgc3Ryb2tlLmdyYWRpZW50ID0gcGFyc2VHcmFkaWVudENvbnRlbnQoZnggYXMgYW55KTtcblx0aWYgKGZ4LlB0cm4pIHN0cm9rZS5wYXR0ZXJuID0gcGFyc2VQYXR0ZXJuQ29udGVudChmeCBhcyBhbnkpO1xuXG5cdHJldHVybiBzdHJva2U7XG59XG5cbmZ1bmN0aW9uIHNlcmlhbGl6ZUZ4T2JqZWN0KHN0cm9rZTogTGF5ZXJFZmZlY3RTdHJva2UpIHtcblx0bGV0IEZyRlg6IEVmZmVjdERlc2NyaXB0b3IgPSB7fSBhcyBhbnk7XG5cdEZyRlguZW5hYiA9ICEhc3Ryb2tlLmVuYWJsZWQ7XG5cdGlmIChzdHJva2UucHJlc2VudCAhPT0gdW5kZWZpbmVkKSBGckZYLnByZXNlbnQgPSAhIXN0cm9rZS5wcmVzZW50O1xuXHRpZiAoc3Ryb2tlLnNob3dJbkRpYWxvZyAhPT0gdW5kZWZpbmVkKSBGckZYLnNob3dJbkRpYWxvZyA9ICEhc3Ryb2tlLnNob3dJbkRpYWxvZztcblx0RnJGWC5TdHlsID0gRlN0bC5lbmNvZGUoc3Ryb2tlLnBvc2l0aW9uKTtcblx0RnJGWC5QbnRUID0gRnJGbC5lbmNvZGUoc3Ryb2tlLmZpbGxUeXBlKTtcblx0RnJGWFsnTWQgICddID0gQmxuTS5lbmNvZGUoc3Ryb2tlLmJsZW5kTW9kZSk7XG5cdEZyRlguT3BjdCA9IHVuaXRzUGVyY2VudChzdHJva2Uub3BhY2l0eSk7XG5cdEZyRlhbJ1N6ICAnXSA9IHVuaXRzVmFsdWUoc3Ryb2tlLnNpemUsICdzaXplJyk7XG5cdGlmIChzdHJva2UuY29sb3IpIEZyRlhbJ0NsciAnXSA9IHNlcmlhbGl6ZUNvbG9yKHN0cm9rZS5jb2xvcik7XG5cdGlmIChzdHJva2UuZ3JhZGllbnQpIEZyRlggPSB7IC4uLkZyRlgsIC4uLnNlcmlhbGl6ZUdyYWRpZW50Q29udGVudChzdHJva2UuZ3JhZGllbnQpIH07XG5cdGlmIChzdHJva2UucGF0dGVybikgRnJGWCA9IHsgLi4uRnJGWCwgLi4uc2VyaWFsaXplUGF0dGVybkNvbnRlbnQoc3Ryb2tlLnBhdHRlcm4pIH07XG5cdGlmIChzdHJva2Uub3ZlcnByaW50ICE9PSB1bmRlZmluZWQpIEZyRlgub3ZlcnByaW50ID0gISFzdHJva2Uub3ZlcnByaW50O1xuXHRyZXR1cm4gRnJGWDtcbn1cblxuZnVuY3Rpb24gcGFyc2VFZmZlY3RzKGluZm86IExmeDJEZXNjcmlwdG9yICYgTG1meERlc2NyaXB0b3IsIGxvZzogYm9vbGVhbikge1xuXHRjb25zdCBlZmZlY3RzOiBMYXllckVmZmVjdHNJbmZvID0ge307XG5cdGlmICghaW5mby5tYXN0ZXJGWFN3aXRjaCkgZWZmZWN0cy5kaXNhYmxlZCA9IHRydWU7XG5cdGlmIChpbmZvWydTY2wgJ10pIGVmZmVjdHMuc2NhbGUgPSBwYXJzZVBlcmNlbnQoaW5mb1snU2NsICddKTtcblx0aWYgKGluZm8uRHJTaCkgZWZmZWN0cy5kcm9wU2hhZG93ID0gW3BhcnNlRWZmZWN0T2JqZWN0KGluZm8uRHJTaCwgbG9nKV07XG5cdGlmIChpbmZvLmRyb3BTaGFkb3dNdWx0aSkgZWZmZWN0cy5kcm9wU2hhZG93ID0gaW5mby5kcm9wU2hhZG93TXVsdGkubWFwKGkgPT4gcGFyc2VFZmZlY3RPYmplY3QoaSwgbG9nKSk7XG5cdGlmIChpbmZvLklyU2gpIGVmZmVjdHMuaW5uZXJTaGFkb3cgPSBbcGFyc2VFZmZlY3RPYmplY3QoaW5mby5JclNoLCBsb2cpXTtcblx0aWYgKGluZm8uaW5uZXJTaGFkb3dNdWx0aSkgZWZmZWN0cy5pbm5lclNoYWRvdyA9IGluZm8uaW5uZXJTaGFkb3dNdWx0aS5tYXAoaSA9PiBwYXJzZUVmZmVjdE9iamVjdChpLCBsb2cpKTtcblx0aWYgKGluZm8uT3JHbCkgZWZmZWN0cy5vdXRlckdsb3cgPSBwYXJzZUVmZmVjdE9iamVjdChpbmZvLk9yR2wsIGxvZyk7XG5cdGlmIChpbmZvLklyR2wpIGVmZmVjdHMuaW5uZXJHbG93ID0gcGFyc2VFZmZlY3RPYmplY3QoaW5mby5JckdsLCBsb2cpO1xuXHRpZiAoaW5mby5lYmJsKSBlZmZlY3RzLmJldmVsID0gcGFyc2VFZmZlY3RPYmplY3QoaW5mby5lYmJsLCBsb2cpO1xuXHRpZiAoaW5mby5Tb0ZpKSBlZmZlY3RzLnNvbGlkRmlsbCA9IFtwYXJzZUVmZmVjdE9iamVjdChpbmZvLlNvRmksIGxvZyldO1xuXHRpZiAoaW5mby5zb2xpZEZpbGxNdWx0aSkgZWZmZWN0cy5zb2xpZEZpbGwgPSBpbmZvLnNvbGlkRmlsbE11bHRpLm1hcChpID0+IHBhcnNlRWZmZWN0T2JqZWN0KGksIGxvZykpO1xuXHRpZiAoaW5mby5wYXR0ZXJuRmlsbCkgZWZmZWN0cy5wYXR0ZXJuT3ZlcmxheSA9IHBhcnNlRWZmZWN0T2JqZWN0KGluZm8ucGF0dGVybkZpbGwsIGxvZyk7XG5cdGlmIChpbmZvLkdyRmwpIGVmZmVjdHMuZ3JhZGllbnRPdmVybGF5ID0gW3BhcnNlRWZmZWN0T2JqZWN0KGluZm8uR3JGbCwgbG9nKV07XG5cdGlmIChpbmZvLmdyYWRpZW50RmlsbE11bHRpKSBlZmZlY3RzLmdyYWRpZW50T3ZlcmxheSA9IGluZm8uZ3JhZGllbnRGaWxsTXVsdGkubWFwKGkgPT4gcGFyc2VFZmZlY3RPYmplY3QoaSwgbG9nKSk7XG5cdGlmIChpbmZvLkNoRlgpIGVmZmVjdHMuc2F0aW4gPSBwYXJzZUVmZmVjdE9iamVjdChpbmZvLkNoRlgsIGxvZyk7XG5cdGlmIChpbmZvLkZyRlgpIGVmZmVjdHMuc3Ryb2tlID0gW3BhcnNlRnhPYmplY3QoaW5mby5GckZYKV07XG5cdGlmIChpbmZvLmZyYW1lRlhNdWx0aSkgZWZmZWN0cy5zdHJva2UgPSBpbmZvLmZyYW1lRlhNdWx0aS5tYXAoaSA9PiBwYXJzZUZ4T2JqZWN0KGkpKTtcblx0cmV0dXJuIGVmZmVjdHM7XG59XG5cbmZ1bmN0aW9uIHNlcmlhbGl6ZUVmZmVjdHMoZTogTGF5ZXJFZmZlY3RzSW5mbywgbG9nOiBib29sZWFuLCBtdWx0aTogYm9vbGVhbikge1xuXHRjb25zdCBpbmZvOiBMZngyRGVzY3JpcHRvciAmIExtZnhEZXNjcmlwdG9yID0gbXVsdGkgPyB7XG5cdFx0J1NjbCAnOiB1bml0c1BlcmNlbnQoZS5zY2FsZSA/PyAxKSxcblx0XHRtYXN0ZXJGWFN3aXRjaDogIWUuZGlzYWJsZWQsXG5cdH0gOiB7XG5cdFx0bWFzdGVyRlhTd2l0Y2g6ICFlLmRpc2FibGVkLFxuXHRcdCdTY2wgJzogdW5pdHNQZXJjZW50KGUuc2NhbGUgPz8gMSksXG5cdH07XG5cblx0Y29uc3QgYXJyYXlLZXlzOiAoa2V5b2YgTGF5ZXJFZmZlY3RzSW5mbylbXSA9IFsnZHJvcFNoYWRvdycsICdpbm5lclNoYWRvdycsICdzb2xpZEZpbGwnLCAnZ3JhZGllbnRPdmVybGF5JywgJ3N0cm9rZSddO1xuXHRmb3IgKGNvbnN0IGtleSBvZiBhcnJheUtleXMpIHtcblx0XHRpZiAoZVtrZXldICYmICFBcnJheS5pc0FycmF5KGVba2V5XSkpIHRocm93IG5ldyBFcnJvcihgJHtrZXl9IHNob3VsZCBiZSBhbiBhcnJheWApO1xuXHR9XG5cblx0aWYgKGUuZHJvcFNoYWRvdz8uWzBdICYmICFtdWx0aSkgaW5mby5EclNoID0gc2VyaWFsaXplRWZmZWN0T2JqZWN0KGUuZHJvcFNoYWRvd1swXSwgJ2Ryb3BTaGFkb3cnLCBsb2cpO1xuXHRpZiAoZS5kcm9wU2hhZG93Py5bMF0gJiYgbXVsdGkpIGluZm8uZHJvcFNoYWRvd011bHRpID0gZS5kcm9wU2hhZG93Lm1hcChpID0+IHNlcmlhbGl6ZUVmZmVjdE9iamVjdChpLCAnZHJvcFNoYWRvdycsIGxvZykpO1xuXHRpZiAoZS5pbm5lclNoYWRvdz8uWzBdICYmICFtdWx0aSkgaW5mby5JclNoID0gc2VyaWFsaXplRWZmZWN0T2JqZWN0KGUuaW5uZXJTaGFkb3dbMF0sICdpbm5lclNoYWRvdycsIGxvZyk7XG5cdGlmIChlLmlubmVyU2hhZG93Py5bMF0gJiYgbXVsdGkpIGluZm8uaW5uZXJTaGFkb3dNdWx0aSA9IGUuaW5uZXJTaGFkb3cubWFwKGkgPT4gc2VyaWFsaXplRWZmZWN0T2JqZWN0KGksICdpbm5lclNoYWRvdycsIGxvZykpO1xuXHRpZiAoZS5vdXRlckdsb3cpIGluZm8uT3JHbCA9IHNlcmlhbGl6ZUVmZmVjdE9iamVjdChlLm91dGVyR2xvdywgJ291dGVyR2xvdycsIGxvZyk7XG5cdGlmIChlLnNvbGlkRmlsbD8uWzBdICYmIG11bHRpKSBpbmZvLnNvbGlkRmlsbE11bHRpID0gZS5zb2xpZEZpbGwubWFwKGkgPT4gc2VyaWFsaXplRWZmZWN0T2JqZWN0KGksICdzb2xpZEZpbGwnLCBsb2cpKTtcblx0aWYgKGUuZ3JhZGllbnRPdmVybGF5Py5bMF0gJiYgbXVsdGkpIGluZm8uZ3JhZGllbnRGaWxsTXVsdGkgPSBlLmdyYWRpZW50T3ZlcmxheS5tYXAoaSA9PiBzZXJpYWxpemVFZmZlY3RPYmplY3QoaSwgJ2dyYWRpZW50T3ZlcmxheScsIGxvZykpO1xuXHRpZiAoZS5zdHJva2U/LlswXSAmJiBtdWx0aSkgaW5mby5mcmFtZUZYTXVsdGkgPSBlLnN0cm9rZS5tYXAoaSA9PiBzZXJpYWxpemVGeE9iamVjdChpKSk7XG5cdGlmIChlLmlubmVyR2xvdykgaW5mby5JckdsID0gc2VyaWFsaXplRWZmZWN0T2JqZWN0KGUuaW5uZXJHbG93LCAnaW5uZXJHbG93JywgbG9nKTtcblx0aWYgKGUuYmV2ZWwpIGluZm8uZWJibCA9IHNlcmlhbGl6ZUVmZmVjdE9iamVjdChlLmJldmVsLCAnYmV2ZWwnLCBsb2cpO1xuXHRpZiAoZS5zb2xpZEZpbGw/LlswXSAmJiAhbXVsdGkpIGluZm8uU29GaSA9IHNlcmlhbGl6ZUVmZmVjdE9iamVjdChlLnNvbGlkRmlsbFswXSwgJ3NvbGlkRmlsbCcsIGxvZyk7XG5cdGlmIChlLnBhdHRlcm5PdmVybGF5KSBpbmZvLnBhdHRlcm5GaWxsID0gc2VyaWFsaXplRWZmZWN0T2JqZWN0KGUucGF0dGVybk92ZXJsYXksICdwYXR0ZXJuT3ZlcmxheScsIGxvZyk7XG5cdGlmIChlLmdyYWRpZW50T3ZlcmxheT8uWzBdICYmICFtdWx0aSkgaW5mby5HckZsID0gc2VyaWFsaXplRWZmZWN0T2JqZWN0KGUuZ3JhZGllbnRPdmVybGF5WzBdLCAnZ3JhZGllbnRPdmVybGF5JywgbG9nKTtcblx0aWYgKGUuc2F0aW4pIGluZm8uQ2hGWCA9IHNlcmlhbGl6ZUVmZmVjdE9iamVjdChlLnNhdGluLCAnc2F0aW4nLCBsb2cpO1xuXHRpZiAoZS5zdHJva2U/LlswXSAmJiAhbXVsdGkpIGluZm8uRnJGWCA9IHNlcmlhbGl6ZUZ4T2JqZWN0KGUuc3Ryb2tlPy5bMF0pO1xuXG5cdGlmIChtdWx0aSkge1xuXHRcdGluZm8ubnVtTW9kaWZ5aW5nRlggPSAwO1xuXG5cdFx0Zm9yIChjb25zdCBrZXkgb2YgT2JqZWN0LmtleXMoZSkpIHtcblx0XHRcdGNvbnN0IHZhbHVlID0gKGUgYXMgYW55KVtrZXldO1xuXHRcdFx0aWYgKEFycmF5LmlzQXJyYXkodmFsdWUpKSB7XG5cdFx0XHRcdGZvciAoY29uc3QgZWZmZWN0IG9mIHZhbHVlKSB7XG5cdFx0XHRcdFx0aWYgKGVmZmVjdC5lbmFibGVkKSBpbmZvLm51bU1vZGlmeWluZ0ZYKys7XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHR9XG5cdH1cblxuXHRyZXR1cm4gaW5mbztcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGhhc011bHRpRWZmZWN0cyhlZmZlY3RzOiBMYXllckVmZmVjdHNJbmZvKSB7XG5cdHJldHVybiBPYmplY3Qua2V5cyhlZmZlY3RzKS5tYXAoa2V5ID0+IChlZmZlY3RzIGFzIGFueSlba2V5XSkuc29tZSh2ID0+IEFycmF5LmlzQXJyYXkodikgJiYgdi5sZW5ndGggPiAxKTtcbn1cblxuYWRkSGFuZGxlcihcblx0J2xmeDInLFxuXHR0YXJnZXQgPT4gdGFyZ2V0LmVmZmVjdHMgIT09IHVuZGVmaW5lZCAmJiAhaGFzTXVsdGlFZmZlY3RzKHRhcmdldC5lZmZlY3RzKSxcblx0KHJlYWRlciwgdGFyZ2V0LCBsZWZ0LCBfLCBvcHRpb25zKSA9PiB7XG5cdFx0Y29uc3QgdmVyc2lvbiA9IHJlYWRVaW50MzIocmVhZGVyKTtcblx0XHRpZiAodmVyc2lvbiAhPT0gMCkgdGhyb3cgbmV3IEVycm9yKGBJbnZhbGlkIGxmeDIgdmVyc2lvbmApO1xuXG5cdFx0Y29uc3QgZGVzYzogTGZ4MkRlc2NyaXB0b3IgPSByZWFkVmVyc2lvbkFuZERlc2NyaXB0b3IocmVhZGVyKTtcblx0XHQvLyBjb25zb2xlLmxvZyhyZXF1aXJlKCd1dGlsJykuaW5zcGVjdChkZXNjLCBmYWxzZSwgOTksIHRydWUpKTtcblxuXHRcdC8vIFRPRE86IGRvbid0IGRpc2NhcmQgaWYgd2UgZ290IGl0IGZyb20gbG1meFxuXHRcdC8vIGRpc2NhcmQgaWYgcmVhZCBpbiAnbHJGWCcgc2VjdGlvblxuXHRcdHRhcmdldC5lZmZlY3RzID0gcGFyc2VFZmZlY3RzKGRlc2MsICEhb3B0aW9ucy5sb2dNaXNzaW5nRmVhdHVyZXMpO1xuXG5cdFx0c2tpcEJ5dGVzKHJlYWRlciwgbGVmdCgpKTtcblx0fSxcblx0KHdyaXRlciwgdGFyZ2V0LCBfLCBvcHRpb25zKSA9PiB7XG5cdFx0Y29uc3QgZGVzYyA9IHNlcmlhbGl6ZUVmZmVjdHModGFyZ2V0LmVmZmVjdHMhLCAhIW9wdGlvbnMubG9nTWlzc2luZ0ZlYXR1cmVzLCBmYWxzZSk7XG5cdFx0Ly8gY29uc29sZS5sb2cocmVxdWlyZSgndXRpbCcpLmluc3BlY3QoZGVzYywgZmFsc2UsIDk5LCB0cnVlKSk7XG5cblx0XHR3cml0ZVVpbnQzMih3cml0ZXIsIDApOyAvLyB2ZXJzaW9uXG5cdFx0d3JpdGVWZXJzaW9uQW5kRGVzY3JpcHRvcih3cml0ZXIsICcnLCAnbnVsbCcsIGRlc2MpO1xuXHR9LFxuKTtcblxuaW50ZXJmYWNlIENpbmZEZXNjcmlwdG9yIHtcblx0VnJzbjogeyBtYWpvcjogbnVtYmVyOyBtaW5vcjogbnVtYmVyOyBmaXg6IG51bWJlcjsgfTtcblx0cHNWZXJzaW9uPzogeyBtYWpvcjogbnVtYmVyOyBtaW5vcjogbnVtYmVyOyBmaXg6IG51bWJlcjsgfTtcblx0ZGVzY3JpcHRpb246IHN0cmluZztcblx0cmVhc29uOiBzdHJpbmc7XG5cdEVuZ246IHN0cmluZzsgLy8gJ0VuZ24uY29tcENvcmUnO1xuXHRlbmFibGVDb21wQ29yZTogc3RyaW5nOyAvLyAnZW5hYmxlLmZlYXR1cmUnO1xuXHRlbmFibGVDb21wQ29yZUdQVTogc3RyaW5nOyAvLyAnZW5hYmxlLmZlYXR1cmUnO1xuXHRlbmFibGVDb21wQ29yZVRocmVhZHM/OiBzdHJpbmc7IC8vICdlbmFibGUuZmVhdHVyZSc7XG5cdGNvbXBDb3JlU3VwcG9ydDogc3RyaW5nOyAvLyAncmVhc29uLnN1cHBvcnRlZCc7XG5cdGNvbXBDb3JlR1BVU3VwcG9ydDogc3RyaW5nOyAvLyAncmVhc29uLmZlYXR1cmVEaXNhYmxlZCc7XG59XG5cbmFkZEhhbmRsZXIoXG5cdCdjaW5mJyxcblx0aGFzS2V5KCdjb21wb3NpdG9yVXNlZCcpLFxuXHQocmVhZGVyLCB0YXJnZXQsIGxlZnQpID0+IHtcblx0XHRjb25zdCBkZXNjID0gcmVhZFZlcnNpb25BbmREZXNjcmlwdG9yKHJlYWRlcikgYXMgQ2luZkRlc2NyaXB0b3I7XG5cdFx0Ly8gY29uc29sZS5sb2cocmVxdWlyZSgndXRpbCcpLmluc3BlY3QoZGVzYywgZmFsc2UsIDk5LCB0cnVlKSk7XG5cblx0XHR0YXJnZXQuY29tcG9zaXRvclVzZWQgPSB7XG5cdFx0XHRkZXNjcmlwdGlvbjogZGVzYy5kZXNjcmlwdGlvbixcblx0XHRcdHJlYXNvbjogZGVzYy5yZWFzb24sXG5cdFx0XHRlbmdpbmU6IGRlc2MuRW5nbi5zcGxpdCgnLicpWzFdLFxuXHRcdFx0ZW5hYmxlQ29tcENvcmU6IGRlc2MuZW5hYmxlQ29tcENvcmUuc3BsaXQoJy4nKVsxXSxcblx0XHRcdGVuYWJsZUNvbXBDb3JlR1BVOiBkZXNjLmVuYWJsZUNvbXBDb3JlR1BVLnNwbGl0KCcuJylbMV0sXG5cdFx0XHRjb21wQ29yZVN1cHBvcnQ6IGRlc2MuY29tcENvcmVTdXBwb3J0LnNwbGl0KCcuJylbMV0sXG5cdFx0XHRjb21wQ29yZUdQVVN1cHBvcnQ6IGRlc2MuY29tcENvcmVHUFVTdXBwb3J0LnNwbGl0KCcuJylbMV0sXG5cdFx0fTtcblxuXHRcdHNraXBCeXRlcyhyZWFkZXIsIGxlZnQoKSk7XG5cdH0sXG5cdCh3cml0ZXIsIHRhcmdldCkgPT4ge1xuXHRcdGNvbnN0IGNpbmYgPSB0YXJnZXQuY29tcG9zaXRvclVzZWQhO1xuXHRcdGNvbnN0IGRlc2M6IENpbmZEZXNjcmlwdG9yID0ge1xuXHRcdFx0VnJzbjogeyBtYWpvcjogMSwgbWlub3I6IDAsIGZpeDogMCB9LCAvLyBURU1QXG5cdFx0XHQvLyBwc1ZlcnNpb246IHsgbWFqb3I6IDIyLCBtaW5vcjogMywgZml4OiAxIH0sIC8vIFRFU1RJTkdcblx0XHRcdGRlc2NyaXB0aW9uOiBjaW5mLmRlc2NyaXB0aW9uLFxuXHRcdFx0cmVhc29uOiBjaW5mLnJlYXNvbixcblx0XHRcdEVuZ246IGBFbmduLiR7Y2luZi5lbmdpbmV9YCxcblx0XHRcdGVuYWJsZUNvbXBDb3JlOiBgZW5hYmxlLiR7Y2luZi5lbmFibGVDb21wQ29yZX1gLFxuXHRcdFx0ZW5hYmxlQ29tcENvcmVHUFU6IGBlbmFibGUuJHtjaW5mLmVuYWJsZUNvbXBDb3JlR1BVfWAsXG5cdFx0XHQvLyBlbmFibGVDb21wQ29yZVRocmVhZHM6IGBlbmFibGUuZmVhdHVyZWAsIC8vIFRFU1RJTkdcblx0XHRcdGNvbXBDb3JlU3VwcG9ydDogYHJlYXNvbi4ke2NpbmYuY29tcENvcmVTdXBwb3J0fWAsXG5cdFx0XHRjb21wQ29yZUdQVVN1cHBvcnQ6IGByZWFzb24uJHtjaW5mLmNvbXBDb3JlR1BVU3VwcG9ydH1gLFxuXHRcdH07XG5cdFx0d3JpdGVWZXJzaW9uQW5kRGVzY3JpcHRvcih3cml0ZXIsICcnLCAnbnVsbCcsIGRlc2MpO1xuXHR9LFxuKTtcblxuLy8gZXh0ZW5zaW9uIHNldHRpbmdzID8sIGlnbm9yZSBpdFxuYWRkSGFuZGxlcihcblx0J2V4dG4nLFxuXHR0YXJnZXQgPT4gKHRhcmdldCBhcyBhbnkpLl9leHRuICE9PSB1bmRlZmluZWQsXG5cdChyZWFkZXIsIHRhcmdldCkgPT4ge1xuXHRcdGNvbnN0IGRlc2M6IEV4dGVuc2lvbkRlc2MgPSByZWFkVmVyc2lvbkFuZERlc2NyaXB0b3IocmVhZGVyKTtcblx0XHQvLyBjb25zb2xlLmxvZyhyZXF1aXJlKCd1dGlsJykuaW5zcGVjdChkZXNjLCBmYWxzZSwgOTksIHRydWUpKTtcblxuXHRcdGlmIChNT0NLX0hBTkRMRVJTKSAodGFyZ2V0IGFzIGFueSkuX2V4dG4gPSBkZXNjO1xuXHR9LFxuXHQod3JpdGVyLCB0YXJnZXQpID0+IHtcblx0XHQvLyBUT0RPOiBuZWVkIHRvIGFkZCBjb3JyZWN0IHR5cGVzIGZvciBkZXNjIGZpZWxkcyAocmVzb3VyY2VzL3NyYy5wc2QpXG5cdFx0aWYgKE1PQ0tfSEFORExFUlMpIHdyaXRlVmVyc2lvbkFuZERlc2NyaXB0b3Iod3JpdGVyLCAnJywgJ251bGwnLCAodGFyZ2V0IGFzIGFueSkuX2V4dG4pO1xuXHR9LFxuKTtcblxuLy8gZGVzY3JpcHRvciBoZWxwZXJzXG5cbmZ1bmN0aW9uIHBhcnNlR3JhZGllbnQoZ3JhZDogRGVzY2lwdG9yR3JhZGllbnQpOiBFZmZlY3RTb2xpZEdyYWRpZW50IHwgRWZmZWN0Tm9pc2VHcmFkaWVudCB7XG5cdGlmIChncmFkLkdyZEYgPT09ICdHcmRGLkNzdFMnKSB7XG5cdFx0Y29uc3Qgc2FtcGxlczogbnVtYmVyID0gZ3JhZC5JbnRyIHx8IDQwOTY7XG5cblx0XHRyZXR1cm4ge1xuXHRcdFx0dHlwZTogJ3NvbGlkJyxcblx0XHRcdG5hbWU6IGdyYWRbJ05tICAnXSxcblx0XHRcdHNtb290aG5lc3M6IGdyYWQuSW50ciAvIDQwOTYsXG5cdFx0XHRjb2xvclN0b3BzOiBncmFkLkNscnMubWFwKHMgPT4gKHtcblx0XHRcdFx0Y29sb3I6IHBhcnNlQ29sb3Ioc1snQ2xyICddKSxcblx0XHRcdFx0bG9jYXRpb246IHMuTGN0biAvIHNhbXBsZXMsXG5cdFx0XHRcdG1pZHBvaW50OiBzLk1kcG4gLyAxMDAsXG5cdFx0XHR9KSksXG5cdFx0XHRvcGFjaXR5U3RvcHM6IGdyYWQuVHJucy5tYXAocyA9PiAoe1xuXHRcdFx0XHRvcGFjaXR5OiBwYXJzZVBlcmNlbnQocy5PcGN0KSxcblx0XHRcdFx0bG9jYXRpb246IHMuTGN0biAvIHNhbXBsZXMsXG5cdFx0XHRcdG1pZHBvaW50OiBzLk1kcG4gLyAxMDAsXG5cdFx0XHR9KSksXG5cdFx0fTtcblx0fSBlbHNlIHtcblx0XHRyZXR1cm4ge1xuXHRcdFx0dHlwZTogJ25vaXNlJyxcblx0XHRcdG5hbWU6IGdyYWRbJ05tICAnXSxcblx0XHRcdHJvdWdobmVzczogZ3JhZC5TbXRoIC8gNDA5Nixcblx0XHRcdGNvbG9yTW9kZWw6IENsclMuZGVjb2RlKGdyYWQuQ2xyUyksXG5cdFx0XHRyYW5kb21TZWVkOiBncmFkLlJuZFMsXG5cdFx0XHRyZXN0cmljdENvbG9yczogISFncmFkLlZjdEMsXG5cdFx0XHRhZGRUcmFuc3BhcmVuY3k6ICEhZ3JhZC5TaFRyLFxuXHRcdFx0bWluOiBncmFkWydNbm0gJ10ubWFwKHggPT4geCAvIDEwMCksXG5cdFx0XHRtYXg6IGdyYWRbJ014bSAnXS5tYXAoeCA9PiB4IC8gMTAwKSxcblx0XHR9O1xuXHR9XG59XG5cbmZ1bmN0aW9uIHNlcmlhbGl6ZUdyYWRpZW50KGdyYWQ6IEVmZmVjdFNvbGlkR3JhZGllbnQgfCBFZmZlY3ROb2lzZUdyYWRpZW50KTogRGVzY2lwdG9yR3JhZGllbnQge1xuXHRpZiAoZ3JhZC50eXBlID09PSAnc29saWQnKSB7XG5cdFx0Y29uc3Qgc2FtcGxlcyA9IE1hdGgucm91bmQoKGdyYWQuc21vb3RobmVzcyA/PyAxKSAqIDQwOTYpO1xuXHRcdHJldHVybiB7XG5cdFx0XHQnTm0gICc6IGdyYWQubmFtZSB8fCAnJyxcblx0XHRcdEdyZEY6ICdHcmRGLkNzdFMnLFxuXHRcdFx0SW50cjogc2FtcGxlcyxcblx0XHRcdENscnM6IGdyYWQuY29sb3JTdG9wcy5tYXAocyA9PiAoe1xuXHRcdFx0XHQnQ2xyICc6IHNlcmlhbGl6ZUNvbG9yKHMuY29sb3IpLFxuXHRcdFx0XHRUeXBlOiAnQ2xyeS5Vc3JTJyxcblx0XHRcdFx0TGN0bjogTWF0aC5yb3VuZChzLmxvY2F0aW9uICogc2FtcGxlcyksXG5cdFx0XHRcdE1kcG46IE1hdGgucm91bmQoKHMubWlkcG9pbnQgPz8gMC41KSAqIDEwMCksXG5cdFx0XHR9KSksXG5cdFx0XHRUcm5zOiBncmFkLm9wYWNpdHlTdG9wcy5tYXAocyA9PiAoe1xuXHRcdFx0XHRPcGN0OiB1bml0c1BlcmNlbnQocy5vcGFjaXR5KSxcblx0XHRcdFx0TGN0bjogTWF0aC5yb3VuZChzLmxvY2F0aW9uICogc2FtcGxlcyksXG5cdFx0XHRcdE1kcG46IE1hdGgucm91bmQoKHMubWlkcG9pbnQgPz8gMC41KSAqIDEwMCksXG5cdFx0XHR9KSksXG5cdFx0fTtcblx0fSBlbHNlIHtcblx0XHRyZXR1cm4ge1xuXHRcdFx0R3JkRjogJ0dyZEYuQ2xOcycsXG5cdFx0XHQnTm0gICc6IGdyYWQubmFtZSB8fCAnJyxcblx0XHRcdFNoVHI6ICEhZ3JhZC5hZGRUcmFuc3BhcmVuY3ksXG5cdFx0XHRWY3RDOiAhIWdyYWQucmVzdHJpY3RDb2xvcnMsXG5cdFx0XHRDbHJTOiBDbHJTLmVuY29kZShncmFkLmNvbG9yTW9kZWwpLFxuXHRcdFx0Um5kUzogZ3JhZC5yYW5kb21TZWVkIHx8IDAsXG5cdFx0XHRTbXRoOiBNYXRoLnJvdW5kKChncmFkLnJvdWdobmVzcyA/PyAxKSAqIDQwOTYpLFxuXHRcdFx0J01ubSAnOiAoZ3JhZC5taW4gfHwgWzAsIDAsIDAsIDBdKS5tYXAoeCA9PiB4ICogMTAwKSxcblx0XHRcdCdNeG0gJzogKGdyYWQubWF4IHx8IFsxLCAxLCAxLCAxXSkubWFwKHggPT4geCAqIDEwMCksXG5cdFx0fTtcblx0fVxufVxuXG5mdW5jdGlvbiBwYXJzZUdyYWRpZW50Q29udGVudChkZXNjcmlwdG9yOiBEZXNjcmlwdG9yR3JhZGllbnRDb250ZW50KSB7XG5cdGNvbnN0IHJlc3VsdCA9IHBhcnNlR3JhZGllbnQoZGVzY3JpcHRvci5HcmFkKSBhcyAoRWZmZWN0U29saWRHcmFkaWVudCB8IEVmZmVjdE5vaXNlR3JhZGllbnQpICYgRXh0cmFHcmFkaWVudEluZm87XG5cdHJlc3VsdC5zdHlsZSA9IEdyZFQuZGVjb2RlKGRlc2NyaXB0b3IuVHlwZSk7XG5cdGlmIChkZXNjcmlwdG9yLkR0aHIgIT09IHVuZGVmaW5lZCkgcmVzdWx0LmRpdGhlciA9IGRlc2NyaXB0b3IuRHRocjtcblx0aWYgKGRlc2NyaXB0b3IuUnZycyAhPT0gdW5kZWZpbmVkKSByZXN1bHQucmV2ZXJzZSA9IGRlc2NyaXB0b3IuUnZycztcblx0aWYgKGRlc2NyaXB0b3IuQW5nbCAhPT0gdW5kZWZpbmVkKSByZXN1bHQuYW5nbGUgPSBwYXJzZUFuZ2xlKGRlc2NyaXB0b3IuQW5nbCk7XG5cdGlmIChkZXNjcmlwdG9yWydTY2wgJ10gIT09IHVuZGVmaW5lZCkgcmVzdWx0LnNjYWxlID0gcGFyc2VQZXJjZW50KGRlc2NyaXB0b3JbJ1NjbCAnXSk7XG5cdGlmIChkZXNjcmlwdG9yLkFsZ24gIT09IHVuZGVmaW5lZCkgcmVzdWx0LmFsaWduID0gZGVzY3JpcHRvci5BbGduO1xuXHRpZiAoZGVzY3JpcHRvci5PZnN0ICE9PSB1bmRlZmluZWQpIHtcblx0XHRyZXN1bHQub2Zmc2V0ID0ge1xuXHRcdFx0eDogcGFyc2VQZXJjZW50KGRlc2NyaXB0b3IuT2ZzdC5IcnpuKSxcblx0XHRcdHk6IHBhcnNlUGVyY2VudChkZXNjcmlwdG9yLk9mc3QuVnJ0Yylcblx0XHR9O1xuXHR9XG5cdHJldHVybiByZXN1bHQ7XG59XG5cbmZ1bmN0aW9uIHBhcnNlUGF0dGVybkNvbnRlbnQoZGVzY3JpcHRvcjogRGVzY3JpcHRvclBhdHRlcm5Db250ZW50KSB7XG5cdGNvbnN0IHJlc3VsdDogRWZmZWN0UGF0dGVybiAmIEV4dHJhUGF0dGVybkluZm8gPSB7XG5cdFx0bmFtZTogZGVzY3JpcHRvci5QdHJuWydObSAgJ10sXG5cdFx0aWQ6IGRlc2NyaXB0b3IuUHRybi5JZG50LFxuXHR9O1xuXHRpZiAoZGVzY3JpcHRvci5MbmtkICE9PSB1bmRlZmluZWQpIHJlc3VsdC5saW5rZWQgPSBkZXNjcmlwdG9yLkxua2Q7XG5cdGlmIChkZXNjcmlwdG9yLnBoYXNlICE9PSB1bmRlZmluZWQpIHJlc3VsdC5waGFzZSA9IHsgeDogZGVzY3JpcHRvci5waGFzZS5IcnpuLCB5OiBkZXNjcmlwdG9yLnBoYXNlLlZydGMgfTtcblx0cmV0dXJuIHJlc3VsdDtcbn1cblxuZnVuY3Rpb24gcGFyc2VWZWN0b3JDb250ZW50KGRlc2NyaXB0b3I6IERlc2NyaXB0b3JWZWN0b3JDb250ZW50KTogVmVjdG9yQ29udGVudCB7XG5cdGlmICgnR3JhZCcgaW4gZGVzY3JpcHRvcikge1xuXHRcdHJldHVybiBwYXJzZUdyYWRpZW50Q29udGVudChkZXNjcmlwdG9yKTtcblx0fSBlbHNlIGlmICgnUHRybicgaW4gZGVzY3JpcHRvcikge1xuXHRcdHJldHVybiB7IHR5cGU6ICdwYXR0ZXJuJywgLi4ucGFyc2VQYXR0ZXJuQ29udGVudChkZXNjcmlwdG9yKSB9O1xuXHR9IGVsc2UgaWYgKCdDbHIgJyBpbiBkZXNjcmlwdG9yKSB7XG5cdFx0cmV0dXJuIHsgdHlwZTogJ2NvbG9yJywgY29sb3I6IHBhcnNlQ29sb3IoZGVzY3JpcHRvclsnQ2xyICddKSB9O1xuXHR9IGVsc2Uge1xuXHRcdHRocm93IG5ldyBFcnJvcignSW52YWxpZCB2ZWN0b3IgY29udGVudCcpO1xuXHR9XG59XG5cbmZ1bmN0aW9uIHNlcmlhbGl6ZUdyYWRpZW50Q29udGVudChjb250ZW50OiAoRWZmZWN0U29saWRHcmFkaWVudCB8IEVmZmVjdE5vaXNlR3JhZGllbnQpICYgRXh0cmFHcmFkaWVudEluZm8pIHtcblx0Y29uc3QgcmVzdWx0OiBEZXNjcmlwdG9yR3JhZGllbnRDb250ZW50ID0ge30gYXMgYW55O1xuXHRpZiAoY29udGVudC5kaXRoZXIgIT09IHVuZGVmaW5lZCkgcmVzdWx0LkR0aHIgPSBjb250ZW50LmRpdGhlcjtcblx0aWYgKGNvbnRlbnQucmV2ZXJzZSAhPT0gdW5kZWZpbmVkKSByZXN1bHQuUnZycyA9IGNvbnRlbnQucmV2ZXJzZTtcblx0aWYgKGNvbnRlbnQuYW5nbGUgIT09IHVuZGVmaW5lZCkgcmVzdWx0LkFuZ2wgPSB1bml0c0FuZ2xlKGNvbnRlbnQuYW5nbGUpO1xuXHRyZXN1bHQuVHlwZSA9IEdyZFQuZW5jb2RlKGNvbnRlbnQuc3R5bGUpO1xuXHRpZiAoY29udGVudC5hbGlnbiAhPT0gdW5kZWZpbmVkKSByZXN1bHQuQWxnbiA9IGNvbnRlbnQuYWxpZ247XG5cdGlmIChjb250ZW50LnNjYWxlICE9PSB1bmRlZmluZWQpIHJlc3VsdFsnU2NsICddID0gdW5pdHNQZXJjZW50KGNvbnRlbnQuc2NhbGUpO1xuXHRpZiAoY29udGVudC5vZmZzZXQpIHtcblx0XHRyZXN1bHQuT2ZzdCA9IHtcblx0XHRcdEhyem46IHVuaXRzUGVyY2VudChjb250ZW50Lm9mZnNldC54KSxcblx0XHRcdFZydGM6IHVuaXRzUGVyY2VudChjb250ZW50Lm9mZnNldC55KSxcblx0XHR9O1xuXHR9XG5cdHJlc3VsdC5HcmFkID0gc2VyaWFsaXplR3JhZGllbnQoY29udGVudCk7XG5cdHJldHVybiByZXN1bHQ7XG59XG5cbmZ1bmN0aW9uIHNlcmlhbGl6ZVBhdHRlcm5Db250ZW50KGNvbnRlbnQ6IEVmZmVjdFBhdHRlcm4gJiBFeHRyYVBhdHRlcm5JbmZvKSB7XG5cdGNvbnN0IHJlc3VsdDogRGVzY3JpcHRvclBhdHRlcm5Db250ZW50ID0ge1xuXHRcdFB0cm46IHtcblx0XHRcdCdObSAgJzogY29udGVudC5uYW1lIHx8ICcnLFxuXHRcdFx0SWRudDogY29udGVudC5pZCB8fCAnJyxcblx0XHR9XG5cdH07XG5cdGlmIChjb250ZW50LmxpbmtlZCAhPT0gdW5kZWZpbmVkKSByZXN1bHQuTG5rZCA9ICEhY29udGVudC5saW5rZWQ7XG5cdGlmIChjb250ZW50LnBoYXNlICE9PSB1bmRlZmluZWQpIHJlc3VsdC5waGFzZSA9IHsgSHJ6bjogY29udGVudC5waGFzZS54LCBWcnRjOiBjb250ZW50LnBoYXNlLnkgfTtcblx0cmV0dXJuIHJlc3VsdDtcbn1cblxuZnVuY3Rpb24gc2VyaWFsaXplVmVjdG9yQ29udGVudChjb250ZW50OiBWZWN0b3JDb250ZW50KTogeyBkZXNjcmlwdG9yOiBEZXNjcmlwdG9yVmVjdG9yQ29udGVudDsga2V5OiBzdHJpbmc7IH0ge1xuXHRpZiAoY29udGVudC50eXBlID09PSAnY29sb3InKSB7XG5cdFx0cmV0dXJuIHsga2V5OiAnU29DbycsIGRlc2NyaXB0b3I6IHsgJ0NsciAnOiBzZXJpYWxpemVDb2xvcihjb250ZW50LmNvbG9yKSB9IH07XG5cdH0gZWxzZSBpZiAoY29udGVudC50eXBlID09PSAncGF0dGVybicpIHtcblx0XHRyZXR1cm4geyBrZXk6ICdQdEZsJywgZGVzY3JpcHRvcjogc2VyaWFsaXplUGF0dGVybkNvbnRlbnQoY29udGVudCkgfTtcblx0fSBlbHNlIHtcblx0XHRyZXR1cm4geyBrZXk6ICdHZEZsJywgZGVzY3JpcHRvcjogc2VyaWFsaXplR3JhZGllbnRDb250ZW50KGNvbnRlbnQpIH07XG5cdH1cbn1cblxuZnVuY3Rpb24gcGFyc2VDb2xvcihjb2xvcjogRGVzY3JpcHRvckNvbG9yKTogQ29sb3Ige1xuXHRpZiAoJ0ggICAnIGluIGNvbG9yKSB7XG5cdFx0cmV0dXJuIHsgaDogcGFyc2VQZXJjZW50T3JBbmdsZShjb2xvclsnSCAgICddKSwgczogY29sb3IuU3RydCwgYjogY29sb3IuQnJnaCB9O1xuXHR9IGVsc2UgaWYgKCdSZCAgJyBpbiBjb2xvcikge1xuXHRcdHJldHVybiB7IHI6IGNvbG9yWydSZCAgJ10sIGc6IGNvbG9yWydHcm4gJ10sIGI6IGNvbG9yWydCbCAgJ10gfTtcblx0fSBlbHNlIGlmICgnQ3luICcgaW4gY29sb3IpIHtcblx0XHRyZXR1cm4geyBjOiBjb2xvclsnQ3luICddLCBtOiBjb2xvci5NZ250LCB5OiBjb2xvclsnWWx3ICddLCBrOiBjb2xvci5CbGNrIH07XG5cdH0gZWxzZSBpZiAoJ0dyeSAnIGluIGNvbG9yKSB7XG5cdFx0cmV0dXJuIHsgazogY29sb3JbJ0dyeSAnXSB9O1xuXHR9IGVsc2UgaWYgKCdMbW5jJyBpbiBjb2xvcikge1xuXHRcdHJldHVybiB7IGw6IGNvbG9yLkxtbmMsIGE6IGNvbG9yWydBICAgJ10sIGI6IGNvbG9yWydCICAgJ10gfTtcblx0fSBlbHNlIHtcblx0XHR0aHJvdyBuZXcgRXJyb3IoJ1Vuc3VwcG9ydGVkIGNvbG9yIGRlc2NyaXB0b3InKTtcblx0fVxufVxuXG5mdW5jdGlvbiBzZXJpYWxpemVDb2xvcihjb2xvcjogQ29sb3IgfCB1bmRlZmluZWQpOiBEZXNjcmlwdG9yQ29sb3Ige1xuXHRpZiAoIWNvbG9yKSB7XG5cdFx0cmV0dXJuIHsgJ1JkICAnOiAwLCAnR3JuICc6IDAsICdCbCAgJzogMCB9O1xuXHR9IGVsc2UgaWYgKCdyJyBpbiBjb2xvcikge1xuXHRcdHJldHVybiB7ICdSZCAgJzogY29sb3IuciB8fCAwLCAnR3JuICc6IGNvbG9yLmcgfHwgMCwgJ0JsICAnOiBjb2xvci5iIHx8IDAgfTtcblx0fSBlbHNlIGlmICgnaCcgaW4gY29sb3IpIHtcblx0XHRyZXR1cm4geyAnSCAgICc6IHVuaXRzQW5nbGUoY29sb3IuaCAqIDM2MCksIFN0cnQ6IGNvbG9yLnMgfHwgMCwgQnJnaDogY29sb3IuYiB8fCAwIH07XG5cdH0gZWxzZSBpZiAoJ2MnIGluIGNvbG9yKSB7XG5cdFx0cmV0dXJuIHsgJ0N5biAnOiBjb2xvci5jIHx8IDAsIE1nbnQ6IGNvbG9yLm0gfHwgMCwgJ1lsdyAnOiBjb2xvci55IHx8IDAsIEJsY2s6IGNvbG9yLmsgfHwgMCB9O1xuXHR9IGVsc2UgaWYgKCdsJyBpbiBjb2xvcikge1xuXHRcdHJldHVybiB7IExtbmM6IGNvbG9yLmwgfHwgMCwgJ0EgICAnOiBjb2xvci5hIHx8IDAsICdCICAgJzogY29sb3IuYiB8fCAwIH07XG5cdH0gZWxzZSBpZiAoJ2snIGluIGNvbG9yKSB7XG5cdFx0cmV0dXJuIHsgJ0dyeSAnOiBjb2xvci5rIH07XG5cdH0gZWxzZSB7XG5cdFx0dGhyb3cgbmV3IEVycm9yKCdJbnZhbGlkIGNvbG9yIHZhbHVlJyk7XG5cdH1cbn1cblxudHlwZSBBbGxFZmZlY3RzID0gTGF5ZXJFZmZlY3RTaGFkb3cgJiBMYXllckVmZmVjdHNPdXRlckdsb3cgJiBMYXllckVmZmVjdFN0cm9rZSAmXG5cdExheWVyRWZmZWN0SW5uZXJHbG93ICYgTGF5ZXJFZmZlY3RCZXZlbCAmIExheWVyRWZmZWN0U29saWRGaWxsICZcblx0TGF5ZXJFZmZlY3RQYXR0ZXJuT3ZlcmxheSAmIExheWVyRWZmZWN0U2F0aW4gJiBMYXllckVmZmVjdEdyYWRpZW50T3ZlcmxheTtcblxuZnVuY3Rpb24gcGFyc2VFZmZlY3RPYmplY3Qob2JqOiBhbnksIHJlcG9ydEVycm9yczogYm9vbGVhbikge1xuXHRjb25zdCByZXN1bHQ6IEFsbEVmZmVjdHMgPSB7fSBhcyBhbnk7XG5cblx0Zm9yIChjb25zdCBrZXkgb2YgT2JqZWN0LmtleXMob2JqKSkge1xuXHRcdGNvbnN0IHZhbCA9IG9ialtrZXldO1xuXG5cdFx0c3dpdGNoIChrZXkpIHtcblx0XHRcdGNhc2UgJ2VuYWInOiByZXN1bHQuZW5hYmxlZCA9ICEhdmFsOyBicmVhaztcblx0XHRcdGNhc2UgJ3VnbGcnOiByZXN1bHQudXNlR2xvYmFsTGlnaHQgPSAhIXZhbDsgYnJlYWs7XG5cdFx0XHRjYXNlICdBbnRBJzogcmVzdWx0LmFudGlhbGlhc2VkID0gISF2YWw7IGJyZWFrO1xuXHRcdFx0Y2FzZSAnQWxnbic6IHJlc3VsdC5hbGlnbiA9ICEhdmFsOyBicmVhaztcblx0XHRcdGNhc2UgJ0R0aHInOiByZXN1bHQuZGl0aGVyID0gISF2YWw7IGJyZWFrO1xuXHRcdFx0Y2FzZSAnSW52cic6IHJlc3VsdC5pbnZlcnQgPSAhIXZhbDsgYnJlYWs7XG5cdFx0XHRjYXNlICdSdnJzJzogcmVzdWx0LnJldmVyc2UgPSAhIXZhbDsgYnJlYWs7XG5cdFx0XHRjYXNlICdDbHIgJzogcmVzdWx0LmNvbG9yID0gcGFyc2VDb2xvcih2YWwpOyBicmVhaztcblx0XHRcdGNhc2UgJ2hnbEMnOiByZXN1bHQuaGlnaGxpZ2h0Q29sb3IgPSBwYXJzZUNvbG9yKHZhbCk7IGJyZWFrO1xuXHRcdFx0Y2FzZSAnc2R3Qyc6IHJlc3VsdC5zaGFkb3dDb2xvciA9IHBhcnNlQ29sb3IodmFsKTsgYnJlYWs7XG5cdFx0XHRjYXNlICdTdHlsJzogcmVzdWx0LnBvc2l0aW9uID0gRlN0bC5kZWNvZGUodmFsKTsgYnJlYWs7XG5cdFx0XHRjYXNlICdNZCAgJzogcmVzdWx0LmJsZW5kTW9kZSA9IEJsbk0uZGVjb2RlKHZhbCk7IGJyZWFrO1xuXHRcdFx0Y2FzZSAnaGdsTSc6IHJlc3VsdC5oaWdobGlnaHRCbGVuZE1vZGUgPSBCbG5NLmRlY29kZSh2YWwpOyBicmVhaztcblx0XHRcdGNhc2UgJ3Nkd00nOiByZXN1bHQuc2hhZG93QmxlbmRNb2RlID0gQmxuTS5kZWNvZGUodmFsKTsgYnJlYWs7XG5cdFx0XHRjYXNlICdidmxTJzogcmVzdWx0LnN0eWxlID0gQkVTbC5kZWNvZGUodmFsKTsgYnJlYWs7XG5cdFx0XHRjYXNlICdidmxEJzogcmVzdWx0LmRpcmVjdGlvbiA9IEJFU3MuZGVjb2RlKHZhbCk7IGJyZWFrO1xuXHRcdFx0Y2FzZSAnYnZsVCc6IHJlc3VsdC50ZWNobmlxdWUgPSBidmxULmRlY29kZSh2YWwpIGFzIGFueTsgYnJlYWs7XG5cdFx0XHRjYXNlICdHbHdUJzogcmVzdWx0LnRlY2huaXF1ZSA9IEJFVEUuZGVjb2RlKHZhbCkgYXMgYW55OyBicmVhaztcblx0XHRcdGNhc2UgJ2dsd1MnOiByZXN1bHQuc291cmNlID0gSUdTci5kZWNvZGUodmFsKTsgYnJlYWs7XG5cdFx0XHRjYXNlICdUeXBlJzogcmVzdWx0LnR5cGUgPSBHcmRULmRlY29kZSh2YWwpOyBicmVhaztcblx0XHRcdGNhc2UgJ09wY3QnOiByZXN1bHQub3BhY2l0eSA9IHBhcnNlUGVyY2VudCh2YWwpOyBicmVhaztcblx0XHRcdGNhc2UgJ2hnbE8nOiByZXN1bHQuaGlnaGxpZ2h0T3BhY2l0eSA9IHBhcnNlUGVyY2VudCh2YWwpOyBicmVhaztcblx0XHRcdGNhc2UgJ3Nkd08nOiByZXN1bHQuc2hhZG93T3BhY2l0eSA9IHBhcnNlUGVyY2VudCh2YWwpOyBicmVhaztcblx0XHRcdGNhc2UgJ2xhZ2wnOiByZXN1bHQuYW5nbGUgPSBwYXJzZUFuZ2xlKHZhbCk7IGJyZWFrO1xuXHRcdFx0Y2FzZSAnQW5nbCc6IHJlc3VsdC5hbmdsZSA9IHBhcnNlQW5nbGUodmFsKTsgYnJlYWs7XG5cdFx0XHRjYXNlICdMYWxkJzogcmVzdWx0LmFsdGl0dWRlID0gcGFyc2VBbmdsZSh2YWwpOyBicmVhaztcblx0XHRcdGNhc2UgJ1NmdG4nOiByZXN1bHQuc29mdGVuID0gcGFyc2VVbml0cyh2YWwpOyBicmVhaztcblx0XHRcdGNhc2UgJ3NyZ1InOiByZXN1bHQuc3RyZW5ndGggPSBwYXJzZVBlcmNlbnQodmFsKTsgYnJlYWs7XG5cdFx0XHRjYXNlICdibHVyJzogcmVzdWx0LnNpemUgPSBwYXJzZVVuaXRzKHZhbCk7IGJyZWFrO1xuXHRcdFx0Y2FzZSAnTm9zZSc6IHJlc3VsdC5ub2lzZSA9IHBhcnNlUGVyY2VudCh2YWwpOyBicmVhaztcblx0XHRcdGNhc2UgJ0lucHInOiByZXN1bHQucmFuZ2UgPSBwYXJzZVBlcmNlbnQodmFsKTsgYnJlYWs7XG5cdFx0XHRjYXNlICdDa210JzogcmVzdWx0LmNob2tlID0gcGFyc2VVbml0cyh2YWwpOyBicmVhaztcblx0XHRcdGNhc2UgJ1NoZE4nOiByZXN1bHQuaml0dGVyID0gcGFyc2VQZXJjZW50KHZhbCk7IGJyZWFrO1xuXHRcdFx0Y2FzZSAnRHN0bic6IHJlc3VsdC5kaXN0YW5jZSA9IHBhcnNlVW5pdHModmFsKTsgYnJlYWs7XG5cdFx0XHRjYXNlICdTY2wgJzogcmVzdWx0LnNjYWxlID0gcGFyc2VQZXJjZW50KHZhbCk7IGJyZWFrO1xuXHRcdFx0Y2FzZSAnUHRybic6IHJlc3VsdC5wYXR0ZXJuID0geyBuYW1lOiB2YWxbJ05tICAnXSwgaWQ6IHZhbC5JZG50IH07IGJyZWFrO1xuXHRcdFx0Y2FzZSAncGhhc2UnOiByZXN1bHQucGhhc2UgPSB7IHg6IHZhbC5IcnpuLCB5OiB2YWwuVnJ0YyB9OyBicmVhaztcblx0XHRcdGNhc2UgJ09mc3QnOiByZXN1bHQub2Zmc2V0ID0geyB4OiBwYXJzZVBlcmNlbnQodmFsLkhyem4pLCB5OiBwYXJzZVBlcmNlbnQodmFsLlZydGMpIH07IGJyZWFrO1xuXHRcdFx0Y2FzZSAnTXBnUyc6XG5cdFx0XHRjYXNlICdUcm5TJzpcblx0XHRcdFx0cmVzdWx0LmNvbnRvdXIgPSB7XG5cdFx0XHRcdFx0bmFtZTogdmFsWydObSAgJ10sXG5cdFx0XHRcdFx0Y3VydmU6ICh2YWxbJ0NydiAnXSBhcyBhbnlbXSkubWFwKHAgPT4gKHsgeDogcC5IcnpuLCB5OiBwLlZydGMgfSkpLFxuXHRcdFx0XHR9O1xuXHRcdFx0XHRicmVhaztcblx0XHRcdGNhc2UgJ0dyYWQnOiByZXN1bHQuZ3JhZGllbnQgPSBwYXJzZUdyYWRpZW50KHZhbCk7IGJyZWFrO1xuXHRcdFx0Y2FzZSAndXNlVGV4dHVyZSc6XG5cdFx0XHRjYXNlICd1c2VTaGFwZSc6XG5cdFx0XHRjYXNlICdsYXllckNvbmNlYWxzJzpcblx0XHRcdGNhc2UgJ3ByZXNlbnQnOlxuXHRcdFx0Y2FzZSAnc2hvd0luRGlhbG9nJzpcblx0XHRcdGNhc2UgJ2FudGlhbGlhc0dsb3NzJzogcmVzdWx0W2tleV0gPSB2YWw7IGJyZWFrO1xuXHRcdFx0ZGVmYXVsdDpcblx0XHRcdFx0cmVwb3J0RXJyb3JzICYmIGNvbnNvbGUubG9nKGBJbnZhbGlkIGVmZmVjdCBrZXk6ICcke2tleX0nOmAsIHZhbCk7XG5cdFx0fVxuXHR9XG5cblx0cmV0dXJuIHJlc3VsdDtcbn1cblxuZnVuY3Rpb24gc2VyaWFsaXplRWZmZWN0T2JqZWN0KG9iajogYW55LCBvYmpOYW1lOiBzdHJpbmcsIHJlcG9ydEVycm9yczogYm9vbGVhbikge1xuXHRjb25zdCByZXN1bHQ6IGFueSA9IHt9O1xuXG5cdGZvciAoY29uc3Qgb2JqS2V5IG9mIE9iamVjdC5rZXlzKG9iaikpIHtcblx0XHRjb25zdCBrZXk6IGtleW9mIEFsbEVmZmVjdHMgPSBvYmpLZXkgYXMgYW55O1xuXHRcdGNvbnN0IHZhbCA9IG9ialtrZXldO1xuXG5cdFx0c3dpdGNoIChrZXkpIHtcblx0XHRcdGNhc2UgJ2VuYWJsZWQnOiByZXN1bHQuZW5hYiA9ICEhdmFsOyBicmVhaztcblx0XHRcdGNhc2UgJ3VzZUdsb2JhbExpZ2h0JzogcmVzdWx0LnVnbGcgPSAhIXZhbDsgYnJlYWs7XG5cdFx0XHRjYXNlICdhbnRpYWxpYXNlZCc6IHJlc3VsdC5BbnRBID0gISF2YWw7IGJyZWFrO1xuXHRcdFx0Y2FzZSAnYWxpZ24nOiByZXN1bHQuQWxnbiA9ICEhdmFsOyBicmVhaztcblx0XHRcdGNhc2UgJ2RpdGhlcic6IHJlc3VsdC5EdGhyID0gISF2YWw7IGJyZWFrO1xuXHRcdFx0Y2FzZSAnaW52ZXJ0JzogcmVzdWx0LkludnIgPSAhIXZhbDsgYnJlYWs7XG5cdFx0XHRjYXNlICdyZXZlcnNlJzogcmVzdWx0LlJ2cnMgPSAhIXZhbDsgYnJlYWs7XG5cdFx0XHRjYXNlICdjb2xvcic6IHJlc3VsdFsnQ2xyICddID0gc2VyaWFsaXplQ29sb3IodmFsKTsgYnJlYWs7XG5cdFx0XHRjYXNlICdoaWdobGlnaHRDb2xvcic6IHJlc3VsdC5oZ2xDID0gc2VyaWFsaXplQ29sb3IodmFsKTsgYnJlYWs7XG5cdFx0XHRjYXNlICdzaGFkb3dDb2xvcic6IHJlc3VsdC5zZHdDID0gc2VyaWFsaXplQ29sb3IodmFsKTsgYnJlYWs7XG5cdFx0XHRjYXNlICdwb3NpdGlvbic6IHJlc3VsdC5TdHlsID0gRlN0bC5lbmNvZGUodmFsKTsgYnJlYWs7XG5cdFx0XHRjYXNlICdibGVuZE1vZGUnOiByZXN1bHRbJ01kICAnXSA9IEJsbk0uZW5jb2RlKHZhbCk7IGJyZWFrO1xuXHRcdFx0Y2FzZSAnaGlnaGxpZ2h0QmxlbmRNb2RlJzogcmVzdWx0LmhnbE0gPSBCbG5NLmVuY29kZSh2YWwpOyBicmVhaztcblx0XHRcdGNhc2UgJ3NoYWRvd0JsZW5kTW9kZSc6IHJlc3VsdC5zZHdNID0gQmxuTS5lbmNvZGUodmFsKTsgYnJlYWs7XG5cdFx0XHRjYXNlICdzdHlsZSc6IHJlc3VsdC5idmxTID0gQkVTbC5lbmNvZGUodmFsKTsgYnJlYWs7XG5cdFx0XHRjYXNlICdkaXJlY3Rpb24nOiByZXN1bHQuYnZsRCA9IEJFU3MuZW5jb2RlKHZhbCk7IGJyZWFrO1xuXHRcdFx0Y2FzZSAndGVjaG5pcXVlJzpcblx0XHRcdFx0aWYgKG9iak5hbWUgPT09ICdiZXZlbCcpIHtcblx0XHRcdFx0XHRyZXN1bHQuYnZsVCA9IGJ2bFQuZW5jb2RlKHZhbCk7XG5cdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0cmVzdWx0Lkdsd1QgPSBCRVRFLmVuY29kZSh2YWwpO1xuXHRcdFx0XHR9XG5cdFx0XHRcdGJyZWFrO1xuXHRcdFx0Y2FzZSAnc291cmNlJzogcmVzdWx0Lmdsd1MgPSBJR1NyLmVuY29kZSh2YWwpOyBicmVhaztcblx0XHRcdGNhc2UgJ3R5cGUnOiByZXN1bHQuVHlwZSA9IEdyZFQuZW5jb2RlKHZhbCk7IGJyZWFrO1xuXHRcdFx0Y2FzZSAnb3BhY2l0eSc6IHJlc3VsdC5PcGN0ID0gdW5pdHNQZXJjZW50KHZhbCk7IGJyZWFrO1xuXHRcdFx0Y2FzZSAnaGlnaGxpZ2h0T3BhY2l0eSc6IHJlc3VsdC5oZ2xPID0gdW5pdHNQZXJjZW50KHZhbCk7IGJyZWFrO1xuXHRcdFx0Y2FzZSAnc2hhZG93T3BhY2l0eSc6IHJlc3VsdC5zZHdPID0gdW5pdHNQZXJjZW50KHZhbCk7IGJyZWFrO1xuXHRcdFx0Y2FzZSAnYW5nbGUnOlxuXHRcdFx0XHRpZiAob2JqTmFtZSA9PT0gJ2dyYWRpZW50T3ZlcmxheScpIHtcblx0XHRcdFx0XHRyZXN1bHQuQW5nbCA9IHVuaXRzQW5nbGUodmFsKTtcblx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHRyZXN1bHQubGFnbCA9IHVuaXRzQW5nbGUodmFsKTtcblx0XHRcdFx0fVxuXHRcdFx0XHRicmVhaztcblx0XHRcdGNhc2UgJ2FsdGl0dWRlJzogcmVzdWx0LkxhbGQgPSB1bml0c0FuZ2xlKHZhbCk7IGJyZWFrO1xuXHRcdFx0Y2FzZSAnc29mdGVuJzogcmVzdWx0LlNmdG4gPSB1bml0c1ZhbHVlKHZhbCwga2V5KTsgYnJlYWs7XG5cdFx0XHRjYXNlICdzdHJlbmd0aCc6IHJlc3VsdC5zcmdSID0gdW5pdHNQZXJjZW50KHZhbCk7IGJyZWFrO1xuXHRcdFx0Y2FzZSAnc2l6ZSc6IHJlc3VsdC5ibHVyID0gdW5pdHNWYWx1ZSh2YWwsIGtleSk7IGJyZWFrO1xuXHRcdFx0Y2FzZSAnbm9pc2UnOiByZXN1bHQuTm9zZSA9IHVuaXRzUGVyY2VudCh2YWwpOyBicmVhaztcblx0XHRcdGNhc2UgJ3JhbmdlJzogcmVzdWx0LklucHIgPSB1bml0c1BlcmNlbnQodmFsKTsgYnJlYWs7XG5cdFx0XHRjYXNlICdjaG9rZSc6IHJlc3VsdC5Da210ID0gdW5pdHNWYWx1ZSh2YWwsIGtleSk7IGJyZWFrO1xuXHRcdFx0Y2FzZSAnaml0dGVyJzogcmVzdWx0LlNoZE4gPSB1bml0c1BlcmNlbnQodmFsKTsgYnJlYWs7XG5cdFx0XHRjYXNlICdkaXN0YW5jZSc6IHJlc3VsdC5Ec3RuID0gdW5pdHNWYWx1ZSh2YWwsIGtleSk7IGJyZWFrO1xuXHRcdFx0Y2FzZSAnc2NhbGUnOiByZXN1bHRbJ1NjbCAnXSA9IHVuaXRzUGVyY2VudCh2YWwpOyBicmVhaztcblx0XHRcdGNhc2UgJ3BhdHRlcm4nOiByZXN1bHQuUHRybiA9IHsgJ05tICAnOiB2YWwubmFtZSwgSWRudDogdmFsLmlkIH07IGJyZWFrO1xuXHRcdFx0Y2FzZSAncGhhc2UnOiByZXN1bHQucGhhc2UgPSB7IEhyem46IHZhbC54LCBWcnRjOiB2YWwueSB9OyBicmVhaztcblx0XHRcdGNhc2UgJ29mZnNldCc6IHJlc3VsdC5PZnN0ID0geyBIcnpuOiB1bml0c1BlcmNlbnQodmFsLngpLCBWcnRjOiB1bml0c1BlcmNlbnQodmFsLnkpIH07IGJyZWFrO1xuXHRcdFx0Y2FzZSAnY29udG91cic6IHtcblx0XHRcdFx0cmVzdWx0W29iak5hbWUgPT09ICdzYXRpbicgPyAnTXBnUycgOiAnVHJuUyddID0ge1xuXHRcdFx0XHRcdCdObSAgJzogKHZhbCBhcyBFZmZlY3RDb250b3VyKS5uYW1lLFxuXHRcdFx0XHRcdCdDcnYgJzogKHZhbCBhcyBFZmZlY3RDb250b3VyKS5jdXJ2ZS5tYXAocCA9PiAoeyBIcnpuOiBwLngsIFZydGM6IHAueSB9KSksXG5cdFx0XHRcdH07XG5cdFx0XHRcdGJyZWFrO1xuXHRcdFx0fVxuXHRcdFx0Y2FzZSAnZ3JhZGllbnQnOiByZXN1bHQuR3JhZCA9IHNlcmlhbGl6ZUdyYWRpZW50KHZhbCk7IGJyZWFrO1xuXHRcdFx0Y2FzZSAndXNlVGV4dHVyZSc6XG5cdFx0XHRjYXNlICd1c2VTaGFwZSc6XG5cdFx0XHRjYXNlICdsYXllckNvbmNlYWxzJzpcblx0XHRcdGNhc2UgJ3ByZXNlbnQnOlxuXHRcdFx0Y2FzZSAnc2hvd0luRGlhbG9nJzpcblx0XHRcdGNhc2UgJ2FudGlhbGlhc0dsb3NzJzpcblx0XHRcdFx0cmVzdWx0W2tleV0gPSB2YWw7XG5cdFx0XHRcdGJyZWFrO1xuXHRcdFx0ZGVmYXVsdDpcblx0XHRcdFx0cmVwb3J0RXJyb3JzICYmIGNvbnNvbGUubG9nKGBJbnZhbGlkIGVmZmVjdCBrZXk6ICcke2tleX0nIHZhbHVlOmAsIHZhbCk7XG5cdFx0fVxuXHR9XG5cblx0cmV0dXJuIHJlc3VsdDtcbn1cbiJdLCJzb3VyY2VSb290IjoiL2hvbWUvbWFuaC9rYW9waXovZWVsL2FnLXBzZC9zcmMifQ==
