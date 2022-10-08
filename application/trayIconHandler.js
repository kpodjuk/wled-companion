const refreshContextMenuMs = 120000; // time between context menu refreshes, 0 means no refresh
const brightnessStepSize = 70; // step size when using "brightness up" and "brightness down" buttons
const motionSensingContextMenu = false;
const irBulbsInContextMenu = false; // should additional menu section for sending bulb commands be added?
const trayIconPath = "images/bulb-icon.png";

// required modules
const { Tray, Menu } = require("electron");
const request = require("request");
const shell = require("electron").shell;
const { app } = require("electron");

var nodesToAsk = []; // array holiding list of adresses of nodes to ask for info

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

  // temporary array replacement
  // adressList = ["http://192.168.1.41/", "http://192.168.1.59/"];

  // sent requests to all nodes on address list
  for (let i = 0; i < nodeCount; i++) {
    currentAddress = "http://" + adressList[i] + "/";
    console.log(
      "askAllNodesForInfoAndUpdateContextMenu() sending GET to: ".green +
        currentAddress.brightGreen
    );
    // ask for name and synch button status
    request.get(currentAddress + "json", function (error, response, body) {
      if (!error && response.statusCode == 200) {
        // printjson(body);
        const jsonObject = JSON.parse(body);
        nodesInfoArray.push({
          // id: nodesInfoArray.length, // not sure if needed
          name: jsonObject["info"]["name"],
          address: response.request.uri.protocol + "//" + response.request.host,
          synchState: jsonObject["state"]["udpn"],
          avaliablePresets: [],
        });

        // check if got response from everyone
        if (nodesInfoArray.length == nodeCount) {
          // ask each node for avaliable presets
          let nodesFilledWithPresetsCounter = 0; // to count how many nodes have filled presets array
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

                  nodeAddress =
                    response.request.uri.protocol +
                    "//" +
                    response.request.host;

                  // complete node record  with created array, identify node by address
                  nodesInfoArray.forEach((element) => {
                    if (element.address == nodeAddress) {
                      element.avaliablePresets = presetArray;
                      // console.log(
                      //   "Got presets for " +
                      //     nodeAddress +
                      //     " counter=" +
                      //     nodesFilledWithPresetsCounter +
                      //     " presetArray= "
                      // );
                      // console.log(presetArray);
                    }
                  });

                  // checking if all nodes have populated presets here...
                  nodesFilledWithPresetsCounter++;
                  if (nodesFilledWithPresetsCounter == nodeCount) {
                    // all done, all nodes have presets now, we can now create context menu
                    populateContextMenu(nodesInfoArray, tray);
                  }
                }
              });
          }
        }
      } else {
        console.log(
          (
            "askAllNodesForInfoAndUpdateContextMenu(): couldn't get node status for " +
            currentAddress +
            " error: " +
            error
          ).red
        );
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

    // console.log("trayIconHandler(): started init()".brightCyan);

    // ask discovered nodes about required info and populate context menu, once all responsess are received
    askAllNodesForInfoAndUpdateContextMenu(nodesToAsk, tray);

    // create interval for context menu refresh
    if (refreshContextMenuMs > 0) {
      setInterval(() => {
        askAllNodesForInfoAndUpdateContextMenu(nodesToAsk, tray);
        console.log("Refreshing context menu...".blue);
      }, refreshContextMenuMs);
    }
  },

  passNodeList: function (nodeList) {
    nodesToAsk = nodeList;
  },
};
