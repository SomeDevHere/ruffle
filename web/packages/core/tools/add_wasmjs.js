/* eslint-env node */

const replace = require("replace-in-file");
const fs = require("fs");

const source = fs.readFileSync("./pkg/ruffle_web_bg.js",'utf-8');
var wasmStart = 0;
var imports = "";
var segment = "";
while (source.slice(wasmStart,wasmStart + 9) == "import { ") {
    wasmStart += 9;
    segment = source.slice(wasmStart);
    var import_name = segment.slice(0, segment.indexOf(" }"));
    wasmStart += import_name.length + 9;
    segment = segment.slice(import_name.length + 9);
    var import_namespace = segment.slice(0, segment.indexOf("'"));
    wasmStart += import_namespace.length + 3; 
    imports = imports + "var " + import_name + " = imports." + 
        import_namespace + "." + import_name + ";\n";
}
const wasm = source.slice(wasmStart, source.indexOf("\nexport var"));
wasmStart += wasm.length;
var exports = "";
while (source.slice(wasmStart).indexOf("export var ") > 0) {
    wasmStart += 12;
    segment = source.slice(wasmStart);
    exports = exports + ",'" +
        segment.slice(0, segment.indexOf(' ')) + "' :" +
        segment.slice(segment.indexOf(' ') + 3, segment.indexOf(';')) + "\n";
    wasmStart += segment.indexOf(';') + 1;
}
const wasm2jsPolyfill = "async function load(module, imports) {\n" +
    "try {\n" +
    "new WebAssembly.Module(new Uint8Array([0,97,115,109,1,0,0,0]));\n" +
    "} catch (e) {\n" +
    "return function(){" + imports + wasm +"return {'instance':{'exports':{"+exports.slice(1)+"}},'module':null}}();\n" +
    "}";
const regex = new RegExp('async function load\\(module, imports\\) {\\n', 'g');
const options = {
    files: "./pkg/ruffle_web.js",
    from: regex,
    to: [wasm2jsPolyfill],
};

replace.sync(options);
