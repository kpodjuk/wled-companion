const request = require("request");

// variable with dicovered nodes, initialized with some modules for debug purposes
var foundWLEDDevices = [
  "192.168.1.59", // above shelf
  // "192.168.1.42" // below shelf
];
// var foundWLEDDevices = [];

var discoveredNodes = []; // array of objects with names+addresses of discovered nodes


var mdns = require("multicast-dns")({
  multicast: true, // use udp multicasting
  // interface: "192.168.4.1", // explicitly specify a network interface. defaults to all
  // port: 5353, // set the udp port
  // ip: '224.0.0.251', // set the udp ip
  // ttl: 120, // set the multicast ttl
  loopback: false, // receive your own packets
  reuseAddr: true, // set the reuseAddr option when creating the socket (requires node >=0.11.13)
});

var questions = [
  {
    name: "_http._tcp",
    type: "A",
  },
];

var jsonPrint = function (json) {
  return JSON.stringify(json, null, 2).brightMagenta;
};

var sendQuery = function () {
  // you don't even have to send queries? Or what?
  // doesn't seem to make a difference on answers I receive
  console.log("sendQuery(): Sending mdns query, with questions: ".blue);
  console.log(jsonPrint(questions));
  mdns.query(questions);
};

// at this point - strong suspicion that it's WLED, send get request
var isItWLED = function (deviceAddress) {
  apiCallUrl = "http://" + deviceAddress + "/win";
  console.log(
    (
      "isItWLED(): Sending request to " +
      deviceAddress +
      " - possible WLED module"
    ).yellow
  );
  request.get(apiCallUrl, (error, response, body) => {
    if (!error && response.statusCode == 200) {
      console.log("isItWLED(): 200, Found new WLED device!".green);

      foundWLEDDevices.push(deviceAddress);
    } else {
      console.log("isItWLED(): ".red + error + " It's not a WLED device".red);
    }
  });
};

module.exports = {
  stopAwaitingResponses: () => {
    // found what was needed, no need to analyze responses anymore

    console.log("mdnsHandler(): Stopped awaiting responses".yellow);
    mdns.destroy();
  },

  init: function () {
    // handle responses
    mdns.on("response", function (response) {
      console.log("-------------------------------------------------------");
      // console.log("Got MDNS response!"); // log answers here
      console.log("Got MDNS response!, answers: ");
      console.log(response.answers);

      // first, check if there's at least field with ip address
      // doesn't make sense to try to send request if data field doesn't contain ip address
      // it should be a string if it's WLED answering
      if (typeof response.answers[0].data == "string") {
        console.log(
          "mdnsResponseHandler(): Got answer with string in data field, promising!"
            .green
        );
        console.log(
          "mdnsResponseHandler(): Detected IP: ".green +
          jsonPrint(response.answers[0].data)
        );
        // before sending request, make sure it's not already on the list, doesn't make sense to bother it again
        if (!foundWLEDDevices.includes(response.answers[0].data)) {
          console.log(
            "mdnsResponseHandler() Not on the list! Have to send request".green
          );
          isItWLED(response.answers[0].data);
        } else {
          console.log(
            "mdnsResponseHandler(): already was on the list, no sense bothering it again"
              .yellow
          );
        }
      } else {
        console.log(
          "mdnsResponseHandler(): No string in data field, don't care".red
        );
      }

      console.log("-------------------------------------------------------");
    });
  },

  startSearching: () => {
    // console.log("Frontend asked for startSearching()".yellow);
    sendQuery();
  },

  returnDetectedDevices: function () {
    return foundWLEDDevices;
  },

  returnDetectedDevicesWithNames: function () {
    // console.log("returnDetectedDevices(): ".brightMagenta);
    // console.log(discoveredNodes);
    foundWLEDDevices.forEach((deviceAddress) => {
      request.get("http://" + deviceAddress + "/json/info", (error, response, body) => {
        if (!error && response.statusCode == 200) {
          var index = discoveredNodes.findIndex(x => x.address == deviceAddress);
          if (index == -1) {
            // node with that adress wasn't in the array before, push
            discoveredNodes.push({
              address: deviceAddress,
              name: JSON.parse(body)["name"]
            })
          }
        } else {

        }
      });
    })
    return discoveredNodes;
  },
};

// this is how WLED answers:

// {
//     "id": 0,
//     "type": "response",
//     "flags": 1024,
//     "flag_qr": true,
//     "opcode": "QUERY",
//     "flag_aa": true,
//     "flag_tc": false,
//     "flag_rd": false,
//     "flag_ra": false,
//     "flag_z": false,
//     "flag_ad": false,
//     "flag_cd": false,
//     "rcode": "NOERROR",
//     "questions": [],
//     "answers": [
//       {
//         "name": "wled-biurko.local",
//         "type": "A",
//         "ttl": 120,
//         "class": "IN",
//         "flush": true,
//         "data": "192.168.1.33"
//       }
//     ],
//     "authorities": [],
//     "additionals": []
//   }

// text colors
// black
// red
// green
// yellow
// blue
// magenta
// cyan
// white
// gray
// grey
// bright text colors
// brightRed
// brightGreen
// brightYellow
// brightBlue
// brightMagenta
// brightCyan
// brightWhite
// background colors
// bgBlack
// bgRed
// bgGreen
// bgYellow
// bgBlue
// bgMagenta
// bgCyan
// bgWhite
// bgGray
// bgGrey
// bright background colors
// bgBrightRed
// bgBrightGreen
// bgBrightYellow
// bgBrightBlue
// bgBrightMagenta
// bgBrightCyan
// bgBrightWhite
// styles
// reset
// bold
// dim
// italic
// underline
// inverse
// hidden
// strikethrough
// extras
// rainbow
// zebra
// america
// trap
// random

// this is how they confirm it's actually wled
// try
// {
//     string apiCommand = "/win"; //WLED http API URI
//     if (API_Call != null && API_Call.Length > 0)
//     {
//         apiCommand += "&";
//         apiCommand += API_Call;
//     }
//     var result = await Client.GetAsync(DeviceURI + apiCommand);
//     if (result.IsSuccessStatusCode)
//     {
//         return await result.Content.ReadAsStringAsync();
//     } else //404 or other non-success status codes, indicates that target is not WLED device
//     {
//         return "err";
//     }
// } catch
// {
//     return null; //time-out or other connection error
// }
