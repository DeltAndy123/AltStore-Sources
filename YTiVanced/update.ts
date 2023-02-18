import axios, { AxiosResponse } from 'axios'
import fs, { WriteStream } from 'fs'
import { exec, ExecException } from 'child_process'
import { Ansi, logger } from '../Ansi'
import AdmZip from 'adm-zip'
import plist from 'plist'

const { Colors: { DarkGray, Green }, Formats: { Bold, Underline } } = Ansi


// Steps:
// 1. Get all releases from https://api.github.com/repos/TherionRO/YouTubeiVanced/releases
// 2. Get the latest release with the biggest version number
// 3. Download the release file
// 4. Remove app extensions in the file
// 5. Read the app Info.plist and modify the source json

const shell = {
  execSync(cmd: string, callback = (stderr: ExecException | null, stdout: string) => {}) {
    exec(cmd, (stderr, stdout) => {
      callback(stderr, stdout)
    })
  },
  exec(cmd: string) {
    return new Promise((resolve, reject) => {
      exec(cmd, (stderr, stdout) => {
        if (stderr) reject(stderr)
        resolve(stdout)
      })
    })
  },
  ShellError: class ShellError extends Error {
    constructor(message: string) {
      super(message)
      this.name = 'ShellError'
    }
  }
}

function pipeData(data: AxiosResponse["data"], dest: any) {
  return new Promise<void>((resolve) => {
    var stream: WriteStream = data.pipe(dest)
    stream.on('finish', () => {
      resolve()
    })
  })
}

var debug = false

if (process.argv.includes('-d') || process.argv.includes('--debug')) {
  debug = true
  logger.debug('Debug mode is enabled')
}

logger.info(Bold('Step 1: ') + DarkGray(`Get all releases from ${Underline('https://api.github.com/repos/TherionRO/YouTubeiVanced/releases')}`))
axios.get('https://api.github.com/repos/TherionRO/YouTubeiVanced/releases')
  .then(async (releases) => {
    logger.info(Bold(Green('Done')))


    logger.info(Bold('Step 2: ') + DarkGray(`Get the latest release with the biggest version number`))
    var biggestVer = 0
    var release: {
      [key: string]: any
    } = {}
    releases.data.forEach((r: { [key: string]: any }) => {
      let versionMatch = r.tag_name.match(/release(.*?)-/)
      if (!versionMatch) {
        logger.error('Could not find version')
        process.exit()
      }
      let version = versionMatch[1]
      let versionNum = parseFloat(version.replace(/\.(\d+)$/, '$1'))
      if (versionNum > biggestVer) {
        biggestVer = versionNum
        release = r
      }
    })
    logger.info(Bold(Green('Done')))


    logger.info(Bold('Step 3: ') + DarkGray(`Download the release file`))
    var file: AxiosResponse<{ [key: string]: any }> = await axios.get(release.assets[0].browser_download_url, {
      responseType: 'stream'
    })
    const dest = fs.createWriteStream('./YTiVanced.ipa')
    // file.data.pipe(dest)
    await pipeData(file.data, dest)
    logger.info(Bold(Green('Done')))


    logger.info(Bold('Step 4: ') + DarkGray(`Remove app extensions in the file`))
    fs.mkdirSync('./Out/')
    const out = await shell.exec('./azule -i YTiVanced.ipa -o Out/ -e').catch((e) => {
      logger.error(new shell.ShellError(e))
      process.exit(1)
    })
    if (debug) logger.debug(out)
    logger.info(Bold(Green('Done')))
    
    
    logger.info(Bold('Step 5: ') + DarkGray(`Read the app Info.plist and modify the source json`))
    const zip = new AdmZip('./Out/YTiVanced.ipa')
    const plistEntry = zip.getEntry('Payload/YouTube.app/Info.plist')
    if (!plistEntry) {
      logger.error('Could not find Info.plist in IPA')
      process.exit(1)
    }
    const infoPlist = zip.readAsText(plistEntry)
    const infoPlistJSON = plist.parse(infoPlist) as { [key: string]: any }
    if (debug) logger.debug(infoPlistJSON)
    const sourceJSON: Source = JSON.parse(
      fs.readFileSync('./ytivanced.json').toString()
        .split('\n')
        .slice(4)
        .join('\n')
    )
    if (debug) logger.debug(sourceJSON)
    const app = sourceJSON.apps[0]
    app.version = infoPlistJSON.CFBundleShortVersionString
    app.versionDate = release.published_at
    app.versionDescription = release.body
    app.downloadURL = `https://github.com/DeltAndy123/AltStore-Sources/releases/download/ytivanced-${release.tag_name.match(/release(.*?)-/)[1].replace(/(?<=\d+\.\d+\.)0/, '')}/YTiVanced.ipa`
    app.size = release.assets[0].size
    app.versions.unshift({
      version: infoPlistJSON.CFBundleShortVersionString,
      date: release.published_at,
      localizedDescription: release.body,
      downloadURL: `https://github.com/DeltAndy123/AltStore-Sources/releases/download/ytivanced-${release.tag_name.match(/release(.*?)-/)[1].replace(/(?<=\d+\.\d+\.)0/, '')}/YTiVanced.ipa`,
      size: release.assets[0].size
    })
    sourceJSON.apps[0] = app
    if (!sourceJSON.customData) sourceJSON.customData = {}
    sourceJSON.customData.githubTagName = release.tag_name
    fs.writeFileSync('./ytivanced.json', [
      '---',
      'title: YouTube iVanced',
      'permalink: /ytivanced/',
      '---\n'
    ].join('\n') + JSON.stringify(sourceJSON, null, 2))
    logger.info(Bold(Green('Done')))

  })