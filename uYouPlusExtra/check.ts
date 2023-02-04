import axios from 'axios'
import fs from 'fs'

(async ()=>{

const res = await axios.get('https://api.github.com/repos/arichorn/uYouPlusExtra/releases/latest')
const remoteVer = res.data.tag_name.match(/v(.*?)-/)[1]

const sourceJSON: Source = JSON.parse(
  fs.readFileSync('./uyouplusextra.json').toString()
    .split('\n')
    .slice(4)
    .join('\n')
)
const current = sourceJSON.apps[0].versions[0]
const currentVer = current ? current.version : "0.0.0"

process.stdout.write(JSON.stringify({
  remote: remoteVer,
  current: currentVer
}))

})()
