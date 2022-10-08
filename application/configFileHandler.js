const fs = require("fs");

module.exports = {
  readConfigFile: () => {
    const configFile = fs.readFileSync("config.json", "utf-8");
    return JSON.parse(configFile);
  },

  writeConfigFile: (config) => {
    // const configFile = JSON.stringify(config);
    // fs.writeFileSync("config.json", configFile, "utf-8");
    console.log("writeConfigFile(): Writing config file".blue);
    try {
      fs.writeFileSync("configuration.json", JSON.serialize(config), "utf-8");
    } catch (e) {
      console.log("Failed to save the file !".red);
    }
  },
};
