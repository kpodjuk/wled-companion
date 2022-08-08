// main.js

// Modules to control application life and create native browser window
const { app, BrowserWindow, Tray, Menu } = require('electron')
const path = require('path')
const request = require('request');
const https = require('https')

var Mdns = require('mdns-discovery');
const { fileURLToPath } = require('url');

const refreshContextMenuMs = 30000; // time between context menu refreshes





app.setUserTasks([
  {
    program: process.execPath,
    arguments: '',
    iconPath: process.execPath,
    iconIndex: 0,
    title: 'WLED companion',
    description: ''
  }
])

function refreshContextMenu(tray) {

  askNodesForInfo(nodes, tray)
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

  // create window for initial config 
  // createWindow()

  // discover nodes in network
  // nodes = searchForNodes();

  nodes = [
    "http://192.168.1.33/", // biurko
    "http://192.168.1.41/", // master
    "http://192.168.1.59/", // nad tv
    // "http://192.168.1.42/" // pod tv
  ];


  // create tray icon
  tray = new Tray('images/icon.png')

  // setInterval(refreshContextMenu(tray), refreshContextMenuMs);




  // ask discovered nodes about required info and populate interface once all responses are received
  askNodesForInfo(nodes, tray);


  // const contextMenu = Menu.buildFromTemplate([
  //   { label: 'Loading avaliable nodes...' },

  //   { type: 'separator' },

  //   {
  //     label: 'Żarówki', type: 'submenu', submenu: [
  //       {
  //         label: '🔵 Niebieski ', type: 'normal',
  //         click() {
  //           sendIrCommand('07');
  //         }
  //       },
  //       {
  //         label: '🔴 Czerwony', type: 'normal',
  //         click() {
  //           sendIrCommand('05');
  //         }
  //       },
  //       {
  //         label: '🟡 Żółty', type: 'normal',
  //         click() {
  //           sendIrCommand('13');
  //         }
  //       },
  //       // { label: '🔴 ', type: 'normal' },
  //       { type: 'separator' },
  //       { label: '⚡ Wyłącz', type: 'normal' },
  //       { label: '⚡ Włącz', type: 'normal' },
  //       { type: 'separator' },
  //       { label: '🌕 Jaśniej', type: 'normal' },
  //       { label: '🌒 Ciemniej', type: 'normal' },

  //       // sendIrCommand('red')

  //     ]
  //   },
  //   { type: 'separator' },
  //   {
  //     label: 'Wyjdź',
  //     click() {
  //       app.quit()
  //     }
  //   }
  // ])

  // tray.setToolTip('WLED companion')
  // tray.setContextMenu(contextMenu)



})



function askNodesForInfo(adressList = [], tray) {
  var nodesInfoArray = []; // array of objects with info about nodes
  nodeCount = adressList.length;

  // sent requests to all nodes on address list
  for (let i = 0; i < nodeCount; i++) {
    currentAddress = adressList[i];

    // ask for name
    request.get(
      currentAddress + 'json/info',
      function (error, response, body) {
        if (error) throw error
        if (!error && response.statusCode == 200) {

          const jsonObject = JSON.parse(body);
          nodesInfoArray.push({
            id: nodesInfoArray.length, // not sure if needed
            name: jsonObject['name'],
            address: response.request.uri.protocol + '//' + response.request.host,
            avaliablePresets: []
          });

          // check if got response from everyone
          if (nodesInfoArray.length == nodeCount) {
            // ask each node for avaliable presets
            for (let z = 0; z < nodeCount; z++) {
              currentAddress = nodesInfoArray[z].address + '/presets.json',
                request.get(
                  currentAddress,
                  function (error, response, body) {
                    if (!error && response.statusCode == 200) {
                      const bodyObject = JSON.parse(body);

                      let presetIds = Object.keys(bodyObject);
                      let presetArray = [];

                      // iterate through every preset and add it to array
                      for (let presetCounter = 0; presetCounter < presetIds.length; presetCounter++) {
                        if (typeof bodyObject[presetIds[presetCounter]]['n'] !== 'undefined') {
                          // only push presets that don't have undefined name
                          presetArray.push(
                            {
                              id: presetIds[presetCounter],
                              name: bodyObject[presetIds[presetCounter]]['n']
                            }
                          );
                        }
                      }

                      nodeAdress = response.request.uri.protocol + '//' + response.request.host;

                      // complete node record  with created array, identify node by address
                      nodesInfoArray.forEach(element => {
                        if (element.address == nodeAdress) {
                          element.avaliablePresets = presetArray;
                        }
                      });

                      let stillNotComplete = false;
                      // check if all nodes have populated presets
                      nodesInfoArray.forEach(element => {
                        if (element.avaliablePresets.length == 0) {
                          // if any element has empty array, set flag to true
                          stillNotComplete = true;
                        }
                      })
                      if (stillNotComplete == false) {
                        // got all required data for each node, time to populate interface
                        populateContextMenu(nodesInfoArray, tray);
                      }
                    }
                  }
                );
            }
          }
        }
      }
    );
  }

}


function populateContextMenu(allNodes, tray) {
  console.log("Got all node info, populating interface with: ");
  console.log(JSON.stringify(allNodes, null, 2));
  let menuTemplate = [];

  // construct menu template, first level: module names
  for (let i = 0; i < allNodes.length; i++) {

    menuTemplate.push({
      label: allNodes[i].name,
      type: 'submenu',
      submenu: []

    })

    // console.log(JSON.stringify(menuTemplate, null, 2));

    // console.log("------------------------------");


    // construct menu template, second level: presets

    for (let j = 0; j < allNodes[i].avaliablePresets.length; j++) {
      menuTemplate[i].submenu.push({
        label: allNodes[i].avaliablePresets[j].name,
        type: 'normal',
        click() {
          console.log("preset choosen: " + allNodes[i].avaliablePresets[j].name);
          console.log("for node:")
          console.log(allNodes[i])
        }
      })
    }



    // console.log(JSON.stringify(menuTemplate, null, 2));


    // [
    //   { label: contextMenuCounter },
    //   { type: 'separator' },
    //   {
    //     label: 'Wyjdź',
    //     click() {
    //       app.quit()
    //     }
    //   }
    // ]

  }

  const contextMenu = Menu.buildFromTemplate(menuTemplate);

  tray.setToolTip('WLED companion')
  tray.setContextMenu(contextMenu)
}

function sendIrCommand(command) {

  // POST  http://192.168.1.41/json/si -d '{"bulbCommand": "04", "v":true}' -H "Content-Type: application/json"

  request.post(
    'http://192.168.1.41/json/si',
    { json: { "bulbCommand": command } },
    function (error, response, body) {
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
      preload: path.join(__dirname, 'preload.js')
    }
  })

  // and load the index.html of the app.
  mainWindow.loadFile('index.html')

  // Open the DevTools.
  mainWindow.webContents.openDevTools()
}



// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.


function searchForNodes() {
  // look for available modules on network via mdns-disovery

  // console.log("Looking for modules in network...");

  //   var mdns = new Mdns({ timeout: 4 });


  // mdns.run (function(res) {
  //        console.log(res);
  // });



  // const firstModuleIp = 'http://192.168.1.41/';

  // console.log('Asking for nodes on ' + firstModuleIp)

  // request.get(
  //   firstModuleIp + 'json/info',
  //   function (error, response, body) {
  //     if (!error && response.statusCode == 200) {
  //       const jsonObject = JSON.parse(body);
  //       console.log("Found " + jsonObject.ndc + " additional nodes")
  //     }
  //   }
  // );


}

