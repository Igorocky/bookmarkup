import express from 'express'
import {rpcMethods} from "./rpc"
import {appConfig, loadAppConfig} from "./config"
import argsParser from "args-parser"
import path from "path"

loadAppConfig(argsParser(process.argv).config).then(() => {
    const app = express()
    const port = 3000
    app.use(express.json())

    app.post('/rpc/:methodName', (req,res) => {
        console.log({
            methodName: req.params.methodName,
            body: req.body
        })
        const methodName = req.params.methodName
        const dataOrPromise = rpcMethods[methodName](req.body)
        if (typeof dataOrPromise.then === 'function') {
            dataOrPromise
                .then(resp => res.send(resp))
                .catch(err => console.log(`Error during execution of an RPC method '${methodName}' with args ${JSON.stringify(req.body)}: ${err}`))
        } else {
            res.send(dataOrPromise)
        }

    })

    app.use(express.static('src/main/public'))

    app.get('/book/:bookId/page/:pageNum', (req, res) => {
        const bookId = req.params.bookId
        const pageNum = req.params.pageNum
        appConfig.markups.find(m=>m.id===bookId)?.
        res.sendFile(path.resolve(`${__dirname}/../src/main/public/bookmarkup-index.html`))
    })

    app.get(/^\/(.*)/, (req, res) => {
        res.sendFile(path.resolve(`${__dirname}/../src/main/public/bookmarkup-index.html`))
    })

    app
        .listen(port, () => {
            return console.log(`server is listening on ${port}`)
        })
        .on('error', err => {
            if (err) {
                return console.error(err)
            }
        })
}).catch(err => console.log("Error during loading application config: " + err))
