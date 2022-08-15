// to run:
// nodemon --exec npm run start
// to build:
// npm install --save-dev @electron-forge/cli
// npx electron-forge import
// electron-forge make

// constant parameters
const refreshContextMenuMs = 30000; // time between context menu refreshes
const irBulbsInContextMenu = false; // should additional menu section for sending bulb commands be added?
const motionSensingContextMenu = false;
const DEBUGENABLED = true; // is application debug enabled?
const trayIconPath = "images/bulb-icon.png";
const brightnessStepSize = 70; // step size when using "brightness up" and "brightness down" buttons
const nodes = [
  "http://192.168.1.33/", // biurko
  // "http://192.168.1.41/", // master
  "http://192.168.1.59/", // nad tv
  // "http://192.168.1.42/", // pod tv
];

// Modules to control application life and create native browser window
const { app, BrowserWindow, Tray, Menu } = require("electron");
const path = require("path");
const request = require("request");
const { markAsUntransferable } = require("worker_threads");
const shell = require("electron").shell;
var colors = require("colors");
var mdns = require("multicast-dns")();

// MDNS handling
mdns.on("response", function (response) {
  // console.log('got a response packet:', response)
});

mdns.on("query", function (query) {
  // console.log('got a query packet:', query)
});

// questions:[{
//   name: '_http._tcp',
//   type: 'A'

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

function refreshContextMenu(tray) {
  askAllNodesForInfoAndUpdateContextMenu(nodes, tray);
}

// function sleep(ms) {
//   return new Promise((resolve) => {
//     setTimeout(resolve, ms);
//     console.log('hello');
//   });
// }

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  if (DEBUGENABLED) {
    console.log("!!! Debug mode enabled !!!".blue);
    createWindow(); // window is created only in debug mode, for easier debugging
  }
  // discover nodes in network
  // nodes = searchForNodes();
  console.log("Trying to discover nodes...".blue);
  mdns.query([{ name: "_http._tcp", type: "A" }]);

  // create tray icon
  tray = new Tray(trayIconPath);

  // create interval for context menu refresh
  // setInterval(() => {
  //   refreshContextMenu(tray);
  //   console.log("Refreshing context menu...");
  // }, refreshContextMenuMs);

  // ask discovered nodes about required info and populate interface once all responses are received
  askAllNodesForInfoAndUpdateContextMenu(nodes, tray);

  // tray.setToolTip('WLED companion')
  // tray.setContextMenu(contextMenu)
});

function askAllNodesForInfoAndUpdateContextMenu(adressList = [], tray) {
  var nodesInfoArray = []; // array of objects with info about nodes
  nodeCount = adressList.length;

  // sent requests to all nodes on address list
  for (let i = 0; i < nodeCount; i++) {
    currentAddress = adressList[i];

    // ask for name and synch button status
    request.get(currentAddress + "json", function (error, response, body) {
      if (error) throw error;
      if (!error && response.statusCode == 200) {
        // printjson(body);
        const jsonObject = JSON.parse(body);
        nodesInfoArray.push({
          // id: nodesInfoArray.length, // not sure if needed
          name: jsonObject["info"]["name"],
          address: response.request.uri.protocol + "//" + response.request.host,
          synchState: jsonObject["state"]["udpn"],
          brightness: jsonObject["state"]["bri"],
          avaliablePresets: [],
        });

        // check if got response from everyone
        if (nodesInfoArray.length == nodeCount) {
          // ask each node for avaliable presets
          for (let z = 0; z < nodeCount; z++) {
            (currentAddress = nodesInfoArray[z].address + "/presets.json"),
              request.get(currentAddress, function (error, response, body) {
                if (!error && response.statusCode == 200) {
                  const bodyObject = JSON.parse(body);
                  let presetIds = Object.keys(bodyObject);
                  let presetArray = [];

                  // iterate through every preset and add it to array
                  for (
                    let presetCounter = 0;
                    presetCounter < presetIds.length;
                    presetCounter++
                  ) {
                    if (
                      typeof bodyObject[presetIds[presetCounter]]["n"] !==
                      "undefined"
                    ) {
                      // only push presets that don't have undefined name
                      presetArray.push({
                        id: presetIds[presetCounter],
                        name: bodyObject[presetIds[presetCounter]]["n"],
                      });
                    }
                  }

                  nodeAdress =
                    response.request.uri.protocol +
                    "//" +
                    response.request.host;

                  // complete node record  with created array, identify node by address
                  nodesInfoArray.forEach((element) => {
                    if (element.address == nodeAdress) {
                      element.avaliablePresets = presetArray;
                    }
                  });

                  let stillNotComplete = false;
                  // check if all nodes have populated presets
                  nodesInfoArray.forEach((element) => {
                    if (element.avaliablePresets.length == 0) {
                      // if any element has empty array, set flag to true
                      stillNotComplete = true;
                      // probably should be handled differently, via promise->then or something
                    }
                  });
                  if (stillNotComplete == false) {
                    // got all required data for each node, time to populate interface
                    populateContextMenu(nodesInfoArray, tray);
                  }
                }
              });
          }
        }
      }
    });
  }
}

