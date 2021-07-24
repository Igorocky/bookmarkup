import fs from 'fs'
import util from 'util'
import childProcess from 'child_process'
import {appConfig} from './config'
import path from "path"

export {getBook, saveSelections, saveRepeatGroups, listAvailableBooks, getSelections, getRepeatGroups}

const readFile = util.promisify(fs.readFile)
const writeFile = util.promisify(fs.writeFile)
const exec = util.promisify(childProcess.exec)

async function getBook({bookId}: { bookId: string }): Promise<any> {
    const markup = appConfig.markupsById[bookId]
    if (!markup) {
        throw new Error(`Could not find a book with id ${bookId}`)
    }
    const buffer = await readFile(markup.bookFile, 'UTF-8')
    return {title:markup.title, defaultTags:markup.defaultTags, ...JSON.parse(buffer)}
}

async function getRepeatGroups({bookId}: { bookId: string }): Promise<any> {
    const markup = appConfig.markupsById[bookId]
    if (!markup) {
        throw new Error(`Could not find a book with id ${bookId}`)
    }
    const buffer = await readFile(markup.repeatGroupsFile, 'UTF-8')
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
    return await saveDataToFile({data:selections, filePath:appConfig.markupsById[bookId].selectionsFile})
}

async function saveRepeatGroups({bookId, repeatGroups}:{bookId:string, repeatGroups:string}) {
    return await saveDataToFile({data:repeatGroups, filePath:appConfig.markupsById[bookId].repeatGroupsFile})
}

async function saveDataToFile({data, filePath}:{data:string, filePath:string}) {
    if (filePath) {
        try {
            await saveAndCommit({filePath,data})
            return {status:'ok'}
        } catch (err) {
            console.log({err})
            return {status:'error', msg: err.message}
        }
    } else {
        return {status:'error', msg: 'filePath is not specified'}
    }
}

function listAvailableBooks() {
    return appConfig.markups.map(({id, title}) => ({id, title}))
}

async function saveAndCommit({filePath, data}:{filePath:string, data:string}) {
    const workingDir = path.dirname(filePath)
    const fileName = path.basename(filePath)
    function execCmd({cmd,msg,matcher,regex}:{cmd:string,msg:string,matcher?:(s:string)=>boolean,regex?:RegExp}) {
        return execAndAssert({dir:workingDir,cmd,msg,matcher,regex})
    }

    await execCmd({
        cmd:'git status',
        msg:'Working dir should be clean before saving the file.',
        regex: /.*nothing to commit.*working tree clean.*/
    })

    await writeFile(filePath, data, 'UTF-8')

    await execCmd({
        cmd:`git add ${fileName}`,
        msg:'',
        matcher: () => true
    })

    await execCmd({
        cmd:'git status',
        msg:'Only one file should be modified and staged for commit.',
        regex: new RegExp(`^.*Changes to be committed:\\s+\\(use "[^"]*" to unstage\\)\\s+modified:\\s+${fileName}\\s*$`, 's')
    })

    await execCmd({
        cmd:`git commit -m "Saving from the BE: ${fileName}"`,
        msg:'',
        matcher: () => true
    })

    await execCmd({
        cmd:'git status',
        msg:'Working dir should be clean after saving the file.',
        regex: /.*nothing to commit.*working tree clean.*/
    })
}

function assertStdoutMatches({execRes:{stdout,stderr},msg,matcher}) {
    if (!matcher(stdout)) {
        throw new Error(`Assertion error: ${msg}; non-expected stdout:\n-----${stdout}-----\n\nstderr:\n-----${stderr}-----`)
    }
    return stdout
}

async function execAndAssert({dir,cmd,msg,matcher,regex}:{dir:string,cmd:string,msg:string,matcher?:(s:string)=>boolean,regex?:RegExp}) {
    if (!matcher && !regex) {
        throw new Error('Either matcher or regex should be defined')
    }
    return assertStdoutMatches({
        execRes: await exec(`cd ${dir} && ${cmd}`),
        msg,
        matcher: matcher??(out => regex?.test(out))
    })
}
