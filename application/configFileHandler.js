const fs = require("fs");
const { config } = require("process");
// const { config } = require("process");

module.exports = {
  readConfigFile: () => {
    let configFile;

    try {
      configFile = fs.readFileSync("configuration.json", "utf-8");
    } catch (e) {
      console.log("readConfigFile(): Error while reading config file: ".red);
      console.log(e);
      if (e.errno == -4058) {
        console.log("readConfigFile(): Config file doesn't exist!: ".magenta);
      } else {

      }

      return "";
    }

    console.log("readConfigFile(): Reading config file succesful!, contents: ".green);
    console.log(configFile);

    return JSON.parse(configFile);
  },

  writeConfigFile: (config) => {
    console.log("writeConfigFile(): Writing config file".blue);
    try {
      fs.writeFileSync("configuration.json", JSON.stringify(config), "utf-8");
    } catch (e) {
      if (e) {
        console.log("Failed to save the file: ".red);
        console.log(e);

      }
    }
  },
};
