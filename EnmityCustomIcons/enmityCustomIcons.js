const axios = require("axios");
const fs = require("fs");

/** Steps:
 * 1. Get the latest release from https://api.github.com/repos/devicarus/enmity-custom-icons/releases/latest
 * 2. Download both release files and place them in the same folder as this script
 * 3. Modify the source json accordingly
 */

// Step 1
axios
  .get(
    "https://api.github.com/repos/devicarus/enmity-custom-icons/releases/latest"
  )
  .then(async (json) => {
    // Step 2
    var plumpycord = await axios.get(json.data.assets[0].browser_download_url, {
      responseType: "stream",
    });

    const dest = fs.createWriteStream("./PlumpyCord.ipa");
    plumpycord.data.pipe(dest);

    var enmity = await axios.get(json.data.assets[1].browser_download_url, {
      responseType: "stream",
    });

    // TODO: Add Debrandcord

    // Step 3
    const source = fs.readFileSync("./plumpycord.json", "utf8");
    const sourceJson = JSON.parse(source);

    sourceJson.apps[0].version = json.data.tag_name.replace("v", "");
    sourceJson.apps[0].versionDate = json.data.published_at;
    sourceJson.apps[0].versionDescription = json.data.body;
    sourceJson.apps[0].size = json.data.assets[0].size;

    fs.writeFileSync("./plumpycord.json", JSON.stringify(sourceJson, null, 2));
  });
