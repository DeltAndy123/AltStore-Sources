import axios from 'axios'
import fs from 'fs'

(async ()=>{

const res = await axios.get('https://api.github.com/repos/qnblackcat/uYouPlus/releases/latest')
const remoteVer = res.data.tag_name.match(/v(.*?)-/)[1]

const sourceJSON: Source = JSON.parse(fs.readFileSync('./uyouplusextra.json').toString())
const current = sourceJSON.apps[0].versions[0]
const currentVer = current ? current.version : "0.0.0"

process.stdout.write(JSON.stringify({
  remote: remoteVer,
  current: currentVer
}))

})()