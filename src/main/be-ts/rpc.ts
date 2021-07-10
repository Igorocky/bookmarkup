import {getEnvironmentName} from './config'
import {getBook, saveSelections, listAvailableBooks, getSelections} from './data'

const rpcMethods = {
    getEnvironmentName,
    getBook,
    saveSelections,
    listAvailableBooks,
    getSelections
}

export {rpcMethods}