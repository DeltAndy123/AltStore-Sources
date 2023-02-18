import axios from 'axios'
import fs from 'fs'

(async ()=>{

const res = await axios.get('https://api.github.com/repos/TherionRO/YouTubeiVanced/releases/latest')
const remoteVer = res.data.tag_name.match(/release(.*?)-/)[1].replace(/(?<=\d+\.\d+\.)0/, '')

const sourceJSON: Source = JSON.parse(
  fs.readFileSync('./ytivanced.json').toString()
    .split('\n')
    .slice(4)
    .join('\n')
)
const current = sourceJSON.apps[0].versions[0]
const currentVer = current ? current.version : "0.0.0"

const currentTagName = (sourceJSON.customData || {}).githubTagName || 'release0.0.0-0'
const remoteTagName = res.data.tag_name

process.stdout.write(JSON.stringify({
  remote: remoteVer,
  current: currentVer,
  update: currentTagName != remoteTagName
}))

})()
