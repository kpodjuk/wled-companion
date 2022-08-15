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
    createWindow(); // window is created only in debug mode, for easier debugging
  }

  // Initialize tray icon, set interval for refresh and start sending first requests
  trayIconHandler.init();
  // initialize mdns for discovery of nodes without having to type in their ip
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

  // this is how you communicate with frontend, in this case it's frontend pinging backend:
  // ipcMain.handle("ping", () => "pong");
  ipcMain.handle("getDetectedDevices", () =>
    mdnsHandler.returnDetectedDevices()
  );

  // and load the index.html of the app.
  mainWindow.loadFile("application/index.html");

  // Open the DevTools.
  mainWindow.webContents.openDevTools();
};
