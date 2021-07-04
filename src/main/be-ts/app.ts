import express from 'express'
import {rpcMethods} from "./rpc"

const app = express()
const port = 3000
app.use(express.static('src/main/public'))
app.use(express.json())
app.get('/', (req, res) => {
    res.send('The sedulous hyena ate the antelope!');
})
app.post('/rpc/:methodName', async (req,res) => {
    let resp = await rpcMethods[req.params.methodName](req.body)
    res.send(resp)
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