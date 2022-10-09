const getDetectedNodesRefreshIntervalMs = 5000;


// even listeners for buttons
document.addEventListener("click", (e) => {

  if (e.target.id == 'continue') {
    proceedWithFoundModules();
  } else if (e.target.id.startsWith('deleteNode')) {
    console.log("Deleting node: " + e.target.id);
    deleteNode(e.target.id.slice(10));
    // deleteNode(e.target.id.slice(e.target.id.lastIndexOf('deleteNode')))
  } else if (e.target.id.startsWith('addNode')) {
    addNode(e.target.id.slice(7));
  }

});

var getDetectedDevicesInterval = window.setInterval(() => {
  getDiscoveredNodes();
}, getDetectedNodesRefreshIntervalMs);

const getDiscoveredNodes = async () => {
  const response = await window.versions.getDiscoveredNodes();
  if (response.length == 0) {
    // do nothing
  } else {
    // print list
    document.getElementById("discoveredNodes").innerHTML = "<ul>";
    // iterate over each found node
    response.forEach((element) => {
      document.getElementById("discoveredNodes").innerHTML +=
        "<li id='" + element + "'>" + element + " <button id='addNode" + element + "'> 🔌</button></li>"
    });
    document.getElementById("discoveredNodes").innerHTML += "</ul>";
  }
};

const addNode = async (nodeAddress) => {
  console.log("addNode(): " + nodeAddress)
}

const getExistingNodes = async () => {

  response = await window.versions.getExistingNodes();
  // reponse is whole config file, only adresses are needed here
  response = response.foundNodes;
  console.log(response);
  if (response.length == 0) {
    // do nothing
  } else {
    // print list
    document.getElementById("existingNodes").innerHTML = "<ul>";
    // iterate over each found node
    response.forEach((element) => {
      document.getElementById("existingNodes").innerHTML +=
        "<li id='" + element + "'>" + element + "<button id='deleteNode" + element + "'> 🗑</button></li>"
    });
    document.getElementById("existingNodes").innerHTML += "</ul>";
  }
}

const startSearching = async () => {
  const reponse = await window.versions.startSearching();
};

const proceedWithFoundModules = async () => {
  if (document.getElementById('discoveredNodes').innerHTML == "") {
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

getExistingNodes(); // get already existing nodes from config file during window creation
