"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.readAbr = void 0;
var descriptor_1 = require("./descriptor");
var psdReader_1 = require("./psdReader");
var dynamicsControl = ['off', 'fade', 'pen pressure', 'pen tilt', 'stylus sheel', 'initial direction', 'direction', 'initial rotation', 'rotation'];
function parseDynamics(desc) {
    return {
        control: dynamicsControl[desc.bVTy],
        steps: desc.fStp,
        jitter: descriptor_1.parsePercent(desc.jitter),
        minimum: descriptor_1.parsePercent(desc['Mnm ']),
    };
}
function parseBrushShape(desc) {
    var shape = {
        size: descriptor_1.parseUnitsToNumber(desc.Dmtr, 'Pixels'),
        angle: descriptor_1.parseAngle(desc.Angl),
        roundness: descriptor_1.parsePercent(desc.Rndn),
        spacingOn: desc.Intr,
        spacing: descriptor_1.parsePercent(desc.Spcn),
        flipX: desc.flipX,
        flipY: desc.flipY,
    };
    if (desc['Nm  '])
        shape.name = desc['Nm  '];
    if (desc.Hrdn)
        shape.hardness = descriptor_1.parsePercent(desc.Hrdn);
    if (desc.sampledData)
        shape.sampledData = desc.sampledData;
    return shape;
}
function readAbr(buffer, options) {
    var _a;
    if (options === void 0) { options = {}; }
    var reader = psdReader_1.createReader(buffer.buffer, buffer.byteOffset, buffer.byteLength);
    var version = psdReader_1.readInt16(reader);
    var samples = [];
    var brushes = [];
    var patterns = [];
    if (version === 1 || version === 2) {
        throw new Error("Unsupported ABR version (" + version + ")"); // TODO: ...
    }
    else if (version === 6 || version === 7 || version === 10) {
        var minorVersion = psdReader_1.readInt16(reader);
        if (minorVersion !== 1 && minorVersion !== 2)
            throw new Error('Unsupported ABR minor version');
        while (reader.offset < reader.view.byteLength) {
            psdReader_1.checkSignature(reader, '8BIM');
            var type = psdReader_1.readSignature(reader);
            var size = psdReader_1.readUint32(reader);
            var end = reader.offset + size;
            switch (type) {
                case 'samp': {
                    while (reader.offset < end) {
                        var brushLength = psdReader_1.readUint32(reader);
                        while (brushLength & 3)
                            brushLength++; // pad to 4 byte alignment
                        var brushEnd = reader.offset + brushLength;
                        var id = psdReader_1.readPascalString(reader, 1);
                        // v1 - Skip the Int16 bounds rectangle and the unknown Int16.
                        // v2 - Skip the unknown bytes.
                        psdReader_1.skipBytes(reader, minorVersion === 1 ? 10 : 264);
                        var y = psdReader_1.readInt32(reader);
                        var x = psdReader_1.readInt32(reader);
                        var h = psdReader_1.readInt32(reader) - y;
                        var w = psdReader_1.readInt32(reader) - x;
                        if (w <= 0 || h <= 0)
                            throw new Error('Invalid bounds');
                        var depth = psdReader_1.readInt16(reader);
                        var compression = psdReader_1.readUint8(reader); // 0 - raw, 1 - RLE
                        var alpha = new Uint8Array(w * h);
                        if (depth === 8) {
                            if (compression === 0) {
                                alpha.set(psdReader_1.readBytes(reader, alpha.byteLength));
                            }
                            else if (compression === 1) {
                                psdReader_1.readDataRLE(reader, { width: w, height: h, data: alpha }, w, h, 1, [0], false);
                            }
                            else {
                                throw new Error('Invalid compression');
                            }
                        }
                        else if (depth === 16) {
                            if (compression === 0) {
                                for (var i = 0; i < alpha.byteLength; i++) {
                                    alpha[i] = psdReader_1.readUint16(reader) >> 8; // convert to 8bit values
                                }
                            }
                            else if (compression === 1) {
                                throw new Error('not implemented (16bit RLE)'); // TODO: ...
                            }
                            else {
                                throw new Error('Invalid compression');
                            }
                        }
                        else {
                            throw new Error('Invalid depth');
                        }
                        samples.push({ id: id, bounds: { x: x, y: y, w: w, h: h }, alpha: alpha });
                        reader.offset = brushEnd;
                    }
                    break;
                }
                case 'desc': {
                    var desc = descriptor_1.readVersionAndDescriptor(reader);
                    // console.log(require('util').inspect(desc, false, 99, true));
                    for (var _i = 0, _b = desc.Brsh; _i < _b.length; _i++) {
                        var brush = _b[_i];
                        var b = {
                            name: brush['Nm  '],
                            shape: parseBrushShape(brush.Brsh),
                            spacing: descriptor_1.parsePercent(brush.Spcn),
                            // TODO: brushGroup ???
                            wetEdges: brush.Wtdg,
                            noise: brush.Nose,
                            // TODO: TxtC ??? smoothing / build-up ?
                            // TODO: 'Rpt ' ???
                            useBrushSize: brush.useBrushSize, // ???
                        };
                        if (brush.interpretation != null)
                            b.interpretation = brush.interpretation;
                        if (brush.protectTexture != null)
                            b.protectTexture = brush.protectTexture;
                        if (brush.useTipDynamics) {
                            b.shapeDynamics = {
                                tiltScale: descriptor_1.parsePercent(brush.tiltScale),
                                sizeDynamics: parseDynamics(brush.szVr),
                                angleDynamics: parseDynamics(brush.angleDynamics),
                                roundnessDynamics: parseDynamics(brush.roundnessDynamics),
                                flipX: brush.flipX,
                                flipY: brush.flipY,
                                brushProjection: brush.brushProjection,
                                minimumDiameter: descriptor_1.parsePercent(brush.minimumDiameter),
                                minimumRoundness: descriptor_1.parsePercent(brush.minimumRoundness),
                            };
                        }
                        if (brush.useScatter) {
                            b.scatter = {
                                count: brush['Cnt '],
                                bothAxes: brush.bothAxes,
                                countDynamics: parseDynamics(brush.countDynamics),
                                scatterDynamics: parseDynamics(brush.scatterDynamics),
                            };
                        }
                        if (brush.useTexture) {
                            b.texture = {
                                id: brush.Txtr.Idnt,
                                name: brush.Txtr['Nm  '],
                                blendMode: descriptor_1.BlnM.decode(brush.textureBlendMode),
                                depth: descriptor_1.parsePercent(brush.textureDepth),
                                depthMinimum: descriptor_1.parsePercent(brush.minimumDepth),
                                depthDynamics: parseDynamics(brush.textureDepthDynamics),
                                scale: descriptor_1.parsePercent(brush.textureScale),
                                invert: brush.InvT,
                                brightness: brush.textureBrightness,
                                contrast: brush.textureContrast,
                            };
                        }
                        var db = brush.dualBrush;
                        if (db && db.useDualBrush) {
                            b.dualBrush = {
                                flip: db.Flip,
                                shape: parseBrushShape(db.Brsh),
                                blendMode: descriptor_1.BlnM.decode(db.BlnM),
                                useScatter: db.useScatter,
                                spacing: descriptor_1.parsePercent(db.Spcn),
                                count: db['Cnt '],
                                bothAxes: db.bothAxes,
                                countDynamics: parseDynamics(db.countDynamics),
                                scatterDynamics: parseDynamics(db.scatterDynamics),
                            };
                        }
                        if (brush.useColorDynamics) {
                            b.colorDynamics = {
                                foregroundBackground: parseDynamics(brush.clVr),
                                hue: descriptor_1.parsePercent(brush['H   ']),
                                saturation: descriptor_1.parsePercent(brush.Strt),
                                brightness: descriptor_1.parsePercent(brush.Brgh),
                                purity: descriptor_1.parsePercent(brush.purity),
                                perTip: brush.colorDynamicsPerTip,
                            };
                        }
                        if (brush.usePaintDynamics) {
                            b.transfer = {
                                flowDynamics: parseDynamics(brush.prVr),
                                opacityDynamics: parseDynamics(brush.opVr),
                                wetnessDynamics: parseDynamics(brush.wtVr),
                                mixDynamics: parseDynamics(brush.mxVr),
                            };
                        }
                        if (brush.useBrushPose) {
                            b.brushPose = {
                                overrideAngle: brush.overridePoseAngle,
                                overrideTiltX: brush.overridePoseTiltX,
                                overrideTiltY: brush.overridePoseTiltY,
                                overridePressure: brush.overridePosePressure,
                                pressure: descriptor_1.parsePercent(brush.brushPosePressure),
                                tiltX: brush.brushPoseTiltX,
                                tiltY: brush.brushPoseTiltY,
                                angle: brush.brushPoseAngle,
                            };
                        }
                        var to = brush.toolOptions;
                        if (to) {
                            b.toolOptions = {
                                brushPreset: to.brushPreset,
                                flow: to.flow,
                                smooth: to.Smoo,
                                mode: descriptor_1.BlnM.decode(to['Md  ']),
                                opacity: to.Opct,
                                smoothing: to.smoothing,
                                smoothingValue: to.smoothingValue,
                                smoothingRadiusMode: to.smoothingRadiusMode,
                                smoothingCatchup: to.smoothingCatchup,
                                smoothingCatchupAtEnd: to.smoothingCatchupAtEnd,
                                smoothingZoomCompensation: to.smoothingZoomCompensation,
                                pressureSmoothing: to.pressureSmoothing,
                                usePressureOverridesSize: to.usePressureOverridesSize,
                                usePressureOverridesOpacity: to.usePressureOverridesOpacity,
                                useLegacy: to.useLegacy,
                            };
                        }
                        brushes.push(b);
                    }
                    break;
                }
                case 'patt': {
                    if (reader.offset < end) { // TODO: check multiple patterns
                        patterns.push(psdReader_1.readPattern(reader));
                        reader.offset = end;
                    }
                    break;
                }
                case 'phry': {
                    // TODO: what is this ?
                    var desc = descriptor_1.readVersionAndDescriptor(reader);
                    if (options.logMissingFeatures) {
                        if ((_a = desc.hierarchy) === null || _a === void 0 ? void 0 : _a.length) {
                            console.log('unhandled phry section', desc);
                        }
                    }
                    break;
                }
                default:
                    throw new Error("Invalid brush type: " + type);
            }
            // align to 4 bytes
            while (size % 4) {
                reader.offset++;
                size++;
            }
        }
    }
    else {
        throw new Error('Unsupported ABR version');
    }
    return { samples: samples, patterns: patterns, brushes: brushes };
}
exports.readAbr = readAbr;

