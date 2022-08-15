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
const trayIconHandler = require("./trayIconHandler.js");
const mdnsHandler = require("./mdnsHandler.js");
var colors = require("colors");
require("electron").Menu.setApplicationMenu(null); // disable menu at the top of the window

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
    console.log("!!! Debug mode enabled !!!".blue);
    createWindow(); // window is created only in debug mode, for easier debugging
  }

  // Initialize tray icon, set interval for refresh and start sending first requests
  trayIconHandler.init();
  mdnsHandler.init();
});

const createWindow = () => {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      // preload: path.join(__dirname, "preload.js"),
    },
    resizable: false,
    fullscreenable: false,
    maximizable: false,
    // minimizable: false
  });

  // and load the index.html of the app.
  mainWindow.loadFile("application/index.html");

  // Open the DevTools.
  mainWindow.webContents.openDevTools();
};
