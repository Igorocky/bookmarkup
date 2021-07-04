import fs from 'fs'
import util from 'util'

const readFile = util.promisify(fs.readFile)

async function getBook({name}: { name: string }) {
    let buffer = await readFile(`C:\\igye\\projects\\js\\bookmarkup\\src\\main\\public\\js\\data\\${name}.json`, 'UTF-8');
    console.log({buffer})
    return JSON.parse(buffer)
}

export {
    getBook
}