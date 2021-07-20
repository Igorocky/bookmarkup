import express from 'express'
import {rpcMethods} from "./rpc"
import {appConfig, loadAppConfig} from "./config"
import argsParser from "args-parser"
import path from "path"

loadAppConfig(argsParser(process.argv).config).then(() => {
    const app = express()
    const port = 3000
    app.use(express.json({limit:'100MB'}))

    app.post('/rpc/:methodName', (req,res) => {
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

    app.get('/book/:bookId/page/:fileName', (req, res) => {
        const bookId = req.params.bookId
        const fileName = req.params.fileName
        res.sendFile(path.resolve(appConfig.markupsById[bookId].imgDir, fileName))
    })

    app.use(express.static('src/main/public'))

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

