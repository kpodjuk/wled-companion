const getDetectedDevicesIntervalMs = 5000;

// even listeners for buttons
document.addEventListener("click", (e) => {

  if (e.target.id == 'continue') {
    proceedWithFoundModules();
  } else if (e.target.id.startsWith('deleteNode')) {
    console.log("Deleting node: " + e.target.id);
    deleteNode(e.target.id.slice(10));
    // deleteNode(e.target.id.slice(e.target.id.lastIndexOf('deleteNode')))
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
        "<li id='" + element + "'>" + element + "<button id='deleteNode" + element + "'> 🗑</button></li>"
    });
    document.getElementById("foundWLEDDevices").innerHTML += "</ul>";
  }
};

const startSearching = async () => {
  const reponse = await window.versions.startSearching();
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

const deleteNode = async (nodeAddress) => {
  console.log("deleteNode(): deleting node with address:" + nodeAddress);
  document.getElementById(nodeAddress).remove();

};
