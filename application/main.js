// to run:
// nodemon --exec npm run start
// to build:
// npm install --save-1 @electron-forge/cli
// npx electron-forge import
// npm run-script make

// constant parameters
const DEBUGENABLED = false; // is application debug enabled?

// Modules to control application life and create native browser window
const { app, BrowserWindow, Menu, ipcMain } = require("electron");
const path = require("path");
// application modules:
const trayIconHandler = require("./trayIconHandler.js");
const mdnsHandler = require("./mdnsHandler.js");
const configFileHandler = require("./configFileHandler.js");
const { fdatasyncSync } = require("original-fs");

// global window var
var mainWindow;

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

  Menu.setApplicationMenu(null); // disable menu at the top of the window

  // read config file
  let currentConfig = configFileHandler.readConfigFile();

  if (currentConfig == "") {
    console.log(
      "First config hasn't been done yet, showing config window!".magenta
    );
    createWindow();
    // initialize mdns for discovery of nodes
    mdnsHandler.init();
  } else {
    console.log("app.whenReady(): loaded data from existing config!".magenta);
    // build tray context menu
    trayIconHandler.passNodeList(currentConfig.foundNodes);
    console.log(
      "app.whenReady(): Building context menu from existig config, nodes: "
        .magenta
    );
    console.log(currentConfig.foundNodes);
    trayIconHandler.init();
  }
});


const createWindow = () => {
  // Create the browser window.
  let width, height;
  if (DEBUGENABLED) {
    // make the window wider so devtools fit
    width = 1700;
    height = 1200;
  } else {
    width = 1200;
    height = 1200;
  }

  mainWindow = new BrowserWindow({
    // for normal usage: 1200x1200
    width: width,
    height: height,
    frame: false,
    titleBarStyle: "hidden",
    titleBarOverlay: {
      color: "#6b6b6b",
      symbolColor: "#74b1be",
      height: 10,
    },
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
    },
    resizable: false,
    fullscreenable: false,
    maximizable: false,
    // minimizable: false
  });

  // start searching as soon as window is opened
  mdnsHandler.startSearching();

  // and load the index.html of the app.
  mainWindow.loadFile("application/initialConfig.html");

  // Open the DevTools.
  if (DEBUGENABLED) {
    mainWindow.webContents.openDevTools();
  }

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
ipcMain.handle("getDiscoveredNodes", () => mdnsHandler.returnDetectedDevices());
ipcMain.handle("getDiscoveredNodesWithNames", () => mdnsHandler.returnDetectedDevicesWithNames());
ipcMain.handle("getExistingNodes", () => configFileHandler.readConfigFile());
ipcMain.handle("startSearching", () => mdnsHandler.startSearching());

ipcMain.handle("proceedWithFoundModules", () => {
  // this handler is activated after initial config is done and nodes found
  console.log("proceedWithFoundModules(): continue button pressed".blue);

  // build tray context menu
  trayIconHandler.passNodeList(mdnsHandler.returnDetectedDevices());
  trayIconHandler.init();

  // save found nodes in config, but only those that are present on "your nodes" list
  let config = {
    foundNodes: mdnsHandler.returnDetectedDevices(),
    // initialConfigDone: true
  };
  configFileHandler.writeConfigFile(config);

  // Close window, configuration done
  mainWindow.close();

  // turn off mdns answers listening
  mdnsHandler.stopAwaitingResponses();
});