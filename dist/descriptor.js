"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.strokeStyleLineAlignment = exports.strokeStyleLineJoinType = exports.strokeStyleLineCapType = exports.FrFl = exports.FStl = exports.ClrS = exports.GrdT = exports.IGSr = exports.BETE = exports.BESs = exports.bvlT = exports.BESl = exports.BlnM = exports.warpStyle = exports.Annt = exports.Ornt = exports.textGridding = exports.unitsValue = exports.unitsPercent = exports.unitsAngle = exports.parseUnitsToNumber = exports.parseUnitsOrNumber = exports.parseUnits = exports.parsePercentOrAngle = exports.parsePercent = exports.parseAngle = exports.writeVersionAndDescriptor = exports.readVersionAndDescriptor = exports.writeDescriptorStructure = exports.readDescriptorStructure = exports.readAsciiStringOrClassId = exports.setLogErrors = void 0;
var helpers_1 = require("./helpers");
var psdReader_1 = require("./psdReader");
var psdWriter_1 = require("./psdWriter");
function revMap(map) {
    var result = {};
    Object.keys(map).forEach(function (key) { return result[map[key]] = key; });
    return result;
}
var unitsMap = {
    '#Ang': 'Angle',
    '#Rsl': 'Density',
    '#Rlt': 'Distance',
    '#Nne': 'None',
    '#Prc': 'Percent',
    '#Pxl': 'Pixels',
    '#Mlm': 'Millimeters',
    '#Pnt': 'Points',
    'RrPi': 'Picas',
    'RrIn': 'Inches',
    'RrCm': 'Centimeters',
};
var unitsMapRev = revMap(unitsMap);
var logErrors = false;
function setLogErrors(value) {
    logErrors = value;
}
exports.setLogErrors = setLogErrors;
function makeType(name, classID) {
    return { name: name, classID: classID };
}
var fieldToExtType = {
    strokeStyleContent: makeType('', 'solidColorLayer'),
    // printProofSetup: makeType('校样设置', 'proofSetup'), // TESTING
    printProofSetup: makeType('Proof Setup', 'proofSetup'),
    patternFill: makeType('', 'patternFill'),
    Grad: makeType('Gradient', 'Grdn'),
    ebbl: makeType('', 'ebbl'),
    SoFi: makeType('', 'SoFi'),
    GrFl: makeType('', 'GrFl'),
    sdwC: makeType('', 'RGBC'),
    hglC: makeType('', 'RGBC'),
    'Clr ': makeType('', 'RGBC'),
    'tintColor': makeType('', 'RGBC'),
    Ofst: makeType('', 'Pnt '),
    ChFX: makeType('', 'ChFX'),
    MpgS: makeType('', 'ShpC'),
    DrSh: makeType('', 'DrSh'),
    IrSh: makeType('', 'IrSh'),
    OrGl: makeType('', 'OrGl'),
    IrGl: makeType('', 'IrGl'),
    TrnS: makeType('', 'ShpC'),
    Ptrn: makeType('', 'Ptrn'),
    FrFX: makeType('', 'FrFX'),
    phase: makeType('', 'Pnt '),
    frameStep: makeType('', 'null'),
    duration: makeType('', 'null'),
    bounds: makeType('', 'Rctn'),
    customEnvelopeWarp: makeType('', 'customEnvelopeWarp'),
    warp: makeType('', 'warp'),
    'Sz  ': makeType('', 'Pnt '),
    origin: makeType('', 'Pnt '),
    autoExpandOffset: makeType('', 'Pnt '),
    keyOriginShapeBBox: makeType('', 'unitRect'),
    Vrsn: makeType('', 'null'),
    psVersion: makeType('', 'null'),
    docDefaultNewArtboardBackgroundColor: makeType('', 'RGBC'),
    artboardRect: makeType('', 'classFloatRect'),
    keyOriginRRectRadii: makeType('', 'radii'),
    keyOriginBoxCorners: makeType('', 'null'),
    rectangleCornerA: makeType('', 'Pnt '),
    rectangleCornerB: makeType('', 'Pnt '),
    rectangleCornerC: makeType('', 'Pnt '),
    rectangleCornerD: makeType('', 'Pnt '),
    compInfo: makeType('', 'null'),
    Trnf: makeType('Transform', 'Trnf'),
    quiltWarp: makeType('', 'quiltWarp'),
    generatorSettings: makeType('', 'null'),
    crema: makeType('', 'null'),
};
var fieldToArrayExtType = {
    'Crv ': makeType('', 'CrPt'),
    Clrs: makeType('', 'Clrt'),
    Trns: makeType('', 'TrnS'),
    keyDescriptorList: makeType('', 'null'),
    solidFillMulti: makeType('', 'SoFi'),
    gradientFillMulti: makeType('', 'GrFl'),
    dropShadowMulti: makeType('', 'DrSh'),
    innerShadowMulti: makeType('', 'IrSh'),
    frameFXMulti: makeType('', 'FrFX'),
};
var typeToField = {
    'TEXT': [
        'Txt ', 'printerName', 'Nm  ', 'Idnt', 'blackAndWhitePresetFileName', 'LUT3DFileName',
        'presetFileName', 'curvesPresetFileName', 'mixerPresetFileName', 'placed', 'description', 'reason',
        'artboardPresetName', 'json',
    ],
    'tdta': ['EngineData', 'LUT3DFileData'],
    'long': [
        'TextIndex', 'RndS', 'Mdpn', 'Smth', 'Lctn', 'strokeStyleVersion', 'LaID', 'Vrsn', 'Cnt ',
        'Brgh', 'Cntr', 'means', 'vibrance', 'Strt', 'bwPresetKind', 'presetKind', 'comp', 'compID', 'originalCompID',
        'curvesPresetKind', 'mixerPresetKind', 'uOrder', 'vOrder', 'PgNm', 'totalPages', 'Crop',
        'numerator', 'denominator', 'frameCount', 'Annt', 'keyOriginType', 'unitValueQuadVersion',
        'keyOriginIndex', 'major', 'minor', 'fix', 'docDefaultNewArtboardBackgroundType', 'artboardBackgroundType',
        'numModifyingFX', 'deformNumRows', 'deformNumCols',
    ],
    'enum': [
        'textGridding', 'Ornt', 'warpStyle', 'warpRotate', 'Inte', 'Bltn', 'ClrS',
        'sdwM', 'hglM', 'bvlT', 'bvlS', 'bvlD', 'Md  ', 'glwS', 'GrdF', 'GlwT',
        'strokeStyleLineCapType', 'strokeStyleLineJoinType', 'strokeStyleLineAlignment',
        'strokeStyleBlendMode', 'PntT', 'Styl', 'lookupType', 'LUTFormat', 'dataOrder',
        'tableOrder', 'enableCompCore', 'enableCompCoreGPU', 'compCoreSupport', 'compCoreGPUSupport', 'Engn',
        'enableCompCoreThreads',
    ],
    'bool': [
        'PstS', 'printSixteenBit', 'masterFXSwitch', 'enab', 'uglg', 'antialiasGloss',
        'useShape', 'useTexture', 'masterFXSwitch', 'uglg', 'antialiasGloss', 'useShape',
        'useTexture', 'Algn', 'Rvrs', 'Dthr', 'Invr', 'VctC', 'ShTr', 'layerConceals',
        'strokeEnabled', 'fillEnabled', 'strokeStyleScaleLock', 'strokeStyleStrokeAdjust',
        'hardProof', 'MpBl', 'paperWhite', 'useLegacy', 'Auto', 'Lab ', 'useTint', 'keyShapeInvalidated',
        'autoExpandEnabled', 'autoNestEnabled', 'autoPositionEnabled', 'shrinkwrapOnSaveEnabled',
        'present', 'showInDialog', 'overprint',
    ],
    'doub': [
        'warpValue', 'warpPerspective', 'warpPerspectiveOther', 'Intr', 'Wdth', 'Hght',
        'strokeStyleMiterLimit', 'strokeStyleResolution', 'layerTime', 'keyOriginResolution',
        'xx', 'xy', 'yx', 'yy', 'tx', 'ty',
    ],
    'UntF': [
        'Scl ', 'sdwO', 'hglO', 'lagl', 'Lald', 'srgR', 'blur', 'Sftn', 'Opct', 'Dstn', 'Angl',
        'Ckmt', 'Nose', 'Inpr', 'ShdN', 'strokeStyleLineWidth', 'strokeStyleLineDashOffset',
        'strokeStyleOpacity', 'H   ', 'Top ', 'Left', 'Btom', 'Rght', 'Rslt',
        'topRight', 'topLeft', 'bottomLeft', 'bottomRight',
    ],
    'VlLs': [
        'Crv ', 'Clrs', 'Mnm ', 'Mxm ', 'Trns', 'pathList', 'strokeStyleLineDashSet', 'FrLs',
        'LaSt', 'Trnf', 'nonAffineTransform', 'keyDescriptorList', 'guideIndeces', 'gradientFillMulti',
        'solidFillMulti', 'frameFXMulti', 'innerShadowMulti', 'dropShadowMulti',
    ],
    'ObAr': ['meshPoints', 'quiltSliceX', 'quiltSliceY'],
    'obj ': ['null'],
};
var channels = [
    'Rd  ', 'Grn ', 'Bl  ', 'Yllw', 'Ylw ', 'Cyn ', 'Mgnt', 'Blck', 'Gry ', 'Lmnc', 'A   ', 'B   ',
];
var fieldToArrayType = {
    'Mnm ': 'long',
    'Mxm ': 'long',
    'FrLs': 'long',
    'strokeStyleLineDashSet': 'UntF',
    'Trnf': 'doub',
    'nonAffineTransform': 'doub',
    'keyDescriptorList': 'Objc',
    'gradientFillMulti': 'Objc',
    'solidFillMulti': 'Objc',
    'frameFXMulti': 'Objc',
    'innerShadowMulti': 'Objc',
    'dropShadowMulti': 'Objc',
};
var fieldToType = {};
for (var _i = 0, _a = Object.keys(typeToField); _i < _a.length; _i++) {
    var type = _a[_i];
    for (var _b = 0, _c = typeToField[type]; _b < _c.length; _b++) {
        var field = _c[_b];
        fieldToType[field] = type;
    }
}
for (var _d = 0, _e = Object.keys(fieldToExtType); _d < _e.length; _d++) {
    var field = _e[_d];
    if (!fieldToType[field])
        fieldToType[field] = 'Objc';
}
for (var _f = 0, _g = Object.keys(fieldToArrayExtType); _f < _g.length; _f++) {
    var field = _g[_f];
    fieldToArrayType[field] = 'Objc';
}
function getTypeByKey(key, value, root) {
    if (key === 'Sz  ') {
        return ('Wdth' in value) ? 'Objc' : (('units' in value) ? 'UntF' : 'doub');
    }
    else if (key === 'Type') {
        return typeof value === 'string' ? 'enum' : 'long';
    }
    else if (key === 'AntA') {
        return typeof value === 'string' ? 'enum' : 'bool';
    }
    else if (key === 'Hrzn' || key === 'Vrtc' || key === 'Top ' || key === 'Left' || key === 'Btom' || key === 'Rght') {
        return typeof value === 'number' ? 'doub' : 'UntF';
    }
    else if (key === 'Vrsn') {
        return typeof value === 'number' ? 'long' : 'Objc';
    }
    else if (key === 'Rd  ' || key === 'Grn ' || key === 'Bl  ') {
        return root === 'artd' ? 'long' : 'doub';
    }
    else if (key === 'Trnf') {
        return Array.isArray(value) ? 'VlLs' : 'Objc';
    }
    else {
        return fieldToType[key];
    }
}
function readAsciiStringOrClassId(reader) {
    var length = psdReader_1.readInt32(reader);
    return psdReader_1.readAsciiString(reader, length || 4);
}
exports.readAsciiStringOrClassId = readAsciiStringOrClassId;
function writeAsciiStringOrClassId(writer, value) {
    if (value.length === 4 && value !== 'warp') {
        // write classId
        psdWriter_1.writeInt32(writer, 0);
        psdWriter_1.writeSignature(writer, value);
    }
    else {
        // write ascii string
        psdWriter_1.writeInt32(writer, value.length);
        for (var i = 0; i < value.length; i++) {
            psdWriter_1.writeUint8(writer, value.charCodeAt(i));
        }
    }
}
function readDescriptorStructure(reader) {
    var object = {};
    // object.__struct =
    readClassStructure(reader);
    var itemsCount = psdReader_1.readUint32(reader);
    for (var i = 0; i < itemsCount; i++) {
        var key = readAsciiStringOrClassId(reader);
        var type = psdReader_1.readSignature(reader);
        // console.log(`> '${key}' '${type}'`);
        var data = readOSType(reader, type);
        // if (!getTypeByKey(key, data)) console.log(`> '${key}' '${type}'`, data);
        object[key] = data;
    }
    // console.log('//', struct);
    return object;
}
exports.readDescriptorStructure = readDescriptorStructure;
function writeDescriptorStructure(writer, name, classId, value, root) {
    if (logErrors && !classId)
        console.log('Missing classId for: ', name, classId, value);
    // write class structure
    psdWriter_1.writeUnicodeStringWithPadding(writer, name);
    writeAsciiStringOrClassId(writer, classId);
    var keys = Object.keys(value);
    psdWriter_1.writeUint32(writer, keys.length);
    for (var _i = 0, keys_1 = keys; _i < keys_1.length; _i++) {
        var key = keys_1[_i];
        var type = getTypeByKey(key, value[key], root);
        var extType = fieldToExtType[key];
        if ((key === 'Strt' || key === 'Brgh') && 'H   ' in value) {
            type = 'doub';
        }
        else if (channels.indexOf(key) !== -1) {
            type = (classId === 'RGBC' && root !== 'artd') ? 'doub' : 'long';
        }
        else if (key === 'profile') {
            type = classId === 'printOutput' ? 'TEXT' : 'tdta';
        }
        else if (key === 'strokeStyleContent') {
            if (value[key]['Clr ']) {
                extType = makeType('', 'solidColorLayer');
            }
            else if (value[key].Grad) {
                extType = makeType('', 'gradientLayer');
            }
            else if (value[key].Ptrn) {
                extType = makeType('', 'patternLayer');
            }
            else {
                logErrors && console.log('Invalid strokeStyleContent value', value[key]);
            }
        }
        else if (key === 'bounds' && root === 'quiltWarp') {
            extType = makeType('', 'classFloatRect');
        }
        if (extType && extType.classID === 'RGBC') {
            if ('H   ' in value[key])
                extType = { classID: 'HSBC', name: '' };
            // TODO: other color spaces
        }
        writeAsciiStringOrClassId(writer, key);
        psdWriter_1.writeSignature(writer, type || 'long');
        writeOSType(writer, type || 'long', value[key], key, extType, root);
        if (logErrors && !type)
            console.log("Missing descriptor field type for: '" + key + "' in", value);
    }
}
exports.writeDescriptorStructure = writeDescriptorStructure;
function readOSType(reader, type) {
    switch (type) {
        case 'obj ': // Reference
            return readReferenceStructure(reader);
        case 'Objc': // Descriptor
        case 'GlbO': // GlobalObject same as Descriptor
            return readDescriptorStructure(reader);
        case 'VlLs': { // List
            var length_1 = psdReader_1.readInt32(reader);
            var items = [];
            for (var i = 0; i < length_1; i++) {
                var type_1 = psdReader_1.readSignature(reader);
                // console.log('  >', type);
                items.push(readOSType(reader, type_1));
            }
            return items;
        }
        case 'doub': // Double
            return psdReader_1.readFloat64(reader);
        case 'UntF': { // Unit double
            var units = psdReader_1.readSignature(reader);
            var value = psdReader_1.readFloat64(reader);
            if (!unitsMap[units])
                throw new Error("Invalid units: " + units);
            return { units: unitsMap[units], value: value };
        }
        case 'UnFl': { // Unit float
            var units = psdReader_1.readSignature(reader);
            var value = psdReader_1.readFloat32(reader);
            if (!unitsMap[units])
                throw new Error("Invalid units: " + units);
            return { units: unitsMap[units], value: value };
        }
        case 'TEXT': // String
            return psdReader_1.readUnicodeString(reader);
        case 'enum': { // Enumerated
            var type_2 = readAsciiStringOrClassId(reader);
            var value = readAsciiStringOrClassId(reader);
            return type_2 + "." + value;
        }
        case 'long': // Integer
            return psdReader_1.readInt32(reader);
        case 'comp': { // Large Integer
            var low = psdReader_1.readUint32(reader);
            var high = psdReader_1.readUint32(reader);
            return { low: low, high: high };
        }
        case 'bool': // Boolean
            return !!psdReader_1.readUint8(reader);
        case 'type': // Class
        case 'GlbC': // Class
            return readClassStructure(reader);
        case 'alis': { // Alias
            var length_2 = psdReader_1.readInt32(reader);
            return psdReader_1.readAsciiString(reader, length_2);
        }
        case 'tdta': { // Raw Data
            var length_3 = psdReader_1.readInt32(reader);
            return psdReader_1.readBytes(reader, length_3);
        }
        case 'ObAr': { // Object array
            psdReader_1.readInt32(reader); // version: 16
            psdReader_1.readUnicodeString(reader); // name: ''
            readAsciiStringOrClassId(reader); // 'rationalPoint'
            var length_4 = psdReader_1.readInt32(reader);
            var items = [];
            for (var i = 0; i < length_4; i++) {
                var type1 = readAsciiStringOrClassId(reader); // type Hrzn | Vrtc
                psdReader_1.readSignature(reader); // UnFl
                psdReader_1.readSignature(reader); // units ? '#Pxl'
                var valuesCount = psdReader_1.readInt32(reader);
                var values = [];
                for (var j = 0; j < valuesCount; j++) {
                    values.push(psdReader_1.readFloat64(reader));
                }
                items.push({ type: type1, values: values });
            }
            return items;
        }
        case 'Pth ': { // File path
            /*const length =*/ psdReader_1.readInt32(reader);
            var sig = psdReader_1.readSignature(reader);
            /*const pathSize =*/ psdReader_1.readInt32LE(reader);
            var charsCount = psdReader_1.readInt32LE(reader);
            var path = psdReader_1.readUnicodeStringWithLength(reader, charsCount);
            return { sig: sig, path: path };
        }
        default:
            throw new Error("Invalid TySh descriptor OSType: " + type + " at " + reader.offset.toString(16));
    }
}
var ObArTypes = {
    meshPoints: 'rationalPoint',
    quiltSliceX: 'UntF',
    quiltSliceY: 'UntF',
};
function writeOSType(writer, type, value, key, extType, root) {
    switch (type) {
        case 'obj ': // Reference
            writeReferenceStructure(writer, key, value);
            break;
        case 'Objc': // Descriptor
        case 'GlbO': // GlobalObject same as Descriptor
            if (!extType)
                throw new Error("Missing ext type for: '" + key + "' (" + JSON.stringify(value) + ")");
            writeDescriptorStructure(writer, extType.name, extType.classID, value, root);
            break;
        case 'VlLs': // List
            psdWriter_1.writeInt32(writer, value.length);
            for (var i = 0; i < value.length; i++) {
                var type_3 = fieldToArrayType[key];
                psdWriter_1.writeSignature(writer, type_3 || 'long');
                writeOSType(writer, type_3 || 'long', value[i], '', fieldToArrayExtType[key], root);
                if (logErrors && !type_3)
                    console.log("Missing descriptor array type for: '" + key + "' in", value);
            }
            break;
        case 'doub': // Double
            psdWriter_1.writeFloat64(writer, value);
            break;
        case 'UntF': // Unit double
            if (!unitsMapRev[value.units])
                throw new Error("Invalid units: " + value.units + " in " + key);
            psdWriter_1.writeSignature(writer, unitsMapRev[value.units]);
            psdWriter_1.writeFloat64(writer, value.value);
            break;
        case 'UnFl': // Unit float
            if (!unitsMapRev[value.units])
                throw new Error("Invalid units: " + value.units + " in " + key);
            psdWriter_1.writeSignature(writer, unitsMapRev[value.units]);
            psdWriter_1.writeFloat32(writer, value.value);
            break;
        case 'TEXT': // String
            psdWriter_1.writeUnicodeStringWithPadding(writer, value);
            break;
        case 'enum': { // Enumerated
            var _a = value.split('.'), _type = _a[0], val = _a[1];
            writeAsciiStringOrClassId(writer, _type);
            writeAsciiStringOrClassId(writer, val);
            break;
        }
        case 'long': // Integer
            psdWriter_1.writeInt32(writer, value);
            break;
        // case 'comp': // Large Integer
        // 	writeLargeInteger(reader);
        case 'bool': // Boolean
            psdWriter_1.writeUint8(writer, value ? 1 : 0);
            break;
        // case 'type': // Class
        // case 'GlbC': // Class
        // 	writeClassStructure(reader);
        // case 'alis': // Alias
        // 	writeAliasStructure(reader);
        case 'tdta': // Raw Data
            psdWriter_1.writeInt32(writer, value.byteLength);
            psdWriter_1.writeBytes(writer, value);
            break;
        case 'ObAr': { // Object array
            psdWriter_1.writeInt32(writer, 16); // version
            psdWriter_1.writeUnicodeStringWithPadding(writer, ''); // name
            var type_4 = ObArTypes[key];
            if (!type_4)
                throw new Error("Not implemented ObArType for: " + key);
            writeAsciiStringOrClassId(writer, type_4);
            psdWriter_1.writeInt32(writer, value.length);
            for (var i = 0; i < value.length; i++) {
                writeAsciiStringOrClassId(writer, value[i].type); // Hrzn | Vrtc
                psdWriter_1.writeSignature(writer, 'UnFl');
                psdWriter_1.writeSignature(writer, '#Pxl');
                psdWriter_1.writeInt32(writer, value[i].values.length);
                for (var j = 0; j < value[i].values.length; j++) {
                    psdWriter_1.writeFloat64(writer, value[i].values[j]);
                }
            }
            break;
        }
        // case 'Pth ': // File path
        // 	writeFilePath(reader);
        default:
            throw new Error("Not implemented descriptor OSType: " + type);
    }
}
function readReferenceStructure(reader) {
    var itemsCount = psdReader_1.readInt32(reader);
    var items = [];
    for (var i = 0; i < itemsCount; i++) {
        var type = psdReader_1.readSignature(reader);
        switch (type) {
            case 'prop': { // Property
                readClassStructure(reader);
                var keyID = readAsciiStringOrClassId(reader);
                items.push(keyID);
                break;
            }
            case 'Clss': // Class
                items.push(readClassStructure(reader));
                break;
            case 'Enmr': { // Enumerated Reference
                readClassStructure(reader);
                var typeID = readAsciiStringOrClassId(reader);
                var value = readAsciiStringOrClassId(reader);
                items.push(typeID + "." + value);
                break;
            }
            case 'rele': { // Offset
                // const { name, classID } =
                readClassStructure(reader);
                items.push(psdReader_1.readUint32(reader));
                break;
            }
            case 'Idnt': // Identifier
                items.push(psdReader_1.readInt32(reader));
                break;
            case 'indx': // Index
                items.push(psdReader_1.readInt32(reader));
                break;
            case 'name': { // Name
                readClassStructure(reader);
                items.push(psdReader_1.readUnicodeString(reader));
                break;
            }
            default:
                throw new Error("Invalid descriptor reference type: " + type);
        }
    }
    return items;
}
function writeReferenceStructure(writer, _key, items) {
    psdWriter_1.writeInt32(writer, items.length);
    for (var i = 0; i < items.length; i++) {
        var value = items[i];
        var type = 'unknown';
        if (typeof value === 'string') {
            if (/^[a-z]+\.[a-z]+$/i.test(value)) {
                type = 'Enmr';
            }
            else {
                type = 'name';
            }
        }
        psdWriter_1.writeSignature(writer, type);
        switch (type) {
            // case 'prop': // Property
            // case 'Clss': // Class
            case 'Enmr': { // Enumerated Reference
                var _a = value.split('.'), typeID = _a[0], enumValue = _a[1];
                writeClassStructure(writer, '\0', typeID);
                writeAsciiStringOrClassId(writer, typeID);
                writeAsciiStringOrClassId(writer, enumValue);
                break;
            }
            // case 'rele': // Offset
            // case 'Idnt': // Identifier
            // case 'indx': // Index
            case 'name': { // Name
                writeClassStructure(writer, '\0', 'Lyr ');
                psdWriter_1.writeUnicodeString(writer, value + '\0');
                break;
            }
            default:
                throw new Error("Invalid descriptor reference type: " + type);
        }
    }
    return items;
}
function readClassStructure(reader) {
    var name = psdReader_1.readUnicodeString(reader);
    var classID = readAsciiStringOrClassId(reader);
    // console.log({ name, classID });
    return { name: name, classID: classID };
}
function writeClassStructure(writer, name, classID) {
    psdWriter_1.writeUnicodeString(writer, name);
    writeAsciiStringOrClassId(writer, classID);
}
function readVersionAndDescriptor(reader) {
    var version = psdReader_1.readUint32(reader);
    if (version !== 16)
        throw new Error("Invalid descriptor version: " + version);
    var desc = readDescriptorStructure(reader);
    // console.log(require('util').inspect(desc, false, 99, true));
    return desc;
}
exports.readVersionAndDescriptor = readVersionAndDescriptor;
function writeVersionAndDescriptor(writer, name, classID, descriptor, root) {
    if (root === void 0) { root = ''; }
    psdWriter_1.writeUint32(writer, 16); // version
    writeDescriptorStructure(writer, name, classID, descriptor, root);
}
exports.writeVersionAndDescriptor = writeVersionAndDescriptor;
function parseAngle(x) {
    if (x === undefined)
        return 0;
    if (x.units !== 'Angle')
        throw new Error("Invalid units: " + x.units);
    return x.value;
}
exports.parseAngle = parseAngle;
function parsePercent(x) {
    if (x === undefined)
        return 1;
    if (x.units !== 'Percent')
        throw new Error("Invalid units: " + x.units);
    return x.value / 100;
}
exports.parsePercent = parsePercent;
function parsePercentOrAngle(x) {
    if (x === undefined)
        return 1;
    if (x.units === 'Percent')
        return x.value / 100;
    if (x.units === 'Angle')
        return x.value / 360;
    throw new Error("Invalid units: " + x.units);
}
exports.parsePercentOrAngle = parsePercentOrAngle;
function parseUnits(_a) {
    var units = _a.units, value = _a.value;
    if (units !== 'Pixels' && units !== 'Millimeters' && units !== 'Points' && units !== 'None' &&
        units !== 'Picas' && units !== 'Inches' && units !== 'Centimeters' && units !== 'Density') {
        throw new Error("Invalid units: " + JSON.stringify({ units: units, value: value }));
    }
    return { value: value, units: units };
}
exports.parseUnits = parseUnits;
function parseUnitsOrNumber(value, units) {
    if (units === void 0) { units = 'Pixels'; }
    if (typeof value === 'number')
        return { value: value, units: units };
    return parseUnits(value);
}
exports.parseUnitsOrNumber = parseUnitsOrNumber;
function parseUnitsToNumber(_a, expectedUnits) {
    var units = _a.units, value = _a.value;
    if (units !== expectedUnits)
        throw new Error("Invalid units: " + JSON.stringify({ units: units, value: value }));
    return value;
}
exports.parseUnitsToNumber = parseUnitsToNumber;
function unitsAngle(value) {
    return { units: 'Angle', value: value || 0 };
}
exports.unitsAngle = unitsAngle;
function unitsPercent(value) {
    return { units: 'Percent', value: Math.round((value || 0) * 100) };
}
exports.unitsPercent = unitsPercent;
function unitsValue(x, key) {
    if (x == null)
        return { units: 'Pixels', value: 0 };
    if (typeof x !== 'object')
        throw new Error("Invalid value: " + JSON.stringify(x) + " (key: " + key + ") (should have value and units)");
    var units = x.units, value = x.value;
    if (typeof value !== 'number')
        throw new Error("Invalid value in " + JSON.stringify(x) + " (key: " + key + ")");
    if (units !== 'Pixels' && units !== 'Millimeters' && units !== 'Points' && units !== 'None' &&
        units !== 'Picas' && units !== 'Inches' && units !== 'Centimeters' && units !== 'Density') {
        throw new Error("Invalid units in " + JSON.stringify(x) + " (key: " + key + ")");
    }
    return { units: units, value: value };
}
exports.unitsValue = unitsValue;
exports.textGridding = helpers_1.createEnum('textGridding', 'none', {
    none: 'None',
    round: 'Rnd ',
});
exports.Ornt = helpers_1.createEnum('Ornt', 'horizontal', {
    horizontal: 'Hrzn',
    vertical: 'Vrtc',
});
exports.Annt = helpers_1.createEnum('Annt', 'sharp', {
    none: 'Anno',
    sharp: 'antiAliasSharp',
    crisp: 'AnCr',
    strong: 'AnSt',
    smooth: 'AnSm',
    platform: 'antiAliasPlatformGray',
    platformLCD: 'antiAliasPlatformLCD',
});
exports.warpStyle = helpers_1.createEnum('warpStyle', 'none', {
    none: 'warpNone',
    arc: 'warpArc',
    arcLower: 'warpArcLower',
    arcUpper: 'warpArcUpper',
    arch: 'warpArch',
    bulge: 'warpBulge',
    shellLower: 'warpShellLower',
    shellUpper: 'warpShellUpper',
    flag: 'warpFlag',
    wave: 'warpWave',
    fish: 'warpFish',
    rise: 'warpRise',
    fisheye: 'warpFisheye',
    inflate: 'warpInflate',
    squeeze: 'warpSqueeze',
    twist: 'warpTwist',
    custom: 'warpCustom',
});
exports.BlnM = helpers_1.createEnum('BlnM', 'normal', {
    'normal': 'Nrml',
    'dissolve': 'Dslv',
    'darken': 'Drkn',
    'multiply': 'Mltp',
    'color burn': 'CBrn',
    'linear burn': 'linearBurn',
    'darker color': 'darkerColor',
    'lighten': 'Lghn',
    'screen': 'Scrn',
    'color dodge': 'CDdg',
    'linear dodge': 'linearDodge',
    'lighter color': 'lighterColor',
    'overlay': 'Ovrl',
    'soft light': 'SftL',
    'hard light': 'HrdL',
    'vivid light': 'vividLight',
    'linear light': 'linearLight',
    'pin light': 'pinLight',
    'hard mix': 'hardMix',
    'difference': 'Dfrn',
    'exclusion': 'Xclu',
    'subtract': 'blendSubtraction',
    'divide': 'blendDivide',
    'hue': 'H   ',
    'saturation': 'Strt',
    'color': 'Clr ',
    'luminosity': 'Lmns',
});
exports.BESl = helpers_1.createEnum('BESl', 'inner bevel', {
    'inner bevel': 'InrB',
    'outer bevel': 'OtrB',
    'emboss': 'Embs',
    'pillow emboss': 'PlEb',
    'stroke emboss': 'strokeEmboss',
});
exports.bvlT = helpers_1.createEnum('bvlT', 'smooth', {
    'smooth': 'SfBL',
    'chisel hard': 'PrBL',
    'chisel soft': 'Slmt',
});
exports.BESs = helpers_1.createEnum('BESs', 'up', {
    up: 'In  ',
    down: 'Out ',
});
exports.BETE = helpers_1.createEnum('BETE', 'softer', {
    softer: 'SfBL',
    precise: 'PrBL',
});
exports.IGSr = helpers_1.createEnum('IGSr', 'edge', {
    edge: 'SrcE',
    center: 'SrcC',
});
exports.GrdT = helpers_1.createEnum('GrdT', 'linear', {
    linear: 'Lnr ',
    radial: 'Rdl ',
    angle: 'Angl',
    reflected: 'Rflc',
    diamond: 'Dmnd',
});
exports.ClrS = helpers_1.createEnum('ClrS', 'rgb', {
    rgb: 'RGBC',
    hsb: 'HSBl',
    lab: 'LbCl',
});
exports.FStl = helpers_1.createEnum('FStl', 'outside', {
    outside: 'OutF',
    center: 'CtrF',
    inside: 'InsF'
});
exports.FrFl = helpers_1.createEnum('FrFl', 'color', {
    color: 'SClr',
    gradient: 'GrFl',
    pattern: 'Ptrn',
});
exports.strokeStyleLineCapType = helpers_1.createEnum('strokeStyleLineCapType', 'butt', {
    butt: 'strokeStyleButtCap',
    round: 'strokeStyleRoundCap',
    square: 'strokeStyleSquareCap',
});
exports.strokeStyleLineJoinType = helpers_1.createEnum('strokeStyleLineJoinType', 'miter', {
    miter: 'strokeStyleMiterJoin',
    round: 'strokeStyleRoundJoin',
    bevel: 'strokeStyleBevelJoin',
});
exports.strokeStyleLineAlignment = helpers_1.createEnum('strokeStyleLineAlignment', 'inside', {
    inside: 'strokeStyleAlignInside',
    center: 'strokeStyleAlignCenter',
    outside: 'strokeStyleAlignOutside',
});

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImRlc2NyaXB0b3IudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBQUEscUNBQXVDO0FBS3ZDLHlDQUdxQjtBQUNyQix5Q0FHcUI7QUFNckIsU0FBUyxNQUFNLENBQUMsR0FBUztJQUN4QixJQUFNLE1BQU0sR0FBUyxFQUFFLENBQUM7SUFDeEIsTUFBTSxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxPQUFPLENBQUMsVUFBQSxHQUFHLElBQUksT0FBQSxNQUFNLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDLEdBQUcsR0FBRyxFQUF0QixDQUFzQixDQUFDLENBQUM7SUFDeEQsT0FBTyxNQUFNLENBQUM7QUFDZixDQUFDO0FBRUQsSUFBTSxRQUFRLEdBQVM7SUFDdEIsTUFBTSxFQUFFLE9BQU87SUFDZixNQUFNLEVBQUUsU0FBUztJQUNqQixNQUFNLEVBQUUsVUFBVTtJQUNsQixNQUFNLEVBQUUsTUFBTTtJQUNkLE1BQU0sRUFBRSxTQUFTO0lBQ2pCLE1BQU0sRUFBRSxRQUFRO0lBQ2hCLE1BQU0sRUFBRSxhQUFhO0lBQ3JCLE1BQU0sRUFBRSxRQUFRO0lBQ2hCLE1BQU0sRUFBRSxPQUFPO0lBQ2YsTUFBTSxFQUFFLFFBQVE7SUFDaEIsTUFBTSxFQUFFLGFBQWE7Q0FDckIsQ0FBQztBQUVGLElBQU0sV0FBVyxHQUFHLE1BQU0sQ0FBQyxRQUFRLENBQUMsQ0FBQztBQUNyQyxJQUFJLFNBQVMsR0FBRyxLQUFLLENBQUM7QUFFdEIsU0FBZ0IsWUFBWSxDQUFDLEtBQWM7SUFDMUMsU0FBUyxHQUFHLEtBQUssQ0FBQztBQUNuQixDQUFDO0FBRkQsb0NBRUM7QUFFRCxTQUFTLFFBQVEsQ0FBQyxJQUFZLEVBQUUsT0FBZTtJQUM5QyxPQUFPLEVBQUUsSUFBSSxNQUFBLEVBQUUsT0FBTyxTQUFBLEVBQUUsQ0FBQztBQUMxQixDQUFDO0FBRUQsSUFBTSxjQUFjLEdBQWdCO0lBQ25DLGtCQUFrQixFQUFFLFFBQVEsQ0FBQyxFQUFFLEVBQUUsaUJBQWlCLENBQUM7SUFDbkQsOERBQThEO0lBQzlELGVBQWUsRUFBRSxRQUFRLENBQUMsYUFBYSxFQUFFLFlBQVksQ0FBQztJQUN0RCxXQUFXLEVBQUUsUUFBUSxDQUFDLEVBQUUsRUFBRSxhQUFhLENBQUM7SUFDeEMsSUFBSSxFQUFFLFFBQVEsQ0FBQyxVQUFVLEVBQUUsTUFBTSxDQUFDO0lBQ2xDLElBQUksRUFBRSxRQUFRLENBQUMsRUFBRSxFQUFFLE1BQU0sQ0FBQztJQUMxQixJQUFJLEVBQUUsUUFBUSxDQUFDLEVBQUUsRUFBRSxNQUFNLENBQUM7SUFDMUIsSUFBSSxFQUFFLFFBQVEsQ0FBQyxFQUFFLEVBQUUsTUFBTSxDQUFDO0lBQzFCLElBQUksRUFBRSxRQUFRLENBQUMsRUFBRSxFQUFFLE1BQU0sQ0FBQztJQUMxQixJQUFJLEVBQUUsUUFBUSxDQUFDLEVBQUUsRUFBRSxNQUFNLENBQUM7SUFDMUIsTUFBTSxFQUFFLFFBQVEsQ0FBQyxFQUFFLEVBQUUsTUFBTSxDQUFDO0lBQzVCLFdBQVcsRUFBRSxRQUFRLENBQUMsRUFBRSxFQUFFLE1BQU0sQ0FBQztJQUNqQyxJQUFJLEVBQUUsUUFBUSxDQUFDLEVBQUUsRUFBRSxNQUFNLENBQUM7SUFDMUIsSUFBSSxFQUFFLFFBQVEsQ0FBQyxFQUFFLEVBQUUsTUFBTSxDQUFDO0lBQzFCLElBQUksRUFBRSxRQUFRLENBQUMsRUFBRSxFQUFFLE1BQU0sQ0FBQztJQUMxQixJQUFJLEVBQUUsUUFBUSxDQUFDLEVBQUUsRUFBRSxNQUFNLENBQUM7SUFDMUIsSUFBSSxFQUFFLFFBQVEsQ0FBQyxFQUFFLEVBQUUsTUFBTSxDQUFDO0lBQzFCLElBQUksRUFBRSxRQUFRLENBQUMsRUFBRSxFQUFFLE1BQU0sQ0FBQztJQUMxQixJQUFJLEVBQUUsUUFBUSxDQUFDLEVBQUUsRUFBRSxNQUFNLENBQUM7SUFDMUIsSUFBSSxFQUFFLFFBQVEsQ0FBQyxFQUFFLEVBQUUsTUFBTSxDQUFDO0lBQzFCLElBQUksRUFBRSxRQUFRLENBQUMsRUFBRSxFQUFFLE1BQU0sQ0FBQztJQUMxQixJQUFJLEVBQUUsUUFBUSxDQUFDLEVBQUUsRUFBRSxNQUFNLENBQUM7SUFDMUIsS0FBSyxFQUFFLFFBQVEsQ0FBQyxFQUFFLEVBQUUsTUFBTSxDQUFDO0lBQzNCLFNBQVMsRUFBRSxRQUFRLENBQUMsRUFBRSxFQUFFLE1BQU0sQ0FBQztJQUMvQixRQUFRLEVBQUUsUUFBUSxDQUFDLEVBQUUsRUFBRSxNQUFNLENBQUM7SUFDOUIsTUFBTSxFQUFFLFFBQVEsQ0FBQyxFQUFFLEVBQUUsTUFBTSxDQUFDO0lBQzVCLGtCQUFrQixFQUFFLFFBQVEsQ0FBQyxFQUFFLEVBQUUsb0JBQW9CLENBQUM7SUFDdEQsSUFBSSxFQUFFLFFBQVEsQ0FBQyxFQUFFLEVBQUUsTUFBTSxDQUFDO0lBQzFCLE1BQU0sRUFBRSxRQUFRLENBQUMsRUFBRSxFQUFFLE1BQU0sQ0FBQztJQUM1QixNQUFNLEVBQUUsUUFBUSxDQUFDLEVBQUUsRUFBRSxNQUFNLENBQUM7SUFDNUIsZ0JBQWdCLEVBQUUsUUFBUSxDQUFDLEVBQUUsRUFBRSxNQUFNLENBQUM7SUFDdEMsa0JBQWtCLEVBQUUsUUFBUSxDQUFDLEVBQUUsRUFBRSxVQUFVLENBQUM7SUFDNUMsSUFBSSxFQUFFLFFBQVEsQ0FBQyxFQUFFLEVBQUUsTUFBTSxDQUFDO0lBQzFCLFNBQVMsRUFBRSxRQUFRLENBQUMsRUFBRSxFQUFFLE1BQU0sQ0FBQztJQUMvQixvQ0FBb0MsRUFBRSxRQUFRLENBQUMsRUFBRSxFQUFFLE1BQU0sQ0FBQztJQUMxRCxZQUFZLEVBQUUsUUFBUSxDQUFDLEVBQUUsRUFBRSxnQkFBZ0IsQ0FBQztJQUM1QyxtQkFBbUIsRUFBRSxRQUFRLENBQUMsRUFBRSxFQUFFLE9BQU8sQ0FBQztJQUMxQyxtQkFBbUIsRUFBRSxRQUFRLENBQUMsRUFBRSxFQUFFLE1BQU0sQ0FBQztJQUN6QyxnQkFBZ0IsRUFBRSxRQUFRLENBQUMsRUFBRSxFQUFFLE1BQU0sQ0FBQztJQUN0QyxnQkFBZ0IsRUFBRSxRQUFRLENBQUMsRUFBRSxFQUFFLE1BQU0sQ0FBQztJQUN0QyxnQkFBZ0IsRUFBRSxRQUFRLENBQUMsRUFBRSxFQUFFLE1BQU0sQ0FBQztJQUN0QyxnQkFBZ0IsRUFBRSxRQUFRLENBQUMsRUFBRSxFQUFFLE1BQU0sQ0FBQztJQUN0QyxRQUFRLEVBQUUsUUFBUSxDQUFDLEVBQUUsRUFBRSxNQUFNLENBQUM7SUFDOUIsSUFBSSxFQUFFLFFBQVEsQ0FBQyxXQUFXLEVBQUUsTUFBTSxDQUFDO0lBQ25DLFNBQVMsRUFBRSxRQUFRLENBQUMsRUFBRSxFQUFFLFdBQVcsQ0FBQztJQUNwQyxpQkFBaUIsRUFBRSxRQUFRLENBQUMsRUFBRSxFQUFFLE1BQU0sQ0FBQztJQUN2QyxLQUFLLEVBQUUsUUFBUSxDQUFDLEVBQUUsRUFBRSxNQUFNLENBQUM7Q0FDM0IsQ0FBQztBQUVGLElBQU0sbUJBQW1CLEdBQWdCO0lBQ3hDLE1BQU0sRUFBRSxRQUFRLENBQUMsRUFBRSxFQUFFLE1BQU0sQ0FBQztJQUM1QixJQUFJLEVBQUUsUUFBUSxDQUFDLEVBQUUsRUFBRSxNQUFNLENBQUM7SUFDMUIsSUFBSSxFQUFFLFFBQVEsQ0FBQyxFQUFFLEVBQUUsTUFBTSxDQUFDO0lBQzFCLGlCQUFpQixFQUFFLFFBQVEsQ0FBQyxFQUFFLEVBQUUsTUFBTSxDQUFDO0lBQ3ZDLGNBQWMsRUFBRSxRQUFRLENBQUMsRUFBRSxFQUFFLE1BQU0sQ0FBQztJQUNwQyxpQkFBaUIsRUFBRSxRQUFRLENBQUMsRUFBRSxFQUFFLE1BQU0sQ0FBQztJQUN2QyxlQUFlLEVBQUUsUUFBUSxDQUFDLEVBQUUsRUFBRSxNQUFNLENBQUM7SUFDckMsZ0JBQWdCLEVBQUUsUUFBUSxDQUFDLEVBQUUsRUFBRSxNQUFNLENBQUM7SUFDdEMsWUFBWSxFQUFFLFFBQVEsQ0FBQyxFQUFFLEVBQUUsTUFBTSxDQUFDO0NBQ2xDLENBQUM7QUFFRixJQUFNLFdBQVcsR0FBaUM7SUFDakQsTUFBTSxFQUFFO1FBQ1AsTUFBTSxFQUFFLGFBQWEsRUFBRSxNQUFNLEVBQUUsTUFBTSxFQUFFLDZCQUE2QixFQUFFLGVBQWU7UUFDckYsZ0JBQWdCLEVBQUUsc0JBQXNCLEVBQUUscUJBQXFCLEVBQUUsUUFBUSxFQUFFLGFBQWEsRUFBRSxRQUFRO1FBQ2xHLG9CQUFvQixFQUFFLE1BQU07S0FDNUI7SUFDRCxNQUFNLEVBQUUsQ0FBQyxZQUFZLEVBQUUsZUFBZSxDQUFDO0lBQ3ZDLE1BQU0sRUFBRTtRQUNQLFdBQVcsRUFBRSxNQUFNLEVBQUUsTUFBTSxFQUFFLE1BQU0sRUFBRSxNQUFNLEVBQUUsb0JBQW9CLEVBQUUsTUFBTSxFQUFFLE1BQU0sRUFBRSxNQUFNO1FBQ3pGLE1BQU0sRUFBRSxNQUFNLEVBQUUsT0FBTyxFQUFFLFVBQVUsRUFBRSxNQUFNLEVBQUUsY0FBYyxFQUFFLFlBQVksRUFBRSxNQUFNLEVBQUUsUUFBUSxFQUFFLGdCQUFnQjtRQUM3RyxrQkFBa0IsRUFBRSxpQkFBaUIsRUFBRSxRQUFRLEVBQUUsUUFBUSxFQUFFLE1BQU0sRUFBRSxZQUFZLEVBQUUsTUFBTTtRQUN2RixXQUFXLEVBQUUsYUFBYSxFQUFFLFlBQVksRUFBRSxNQUFNLEVBQUUsZUFBZSxFQUFFLHNCQUFzQjtRQUN6RixnQkFBZ0IsRUFBRSxPQUFPLEVBQUUsT0FBTyxFQUFFLEtBQUssRUFBRSxxQ0FBcUMsRUFBRSx3QkFBd0I7UUFDMUcsZ0JBQWdCLEVBQUUsZUFBZSxFQUFFLGVBQWU7S0FDbEQ7SUFDRCxNQUFNLEVBQUU7UUFDUCxjQUFjLEVBQUUsTUFBTSxFQUFFLFdBQVcsRUFBRSxZQUFZLEVBQUUsTUFBTSxFQUFFLE1BQU0sRUFBRSxNQUFNO1FBQ3pFLE1BQU0sRUFBRSxNQUFNLEVBQUUsTUFBTSxFQUFFLE1BQU0sRUFBRSxNQUFNLEVBQUUsTUFBTSxFQUFFLE1BQU0sRUFBRSxNQUFNLEVBQUUsTUFBTTtRQUN0RSx3QkFBd0IsRUFBRSx5QkFBeUIsRUFBRSwwQkFBMEI7UUFDL0Usc0JBQXNCLEVBQUUsTUFBTSxFQUFFLE1BQU0sRUFBRSxZQUFZLEVBQUUsV0FBVyxFQUFFLFdBQVc7UUFDOUUsWUFBWSxFQUFFLGdCQUFnQixFQUFFLG1CQUFtQixFQUFFLGlCQUFpQixFQUFFLG9CQUFvQixFQUFFLE1BQU07UUFDcEcsdUJBQXVCO0tBQ3ZCO0lBQ0QsTUFBTSxFQUFFO1FBQ1AsTUFBTSxFQUFFLGlCQUFpQixFQUFFLGdCQUFnQixFQUFFLE1BQU0sRUFBRSxNQUFNLEVBQUUsZ0JBQWdCO1FBQzdFLFVBQVUsRUFBRSxZQUFZLEVBQUUsZ0JBQWdCLEVBQUUsTUFBTSxFQUFFLGdCQUFnQixFQUFFLFVBQVU7UUFDaEYsWUFBWSxFQUFFLE1BQU0sRUFBRSxNQUFNLEVBQUUsTUFBTSxFQUFFLE1BQU0sRUFBRSxNQUFNLEVBQUUsTUFBTSxFQUFFLGVBQWU7UUFDN0UsZUFBZSxFQUFFLGFBQWEsRUFBRSxzQkFBc0IsRUFBRSx5QkFBeUI7UUFDakYsV0FBVyxFQUFFLE1BQU0sRUFBRSxZQUFZLEVBQUUsV0FBVyxFQUFFLE1BQU0sRUFBRSxNQUFNLEVBQUUsU0FBUyxFQUFFLHFCQUFxQjtRQUNoRyxtQkFBbUIsRUFBRSxpQkFBaUIsRUFBRSxxQkFBcUIsRUFBRSx5QkFBeUI7UUFDeEYsU0FBUyxFQUFFLGNBQWMsRUFBRSxXQUFXO0tBQ3RDO0lBQ0QsTUFBTSxFQUFFO1FBQ1AsV0FBVyxFQUFFLGlCQUFpQixFQUFFLHNCQUFzQixFQUFFLE1BQU0sRUFBRSxNQUFNLEVBQUUsTUFBTTtRQUM5RSx1QkFBdUIsRUFBRSx1QkFBdUIsRUFBRSxXQUFXLEVBQUUscUJBQXFCO1FBQ3BGLElBQUksRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUUsSUFBSTtLQUNsQztJQUNELE1BQU0sRUFBRTtRQUNQLE1BQU0sRUFBRSxNQUFNLEVBQUUsTUFBTSxFQUFFLE1BQU0sRUFBRSxNQUFNLEVBQUUsTUFBTSxFQUFFLE1BQU0sRUFBRSxNQUFNLEVBQUUsTUFBTSxFQUFFLE1BQU0sRUFBRSxNQUFNO1FBQ3RGLE1BQU0sRUFBRSxNQUFNLEVBQUUsTUFBTSxFQUFFLE1BQU0sRUFBRSxzQkFBc0IsRUFBRSwyQkFBMkI7UUFDbkYsb0JBQW9CLEVBQUUsTUFBTSxFQUFFLE1BQU0sRUFBRSxNQUFNLEVBQUUsTUFBTSxFQUFFLE1BQU0sRUFBRSxNQUFNO1FBQ3BFLFVBQVUsRUFBRSxTQUFTLEVBQUUsWUFBWSxFQUFFLGFBQWE7S0FDbEQ7SUFDRCxNQUFNLEVBQUU7UUFDUCxNQUFNLEVBQUUsTUFBTSxFQUFFLE1BQU0sRUFBRSxNQUFNLEVBQUUsTUFBTSxFQUFFLFVBQVUsRUFBRSx3QkFBd0IsRUFBRSxNQUFNO1FBQ3BGLE1BQU0sRUFBRSxNQUFNLEVBQUUsb0JBQW9CLEVBQUUsbUJBQW1CLEVBQUUsY0FBYyxFQUFFLG1CQUFtQjtRQUM5RixnQkFBZ0IsRUFBRSxjQUFjLEVBQUUsa0JBQWtCLEVBQUUsaUJBQWlCO0tBQ3ZFO0lBQ0QsTUFBTSxFQUFFLENBQUMsWUFBWSxFQUFFLGFBQWEsRUFBRSxhQUFhLENBQUM7SUFDcEQsTUFBTSxFQUFFLENBQUMsTUFBTSxDQUFDO0NBQ2hCLENBQUM7QUFFRixJQUFNLFFBQVEsR0FBRztJQUNoQixNQUFNLEVBQUUsTUFBTSxFQUFFLE1BQU0sRUFBRSxNQUFNLEVBQUUsTUFBTSxFQUFFLE1BQU0sRUFBRSxNQUFNLEVBQUUsTUFBTSxFQUFFLE1BQU0sRUFBRSxNQUFNLEVBQUUsTUFBTSxFQUFFLE1BQU07Q0FDOUYsQ0FBQztBQUVGLElBQU0sZ0JBQWdCLEdBQVM7SUFDOUIsTUFBTSxFQUFFLE1BQU07SUFDZCxNQUFNLEVBQUUsTUFBTTtJQUNkLE1BQU0sRUFBRSxNQUFNO0lBQ2Qsd0JBQXdCLEVBQUUsTUFBTTtJQUNoQyxNQUFNLEVBQUUsTUFBTTtJQUNkLG9CQUFvQixFQUFFLE1BQU07SUFDNUIsbUJBQW1CLEVBQUUsTUFBTTtJQUMzQixtQkFBbUIsRUFBRSxNQUFNO0lBQzNCLGdCQUFnQixFQUFFLE1BQU07SUFDeEIsY0FBYyxFQUFFLE1BQU07SUFDdEIsa0JBQWtCLEVBQUUsTUFBTTtJQUMxQixpQkFBaUIsRUFBRSxNQUFNO0NBQ3pCLENBQUM7QUFFRixJQUFNLFdBQVcsR0FBUyxFQUFFLENBQUM7QUFFN0IsS0FBbUIsVUFBd0IsRUFBeEIsS0FBQSxNQUFNLENBQUMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxFQUF4QixjQUF3QixFQUF4QixJQUF3QixFQUFFO0lBQXhDLElBQU0sSUFBSSxTQUFBO0lBQ2QsS0FBb0IsVUFBaUIsRUFBakIsS0FBQSxXQUFXLENBQUMsSUFBSSxDQUFDLEVBQWpCLGNBQWlCLEVBQWpCLElBQWlCLEVBQUU7UUFBbEMsSUFBTSxLQUFLLFNBQUE7UUFDZixXQUFXLENBQUMsS0FBSyxDQUFDLEdBQUcsSUFBSSxDQUFDO0tBQzFCO0NBQ0Q7QUFFRCxLQUFvQixVQUEyQixFQUEzQixLQUFBLE1BQU0sQ0FBQyxJQUFJLENBQUMsY0FBYyxDQUFDLEVBQTNCLGNBQTJCLEVBQTNCLElBQTJCLEVBQUU7SUFBNUMsSUFBTSxLQUFLLFNBQUE7SUFDZixJQUFJLENBQUMsV0FBVyxDQUFDLEtBQUssQ0FBQztRQUFFLFdBQVcsQ0FBQyxLQUFLLENBQUMsR0FBRyxNQUFNLENBQUM7Q0FDckQ7QUFFRCxLQUFvQixVQUFnQyxFQUFoQyxLQUFBLE1BQU0sQ0FBQyxJQUFJLENBQUMsbUJBQW1CLENBQUMsRUFBaEMsY0FBZ0MsRUFBaEMsSUFBZ0MsRUFBRTtJQUFqRCxJQUFNLEtBQUssU0FBQTtJQUNmLGdCQUFnQixDQUFDLEtBQUssQ0FBQyxHQUFHLE1BQU0sQ0FBQztDQUNqQztBQUVELFNBQVMsWUFBWSxDQUFDLEdBQVcsRUFBRSxLQUFVLEVBQUUsSUFBWTtJQUMxRCxJQUFJLEdBQUcsS0FBSyxNQUFNLEVBQUU7UUFDbkIsT0FBTyxDQUFDLE1BQU0sSUFBSSxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsT0FBTyxJQUFJLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxDQUFDO0tBQzNFO1NBQU0sSUFBSSxHQUFHLEtBQUssTUFBTSxFQUFFO1FBQzFCLE9BQU8sT0FBTyxLQUFLLEtBQUssUUFBUSxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQztLQUNuRDtTQUFNLElBQUksR0FBRyxLQUFLLE1BQU0sRUFBRTtRQUMxQixPQUFPLE9BQU8sS0FBSyxLQUFLLFFBQVEsQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUM7S0FDbkQ7U0FBTSxJQUFJLEdBQUcsS0FBSyxNQUFNLElBQUksR0FBRyxLQUFLLE1BQU0sSUFBSSxHQUFHLEtBQUssTUFBTSxJQUFJLEdBQUcsS0FBSyxNQUFNLElBQUksR0FBRyxLQUFLLE1BQU0sSUFBSSxHQUFHLEtBQUssTUFBTSxFQUFFO1FBQ3BILE9BQU8sT0FBTyxLQUFLLEtBQUssUUFBUSxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQztLQUNuRDtTQUFNLElBQUksR0FBRyxLQUFLLE1BQU0sRUFBRTtRQUMxQixPQUFPLE9BQU8sS0FBSyxLQUFLLFFBQVEsQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUM7S0FDbkQ7U0FBTSxJQUFJLEdBQUcsS0FBSyxNQUFNLElBQUksR0FBRyxLQUFLLE1BQU0sSUFBSSxHQUFHLEtBQUssTUFBTSxFQUFFO1FBQzlELE9BQU8sSUFBSSxLQUFLLE1BQU0sQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUM7S0FDekM7U0FBTSxJQUFJLEdBQUcsS0FBSyxNQUFNLEVBQUU7UUFDMUIsT0FBTyxLQUFLLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQztLQUM5QztTQUFNO1FBQ04sT0FBTyxXQUFXLENBQUMsR0FBRyxDQUFDLENBQUM7S0FDeEI7QUFDRixDQUFDO0FBRUQsU0FBZ0Isd0JBQXdCLENBQUMsTUFBaUI7SUFDekQsSUFBTSxNQUFNLEdBQUcscUJBQVMsQ0FBQyxNQUFNLENBQUMsQ0FBQztJQUNqQyxPQUFPLDJCQUFlLENBQUMsTUFBTSxFQUFFLE1BQU0sSUFBSSxDQUFDLENBQUMsQ0FBQztBQUM3QyxDQUFDO0FBSEQsNERBR0M7QUFFRCxTQUFTLHlCQUF5QixDQUFDLE1BQWlCLEVBQUUsS0FBYTtJQUNsRSxJQUFJLEtBQUssQ0FBQyxNQUFNLEtBQUssQ0FBQyxJQUFJLEtBQUssS0FBSyxNQUFNLEVBQUU7UUFDM0MsZ0JBQWdCO1FBQ2hCLHNCQUFVLENBQUMsTUFBTSxFQUFFLENBQUMsQ0FBQyxDQUFDO1FBQ3RCLDBCQUFjLENBQUMsTUFBTSxFQUFFLEtBQUssQ0FBQyxDQUFDO0tBQzlCO1NBQU07UUFDTixxQkFBcUI7UUFDckIsc0JBQVUsQ0FBQyxNQUFNLEVBQUUsS0FBSyxDQUFDLE1BQU0sQ0FBQyxDQUFDO1FBRWpDLEtBQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxLQUFLLENBQUMsTUFBTSxFQUFFLENBQUMsRUFBRSxFQUFFO1lBQ3RDLHNCQUFVLENBQUMsTUFBTSxFQUFFLEtBQUssQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztTQUN4QztLQUNEO0FBQ0YsQ0FBQztBQUVELFNBQWdCLHVCQUF1QixDQUFDLE1BQWlCO0lBQ3hELElBQU0sTUFBTSxHQUFRLEVBQUUsQ0FBQztJQUN2QixvQkFBb0I7SUFDcEIsa0JBQWtCLENBQUMsTUFBTSxDQUFDLENBQUM7SUFDM0IsSUFBTSxVQUFVLEdBQUcsc0JBQVUsQ0FBQyxNQUFNLENBQUMsQ0FBQztJQUV0QyxLQUFLLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsVUFBVSxFQUFFLENBQUMsRUFBRSxFQUFFO1FBQ3BDLElBQU0sR0FBRyxHQUFHLHdCQUF3QixDQUFDLE1BQU0sQ0FBQyxDQUFDO1FBQzdDLElBQU0sSUFBSSxHQUFHLHlCQUFhLENBQUMsTUFBTSxDQUFDLENBQUM7UUFDbkMsdUNBQXVDO1FBQ3ZDLElBQU0sSUFBSSxHQUFHLFVBQVUsQ0FBQyxNQUFNLEVBQUUsSUFBSSxDQUFDLENBQUM7UUFDdEMsMkVBQTJFO1FBQzNFLE1BQU0sQ0FBQyxHQUFHLENBQUMsR0FBRyxJQUFJLENBQUM7S0FDbkI7SUFDRCw2QkFBNkI7SUFDN0IsT0FBTyxNQUFNLENBQUM7QUFDZixDQUFDO0FBaEJELDBEQWdCQztBQUVELFNBQWdCLHdCQUF3QixDQUFDLE1BQWlCLEVBQUUsSUFBWSxFQUFFLE9BQWUsRUFBRSxLQUFVLEVBQUUsSUFBWTtJQUNsSCxJQUFJLFNBQVMsSUFBSSxDQUFDLE9BQU87UUFBRSxPQUFPLENBQUMsR0FBRyxDQUFDLHVCQUF1QixFQUFFLElBQUksRUFBRSxPQUFPLEVBQUUsS0FBSyxDQUFDLENBQUM7SUFFdEYsd0JBQXdCO0lBQ3hCLHlDQUE2QixDQUFDLE1BQU0sRUFBRSxJQUFJLENBQUMsQ0FBQztJQUM1Qyx5QkFBeUIsQ0FBQyxNQUFNLEVBQUUsT0FBTyxDQUFDLENBQUM7SUFFM0MsSUFBTSxJQUFJLEdBQUcsTUFBTSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQztJQUNoQyx1QkFBVyxDQUFDLE1BQU0sRUFBRSxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUM7SUFFakMsS0FBa0IsVUFBSSxFQUFKLGFBQUksRUFBSixrQkFBSSxFQUFKLElBQUksRUFBRTtRQUFuQixJQUFNLEdBQUcsYUFBQTtRQUNiLElBQUksSUFBSSxHQUFHLFlBQVksQ0FBQyxHQUFHLEVBQUUsS0FBSyxDQUFDLEdBQUcsQ0FBQyxFQUFFLElBQUksQ0FBQyxDQUFDO1FBQy9DLElBQUksT0FBTyxHQUFHLGNBQWMsQ0FBQyxHQUFHLENBQUMsQ0FBQztRQUVsQyxJQUFJLENBQUMsR0FBRyxLQUFLLE1BQU0sSUFBSSxHQUFHLEtBQUssTUFBTSxDQUFDLElBQUksTUFBTSxJQUFJLEtBQUssRUFBRTtZQUMxRCxJQUFJLEdBQUcsTUFBTSxDQUFDO1NBQ2Q7YUFBTSxJQUFJLFFBQVEsQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxDQUFDLEVBQUU7WUFDeEMsSUFBSSxHQUFHLENBQUMsT0FBTyxLQUFLLE1BQU0sSUFBSSxJQUFJLEtBQUssTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDO1NBQ2pFO2FBQU0sSUFBSSxHQUFHLEtBQUssU0FBUyxFQUFFO1lBQzdCLElBQUksR0FBRyxPQUFPLEtBQUssYUFBYSxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQztTQUNuRDthQUFNLElBQUksR0FBRyxLQUFLLG9CQUFvQixFQUFFO1lBQ3hDLElBQUksS0FBSyxDQUFDLEdBQUcsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxFQUFFO2dCQUN2QixPQUFPLEdBQUcsUUFBUSxDQUFDLEVBQUUsRUFBRSxpQkFBaUIsQ0FBQyxDQUFDO2FBQzFDO2lCQUFNLElBQUksS0FBSyxDQUFDLEdBQUcsQ0FBQyxDQUFDLElBQUksRUFBRTtnQkFDM0IsT0FBTyxHQUFHLFFBQVEsQ0FBQyxFQUFFLEVBQUUsZUFBZSxDQUFDLENBQUM7YUFDeEM7aUJBQU0sSUFBSSxLQUFLLENBQUMsR0FBRyxDQUFDLENBQUMsSUFBSSxFQUFFO2dCQUMzQixPQUFPLEdBQUcsUUFBUSxDQUFDLEVBQUUsRUFBRSxjQUFjLENBQUMsQ0FBQzthQUN2QztpQkFBTTtnQkFDTixTQUFTLElBQUksT0FBTyxDQUFDLEdBQUcsQ0FBQyxrQ0FBa0MsRUFBRSxLQUFLLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQzthQUN6RTtTQUNEO2FBQU0sSUFBSSxHQUFHLEtBQUssUUFBUSxJQUFJLElBQUksS0FBSyxXQUFXLEVBQUU7WUFDcEQsT0FBTyxHQUFHLFFBQVEsQ0FBQyxFQUFFLEVBQUUsZ0JBQWdCLENBQUMsQ0FBQztTQUN6QztRQUVELElBQUksT0FBTyxJQUFJLE9BQU8sQ0FBQyxPQUFPLEtBQUssTUFBTSxFQUFFO1lBQzFDLElBQUksTUFBTSxJQUFJLEtBQUssQ0FBQyxHQUFHLENBQUM7Z0JBQUUsT0FBTyxHQUFHLEVBQUUsT0FBTyxFQUFFLE1BQU0sRUFBRSxJQUFJLEVBQUUsRUFBRSxFQUFFLENBQUM7WUFDbEUsMkJBQTJCO1NBQzNCO1FBRUQseUJBQXlCLENBQUMsTUFBTSxFQUFFLEdBQUcsQ0FBQyxDQUFDO1FBQ3ZDLDBCQUFjLENBQUMsTUFBTSxFQUFFLElBQUksSUFBSSxNQUFNLENBQUMsQ0FBQztRQUN2QyxXQUFXLENBQUMsTUFBTSxFQUFFLElBQUksSUFBSSxNQUFNLEVBQUUsS0FBSyxDQUFDLEdBQUcsQ0FBQyxFQUFFLEdBQUcsRUFBRSxPQUFPLEVBQUUsSUFBSSxDQUFDLENBQUM7UUFDcEUsSUFBSSxTQUFTLElBQUksQ0FBQyxJQUFJO1lBQUUsT0FBTyxDQUFDLEdBQUcsQ0FBQyx5Q0FBdUMsR0FBRyxTQUFNLEVBQUUsS0FBSyxDQUFDLENBQUM7S0FDN0Y7QUFDRixDQUFDO0FBNUNELDREQTRDQztBQUVELFNBQVMsVUFBVSxDQUFDLE1BQWlCLEVBQUUsSUFBWTtJQUNsRCxRQUFRLElBQUksRUFBRTtRQUNiLEtBQUssTUFBTSxFQUFFLFlBQVk7WUFDeEIsT0FBTyxzQkFBc0IsQ0FBQyxNQUFNLENBQUMsQ0FBQztRQUN2QyxLQUFLLE1BQU0sQ0FBQyxDQUFDLGFBQWE7UUFDMUIsS0FBSyxNQUFNLEVBQUUsa0NBQWtDO1lBQzlDLE9BQU8sdUJBQXVCLENBQUMsTUFBTSxDQUFDLENBQUM7UUFDeEMsS0FBSyxNQUFNLENBQUMsQ0FBQyxFQUFFLE9BQU87WUFDckIsSUFBTSxRQUFNLEdBQUcscUJBQVMsQ0FBQyxNQUFNLENBQUMsQ0FBQztZQUNqQyxJQUFNLEtBQUssR0FBVSxFQUFFLENBQUM7WUFFeEIsS0FBSyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLFFBQU0sRUFBRSxDQUFDLEVBQUUsRUFBRTtnQkFDaEMsSUFBTSxNQUFJLEdBQUcseUJBQWEsQ0FBQyxNQUFNLENBQUMsQ0FBQztnQkFDbkMsNEJBQTRCO2dCQUM1QixLQUFLLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxNQUFNLEVBQUUsTUFBSSxDQUFDLENBQUMsQ0FBQzthQUNyQztZQUVELE9BQU8sS0FBSyxDQUFDO1NBQ2I7UUFDRCxLQUFLLE1BQU0sRUFBRSxTQUFTO1lBQ3JCLE9BQU8sdUJBQVcsQ0FBQyxNQUFNLENBQUMsQ0FBQztRQUM1QixLQUFLLE1BQU0sQ0FBQyxDQUFDLEVBQUUsY0FBYztZQUM1QixJQUFNLEtBQUssR0FBRyx5QkFBYSxDQUFDLE1BQU0sQ0FBQyxDQUFDO1lBQ3BDLElBQU0sS0FBSyxHQUFHLHVCQUFXLENBQUMsTUFBTSxDQUFDLENBQUM7WUFDbEMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxLQUFLLENBQUM7Z0JBQUUsTUFBTSxJQUFJLEtBQUssQ0FBQyxvQkFBa0IsS0FBTyxDQUFDLENBQUM7WUFDakUsT0FBTyxFQUFFLEtBQUssRUFBRSxRQUFRLENBQUMsS0FBSyxDQUFDLEVBQUUsS0FBSyxPQUFBLEVBQUUsQ0FBQztTQUN6QztRQUNELEtBQUssTUFBTSxDQUFDLENBQUMsRUFBRSxhQUFhO1lBQzNCLElBQU0sS0FBSyxHQUFHLHlCQUFhLENBQUMsTUFBTSxDQUFDLENBQUM7WUFDcEMsSUFBTSxLQUFLLEdBQUcsdUJBQVcsQ0FBQyxNQUFNLENBQUMsQ0FBQztZQUNsQyxJQUFJLENBQUMsUUFBUSxDQUFDLEtBQUssQ0FBQztnQkFBRSxNQUFNLElBQUksS0FBSyxDQUFDLG9CQUFrQixLQUFPLENBQUMsQ0FBQztZQUNqRSxPQUFPLEVBQUUsS0FBSyxFQUFFLFFBQVEsQ0FBQyxLQUFLLENBQUMsRUFBRSxLQUFLLE9BQUEsRUFBRSxDQUFDO1NBQ3pDO1FBQ0QsS0FBSyxNQUFNLEVBQUUsU0FBUztZQUNyQixPQUFPLDZCQUFpQixDQUFDLE1BQU0sQ0FBQyxDQUFDO1FBQ2xDLEtBQUssTUFBTSxDQUFDLENBQUMsRUFBRSxhQUFhO1lBQzNCLElBQU0sTUFBSSxHQUFHLHdCQUF3QixDQUFDLE1BQU0sQ0FBQyxDQUFDO1lBQzlDLElBQU0sS0FBSyxHQUFHLHdCQUF3QixDQUFDLE1BQU0sQ0FBQyxDQUFDO1lBQy9DLE9BQVUsTUFBSSxTQUFJLEtBQU8sQ0FBQztTQUMxQjtRQUNELEtBQUssTUFBTSxFQUFFLFVBQVU7WUFDdEIsT0FBTyxxQkFBUyxDQUFDLE1BQU0sQ0FBQyxDQUFDO1FBQzFCLEtBQUssTUFBTSxDQUFDLENBQUMsRUFBRSxnQkFBZ0I7WUFDOUIsSUFBTSxHQUFHLEdBQUcsc0JBQVUsQ0FBQyxNQUFNLENBQUMsQ0FBQztZQUMvQixJQUFNLElBQUksR0FBRyxzQkFBVSxDQUFDLE1BQU0sQ0FBQyxDQUFDO1lBQ2hDLE9BQU8sRUFBRSxHQUFHLEtBQUEsRUFBRSxJQUFJLE1BQUEsRUFBRSxDQUFDO1NBQ3JCO1FBQ0QsS0FBSyxNQUFNLEVBQUUsVUFBVTtZQUN0QixPQUFPLENBQUMsQ0FBQyxxQkFBUyxDQUFDLE1BQU0sQ0FBQyxDQUFDO1FBQzVCLEtBQUssTUFBTSxDQUFDLENBQUMsUUFBUTtRQUNyQixLQUFLLE1BQU0sRUFBRSxRQUFRO1lBQ3BCLE9BQU8sa0JBQWtCLENBQUMsTUFBTSxDQUFDLENBQUM7UUFDbkMsS0FBSyxNQUFNLENBQUMsQ0FBQyxFQUFFLFFBQVE7WUFDdEIsSUFBTSxRQUFNLEdBQUcscUJBQVMsQ0FBQyxNQUFNLENBQUMsQ0FBQztZQUNqQyxPQUFPLDJCQUFlLENBQUMsTUFBTSxFQUFFLFFBQU0sQ0FBQyxDQUFDO1NBQ3ZDO1FBQ0QsS0FBSyxNQUFNLENBQUMsQ0FBQyxFQUFFLFdBQVc7WUFDekIsSUFBTSxRQUFNLEdBQUcscUJBQVMsQ0FBQyxNQUFNLENBQUMsQ0FBQztZQUNqQyxPQUFPLHFCQUFTLENBQUMsTUFBTSxFQUFFLFFBQU0sQ0FBQyxDQUFDO1NBQ2pDO1FBQ0QsS0FBSyxNQUFNLENBQUMsQ0FBQyxFQUFFLGVBQWU7WUFDN0IscUJBQVMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLGNBQWM7WUFDakMsNkJBQWlCLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxXQUFXO1lBQ3RDLHdCQUF3QixDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsa0JBQWtCO1lBQ3BELElBQU0sUUFBTSxHQUFHLHFCQUFTLENBQUMsTUFBTSxDQUFDLENBQUM7WUFDakMsSUFBTSxLQUFLLEdBQVUsRUFBRSxDQUFDO1lBRXhCLEtBQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxRQUFNLEVBQUUsQ0FBQyxFQUFFLEVBQUU7Z0JBQ2hDLElBQU0sS0FBSyxHQUFHLHdCQUF3QixDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsbUJBQW1CO2dCQUNuRSx5QkFBYSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsT0FBTztnQkFFOUIseUJBQWEsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLGlCQUFpQjtnQkFDeEMsSUFBTSxXQUFXLEdBQUcscUJBQVMsQ0FBQyxNQUFNLENBQUMsQ0FBQztnQkFDdEMsSUFBTSxNQUFNLEdBQWEsRUFBRSxDQUFDO2dCQUM1QixLQUFLLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsV0FBVyxFQUFFLENBQUMsRUFBRSxFQUFFO29CQUNyQyxNQUFNLENBQUMsSUFBSSxDQUFDLHVCQUFXLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQztpQkFDakM7Z0JBRUQsS0FBSyxDQUFDLElBQUksQ0FBQyxFQUFFLElBQUksRUFBRSxLQUFLLEVBQUUsTUFBTSxRQUFBLEVBQUUsQ0FBQyxDQUFDO2FBQ3BDO1lBRUQsT0FBTyxLQUFLLENBQUM7U0FDYjtRQUNELEtBQUssTUFBTSxDQUFDLENBQUMsRUFBRSxZQUFZO1lBQzFCLGtCQUFrQixDQUFDLHFCQUFTLENBQUMsTUFBTSxDQUFDLENBQUM7WUFDckMsSUFBTSxHQUFHLEdBQUcseUJBQWEsQ0FBQyxNQUFNLENBQUMsQ0FBQztZQUNsQyxvQkFBb0IsQ0FBQyx1QkFBVyxDQUFDLE1BQU0sQ0FBQyxDQUFDO1lBQ3pDLElBQU0sVUFBVSxHQUFHLHVCQUFXLENBQUMsTUFBTSxDQUFDLENBQUM7WUFDdkMsSUFBTSxJQUFJLEdBQUcsdUNBQTJCLENBQUMsTUFBTSxFQUFFLFVBQVUsQ0FBQyxDQUFDO1lBQzdELE9BQU8sRUFBRSxHQUFHLEtBQUEsRUFBRSxJQUFJLE1BQUEsRUFBRSxDQUFDO1NBQ3JCO1FBQ0Q7WUFDQyxNQUFNLElBQUksS0FBSyxDQUFDLHFDQUFtQyxJQUFJLFlBQU8sTUFBTSxDQUFDLE1BQU0sQ0FBQyxRQUFRLENBQUMsRUFBRSxDQUFHLENBQUMsQ0FBQztLQUM3RjtBQUNGLENBQUM7QUFFRCxJQUFNLFNBQVMsR0FBMkM7SUFDekQsVUFBVSxFQUFFLGVBQWU7SUFDM0IsV0FBVyxFQUFFLE1BQU07SUFDbkIsV0FBVyxFQUFFLE1BQU07Q0FDbkIsQ0FBQztBQUVGLFNBQVMsV0FBVyxDQUFDLE1BQWlCLEVBQUUsSUFBWSxFQUFFLEtBQVUsRUFBRSxHQUFXLEVBQUUsT0FBZ0MsRUFBRSxJQUFZO0lBQzVILFFBQVEsSUFBSSxFQUFFO1FBQ2IsS0FBSyxNQUFNLEVBQUUsWUFBWTtZQUN4Qix1QkFBdUIsQ0FBQyxNQUFNLEVBQUUsR0FBRyxFQUFFLEtBQUssQ0FBQyxDQUFDO1lBQzVDLE1BQU07UUFDUCxLQUFLLE1BQU0sQ0FBQyxDQUFDLGFBQWE7UUFDMUIsS0FBSyxNQUFNLEVBQUUsa0NBQWtDO1lBQzlDLElBQUksQ0FBQyxPQUFPO2dCQUFFLE1BQU0sSUFBSSxLQUFLLENBQUMsNEJBQTBCLEdBQUcsV0FBTSxJQUFJLENBQUMsU0FBUyxDQUFDLEtBQUssQ0FBQyxNQUFHLENBQUMsQ0FBQztZQUMzRix3QkFBd0IsQ0FBQyxNQUFNLEVBQUUsT0FBTyxDQUFDLElBQUksRUFBRSxPQUFPLENBQUMsT0FBTyxFQUFFLEtBQUssRUFBRSxJQUFJLENBQUMsQ0FBQztZQUM3RSxNQUFNO1FBQ1AsS0FBSyxNQUFNLEVBQUUsT0FBTztZQUNuQixzQkFBVSxDQUFDLE1BQU0sRUFBRSxLQUFLLENBQUMsTUFBTSxDQUFDLENBQUM7WUFFakMsS0FBSyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLEtBQUssQ0FBQyxNQUFNLEVBQUUsQ0FBQyxFQUFFLEVBQUU7Z0JBQ3RDLElBQU0sTUFBSSxHQUFHLGdCQUFnQixDQUFDLEdBQUcsQ0FBQyxDQUFDO2dCQUNuQywwQkFBYyxDQUFDLE1BQU0sRUFBRSxNQUFJLElBQUksTUFBTSxDQUFDLENBQUM7Z0JBQ3ZDLFdBQVcsQ0FBQyxNQUFNLEVBQUUsTUFBSSxJQUFJLE1BQU0sRUFBRSxLQUFLLENBQUMsQ0FBQyxDQUFDLEVBQUUsRUFBRSxFQUFFLG1CQUFtQixDQUFDLEdBQUcsQ0FBQyxFQUFFLElBQUksQ0FBQyxDQUFDO2dCQUNsRixJQUFJLFNBQVMsSUFBSSxDQUFDLE1BQUk7b0JBQUUsT0FBTyxDQUFDLEdBQUcsQ0FBQyx5Q0FBdUMsR0FBRyxTQUFNLEVBQUUsS0FBSyxDQUFDLENBQUM7YUFDN0Y7WUFDRCxNQUFNO1FBQ1AsS0FBSyxNQUFNLEVBQUUsU0FBUztZQUNyQix3QkFBWSxDQUFDLE1BQU0sRUFBRSxLQUFLLENBQUMsQ0FBQztZQUM1QixNQUFNO1FBQ1AsS0FBSyxNQUFNLEVBQUUsY0FBYztZQUMxQixJQUFJLENBQUMsV0FBVyxDQUFDLEtBQUssQ0FBQyxLQUFLLENBQUM7Z0JBQUUsTUFBTSxJQUFJLEtBQUssQ0FBQyxvQkFBa0IsS0FBSyxDQUFDLEtBQUssWUFBTyxHQUFLLENBQUMsQ0FBQztZQUMxRiwwQkFBYyxDQUFDLE1BQU0sRUFBRSxXQUFXLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUM7WUFDakQsd0JBQVksQ0FBQyxNQUFNLEVBQUUsS0FBSyxDQUFDLEtBQUssQ0FBQyxDQUFDO1lBQ2xDLE1BQU07UUFDUCxLQUFLLE1BQU0sRUFBRSxhQUFhO1lBQ3pCLElBQUksQ0FBQyxXQUFXLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQztnQkFBRSxNQUFNLElBQUksS0FBSyxDQUFDLG9CQUFrQixLQUFLLENBQUMsS0FBSyxZQUFPLEdBQUssQ0FBQyxDQUFDO1lBQzFGLDBCQUFjLENBQUMsTUFBTSxFQUFFLFdBQVcsQ0FBQyxLQUFLLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQztZQUNqRCx3QkFBWSxDQUFDLE1BQU0sRUFBRSxLQUFLLENBQUMsS0FBSyxDQUFDLENBQUM7WUFDbEMsTUFBTTtRQUNQLEtBQUssTUFBTSxFQUFFLFNBQVM7WUFDckIseUNBQTZCLENBQUMsTUFBTSxFQUFFLEtBQUssQ0FBQyxDQUFDO1lBQzdDLE1BQU07UUFDUCxLQUFLLE1BQU0sQ0FBQyxDQUFDLEVBQUUsYUFBYTtZQUNyQixJQUFBLEtBQWUsS0FBSyxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsRUFBOUIsS0FBSyxRQUFBLEVBQUUsR0FBRyxRQUFvQixDQUFDO1lBQ3RDLHlCQUF5QixDQUFDLE1BQU0sRUFBRSxLQUFLLENBQUMsQ0FBQztZQUN6Qyx5QkFBeUIsQ0FBQyxNQUFNLEVBQUUsR0FBRyxDQUFDLENBQUM7WUFDdkMsTUFBTTtTQUNOO1FBQ0QsS0FBSyxNQUFNLEVBQUUsVUFBVTtZQUN0QixzQkFBVSxDQUFDLE1BQU0sRUFBRSxLQUFLLENBQUMsQ0FBQztZQUMxQixNQUFNO1FBQ1AsZ0NBQWdDO1FBQ2hDLDhCQUE4QjtRQUM5QixLQUFLLE1BQU0sRUFBRSxVQUFVO1lBQ3RCLHNCQUFVLENBQUMsTUFBTSxFQUFFLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUNsQyxNQUFNO1FBQ1Asd0JBQXdCO1FBQ3hCLHdCQUF3QjtRQUN4QixnQ0FBZ0M7UUFDaEMsd0JBQXdCO1FBQ3hCLGdDQUFnQztRQUNoQyxLQUFLLE1BQU0sRUFBRSxXQUFXO1lBQ3ZCLHNCQUFVLENBQUMsTUFBTSxFQUFFLEtBQUssQ0FBQyxVQUFVLENBQUMsQ0FBQztZQUNyQyxzQkFBVSxDQUFDLE1BQU0sRUFBRSxLQUFLLENBQUMsQ0FBQztZQUMxQixNQUFNO1FBQ1AsS0FBSyxNQUFNLENBQUMsQ0FBQyxFQUFFLGVBQWU7WUFDN0Isc0JBQVUsQ0FBQyxNQUFNLEVBQUUsRUFBRSxDQUFDLENBQUMsQ0FBQyxVQUFVO1lBQ2xDLHlDQUE2QixDQUFDLE1BQU0sRUFBRSxFQUFFLENBQUMsQ0FBQyxDQUFDLE9BQU87WUFDbEQsSUFBTSxNQUFJLEdBQUcsU0FBUyxDQUFDLEdBQUcsQ0FBQyxDQUFDO1lBQzVCLElBQUksQ0FBQyxNQUFJO2dCQUFFLE1BQU0sSUFBSSxLQUFLLENBQUMsbUNBQWlDLEdBQUssQ0FBQyxDQUFDO1lBQ25FLHlCQUF5QixDQUFDLE1BQU0sRUFBRSxNQUFJLENBQUMsQ0FBQztZQUN4QyxzQkFBVSxDQUFDLE1BQU0sRUFBRSxLQUFLLENBQUMsTUFBTSxDQUFDLENBQUM7WUFFakMsS0FBSyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLEtBQUssQ0FBQyxNQUFNLEVBQUUsQ0FBQyxFQUFFLEVBQUU7Z0JBQ3RDLHlCQUF5QixDQUFDLE1BQU0sRUFBRSxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxjQUFjO2dCQUNoRSwwQkFBYyxDQUFDLE1BQU0sRUFBRSxNQUFNLENBQUMsQ0FBQztnQkFDL0IsMEJBQWMsQ0FBQyxNQUFNLEVBQUUsTUFBTSxDQUFDLENBQUM7Z0JBQy9CLHNCQUFVLENBQUMsTUFBTSxFQUFFLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsTUFBTSxDQUFDLENBQUM7Z0JBRTNDLEtBQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLE1BQU0sRUFBRSxDQUFDLEVBQUUsRUFBRTtvQkFDaEQsd0JBQVksQ0FBQyxNQUFNLEVBQUUsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO2lCQUN6QzthQUNEO1lBQ0QsTUFBTTtTQUNOO1FBQ0QsNEJBQTRCO1FBQzVCLDBCQUEwQjtRQUMxQjtZQUNDLE1BQU0sSUFBSSxLQUFLLENBQUMsd0NBQXNDLElBQU0sQ0FBQyxDQUFDO0tBQy9EO0FBQ0YsQ0FBQztBQUVELFNBQVMsc0JBQXNCLENBQUMsTUFBaUI7SUFDaEQsSUFBTSxVQUFVLEdBQUcscUJBQVMsQ0FBQyxNQUFNLENBQUMsQ0FBQztJQUNyQyxJQUFNLEtBQUssR0FBVSxFQUFFLENBQUM7SUFFeEIsS0FBSyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLFVBQVUsRUFBRSxDQUFDLEVBQUUsRUFBRTtRQUNwQyxJQUFNLElBQUksR0FBRyx5QkFBYSxDQUFDLE1BQU0sQ0FBQyxDQUFDO1FBRW5DLFFBQVEsSUFBSSxFQUFFO1lBQ2IsS0FBSyxNQUFNLENBQUMsQ0FBQyxFQUFFLFdBQVc7Z0JBQ3pCLGtCQUFrQixDQUFDLE1BQU0sQ0FBQyxDQUFDO2dCQUMzQixJQUFNLEtBQUssR0FBRyx3QkFBd0IsQ0FBQyxNQUFNLENBQUMsQ0FBQztnQkFDL0MsS0FBSyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQztnQkFDbEIsTUFBTTthQUNOO1lBQ0QsS0FBSyxNQUFNLEVBQUUsUUFBUTtnQkFDcEIsS0FBSyxDQUFDLElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDO2dCQUN2QyxNQUFNO1lBQ1AsS0FBSyxNQUFNLENBQUMsQ0FBQyxFQUFFLHVCQUF1QjtnQkFDckMsa0JBQWtCLENBQUMsTUFBTSxDQUFDLENBQUM7Z0JBQzNCLElBQU0sTUFBTSxHQUFHLHdCQUF3QixDQUFDLE1BQU0sQ0FBQyxDQUFDO2dCQUNoRCxJQUFNLEtBQUssR0FBRyx3QkFBd0IsQ0FBQyxNQUFNLENBQUMsQ0FBQztnQkFDL0MsS0FBSyxDQUFDLElBQUksQ0FBSSxNQUFNLFNBQUksS0FBTyxDQUFDLENBQUM7Z0JBQ2pDLE1BQU07YUFDTjtZQUNELEtBQUssTUFBTSxDQUFDLENBQUMsRUFBRSxTQUFTO2dCQUN2Qiw0QkFBNEI7Z0JBQzVCLGtCQUFrQixDQUFDLE1BQU0sQ0FBQyxDQUFDO2dCQUMzQixLQUFLLENBQUMsSUFBSSxDQUFDLHNCQUFVLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQztnQkFDL0IsTUFBTTthQUNOO1lBQ0QsS0FBSyxNQUFNLEVBQUUsYUFBYTtnQkFDekIsS0FBSyxDQUFDLElBQUksQ0FBQyxxQkFBUyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUM7Z0JBQzlCLE1BQU07WUFDUCxLQUFLLE1BQU0sRUFBRSxRQUFRO2dCQUNwQixLQUFLLENBQUMsSUFBSSxDQUFDLHFCQUFTLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQztnQkFDOUIsTUFBTTtZQUNQLEtBQUssTUFBTSxDQUFDLENBQUMsRUFBRSxPQUFPO2dCQUNyQixrQkFBa0IsQ0FBQyxNQUFNLENBQUMsQ0FBQztnQkFDM0IsS0FBSyxDQUFDLElBQUksQ0FBQyw2QkFBaUIsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDO2dCQUN0QyxNQUFNO2FBQ047WUFDRDtnQkFDQyxNQUFNLElBQUksS0FBSyxDQUFDLHdDQUFzQyxJQUFNLENBQUMsQ0FBQztTQUMvRDtLQUNEO0lBRUQsT0FBTyxLQUFLLENBQUM7QUFDZCxDQUFDO0FBRUQsU0FBUyx1QkFBdUIsQ0FBQyxNQUFpQixFQUFFLElBQVksRUFBRSxLQUFZO0lBQzdFLHNCQUFVLENBQUMsTUFBTSxFQUFFLEtBQUssQ0FBQyxNQUFNLENBQUMsQ0FBQztJQUVqQyxLQUFLLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsS0FBSyxDQUFDLE1BQU0sRUFBRSxDQUFDLEVBQUUsRUFBRTtRQUN0QyxJQUFNLEtBQUssR0FBRyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDdkIsSUFBSSxJQUFJLEdBQUcsU0FBUyxDQUFDO1FBRXJCLElBQUksT0FBTyxLQUFLLEtBQUssUUFBUSxFQUFFO1lBQzlCLElBQUksbUJBQW1CLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxFQUFFO2dCQUNwQyxJQUFJLEdBQUcsTUFBTSxDQUFDO2FBQ2Q7aUJBQU07Z0JBQ04sSUFBSSxHQUFHLE1BQU0sQ0FBQzthQUNkO1NBQ0Q7UUFFRCwwQkFBYyxDQUFDLE1BQU0sRUFBRSxJQUFJLENBQUMsQ0FBQztRQUU3QixRQUFRLElBQUksRUFBRTtZQUNiLDJCQUEyQjtZQUMzQix3QkFBd0I7WUFDeEIsS0FBSyxNQUFNLENBQUMsQ0FBQyxFQUFFLHVCQUF1QjtnQkFDL0IsSUFBQSxLQUFzQixLQUFLLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxFQUFyQyxNQUFNLFFBQUEsRUFBRSxTQUFTLFFBQW9CLENBQUM7Z0JBQzdDLG1CQUFtQixDQUFDLE1BQU0sRUFBRSxJQUFJLEVBQUUsTUFBTSxDQUFDLENBQUM7Z0JBQzFDLHlCQUF5QixDQUFDLE1BQU0sRUFBRSxNQUFNLENBQUMsQ0FBQztnQkFDMUMseUJBQXlCLENBQUMsTUFBTSxFQUFFLFNBQVMsQ0FBQyxDQUFDO2dCQUM3QyxNQUFNO2FBQ047WUFDRCx5QkFBeUI7WUFDekIsNkJBQTZCO1lBQzdCLHdCQUF3QjtZQUN4QixLQUFLLE1BQU0sQ0FBQyxDQUFDLEVBQUUsT0FBTztnQkFDckIsbUJBQW1CLENBQUMsTUFBTSxFQUFFLElBQUksRUFBRSxNQUFNLENBQUMsQ0FBQztnQkFDMUMsOEJBQWtCLENBQUMsTUFBTSxFQUFFLEtBQUssR0FBRyxJQUFJLENBQUMsQ0FBQztnQkFDekMsTUFBTTthQUNOO1lBQ0Q7Z0JBQ0MsTUFBTSxJQUFJLEtBQUssQ0FBQyx3Q0FBc0MsSUFBTSxDQUFDLENBQUM7U0FDL0Q7S0FDRDtJQUVELE9BQU8sS0FBSyxDQUFDO0FBQ2QsQ0FBQztBQUVELFNBQVMsa0JBQWtCLENBQUMsTUFBaUI7SUFDNUMsSUFBTSxJQUFJLEdBQUcsNkJBQWlCLENBQUMsTUFBTSxDQUFDLENBQUM7SUFDdkMsSUFBTSxPQUFPLEdBQUcsd0JBQXdCLENBQUMsTUFBTSxDQUFDLENBQUM7SUFDakQsa0NBQWtDO0lBQ2xDLE9BQU8sRUFBRSxJQUFJLE1BQUEsRUFBRSxPQUFPLFNBQUEsRUFBRSxDQUFDO0FBQzFCLENBQUM7QUFFRCxTQUFTLG1CQUFtQixDQUFDLE1BQWlCLEVBQUUsSUFBWSxFQUFFLE9BQWU7SUFDNUUsOEJBQWtCLENBQUMsTUFBTSxFQUFFLElBQUksQ0FBQyxDQUFDO0lBQ2pDLHlCQUF5QixDQUFDLE1BQU0sRUFBRSxPQUFPLENBQUMsQ0FBQztBQUM1QyxDQUFDO0FBRUQsU0FBZ0Isd0JBQXdCLENBQUMsTUFBaUI7SUFDekQsSUFBTSxPQUFPLEdBQUcsc0JBQVUsQ0FBQyxNQUFNLENBQUMsQ0FBQztJQUNuQyxJQUFJLE9BQU8sS0FBSyxFQUFFO1FBQUUsTUFBTSxJQUFJLEtBQUssQ0FBQyxpQ0FBK0IsT0FBUyxDQUFDLENBQUM7SUFDOUUsSUFBTSxJQUFJLEdBQUcsdUJBQXVCLENBQUMsTUFBTSxDQUFDLENBQUM7SUFDN0MsK0RBQStEO0lBQy9ELE9BQU8sSUFBSSxDQUFDO0FBQ2IsQ0FBQztBQU5ELDREQU1DO0FBRUQsU0FBZ0IseUJBQXlCLENBQUMsTUFBaUIsRUFBRSxJQUFZLEVBQUUsT0FBZSxFQUFFLFVBQWUsRUFBRSxJQUFTO0lBQVQscUJBQUEsRUFBQSxTQUFTO0lBQ3JILHVCQUFXLENBQUMsTUFBTSxFQUFFLEVBQUUsQ0FBQyxDQUFDLENBQUMsVUFBVTtJQUNuQyx3QkFBd0IsQ0FBQyxNQUFNLEVBQUUsSUFBSSxFQUFFLE9BQU8sRUFBRSxVQUFVLEVBQUUsSUFBSSxDQUFDLENBQUM7QUFDbkUsQ0FBQztBQUhELDhEQUdDO0FBMkpELFNBQWdCLFVBQVUsQ0FBQyxDQUF1QjtJQUNqRCxJQUFJLENBQUMsS0FBSyxTQUFTO1FBQUUsT0FBTyxDQUFDLENBQUM7SUFDOUIsSUFBSSxDQUFDLENBQUMsS0FBSyxLQUFLLE9BQU87UUFBRSxNQUFNLElBQUksS0FBSyxDQUFDLG9CQUFrQixDQUFDLENBQUMsS0FBTyxDQUFDLENBQUM7SUFDdEUsT0FBTyxDQUFDLENBQUMsS0FBSyxDQUFDO0FBQ2hCLENBQUM7QUFKRCxnQ0FJQztBQUVELFNBQWdCLFlBQVksQ0FBQyxDQUFtQztJQUMvRCxJQUFJLENBQUMsS0FBSyxTQUFTO1FBQUUsT0FBTyxDQUFDLENBQUM7SUFDOUIsSUFBSSxDQUFDLENBQUMsS0FBSyxLQUFLLFNBQVM7UUFBRSxNQUFNLElBQUksS0FBSyxDQUFDLG9CQUFrQixDQUFDLENBQUMsS0FBTyxDQUFDLENBQUM7SUFDeEUsT0FBTyxDQUFDLENBQUMsS0FBSyxHQUFHLEdBQUcsQ0FBQztBQUN0QixDQUFDO0FBSkQsb0NBSUM7QUFFRCxTQUFnQixtQkFBbUIsQ0FBQyxDQUFtQztJQUN0RSxJQUFJLENBQUMsS0FBSyxTQUFTO1FBQUUsT0FBTyxDQUFDLENBQUM7SUFDOUIsSUFBSSxDQUFDLENBQUMsS0FBSyxLQUFLLFNBQVM7UUFBRSxPQUFPLENBQUMsQ0FBQyxLQUFLLEdBQUcsR0FBRyxDQUFDO0lBQ2hELElBQUksQ0FBQyxDQUFDLEtBQUssS0FBSyxPQUFPO1FBQUUsT0FBTyxDQUFDLENBQUMsS0FBSyxHQUFHLEdBQUcsQ0FBQztJQUM5QyxNQUFNLElBQUksS0FBSyxDQUFDLG9CQUFrQixDQUFDLENBQUMsS0FBTyxDQUFDLENBQUM7QUFDOUMsQ0FBQztBQUxELGtEQUtDO0FBRUQsU0FBZ0IsVUFBVSxDQUFDLEVBQXNDO1FBQXBDLEtBQUssV0FBQSxFQUFFLEtBQUssV0FBQTtJQUN4QyxJQUNDLEtBQUssS0FBSyxRQUFRLElBQUksS0FBSyxLQUFLLGFBQWEsSUFBSSxLQUFLLEtBQUssUUFBUSxJQUFJLEtBQUssS0FBSyxNQUFNO1FBQ3ZGLEtBQUssS0FBSyxPQUFPLElBQUksS0FBSyxLQUFLLFFBQVEsSUFBSSxLQUFLLEtBQUssYUFBYSxJQUFJLEtBQUssS0FBSyxTQUFTLEVBQ3hGO1FBQ0QsTUFBTSxJQUFJLEtBQUssQ0FBQyxvQkFBa0IsSUFBSSxDQUFDLFNBQVMsQ0FBQyxFQUFFLEtBQUssT0FBQSxFQUFFLEtBQUssT0FBQSxFQUFFLENBQUcsQ0FBQyxDQUFDO0tBQ3RFO0lBQ0QsT0FBTyxFQUFFLEtBQUssT0FBQSxFQUFFLEtBQUssT0FBQSxFQUFFLENBQUM7QUFDekIsQ0FBQztBQVJELGdDQVFDO0FBRUQsU0FBZ0Isa0JBQWtCLENBQUMsS0FBb0MsRUFBRSxLQUF1QjtJQUF2QixzQkFBQSxFQUFBLGdCQUF1QjtJQUMvRixJQUFJLE9BQU8sS0FBSyxLQUFLLFFBQVE7UUFBRSxPQUFPLEVBQUUsS0FBSyxPQUFBLEVBQUUsS0FBSyxPQUFBLEVBQUUsQ0FBQztJQUN2RCxPQUFPLFVBQVUsQ0FBQyxLQUFLLENBQUMsQ0FBQztBQUMxQixDQUFDO0FBSEQsZ0RBR0M7QUFFRCxTQUFnQixrQkFBa0IsQ0FBQyxFQUFzQyxFQUFFLGFBQXFCO1FBQTNELEtBQUssV0FBQSxFQUFFLEtBQUssV0FBQTtJQUNoRCxJQUFJLEtBQUssS0FBSyxhQUFhO1FBQUUsTUFBTSxJQUFJLEtBQUssQ0FBQyxvQkFBa0IsSUFBSSxDQUFDLFNBQVMsQ0FBQyxFQUFFLEtBQUssT0FBQSxFQUFFLEtBQUssT0FBQSxFQUFFLENBQUcsQ0FBQyxDQUFDO0lBQ25HLE9BQU8sS0FBSyxDQUFDO0FBQ2QsQ0FBQztBQUhELGdEQUdDO0FBRUQsU0FBZ0IsVUFBVSxDQUFDLEtBQXlCO0lBQ25ELE9BQU8sRUFBRSxLQUFLLEVBQUUsT0FBTyxFQUFFLEtBQUssRUFBRSxLQUFLLElBQUksQ0FBQyxFQUFFLENBQUM7QUFDOUMsQ0FBQztBQUZELGdDQUVDO0FBRUQsU0FBZ0IsWUFBWSxDQUFDLEtBQXlCO0lBQ3JELE9BQU8sRUFBRSxLQUFLLEVBQUUsU0FBUyxFQUFFLEtBQUssRUFBRSxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUMsS0FBSyxJQUFJLENBQUMsQ0FBQyxHQUFHLEdBQUcsQ0FBQyxFQUFFLENBQUM7QUFDcEUsQ0FBQztBQUZELG9DQUVDO0FBRUQsU0FBZ0IsVUFBVSxDQUFDLENBQXlCLEVBQUUsR0FBVztJQUNoRSxJQUFJLENBQUMsSUFBSSxJQUFJO1FBQUUsT0FBTyxFQUFFLEtBQUssRUFBRSxRQUFRLEVBQUUsS0FBSyxFQUFFLENBQUMsRUFBRSxDQUFDO0lBRXBELElBQUksT0FBTyxDQUFDLEtBQUssUUFBUTtRQUN4QixNQUFNLElBQUksS0FBSyxDQUFDLG9CQUFrQixJQUFJLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxlQUFVLEdBQUcsb0NBQWlDLENBQUMsQ0FBQztJQUU1RixJQUFBLEtBQUssR0FBWSxDQUFDLE1BQWIsRUFBRSxLQUFLLEdBQUssQ0FBQyxNQUFOLENBQU87SUFFM0IsSUFBSSxPQUFPLEtBQUssS0FBSyxRQUFRO1FBQzVCLE1BQU0sSUFBSSxLQUFLLENBQUMsc0JBQW9CLElBQUksQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLGVBQVUsR0FBRyxNQUFHLENBQUMsQ0FBQztJQUV4RSxJQUNDLEtBQUssS0FBSyxRQUFRLElBQUksS0FBSyxLQUFLLGFBQWEsSUFBSSxLQUFLLEtBQUssUUFBUSxJQUFJLEtBQUssS0FBSyxNQUFNO1FBQ3ZGLEtBQUssS0FBSyxPQUFPLElBQUksS0FBSyxLQUFLLFFBQVEsSUFBSSxLQUFLLEtBQUssYUFBYSxJQUFJLEtBQUssS0FBSyxTQUFTLEVBQ3hGO1FBQ0QsTUFBTSxJQUFJLEtBQUssQ0FBQyxzQkFBb0IsSUFBSSxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsZUFBVSxHQUFHLE1BQUcsQ0FBQyxDQUFDO0tBQ3ZFO0lBRUQsT0FBTyxFQUFFLEtBQUssT0FBQSxFQUFFLEtBQUssT0FBQSxFQUFFLENBQUM7QUFDekIsQ0FBQztBQW5CRCxnQ0FtQkM7QUFFWSxRQUFBLFlBQVksR0FBRyxvQkFBVSxDQUFlLGNBQWMsRUFBRSxNQUFNLEVBQUU7SUFDNUUsSUFBSSxFQUFFLE1BQU07SUFDWixLQUFLLEVBQUUsTUFBTTtDQUNiLENBQUMsQ0FBQztBQUVVLFFBQUEsSUFBSSxHQUFHLG9CQUFVLENBQWMsTUFBTSxFQUFFLFlBQVksRUFBRTtJQUNqRSxVQUFVLEVBQUUsTUFBTTtJQUNsQixRQUFRLEVBQUUsTUFBTTtDQUNoQixDQUFDLENBQUM7QUFFVSxRQUFBLElBQUksR0FBRyxvQkFBVSxDQUFZLE1BQU0sRUFBRSxPQUFPLEVBQUU7SUFDMUQsSUFBSSxFQUFFLE1BQU07SUFDWixLQUFLLEVBQUUsZ0JBQWdCO0lBQ3ZCLEtBQUssRUFBRSxNQUFNO0lBQ2IsTUFBTSxFQUFFLE1BQU07SUFDZCxNQUFNLEVBQUUsTUFBTTtJQUNkLFFBQVEsRUFBRSx1QkFBdUI7SUFDakMsV0FBVyxFQUFFLHNCQUFzQjtDQUNuQyxDQUFDLENBQUM7QUFFVSxRQUFBLFNBQVMsR0FBRyxvQkFBVSxDQUFZLFdBQVcsRUFBRSxNQUFNLEVBQUU7SUFDbkUsSUFBSSxFQUFFLFVBQVU7SUFDaEIsR0FBRyxFQUFFLFNBQVM7SUFDZCxRQUFRLEVBQUUsY0FBYztJQUN4QixRQUFRLEVBQUUsY0FBYztJQUN4QixJQUFJLEVBQUUsVUFBVTtJQUNoQixLQUFLLEVBQUUsV0FBVztJQUNsQixVQUFVLEVBQUUsZ0JBQWdCO0lBQzVCLFVBQVUsRUFBRSxnQkFBZ0I7SUFDNUIsSUFBSSxFQUFFLFVBQVU7SUFDaEIsSUFBSSxFQUFFLFVBQVU7SUFDaEIsSUFBSSxFQUFFLFVBQVU7SUFDaEIsSUFBSSxFQUFFLFVBQVU7SUFDaEIsT0FBTyxFQUFFLGFBQWE7SUFDdEIsT0FBTyxFQUFFLGFBQWE7SUFDdEIsT0FBTyxFQUFFLGFBQWE7SUFDdEIsS0FBSyxFQUFFLFdBQVc7SUFDbEIsTUFBTSxFQUFFLFlBQVk7Q0FDcEIsQ0FBQyxDQUFDO0FBRVUsUUFBQSxJQUFJLEdBQUcsb0JBQVUsQ0FBWSxNQUFNLEVBQUUsUUFBUSxFQUFFO0lBQzNELFFBQVEsRUFBRSxNQUFNO0lBQ2hCLFVBQVUsRUFBRSxNQUFNO0lBQ2xCLFFBQVEsRUFBRSxNQUFNO0lBQ2hCLFVBQVUsRUFBRSxNQUFNO0lBQ2xCLFlBQVksRUFBRSxNQUFNO0lBQ3BCLGFBQWEsRUFBRSxZQUFZO0lBQzNCLGNBQWMsRUFBRSxhQUFhO0lBQzdCLFNBQVMsRUFBRSxNQUFNO0lBQ2pCLFFBQVEsRUFBRSxNQUFNO0lBQ2hCLGFBQWEsRUFBRSxNQUFNO0lBQ3JCLGNBQWMsRUFBRSxhQUFhO0lBQzdCLGVBQWUsRUFBRSxjQUFjO0lBQy9CLFNBQVMsRUFBRSxNQUFNO0lBQ2pCLFlBQVksRUFBRSxNQUFNO0lBQ3BCLFlBQVksRUFBRSxNQUFNO0lBQ3BCLGFBQWEsRUFBRSxZQUFZO0lBQzNCLGNBQWMsRUFBRSxhQUFhO0lBQzdCLFdBQVcsRUFBRSxVQUFVO0lBQ3ZCLFVBQVUsRUFBRSxTQUFTO0lBQ3JCLFlBQVksRUFBRSxNQUFNO0lBQ3BCLFdBQVcsRUFBRSxNQUFNO0lBQ25CLFVBQVUsRUFBRSxrQkFBa0I7SUFDOUIsUUFBUSxFQUFFLGFBQWE7SUFDdkIsS0FBSyxFQUFFLE1BQU07SUFDYixZQUFZLEVBQUUsTUFBTTtJQUNwQixPQUFPLEVBQUUsTUFBTTtJQUNmLFlBQVksRUFBRSxNQUFNO0NBQ3BCLENBQUMsQ0FBQztBQUVVLFFBQUEsSUFBSSxHQUFHLG9CQUFVLENBQWEsTUFBTSxFQUFFLGFBQWEsRUFBRTtJQUNqRSxhQUFhLEVBQUUsTUFBTTtJQUNyQixhQUFhLEVBQUUsTUFBTTtJQUNyQixRQUFRLEVBQUUsTUFBTTtJQUNoQixlQUFlLEVBQUUsTUFBTTtJQUN2QixlQUFlLEVBQUUsY0FBYztDQUMvQixDQUFDLENBQUM7QUFFVSxRQUFBLElBQUksR0FBRyxvQkFBVSxDQUFpQixNQUFNLEVBQUUsUUFBUSxFQUFFO0lBQ2hFLFFBQVEsRUFBRSxNQUFNO0lBQ2hCLGFBQWEsRUFBRSxNQUFNO0lBQ3JCLGFBQWEsRUFBRSxNQUFNO0NBQ3JCLENBQUMsQ0FBQztBQUVVLFFBQUEsSUFBSSxHQUFHLG9CQUFVLENBQWlCLE1BQU0sRUFBRSxJQUFJLEVBQUU7SUFDNUQsRUFBRSxFQUFFLE1BQU07SUFDVixJQUFJLEVBQUUsTUFBTTtDQUNaLENBQUMsQ0FBQztBQUVVLFFBQUEsSUFBSSxHQUFHLG9CQUFVLENBQWdCLE1BQU0sRUFBRSxRQUFRLEVBQUU7SUFDL0QsTUFBTSxFQUFFLE1BQU07SUFDZCxPQUFPLEVBQUUsTUFBTTtDQUNmLENBQUMsQ0FBQztBQUVVLFFBQUEsSUFBSSxHQUFHLG9CQUFVLENBQWEsTUFBTSxFQUFFLE1BQU0sRUFBRTtJQUMxRCxJQUFJLEVBQUUsTUFBTTtJQUNaLE1BQU0sRUFBRSxNQUFNO0NBQ2QsQ0FBQyxDQUFDO0FBRVUsUUFBQSxJQUFJLEdBQUcsb0JBQVUsQ0FBZ0IsTUFBTSxFQUFFLFFBQVEsRUFBRTtJQUMvRCxNQUFNLEVBQUUsTUFBTTtJQUNkLE1BQU0sRUFBRSxNQUFNO0lBQ2QsS0FBSyxFQUFFLE1BQU07SUFDYixTQUFTLEVBQUUsTUFBTTtJQUNqQixPQUFPLEVBQUUsTUFBTTtDQUNmLENBQUMsQ0FBQztBQUVVLFFBQUEsSUFBSSxHQUFHLG9CQUFVLENBQXdCLE1BQU0sRUFBRSxLQUFLLEVBQUU7SUFDcEUsR0FBRyxFQUFFLE1BQU07SUFDWCxHQUFHLEVBQUUsTUFBTTtJQUNYLEdBQUcsRUFBRSxNQUFNO0NBQ1gsQ0FBQyxDQUFDO0FBRVUsUUFBQSxJQUFJLEdBQUcsb0JBQVUsQ0FBa0MsTUFBTSxFQUFFLFNBQVMsRUFBRTtJQUNsRixPQUFPLEVBQUUsTUFBTTtJQUNmLE1BQU0sRUFBRSxNQUFNO0lBQ2QsTUFBTSxFQUFFLE1BQU07Q0FDZCxDQUFDLENBQUM7QUFFVSxRQUFBLElBQUksR0FBRyxvQkFBVSxDQUFtQyxNQUFNLEVBQUUsT0FBTyxFQUFFO0lBQ2pGLEtBQUssRUFBRSxNQUFNO0lBQ2IsUUFBUSxFQUFFLE1BQU07SUFDaEIsT0FBTyxFQUFFLE1BQU07Q0FDZixDQUFDLENBQUM7QUFFVSxRQUFBLHNCQUFzQixHQUFHLG9CQUFVLENBQWMsd0JBQXdCLEVBQUUsTUFBTSxFQUFFO0lBQy9GLElBQUksRUFBRSxvQkFBb0I7SUFDMUIsS0FBSyxFQUFFLHFCQUFxQjtJQUM1QixNQUFNLEVBQUUsc0JBQXNCO0NBQzlCLENBQUMsQ0FBQztBQUVVLFFBQUEsdUJBQXVCLEdBQUcsb0JBQVUsQ0FBZSx5QkFBeUIsRUFBRSxPQUFPLEVBQUU7SUFDbkcsS0FBSyxFQUFFLHNCQUFzQjtJQUM3QixLQUFLLEVBQUUsc0JBQXNCO0lBQzdCLEtBQUssRUFBRSxzQkFBc0I7Q0FDN0IsQ0FBQyxDQUFDO0FBRVUsUUFBQSx3QkFBd0IsR0FBRyxvQkFBVSxDQUFnQiwwQkFBMEIsRUFBRSxRQUFRLEVBQUU7SUFDdkcsTUFBTSxFQUFFLHdCQUF3QjtJQUNoQyxNQUFNLEVBQUUsd0JBQXdCO0lBQ2hDLE9BQU8sRUFBRSx5QkFBeUI7Q0FDbEMsQ0FBQyxDQUFDIiwiZmlsZSI6ImRlc2NyaXB0b3IuanMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBjcmVhdGVFbnVtIH0gZnJvbSAnLi9oZWxwZXJzJztcclxuaW1wb3J0IHtcclxuXHRBbnRpQWxpYXMsIEJldmVsRGlyZWN0aW9uLCBCZXZlbFN0eWxlLCBCZXZlbFRlY2huaXF1ZSwgQmxlbmRNb2RlLCBHbG93U291cmNlLCBHbG93VGVjaG5pcXVlLCBHcmFkaWVudFN0eWxlLFxyXG5cdExpbmVBbGlnbm1lbnQsIExpbmVDYXBUeXBlLCBMaW5lSm9pblR5cGUsIE9yaWVudGF0aW9uLCBUZXh0R3JpZGRpbmcsIFVuaXRzLCBVbml0c1ZhbHVlLCBXYXJwU3R5bGVcclxufSBmcm9tICcuL3BzZCc7XHJcbmltcG9ydCB7XHJcblx0UHNkUmVhZGVyLCByZWFkU2lnbmF0dXJlLCByZWFkVW5pY29kZVN0cmluZywgcmVhZFVpbnQzMiwgcmVhZFVpbnQ4LCByZWFkRmxvYXQ2NCxcclxuXHRyZWFkQnl0ZXMsIHJlYWRBc2NpaVN0cmluZywgcmVhZEludDMyLCByZWFkRmxvYXQzMiwgcmVhZEludDMyTEUsIHJlYWRVbmljb2RlU3RyaW5nV2l0aExlbmd0aFxyXG59IGZyb20gJy4vcHNkUmVhZGVyJztcclxuaW1wb3J0IHtcclxuXHRQc2RXcml0ZXIsIHdyaXRlU2lnbmF0dXJlLCB3cml0ZUJ5dGVzLCB3cml0ZVVpbnQzMiwgd3JpdGVGbG9hdDY0LCB3cml0ZVVpbnQ4LFxyXG5cdHdyaXRlVW5pY29kZVN0cmluZ1dpdGhQYWRkaW5nLCB3cml0ZUludDMyLCB3cml0ZUZsb2F0MzIsIHdyaXRlVW5pY29kZVN0cmluZ1xyXG59IGZyb20gJy4vcHNkV3JpdGVyJztcclxuXHJcbmludGVyZmFjZSBEaWN0IHsgW2tleTogc3RyaW5nXTogc3RyaW5nOyB9XHJcbmludGVyZmFjZSBOYW1lQ2xhc3NJRCB7IG5hbWU6IHN0cmluZzsgY2xhc3NJRDogc3RyaW5nOyB9XHJcbmludGVyZmFjZSBFeHRUeXBlRGljdCB7IFtrZXk6IHN0cmluZ106IE5hbWVDbGFzc0lEOyB9XHJcblxyXG5mdW5jdGlvbiByZXZNYXAobWFwOiBEaWN0KSB7XHJcblx0Y29uc3QgcmVzdWx0OiBEaWN0ID0ge307XHJcblx0T2JqZWN0LmtleXMobWFwKS5mb3JFYWNoKGtleSA9PiByZXN1bHRbbWFwW2tleV1dID0ga2V5KTtcclxuXHRyZXR1cm4gcmVzdWx0O1xyXG59XHJcblxyXG5jb25zdCB1bml0c01hcDogRGljdCA9IHtcclxuXHQnI0FuZyc6ICdBbmdsZScsXHJcblx0JyNSc2wnOiAnRGVuc2l0eScsXHJcblx0JyNSbHQnOiAnRGlzdGFuY2UnLFxyXG5cdCcjTm5lJzogJ05vbmUnLFxyXG5cdCcjUHJjJzogJ1BlcmNlbnQnLFxyXG5cdCcjUHhsJzogJ1BpeGVscycsXHJcblx0JyNNbG0nOiAnTWlsbGltZXRlcnMnLFxyXG5cdCcjUG50JzogJ1BvaW50cycsXHJcblx0J1JyUGknOiAnUGljYXMnLFxyXG5cdCdSckluJzogJ0luY2hlcycsXHJcblx0J1JyQ20nOiAnQ2VudGltZXRlcnMnLFxyXG59O1xyXG5cclxuY29uc3QgdW5pdHNNYXBSZXYgPSByZXZNYXAodW5pdHNNYXApO1xyXG5sZXQgbG9nRXJyb3JzID0gZmFsc2U7XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gc2V0TG9nRXJyb3JzKHZhbHVlOiBib29sZWFuKSB7XHJcblx0bG9nRXJyb3JzID0gdmFsdWU7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIG1ha2VUeXBlKG5hbWU6IHN0cmluZywgY2xhc3NJRDogc3RyaW5nKSB7XHJcblx0cmV0dXJuIHsgbmFtZSwgY2xhc3NJRCB9O1xyXG59XHJcblxyXG5jb25zdCBmaWVsZFRvRXh0VHlwZTogRXh0VHlwZURpY3QgPSB7XHJcblx0c3Ryb2tlU3R5bGVDb250ZW50OiBtYWtlVHlwZSgnJywgJ3NvbGlkQ29sb3JMYXllcicpLFxyXG5cdC8vIHByaW50UHJvb2ZTZXR1cDogbWFrZVR5cGUoJ+agoeagt+iuvue9ricsICdwcm9vZlNldHVwJyksIC8vIFRFU1RJTkdcclxuXHRwcmludFByb29mU2V0dXA6IG1ha2VUeXBlKCdQcm9vZiBTZXR1cCcsICdwcm9vZlNldHVwJyksXHJcblx0cGF0dGVybkZpbGw6IG1ha2VUeXBlKCcnLCAncGF0dGVybkZpbGwnKSxcclxuXHRHcmFkOiBtYWtlVHlwZSgnR3JhZGllbnQnLCAnR3JkbicpLFxyXG5cdGViYmw6IG1ha2VUeXBlKCcnLCAnZWJibCcpLFxyXG5cdFNvRmk6IG1ha2VUeXBlKCcnLCAnU29GaScpLFxyXG5cdEdyRmw6IG1ha2VUeXBlKCcnLCAnR3JGbCcpLFxyXG5cdHNkd0M6IG1ha2VUeXBlKCcnLCAnUkdCQycpLFxyXG5cdGhnbEM6IG1ha2VUeXBlKCcnLCAnUkdCQycpLFxyXG5cdCdDbHIgJzogbWFrZVR5cGUoJycsICdSR0JDJyksXHJcblx0J3RpbnRDb2xvcic6IG1ha2VUeXBlKCcnLCAnUkdCQycpLFxyXG5cdE9mc3Q6IG1ha2VUeXBlKCcnLCAnUG50ICcpLFxyXG5cdENoRlg6IG1ha2VUeXBlKCcnLCAnQ2hGWCcpLFxyXG5cdE1wZ1M6IG1ha2VUeXBlKCcnLCAnU2hwQycpLFxyXG5cdERyU2g6IG1ha2VUeXBlKCcnLCAnRHJTaCcpLFxyXG5cdElyU2g6IG1ha2VUeXBlKCcnLCAnSXJTaCcpLFxyXG5cdE9yR2w6IG1ha2VUeXBlKCcnLCAnT3JHbCcpLFxyXG5cdElyR2w6IG1ha2VUeXBlKCcnLCAnSXJHbCcpLFxyXG5cdFRyblM6IG1ha2VUeXBlKCcnLCAnU2hwQycpLFxyXG5cdFB0cm46IG1ha2VUeXBlKCcnLCAnUHRybicpLFxyXG5cdEZyRlg6IG1ha2VUeXBlKCcnLCAnRnJGWCcpLFxyXG5cdHBoYXNlOiBtYWtlVHlwZSgnJywgJ1BudCAnKSxcclxuXHRmcmFtZVN0ZXA6IG1ha2VUeXBlKCcnLCAnbnVsbCcpLFxyXG5cdGR1cmF0aW9uOiBtYWtlVHlwZSgnJywgJ251bGwnKSxcclxuXHRib3VuZHM6IG1ha2VUeXBlKCcnLCAnUmN0bicpLFxyXG5cdGN1c3RvbUVudmVsb3BlV2FycDogbWFrZVR5cGUoJycsICdjdXN0b21FbnZlbG9wZVdhcnAnKSxcclxuXHR3YXJwOiBtYWtlVHlwZSgnJywgJ3dhcnAnKSxcclxuXHQnU3ogICc6IG1ha2VUeXBlKCcnLCAnUG50ICcpLFxyXG5cdG9yaWdpbjogbWFrZVR5cGUoJycsICdQbnQgJyksXHJcblx0YXV0b0V4cGFuZE9mZnNldDogbWFrZVR5cGUoJycsICdQbnQgJyksXHJcblx0a2V5T3JpZ2luU2hhcGVCQm94OiBtYWtlVHlwZSgnJywgJ3VuaXRSZWN0JyksXHJcblx0VnJzbjogbWFrZVR5cGUoJycsICdudWxsJyksXHJcblx0cHNWZXJzaW9uOiBtYWtlVHlwZSgnJywgJ251bGwnKSxcclxuXHRkb2NEZWZhdWx0TmV3QXJ0Ym9hcmRCYWNrZ3JvdW5kQ29sb3I6IG1ha2VUeXBlKCcnLCAnUkdCQycpLFxyXG5cdGFydGJvYXJkUmVjdDogbWFrZVR5cGUoJycsICdjbGFzc0Zsb2F0UmVjdCcpLFxyXG5cdGtleU9yaWdpblJSZWN0UmFkaWk6IG1ha2VUeXBlKCcnLCAncmFkaWknKSxcclxuXHRrZXlPcmlnaW5Cb3hDb3JuZXJzOiBtYWtlVHlwZSgnJywgJ251bGwnKSxcclxuXHRyZWN0YW5nbGVDb3JuZXJBOiBtYWtlVHlwZSgnJywgJ1BudCAnKSxcclxuXHRyZWN0YW5nbGVDb3JuZXJCOiBtYWtlVHlwZSgnJywgJ1BudCAnKSxcclxuXHRyZWN0YW5nbGVDb3JuZXJDOiBtYWtlVHlwZSgnJywgJ1BudCAnKSxcclxuXHRyZWN0YW5nbGVDb3JuZXJEOiBtYWtlVHlwZSgnJywgJ1BudCAnKSxcclxuXHRjb21wSW5mbzogbWFrZVR5cGUoJycsICdudWxsJyksXHJcblx0VHJuZjogbWFrZVR5cGUoJ1RyYW5zZm9ybScsICdUcm5mJyksXHJcblx0cXVpbHRXYXJwOiBtYWtlVHlwZSgnJywgJ3F1aWx0V2FycCcpLFxyXG5cdGdlbmVyYXRvclNldHRpbmdzOiBtYWtlVHlwZSgnJywgJ251bGwnKSxcclxuXHRjcmVtYTogbWFrZVR5cGUoJycsICdudWxsJyksXHJcbn07XHJcblxyXG5jb25zdCBmaWVsZFRvQXJyYXlFeHRUeXBlOiBFeHRUeXBlRGljdCA9IHtcclxuXHQnQ3J2ICc6IG1ha2VUeXBlKCcnLCAnQ3JQdCcpLFxyXG5cdENscnM6IG1ha2VUeXBlKCcnLCAnQ2xydCcpLFxyXG5cdFRybnM6IG1ha2VUeXBlKCcnLCAnVHJuUycpLFxyXG5cdGtleURlc2NyaXB0b3JMaXN0OiBtYWtlVHlwZSgnJywgJ251bGwnKSxcclxuXHRzb2xpZEZpbGxNdWx0aTogbWFrZVR5cGUoJycsICdTb0ZpJyksXHJcblx0Z3JhZGllbnRGaWxsTXVsdGk6IG1ha2VUeXBlKCcnLCAnR3JGbCcpLFxyXG5cdGRyb3BTaGFkb3dNdWx0aTogbWFrZVR5cGUoJycsICdEclNoJyksXHJcblx0aW5uZXJTaGFkb3dNdWx0aTogbWFrZVR5cGUoJycsICdJclNoJyksXHJcblx0ZnJhbWVGWE11bHRpOiBtYWtlVHlwZSgnJywgJ0ZyRlgnKSxcclxufTtcclxuXHJcbmNvbnN0IHR5cGVUb0ZpZWxkOiB7IFtrZXk6IHN0cmluZ106IHN0cmluZ1tdOyB9ID0ge1xyXG5cdCdURVhUJzogW1xyXG5cdFx0J1R4dCAnLCAncHJpbnRlck5hbWUnLCAnTm0gICcsICdJZG50JywgJ2JsYWNrQW5kV2hpdGVQcmVzZXRGaWxlTmFtZScsICdMVVQzREZpbGVOYW1lJyxcclxuXHRcdCdwcmVzZXRGaWxlTmFtZScsICdjdXJ2ZXNQcmVzZXRGaWxlTmFtZScsICdtaXhlclByZXNldEZpbGVOYW1lJywgJ3BsYWNlZCcsICdkZXNjcmlwdGlvbicsICdyZWFzb24nLFxyXG5cdFx0J2FydGJvYXJkUHJlc2V0TmFtZScsICdqc29uJyxcclxuXHRdLFxyXG5cdCd0ZHRhJzogWydFbmdpbmVEYXRhJywgJ0xVVDNERmlsZURhdGEnXSxcclxuXHQnbG9uZyc6IFtcclxuXHRcdCdUZXh0SW5kZXgnLCAnUm5kUycsICdNZHBuJywgJ1NtdGgnLCAnTGN0bicsICdzdHJva2VTdHlsZVZlcnNpb24nLCAnTGFJRCcsICdWcnNuJywgJ0NudCAnLFxyXG5cdFx0J0JyZ2gnLCAnQ250cicsICdtZWFucycsICd2aWJyYW5jZScsICdTdHJ0JywgJ2J3UHJlc2V0S2luZCcsICdwcmVzZXRLaW5kJywgJ2NvbXAnLCAnY29tcElEJywgJ29yaWdpbmFsQ29tcElEJyxcclxuXHRcdCdjdXJ2ZXNQcmVzZXRLaW5kJywgJ21peGVyUHJlc2V0S2luZCcsICd1T3JkZXInLCAndk9yZGVyJywgJ1BnTm0nLCAndG90YWxQYWdlcycsICdDcm9wJyxcclxuXHRcdCdudW1lcmF0b3InLCAnZGVub21pbmF0b3InLCAnZnJhbWVDb3VudCcsICdBbm50JywgJ2tleU9yaWdpblR5cGUnLCAndW5pdFZhbHVlUXVhZFZlcnNpb24nLFxyXG5cdFx0J2tleU9yaWdpbkluZGV4JywgJ21ham9yJywgJ21pbm9yJywgJ2ZpeCcsICdkb2NEZWZhdWx0TmV3QXJ0Ym9hcmRCYWNrZ3JvdW5kVHlwZScsICdhcnRib2FyZEJhY2tncm91bmRUeXBlJyxcclxuXHRcdCdudW1Nb2RpZnlpbmdGWCcsICdkZWZvcm1OdW1Sb3dzJywgJ2RlZm9ybU51bUNvbHMnLFxyXG5cdF0sXHJcblx0J2VudW0nOiBbXHJcblx0XHQndGV4dEdyaWRkaW5nJywgJ09ybnQnLCAnd2FycFN0eWxlJywgJ3dhcnBSb3RhdGUnLCAnSW50ZScsICdCbHRuJywgJ0NsclMnLFxyXG5cdFx0J3Nkd00nLCAnaGdsTScsICdidmxUJywgJ2J2bFMnLCAnYnZsRCcsICdNZCAgJywgJ2dsd1MnLCAnR3JkRicsICdHbHdUJyxcclxuXHRcdCdzdHJva2VTdHlsZUxpbmVDYXBUeXBlJywgJ3N0cm9rZVN0eWxlTGluZUpvaW5UeXBlJywgJ3N0cm9rZVN0eWxlTGluZUFsaWdubWVudCcsXHJcblx0XHQnc3Ryb2tlU3R5bGVCbGVuZE1vZGUnLCAnUG50VCcsICdTdHlsJywgJ2xvb2t1cFR5cGUnLCAnTFVURm9ybWF0JywgJ2RhdGFPcmRlcicsXHJcblx0XHQndGFibGVPcmRlcicsICdlbmFibGVDb21wQ29yZScsICdlbmFibGVDb21wQ29yZUdQVScsICdjb21wQ29yZVN1cHBvcnQnLCAnY29tcENvcmVHUFVTdXBwb3J0JywgJ0VuZ24nLFxyXG5cdFx0J2VuYWJsZUNvbXBDb3JlVGhyZWFkcycsXHJcblx0XSxcclxuXHQnYm9vbCc6IFtcclxuXHRcdCdQc3RTJywgJ3ByaW50U2l4dGVlbkJpdCcsICdtYXN0ZXJGWFN3aXRjaCcsICdlbmFiJywgJ3VnbGcnLCAnYW50aWFsaWFzR2xvc3MnLFxyXG5cdFx0J3VzZVNoYXBlJywgJ3VzZVRleHR1cmUnLCAnbWFzdGVyRlhTd2l0Y2gnLCAndWdsZycsICdhbnRpYWxpYXNHbG9zcycsICd1c2VTaGFwZScsXHJcblx0XHQndXNlVGV4dHVyZScsICdBbGduJywgJ1J2cnMnLCAnRHRocicsICdJbnZyJywgJ1ZjdEMnLCAnU2hUcicsICdsYXllckNvbmNlYWxzJyxcclxuXHRcdCdzdHJva2VFbmFibGVkJywgJ2ZpbGxFbmFibGVkJywgJ3N0cm9rZVN0eWxlU2NhbGVMb2NrJywgJ3N0cm9rZVN0eWxlU3Ryb2tlQWRqdXN0JyxcclxuXHRcdCdoYXJkUHJvb2YnLCAnTXBCbCcsICdwYXBlcldoaXRlJywgJ3VzZUxlZ2FjeScsICdBdXRvJywgJ0xhYiAnLCAndXNlVGludCcsICdrZXlTaGFwZUludmFsaWRhdGVkJyxcclxuXHRcdCdhdXRvRXhwYW5kRW5hYmxlZCcsICdhdXRvTmVzdEVuYWJsZWQnLCAnYXV0b1Bvc2l0aW9uRW5hYmxlZCcsICdzaHJpbmt3cmFwT25TYXZlRW5hYmxlZCcsXHJcblx0XHQncHJlc2VudCcsICdzaG93SW5EaWFsb2cnLCAnb3ZlcnByaW50JyxcclxuXHRdLFxyXG5cdCdkb3ViJzogW1xyXG5cdFx0J3dhcnBWYWx1ZScsICd3YXJwUGVyc3BlY3RpdmUnLCAnd2FycFBlcnNwZWN0aXZlT3RoZXInLCAnSW50cicsICdXZHRoJywgJ0hnaHQnLFxyXG5cdFx0J3N0cm9rZVN0eWxlTWl0ZXJMaW1pdCcsICdzdHJva2VTdHlsZVJlc29sdXRpb24nLCAnbGF5ZXJUaW1lJywgJ2tleU9yaWdpblJlc29sdXRpb24nLFxyXG5cdFx0J3h4JywgJ3h5JywgJ3l4JywgJ3l5JywgJ3R4JywgJ3R5JyxcclxuXHRdLFxyXG5cdCdVbnRGJzogW1xyXG5cdFx0J1NjbCAnLCAnc2R3TycsICdoZ2xPJywgJ2xhZ2wnLCAnTGFsZCcsICdzcmdSJywgJ2JsdXInLCAnU2Z0bicsICdPcGN0JywgJ0RzdG4nLCAnQW5nbCcsXHJcblx0XHQnQ2ttdCcsICdOb3NlJywgJ0lucHInLCAnU2hkTicsICdzdHJva2VTdHlsZUxpbmVXaWR0aCcsICdzdHJva2VTdHlsZUxpbmVEYXNoT2Zmc2V0JyxcclxuXHRcdCdzdHJva2VTdHlsZU9wYWNpdHknLCAnSCAgICcsICdUb3AgJywgJ0xlZnQnLCAnQnRvbScsICdSZ2h0JywgJ1JzbHQnLFxyXG5cdFx0J3RvcFJpZ2h0JywgJ3RvcExlZnQnLCAnYm90dG9tTGVmdCcsICdib3R0b21SaWdodCcsXHJcblx0XSxcclxuXHQnVmxMcyc6IFtcclxuXHRcdCdDcnYgJywgJ0NscnMnLCAnTW5tICcsICdNeG0gJywgJ1RybnMnLCAncGF0aExpc3QnLCAnc3Ryb2tlU3R5bGVMaW5lRGFzaFNldCcsICdGckxzJyxcclxuXHRcdCdMYVN0JywgJ1RybmYnLCAnbm9uQWZmaW5lVHJhbnNmb3JtJywgJ2tleURlc2NyaXB0b3JMaXN0JywgJ2d1aWRlSW5kZWNlcycsICdncmFkaWVudEZpbGxNdWx0aScsXHJcblx0XHQnc29saWRGaWxsTXVsdGknLCAnZnJhbWVGWE11bHRpJywgJ2lubmVyU2hhZG93TXVsdGknLCAnZHJvcFNoYWRvd011bHRpJyxcclxuXHRdLFxyXG5cdCdPYkFyJzogWydtZXNoUG9pbnRzJywgJ3F1aWx0U2xpY2VYJywgJ3F1aWx0U2xpY2VZJ10sXHJcblx0J29iaiAnOiBbJ251bGwnXSxcclxufTtcclxuXHJcbmNvbnN0IGNoYW5uZWxzID0gW1xyXG5cdCdSZCAgJywgJ0dybiAnLCAnQmwgICcsICdZbGx3JywgJ1lsdyAnLCAnQ3luICcsICdNZ250JywgJ0JsY2snLCAnR3J5ICcsICdMbW5jJywgJ0EgICAnLCAnQiAgICcsXHJcbl07XHJcblxyXG5jb25zdCBmaWVsZFRvQXJyYXlUeXBlOiBEaWN0ID0ge1xyXG5cdCdNbm0gJzogJ2xvbmcnLFxyXG5cdCdNeG0gJzogJ2xvbmcnLFxyXG5cdCdGckxzJzogJ2xvbmcnLFxyXG5cdCdzdHJva2VTdHlsZUxpbmVEYXNoU2V0JzogJ1VudEYnLFxyXG5cdCdUcm5mJzogJ2RvdWInLFxyXG5cdCdub25BZmZpbmVUcmFuc2Zvcm0nOiAnZG91YicsXHJcblx0J2tleURlc2NyaXB0b3JMaXN0JzogJ09iamMnLFxyXG5cdCdncmFkaWVudEZpbGxNdWx0aSc6ICdPYmpjJyxcclxuXHQnc29saWRGaWxsTXVsdGknOiAnT2JqYycsXHJcblx0J2ZyYW1lRlhNdWx0aSc6ICdPYmpjJyxcclxuXHQnaW5uZXJTaGFkb3dNdWx0aSc6ICdPYmpjJyxcclxuXHQnZHJvcFNoYWRvd011bHRpJzogJ09iamMnLFxyXG59O1xyXG5cclxuY29uc3QgZmllbGRUb1R5cGU6IERpY3QgPSB7fTtcclxuXHJcbmZvciAoY29uc3QgdHlwZSBvZiBPYmplY3Qua2V5cyh0eXBlVG9GaWVsZCkpIHtcclxuXHRmb3IgKGNvbnN0IGZpZWxkIG9mIHR5cGVUb0ZpZWxkW3R5cGVdKSB7XHJcblx0XHRmaWVsZFRvVHlwZVtmaWVsZF0gPSB0eXBlO1xyXG5cdH1cclxufVxyXG5cclxuZm9yIChjb25zdCBmaWVsZCBvZiBPYmplY3Qua2V5cyhmaWVsZFRvRXh0VHlwZSkpIHtcclxuXHRpZiAoIWZpZWxkVG9UeXBlW2ZpZWxkXSkgZmllbGRUb1R5cGVbZmllbGRdID0gJ09iamMnO1xyXG59XHJcblxyXG5mb3IgKGNvbnN0IGZpZWxkIG9mIE9iamVjdC5rZXlzKGZpZWxkVG9BcnJheUV4dFR5cGUpKSB7XHJcblx0ZmllbGRUb0FycmF5VHlwZVtmaWVsZF0gPSAnT2JqYyc7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGdldFR5cGVCeUtleShrZXk6IHN0cmluZywgdmFsdWU6IGFueSwgcm9vdDogc3RyaW5nKSB7XHJcblx0aWYgKGtleSA9PT0gJ1N6ICAnKSB7XHJcblx0XHRyZXR1cm4gKCdXZHRoJyBpbiB2YWx1ZSkgPyAnT2JqYycgOiAoKCd1bml0cycgaW4gdmFsdWUpID8gJ1VudEYnIDogJ2RvdWInKTtcclxuXHR9IGVsc2UgaWYgKGtleSA9PT0gJ1R5cGUnKSB7XHJcblx0XHRyZXR1cm4gdHlwZW9mIHZhbHVlID09PSAnc3RyaW5nJyA/ICdlbnVtJyA6ICdsb25nJztcclxuXHR9IGVsc2UgaWYgKGtleSA9PT0gJ0FudEEnKSB7XHJcblx0XHRyZXR1cm4gdHlwZW9mIHZhbHVlID09PSAnc3RyaW5nJyA/ICdlbnVtJyA6ICdib29sJztcclxuXHR9IGVsc2UgaWYgKGtleSA9PT0gJ0hyem4nIHx8IGtleSA9PT0gJ1ZydGMnIHx8IGtleSA9PT0gJ1RvcCAnIHx8IGtleSA9PT0gJ0xlZnQnIHx8IGtleSA9PT0gJ0J0b20nIHx8IGtleSA9PT0gJ1JnaHQnKSB7XHJcblx0XHRyZXR1cm4gdHlwZW9mIHZhbHVlID09PSAnbnVtYmVyJyA/ICdkb3ViJyA6ICdVbnRGJztcclxuXHR9IGVsc2UgaWYgKGtleSA9PT0gJ1Zyc24nKSB7XHJcblx0XHRyZXR1cm4gdHlwZW9mIHZhbHVlID09PSAnbnVtYmVyJyA/ICdsb25nJyA6ICdPYmpjJztcclxuXHR9IGVsc2UgaWYgKGtleSA9PT0gJ1JkICAnIHx8IGtleSA9PT0gJ0dybiAnIHx8IGtleSA9PT0gJ0JsICAnKSB7XHJcblx0XHRyZXR1cm4gcm9vdCA9PT0gJ2FydGQnID8gJ2xvbmcnIDogJ2RvdWInO1xyXG5cdH0gZWxzZSBpZiAoa2V5ID09PSAnVHJuZicpIHtcclxuXHRcdHJldHVybiBBcnJheS5pc0FycmF5KHZhbHVlKSA/ICdWbExzJyA6ICdPYmpjJztcclxuXHR9IGVsc2Uge1xyXG5cdFx0cmV0dXJuIGZpZWxkVG9UeXBlW2tleV07XHJcblx0fVxyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gcmVhZEFzY2lpU3RyaW5nT3JDbGFzc0lkKHJlYWRlcjogUHNkUmVhZGVyKSB7XHJcblx0Y29uc3QgbGVuZ3RoID0gcmVhZEludDMyKHJlYWRlcik7XHJcblx0cmV0dXJuIHJlYWRBc2NpaVN0cmluZyhyZWFkZXIsIGxlbmd0aCB8fCA0KTtcclxufVxyXG5cclxuZnVuY3Rpb24gd3JpdGVBc2NpaVN0cmluZ09yQ2xhc3NJZCh3cml0ZXI6IFBzZFdyaXRlciwgdmFsdWU6IHN0cmluZykge1xyXG5cdGlmICh2YWx1ZS5sZW5ndGggPT09IDQgJiYgdmFsdWUgIT09ICd3YXJwJykge1xyXG5cdFx0Ly8gd3JpdGUgY2xhc3NJZFxyXG5cdFx0d3JpdGVJbnQzMih3cml0ZXIsIDApO1xyXG5cdFx0d3JpdGVTaWduYXR1cmUod3JpdGVyLCB2YWx1ZSk7XHJcblx0fSBlbHNlIHtcclxuXHRcdC8vIHdyaXRlIGFzY2lpIHN0cmluZ1xyXG5cdFx0d3JpdGVJbnQzMih3cml0ZXIsIHZhbHVlLmxlbmd0aCk7XHJcblxyXG5cdFx0Zm9yIChsZXQgaSA9IDA7IGkgPCB2YWx1ZS5sZW5ndGg7IGkrKykge1xyXG5cdFx0XHR3cml0ZVVpbnQ4KHdyaXRlciwgdmFsdWUuY2hhckNvZGVBdChpKSk7XHJcblx0XHR9XHJcblx0fVxyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gcmVhZERlc2NyaXB0b3JTdHJ1Y3R1cmUocmVhZGVyOiBQc2RSZWFkZXIpIHtcclxuXHRjb25zdCBvYmplY3Q6IGFueSA9IHt9O1xyXG5cdC8vIG9iamVjdC5fX3N0cnVjdCA9XHJcblx0cmVhZENsYXNzU3RydWN0dXJlKHJlYWRlcik7XHJcblx0Y29uc3QgaXRlbXNDb3VudCA9IHJlYWRVaW50MzIocmVhZGVyKTtcclxuXHJcblx0Zm9yIChsZXQgaSA9IDA7IGkgPCBpdGVtc0NvdW50OyBpKyspIHtcclxuXHRcdGNvbnN0IGtleSA9IHJlYWRBc2NpaVN0cmluZ09yQ2xhc3NJZChyZWFkZXIpO1xyXG5cdFx0Y29uc3QgdHlwZSA9IHJlYWRTaWduYXR1cmUocmVhZGVyKTtcclxuXHRcdC8vIGNvbnNvbGUubG9nKGA+ICcke2tleX0nICcke3R5cGV9J2ApO1xyXG5cdFx0Y29uc3QgZGF0YSA9IHJlYWRPU1R5cGUocmVhZGVyLCB0eXBlKTtcclxuXHRcdC8vIGlmICghZ2V0VHlwZUJ5S2V5KGtleSwgZGF0YSkpIGNvbnNvbGUubG9nKGA+ICcke2tleX0nICcke3R5cGV9J2AsIGRhdGEpO1xyXG5cdFx0b2JqZWN0W2tleV0gPSBkYXRhO1xyXG5cdH1cclxuXHQvLyBjb25zb2xlLmxvZygnLy8nLCBzdHJ1Y3QpO1xyXG5cdHJldHVybiBvYmplY3Q7XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiB3cml0ZURlc2NyaXB0b3JTdHJ1Y3R1cmUod3JpdGVyOiBQc2RXcml0ZXIsIG5hbWU6IHN0cmluZywgY2xhc3NJZDogc3RyaW5nLCB2YWx1ZTogYW55LCByb290OiBzdHJpbmcpIHtcclxuXHRpZiAobG9nRXJyb3JzICYmICFjbGFzc0lkKSBjb25zb2xlLmxvZygnTWlzc2luZyBjbGFzc0lkIGZvcjogJywgbmFtZSwgY2xhc3NJZCwgdmFsdWUpO1xyXG5cclxuXHQvLyB3cml0ZSBjbGFzcyBzdHJ1Y3R1cmVcclxuXHR3cml0ZVVuaWNvZGVTdHJpbmdXaXRoUGFkZGluZyh3cml0ZXIsIG5hbWUpO1xyXG5cdHdyaXRlQXNjaWlTdHJpbmdPckNsYXNzSWQod3JpdGVyLCBjbGFzc0lkKTtcclxuXHJcblx0Y29uc3Qga2V5cyA9IE9iamVjdC5rZXlzKHZhbHVlKTtcclxuXHR3cml0ZVVpbnQzMih3cml0ZXIsIGtleXMubGVuZ3RoKTtcclxuXHJcblx0Zm9yIChjb25zdCBrZXkgb2Yga2V5cykge1xyXG5cdFx0bGV0IHR5cGUgPSBnZXRUeXBlQnlLZXkoa2V5LCB2YWx1ZVtrZXldLCByb290KTtcclxuXHRcdGxldCBleHRUeXBlID0gZmllbGRUb0V4dFR5cGVba2V5XTtcclxuXHJcblx0XHRpZiAoKGtleSA9PT0gJ1N0cnQnIHx8IGtleSA9PT0gJ0JyZ2gnKSAmJiAnSCAgICcgaW4gdmFsdWUpIHtcclxuXHRcdFx0dHlwZSA9ICdkb3ViJztcclxuXHRcdH0gZWxzZSBpZiAoY2hhbm5lbHMuaW5kZXhPZihrZXkpICE9PSAtMSkge1xyXG5cdFx0XHR0eXBlID0gKGNsYXNzSWQgPT09ICdSR0JDJyAmJiByb290ICE9PSAnYXJ0ZCcpID8gJ2RvdWInIDogJ2xvbmcnO1xyXG5cdFx0fSBlbHNlIGlmIChrZXkgPT09ICdwcm9maWxlJykge1xyXG5cdFx0XHR0eXBlID0gY2xhc3NJZCA9PT0gJ3ByaW50T3V0cHV0JyA/ICdURVhUJyA6ICd0ZHRhJztcclxuXHRcdH0gZWxzZSBpZiAoa2V5ID09PSAnc3Ryb2tlU3R5bGVDb250ZW50Jykge1xyXG5cdFx0XHRpZiAodmFsdWVba2V5XVsnQ2xyICddKSB7XHJcblx0XHRcdFx0ZXh0VHlwZSA9IG1ha2VUeXBlKCcnLCAnc29saWRDb2xvckxheWVyJyk7XHJcblx0XHRcdH0gZWxzZSBpZiAodmFsdWVba2V5XS5HcmFkKSB7XHJcblx0XHRcdFx0ZXh0VHlwZSA9IG1ha2VUeXBlKCcnLCAnZ3JhZGllbnRMYXllcicpO1xyXG5cdFx0XHR9IGVsc2UgaWYgKHZhbHVlW2tleV0uUHRybikge1xyXG5cdFx0XHRcdGV4dFR5cGUgPSBtYWtlVHlwZSgnJywgJ3BhdHRlcm5MYXllcicpO1xyXG5cdFx0XHR9IGVsc2Uge1xyXG5cdFx0XHRcdGxvZ0Vycm9ycyAmJiBjb25zb2xlLmxvZygnSW52YWxpZCBzdHJva2VTdHlsZUNvbnRlbnQgdmFsdWUnLCB2YWx1ZVtrZXldKTtcclxuXHRcdFx0fVxyXG5cdFx0fSBlbHNlIGlmIChrZXkgPT09ICdib3VuZHMnICYmIHJvb3QgPT09ICdxdWlsdFdhcnAnKSB7XHJcblx0XHRcdGV4dFR5cGUgPSBtYWtlVHlwZSgnJywgJ2NsYXNzRmxvYXRSZWN0Jyk7XHJcblx0XHR9XHJcblxyXG5cdFx0aWYgKGV4dFR5cGUgJiYgZXh0VHlwZS5jbGFzc0lEID09PSAnUkdCQycpIHtcclxuXHRcdFx0aWYgKCdIICAgJyBpbiB2YWx1ZVtrZXldKSBleHRUeXBlID0geyBjbGFzc0lEOiAnSFNCQycsIG5hbWU6ICcnIH07XHJcblx0XHRcdC8vIFRPRE86IG90aGVyIGNvbG9yIHNwYWNlc1xyXG5cdFx0fVxyXG5cclxuXHRcdHdyaXRlQXNjaWlTdHJpbmdPckNsYXNzSWQod3JpdGVyLCBrZXkpO1xyXG5cdFx0d3JpdGVTaWduYXR1cmUod3JpdGVyLCB0eXBlIHx8ICdsb25nJyk7XHJcblx0XHR3cml0ZU9TVHlwZSh3cml0ZXIsIHR5cGUgfHwgJ2xvbmcnLCB2YWx1ZVtrZXldLCBrZXksIGV4dFR5cGUsIHJvb3QpO1xyXG5cdFx0aWYgKGxvZ0Vycm9ycyAmJiAhdHlwZSkgY29uc29sZS5sb2coYE1pc3NpbmcgZGVzY3JpcHRvciBmaWVsZCB0eXBlIGZvcjogJyR7a2V5fScgaW5gLCB2YWx1ZSk7XHJcblx0fVxyXG59XHJcblxyXG5mdW5jdGlvbiByZWFkT1NUeXBlKHJlYWRlcjogUHNkUmVhZGVyLCB0eXBlOiBzdHJpbmcpIHtcclxuXHRzd2l0Y2ggKHR5cGUpIHtcclxuXHRcdGNhc2UgJ29iaiAnOiAvLyBSZWZlcmVuY2VcclxuXHRcdFx0cmV0dXJuIHJlYWRSZWZlcmVuY2VTdHJ1Y3R1cmUocmVhZGVyKTtcclxuXHRcdGNhc2UgJ09iamMnOiAvLyBEZXNjcmlwdG9yXHJcblx0XHRjYXNlICdHbGJPJzogLy8gR2xvYmFsT2JqZWN0IHNhbWUgYXMgRGVzY3JpcHRvclxyXG5cdFx0XHRyZXR1cm4gcmVhZERlc2NyaXB0b3JTdHJ1Y3R1cmUocmVhZGVyKTtcclxuXHRcdGNhc2UgJ1ZsTHMnOiB7IC8vIExpc3RcclxuXHRcdFx0Y29uc3QgbGVuZ3RoID0gcmVhZEludDMyKHJlYWRlcik7XHJcblx0XHRcdGNvbnN0IGl0ZW1zOiBhbnlbXSA9IFtdO1xyXG5cclxuXHRcdFx0Zm9yIChsZXQgaSA9IDA7IGkgPCBsZW5ndGg7IGkrKykge1xyXG5cdFx0XHRcdGNvbnN0IHR5cGUgPSByZWFkU2lnbmF0dXJlKHJlYWRlcik7XHJcblx0XHRcdFx0Ly8gY29uc29sZS5sb2coJyAgPicsIHR5cGUpO1xyXG5cdFx0XHRcdGl0ZW1zLnB1c2gocmVhZE9TVHlwZShyZWFkZXIsIHR5cGUpKTtcclxuXHRcdFx0fVxyXG5cclxuXHRcdFx0cmV0dXJuIGl0ZW1zO1xyXG5cdFx0fVxyXG5cdFx0Y2FzZSAnZG91Yic6IC8vIERvdWJsZVxyXG5cdFx0XHRyZXR1cm4gcmVhZEZsb2F0NjQocmVhZGVyKTtcclxuXHRcdGNhc2UgJ1VudEYnOiB7IC8vIFVuaXQgZG91YmxlXHJcblx0XHRcdGNvbnN0IHVuaXRzID0gcmVhZFNpZ25hdHVyZShyZWFkZXIpO1xyXG5cdFx0XHRjb25zdCB2YWx1ZSA9IHJlYWRGbG9hdDY0KHJlYWRlcik7XHJcblx0XHRcdGlmICghdW5pdHNNYXBbdW5pdHNdKSB0aHJvdyBuZXcgRXJyb3IoYEludmFsaWQgdW5pdHM6ICR7dW5pdHN9YCk7XHJcblx0XHRcdHJldHVybiB7IHVuaXRzOiB1bml0c01hcFt1bml0c10sIHZhbHVlIH07XHJcblx0XHR9XHJcblx0XHRjYXNlICdVbkZsJzogeyAvLyBVbml0IGZsb2F0XHJcblx0XHRcdGNvbnN0IHVuaXRzID0gcmVhZFNpZ25hdHVyZShyZWFkZXIpO1xyXG5cdFx0XHRjb25zdCB2YWx1ZSA9IHJlYWRGbG9hdDMyKHJlYWRlcik7XHJcblx0XHRcdGlmICghdW5pdHNNYXBbdW5pdHNdKSB0aHJvdyBuZXcgRXJyb3IoYEludmFsaWQgdW5pdHM6ICR7dW5pdHN9YCk7XHJcblx0XHRcdHJldHVybiB7IHVuaXRzOiB1bml0c01hcFt1bml0c10sIHZhbHVlIH07XHJcblx0XHR9XHJcblx0XHRjYXNlICdURVhUJzogLy8gU3RyaW5nXHJcblx0XHRcdHJldHVybiByZWFkVW5pY29kZVN0cmluZyhyZWFkZXIpO1xyXG5cdFx0Y2FzZSAnZW51bSc6IHsgLy8gRW51bWVyYXRlZFxyXG5cdFx0XHRjb25zdCB0eXBlID0gcmVhZEFzY2lpU3RyaW5nT3JDbGFzc0lkKHJlYWRlcik7XHJcblx0XHRcdGNvbnN0IHZhbHVlID0gcmVhZEFzY2lpU3RyaW5nT3JDbGFzc0lkKHJlYWRlcik7XHJcblx0XHRcdHJldHVybiBgJHt0eXBlfS4ke3ZhbHVlfWA7XHJcblx0XHR9XHJcblx0XHRjYXNlICdsb25nJzogLy8gSW50ZWdlclxyXG5cdFx0XHRyZXR1cm4gcmVhZEludDMyKHJlYWRlcik7XHJcblx0XHRjYXNlICdjb21wJzogeyAvLyBMYXJnZSBJbnRlZ2VyXHJcblx0XHRcdGNvbnN0IGxvdyA9IHJlYWRVaW50MzIocmVhZGVyKTtcclxuXHRcdFx0Y29uc3QgaGlnaCA9IHJlYWRVaW50MzIocmVhZGVyKTtcclxuXHRcdFx0cmV0dXJuIHsgbG93LCBoaWdoIH07XHJcblx0XHR9XHJcblx0XHRjYXNlICdib29sJzogLy8gQm9vbGVhblxyXG5cdFx0XHRyZXR1cm4gISFyZWFkVWludDgocmVhZGVyKTtcclxuXHRcdGNhc2UgJ3R5cGUnOiAvLyBDbGFzc1xyXG5cdFx0Y2FzZSAnR2xiQyc6IC8vIENsYXNzXHJcblx0XHRcdHJldHVybiByZWFkQ2xhc3NTdHJ1Y3R1cmUocmVhZGVyKTtcclxuXHRcdGNhc2UgJ2FsaXMnOiB7IC8vIEFsaWFzXHJcblx0XHRcdGNvbnN0IGxlbmd0aCA9IHJlYWRJbnQzMihyZWFkZXIpO1xyXG5cdFx0XHRyZXR1cm4gcmVhZEFzY2lpU3RyaW5nKHJlYWRlciwgbGVuZ3RoKTtcclxuXHRcdH1cclxuXHRcdGNhc2UgJ3RkdGEnOiB7IC8vIFJhdyBEYXRhXHJcblx0XHRcdGNvbnN0IGxlbmd0aCA9IHJlYWRJbnQzMihyZWFkZXIpO1xyXG5cdFx0XHRyZXR1cm4gcmVhZEJ5dGVzKHJlYWRlciwgbGVuZ3RoKTtcclxuXHRcdH1cclxuXHRcdGNhc2UgJ09iQXInOiB7IC8vIE9iamVjdCBhcnJheVxyXG5cdFx0XHRyZWFkSW50MzIocmVhZGVyKTsgLy8gdmVyc2lvbjogMTZcclxuXHRcdFx0cmVhZFVuaWNvZGVTdHJpbmcocmVhZGVyKTsgLy8gbmFtZTogJydcclxuXHRcdFx0cmVhZEFzY2lpU3RyaW5nT3JDbGFzc0lkKHJlYWRlcik7IC8vICdyYXRpb25hbFBvaW50J1xyXG5cdFx0XHRjb25zdCBsZW5ndGggPSByZWFkSW50MzIocmVhZGVyKTtcclxuXHRcdFx0Y29uc3QgaXRlbXM6IGFueVtdID0gW107XHJcblxyXG5cdFx0XHRmb3IgKGxldCBpID0gMDsgaSA8IGxlbmd0aDsgaSsrKSB7XHJcblx0XHRcdFx0Y29uc3QgdHlwZTEgPSByZWFkQXNjaWlTdHJpbmdPckNsYXNzSWQocmVhZGVyKTsgLy8gdHlwZSBIcnpuIHwgVnJ0Y1xyXG5cdFx0XHRcdHJlYWRTaWduYXR1cmUocmVhZGVyKTsgLy8gVW5GbFxyXG5cclxuXHRcdFx0XHRyZWFkU2lnbmF0dXJlKHJlYWRlcik7IC8vIHVuaXRzID8gJyNQeGwnXHJcblx0XHRcdFx0Y29uc3QgdmFsdWVzQ291bnQgPSByZWFkSW50MzIocmVhZGVyKTtcclxuXHRcdFx0XHRjb25zdCB2YWx1ZXM6IG51bWJlcltdID0gW107XHJcblx0XHRcdFx0Zm9yIChsZXQgaiA9IDA7IGogPCB2YWx1ZXNDb3VudDsgaisrKSB7XHJcblx0XHRcdFx0XHR2YWx1ZXMucHVzaChyZWFkRmxvYXQ2NChyZWFkZXIpKTtcclxuXHRcdFx0XHR9XHJcblxyXG5cdFx0XHRcdGl0ZW1zLnB1c2goeyB0eXBlOiB0eXBlMSwgdmFsdWVzIH0pO1xyXG5cdFx0XHR9XHJcblxyXG5cdFx0XHRyZXR1cm4gaXRlbXM7XHJcblx0XHR9XHJcblx0XHRjYXNlICdQdGggJzogeyAvLyBGaWxlIHBhdGhcclxuXHRcdFx0Lypjb25zdCBsZW5ndGggPSovIHJlYWRJbnQzMihyZWFkZXIpO1xyXG5cdFx0XHRjb25zdCBzaWcgPSByZWFkU2lnbmF0dXJlKHJlYWRlcik7XHJcblx0XHRcdC8qY29uc3QgcGF0aFNpemUgPSovIHJlYWRJbnQzMkxFKHJlYWRlcik7XHJcblx0XHRcdGNvbnN0IGNoYXJzQ291bnQgPSByZWFkSW50MzJMRShyZWFkZXIpO1xyXG5cdFx0XHRjb25zdCBwYXRoID0gcmVhZFVuaWNvZGVTdHJpbmdXaXRoTGVuZ3RoKHJlYWRlciwgY2hhcnNDb3VudCk7XHJcblx0XHRcdHJldHVybiB7IHNpZywgcGF0aCB9O1xyXG5cdFx0fVxyXG5cdFx0ZGVmYXVsdDpcclxuXHRcdFx0dGhyb3cgbmV3IEVycm9yKGBJbnZhbGlkIFR5U2ggZGVzY3JpcHRvciBPU1R5cGU6ICR7dHlwZX0gYXQgJHtyZWFkZXIub2Zmc2V0LnRvU3RyaW5nKDE2KX1gKTtcclxuXHR9XHJcbn1cclxuXHJcbmNvbnN0IE9iQXJUeXBlczogeyBba2V5OiBzdHJpbmddOiBzdHJpbmcgfCB1bmRlZmluZWQ7IH0gPSB7XHJcblx0bWVzaFBvaW50czogJ3JhdGlvbmFsUG9pbnQnLFxyXG5cdHF1aWx0U2xpY2VYOiAnVW50RicsXHJcblx0cXVpbHRTbGljZVk6ICdVbnRGJyxcclxufTtcclxuXHJcbmZ1bmN0aW9uIHdyaXRlT1NUeXBlKHdyaXRlcjogUHNkV3JpdGVyLCB0eXBlOiBzdHJpbmcsIHZhbHVlOiBhbnksIGtleTogc3RyaW5nLCBleHRUeXBlOiBOYW1lQ2xhc3NJRCB8IHVuZGVmaW5lZCwgcm9vdDogc3RyaW5nKSB7XHJcblx0c3dpdGNoICh0eXBlKSB7XHJcblx0XHRjYXNlICdvYmogJzogLy8gUmVmZXJlbmNlXHJcblx0XHRcdHdyaXRlUmVmZXJlbmNlU3RydWN0dXJlKHdyaXRlciwga2V5LCB2YWx1ZSk7XHJcblx0XHRcdGJyZWFrO1xyXG5cdFx0Y2FzZSAnT2JqYyc6IC8vIERlc2NyaXB0b3JcclxuXHRcdGNhc2UgJ0dsYk8nOiAvLyBHbG9iYWxPYmplY3Qgc2FtZSBhcyBEZXNjcmlwdG9yXHJcblx0XHRcdGlmICghZXh0VHlwZSkgdGhyb3cgbmV3IEVycm9yKGBNaXNzaW5nIGV4dCB0eXBlIGZvcjogJyR7a2V5fScgKCR7SlNPTi5zdHJpbmdpZnkodmFsdWUpfSlgKTtcclxuXHRcdFx0d3JpdGVEZXNjcmlwdG9yU3RydWN0dXJlKHdyaXRlciwgZXh0VHlwZS5uYW1lLCBleHRUeXBlLmNsYXNzSUQsIHZhbHVlLCByb290KTtcclxuXHRcdFx0YnJlYWs7XHJcblx0XHRjYXNlICdWbExzJzogLy8gTGlzdFxyXG5cdFx0XHR3cml0ZUludDMyKHdyaXRlciwgdmFsdWUubGVuZ3RoKTtcclxuXHJcblx0XHRcdGZvciAobGV0IGkgPSAwOyBpIDwgdmFsdWUubGVuZ3RoOyBpKyspIHtcclxuXHRcdFx0XHRjb25zdCB0eXBlID0gZmllbGRUb0FycmF5VHlwZVtrZXldO1xyXG5cdFx0XHRcdHdyaXRlU2lnbmF0dXJlKHdyaXRlciwgdHlwZSB8fCAnbG9uZycpO1xyXG5cdFx0XHRcdHdyaXRlT1NUeXBlKHdyaXRlciwgdHlwZSB8fCAnbG9uZycsIHZhbHVlW2ldLCAnJywgZmllbGRUb0FycmF5RXh0VHlwZVtrZXldLCByb290KTtcclxuXHRcdFx0XHRpZiAobG9nRXJyb3JzICYmICF0eXBlKSBjb25zb2xlLmxvZyhgTWlzc2luZyBkZXNjcmlwdG9yIGFycmF5IHR5cGUgZm9yOiAnJHtrZXl9JyBpbmAsIHZhbHVlKTtcclxuXHRcdFx0fVxyXG5cdFx0XHRicmVhaztcclxuXHRcdGNhc2UgJ2RvdWInOiAvLyBEb3VibGVcclxuXHRcdFx0d3JpdGVGbG9hdDY0KHdyaXRlciwgdmFsdWUpO1xyXG5cdFx0XHRicmVhaztcclxuXHRcdGNhc2UgJ1VudEYnOiAvLyBVbml0IGRvdWJsZVxyXG5cdFx0XHRpZiAoIXVuaXRzTWFwUmV2W3ZhbHVlLnVuaXRzXSkgdGhyb3cgbmV3IEVycm9yKGBJbnZhbGlkIHVuaXRzOiAke3ZhbHVlLnVuaXRzfSBpbiAke2tleX1gKTtcclxuXHRcdFx0d3JpdGVTaWduYXR1cmUod3JpdGVyLCB1bml0c01hcFJldlt2YWx1ZS51bml0c10pO1xyXG5cdFx0XHR3cml0ZUZsb2F0NjQod3JpdGVyLCB2YWx1ZS52YWx1ZSk7XHJcblx0XHRcdGJyZWFrO1xyXG5cdFx0Y2FzZSAnVW5GbCc6IC8vIFVuaXQgZmxvYXRcclxuXHRcdFx0aWYgKCF1bml0c01hcFJldlt2YWx1ZS51bml0c10pIHRocm93IG5ldyBFcnJvcihgSW52YWxpZCB1bml0czogJHt2YWx1ZS51bml0c30gaW4gJHtrZXl9YCk7XHJcblx0XHRcdHdyaXRlU2lnbmF0dXJlKHdyaXRlciwgdW5pdHNNYXBSZXZbdmFsdWUudW5pdHNdKTtcclxuXHRcdFx0d3JpdGVGbG9hdDMyKHdyaXRlciwgdmFsdWUudmFsdWUpO1xyXG5cdFx0XHRicmVhaztcclxuXHRcdGNhc2UgJ1RFWFQnOiAvLyBTdHJpbmdcclxuXHRcdFx0d3JpdGVVbmljb2RlU3RyaW5nV2l0aFBhZGRpbmcod3JpdGVyLCB2YWx1ZSk7XHJcblx0XHRcdGJyZWFrO1xyXG5cdFx0Y2FzZSAnZW51bSc6IHsgLy8gRW51bWVyYXRlZFxyXG5cdFx0XHRjb25zdCBbX3R5cGUsIHZhbF0gPSB2YWx1ZS5zcGxpdCgnLicpO1xyXG5cdFx0XHR3cml0ZUFzY2lpU3RyaW5nT3JDbGFzc0lkKHdyaXRlciwgX3R5cGUpO1xyXG5cdFx0XHR3cml0ZUFzY2lpU3RyaW5nT3JDbGFzc0lkKHdyaXRlciwgdmFsKTtcclxuXHRcdFx0YnJlYWs7XHJcblx0XHR9XHJcblx0XHRjYXNlICdsb25nJzogLy8gSW50ZWdlclxyXG5cdFx0XHR3cml0ZUludDMyKHdyaXRlciwgdmFsdWUpO1xyXG5cdFx0XHRicmVhaztcclxuXHRcdC8vIGNhc2UgJ2NvbXAnOiAvLyBMYXJnZSBJbnRlZ2VyXHJcblx0XHQvLyBcdHdyaXRlTGFyZ2VJbnRlZ2VyKHJlYWRlcik7XHJcblx0XHRjYXNlICdib29sJzogLy8gQm9vbGVhblxyXG5cdFx0XHR3cml0ZVVpbnQ4KHdyaXRlciwgdmFsdWUgPyAxIDogMCk7XHJcblx0XHRcdGJyZWFrO1xyXG5cdFx0Ly8gY2FzZSAndHlwZSc6IC8vIENsYXNzXHJcblx0XHQvLyBjYXNlICdHbGJDJzogLy8gQ2xhc3NcclxuXHRcdC8vIFx0d3JpdGVDbGFzc1N0cnVjdHVyZShyZWFkZXIpO1xyXG5cdFx0Ly8gY2FzZSAnYWxpcyc6IC8vIEFsaWFzXHJcblx0XHQvLyBcdHdyaXRlQWxpYXNTdHJ1Y3R1cmUocmVhZGVyKTtcclxuXHRcdGNhc2UgJ3RkdGEnOiAvLyBSYXcgRGF0YVxyXG5cdFx0XHR3cml0ZUludDMyKHdyaXRlciwgdmFsdWUuYnl0ZUxlbmd0aCk7XHJcblx0XHRcdHdyaXRlQnl0ZXMod3JpdGVyLCB2YWx1ZSk7XHJcblx0XHRcdGJyZWFrO1xyXG5cdFx0Y2FzZSAnT2JBcic6IHsgLy8gT2JqZWN0IGFycmF5XHJcblx0XHRcdHdyaXRlSW50MzIod3JpdGVyLCAxNik7IC8vIHZlcnNpb25cclxuXHRcdFx0d3JpdGVVbmljb2RlU3RyaW5nV2l0aFBhZGRpbmcod3JpdGVyLCAnJyk7IC8vIG5hbWVcclxuXHRcdFx0Y29uc3QgdHlwZSA9IE9iQXJUeXBlc1trZXldO1xyXG5cdFx0XHRpZiAoIXR5cGUpIHRocm93IG5ldyBFcnJvcihgTm90IGltcGxlbWVudGVkIE9iQXJUeXBlIGZvcjogJHtrZXl9YCk7XHJcblx0XHRcdHdyaXRlQXNjaWlTdHJpbmdPckNsYXNzSWQod3JpdGVyLCB0eXBlKTtcclxuXHRcdFx0d3JpdGVJbnQzMih3cml0ZXIsIHZhbHVlLmxlbmd0aCk7XHJcblxyXG5cdFx0XHRmb3IgKGxldCBpID0gMDsgaSA8IHZhbHVlLmxlbmd0aDsgaSsrKSB7XHJcblx0XHRcdFx0d3JpdGVBc2NpaVN0cmluZ09yQ2xhc3NJZCh3cml0ZXIsIHZhbHVlW2ldLnR5cGUpOyAvLyBIcnpuIHwgVnJ0Y1xyXG5cdFx0XHRcdHdyaXRlU2lnbmF0dXJlKHdyaXRlciwgJ1VuRmwnKTtcclxuXHRcdFx0XHR3cml0ZVNpZ25hdHVyZSh3cml0ZXIsICcjUHhsJyk7XHJcblx0XHRcdFx0d3JpdGVJbnQzMih3cml0ZXIsIHZhbHVlW2ldLnZhbHVlcy5sZW5ndGgpO1xyXG5cclxuXHRcdFx0XHRmb3IgKGxldCBqID0gMDsgaiA8IHZhbHVlW2ldLnZhbHVlcy5sZW5ndGg7IGorKykge1xyXG5cdFx0XHRcdFx0d3JpdGVGbG9hdDY0KHdyaXRlciwgdmFsdWVbaV0udmFsdWVzW2pdKTtcclxuXHRcdFx0XHR9XHJcblx0XHRcdH1cclxuXHRcdFx0YnJlYWs7XHJcblx0XHR9XHJcblx0XHQvLyBjYXNlICdQdGggJzogLy8gRmlsZSBwYXRoXHJcblx0XHQvLyBcdHdyaXRlRmlsZVBhdGgocmVhZGVyKTtcclxuXHRcdGRlZmF1bHQ6XHJcblx0XHRcdHRocm93IG5ldyBFcnJvcihgTm90IGltcGxlbWVudGVkIGRlc2NyaXB0b3IgT1NUeXBlOiAke3R5cGV9YCk7XHJcblx0fVxyXG59XHJcblxyXG5mdW5jdGlvbiByZWFkUmVmZXJlbmNlU3RydWN0dXJlKHJlYWRlcjogUHNkUmVhZGVyKSB7XHJcblx0Y29uc3QgaXRlbXNDb3VudCA9IHJlYWRJbnQzMihyZWFkZXIpO1xyXG5cdGNvbnN0IGl0ZW1zOiBhbnlbXSA9IFtdO1xyXG5cclxuXHRmb3IgKGxldCBpID0gMDsgaSA8IGl0ZW1zQ291bnQ7IGkrKykge1xyXG5cdFx0Y29uc3QgdHlwZSA9IHJlYWRTaWduYXR1cmUocmVhZGVyKTtcclxuXHJcblx0XHRzd2l0Y2ggKHR5cGUpIHtcclxuXHRcdFx0Y2FzZSAncHJvcCc6IHsgLy8gUHJvcGVydHlcclxuXHRcdFx0XHRyZWFkQ2xhc3NTdHJ1Y3R1cmUocmVhZGVyKTtcclxuXHRcdFx0XHRjb25zdCBrZXlJRCA9IHJlYWRBc2NpaVN0cmluZ09yQ2xhc3NJZChyZWFkZXIpO1xyXG5cdFx0XHRcdGl0ZW1zLnB1c2goa2V5SUQpO1xyXG5cdFx0XHRcdGJyZWFrO1xyXG5cdFx0XHR9XHJcblx0XHRcdGNhc2UgJ0Nsc3MnOiAvLyBDbGFzc1xyXG5cdFx0XHRcdGl0ZW1zLnB1c2gocmVhZENsYXNzU3RydWN0dXJlKHJlYWRlcikpO1xyXG5cdFx0XHRcdGJyZWFrO1xyXG5cdFx0XHRjYXNlICdFbm1yJzogeyAvLyBFbnVtZXJhdGVkIFJlZmVyZW5jZVxyXG5cdFx0XHRcdHJlYWRDbGFzc1N0cnVjdHVyZShyZWFkZXIpO1xyXG5cdFx0XHRcdGNvbnN0IHR5cGVJRCA9IHJlYWRBc2NpaVN0cmluZ09yQ2xhc3NJZChyZWFkZXIpO1xyXG5cdFx0XHRcdGNvbnN0IHZhbHVlID0gcmVhZEFzY2lpU3RyaW5nT3JDbGFzc0lkKHJlYWRlcik7XHJcblx0XHRcdFx0aXRlbXMucHVzaChgJHt0eXBlSUR9LiR7dmFsdWV9YCk7XHJcblx0XHRcdFx0YnJlYWs7XHJcblx0XHRcdH1cclxuXHRcdFx0Y2FzZSAncmVsZSc6IHsgLy8gT2Zmc2V0XHJcblx0XHRcdFx0Ly8gY29uc3QgeyBuYW1lLCBjbGFzc0lEIH0gPVxyXG5cdFx0XHRcdHJlYWRDbGFzc1N0cnVjdHVyZShyZWFkZXIpO1xyXG5cdFx0XHRcdGl0ZW1zLnB1c2gocmVhZFVpbnQzMihyZWFkZXIpKTtcclxuXHRcdFx0XHRicmVhaztcclxuXHRcdFx0fVxyXG5cdFx0XHRjYXNlICdJZG50JzogLy8gSWRlbnRpZmllclxyXG5cdFx0XHRcdGl0ZW1zLnB1c2gocmVhZEludDMyKHJlYWRlcikpO1xyXG5cdFx0XHRcdGJyZWFrO1xyXG5cdFx0XHRjYXNlICdpbmR4JzogLy8gSW5kZXhcclxuXHRcdFx0XHRpdGVtcy5wdXNoKHJlYWRJbnQzMihyZWFkZXIpKTtcclxuXHRcdFx0XHRicmVhaztcclxuXHRcdFx0Y2FzZSAnbmFtZSc6IHsgLy8gTmFtZVxyXG5cdFx0XHRcdHJlYWRDbGFzc1N0cnVjdHVyZShyZWFkZXIpO1xyXG5cdFx0XHRcdGl0ZW1zLnB1c2gocmVhZFVuaWNvZGVTdHJpbmcocmVhZGVyKSk7XHJcblx0XHRcdFx0YnJlYWs7XHJcblx0XHRcdH1cclxuXHRcdFx0ZGVmYXVsdDpcclxuXHRcdFx0XHR0aHJvdyBuZXcgRXJyb3IoYEludmFsaWQgZGVzY3JpcHRvciByZWZlcmVuY2UgdHlwZTogJHt0eXBlfWApO1xyXG5cdFx0fVxyXG5cdH1cclxuXHJcblx0cmV0dXJuIGl0ZW1zO1xyXG59XHJcblxyXG5mdW5jdGlvbiB3cml0ZVJlZmVyZW5jZVN0cnVjdHVyZSh3cml0ZXI6IFBzZFdyaXRlciwgX2tleTogc3RyaW5nLCBpdGVtczogYW55W10pIHtcclxuXHR3cml0ZUludDMyKHdyaXRlciwgaXRlbXMubGVuZ3RoKTtcclxuXHJcblx0Zm9yIChsZXQgaSA9IDA7IGkgPCBpdGVtcy5sZW5ndGg7IGkrKykge1xyXG5cdFx0Y29uc3QgdmFsdWUgPSBpdGVtc1tpXTtcclxuXHRcdGxldCB0eXBlID0gJ3Vua25vd24nO1xyXG5cclxuXHRcdGlmICh0eXBlb2YgdmFsdWUgPT09ICdzdHJpbmcnKSB7XHJcblx0XHRcdGlmICgvXlthLXpdK1xcLlthLXpdKyQvaS50ZXN0KHZhbHVlKSkge1xyXG5cdFx0XHRcdHR5cGUgPSAnRW5tcic7XHJcblx0XHRcdH0gZWxzZSB7XHJcblx0XHRcdFx0dHlwZSA9ICduYW1lJztcclxuXHRcdFx0fVxyXG5cdFx0fVxyXG5cclxuXHRcdHdyaXRlU2lnbmF0dXJlKHdyaXRlciwgdHlwZSk7XHJcblxyXG5cdFx0c3dpdGNoICh0eXBlKSB7XHJcblx0XHRcdC8vIGNhc2UgJ3Byb3AnOiAvLyBQcm9wZXJ0eVxyXG5cdFx0XHQvLyBjYXNlICdDbHNzJzogLy8gQ2xhc3NcclxuXHRcdFx0Y2FzZSAnRW5tcic6IHsgLy8gRW51bWVyYXRlZCBSZWZlcmVuY2VcclxuXHRcdFx0XHRjb25zdCBbdHlwZUlELCBlbnVtVmFsdWVdID0gdmFsdWUuc3BsaXQoJy4nKTtcclxuXHRcdFx0XHR3cml0ZUNsYXNzU3RydWN0dXJlKHdyaXRlciwgJ1xcMCcsIHR5cGVJRCk7XHJcblx0XHRcdFx0d3JpdGVBc2NpaVN0cmluZ09yQ2xhc3NJZCh3cml0ZXIsIHR5cGVJRCk7XHJcblx0XHRcdFx0d3JpdGVBc2NpaVN0cmluZ09yQ2xhc3NJZCh3cml0ZXIsIGVudW1WYWx1ZSk7XHJcblx0XHRcdFx0YnJlYWs7XHJcblx0XHRcdH1cclxuXHRcdFx0Ly8gY2FzZSAncmVsZSc6IC8vIE9mZnNldFxyXG5cdFx0XHQvLyBjYXNlICdJZG50JzogLy8gSWRlbnRpZmllclxyXG5cdFx0XHQvLyBjYXNlICdpbmR4JzogLy8gSW5kZXhcclxuXHRcdFx0Y2FzZSAnbmFtZSc6IHsgLy8gTmFtZVxyXG5cdFx0XHRcdHdyaXRlQ2xhc3NTdHJ1Y3R1cmUod3JpdGVyLCAnXFwwJywgJ0x5ciAnKTtcclxuXHRcdFx0XHR3cml0ZVVuaWNvZGVTdHJpbmcod3JpdGVyLCB2YWx1ZSArICdcXDAnKTtcclxuXHRcdFx0XHRicmVhaztcclxuXHRcdFx0fVxyXG5cdFx0XHRkZWZhdWx0OlxyXG5cdFx0XHRcdHRocm93IG5ldyBFcnJvcihgSW52YWxpZCBkZXNjcmlwdG9yIHJlZmVyZW5jZSB0eXBlOiAke3R5cGV9YCk7XHJcblx0XHR9XHJcblx0fVxyXG5cclxuXHRyZXR1cm4gaXRlbXM7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIHJlYWRDbGFzc1N0cnVjdHVyZShyZWFkZXI6IFBzZFJlYWRlcikge1xyXG5cdGNvbnN0IG5hbWUgPSByZWFkVW5pY29kZVN0cmluZyhyZWFkZXIpO1xyXG5cdGNvbnN0IGNsYXNzSUQgPSByZWFkQXNjaWlTdHJpbmdPckNsYXNzSWQocmVhZGVyKTtcclxuXHQvLyBjb25zb2xlLmxvZyh7IG5hbWUsIGNsYXNzSUQgfSk7XHJcblx0cmV0dXJuIHsgbmFtZSwgY2xhc3NJRCB9O1xyXG59XHJcblxyXG5mdW5jdGlvbiB3cml0ZUNsYXNzU3RydWN0dXJlKHdyaXRlcjogUHNkV3JpdGVyLCBuYW1lOiBzdHJpbmcsIGNsYXNzSUQ6IHN0cmluZykge1xyXG5cdHdyaXRlVW5pY29kZVN0cmluZyh3cml0ZXIsIG5hbWUpO1xyXG5cdHdyaXRlQXNjaWlTdHJpbmdPckNsYXNzSWQod3JpdGVyLCBjbGFzc0lEKTtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIHJlYWRWZXJzaW9uQW5kRGVzY3JpcHRvcihyZWFkZXI6IFBzZFJlYWRlcikge1xyXG5cdGNvbnN0IHZlcnNpb24gPSByZWFkVWludDMyKHJlYWRlcik7XHJcblx0aWYgKHZlcnNpb24gIT09IDE2KSB0aHJvdyBuZXcgRXJyb3IoYEludmFsaWQgZGVzY3JpcHRvciB2ZXJzaW9uOiAke3ZlcnNpb259YCk7XHJcblx0Y29uc3QgZGVzYyA9IHJlYWREZXNjcmlwdG9yU3RydWN0dXJlKHJlYWRlcik7XHJcblx0Ly8gY29uc29sZS5sb2cocmVxdWlyZSgndXRpbCcpLmluc3BlY3QoZGVzYywgZmFsc2UsIDk5LCB0cnVlKSk7XHJcblx0cmV0dXJuIGRlc2M7XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiB3cml0ZVZlcnNpb25BbmREZXNjcmlwdG9yKHdyaXRlcjogUHNkV3JpdGVyLCBuYW1lOiBzdHJpbmcsIGNsYXNzSUQ6IHN0cmluZywgZGVzY3JpcHRvcjogYW55LCByb290ID0gJycpIHtcclxuXHR3cml0ZVVpbnQzMih3cml0ZXIsIDE2KTsgLy8gdmVyc2lvblxyXG5cdHdyaXRlRGVzY3JpcHRvclN0cnVjdHVyZSh3cml0ZXIsIG5hbWUsIGNsYXNzSUQsIGRlc2NyaXB0b3IsIHJvb3QpO1xyXG59XHJcblxyXG5leHBvcnQgdHlwZSBEZXNjcmlwdG9yVW5pdHMgPSAnQW5nbGUnIHwgJ0RlbnNpdHknIHwgJ0Rpc3RhbmNlJyB8ICdOb25lJyB8ICdQZXJjZW50JyB8ICdQaXhlbHMnIHxcclxuXHQnTWlsbGltZXRlcnMnIHwgJ1BvaW50cycgfCAnUGljYXMnIHwgJ0luY2hlcycgfCAnQ2VudGltZXRlcnMnO1xyXG5cclxuZXhwb3J0IGludGVyZmFjZSBEZXNjcmlwdG9yVW5pdHNWYWx1ZSB7XHJcblx0dW5pdHM6IERlc2NyaXB0b3JVbml0cztcclxuXHR2YWx1ZTogbnVtYmVyO1xyXG59XHJcblxyXG5leHBvcnQgdHlwZSBEZXNjcmlwdG9yQ29sb3IgPSB7XHJcblx0J1JkICAnOiBudW1iZXI7XHJcblx0J0dybiAnOiBudW1iZXI7XHJcblx0J0JsICAnOiBudW1iZXI7XHJcbn0gfCB7XHJcblx0J0ggICAnOiBEZXNjcmlwdG9yVW5pdHNWYWx1ZTtcclxuXHRTdHJ0OiBudW1iZXI7XHJcblx0QnJnaDogbnVtYmVyO1xyXG59IHwge1xyXG5cdCdDeW4gJzogbnVtYmVyO1xyXG5cdE1nbnQ6IG51bWJlcjtcclxuXHQnWWx3ICc6IG51bWJlcjtcclxuXHRCbGNrOiBudW1iZXI7XHJcbn0gfCB7XHJcblx0J0dyeSAnOiBudW1iZXI7XHJcbn0gfCB7XHJcblx0TG1uYzogbnVtYmVyO1xyXG5cdCdBICAgJzogbnVtYmVyO1xyXG5cdCdCICAgJzogbnVtYmVyO1xyXG59O1xyXG5cclxuZXhwb3J0IGludGVyZmFjZSBEZXNjaXB0b3JQYXR0ZXJuIHtcclxuXHQnTm0gICc6IHN0cmluZztcclxuXHRJZG50OiBzdHJpbmc7XHJcbn1cclxuXHJcbmV4cG9ydCB0eXBlIERlc2NpcHRvckdyYWRpZW50ID0ge1xyXG5cdCdObSAgJzogc3RyaW5nO1xyXG5cdEdyZEY6ICdHcmRGLkNzdFMnO1xyXG5cdEludHI6IG51bWJlcjtcclxuXHRDbHJzOiB7XHJcblx0XHQnQ2xyICc6IERlc2NyaXB0b3JDb2xvcjtcclxuXHRcdFR5cGU6ICdDbHJ5LlVzclMnO1xyXG5cdFx0TGN0bjogbnVtYmVyO1xyXG5cdFx0TWRwbjogbnVtYmVyO1xyXG5cdH1bXTtcclxuXHRUcm5zOiB7XHJcblx0XHRPcGN0OiBEZXNjcmlwdG9yVW5pdHNWYWx1ZTtcclxuXHRcdExjdG46IG51bWJlcjtcclxuXHRcdE1kcG46IG51bWJlcjtcclxuXHR9W107XHJcbn0gfCB7XHJcblx0R3JkRjogJ0dyZEYuQ2xOcyc7XHJcblx0U210aDogbnVtYmVyO1xyXG5cdCdObSAgJzogc3RyaW5nO1xyXG5cdENsclM6IHN0cmluZztcclxuXHRSbmRTOiBudW1iZXI7XHJcblx0VmN0Qz86IGJvb2xlYW47XHJcblx0U2hUcj86IGJvb2xlYW47XHJcblx0J01ubSAnOiBudW1iZXJbXTtcclxuXHQnTXhtICc6IG51bWJlcltdO1xyXG59O1xyXG5cclxuZXhwb3J0IGludGVyZmFjZSBEZXNjcmlwdG9yQ29sb3JDb250ZW50IHtcclxuXHQnQ2xyICc6IERlc2NyaXB0b3JDb2xvcjtcclxufVxyXG5cclxuZXhwb3J0IGludGVyZmFjZSBEZXNjcmlwdG9yR3JhZGllbnRDb250ZW50IHtcclxuXHRHcmFkOiBEZXNjaXB0b3JHcmFkaWVudDtcclxuXHRUeXBlOiBzdHJpbmc7XHJcblx0RHRocj86IGJvb2xlYW47XHJcblx0UnZycz86IGJvb2xlYW47XHJcblx0QW5nbD86IERlc2NyaXB0b3JVbml0c1ZhbHVlO1xyXG5cdCdTY2wgJz86IERlc2NyaXB0b3JVbml0c1ZhbHVlO1xyXG5cdEFsZ24/OiBib29sZWFuO1xyXG5cdE9mc3Q/OiB7IEhyem46IERlc2NyaXB0b3JVbml0c1ZhbHVlOyBWcnRjOiBEZXNjcmlwdG9yVW5pdHNWYWx1ZTsgfTtcclxufVxyXG5cclxuZXhwb3J0IGludGVyZmFjZSBEZXNjcmlwdG9yUGF0dGVybkNvbnRlbnQge1xyXG5cdFB0cm46IERlc2NpcHRvclBhdHRlcm47XHJcblx0TG5rZD86IGJvb2xlYW47XHJcblx0cGhhc2U/OiB7IEhyem46IG51bWJlcjsgVnJ0YzogbnVtYmVyOyB9O1xyXG59XHJcblxyXG5leHBvcnQgdHlwZSBEZXNjcmlwdG9yVmVjdG9yQ29udGVudCA9IERlc2NyaXB0b3JDb2xvckNvbnRlbnQgfCBEZXNjcmlwdG9yR3JhZGllbnRDb250ZW50IHwgRGVzY3JpcHRvclBhdHRlcm5Db250ZW50O1xyXG5cclxuZXhwb3J0IGludGVyZmFjZSBTdHJva2VEZXNjcmlwdG9yIHtcclxuXHRzdHJva2VTdHlsZVZlcnNpb246IG51bWJlcjtcclxuXHRzdHJva2VFbmFibGVkOiBib29sZWFuO1xyXG5cdGZpbGxFbmFibGVkOiBib29sZWFuO1xyXG5cdHN0cm9rZVN0eWxlTGluZVdpZHRoOiBEZXNjcmlwdG9yVW5pdHNWYWx1ZTtcclxuXHRzdHJva2VTdHlsZUxpbmVEYXNoT2Zmc2V0OiBEZXNjcmlwdG9yVW5pdHNWYWx1ZTtcclxuXHRzdHJva2VTdHlsZU1pdGVyTGltaXQ6IG51bWJlcjtcclxuXHRzdHJva2VTdHlsZUxpbmVDYXBUeXBlOiBzdHJpbmc7XHJcblx0c3Ryb2tlU3R5bGVMaW5lSm9pblR5cGU6IHN0cmluZztcclxuXHRzdHJva2VTdHlsZUxpbmVBbGlnbm1lbnQ6IHN0cmluZztcclxuXHRzdHJva2VTdHlsZVNjYWxlTG9jazogYm9vbGVhbjtcclxuXHRzdHJva2VTdHlsZVN0cm9rZUFkanVzdDogYm9vbGVhbjtcclxuXHRzdHJva2VTdHlsZUxpbmVEYXNoU2V0OiBEZXNjcmlwdG9yVW5pdHNWYWx1ZVtdO1xyXG5cdHN0cm9rZVN0eWxlQmxlbmRNb2RlOiBzdHJpbmc7XHJcblx0c3Ryb2tlU3R5bGVPcGFjaXR5OiBEZXNjcmlwdG9yVW5pdHNWYWx1ZTtcclxuXHRzdHJva2VTdHlsZUNvbnRlbnQ6IERlc2NyaXB0b3JWZWN0b3JDb250ZW50O1xyXG5cdHN0cm9rZVN0eWxlUmVzb2x1dGlvbjogbnVtYmVyO1xyXG59XHJcblxyXG5leHBvcnQgaW50ZXJmYWNlIFRleHREZXNjcmlwdG9yIHtcclxuXHQnVHh0ICc6IHN0cmluZztcclxuXHR0ZXh0R3JpZGRpbmc6IHN0cmluZztcclxuXHRPcm50OiBzdHJpbmc7XHJcblx0QW50QTogc3RyaW5nO1xyXG5cdFRleHRJbmRleDogbnVtYmVyO1xyXG5cdEVuZ2luZURhdGE/OiBVaW50OEFycmF5O1xyXG59XHJcblxyXG5leHBvcnQgaW50ZXJmYWNlIFdhcnBEZXNjcmlwdG9yIHtcclxuXHR3YXJwU3R5bGU6IHN0cmluZztcclxuXHR3YXJwVmFsdWU6IG51bWJlcjtcclxuXHR3YXJwUGVyc3BlY3RpdmU6IG51bWJlcjtcclxuXHR3YXJwUGVyc3BlY3RpdmVPdGhlcjogbnVtYmVyO1xyXG5cdHdhcnBSb3RhdGU6IHN0cmluZztcclxuXHRib3VuZHM/OiB7XHJcblx0XHQnVG9wICc6IERlc2NyaXB0b3JVbml0c1ZhbHVlO1xyXG5cdFx0TGVmdDogRGVzY3JpcHRvclVuaXRzVmFsdWU7XHJcblx0XHRCdG9tOiBEZXNjcmlwdG9yVW5pdHNWYWx1ZTtcclxuXHRcdFJnaHQ6IERlc2NyaXB0b3JVbml0c1ZhbHVlO1xyXG5cdH07XHJcblx0dU9yZGVyOiBudW1iZXI7XHJcblx0dk9yZGVyOiBudW1iZXI7XHJcblx0Y3VzdG9tRW52ZWxvcGVXYXJwPzoge1xyXG5cdFx0bWVzaFBvaW50czoge1xyXG5cdFx0XHR0eXBlOiAnSHJ6bicgfCAnVnJ0Yyc7XHJcblx0XHRcdHZhbHVlczogbnVtYmVyW107XHJcblx0XHR9W107XHJcblx0fTtcclxufVxyXG5cclxuZXhwb3J0IGludGVyZmFjZSBRdWlsdFdhcnBEZXNjcmlwdG9yIGV4dGVuZHMgV2FycERlc2NyaXB0b3Ige1xyXG5cdGRlZm9ybU51bVJvd3M6IG51bWJlcjtcclxuXHRkZWZvcm1OdW1Db2xzOiBudW1iZXI7XHJcblx0Y3VzdG9tRW52ZWxvcGVXYXJwOiB7XHJcblx0XHRxdWlsdFNsaWNlWDoge1xyXG5cdFx0XHR0eXBlOiAncXVpbHRTbGljZVgnO1xyXG5cdFx0XHR2YWx1ZXM6IG51bWJlcltdO1xyXG5cdFx0fVtdO1xyXG5cdFx0cXVpbHRTbGljZVk6IHtcclxuXHRcdFx0dHlwZTogJ3F1aWx0U2xpY2VZJztcclxuXHRcdFx0dmFsdWVzOiBudW1iZXJbXTtcclxuXHRcdH1bXTtcclxuXHRcdG1lc2hQb2ludHM6IHtcclxuXHRcdFx0dHlwZTogJ0hyem4nIHwgJ1ZydGMnO1xyXG5cdFx0XHR2YWx1ZXM6IG51bWJlcltdO1xyXG5cdFx0fVtdO1xyXG5cdH07XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBwYXJzZUFuZ2xlKHg6IERlc2NyaXB0b3JVbml0c1ZhbHVlKSB7XHJcblx0aWYgKHggPT09IHVuZGVmaW5lZCkgcmV0dXJuIDA7XHJcblx0aWYgKHgudW5pdHMgIT09ICdBbmdsZScpIHRocm93IG5ldyBFcnJvcihgSW52YWxpZCB1bml0czogJHt4LnVuaXRzfWApO1xyXG5cdHJldHVybiB4LnZhbHVlO1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gcGFyc2VQZXJjZW50KHg6IERlc2NyaXB0b3JVbml0c1ZhbHVlIHwgdW5kZWZpbmVkKSB7XHJcblx0aWYgKHggPT09IHVuZGVmaW5lZCkgcmV0dXJuIDE7XHJcblx0aWYgKHgudW5pdHMgIT09ICdQZXJjZW50JykgdGhyb3cgbmV3IEVycm9yKGBJbnZhbGlkIHVuaXRzOiAke3gudW5pdHN9YCk7XHJcblx0cmV0dXJuIHgudmFsdWUgLyAxMDA7XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBwYXJzZVBlcmNlbnRPckFuZ2xlKHg6IERlc2NyaXB0b3JVbml0c1ZhbHVlIHwgdW5kZWZpbmVkKSB7XHJcblx0aWYgKHggPT09IHVuZGVmaW5lZCkgcmV0dXJuIDE7XHJcblx0aWYgKHgudW5pdHMgPT09ICdQZXJjZW50JykgcmV0dXJuIHgudmFsdWUgLyAxMDA7XHJcblx0aWYgKHgudW5pdHMgPT09ICdBbmdsZScpIHJldHVybiB4LnZhbHVlIC8gMzYwO1xyXG5cdHRocm93IG5ldyBFcnJvcihgSW52YWxpZCB1bml0czogJHt4LnVuaXRzfWApO1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gcGFyc2VVbml0cyh7IHVuaXRzLCB2YWx1ZSB9OiBEZXNjcmlwdG9yVW5pdHNWYWx1ZSk6IFVuaXRzVmFsdWUge1xyXG5cdGlmIChcclxuXHRcdHVuaXRzICE9PSAnUGl4ZWxzJyAmJiB1bml0cyAhPT0gJ01pbGxpbWV0ZXJzJyAmJiB1bml0cyAhPT0gJ1BvaW50cycgJiYgdW5pdHMgIT09ICdOb25lJyAmJlxyXG5cdFx0dW5pdHMgIT09ICdQaWNhcycgJiYgdW5pdHMgIT09ICdJbmNoZXMnICYmIHVuaXRzICE9PSAnQ2VudGltZXRlcnMnICYmIHVuaXRzICE9PSAnRGVuc2l0eSdcclxuXHQpIHtcclxuXHRcdHRocm93IG5ldyBFcnJvcihgSW52YWxpZCB1bml0czogJHtKU09OLnN0cmluZ2lmeSh7IHVuaXRzLCB2YWx1ZSB9KX1gKTtcclxuXHR9XHJcblx0cmV0dXJuIHsgdmFsdWUsIHVuaXRzIH07XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBwYXJzZVVuaXRzT3JOdW1iZXIodmFsdWU6IERlc2NyaXB0b3JVbml0c1ZhbHVlIHwgbnVtYmVyLCB1bml0czogVW5pdHMgPSAnUGl4ZWxzJyk6IFVuaXRzVmFsdWUge1xyXG5cdGlmICh0eXBlb2YgdmFsdWUgPT09ICdudW1iZXInKSByZXR1cm4geyB2YWx1ZSwgdW5pdHMgfTtcclxuXHRyZXR1cm4gcGFyc2VVbml0cyh2YWx1ZSk7XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBwYXJzZVVuaXRzVG9OdW1iZXIoeyB1bml0cywgdmFsdWUgfTogRGVzY3JpcHRvclVuaXRzVmFsdWUsIGV4cGVjdGVkVW5pdHM6IHN0cmluZyk6IG51bWJlciB7XHJcblx0aWYgKHVuaXRzICE9PSBleHBlY3RlZFVuaXRzKSB0aHJvdyBuZXcgRXJyb3IoYEludmFsaWQgdW5pdHM6ICR7SlNPTi5zdHJpbmdpZnkoeyB1bml0cywgdmFsdWUgfSl9YCk7XHJcblx0cmV0dXJuIHZhbHVlO1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gdW5pdHNBbmdsZSh2YWx1ZTogbnVtYmVyIHwgdW5kZWZpbmVkKTogRGVzY3JpcHRvclVuaXRzVmFsdWUge1xyXG5cdHJldHVybiB7IHVuaXRzOiAnQW5nbGUnLCB2YWx1ZTogdmFsdWUgfHwgMCB9O1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gdW5pdHNQZXJjZW50KHZhbHVlOiBudW1iZXIgfCB1bmRlZmluZWQpOiBEZXNjcmlwdG9yVW5pdHNWYWx1ZSB7XHJcblx0cmV0dXJuIHsgdW5pdHM6ICdQZXJjZW50JywgdmFsdWU6IE1hdGgucm91bmQoKHZhbHVlIHx8IDApICogMTAwKSB9O1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gdW5pdHNWYWx1ZSh4OiBVbml0c1ZhbHVlIHwgdW5kZWZpbmVkLCBrZXk6IHN0cmluZyk6IERlc2NyaXB0b3JVbml0c1ZhbHVlIHtcclxuXHRpZiAoeCA9PSBudWxsKSByZXR1cm4geyB1bml0czogJ1BpeGVscycsIHZhbHVlOiAwIH07XHJcblxyXG5cdGlmICh0eXBlb2YgeCAhPT0gJ29iamVjdCcpXHJcblx0XHR0aHJvdyBuZXcgRXJyb3IoYEludmFsaWQgdmFsdWU6ICR7SlNPTi5zdHJpbmdpZnkoeCl9IChrZXk6ICR7a2V5fSkgKHNob3VsZCBoYXZlIHZhbHVlIGFuZCB1bml0cylgKTtcclxuXHJcblx0Y29uc3QgeyB1bml0cywgdmFsdWUgfSA9IHg7XHJcblxyXG5cdGlmICh0eXBlb2YgdmFsdWUgIT09ICdudW1iZXInKVxyXG5cdFx0dGhyb3cgbmV3IEVycm9yKGBJbnZhbGlkIHZhbHVlIGluICR7SlNPTi5zdHJpbmdpZnkoeCl9IChrZXk6ICR7a2V5fSlgKTtcclxuXHJcblx0aWYgKFxyXG5cdFx0dW5pdHMgIT09ICdQaXhlbHMnICYmIHVuaXRzICE9PSAnTWlsbGltZXRlcnMnICYmIHVuaXRzICE9PSAnUG9pbnRzJyAmJiB1bml0cyAhPT0gJ05vbmUnICYmXHJcblx0XHR1bml0cyAhPT0gJ1BpY2FzJyAmJiB1bml0cyAhPT0gJ0luY2hlcycgJiYgdW5pdHMgIT09ICdDZW50aW1ldGVycycgJiYgdW5pdHMgIT09ICdEZW5zaXR5J1xyXG5cdCkge1xyXG5cdFx0dGhyb3cgbmV3IEVycm9yKGBJbnZhbGlkIHVuaXRzIGluICR7SlNPTi5zdHJpbmdpZnkoeCl9IChrZXk6ICR7a2V5fSlgKTtcclxuXHR9XHJcblxyXG5cdHJldHVybiB7IHVuaXRzLCB2YWx1ZSB9O1xyXG59XHJcblxyXG5leHBvcnQgY29uc3QgdGV4dEdyaWRkaW5nID0gY3JlYXRlRW51bTxUZXh0R3JpZGRpbmc+KCd0ZXh0R3JpZGRpbmcnLCAnbm9uZScsIHtcclxuXHRub25lOiAnTm9uZScsXHJcblx0cm91bmQ6ICdSbmQgJyxcclxufSk7XHJcblxyXG5leHBvcnQgY29uc3QgT3JudCA9IGNyZWF0ZUVudW08T3JpZW50YXRpb24+KCdPcm50JywgJ2hvcml6b250YWwnLCB7XHJcblx0aG9yaXpvbnRhbDogJ0hyem4nLFxyXG5cdHZlcnRpY2FsOiAnVnJ0YycsXHJcbn0pO1xyXG5cclxuZXhwb3J0IGNvbnN0IEFubnQgPSBjcmVhdGVFbnVtPEFudGlBbGlhcz4oJ0FubnQnLCAnc2hhcnAnLCB7XHJcblx0bm9uZTogJ0Fubm8nLFxyXG5cdHNoYXJwOiAnYW50aUFsaWFzU2hhcnAnLFxyXG5cdGNyaXNwOiAnQW5DcicsXHJcblx0c3Ryb25nOiAnQW5TdCcsXHJcblx0c21vb3RoOiAnQW5TbScsXHJcblx0cGxhdGZvcm06ICdhbnRpQWxpYXNQbGF0Zm9ybUdyYXknLFxyXG5cdHBsYXRmb3JtTENEOiAnYW50aUFsaWFzUGxhdGZvcm1MQ0QnLFxyXG59KTtcclxuXHJcbmV4cG9ydCBjb25zdCB3YXJwU3R5bGUgPSBjcmVhdGVFbnVtPFdhcnBTdHlsZT4oJ3dhcnBTdHlsZScsICdub25lJywge1xyXG5cdG5vbmU6ICd3YXJwTm9uZScsXHJcblx0YXJjOiAnd2FycEFyYycsXHJcblx0YXJjTG93ZXI6ICd3YXJwQXJjTG93ZXInLFxyXG5cdGFyY1VwcGVyOiAnd2FycEFyY1VwcGVyJyxcclxuXHRhcmNoOiAnd2FycEFyY2gnLFxyXG5cdGJ1bGdlOiAnd2FycEJ1bGdlJyxcclxuXHRzaGVsbExvd2VyOiAnd2FycFNoZWxsTG93ZXInLFxyXG5cdHNoZWxsVXBwZXI6ICd3YXJwU2hlbGxVcHBlcicsXHJcblx0ZmxhZzogJ3dhcnBGbGFnJyxcclxuXHR3YXZlOiAnd2FycFdhdmUnLFxyXG5cdGZpc2g6ICd3YXJwRmlzaCcsXHJcblx0cmlzZTogJ3dhcnBSaXNlJyxcclxuXHRmaXNoZXllOiAnd2FycEZpc2hleWUnLFxyXG5cdGluZmxhdGU6ICd3YXJwSW5mbGF0ZScsXHJcblx0c3F1ZWV6ZTogJ3dhcnBTcXVlZXplJyxcclxuXHR0d2lzdDogJ3dhcnBUd2lzdCcsXHJcblx0Y3VzdG9tOiAnd2FycEN1c3RvbScsXHJcbn0pO1xyXG5cclxuZXhwb3J0IGNvbnN0IEJsbk0gPSBjcmVhdGVFbnVtPEJsZW5kTW9kZT4oJ0Jsbk0nLCAnbm9ybWFsJywge1xyXG5cdCdub3JtYWwnOiAnTnJtbCcsXHJcblx0J2Rpc3NvbHZlJzogJ0RzbHYnLFxyXG5cdCdkYXJrZW4nOiAnRHJrbicsXHJcblx0J211bHRpcGx5JzogJ01sdHAnLFxyXG5cdCdjb2xvciBidXJuJzogJ0NCcm4nLFxyXG5cdCdsaW5lYXIgYnVybic6ICdsaW5lYXJCdXJuJyxcclxuXHQnZGFya2VyIGNvbG9yJzogJ2RhcmtlckNvbG9yJyxcclxuXHQnbGlnaHRlbic6ICdMZ2huJyxcclxuXHQnc2NyZWVuJzogJ1Njcm4nLFxyXG5cdCdjb2xvciBkb2RnZSc6ICdDRGRnJyxcclxuXHQnbGluZWFyIGRvZGdlJzogJ2xpbmVhckRvZGdlJyxcclxuXHQnbGlnaHRlciBjb2xvcic6ICdsaWdodGVyQ29sb3InLFxyXG5cdCdvdmVybGF5JzogJ092cmwnLFxyXG5cdCdzb2Z0IGxpZ2h0JzogJ1NmdEwnLFxyXG5cdCdoYXJkIGxpZ2h0JzogJ0hyZEwnLFxyXG5cdCd2aXZpZCBsaWdodCc6ICd2aXZpZExpZ2h0JyxcclxuXHQnbGluZWFyIGxpZ2h0JzogJ2xpbmVhckxpZ2h0JyxcclxuXHQncGluIGxpZ2h0JzogJ3BpbkxpZ2h0JyxcclxuXHQnaGFyZCBtaXgnOiAnaGFyZE1peCcsXHJcblx0J2RpZmZlcmVuY2UnOiAnRGZybicsXHJcblx0J2V4Y2x1c2lvbic6ICdYY2x1JyxcclxuXHQnc3VidHJhY3QnOiAnYmxlbmRTdWJ0cmFjdGlvbicsXHJcblx0J2RpdmlkZSc6ICdibGVuZERpdmlkZScsXHJcblx0J2h1ZSc6ICdIICAgJyxcclxuXHQnc2F0dXJhdGlvbic6ICdTdHJ0JyxcclxuXHQnY29sb3InOiAnQ2xyICcsXHJcblx0J2x1bWlub3NpdHknOiAnTG1ucycsXHJcbn0pO1xyXG5cclxuZXhwb3J0IGNvbnN0IEJFU2wgPSBjcmVhdGVFbnVtPEJldmVsU3R5bGU+KCdCRVNsJywgJ2lubmVyIGJldmVsJywge1xyXG5cdCdpbm5lciBiZXZlbCc6ICdJbnJCJyxcclxuXHQnb3V0ZXIgYmV2ZWwnOiAnT3RyQicsXHJcblx0J2VtYm9zcyc6ICdFbWJzJyxcclxuXHQncGlsbG93IGVtYm9zcyc6ICdQbEViJyxcclxuXHQnc3Ryb2tlIGVtYm9zcyc6ICdzdHJva2VFbWJvc3MnLFxyXG59KTtcclxuXHJcbmV4cG9ydCBjb25zdCBidmxUID0gY3JlYXRlRW51bTxCZXZlbFRlY2huaXF1ZT4oJ2J2bFQnLCAnc21vb3RoJywge1xyXG5cdCdzbW9vdGgnOiAnU2ZCTCcsXHJcblx0J2NoaXNlbCBoYXJkJzogJ1ByQkwnLFxyXG5cdCdjaGlzZWwgc29mdCc6ICdTbG10JyxcclxufSk7XHJcblxyXG5leHBvcnQgY29uc3QgQkVTcyA9IGNyZWF0ZUVudW08QmV2ZWxEaXJlY3Rpb24+KCdCRVNzJywgJ3VwJywge1xyXG5cdHVwOiAnSW4gICcsXHJcblx0ZG93bjogJ091dCAnLFxyXG59KTtcclxuXHJcbmV4cG9ydCBjb25zdCBCRVRFID0gY3JlYXRlRW51bTxHbG93VGVjaG5pcXVlPignQkVURScsICdzb2Z0ZXInLCB7XHJcblx0c29mdGVyOiAnU2ZCTCcsXHJcblx0cHJlY2lzZTogJ1ByQkwnLFxyXG59KTtcclxuXHJcbmV4cG9ydCBjb25zdCBJR1NyID0gY3JlYXRlRW51bTxHbG93U291cmNlPignSUdTcicsICdlZGdlJywge1xyXG5cdGVkZ2U6ICdTcmNFJyxcclxuXHRjZW50ZXI6ICdTcmNDJyxcclxufSk7XHJcblxyXG5leHBvcnQgY29uc3QgR3JkVCA9IGNyZWF0ZUVudW08R3JhZGllbnRTdHlsZT4oJ0dyZFQnLCAnbGluZWFyJywge1xyXG5cdGxpbmVhcjogJ0xuciAnLFxyXG5cdHJhZGlhbDogJ1JkbCAnLFxyXG5cdGFuZ2xlOiAnQW5nbCcsXHJcblx0cmVmbGVjdGVkOiAnUmZsYycsXHJcblx0ZGlhbW9uZDogJ0RtbmQnLFxyXG59KTtcclxuXHJcbmV4cG9ydCBjb25zdCBDbHJTID0gY3JlYXRlRW51bTwncmdiJyB8ICdoc2InIHwgJ2xhYic+KCdDbHJTJywgJ3JnYicsIHtcclxuXHRyZ2I6ICdSR0JDJyxcclxuXHRoc2I6ICdIU0JsJyxcclxuXHRsYWI6ICdMYkNsJyxcclxufSk7XHJcblxyXG5leHBvcnQgY29uc3QgRlN0bCA9IGNyZWF0ZUVudW08J2luc2lkZScgfCAnY2VudGVyJyB8ICdvdXRzaWRlJz4oJ0ZTdGwnLCAnb3V0c2lkZScsIHtcclxuXHRvdXRzaWRlOiAnT3V0RicsXHJcblx0Y2VudGVyOiAnQ3RyRicsXHJcblx0aW5zaWRlOiAnSW5zRidcclxufSk7XHJcblxyXG5leHBvcnQgY29uc3QgRnJGbCA9IGNyZWF0ZUVudW08J2NvbG9yJyB8ICdncmFkaWVudCcgfCAncGF0dGVybic+KCdGckZsJywgJ2NvbG9yJywge1xyXG5cdGNvbG9yOiAnU0NscicsXHJcblx0Z3JhZGllbnQ6ICdHckZsJyxcclxuXHRwYXR0ZXJuOiAnUHRybicsXHJcbn0pO1xyXG5cclxuZXhwb3J0IGNvbnN0IHN0cm9rZVN0eWxlTGluZUNhcFR5cGUgPSBjcmVhdGVFbnVtPExpbmVDYXBUeXBlPignc3Ryb2tlU3R5bGVMaW5lQ2FwVHlwZScsICdidXR0Jywge1xyXG5cdGJ1dHQ6ICdzdHJva2VTdHlsZUJ1dHRDYXAnLFxyXG5cdHJvdW5kOiAnc3Ryb2tlU3R5bGVSb3VuZENhcCcsXHJcblx0c3F1YXJlOiAnc3Ryb2tlU3R5bGVTcXVhcmVDYXAnLFxyXG59KTtcclxuXHJcbmV4cG9ydCBjb25zdCBzdHJva2VTdHlsZUxpbmVKb2luVHlwZSA9IGNyZWF0ZUVudW08TGluZUpvaW5UeXBlPignc3Ryb2tlU3R5bGVMaW5lSm9pblR5cGUnLCAnbWl0ZXInLCB7XHJcblx0bWl0ZXI6ICdzdHJva2VTdHlsZU1pdGVySm9pbicsXHJcblx0cm91bmQ6ICdzdHJva2VTdHlsZVJvdW5kSm9pbicsXHJcblx0YmV2ZWw6ICdzdHJva2VTdHlsZUJldmVsSm9pbicsXHJcbn0pO1xyXG5cclxuZXhwb3J0IGNvbnN0IHN0cm9rZVN0eWxlTGluZUFsaWdubWVudCA9IGNyZWF0ZUVudW08TGluZUFsaWdubWVudD4oJ3N0cm9rZVN0eWxlTGluZUFsaWdubWVudCcsICdpbnNpZGUnLCB7XHJcblx0aW5zaWRlOiAnc3Ryb2tlU3R5bGVBbGlnbkluc2lkZScsXHJcblx0Y2VudGVyOiAnc3Ryb2tlU3R5bGVBbGlnbkNlbnRlcicsXHJcblx0b3V0c2lkZTogJ3N0cm9rZVN0eWxlQWxpZ25PdXRzaWRlJyxcclxufSk7XHJcbiJdLCJzb3VyY2VSb290IjoiL2hvbWUvbWFuaC9rYW9waXovZWVsL2FnLXBzZC9zcmMifQ==
