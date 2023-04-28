import axios from 'axios'
import fs from 'fs'
import { CustomSource } from '../types'
import { logger } from '../Ansi'

(async ()=>{

const res = await axios.get('https://api.github.com/repos/arichorn/uYouPlusExtra/releases')

var release: {
  [key: string]: any
} = {}
var biggestVer = 0

res.data.forEach((r: { [key: string]: any }) => {
  let versionMatch = r.tag_name.match(/v(.*?)-/)
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

const remoteVer = release.tag_name.match(/v(.*?)-/)[1]

const sourceJSON: CustomSource = JSON.parse(
  fs.readFileSync('./uyouplusextra.json').toString()
    .split('\n')
    .slice(4)
    .join('\n')
)
const current = sourceJSON.apps[0].versions[0]
const currentVer = current ? current.version : "0.0.0"

const currentTagName = (sourceJSON.customData || {}).githubTagName || 'release0.0.0-0'
const remoteTagName = release.tag_name

process.stdout.write(JSON.stringify({
  remote: remoteVer,
  current: currentVer,
  update: currentTagName != remoteTagName
}))

})()