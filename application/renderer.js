// const mdnsHandler = require("./mdnsHandler.js");
// even listeners for buttons
document.addEventListener("click", (e) => {
  // console.log("Clicked: " + e.target.id);

  if (e.target.id === "startSearching") {
    // mdnsHandler.sendQuery();
  } else if (e.target.id === "getFoundDevices") {
    getDetectedDevices();
  }
});

// Ping backend example:
// const func = async () => {
//   const response = await window.versions.ping();
//   console.log(response); // prints out 'pong'
// };

const getDetectedDevices = async () => {
  // in here we will get array with found devices, hopefully
  const response = await window.versions.getDetectedDevices();
  document.getElementById("foundWLEDDevices").innerText = response;
};

// func();
