const refreshContextMenuMs = 120000; // time between context menu refreshes, 0 means no refresh
const brightnessStepSize = 70; // step size when using "brightness up" and "brightness down" buttons
const motionSensingContextMenu = false;
const irBulbsInContextMenu = false; // should additional menu section for sending bulb commands be added?
const trayIconPath = "images/bulb-icon.png";

// required modules
const { Tray, Menu } = require("electron");
const request = require("request");
const shell = require("electron").shell;
const { app, BrowserWindow } = require("electron");
const path = require("path");
const mdnsHandler = require("./mdnsHandler.js");

var nodesToAsk = []; // array holiding list of adresses of nodes to ask for info

var jsonPrint = function (json) {
  return JSON.stringify(json, null, 2).brightMagenta;
};

// populate context menu with info that was gathered from nodes in askAllNodesForInfoAndUpdateContextMenu()
var populateContextMenu = function (allNodes, tray) {
  console.log(
    "populateContextMenu(): 200 Got data from all nodes, populating context menu "
      .green
  );
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
      label: "Available presets",
      type: "normal",
      enabled: false,
    });

    // it's possible for node to have no presets! check for that and add information about it the interface
    if (allNodes[i].avaliablePresets.length == 0) {
      menuTemplate[i].submenu.push({
        label: "No presets avaliable",
        type: "normal",
      });
    }

    // construct menu template, second level: presets and specific node settings
    for (let j = 0; j < allNodes[i].avaliablePresets.length; j++) {
      menuTemplate[i].submenu.push({
        label: "📜 " + allNodes[i].avaliablePresets[j].name, // here you populate preset name
        type: "normal",
        click() {
          // send request to switch preset to node
          request.get(
            allNodes[i].address +
              "/win&PL=" +
              allNodes[i].avaliablePresets[j].id,
            (error, response, body) => {
              if (error) throw error;
              if (!error && response.statusCode == 200) {
                console.log(
                  "200 Successfully switched preset: ".green +
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
        checked: allNodes[i].synchState.send, // current status has to be requested from node
        click() {
          // send request populate status of synchronization option
          request.post(
            allNodes[i].address + "/json/si",
            {
              json: {
                udpn: {
                  send: (allNodes[i].synchState.send =
                    !allNodes[i].synchState.send),
                },
              },
            },
            function (error, response, body) {
              if (error) throw error;
              if (!error && response.statusCode == 200) {
                console.log("200 Changed synchronization option".green);
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
                "200 Toggled power, request address: ".green + requestAddress
              );
            }
          });
        },
      },
      {
        label: "⚙️ Settings",
        type: "normal",
        click() {
          // open web service in browser
          shell.openExternal(allNodes[i].address);
        },
      },
      {
        type: "separator",
      },
      {
        label: "Brightness",
        type: "normal",
        enabled: false,
      },
      {
        label: "🌕 Brighter",
        type: "normal",
        click() {
          // ask what is the current brightness, it could have changed in the meantime
          request.get(
            allNodes[i].address + "/json/si",
            (error, response, body) => {
              if (error) throw error;
              if (!error && response.statusCode == 200) {
                const jsonObject = JSON.parse(body);
                desiredBrightness = jsonObject["state"]["bri"];

                console.log(
                  "200 Got brightness before incrementing: ".green +
                    desiredBrightness
                );
                // increment
                desiredBrightness += brightnessStepSize;
                // check if it's still within bounds
                if (desiredBrightness > 255) {
                  desiredBrightness = 255;
                }
                // send request to change brightness
                request.get(
                  allNodes[i].address + "/win&A=" + desiredBrightness,
                  (error, response, body) => {
                    if (error) throw error;
                    if (!error && response.statusCode == 200) {
                      console.log(
                        "200 Successfully sent brightness UP request, request address: "
                          .green +
                          allNodes[i].address +
                          "/win&A=" +
                          desiredBrightness
                      );
                    }
                  }
                );
              }
            }
          );
        },
      },
      {
        label: "🌒 Dimmer",
        type: "normal",
        // sublabel: "test",
        // role: "paste",
        // really need to find a way to stop it from closing automatically after click()...
        // https://stackoverflow.com/questions/61538230/how-to-make-a-menu-not-close-when-a-menuitems-click-event-is-invoked-electron
        click() {
          // ask what is the current brightness, it could have changed in the meantime
          request.get(
            allNodes[i].address + "/json/si",
            (error, response, body) => {
              if (error) throw error;
              if (!error && response.statusCode == 200) {
                const jsonObject = JSON.parse(body);
                desiredBrightness = jsonObject["state"]["bri"];

                console.log(
                  "200 Got brightness before decrementing: ".green +
                    desiredBrightness
                );
                // increment
                desiredBrightness -= brightnessStepSize;
                // check if it's still within bounds
                if (desiredBrightness < 1) {
                  desiredBrightness = 1;
                }
                // send request to change brightness
                request.get(
                  allNodes[i].address + "/win&A=" + desiredBrightness,
                  (error, response, body) => {
                    if (error) throw error;
                    if (!error && response.statusCode == 200) {
                      console.log(
                        "200 Successfully sent brightness DOWN request, request address: "
                          .green +
                          allNodes[i].address +
                          "/win&A=" +
                          desiredBrightness
                      );
                    }
                  }
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
      label: "⚙ Companion settings",
      click() {
        console.log("Showing module discovery window".blue);

        // todo: check if window isn't opened already

        // Create the browser window.
        const mainWindow = new BrowserWindow({
          width: 1000,
          height: 500,
          webPreferences: {
            preload: path.join(__dirname, "preload.js"),
          },
          resizable: true,
          fullscreenable: false,
          maximizable: false,
          // minimizable: false
        });

        mainWindow.webContents.openDevTools();

        // and load the index.html of the app.
        mainWindow.loadFile("application/config.html");

        // initialize mdns for discovery of nodes
        mdnsHandler.init();

        // start searching as soon as window is opened
        mdnsHandler.startSearching();

        // window close event handler, prevents default behavior of closing the whole app,
        // we want to keep the tray icon
        mainWindow.on("close", function (event) {
          if (!app.isQuiting) {
            event.preventDefault();
            mainWindow.hide();
          }
          return false;
        });
      },
    },
    {
      label: "❌ Quit",
      click() {
        console.log("trying to quit...");
        // app.isQuitting = true;
        app.exit(0);
      },
    }
  );

  // Very first element, inactive label with description that those are nodes, added to top of menu
  menuTemplate.unshift({
    label: "Available nodes: ",
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

  // all done, apply prepared menu template to tray
  const contextMenu = Menu.buildFromTemplate(menuTemplate);
  tray.setContextMenu(contextMenu);
  tray.setToolTip("WLED companion");
};

var askAllNodesForInfoAndUpdateContextMenu = function (adressList = [], tray) {
  var nodesInfoArray = []; // array of objects to fill with info about nodes
  nodeCount = adressList.length;

  // sent requests to all nodes on address list
  for (let i = 0; i < nodeCount; i++) {
    currentAddress = "http://" + adressList[i] + "/";
    console.log(
      "askAllNodesForInfoAndUpdateContextMenu() sending GET to: ".green +
        currentAddress.brightGreen
    );

    // ask for name and synch button status
    request.get(currentAddress + "json", function (error, response, body) {
      if (error) {
        nodesInfoArray.push({
          address: this.host,
          error: true,
        });
      }

      if (!error && response.statusCode == 200) {
        // console.log("Got answer on first GET on address: ".green + this.host);

        const jsonObject = JSON.parse(body);
        nodesInfoArray.push({
          // id: nodesInfoArray.length, // not sure if needed
          name: jsonObject["info"]["name"],
          address: response.request.uri.protocol + "//" + response.request.host,
          synchState: jsonObject["state"]["udpn"],
          avaliablePresets: [],
          error: false,
        });
      }
      // check if got response from everyone
      if (nodesInfoArray.length == nodeCount) {
        console.log("--- Catched results of all requests ---".brightBlue);
        // count nodes with errors
        let nodesWithErrors = 0;
        let presetResponsesCounter = 0;

        nodesInfoArray.forEach((node, index) => {
          if (node.error) nodesWithErrors++;
          console.log(
            (
              "[" +
              index +
              "]" +
              "address: " +
              node.address +
              "\t\t\t\t\terror: " +
              node.error
            ).brightBlue
          );
          // check if node is error free after first request, otherwise there's no sense asking it for presets
          if (node.error) {
            // console.log("Skipping this because it already has error!".red);
          } else {
            request.get(
              node.address + "/presets.json",
              function (error, response, body) {
                presetResponsesCounter++;
                // console.log(
                //   "Get response from /presets.json, address:" + node.address
                // );

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

                // console.log(("Done preset array for " + node.address).yellow);
                // console.log(presetArray);

                // add preset array to node object
                node.avaliablePresets = presetArray;

                if (presetResponsesCounter == nodeCount - nodesWithErrors) {
                  // before giving array to populateContextMenu() clean it up from nodes with errors
                  const cleanNodesInfoArray = nodesInfoArray.filter(
                    (node) => node.error == false
                  );
                  // reset request counters
                  nodesWithErrors = 0;
                  presetResponsesCounter = 0;
                  populateContextMenu(cleanNodesInfoArray, tray);
                }
              }
            );
          }
        });
      }
    });
  }
};

var sendIrCommand = function (command) {
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
};

module.exports = {
  init: function () {
    // create tray icon
    tray = new Tray(trayIconPath);

    // ask discovered nodes about required info and populate context menu, once all responsess are received
    askAllNodesForInfoAndUpdateContextMenu(nodesToAsk, tray);

    // create interval for context menu refresh
    if (refreshContextMenuMs > 0) {
      setInterval(() => {
        askAllNodesForInfoAndUpdateContextMenu(nodesToAsk, tray);
        console.log("------ Refreshing context menu ------".brightMagenta);
      }, refreshContextMenuMs);
    }
  },

  passNodeList: function (nodeList) {
    nodesToAsk = nodeList;
  },
};
