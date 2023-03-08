const getDetectedNodesRefreshIntervalMs = 5000;

var getDiscoveredNodesInterval = window.setInterval(() => {
  getDiscoveredNodes();
}, getDetectedNodesRefreshIntervalMs);

// do first getDetectedDevicesInterval immidietly so buttonSpinner is shown witout delay
getDiscoveredNodes();

// event listeners for buttons
document.addEventListener("click", (e) => {
  console.log("ClickHandler: " + e.target.id);
  if (e.target.id == "buttonContinue") {
    console.log("Continue button pressed".green);
    proceedWithFoundModules();
  } else if (e.target.id.startsWith("deleteNode")) {
    console.log("Deleting node with id: " + e.target.id);
    deleteNodeFromYourNodes(e.target.id.slice(10));
  } else if (e.target.id.startsWith("addNode")) {
    console.log("Adding node with id: " + e.target.id);
    address = e.target.id.slice(7);
    // change text on button of newly added node
    addNodeToYourNodes(address);
  }
});

const getDiscoveredNodes = async () => {
  // get discovered nodes from backend
  // const response = await window.versions.getDiscoveredNodes();
  response = ["test1", "test2", "test3"];
  console.log("getDiscoveredNodes():");
  console.log(response);
  if (response.length == 0) {
    // do nothing, nothing found
  } else {
    // iterate over each found node and print it
    response.forEach((element) => {
      if (
        // but first make sure it's not already on the list
        document.getElementById("discoveredNodes").innerHTML.search(element) ==
        -1
      ) {
        // not on the list, printing
        let nodeContainer = document.createElement("div");
        nodeContainer.id = "discoveredNodes:" + element;
        nodeContainer.classList = "module";
        nodeContainer.innerHTML =
          "<div class='discoveredNodeAddressContainer'>💡  " +
          element +
          "</div><a id='addNode" +
          element +
          "' class='buttonAddDiscovered' >SAVE</a>";

        document.getElementById("discoveredNodes").appendChild(nodeContainer);
      }
    });
    // add that spinning thingy and the end to show user it's discovering right now
    // but first check if it's not already there
    if (
      "spinnerContainer" &&
      document.getElementById("spinnerContainer") == null
    ) {
      // case: it's not existing at all, append it
      let element = document.createElement("div");
      element.id = "spinnerContainer";
      element.classList.add("spinnerContainer");
      element.innerHTML =
        "<a class='buttonSpinner'><span></span><span></span><span></span><span></span>\
      Discovering...</a>";
      document.getElementById("discoveredNodes").appendChild(element);
    } else if (
      // case: it's existing but not at the very bottom
      document.getElementById("discoveredNodes").lastChild.id !=
        "spinnerContainer" &&
      document.getElementById("spinnerContainer") != null
    ) {
      // remove old spinner
      document.getElementById("spinnerContainer").remove();

      // append new spinner at the end
      let element = document.createElement("div");
      element.id = "spinnerContainer";
      element.classList.add("spinnerContainer");
      element.innerHTML =
        "<a class='buttonSpinner'><span></span><span></span><span></span><span></span>\
      Discovering...</a>";
      document.getElementById("discoveredNodes").appendChild(element);
    }
  }
};

const getExistingNodes = async () => {
  response = await window.versions.getExistingNodes();
  // reponse is whole config file, only adresses are needed here
  response = response.foundNodes;
  // console.log(response);
  if (typeof response == "undefined") {
    // do nothing, no existing nodes loaded from config
  } else {
    // print list
    document.getElementById("discoveredNodes").innerHTML = "<ul>";
    // iterate over each found node
    response.forEach((element) => {
      document.getElementById("discoveredNodes").innerHTML +=
        "<div id='" +
        element +
        "' class='module'>" +
        element +
        " <a id='deleteNode class='buttonRemoveYourNodes'" +
        element +
        "'>ALREADY EXIST</a>";
    });
    document.getElementById("discoveredNodes").innerHTML += "</ul>";
  }
};

