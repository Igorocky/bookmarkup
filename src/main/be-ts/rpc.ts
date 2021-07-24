import {getEnvironmentName} from './config'
import {getBook, saveSelections, saveRepeatGroups, listAvailableBooks, getSelections, getRepeatGroups} from './data'

const rpcMethods = {
    getEnvironmentName,
    getBook,
    saveSelections,
    saveRepeatGroups,
    listAvailableBooks,
    getSelections,
    getRepeatGroups,
}

export {rpcMethods}