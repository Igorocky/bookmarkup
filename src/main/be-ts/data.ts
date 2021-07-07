import fs from 'fs'
import util from 'util'
import childProcess from 'child_process'
import {appConfig} from './config'

export {getBook, saveSelections, listAvailableBooks}

const readFile = util.promisify(fs.readFile)
const exec = util.promisify(childProcess.exec)

async function getBook({bookId}: { bookId: string }): Promise<any> {
    const markup = appConfig.markups.find(m=>m.id===bookId)
    console.log({markup})
    if (!markup) {
        throw new Error(`Could not find a book with id ${bookId}`)
    }
    const buffer = await readFile(markup.bookFile, 'UTF-8')
    return JSON.parse(buffer)
}

async function saveSelections({selections}) {
    let {stdout, stderr} = await exec('dir')
    return {output: stdout}
}

function listAvailableBooks() {
    return appConfig.markups.map(({id, title}) => ({id, title}))
}