const ENGINE_VERSION="2026.09.19.1";
const moduleCache=new Map();

export async function loadToolModule(tool){
  if(!tool?.module)throw new Error("Tool module is not configured");
  if(!moduleCache.has(tool.module)){
    const moduleUrl=`/js/tool-modules/${encodeURIComponent(tool.module)}.js?v=${ENGINE_VERSION}`;
    moduleCache.set(tool.module,import(moduleUrl));
  }
  return moduleCache.get(tool.module);
}

export {ENGINE_VERSION};
