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
  const response = await window.versions.getDetectedDevices();
  document.getElementById("foundWLEDDevices").innerHTML = "<ul>";
  // iterate over each found node
  response.forEach((element) => {
    document.getElementById("foundWLEDDevices").innerHTML +=
      "<li>" + element + "</li>";
  });
  document.getElementById("foundWLEDDevices").innerHTML += "</ul>";
};

const startSearching = async () => {
  const reponse = await window.versions.startSearching();
  document.getElementById("startSearching").innerText = "Query sent!";
};

const proceedWithFoundModules = async () => {
  const response = await window.versions.proceedWithFoundModules();
  document.getElementById("continue").innerText =
    "Requesting information from nodes...";
};