function populateContextMenu(allNodes, tray) {
  console.log("Got all node info, populating interface with: ".green);
  console.log(JSON.stringify(allNodes, null, 2));
  let menuTemplate = [];

  // construct menu template, first level: module names, loop iterates through each node
  for (let i = 0; i < allNodes.length; i++) {
    // add all node names
    menuTemplate.push({
      label: "💡 " + allNodes[i].name, // here you populate node name
      type: "submenu",
      submenu: [],
    });

    // add inactive label with information that those are presets
    menuTemplate[i].submenu.push({
      label: "Avaliable presets",
      type: "normal",
      enabled: false,
    });

    // construct menu template, second level: presets and specific node settings
    for (let j = 0; j < allNodes[i].avaliablePresets.length; j++) {
      menuTemplate[i].submenu.push({
        label: "📜 " + allNodes[i].avaliablePresets[j].name, // here you populate preset name
        type: "normal",
        click() {
          console.log(
            "preset choosen: " + allNodes[i].avaliablePresets[j].name
          );
          console.log("for node:" + allNodes[i].name);

          // send request to switch preset to node
          request.get(
            allNodes[i].address +
              "/win&PL=" +
              allNodes[i].avaliablePresets[j].id,
            (error, response, body) => {
              if (error) throw error;
              if (!error && response.statusCode == 200) {
                console.log(
                  "200 Successfully switched preset:" +
                    allNodes[i].address +
                    "/win&PL=" +
                    allNodes[i].avaliablePresets[j].id
                );
              }
            }
          );
        },
      });
    }

    // assign current state to vars
    let currentSynchState = allNodes[i].synchState.send;
    // let currentBrightness = allNodes[i].brightness;

    // add additional section with settings that are the same for every module
    menuTemplate[i].submenu.push(
      {
        type: "separator",
      },
      {
        label: "Settings",
        type: "normal",
        enabled: false,
      },
      {
        label: "♻ Sync others",
        type: "checkbox",
        checked: currentSynchState, // current status has to be requested from node
        click() {
          // send request populate status of synchronization option
          request.post(
            allNodes[i].address + "/json/si",
            {
              json: {
                udpn: {
                  send: (currentSynchState = !currentSynchState),
                },
              },
            },
            function (error, response, body) {
              if (error) throw error;
              if (!error && response.statusCode == 200) {
                console.log(
                  "200 Successfully changed synchronization option".green
                );
              }
            }
          );
        },
      },
      {
        label: "🔦 Toggle power",
        type: "normal",
        click() {
          // send request to correct address
          let requestAddress = allNodes[i].address + "/win&T=2"; // 2 = toggle
          request.get(requestAddress, function (error, response, body) {
            if (error) throw error;
            if (!error && response.statusCode == 200) {
              console.log(
                "200 Toggled power, request address: " + requestAddress
              );
            }
          });
        },
      },
      {
        label: "⚙️ Web service",
        type: "normal",
        click() {
          // open web service in browser
          shell.openExternal(allNodes[i].address);
        },
      },
      {
        label: "🌕 Brightness up",
        type: "normal",
        click() {
          allNodes[i].brightness += brightnessStepSize; // increase brightness by step size
          // check if brightness is within limits
          if (allNodes[i].brightness > 255) {
            allNodes[i].brightness = 255;
          }
          // send request to change brightness
          request.get(
            allNodes[i].address + "/win&A=" + allNodes[i].brightness,
            (error, response, body) => {
              if (error) throw error;
              if (!error && response.statusCode == 200) {
                console.log(
                  "200 Successfully sent brightness up request, request address: " +
                    allNodes[i].address +
                    "/win&A=" +
                    allNodes[i].brightness
                );
              }
            }
          );
        },
      },
      {
        label: "🌒 Brightness down",
        type: "normal",
        click() {
          allNodes[i].brightness -= brightnessStepSize; // increase brightness by step size
          // check if brightness is within limits
          if (allNodes[i].brightness < 0) {
            allNodes[i].brightness = 0;
          }
          // send request to change brightness
          request.get(
            allNodes[i].address + "/win&A=" + allNodes[i].brightness,
            (error, response, body) => {
              if (error) throw error;
              if (!error && response.statusCode == 200) {
                console.log(
                  "200 Successfully sent brightness up request, request address: " +
                    allNodes[i].address +
                    "/win&A=" +
                    allNodes[i].brightness
                );
              }
            }
          );
        },
      }
    );
  }

  // add section with quit button
  menuTemplate.push(
    { type: "separator" },
    {
      label: "❌ Quit",
      click() {
        app.quit();
      },
    }
  );

  // Very first element, inactive label with description that those are nodes, added to top of menu
  menuTemplate.unshift({
    label: "Detected nodes: ",
    type: "normal",
    enabled: false,
  });

  // add optional settings, probably only useful for me
  if (irBulbsInContextMenu) {
    menuTemplate.unshift(
      { type: "separator" },
      {
        label: "Żarówki",
        type: "submenu",
        submenu: [
          {
            label: "🔵 Niebieski ",
            type: "normal",
            click() {
              sendIrCommand("07");
            },
          },
          {
            label: "🔴 Czerwony",
            type: "normal",
            click() {
              sendIrCommand("05");
            },
          },
          {
            label: "🟡 Żółty",
            type: "normal",
            click() {
              sendIrCommand("13");
            },
          },
          // { label: '🔴 ', type: 'normal' },
          { type: "separator" },
          { label: "⚡ Wyłącz", type: "normal" },
          { label: "⚡ Włącz", type: "normal" },
          { type: "separator" },
          { label: "🌕 Jaśniej", type: "normal" },
          { label: "🌒 Ciemniej", type: "normal" },
          // sendIrCommand('red')
        ],
      }
    );
  }
  if (motionSensingContextMenu) {
    // code for motion sensing checkbox here...
  }

  // apply prepared menu template to tray
  const contextMenu = Menu.buildFromTemplate(menuTemplate);
  tray.setToolTip("WLED companion");
  tray.setContextMenu(contextMenu);
}

function printjson(json) {
  console.log(JSON.stringify(json, null, 2));
}

function sendIrCommand(command) {
  // POST  http://192.168.1.41/json/si -d '{"bulbCommand": "04", "v":true}' -H "Content-Type: application/json"

  request.post(
    "http://192.168.1.41/json/si",
    { json: { bulbCommand: command } },
    function (error, response, body) {
      if (error) throw error;
      if (!error && response.statusCode == 200) {
      }
    }
  );
}

const createWindow = () => {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
    },
  });

  // and load the index.html of the app.
  mainWindow.loadFile("index.html");

  // Open the DevTools.
  mainWindow.webContents.openDevTools();
};

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