//# sourceMappingURL=data:application/json;charset=utf8;base64,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QUFNLENBQUMsQ0FBQyxDQUFDO3dCQUNuQyxNQUFNLENBQUMsTUFBTSxHQUFHLEdBQUcsQ0FBQztxQkFDcEI7b0JBQ0QsTUFBTTtpQkFDTjtnQkFDRCxLQUFLLE1BQU0sQ0FBQyxDQUFDO29CQUNaLHVCQUF1QjtvQkFDdkIsSUFBTSxJQUFJLEdBQW1CLHFDQUF3QixDQUFDLE1BQU0sQ0FBQyxDQUFDO29CQUM5RCxJQUFJLE9BQU8sQ0FBQyxrQkFBa0IsRUFBRTt3QkFDL0IsSUFBSSxNQUFBLElBQUksQ0FBQyxTQUFTLDBDQUFFLE1BQU0sRUFBRTs0QkFDM0IsT0FBTyxDQUFDLEdBQUcsQ0FBQyx3QkFBd0IsRUFBRSxJQUFJLENBQUMsQ0FBQzt5QkFDNUM7cUJBQ0Q7b0JBQ0QsTUFBTTtpQkFDTjtnQkFDRDtvQkFDQyxNQUFNLElBQUksS0FBSyxDQUFDLHlCQUF1QixJQUFNLENBQUMsQ0FBQzthQUNoRDtZQUVELG1CQUFtQjtZQUNuQixPQUFPLElBQUksR0FBRyxDQUFDLEVBQUU7Z0JBQ2hCLE1BQU0sQ0FBQyxNQUFNLEVBQUUsQ0FBQztnQkFDaEIsSUFBSSxFQUFFLENBQUM7YUFDUDtTQUNEO0tBQ0Q7U0FBTTtRQUNOLE1BQU0sSUFBSSxLQUFLLENBQUMseUJBQXlCLENBQUMsQ0FBQztLQUMzQztJQUVELE9BQU8sRUFBRSxPQUFPLFNBQUEsRUFBRSxRQUFRLFVBQUEsRUFBRSxPQUFPLFNBQUEsRUFBRSxDQUFDO0FBQ3ZDLENBQUM7QUF4T0QsMEJBd09DIiwiZmlsZSI6ImFici5qcyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IEJsbk0sIERlc2NyaXB0b3JVbml0c1ZhbHVlLCBwYXJzZUFuZ2xlLCBwYXJzZVBlcmNlbnQsIHBhcnNlVW5pdHNUb051bWJlciwgcmVhZFZlcnNpb25BbmREZXNjcmlwdG9yIH0gZnJvbSAnLi9kZXNjcmlwdG9yJztcclxuaW1wb3J0IHsgQmxlbmRNb2RlLCBQYXR0ZXJuSW5mbyB9IGZyb20gJy4vcHNkJztcclxuaW1wb3J0IHtcclxuXHRjaGVja1NpZ25hdHVyZSwgY3JlYXRlUmVhZGVyLCByZWFkQnl0ZXMsIHJlYWREYXRhUkxFLCByZWFkSW50MTYsIHJlYWRJbnQzMiwgcmVhZFBhc2NhbFN0cmluZywgcmVhZFBhdHRlcm4sXHJcblx0cmVhZFNpZ25hdHVyZSwgcmVhZFVpbnQxNiwgcmVhZFVpbnQzMiwgcmVhZFVpbnQ4LCBza2lwQnl0ZXNcclxufSBmcm9tICcuL3BzZFJlYWRlcic7XHJcblxyXG5leHBvcnQgaW50ZXJmYWNlIEFiciB7XHJcblx0YnJ1c2hlczogQnJ1c2hbXTtcclxuXHRzYW1wbGVzOiBTYW1wbGVJbmZvW107XHJcblx0cGF0dGVybnM6IFBhdHRlcm5JbmZvW107XHJcbn1cclxuXHJcbmV4cG9ydCBpbnRlcmZhY2UgU2FtcGxlSW5mbyB7XHJcblx0aWQ6IHN0cmluZztcclxuXHRib3VuZHM6IHsgeDogbnVtYmVyOyB5OiBudW1iZXI7IHc6IG51bWJlcjsgaDogbnVtYmVyOyB9O1xyXG5cdGFscGhhOiBVaW50OEFycmF5O1xyXG59XHJcblxyXG5leHBvcnQgaW50ZXJmYWNlIEJydXNoRHluYW1pY3Mge1xyXG5cdGNvbnRyb2w6ICdvZmYnIHwgJ2ZhZGUnIHwgJ3BlbiBwcmVzc3VyZScgfCAncGVuIHRpbHQnIHwgJ3N0eWx1cyB3aGVlbCcgfCAnaW5pdGlhbCBkaXJlY3Rpb24nIHwgJ2RpcmVjdGlvbicgfCAnaW5pdGlhbCByb3RhdGlvbicgfCAncm90YXRpb24nO1xyXG5cdHN0ZXBzOiBudW1iZXI7XHJcblx0aml0dGVyOiBudW1iZXI7XHJcblx0bWluaW11bTogbnVtYmVyO1xyXG59XHJcblxyXG5jb25zdCBkeW5hbWljc0NvbnRyb2wgPSBbJ29mZicsICdmYWRlJywgJ3BlbiBwcmVzc3VyZScsICdwZW4gdGlsdCcsICdzdHlsdXMgc2hlZWwnLCAnaW5pdGlhbCBkaXJlY3Rpb24nLCAnZGlyZWN0aW9uJywgJ2luaXRpYWwgcm90YXRpb24nLCAncm90YXRpb24nXTtcclxuXHJcbmV4cG9ydCBpbnRlcmZhY2UgQnJ1c2hTaGFwZSB7XHJcblx0bmFtZT86IHN0cmluZztcclxuXHRzaXplOiBudW1iZXI7XHJcblx0YW5nbGU6IG51bWJlcjtcclxuXHRyb3VuZG5lc3M6IG51bWJlcjtcclxuXHRoYXJkbmVzcz86IG51bWJlcjtcclxuXHRzcGFjaW5nT246IGJvb2xlYW47XHJcblx0c3BhY2luZzogbnVtYmVyO1xyXG5cdGZsaXBYOiBib29sZWFuO1xyXG5cdGZsaXBZOiBib29sZWFuO1xyXG5cdHNhbXBsZWREYXRhPzogc3RyaW5nO1xyXG59XHJcblxyXG5leHBvcnQgaW50ZXJmYWNlIEJydXNoIHtcclxuXHRuYW1lOiBzdHJpbmc7XHJcblx0c2hhcGU6IEJydXNoU2hhcGU7XHJcblx0c2hhcGVEeW5hbWljcz86IHtcclxuXHRcdHNpemVEeW5hbWljczogQnJ1c2hEeW5hbWljcztcclxuXHRcdG1pbmltdW1EaWFtZXRlcjogbnVtYmVyO1xyXG5cdFx0dGlsdFNjYWxlOiBudW1iZXI7XHJcblx0XHRhbmdsZUR5bmFtaWNzOiBCcnVzaER5bmFtaWNzO1xyXG5cdFx0cm91bmRuZXNzRHluYW1pY3M6IEJydXNoRHluYW1pY3M7XHJcblx0XHRtaW5pbXVtUm91bmRuZXNzOiBudW1iZXI7XHJcblx0XHRmbGlwWDogYm9vbGVhbjtcclxuXHRcdGZsaXBZOiBib29sZWFuO1xyXG5cdFx0YnJ1c2hQcm9qZWN0aW9uOiBib29sZWFuO1xyXG5cdH07XHJcblx0c2NhdHRlcj86IHtcclxuXHRcdGJvdGhBeGVzOiBib29sZWFuO1xyXG5cdFx0c2NhdHRlckR5bmFtaWNzOiBCcnVzaER5bmFtaWNzO1xyXG5cdFx0Y291bnREeW5hbWljczogQnJ1c2hEeW5hbWljcztcclxuXHRcdGNvdW50OiBudW1iZXI7XHJcblx0fTtcclxuXHR0ZXh0dXJlPzoge1xyXG5cdFx0aWQ6IHN0cmluZztcclxuXHRcdG5hbWU6IHN0cmluZztcclxuXHRcdGludmVydDogYm9vbGVhbjtcclxuXHRcdHNjYWxlOiBudW1iZXI7XHJcblx0XHRicmlnaHRuZXNzOiBudW1iZXI7XHJcblx0XHRjb250cmFzdDogbnVtYmVyO1xyXG5cdFx0YmxlbmRNb2RlOiBCbGVuZE1vZGU7XHJcblx0XHRkZXB0aDogbnVtYmVyO1xyXG5cdFx0ZGVwdGhNaW5pbXVtOiBudW1iZXI7XHJcblx0XHRkZXB0aER5bmFtaWNzOiBCcnVzaER5bmFtaWNzO1xyXG5cdH07XHJcblx0ZHVhbEJydXNoPzoge1xyXG5cdFx0ZmxpcDogYm9vbGVhbjtcclxuXHRcdHNoYXBlOiBCcnVzaFNoYXBlO1xyXG5cdFx0YmxlbmRNb2RlOiBCbGVuZE1vZGU7XHJcblx0XHR1c2VTY2F0dGVyOiBib29sZWFuO1xyXG5cdFx0c3BhY2luZzogbnVtYmVyO1xyXG5cdFx0Y291bnQ6IG51bWJlcjtcclxuXHRcdGJvdGhBeGVzOiBib29sZWFuO1xyXG5cdFx0Y291bnREeW5hbWljczogQnJ1c2hEeW5hbWljcztcclxuXHRcdHNjYXR0ZXJEeW5hbWljczogQnJ1c2hEeW5hbWljcztcclxuXHR9O1xyXG5cdGNvbG9yRHluYW1pY3M/OiB7XHJcblx0XHRmb3JlZ3JvdW5kQmFja2dyb3VuZDogQnJ1c2hEeW5hbWljcztcclxuXHRcdGh1ZTogbnVtYmVyO1xyXG5cdFx0c2F0dXJhdGlvbjogbnVtYmVyO1xyXG5cdFx0YnJpZ2h0bmVzczogbnVtYmVyO1xyXG5cdFx0cHVyaXR5OiBudW1iZXI7XHJcblx0XHRwZXJUaXA6IGJvb2xlYW47XHJcblx0fTtcclxuXHR0cmFuc2Zlcj86IHtcclxuXHRcdGZsb3dEeW5hbWljczogQnJ1c2hEeW5hbWljcztcclxuXHRcdG9wYWNpdHlEeW5hbWljczogQnJ1c2hEeW5hbWljcztcclxuXHRcdHdldG5lc3NEeW5hbWljczogQnJ1c2hEeW5hbWljcztcclxuXHRcdG1peER5bmFtaWNzOiBCcnVzaER5bmFtaWNzO1xyXG5cdH07XHJcblx0YnJ1c2hQb3NlPzoge1xyXG5cdFx0b3ZlcnJpZGVBbmdsZTogYm9vbGVhbjtcclxuXHRcdG92ZXJyaWRlVGlsdFg6IGJvb2xlYW47XHJcblx0XHRvdmVycmlkZVRpbHRZOiBib29sZWFuO1xyXG5cdFx0b3ZlcnJpZGVQcmVzc3VyZTogYm9vbGVhbjtcclxuXHRcdHByZXNzdXJlOiBudW1iZXI7XHJcblx0XHR0aWx0WDogbnVtYmVyO1xyXG5cdFx0dGlsdFk6IG51bWJlcjtcclxuXHRcdGFuZ2xlOiBudW1iZXI7XHJcblx0fTtcclxuXHRub2lzZTogYm9vbGVhbjtcclxuXHR3ZXRFZGdlczogYm9vbGVhbjtcclxuXHQvLyBUT0RPOiBidWlsZC11cFxyXG5cdC8vIFRPRE86IHNtb290aGluZ1xyXG5cdHByb3RlY3RUZXh0dXJlPzogYm9vbGVhbjtcclxuXHRzcGFjaW5nOiBudW1iZXI7XHJcblx0YnJ1c2hHcm91cD86IHVuZGVmaW5lZDsgLy8gP1xyXG5cdGludGVycHJldGF0aW9uPzogYm9vbGVhbjsgLy8gP1xyXG5cdHVzZUJydXNoU2l6ZTogYm9vbGVhbjsgLy8gP1xyXG5cdHRvb2xPcHRpb25zPzoge1xyXG5cdFx0YnJ1c2hQcmVzZXQ6IGJvb2xlYW47XHJcblx0XHRmbG93OiBudW1iZXI7XHJcblx0XHRzbW9vdGg6IG51bWJlcjsgLy8gP1xyXG5cdFx0bW9kZTogQmxlbmRNb2RlO1xyXG5cdFx0b3BhY2l0eTogbnVtYmVyO1xyXG5cdFx0c21vb3RoaW5nOiBib29sZWFuO1xyXG5cdFx0c21vb3RoaW5nVmFsdWU6IG51bWJlcjtcclxuXHRcdHNtb290aGluZ1JhZGl1c01vZGU6IGJvb2xlYW47XHJcblx0XHRzbW9vdGhpbmdDYXRjaHVwOiBib29sZWFuO1xyXG5cdFx0c21vb3RoaW5nQ2F0Y2h1cEF0RW5kOiBib29sZWFuO1xyXG5cdFx0c21vb3RoaW5nWm9vbUNvbXBlbnNhdGlvbjogYm9vbGVhbjtcclxuXHRcdHByZXNzdXJlU21vb3RoaW5nOiBib29sZWFuO1xyXG5cdFx0dXNlUHJlc3N1cmVPdmVycmlkZXNTaXplOiBib29sZWFuO1xyXG5cdFx0dXNlUHJlc3N1cmVPdmVycmlkZXNPcGFjaXR5OiBib29sZWFuO1xyXG5cdFx0dXNlTGVnYWN5OiBib29sZWFuO1xyXG5cdH07XHJcbn1cclxuXHJcbi8vIGludGVybmFsXHJcblxyXG5pbnRlcmZhY2UgUGhyeURlc2NyaXB0b3Ige1xyXG5cdGhpZXJhcmNoeTogYW55W107XHJcbn1cclxuXHJcbmludGVyZmFjZSBEeW5hbWljc0Rlc2NyaXB0b3Ige1xyXG5cdGJWVHk6IG51bWJlcjtcclxuXHRmU3RwOiBudW1iZXI7XHJcblx0aml0dGVyOiBEZXNjcmlwdG9yVW5pdHNWYWx1ZTtcclxuXHQnTW5tICc6IERlc2NyaXB0b3JVbml0c1ZhbHVlO1xyXG59XHJcblxyXG5pbnRlcmZhY2UgQnJ1c2hTaGFwZURlc2NyaXB0b3Ige1xyXG5cdERtdHI6IERlc2NyaXB0b3JVbml0c1ZhbHVlO1xyXG5cdEFuZ2w6IERlc2NyaXB0b3JVbml0c1ZhbHVlO1xyXG5cdFJuZG46IERlc2NyaXB0b3JVbml0c1ZhbHVlO1xyXG5cdCdObSAgJz86IHN0cmluZztcclxuXHRTcGNuOiBEZXNjcmlwdG9yVW5pdHNWYWx1ZTtcclxuXHRJbnRyOiBib29sZWFuO1xyXG5cdEhyZG4/OiBEZXNjcmlwdG9yVW5pdHNWYWx1ZTtcclxuXHRmbGlwWDogYm9vbGVhbjtcclxuXHRmbGlwWTogYm9vbGVhbjtcclxuXHRzYW1wbGVkRGF0YT86IHN0cmluZztcclxufVxyXG5cclxuaW50ZXJmYWNlIERlc2NEZXNjcmlwdG9yIHtcclxuXHRCcnNoOiB7XHJcblx0XHQnTm0gICc6IHN0cmluZztcclxuXHRcdEJyc2g6IEJydXNoU2hhcGVEZXNjcmlwdG9yO1xyXG5cdFx0dXNlVGlwRHluYW1pY3M6IGJvb2xlYW47XHJcblx0XHRmbGlwWDogYm9vbGVhbjtcclxuXHRcdGZsaXBZOiBib29sZWFuO1xyXG5cdFx0YnJ1c2hQcm9qZWN0aW9uOiBib29sZWFuO1xyXG5cdFx0bWluaW11bURpYW1ldGVyOiBEZXNjcmlwdG9yVW5pdHNWYWx1ZTtcclxuXHRcdG1pbmltdW1Sb3VuZG5lc3M6IERlc2NyaXB0b3JVbml0c1ZhbHVlO1xyXG5cdFx0dGlsdFNjYWxlOiBEZXNjcmlwdG9yVW5pdHNWYWx1ZTtcclxuXHRcdHN6VnI6IER5bmFtaWNzRGVzY3JpcHRvcjtcclxuXHRcdGFuZ2xlRHluYW1pY3M6IER5bmFtaWNzRGVzY3JpcHRvcjtcclxuXHRcdHJvdW5kbmVzc0R5bmFtaWNzOiBEeW5hbWljc0Rlc2NyaXB0b3I7XHJcblx0XHR1c2VTY2F0dGVyOiBib29sZWFuO1xyXG5cdFx0U3BjbjogRGVzY3JpcHRvclVuaXRzVmFsdWU7XHJcblx0XHQnQ250ICc6IG51bWJlcjtcclxuXHRcdGJvdGhBeGVzOiBib29sZWFuO1xyXG5cdFx0Y291bnREeW5hbWljczogRHluYW1pY3NEZXNjcmlwdG9yO1xyXG5cdFx0c2NhdHRlckR5bmFtaWNzOiBEeW5hbWljc0Rlc2NyaXB0b3I7XHJcblx0XHRkdWFsQnJ1c2g6IHsgdXNlRHVhbEJydXNoOiBmYWxzZTsgfSB8IHtcclxuXHRcdFx0dXNlRHVhbEJydXNoOiB0cnVlO1xyXG5cdFx0XHRGbGlwOiBib29sZWFuO1xyXG5cdFx0XHRCcnNoOiBCcnVzaFNoYXBlRGVzY3JpcHRvcjtcclxuXHRcdFx0QmxuTTogc3RyaW5nO1xyXG5cdFx0XHR1c2VTY2F0dGVyOiBib29sZWFuO1xyXG5cdFx0XHRTcGNuOiBEZXNjcmlwdG9yVW5pdHNWYWx1ZTtcclxuXHRcdFx0J0NudCAnOiBudW1iZXI7XHJcblx0XHRcdGJvdGhBeGVzOiBib29sZWFuO1xyXG5cdFx0XHRjb3VudER5bmFtaWNzOiBEeW5hbWljc0Rlc2NyaXB0b3I7XHJcblx0XHRcdHNjYXR0ZXJEeW5hbWljczogRHluYW1pY3NEZXNjcmlwdG9yO1xyXG5cdFx0fTtcclxuXHRcdGJydXNoR3JvdXA6IHsgdXNlQnJ1c2hHcm91cDogZmFsc2U7IH07XHJcblx0XHR1c2VUZXh0dXJlOiBib29sZWFuO1xyXG5cdFx0VHh0QzogYm9vbGVhbjtcclxuXHRcdGludGVycHJldGF0aW9uOiBib29sZWFuO1xyXG5cdFx0dGV4dHVyZUJsZW5kTW9kZTogc3RyaW5nO1xyXG5cdFx0dGV4dHVyZURlcHRoOiBEZXNjcmlwdG9yVW5pdHNWYWx1ZTtcclxuXHRcdG1pbmltdW1EZXB0aDogRGVzY3JpcHRvclVuaXRzVmFsdWU7XHJcblx0XHR0ZXh0dXJlRGVwdGhEeW5hbWljczogRHluYW1pY3NEZXNjcmlwdG9yO1xyXG5cdFx0VHh0cjoge1xyXG5cdFx0XHQnTm0gICc6IHN0cmluZztcclxuXHRcdFx0SWRudDogc3RyaW5nO1xyXG5cdFx0fTtcclxuXHRcdHRleHR1cmVTY2FsZTogRGVzY3JpcHRvclVuaXRzVmFsdWU7XHJcblx0XHRJbnZUOiBib29sZWFuO1xyXG5cdFx0cHJvdGVjdFRleHR1cmU6IGJvb2xlYW47XHJcblx0XHR0ZXh0dXJlQnJpZ2h0bmVzczogbnVtYmVyO1xyXG5cdFx0dGV4dHVyZUNvbnRyYXN0OiBudW1iZXI7XHJcblx0XHR1c2VQYWludER5bmFtaWNzOiBib29sZWFuO1xyXG5cdFx0cHJWcj86IER5bmFtaWNzRGVzY3JpcHRvcjtcclxuXHRcdG9wVnI/OiBEeW5hbWljc0Rlc2NyaXB0b3I7XHJcblx0XHR3dFZyPzogRHluYW1pY3NEZXNjcmlwdG9yO1xyXG5cdFx0bXhWcj86IER5bmFtaWNzRGVzY3JpcHRvcjtcclxuXHRcdHVzZUNvbG9yRHluYW1pY3M6IGJvb2xlYW47XHJcblx0XHRjbFZyPzogRHluYW1pY3NEZXNjcmlwdG9yO1xyXG5cdFx0J0ggICAnPzogRGVzY3JpcHRvclVuaXRzVmFsdWU7XHJcblx0XHRTdHJ0PzogRGVzY3JpcHRvclVuaXRzVmFsdWU7XHJcblx0XHRCcmdoPzogRGVzY3JpcHRvclVuaXRzVmFsdWU7XHJcblx0XHRwdXJpdHk/OiBEZXNjcmlwdG9yVW5pdHNWYWx1ZTtcclxuXHRcdGNvbG9yRHluYW1pY3NQZXJUaXA/OiB0cnVlO1xyXG5cdFx0V3RkZzogYm9vbGVhbjtcclxuXHRcdE5vc2U6IGJvb2xlYW47XHJcblx0XHQnUnB0ICc6IGJvb2xlYW47XHJcblx0XHR1c2VCcnVzaFNpemU6IGJvb2xlYW47XHJcblx0XHR1c2VCcnVzaFBvc2U6IGJvb2xlYW47XHJcblx0XHRvdmVycmlkZVBvc2VBbmdsZT86IGJvb2xlYW47XHJcblx0XHRvdmVycmlkZVBvc2VUaWx0WD86IGJvb2xlYW47XHJcblx0XHRvdmVycmlkZVBvc2VUaWx0WT86IGJvb2xlYW47XHJcblx0XHRvdmVycmlkZVBvc2VQcmVzc3VyZT86IGJvb2xlYW47XHJcblx0XHRicnVzaFBvc2VQcmVzc3VyZT86IERlc2NyaXB0b3JVbml0c1ZhbHVlO1xyXG5cdFx0YnJ1c2hQb3NlVGlsdFg/OiBudW1iZXI7XHJcblx0XHRicnVzaFBvc2VUaWx0WT86IG51bWJlcjtcclxuXHRcdGJydXNoUG9zZUFuZ2xlPzogbnVtYmVyO1xyXG5cdFx0dG9vbE9wdGlvbnM/OiB7XHJcblx0XHRcdGJydXNoUHJlc2V0OiBib29sZWFuO1xyXG5cdFx0XHRmbG93OiBudW1iZXI7XHJcblx0XHRcdFNtb286IG51bWJlcjtcclxuXHRcdFx0J01kICAnOiBzdHJpbmc7XHJcblx0XHRcdE9wY3Q6IG51bWJlcjtcclxuXHRcdFx0c21vb3RoaW5nOiBib29sZWFuO1xyXG5cdFx0XHRzbW9vdGhpbmdWYWx1ZTogbnVtYmVyO1xyXG5cdFx0XHRzbW9vdGhpbmdSYWRpdXNNb2RlOiBib29sZWFuO1xyXG5cdFx0XHRzbW9vdGhpbmdDYXRjaHVwOiBib29sZWFuO1xyXG5cdFx0XHRzbW9vdGhpbmdDYXRjaHVwQXRFbmQ6IGJvb2xlYW47XHJcblx0XHRcdHNtb290aGluZ1pvb21Db21wZW5zYXRpb246IGJvb2xlYW47XHJcblx0XHRcdHByZXNzdXJlU21vb3RoaW5nOiBib29sZWFuO1xyXG5cdFx0XHR1c2VQcmVzc3VyZU92ZXJyaWRlc1NpemU6IGJvb2xlYW47XHJcblx0XHRcdHVzZVByZXNzdXJlT3ZlcnJpZGVzT3BhY2l0eTogYm9vbGVhbjtcclxuXHRcdFx0dXNlTGVnYWN5OiBib29sZWFuO1xyXG5cdFx0fTtcclxuXHR9W107XHJcbn1cclxuXHJcbmZ1bmN0aW9uIHBhcnNlRHluYW1pY3MoZGVzYzogRHluYW1pY3NEZXNjcmlwdG9yKTogQnJ1c2hEeW5hbWljcyB7XHJcblx0cmV0dXJuIHtcclxuXHRcdGNvbnRyb2w6IGR5bmFtaWNzQ29udHJvbFtkZXNjLmJWVHldIGFzIGFueSxcclxuXHRcdHN0ZXBzOiBkZXNjLmZTdHAsXHJcblx0XHRqaXR0ZXI6IHBhcnNlUGVyY2VudChkZXNjLmppdHRlciksXHJcblx0XHRtaW5pbXVtOiBwYXJzZVBlcmNlbnQoZGVzY1snTW5tICddKSxcclxuXHR9O1xyXG59XHJcblxyXG5mdW5jdGlvbiBwYXJzZUJydXNoU2hhcGUoZGVzYzogQnJ1c2hTaGFwZURlc2NyaXB0b3IpOiBCcnVzaFNoYXBlIHtcclxuXHRjb25zdCBzaGFwZTogQnJ1c2hTaGFwZSA9IHtcclxuXHRcdHNpemU6IHBhcnNlVW5pdHNUb051bWJlcihkZXNjLkRtdHIsICdQaXhlbHMnKSxcclxuXHRcdGFuZ2xlOiBwYXJzZUFuZ2xlKGRlc2MuQW5nbCksXHJcblx0XHRyb3VuZG5lc3M6IHBhcnNlUGVyY2VudChkZXNjLlJuZG4pLFxyXG5cdFx0c3BhY2luZ09uOiBkZXNjLkludHIsXHJcblx0XHRzcGFjaW5nOiBwYXJzZVBlcmNlbnQoZGVzYy5TcGNuKSxcclxuXHRcdGZsaXBYOiBkZXNjLmZsaXBYLFxyXG5cdFx0ZmxpcFk6IGRlc2MuZmxpcFksXHJcblx0fTtcclxuXHJcblx0aWYgKGRlc2NbJ05tICAnXSkgc2hhcGUubmFtZSA9IGRlc2NbJ05tICAnXTtcclxuXHRpZiAoZGVzYy5IcmRuKSBzaGFwZS5oYXJkbmVzcyA9IHBhcnNlUGVyY2VudChkZXNjLkhyZG4pO1xyXG5cdGlmIChkZXNjLnNhbXBsZWREYXRhKSBzaGFwZS5zYW1wbGVkRGF0YSA9IGRlc2Muc2FtcGxlZERhdGE7XHJcblxyXG5cdHJldHVybiBzaGFwZTtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIHJlYWRBYnIoYnVmZmVyOiBBcnJheUJ1ZmZlclZpZXcsIG9wdGlvbnM6IHsgbG9nTWlzc2luZ0ZlYXR1cmVzPzogYm9vbGVhbjsgfSA9IHt9KTogQWJyIHtcclxuXHRjb25zdCByZWFkZXIgPSBjcmVhdGVSZWFkZXIoYnVmZmVyLmJ1ZmZlciwgYnVmZmVyLmJ5dGVPZmZzZXQsIGJ1ZmZlci5ieXRlTGVuZ3RoKTtcclxuXHRjb25zdCB2ZXJzaW9uID0gcmVhZEludDE2KHJlYWRlcik7XHJcblx0Y29uc3Qgc2FtcGxlczogU2FtcGxlSW5mb1tdID0gW107XHJcblx0Y29uc3QgYnJ1c2hlczogQnJ1c2hbXSA9IFtdO1xyXG5cdGNvbnN0IHBhdHRlcm5zOiBQYXR0ZXJuSW5mb1tdID0gW107XHJcblxyXG5cdGlmICh2ZXJzaW9uID09PSAxIHx8IHZlcnNpb24gPT09IDIpIHtcclxuXHRcdHRocm93IG5ldyBFcnJvcihgVW5zdXBwb3J0ZWQgQUJSIHZlcnNpb24gKCR7dmVyc2lvbn0pYCk7IC8vIFRPRE86IC4uLlxyXG5cdH0gZWxzZSBpZiAodmVyc2lvbiA9PT0gNiB8fCB2ZXJzaW9uID09PSA3IHx8IHZlcnNpb24gPT09IDEwKSB7XHJcblx0XHRjb25zdCBtaW5vclZlcnNpb24gPSByZWFkSW50MTYocmVhZGVyKTtcclxuXHRcdGlmIChtaW5vclZlcnNpb24gIT09IDEgJiYgbWlub3JWZXJzaW9uICE9PSAyKSB0aHJvdyBuZXcgRXJyb3IoJ1Vuc3VwcG9ydGVkIEFCUiBtaW5vciB2ZXJzaW9uJyk7XHJcblxyXG5cdFx0d2hpbGUgKHJlYWRlci5vZmZzZXQgPCByZWFkZXIudmlldy5ieXRlTGVuZ3RoKSB7XHJcblx0XHRcdGNoZWNrU2lnbmF0dXJlKHJlYWRlciwgJzhCSU0nKTtcclxuXHRcdFx0Y29uc3QgdHlwZSA9IHJlYWRTaWduYXR1cmUocmVhZGVyKSBhcyAnc2FtcCcgfCAnZGVzYycgfCAncGF0dCcgfCAncGhyeSc7XHJcblx0XHRcdGxldCBzaXplID0gcmVhZFVpbnQzMihyZWFkZXIpO1xyXG5cdFx0XHRjb25zdCBlbmQgPSByZWFkZXIub2Zmc2V0ICsgc2l6ZTtcclxuXHJcblx0XHRcdHN3aXRjaCAodHlwZSkge1xyXG5cdFx0XHRcdGNhc2UgJ3NhbXAnOiB7XHJcblx0XHRcdFx0XHR3aGlsZSAocmVhZGVyLm9mZnNldCA8IGVuZCkge1xyXG5cdFx0XHRcdFx0XHRsZXQgYnJ1c2hMZW5ndGggPSByZWFkVWludDMyKHJlYWRlcik7XHJcblx0XHRcdFx0XHRcdHdoaWxlIChicnVzaExlbmd0aCAmIDBiMTEpIGJydXNoTGVuZ3RoKys7IC8vIHBhZCB0byA0IGJ5dGUgYWxpZ25tZW50XHJcblx0XHRcdFx0XHRcdGNvbnN0IGJydXNoRW5kID0gcmVhZGVyLm9mZnNldCArIGJydXNoTGVuZ3RoO1xyXG5cclxuXHRcdFx0XHRcdFx0Y29uc3QgaWQgPSByZWFkUGFzY2FsU3RyaW5nKHJlYWRlciwgMSk7XHJcblxyXG5cdFx0XHRcdFx0XHQvLyB2MSAtIFNraXAgdGhlIEludDE2IGJvdW5kcyByZWN0YW5nbGUgYW5kIHRoZSB1bmtub3duIEludDE2LlxyXG5cdFx0XHRcdFx0XHQvLyB2MiAtIFNraXAgdGhlIHVua25vd24gYnl0ZXMuXHJcblx0XHRcdFx0XHRcdHNraXBCeXRlcyhyZWFkZXIsIG1pbm9yVmVyc2lvbiA9PT0gMSA/IDEwIDogMjY0KTtcclxuXHJcblx0XHRcdFx0XHRcdGNvbnN0IHkgPSByZWFkSW50MzIocmVhZGVyKTtcclxuXHRcdFx0XHRcdFx0Y29uc3QgeCA9IHJlYWRJbnQzMihyZWFkZXIpO1xyXG5cdFx0XHRcdFx0XHRjb25zdCBoID0gcmVhZEludDMyKHJlYWRlcikgLSB5O1xyXG5cdFx0XHRcdFx0XHRjb25zdCB3ID0gcmVhZEludDMyKHJlYWRlcikgLSB4O1xyXG5cdFx0XHRcdFx0XHRpZiAodyA8PSAwIHx8IGggPD0gMCkgdGhyb3cgbmV3IEVycm9yKCdJbnZhbGlkIGJvdW5kcycpO1xyXG5cclxuXHRcdFx0XHRcdFx0Y29uc3QgZGVwdGggPSByZWFkSW50MTYocmVhZGVyKTtcclxuXHRcdFx0XHRcdFx0Y29uc3QgY29tcHJlc3Npb24gPSByZWFkVWludDgocmVhZGVyKTsgLy8gMCAtIHJhdywgMSAtIFJMRVxyXG5cdFx0XHRcdFx0XHRjb25zdCBhbHBoYSA9IG5ldyBVaW50OEFycmF5KHcgKiBoKTtcclxuXHJcblx0XHRcdFx0XHRcdGlmIChkZXB0aCA9PT0gOCkge1xyXG5cdFx0XHRcdFx0XHRcdGlmIChjb21wcmVzc2lvbiA9PT0gMCkge1xyXG5cdFx0XHRcdFx0XHRcdFx0YWxwaGEuc2V0KHJlYWRCeXRlcyhyZWFkZXIsIGFscGhhLmJ5dGVMZW5ndGgpKTtcclxuXHRcdFx0XHRcdFx0XHR9IGVsc2UgaWYgKGNvbXByZXNzaW9uID09PSAxKSB7XHJcblx0XHRcdFx0XHRcdFx0XHRyZWFkRGF0YVJMRShyZWFkZXIsIHsgd2lkdGg6IHcsIGhlaWdodDogaCwgZGF0YTogYWxwaGEgfSwgdywgaCwgMSwgWzBdLCBmYWxzZSk7XHJcblx0XHRcdFx0XHRcdFx0fSBlbHNlIHtcclxuXHRcdFx0XHRcdFx0XHRcdHRocm93IG5ldyBFcnJvcignSW52YWxpZCBjb21wcmVzc2lvbicpO1xyXG5cdFx0XHRcdFx0XHRcdH1cclxuXHRcdFx0XHRcdFx0fSBlbHNlIGlmIChkZXB0aCA9PT0gMTYpIHtcclxuXHRcdFx0XHRcdFx0XHRpZiAoY29tcHJlc3Npb24gPT09IDApIHtcclxuXHRcdFx0XHRcdFx0XHRcdGZvciAobGV0IGkgPSAwOyBpIDwgYWxwaGEuYnl0ZUxlbmd0aDsgaSsrKSB7XHJcblx0XHRcdFx0XHRcdFx0XHRcdGFscGhhW2ldID0gcmVhZFVpbnQxNihyZWFkZXIpID4+IDg7IC8vIGNvbnZlcnQgdG8gOGJpdCB2YWx1ZXNcclxuXHRcdFx0XHRcdFx0XHRcdH1cclxuXHRcdFx0XHRcdFx0XHR9IGVsc2UgaWYgKGNvbXByZXNzaW9uID09PSAxKSB7XHJcblx0XHRcdFx0XHRcdFx0XHR0aHJvdyBuZXcgRXJyb3IoJ25vdCBpbXBsZW1lbnRlZCAoMTZiaXQgUkxFKScpOyAvLyBUT0RPOiAuLi5cclxuXHRcdFx0XHRcdFx0XHR9IGVsc2Uge1xyXG5cdFx0XHRcdFx0XHRcdFx0dGhyb3cgbmV3IEVycm9yKCdJbnZhbGlkIGNvbXByZXNzaW9uJyk7XHJcblx0XHRcdFx0XHRcdFx0fVxyXG5cdFx0XHRcdFx0XHR9IGVsc2Uge1xyXG5cdFx0XHRcdFx0XHRcdHRocm93IG5ldyBFcnJvcignSW52YWxpZCBkZXB0aCcpO1xyXG5cdFx0XHRcdFx0XHR9XHJcblxyXG5cdFx0XHRcdFx0XHRzYW1wbGVzLnB1c2goeyBpZCwgYm91bmRzOiB7IHgsIHksIHcsIGggfSwgYWxwaGEgfSk7XHJcblx0XHRcdFx0XHRcdHJlYWRlci5vZmZzZXQgPSBicnVzaEVuZDtcclxuXHRcdFx0XHRcdH1cclxuXHRcdFx0XHRcdGJyZWFrO1xyXG5cdFx0XHRcdH1cclxuXHRcdFx0XHRjYXNlICdkZXNjJzoge1xyXG5cdFx0XHRcdFx0Y29uc3QgZGVzYzogRGVzY0Rlc2NyaXB0b3IgPSByZWFkVmVyc2lvbkFuZERlc2NyaXB0b3IocmVhZGVyKTtcclxuXHRcdFx0XHRcdC8vIGNvbnNvbGUubG9nKHJlcXVpcmUoJ3V0aWwnKS5pbnNwZWN0KGRlc2MsIGZhbHNlLCA5OSwgdHJ1ZSkpO1xyXG5cclxuXHRcdFx0XHRcdGZvciAoY29uc3QgYnJ1c2ggb2YgZGVzYy5CcnNoKSB7XHJcblx0XHRcdFx0XHRcdGNvbnN0IGI6IEJydXNoID0ge1xyXG5cdFx0XHRcdFx0XHRcdG5hbWU6IGJydXNoWydObSAgJ10sXHJcblx0XHRcdFx0XHRcdFx0c2hhcGU6IHBhcnNlQnJ1c2hTaGFwZShicnVzaC5CcnNoKSxcclxuXHRcdFx0XHRcdFx0XHRzcGFjaW5nOiBwYXJzZVBlcmNlbnQoYnJ1c2guU3BjbiksXHJcblx0XHRcdFx0XHRcdFx0Ly8gVE9ETzogYnJ1c2hHcm91cCA/Pz9cclxuXHRcdFx0XHRcdFx0XHR3ZXRFZGdlczogYnJ1c2guV3RkZyxcclxuXHRcdFx0XHRcdFx0XHRub2lzZTogYnJ1c2guTm9zZSxcclxuXHRcdFx0XHRcdFx0XHQvLyBUT0RPOiBUeHRDID8/PyBzbW9vdGhpbmcgLyBidWlsZC11cCA/XHJcblx0XHRcdFx0XHRcdFx0Ly8gVE9ETzogJ1JwdCAnID8/P1xyXG5cdFx0XHRcdFx0XHRcdHVzZUJydXNoU2l6ZTogYnJ1c2gudXNlQnJ1c2hTaXplLCAvLyA/Pz9cclxuXHRcdFx0XHRcdFx0fTtcclxuXHJcblx0XHRcdFx0XHRcdGlmIChicnVzaC5pbnRlcnByZXRhdGlvbiAhPSBudWxsKSBiLmludGVycHJldGF0aW9uID0gYnJ1c2guaW50ZXJwcmV0YXRpb247XHJcblx0XHRcdFx0XHRcdGlmIChicnVzaC5wcm90ZWN0VGV4dHVyZSAhPSBudWxsKSBiLnByb3RlY3RUZXh0dXJlID0gYnJ1c2gucHJvdGVjdFRleHR1cmU7XHJcblxyXG5cdFx0XHRcdFx0XHRpZiAoYnJ1c2gudXNlVGlwRHluYW1pY3MpIHtcclxuXHRcdFx0XHRcdFx0XHRiLnNoYXBlRHluYW1pY3MgPSB7XHJcblx0XHRcdFx0XHRcdFx0XHR0aWx0U2NhbGU6IHBhcnNlUGVyY2VudChicnVzaC50aWx0U2NhbGUpLFxyXG5cdFx0XHRcdFx0XHRcdFx0c2l6ZUR5bmFtaWNzOiBwYXJzZUR5bmFtaWNzKGJydXNoLnN6VnIpLFxyXG5cdFx0XHRcdFx0XHRcdFx0YW5nbGVEeW5hbWljczogcGFyc2VEeW5hbWljcyhicnVzaC5hbmdsZUR5bmFtaWNzKSxcclxuXHRcdFx0XHRcdFx0XHRcdHJvdW5kbmVzc0R5bmFtaWNzOiBwYXJzZUR5bmFtaWNzKGJydXNoLnJvdW5kbmVzc0R5bmFtaWNzKSxcclxuXHRcdFx0XHRcdFx0XHRcdGZsaXBYOiBicnVzaC5mbGlwWCxcclxuXHRcdFx0XHRcdFx0XHRcdGZsaXBZOiBicnVzaC5mbGlwWSxcclxuXHRcdFx0XHRcdFx0XHRcdGJydXNoUHJvamVjdGlvbjogYnJ1c2guYnJ1c2hQcm9qZWN0aW9uLFxyXG5cdFx0XHRcdFx0XHRcdFx0bWluaW11bURpYW1ldGVyOiBwYXJzZVBlcmNlbnQoYnJ1c2gubWluaW11bURpYW1ldGVyKSxcclxuXHRcdFx0XHRcdFx0XHRcdG1pbmltdW1Sb3VuZG5lc3M6IHBhcnNlUGVyY2VudChicnVzaC5taW5pbXVtUm91bmRuZXNzKSxcclxuXHRcdFx0XHRcdFx0XHR9O1xyXG5cdFx0XHRcdFx0XHR9XHJcblxyXG5cdFx0XHRcdFx0XHRpZiAoYnJ1c2gudXNlU2NhdHRlcikge1xyXG5cdFx0XHRcdFx0XHRcdGIuc2NhdHRlciA9IHtcclxuXHRcdFx0XHRcdFx0XHRcdGNvdW50OiBicnVzaFsnQ250ICddLFxyXG5cdFx0XHRcdFx0XHRcdFx0Ym90aEF4ZXM6IGJydXNoLmJvdGhBeGVzLFxyXG5cdFx0XHRcdFx0XHRcdFx0Y291bnREeW5hbWljczogcGFyc2VEeW5hbWljcyhicnVzaC5jb3VudER5bmFtaWNzKSxcclxuXHRcdFx0XHRcdFx0XHRcdHNjYXR0ZXJEeW5hbWljczogcGFyc2VEeW5hbWljcyhicnVzaC5zY2F0dGVyRHluYW1pY3MpLFxyXG5cdFx0XHRcdFx0XHRcdH07XHJcblx0XHRcdFx0XHRcdH1cclxuXHJcblx0XHRcdFx0XHRcdGlmIChicnVzaC51c2VUZXh0dXJlKSB7XHJcblx0XHRcdFx0XHRcdFx0Yi50ZXh0dXJlID0ge1xyXG5cdFx0XHRcdFx0XHRcdFx0aWQ6IGJydXNoLlR4dHIuSWRudCxcclxuXHRcdFx0XHRcdFx0XHRcdG5hbWU6IGJydXNoLlR4dHJbJ05tICAnXSxcclxuXHRcdFx0XHRcdFx0XHRcdGJsZW5kTW9kZTogQmxuTS5kZWNvZGUoYnJ1c2gudGV4dHVyZUJsZW5kTW9kZSksXHJcblx0XHRcdFx0XHRcdFx0XHRkZXB0aDogcGFyc2VQZXJjZW50KGJydXNoLnRleHR1cmVEZXB0aCksXHJcblx0XHRcdFx0XHRcdFx0XHRkZXB0aE1pbmltdW06IHBhcnNlUGVyY2VudChicnVzaC5taW5pbXVtRGVwdGgpLFxyXG5cdFx0XHRcdFx0XHRcdFx0ZGVwdGhEeW5hbWljczogcGFyc2VEeW5hbWljcyhicnVzaC50ZXh0dXJlRGVwdGhEeW5hbWljcyksXHJcblx0XHRcdFx0XHRcdFx0XHRzY2FsZTogcGFyc2VQZXJjZW50KGJydXNoLnRleHR1cmVTY2FsZSksXHJcblx0XHRcdFx0XHRcdFx0XHRpbnZlcnQ6IGJydXNoLkludlQsXHJcblx0XHRcdFx0XHRcdFx0XHRicmlnaHRuZXNzOiBicnVzaC50ZXh0dXJlQnJpZ2h0bmVzcyxcclxuXHRcdFx0XHRcdFx0XHRcdGNvbnRyYXN0OiBicnVzaC50ZXh0dXJlQ29udHJhc3QsXHJcblx0XHRcdFx0XHRcdFx0fTtcclxuXHRcdFx0XHRcdFx0fVxyXG5cclxuXHRcdFx0XHRcdFx0Y29uc3QgZGIgPSBicnVzaC5kdWFsQnJ1c2g7XHJcblx0XHRcdFx0XHRcdGlmIChkYiAmJiBkYi51c2VEdWFsQnJ1c2gpIHtcclxuXHRcdFx0XHRcdFx0XHRiLmR1YWxCcnVzaCA9IHtcclxuXHRcdFx0XHRcdFx0XHRcdGZsaXA6IGRiLkZsaXAsXHJcblx0XHRcdFx0XHRcdFx0XHRzaGFwZTogcGFyc2VCcnVzaFNoYXBlKGRiLkJyc2gpLFxyXG5cdFx0XHRcdFx0XHRcdFx0YmxlbmRNb2RlOiBCbG5NLmRlY29kZShkYi5CbG5NKSxcclxuXHRcdFx0XHRcdFx0XHRcdHVzZVNjYXR0ZXI6IGRiLnVzZVNjYXR0ZXIsXHJcblx0XHRcdFx0XHRcdFx0XHRzcGFjaW5nOiBwYXJzZVBlcmNlbnQoZGIuU3BjbiksXHJcblx0XHRcdFx0XHRcdFx0XHRjb3VudDogZGJbJ0NudCAnXSxcclxuXHRcdFx0XHRcdFx0XHRcdGJvdGhBeGVzOiBkYi5ib3RoQXhlcyxcclxuXHRcdFx0XHRcdFx0XHRcdGNvdW50RHluYW1pY3M6IHBhcnNlRHluYW1pY3MoZGIuY291bnREeW5hbWljcyksXHJcblx0XHRcdFx0XHRcdFx0XHRzY2F0dGVyRHluYW1pY3M6IHBhcnNlRHluYW1pY3MoZGIuc2NhdHRlckR5bmFtaWNzKSxcclxuXHRcdFx0XHRcdFx0XHR9O1xyXG5cdFx0XHRcdFx0XHR9XHJcblxyXG5cdFx0XHRcdFx0XHRpZiAoYnJ1c2gudXNlQ29sb3JEeW5hbWljcykge1xyXG5cdFx0XHRcdFx0XHRcdGIuY29sb3JEeW5hbWljcyA9IHtcclxuXHRcdFx0XHRcdFx0XHRcdGZvcmVncm91bmRCYWNrZ3JvdW5kOiBwYXJzZUR5bmFtaWNzKGJydXNoLmNsVnIhKSxcclxuXHRcdFx0XHRcdFx0XHRcdGh1ZTogcGFyc2VQZXJjZW50KGJydXNoWydIICAgJ10hKSxcclxuXHRcdFx0XHRcdFx0XHRcdHNhdHVyYXRpb246IHBhcnNlUGVyY2VudChicnVzaC5TdHJ0ISksXHJcblx0XHRcdFx0XHRcdFx0XHRicmlnaHRuZXNzOiBwYXJzZVBlcmNlbnQoYnJ1c2guQnJnaCEpLFxyXG5cdFx0XHRcdFx0XHRcdFx0cHVyaXR5OiBwYXJzZVBlcmNlbnQoYnJ1c2gucHVyaXR5ISksXHJcblx0XHRcdFx0XHRcdFx0XHRwZXJUaXA6IGJydXNoLmNvbG9yRHluYW1pY3NQZXJUaXAhLFxyXG5cdFx0XHRcdFx0XHRcdH07XHJcblx0XHRcdFx0XHRcdH1cclxuXHJcblx0XHRcdFx0XHRcdGlmIChicnVzaC51c2VQYWludER5bmFtaWNzKSB7XHJcblx0XHRcdFx0XHRcdFx0Yi50cmFuc2ZlciA9IHtcclxuXHRcdFx0XHRcdFx0XHRcdGZsb3dEeW5hbWljczogcGFyc2VEeW5hbWljcyhicnVzaC5wclZyISksXHJcblx0XHRcdFx0XHRcdFx0XHRvcGFjaXR5RHluYW1pY3M6IHBhcnNlRHluYW1pY3MoYnJ1c2gub3BWciEpLFxyXG5cdFx0XHRcdFx0XHRcdFx0d2V0bmVzc0R5bmFtaWNzOiBwYXJzZUR5bmFtaWNzKGJydXNoLnd0VnIhKSxcclxuXHRcdFx0XHRcdFx0XHRcdG1peER5bmFtaWNzOiBwYXJzZUR5bmFtaWNzKGJydXNoLm14VnIhKSxcclxuXHRcdFx0XHRcdFx0XHR9O1xyXG5cdFx0XHRcdFx0XHR9XHJcblxyXG5cdFx0XHRcdFx0XHRpZiAoYnJ1c2gudXNlQnJ1c2hQb3NlKSB7XHJcblx0XHRcdFx0XHRcdFx0Yi5icnVzaFBvc2UgPSB7XHJcblx0XHRcdFx0XHRcdFx0XHRvdmVycmlkZUFuZ2xlOiBicnVzaC5vdmVycmlkZVBvc2VBbmdsZSEsXHJcblx0XHRcdFx0XHRcdFx0XHRvdmVycmlkZVRpbHRYOiBicnVzaC5vdmVycmlkZVBvc2VUaWx0WCEsXHJcblx0XHRcdFx0XHRcdFx0XHRvdmVycmlkZVRpbHRZOiBicnVzaC5vdmVycmlkZVBvc2VUaWx0WSEsXHJcblx0XHRcdFx0XHRcdFx0XHRvdmVycmlkZVByZXNzdXJlOiBicnVzaC5vdmVycmlkZVBvc2VQcmVzc3VyZSEsXHJcblx0XHRcdFx0XHRcdFx0XHRwcmVzc3VyZTogcGFyc2VQZXJjZW50KGJydXNoLmJydXNoUG9zZVByZXNzdXJlISksXHJcblx0XHRcdFx0XHRcdFx0XHR0aWx0WDogYnJ1c2guYnJ1c2hQb3NlVGlsdFghLFxyXG5cdFx0XHRcdFx0XHRcdFx0dGlsdFk6IGJydXNoLmJydXNoUG9zZVRpbHRZISxcclxuXHRcdFx0XHRcdFx0XHRcdGFuZ2xlOiBicnVzaC5icnVzaFBvc2VBbmdsZSEsXHJcblx0XHRcdFx0XHRcdFx0fTtcclxuXHRcdFx0XHRcdFx0fVxyXG5cclxuXHRcdFx0XHRcdFx0Y29uc3QgdG8gPSBicnVzaC50b29sT3B0aW9ucztcclxuXHRcdFx0XHRcdFx0aWYgKHRvKSB7XHJcblx0XHRcdFx0XHRcdFx0Yi50b29sT3B0aW9ucyA9IHtcclxuXHRcdFx0XHRcdFx0XHRcdGJydXNoUHJlc2V0OiB0by5icnVzaFByZXNldCxcclxuXHRcdFx0XHRcdFx0XHRcdGZsb3c6IHRvLmZsb3csXHJcblx0XHRcdFx0XHRcdFx0XHRzbW9vdGg6IHRvLlNtb28sXHJcblx0XHRcdFx0XHRcdFx0XHRtb2RlOiBCbG5NLmRlY29kZSh0b1snTWQgICddKSxcclxuXHRcdFx0XHRcdFx0XHRcdG9wYWNpdHk6IHRvLk9wY3QsXHJcblx0XHRcdFx0XHRcdFx0XHRzbW9vdGhpbmc6IHRvLnNtb290aGluZyxcclxuXHRcdFx0XHRcdFx0XHRcdHNtb290aGluZ1ZhbHVlOiB0by5zbW9vdGhpbmdWYWx1ZSxcclxuXHRcdFx0XHRcdFx0XHRcdHNtb290aGluZ1JhZGl1c01vZGU6IHRvLnNtb290aGluZ1JhZGl1c01vZGUsXHJcblx0XHRcdFx0XHRcdFx0XHRzbW9vdGhpbmdDYXRjaHVwOiB0by5zbW9vdGhpbmdDYXRjaHVwLFxyXG5cdFx0XHRcdFx0XHRcdFx0c21vb3RoaW5nQ2F0Y2h1cEF0RW5kOiB0by5zbW9vdGhpbmdDYXRjaHVwQXRFbmQsXHJcblx0XHRcdFx0XHRcdFx0XHRzbW9vdGhpbmdab29tQ29tcGVuc2F0aW9uOiB0by5zbW9vdGhpbmdab29tQ29tcGVuc2F0aW9uLFxyXG5cdFx0XHRcdFx0XHRcdFx0cHJlc3N1cmVTbW9vdGhpbmc6IHRvLnByZXNzdXJlU21vb3RoaW5nLFxyXG5cdFx0XHRcdFx0XHRcdFx0dXNlUHJlc3N1cmVPdmVycmlkZXNTaXplOiB0by51c2VQcmVzc3VyZU92ZXJyaWRlc1NpemUsXHJcblx0XHRcdFx0XHRcdFx0XHR1c2VQcmVzc3VyZU92ZXJyaWRlc09wYWNpdHk6IHRvLnVzZVByZXNzdXJlT3ZlcnJpZGVzT3BhY2l0eSxcclxuXHRcdFx0XHRcdFx0XHRcdHVzZUxlZ2FjeTogdG8udXNlTGVnYWN5LFxyXG5cdFx0XHRcdFx0XHRcdH07XHJcblx0XHRcdFx0XHRcdH1cclxuXHJcblx0XHRcdFx0XHRcdGJydXNoZXMucHVzaChiKTtcclxuXHRcdFx0XHRcdH1cclxuXHRcdFx0XHRcdGJyZWFrO1xyXG5cdFx0XHRcdH1cclxuXHRcdFx0XHRjYXNlICdwYXR0Jzoge1xyXG5cdFx0XHRcdFx0aWYgKHJlYWRlci5vZmZzZXQgPCBlbmQpIHsgLy8gVE9ETzogY2hlY2sgbXVsdGlwbGUgcGF0dGVybnNcclxuXHRcdFx0XHRcdFx0cGF0dGVybnMucHVzaChyZWFkUGF0dGVybihyZWFkZXIpKTtcclxuXHRcdFx0XHRcdFx0cmVhZGVyLm9mZnNldCA9IGVuZDtcclxuXHRcdFx0XHRcdH1cclxuXHRcdFx0XHRcdGJyZWFrO1xyXG5cdFx0XHRcdH1cclxuXHRcdFx0XHRjYXNlICdwaHJ5Jzoge1xyXG5cdFx0XHRcdFx0Ly8gVE9ETzogd2hhdCBpcyB0aGlzID9cclxuXHRcdFx0XHRcdGNvbnN0IGRlc2M6IFBocnlEZXNjcmlwdG9yID0gcmVhZFZlcnNpb25BbmREZXNjcmlwdG9yKHJlYWRlcik7XHJcblx0XHRcdFx0XHRpZiAob3B0aW9ucy5sb2dNaXNzaW5nRmVhdHVyZXMpIHtcclxuXHRcdFx0XHRcdFx0aWYgKGRlc2MuaGllcmFyY2h5Py5sZW5ndGgpIHtcclxuXHRcdFx0XHRcdFx0XHRjb25zb2xlLmxvZygndW5oYW5kbGVkIHBocnkgc2VjdGlvbicsIGRlc2MpO1xyXG5cdFx0XHRcdFx0XHR9XHJcblx0XHRcdFx0XHR9XHJcblx0XHRcdFx0XHRicmVhaztcclxuXHRcdFx0XHR9XHJcblx0XHRcdFx0ZGVmYXVsdDpcclxuXHRcdFx0XHRcdHRocm93IG5ldyBFcnJvcihgSW52YWxpZCBicnVzaCB0eXBlOiAke3R5cGV9YCk7XHJcblx0XHRcdH1cclxuXHJcblx0XHRcdC8vIGFsaWduIHRvIDQgYnl0ZXNcclxuXHRcdFx0d2hpbGUgKHNpemUgJSA0KSB7XHJcblx0XHRcdFx0cmVhZGVyLm9mZnNldCsrO1xyXG5cdFx0XHRcdHNpemUrKztcclxuXHRcdFx0fVxyXG5cdFx0fVxyXG5cdH0gZWxzZSB7XHJcblx0XHR0aHJvdyBuZXcgRXJyb3IoJ1Vuc3VwcG9ydGVkIEFCUiB2ZXJzaW9uJyk7XHJcblx0fVxyXG5cclxuXHRyZXR1cm4geyBzYW1wbGVzLCBwYXR0ZXJucywgYnJ1c2hlcyB9O1xyXG59XHJcbiJdLCJzb3VyY2VSb290IjoiL2hvbWUvbWFuaC9rYW9waXovZWVsL2FnLXBzZC9zcmMifQ==
