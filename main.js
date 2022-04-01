// main.js

// Modules to control application life and create native browser window
const { app, BrowserWindow, Tray, Menu } = require('electron')
const path = require('path')
const https = require('https')






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

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  // createWindow()

  tray = new Tray('images/ico.png')

  askForPresets();

  const contextMenu = Menu.buildFromTemplate([
    { type: 'Wszystkie' },
    { label: 'Biurko' },
    { label: 'TV' },
    {
      label: 'Żarówki', type: 'submenu', submenu: [
        { label: '🔵 Niebieski ', type: 'normal' ,
      click(){
        sendIrCommand('blue');
      }
      },
        { label: '🔴 Czerwony', type: 'normal' },
      ]
    },
    { type: 'separator' },
    {
      label: 'Wyjdź',
      click() {
        app.quit()
      }
    }
  ])

  tray.setToolTip('WLED companion')
  tray.setContextMenu(contextMenu)

})




function askForPresets() {

  const options = {
    hostname: 'http://192.168.1.42/json/state',
    // port: 443,
    path: '/json/state',
    method: 'GET'
  }

  const req = https.request(options, (res) => {
    console.log('statusCode:', res.statusCode)
    console.log('headers:', res.headers)

    res.on('data', (d) => {
      process.stdout.write(d)
    })
  })

}


function sendIrCommand(command) {

  const options = {
    hostname: 'http://192.168.1.42/json/state',
    // port: 443,
    path: '/json/state',
    method: 'GET'
  }

  
  console.log('sending command: ' + command);
  const req = https.request(options, (res) => {
    console.log('statusCode:', res.statusCode)
    console.log('headers:', res.headers)

    res.on('data', (d) => {
      process.stdout.write(d)
    })
  })

  req.on('error', (error) => {
    console.error(error)
  })

  req.end()
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
  console.log('fewjkiao');
}



// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.


