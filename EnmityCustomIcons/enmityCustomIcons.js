const axios = require("axios");
const fs = require("fs");
const unzipper = require("unzipper");

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
    var plumpycordjson = json.data.assets.find(asset => { return asset.name === "Plumpycord.ipa" })
    var plumpycord = await axios.get(plumpycordjson.browser_download_url, {
      responseType: "stream",
    });

    const dest = fs.createWriteStream("./PlumpyCord.ipa");
    plumpycord.data.pipe(dest);

    // TODO: Add Debrandcord

    // Step 3
    const source = fs.readFileSync("./plumpycord.json", "utf8");
    const sourceJson = JSON.parse(source);

    // Unzip the IPA and find the version in the Info.plist
    plumpycord.data
      .pipe(unzipper.ParseOne(/Discord\.app\/Info\.plist/))
      .on("entry", (entry) => {
        entry.pipe(fs.createWriteStream("./Info.plist"));

        entry.on("end", () => {
          const infoPlist = fs.readFileSync("./Info.plist", "utf8");
          const version = infoPlist.match(/<key>CFBundleShortVersionString<\/key>\s*<string>(.*?)<\/string>/)[1];

          sourceJson.apps[0].version = version;
          sourceJson.apps[0].versionDate = json.data.published_at;
          sourceJson.apps[0].versionDescription = json.data.body;
          sourceJson.apps[0].size = plumpycordjson.size;
          sourceJson.apps[0].downloadURL = plumpycordjson.browser_download_url;
      
          fs.writeFileSync("./plumpycord.json", [
            '---',
            'title: PlumpyCord',
            'permalink: /plumpycord/',
            '---\n'
          ].join('\n') + JSON.stringify(sourceJson, null, 2));
        });
        
      })

  });