const appendContinueButton = async () => {
  // you can only continue if there's at least one node on the list
  if (
    document.getElementsByClassName("yourNodesNodeAddressContainer").length > 0
  ) {
    // you are supposed to add it, but first check if it's not already there
    if (document.getElementById("continueContainer") == null) {
      let element = document.createElement("div");
      // case: it's not exisitng at all, append it
      element.id = "continueContainer";
      element.classList.add("continueContainer");
      element.innerHTML =
        "<a class='buttonContinue' id='buttonContinue'>\
      Continue</a>";
      document.getElementById("yourNodes").appendChild(element);
    } else if (
      // case: it's existing but not at the very bottom
      document.getElementById("yourNodes").lastChild.id !=
        "continueContainer" &&
      document.getElementById("continueContainer") != null
    ) {
      // remove old continue buttion
      document.getElementById("continueContainer").remove();
      let element = document.createElement("div");
      element.id = "continueContainer";
      element.classList.add("continueContainer");
      element.innerHTML =
        "<a class='buttonContinue' id='buttonContinue'>\
      Continue</a>";
      document.getElementById("yourNodes").appendChild(element);
    }
  }
};

const addNodeToYourNodes = async (nodeAddress) => {
  console.log("addNode(): " + nodeAddress);
  // make sure it isn't already on the list and add it if it's not
  if (
    document.getElementById("yourNodes").innerHTML.search(nodeAddress) == -1
  ) {

    let nodeContainer = document.createElement("div");
    nodeContainer.id = "yourNodes:" + nodeAddress;
    nodeContainer.classList = "module";
    nodeContainer.innerHTML =
      "<div class='yourNodesNodeAddressContainer'>💡  " +
      nodeAddress +
      "</div><a id='deleteNode" +
      nodeAddress +
      "' class='buttonRemoveYourNodes' >REMOVE</a>";

    document.getElementById("yourNodes").appendChild(nodeContainer);

    // add continue button at the bottom
    appendContinueButton();
  }
};

addNodeToYourNodes("test");

const proceedWithFoundModules = async () => {
  if (document.getElementById("discoveredNodes").innerHTML == "") {
    // alert("Can't continue, no modules found");
  } else {
    const response = await window.versions.proceedWithFoundModules();
    // document.getElementById("continue").innerText =
    //   "Requesting information from nodes...";
  }
};

const deleteNodeFromYourNodes = async (nodeAddress) => {
  console.log("deleteNode(): deleting node with address:" + nodeAddress);
  // remove node from address list
  document.getElementById("yourNodes:" + nodeAddress).remove();
  // remove continue button if there's no nodes left on the list
  if (
    document.getElementsByClassName("yourNodesNodeAddressContainer").length == 0
  ) {
    document.getElementById("continueContainer").remove();
  }
};

const startSearching = async () => {
  const reponse = await window.versions.startSearching();
};

// getExistingNodes(); // get already existing nodes from config file during window creation

// ################################### for debug ###################################
// addNode("1.1.1.1");
// addNode("1.1.1.2");

// document.getElementById("discoveredNodes").innerHTML +=
//   "<div id='" +
//   "1.2.3.4" +
//   "' class='module'>" +
//   "<div class='yourNodesNodeAddressContainer'>🔎  " +
//   "1.2.3.4" +
//   "</div><a id='addNode" +
//   "1.2.3.4" +
//   "' class='buttonAddDiscovered'>SAVE</a>";

// document.getElementById("discoveredNodes").innerHTML +=
//   "<div id='" +
//   "1.2.3.4" +
//   "' class='module'>" +
//   "<div class='yourNodesNodeAddressContainer'>🔎  " +
//   "1.2.3.4" +
//   "</div><a id='addNode" +
//   "1.2.3.4" +
//   "' class='buttonAddDiscovered'>SAVE</a>";

// document.getElementById("discoveredNodes").innerHTML =
//   document.getElementById("discoveredNodes").innerHTML +
//   "<div class='spinnerContainer'>\
//   <a class='buttonSpinner'><span></span><span></span><span></span><span></span>\
//   Discovering...</a></div>";
