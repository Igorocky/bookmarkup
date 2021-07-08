import fs from 'fs'
import util from 'util'
import path from 'path'
import crypto from 'crypto'
import {getBook} from "./data";

export {loadAppConfig, appConfig}

const readFile = util.promisify(fs.readFile)

let appConfig: AppConfig

interface BookMarkupConfig {
    id: string,
    title: string,
    bookFile: string,
    imgDir: string,
    imgHash:string,
    actualImgHash:string,
    selectionsFile: string
}

interface AppConfig {
    markups: BookMarkupConfig[]
    markupsById: Record<string, BookMarkupConfig>
}

async function loadAppConfig(configFilePath:string): Promise<void> {
    const configFileDir = path.dirname(configFilePath)
    function toAbsolutePath(relPath:string): string {
        return path.resolve(configFileDir, relPath)
    }
    appConfig = JSON.parse(await readFile(configFilePath, 'UTF-8'))
    appConfig.markups = appConfig.markups.map(m => ({
        ...m,
        bookFile: toAbsolutePath(m.bookFile),
        selectionsFile: toAbsolutePath(m.selectionsFile),
        imgDir: toAbsolutePath(m.imgDir),
    }))
    appConfig.markupsById = appConfig.markups.reduce((prev,curr)=>({...prev,[curr.id]:curr}), {})
    await validateHashes(appConfig.markups)
}

async function validateHashes(markups:BookMarkupConfig[]) {
    const hashes = await Promise.all(
        markups.map(markupCfg => calculateHash({markupCfg}))
    )
    for (let i = 0; i < markups.length; i++) {
        markups[i].actualImgHash = hashes[i]
    }
    const mismatches = markups.filter(m => m.imgHash !== m.actualImgHash)
    if (mismatches.length) {
        const mismatchesStr = mismatches.map(m=>`id = ${m.id}\nexpected = ${m.imgHash}\nactual = ${m.actualImgHash}`).join('\n\n')
        throw new Error(`There are mismatches in image hashes:\n${mismatchesStr}`)
    }
}

async function calculateHash({filePath, markupCfg}: { filePath?: string, markupCfg?: BookMarkupConfig }): Promise<string> {
    if (filePath) {
        return new Promise(function (resolve, reject) {
            const hash = crypto.createHash('md5')
            const input = fs.createReadStream(filePath)
            input.on('error', reject)
            input.on('data', chunk => hash.update(chunk))
            input.on('close', () => resolve(hash.digest('hex')))
        })
    } else if (markupCfg) {
        const book = await getBook({bookId: markupCfg.id})
        return Promise.all(
            book.pages.map(page => calculateHash({filePath:path.resolve(markupCfg.imgDir, page.fileName)})) as Promise<string>[]
        )
            .then(pageHashes => `[${pageHashes.join(',')}]`)
    } else {
        throw new Error('Either filePath or markupCfg or appConfig should be specified.')
    }
}