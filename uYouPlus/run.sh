# Steps:
# 1. Get the latest release from https://api.github.com/repos/qnblackcat/uYouPlus/releases/latest
# 2. Download the release file
# 3. Remove app extensions in the file
# 4. Read the app Info.plist and modify the source json
# 5. Publish GitHub release with the uYouPlus IPA file

# Step 1
echo "Getting the latest release..."
release=$(curl -s https://api.github.com/repos/qnblackcat/uYouPlus/releases/latest)
echo "Done."

# Step 2
echo "Downloading the release file..."
url=$(echo $release | jq -r '.assets[0].browser_download_url')
curl -s -L -o uYouPlus.ipa $url
echo "Done."

# Step 3
mkdir Out/
echo "Removing app extensions in the file..."
./azule -i uYouPlus.ipa -o Out/ -e
echo "Done."

# Step 4
echo "Reading the app Info.plist..."
plist=$(unzip -p ./Out/uYouPlus.ipa Payload/YouTube.app/Info.plist)
echo "Done."

echo "Modifying the source json..."
json=$(cat uyouplus.json)
json=$(echo $json | jq ".apps[0].version = \"$(echo $plist | grep -oP '<key>CFBundleShortVersionString<\/key>\s*<string>\K[\d.]*?(?=<\/string>)')\"")
json=$(echo $json | jq ".apps[0].versionDate = \"$(echo $release | jq -r '.published_at')\"")
json=$(echo $json | jq ".apps[0].versionDescription = \"$(echo $release | jq -r '.body')\"")
# json=$(echo $json | jq ".apps[0].downloadURL = \"$(echo $release | jq -r '.assets[0].browser_download_url')\"")
json=$(echo $json | jq ".apps[0].size = $(echo $release | jq -r '.assets[0].size')")

echo "Done."

echo "Writing the source json..."
echo $json > uyouplus.json
echo "Done."

# Step 5
echo "Publishing release..."
git tag -a $(echo $json | jq -r '.tag_name') -m "$(echo $release | jq -r '.body')"
git push origin $(echo $json | jq -r '.tag_name')
echo "Done."