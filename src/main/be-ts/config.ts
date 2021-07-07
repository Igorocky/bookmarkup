import fs from 'fs'
import util from 'util'
import path from "path";

export {loadAppConfig, appConfig}

const readFile = util.promisify(fs.readFile)

let appConfig: AppConfig

interface BookMarkupConfig {
    id: string,
    title: string,
    bookFile: string,
    imgDir: string,
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
}