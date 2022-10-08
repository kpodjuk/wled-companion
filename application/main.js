// to run:
// nodemon --exec npm run start
// to build:
// npm install --save-1 @electron-forge/cli
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
const configFileHandler = require("./configFileHandler.js");

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
  createWindow();

  // initialize mdns for discovery of nodes
  mdnsHandler.init();
});

const createWindow = () => {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 500,
    height: 500,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
    },
    resizable: true,
    fullscreenable: false,
    maximizable: false,
    // minimizable: false
  });

  // and load the index.html of the app.
  mainWindow.loadFile("application/index.html");

  // Open the DevTools.
  if (DEBUGENABLED) {
    mainWindow.webContents.openDevTools();
  }

  // this handler is activated after initial config is done and nodes found
  ipcMain.handle("proceedWithFoundModules", () => {
    // build tray context menu
    trayIconHandler.passNodeList(mdnsHandler.returnDetectedDevices());
    trayIconHandler.init();

    // save found nodes in config
    // configFileHandler.writeConfigFile((config = "testConfig"));

    // Close window, configuration done
    mainWindow.close();

    // turn off mdns answers listening
    mdnsHandler.stopAwaitingResponses();
  });

  // window close event handler, prevents default behavior of closing the whole app,
  // we want to keep the tray icon
  mainWindow.on("close", function (event) {
    if (!app.isQuiting) {
      event.preventDefault();
      mainWindow.hide();
    }

    return false;
  });
};

// frontend requests handlers
ipcMain.handle("getDetectedDevices", () => mdnsHandler.returnDetectedDevices());
ipcMain.handle("startSearching", () => mdnsHandler.startSearching());
