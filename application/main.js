// to run:
// nodemon --exec npm run start
// to build:
// npm install --save-dev @electron-forge/cli
// npx electron-forge import
// electron-forge make

// constant parameters
const DEBUGENABLED = true; // is application debug enabled?

// Modules to control application life and create native browser window
const { app, BrowserWindow } = require("electron");
const colors = require("colors");
require("electron").Menu.setApplicationMenu(null); // disable menu at the top of the window
const { ipcMain } = require("electron");
const path = require("path");
// my modules:
const trayIconHandler = require("./trayIconHandler.js");
const mdnsHandler = require("./mdnsHandler.js");

app.setUserTasks([
  {
    program: process.execPath,
    arguments: "",
    iconPath: process.execPath,
    iconIndex: 0,
    title: "WLED companion",
    description: "",
  },
]);

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  if (DEBUGENABLED) {
    createWindow();
  }
  // initialize mdns for discovery of nodes
  mdnsHandler.init();
});

const createWindow = () => {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 1400,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
    },
    resizable: true,
    fullscreenable: false,
    maximizable: false,
    // minimizable: false
  });

  // frontend requests handlers
  ipcMain.handle("getDetectedDevices", () =>
    mdnsHandler.returnDetectedDevices()
  );

  ipcMain.handle("startSearching", () => mdnsHandler.startSearching());

  ipcMain.handle("proceedWithFoundModules", () => {
    // console.log(
    //   "Got the module list! mDNS handler passes this to tray icon handler: "
    //     .green
    // );
    // console.log(mdnsHandler.returnDetectedDevices());

    // turn off mdns answers listening
    mdnsHandler.stopAwaitingResponses();

    // build tray context menu
    trayIconHandler.passNodeList(mdnsHandler.returnDetectedDevices());
    trayIconHandler.init();
  });

  // and load the index.html of the app.
  mainWindow.loadFile("application/index.html");

  // Open the DevTools.
  if (DEBUGENABLED) {
    mainWindow.webContents.openDevTools();
  }
};
