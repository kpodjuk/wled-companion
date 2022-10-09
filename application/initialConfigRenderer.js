const getDetectedNodesRefreshIntervalMs = 5000;

var desiredNodes = [];// array holding all nodes that users desires to be saved in config file

// even listeners for buttons
document.addEventListener("click", (e) => {

  if (e.target.id == 'continue') {
    proceedWithFoundModules();
  } else if (e.target.id.startsWith('deleteNode')) {
    console.log("Deleting node: " + e.target.id);
    deleteNode(e.target.id.slice(10));
  }
});

var getDetectedDevicesInterval = window.setInterval(() => {
  getDiscoveredNodes();
}, getDetectedNodesRefreshIntervalMs);

const getDiscoveredNodes = async () => {
  const response = await window.versions.getDiscoveredNodesWithNames();
  if (response.length == 0) {
    // do nothing
  } else {
    // print list
    document.getElementById("discoveredNodes").innerHTML = "<ul>";
    // iterate over each found node
    response.forEach((discoveredNode) => {
      // if node is already present in "existingNodes" element don't add it to this list
      if (document.getElementById('existingNodes').innerHTML.search(discoveredNode.address) == -1) {
        // console.log("Node" + discoveredNode.address + " is not on existingNodes list");

        document.getElementById("discoveredNodes").innerHTML +=
          "<li id='" + discoveredNode.address + "'>" +
          discoveredNode.address +
          " - " +
          discoveredNode.name +
          " <button onclick='addNode(" +
          '"' + discoveredNode.address + '"' +
          ", " +
          '"' + discoveredNode.name + '"' +
          ")'" +
          "'> 🔌</button></li>"
      } else {
        // console.log("Node" + discoveredNode.address + " is already on list");
      }
    });
    document.getElementById("discoveredNodes").innerHTML += "</ul>";
  }
}


const addNode = async (nodeAddress, nodeName) => {


  console.log("addNode(): " + nodeAddress);
  // make sure it isn't already on the list and add it if it's not
  if (document.getElementById('existingNodes').innerHTML.search(nodeAddress) == -1) {
    document.getElementById('existingNodes').innerHTML +=
      "<li>" +
      nodeAddress +
      " - " +
      nodeName +
      "</li>";

    // save in array to later send to main.js
    desiredNodes.push(nodeAddress);
    window.electronAPI.sendDesiredNodes(desiredNodes);


  }

}

// const getExistingNodes = async () => {

//   response = await window.versions.getExistingNodes();
//   // reponse is whole config file, only adresses are needed here
//   response = response.foundNodes;
//   // console.log(response);
//   if (response.length == 0) {
//     // do nothing
//   } else {
//     // print list
//     document.getElementById("existingNodes").innerHTML = "<ul>";
//     // iterate over each found node
//     response.forEach((element) => {
//       document.getElementById("existingNodes").innerHTML +=
//         "<li id='" + element + "'>" + element + " <button id='deleteNode" + element + "'> 🗑</button></li>"
//     });
//     document.getElementById("existingNodes").innerHTML += "</ul>";
//   }
// }

const startSearching = async () => {
  const reponse = await window.versions.startSearching();
};

const proceedWithFoundModules = async () => {
  if (document.getElementById('discoveredNodes').innerHTML == "") {
    alert("Can't continue, no modules found");
  } else {
    // line below executes 
    const response = await window.versions.proceedWithFoundModules();
    document.getElementById("continue").innerText =
      "Requesting information from nodes...";
  }
};

const deleteNode = async (nodeAddress) => {
  console.log("deleteNode(): deleting node with address:" + nodeAddress);
  document.getElementById(nodeAddress).remove();

};

// getExistingNodes(); // get already existing nodes from config file during window creation
