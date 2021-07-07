import fs from 'fs'
import util from 'util'

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

async function loadAppConfig(configFilePath): Promise<void> {
    appConfig = JSON.parse(await readFile(configFilePath, 'UTF-8'))
    appConfig.markupsById = appConfig.markups.reduce((prev,curr)=>({...prev,[curr.id]:curr}), {})
}