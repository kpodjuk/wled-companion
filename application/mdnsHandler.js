const request = require("request");

var foundWLEDDevices = [];

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

var saveNewWLEDDevice = function (deviceAddress) {
  // now we know for sure it's WLED, save it to the database
};

var jsonPrint = function (json) {
  return JSON.stringify(json, null, 2).brightMagenta;
};

var isItWLED = function (deviceAddress) {
  apiCallUrl = "http://" + deviceAddress + "/win";
  console.log(("isItWLED(): " + deviceAddress + " ?").brightMagenta);
  // send api call to check if it's actually a wled device, only WLED will repond on this URL
  request.get(apiCallUrl, (error, response, body) => {
    if (!error && response.statusCode == 200) {
      console.log("isItWLED(): 200, it's a wled device!".brightMagenta);

      foundWLEDDevices.push(deviceAddress);

      console.log("WLED devices found so far: ".brightMagenta);
      console.log(foundWLEDDevices);
    } else {
      console.log(
        "isItWLED(): " + error + " it's probalby not a WLED device".red
      );
    }
  });
};

module.exports = {
  init: function () {
    // handle responses
    mdns.on("response", function (response) {
      console.log("-------------------------------------------------------");
      console.log("Got MDNS response!");
      console.log("It's IP is: " + jsonPrint(response.answers[0].data));
      // we have something, is it really wled?
      // before checking, make sure it's not already on the list, doesn't make sense to bother it again
      if (!foundWLEDDevices.includes(response.answers[0].data)) {
        isItWLED(response.answers[0].data);
      } else {
        console.log(
          "mdnsResponseHandler(): already was on the list, didn't even send request"
            .brightMagenta
        );
      }
      console.log("-------------------------------------------------------");
    });
  },

  returnDetectedDevices: function () {
    // return array with detected WLED nodes
    let arrayAsString = "[" + foundWLEDDevices.join(", ") + "]";
    console.log("Providing foundWLEDDevices[] to frontend: " + arrayAsString);
    return arrayAsString;
  },

  sendQuery: function () {
    // you don't even have to send queries? Or what?
    //    serviceBrowser.StartBrowse("_http._tcp");

    console.log("sendQuery(): Sending mdns query, with questions: ");
    jsonPrint(questions);
    mdns.query(questions);
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
