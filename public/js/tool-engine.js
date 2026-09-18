const moduleCache = new Map();
export async function loadToolModule(tool){if(!tool?.module)throw new Error("Tool module is not configured");if(!moduleCache.has(tool.module))moduleCache.set(tool.module,import(`/js/tool-modules/${tool.module}.js`));return moduleCache.get(tool.module);}
