// preload.js
const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("versions", {
  node: () => process.versions.node,
  chrome: () => process.versions.chrome,
  electron: () => process.versions.electron,

  getDiscoveredNodes: () => ipcRenderer.invoke("getDiscoveredNodes"),
  getExistingNodes: () => ipcRenderer.invoke("getExistingNodes"),
  startSearching: () => ipcRenderer.invoke("startSearching"),
  proceedWithFoundModules: () => ipcRenderer.invoke("proceedWithFoundModules"),
  // we can also expose variables, not just functions
});

// All of the Node.js APIs are available in the preload process.
// It has the same sandbox as a Chrome extension.
window.addEventListener("DOMContentLoaded", () => {
  // const replaceText = (selector, text) => {
  //   const element = document.getElementById(selector);
  //   if (element) element.innerText = text;
  // };
  // for (const dependency of ["chrome", "node", "electron"]) {
  //   replaceText(`${dependency}-version`, process.versions[dependency]);
  // }
});
