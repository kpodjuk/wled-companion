const getDetectedDevicesIntervalMs = 5000;

// even listeners for buttons
document.addEventListener("click", (e) => {
  switch (e.target.id) {
    case "startSearching": {
      startSearching();
      break;
    }
    case "continue": {
      proceedWithFoundModules();
      break;
    }
  }
});

var getDetectedDevicesInterval = window.setInterval(() => {
  getDetectedDevices();
}, getDetectedDevicesIntervalMs);

const getDetectedDevices = async () => {
  // in here we will get array with found devices from backend, hopefully
  const response = await window.versions.getDetectedDevices();
  document.getElementById("foundWLEDDevices").innerText = response;
};

const startSearching = async () => {
  const reponse = await window.versions.startSearching();
};

const proceedWithFoundModules = async () => {
  const response = await window.versions.proceedWithFoundModules();
};
