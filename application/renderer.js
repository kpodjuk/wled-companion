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
  if (response.length == 0) {
    // do nothing
  } else {
    // print list
    document.getElementById("foundWLEDDevices").innerHTML = "<ul>";
    // iterate over each found node
    response.forEach((element) => {
      document.getElementById("foundWLEDDevices").innerHTML +=
        "<li>" + element + "</li>";
    });
    document.getElementById("foundWLEDDevices").innerHTML += "</ul>";
  }


};

const startSearching = async () => {
  const reponse = await window.versions.startSearching();
  document.getElementById("startSearching").innerText = "Query sent!";
};

const proceedWithFoundModules = async () => {

  if (document.getElementById('foundWLEDDevices').innerHTML == "") {
    alert("Can't continue, no modules found");
  } else {
    const response = await window.versions.proceedWithFoundModules();
    document.getElementById("continue").innerText =
      "Requesting information from nodes...";
  }

};
