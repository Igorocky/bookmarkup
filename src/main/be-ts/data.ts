import fs from 'fs'
import util from 'util'
import childProcess from 'child_process'
import {appConfig} from './config'

export {getBook, saveSelections, listAvailableBooks, getSelections}

const readFile = util.promisify(fs.readFile)
const writeFile = util.promisify(fs.writeFile)
const exec = util.promisify(childProcess.exec)

async function getBook({bookId}: { bookId: string }): Promise<any> {
    const markup = appConfig.markupsById[bookId]
    if (!markup) {
        throw new Error(`Could not find a book with id ${bookId}`)
    }
    const buffer = await readFile(markup.bookFile, 'UTF-8')
    return JSON.parse(buffer)
}

async function getSelections({bookId}: { bookId: string }): Promise<any> {
    const markup = appConfig.markupsById[bookId]
    if (!markup) {
        throw new Error(`Could not find a book with id ${bookId}`)
    }
    const buffer = await readFile(markup.selectionsFile, 'UTF-8')
    return JSON.parse(buffer)
}

async function saveSelections({bookId, selections}:{bookId:string, selections:string}) {
    const selectionsFilePath = appConfig.markupsById[bookId].selectionsFile
    if (selectionsFilePath) {
        try {
            await writeFile(selectionsFilePath, selections, 'UTF-8')
            return {status:'ok'}
        } catch (err) {
            return {status:'error', msg: JSON.stringify(err)}
        }
    } else {
        return {status:'error', msg: 'selectionsFilePath not found'}
    }
}

function listAvailableBooks() {
    return appConfig.markups.map(({id, title}) => ({id, title}))
}