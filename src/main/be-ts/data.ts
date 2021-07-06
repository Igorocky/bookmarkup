import fs from 'fs'
import util from 'util'
import childProcess from 'child_process'

export {getBook, saveSelections}

const readFile = util.promisify(fs.readFile)
const exec = util.promisify(childProcess.exec)

async function getBook({name}: { name: string }): Promise<any> {
    let buffer = await readFile(`C:\\igye\\projects\\js\\bookmarkup\\src\\main\\public\\js\\data\\${name}.json`, 'UTF-8');
    return JSON.parse(buffer)
}

async function saveSelections({selections}) {
    let {stdout, stderr} = await exec('dir')
    return {output: stdout}
}