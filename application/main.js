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



  applicationInit();

  // read config file
  let currentConfig = configFileHandler.readConfigFile();

  if (currentConfig == "") {
    console.log("First config hasn't been done yet, showing config window!".magenta);
    createWindow();
    // initialize mdns for discovery of nodes
    mdnsHandler.init();
  } else {
    // console.log("app.whenReady(): loaded data from existing config!".magenta);
    // build tray context menu
    trayIconHandler.passNodeList(currentConfig.foundNodes);
    console.log("app.whenReady(): Building context menu from existig config, nodes: ".magenta);
    console.log(currentConfig.foundNodes);
    trayIconHandler.init();

  }

});

// global window var
var mainWindow;

const createWindow = () => {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 1300,
    height: 900,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
    },
    resizable: true,
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

}


const applicationInit = () => {

  // this handler is activated after initial config is done and nodes found
  ipcMain.handle("proceedWithFoundModules", () => {
    console.log("proceedWithFoundModules(): continue button pressed".blue);

    // build tray context menu
    trayIconHandler.passNodeList(mdnsHandler.returnDetectedDevices());
    trayIconHandler.init();

    // save found nodes in config, but only those that are present on "your nodes" list
    let config = {
      foundNodes: mdnsHandler.returnDetectedDevices()
      // initialConfigDone: true
    }
    configFileHandler.writeConfigFile(config);

    // Close window, configuration done
    mainWindow.close();

    // turn off mdns answers listening
    mdnsHandler.stopAwaitingResponses();
  });


  ipcMain.on('send-desired-nodes', handleNodeSaving);


};


function handleNodeSaving(event, nodes) {
  console.log("Got node list from renderer " + nodes);

  // const webContents = event.sender
  // const win = BrowserWindow.fromWebContents(webContents)
  // win.setTitle(title)
}

// frontend requests handlers
ipcMain.handle("getDiscoveredNodes", () => mdnsHandler.returnDetectedDevices());
ipcMain.handle("getDiscoveredNodesWithNames", () => mdnsHandler.returnDetectedDevicesWithNames());
ipcMain.handle("getExistingNodes", () => configFileHandler.readConfigFile());
ipcMain.handle("startSearching", () => mdnsHandler.startSearching());
