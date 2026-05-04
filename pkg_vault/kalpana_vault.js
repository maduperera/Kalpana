async function instantiate(module, imports = {}) {
  const adaptedImports = {
    env: Object.setPrototypeOf({
      abort(message, fileName, lineNumber, columnNumber) {
        message = __liftString(message >>> 0);
        fileName = __liftString(fileName >>> 0);
        lineNumber = lineNumber >>> 0;
        columnNumber = columnNumber >>> 0;
        (() => { throw Error(`${message} in ${fileName}:${lineNumber}:${columnNumber}`); })();
      },
      seed() { return Date.now() * Math.random(); },
    }, Object.assign(Object.create(globalThis), imports.env || {})),
  };
  const { exports } = await WebAssembly.instantiate(module, adaptedImports);
  const memory = exports.memory || imports.env.memory;
  const adaptedExports = Object.setPrototypeOf({
    writeRIF(t, emb) {
      emb = __lowerTypedArray(Float32Array, 5, 2, emb) || __notnull();
      exports.writeRIF(t, emb);
    },
    readRIF(t, qV) {
      qV = __lowerTypedArray(Float32Array, 5, 2, qV) || __notnull();
      return exports.readRIF(t, qV);
    },
    getVersion() { return __liftString(exports.getVersion() >>> 0); },
  }, exports);
  function __liftString(pointer) {
    if (!pointer) return null;
    const end = pointer + new Uint32Array(memory.buffer)[pointer - 4 >>> 2] >>> 1, memoryU16 = new Uint16Array(memory.buffer);
    let start = pointer >>> 1, string = "";
    while (end - start > 1024) string += String.fromCharCode(...memoryU16.subarray(start, start += 1024));
    return string + String.fromCharCode(...memoryU16.subarray(start, end));
  }
  function __lowerTypedArray(constructor, id, align, values) {
    if (values == null) return 0;
    const length = values.length, buffer = exports.__pin(exports.__new(length << align, 1)) >>> 0, header = exports.__new(12, id) >>> 0;
    __setU32(header + 0, buffer);
    __dataview.setUint32(header + 4, buffer, true);
    __dataview.setUint32(header + 8, length << align, true);
    new constructor(memory.buffer, buffer, length).set(values);
    exports.__unpin(buffer);
    return header;
  }
  function __notnull() { throw TypeError("value must not be null"); }
  let __dataview = new DataView(memory.buffer);
  function __setU32(pointer, value) {
    try { __dataview.setUint32(pointer, value, true); } catch { __dataview = new DataView(memory.buffer); __dataview.setUint32(pointer, value, true); }
  }
  return adaptedExports;
}
export const {
  memory,
  initEngine,
  writeRIF,
  readRIF,
  getVersion,
} = await (async url => instantiate(
  await (async () => {
    return await globalThis.WebAssembly.compileStreaming(globalThis.fetch(url));
  })(), {
  }
))(new URL("kalpana_vault.wasm", import.meta.url));
