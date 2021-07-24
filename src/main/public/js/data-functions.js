'use strict';

const DOWN_ARROW_KEY_CODE = 40
const UP_ARROW_KEY_CODE = 38
const SPACE_KEY_CODE = 32
const PAGE_DOWN_KEY_CODE = 34
const PAGE_UP_KEY_CODE = 33

function doPost(url, data, onSuccess, onError) {
    $.ajax({
        type: "POST",
        url: url,
        data: JSON.stringify(data),
        contentType: "application/json; charset=utf-8",
        success: onSuccess,
        error: onError
    });
}

function callBe(methodName, params) {
    return new Promise((resolve, reject) => {
        doPost(`/rpc/${methodName}`, params, resolve, reject)
    })
}

const be = {
    getEnvironmentName: () => callBe('getEnvironmentName',{}),
    getBook: (bookId) => callBe('getBook',{bookId}),
    getSelections: (bookId) => callBe('getSelections',{bookId}),
    getRepeatGroups: (bookId) => callBe('getRepeatGroups',{bookId}),
    listAvailableBooks: () => callBe('listAvailableBooks',{}),
    saveSelections: ({bookId,selections}) => callBe('saveSelections',{bookId,selections}),
    saveRepeatGroups: ({bookId,repeatGroups}) => callBe('saveRepeatGroups',{bookId,repeatGroups}),
}

function hasValue(variable) {
    return variable !== undefined && variable !== null
}

function hasNoValue(variable) {
    return !hasValue(variable)
}

function isObject(obj) {
    return typeof obj === 'object' && !Array.isArray(obj)
}

function isFunction(obj) {
    return typeof obj === 'function'
}

function randomInt(min, max) {
    return min + Math.floor(Math.random()*((max-min)+1))
}

function ints(start, end) {
    let i = start
    const res = [];
    while (i <= end) {
        res.push(i)
        i++
    }
    return res
}

function prod(...arrays) {
    if (arrays.length) {
        const childProdResult = prod(...arrays.rest());
        return arrays.first().flatMap(e => childProdResult.map(row => [e,...row]))
    } else {
        return [[]]
    }
}

function sortBy(arr, attr) {
    const isFunc = isFunction(attr)
    return [...arr].sort((a,b) => {
        const aAttr = isFunc?attr(a):a[attr]
        const bAttr = isFunc?attr(b):b[attr]
        return aAttr < bAttr ? -1 : aAttr == bAttr ? 0 : 1
    })
}

Array.prototype.sortBy = function (attr) {
    return sortBy(this, attr)
}

Array.prototype.min = function () {
    return this.length?this.reduce((a,b) => hasValue(a)?(hasValue(b)?(Math.min(a,b)):a):b):undefined
}

Array.prototype.max = function () {
    return this.length?this.reduce((a,b) => hasValue(a)?(hasValue(b)?(Math.max(a,b)):a):b):undefined
}

Array.prototype.sum = function () {
    return this.length?this.reduce((a,b) => a+b, 0):undefined
}

Array.prototype.attr = function(...attrs) {
    if (attrs.length > 1) {
        return this.map(e => attrs.reduce((o,a)=>({...o,[a]:e[a]}), {}))
    } else {
        return this.map(e => e[attrs[0]])
    }
}

Array.prototype.first = function() {
    return this[0]
}

Array.prototype.last = function() {
    return this[this.length-1]
}

Array.prototype.rest = function() {
    return this.filter((e,idx) => 0 < idx)
}

Array.prototype.inc = function(idx) {
    return this.modifyAtIdx(idx, i => i+1)
}

Array.prototype.modifyAtIdx = function(idx, modifier) {
    return this.map((e,i) => i==idx?modifier(e):e)
}

Array.prototype.removeAtIdx = function (idx) {
    return this.filter((e,i) => i!==idx)
}

Array.prototype.distinct = function () {
    const res = []
    const set = new Set()
    for (const elem of this) {
        if (!set.has(elem)) {
            set.add(elem)
            res.push(elem)
        }
    }
    return res
}

function removeAtIdx(arr,idx) {
    const res = arr[idx]
    arr.splice(idx,1)
    return res

}

function nextRandomElem({allElems,counts}) {
    const elemsWithCnt = allElems.map(elem => ({...elem, cnt:counts[elem.idx]}))
    const minCnt = elemsWithCnt.attr('cnt').min()
    const elemsWithMinCnt = elemsWithCnt.filter(elem => elem.cnt == minCnt)
    return elemsWithMinCnt[randomInt(0,elemsWithMinCnt.length-1)]
}

function createObj(obj) {
    const self = {
        ...obj,
        set: (attr, value) => {
            // console.log(`Setting in object: attr = ${attr}, value = ${value}`)
            return createObj({...obj, [attr]: value})
        },
        attr: (...attrs) => attrs.reduce((o,a)=>({...o,[a]:obj[a]}), {}),
        map: mapper => {
            const newObj = mapper(self)
            if (isObject(newObj)) {
                return createObj(newObj)
            } else {
                return newObj
            }
        }
    }
    return self
}

function objectHolder(obj) {
    return {
        get: (attr) => attr?obj[attr]:obj,
        set: (attr, value) => {
            // console.log(`Setting in holder: attr = ${attr}, value = ${value}`)
            obj = obj.set(attr, value)
        },
        setObj: (newObj) => {
            obj = newObj
        },
        attr: (...attrs) => obj.attr(...attrs),
        map: mapper => obj = obj.map(mapper),
    }
}

const NEXT_SOUND = "on-next.mp3"
const PREV_SOUND = "on-prev.mp3"
const GO_TO_START_SOUND = "on-go-to-start3.mp3"
const GO_TO_END_SOUND = "on-go-to-end-teleport.mp3"
const ENTER_SOUND = "on-enter2.mp3"
const BACKSPACE_SOUND = "on-backspace.mp3"
const ESCAPE_SOUND = "on-escape.mp3"
const ERROR_SOUND = "on-error.mp3"

function audioUrl(audioFileName) {
    return "./sounds/" + audioFileName
}

const AUDIO_FILES_CACHE = {}

function playAudio(audioFileName, callback) {
    let audioArr = AUDIO_FILES_CACHE[audioFileName]
    if (!audioArr) {
        audioArr = [new Audio(audioUrl(audioFileName))]
        AUDIO_FILES_CACHE[audioFileName] = audioArr
    }
    let audio = audioArr.find(a => a.paused)
    if (!audio) {
        audio = new Audio(audioUrl(audioFileName))
        audioArr.push(audio)
    }
    audio.onended = callback
    audio.play()
}

function saveToLocalStorage(localStorageKey, value) {
    window.localStorage.setItem(localStorageKey, JSON.stringify(value))
}

function readFromLocalStorage(localStorageKey, defaultValue) {
    const item = window.localStorage.getItem(localStorageKey)
    return hasValue(item) ? JSON.parse(item) : defaultValue
}

function createParamsGetter({prevState, params}) {
    return (name,defValue) => {
        const fromParams = params?.[name]
        if (fromParams !== undefined) {
            return fromParams
        }
        const fromPrevState = prevState?.[name]
        if (fromPrevState !== undefined) {
            return fromPrevState
        }
        return defValue
    }
}