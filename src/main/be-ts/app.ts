import express from 'express'

const app = express()
const port = 3000
app.use(express.static('src/main/public'))
app.get('/', (req, res) => {
    res.send('The sedulous hyena ate the antelope!');
})
app
    .listen(port, () => {
        return console.log(`server is listening on ${port}`);
    })
    .on('error', err => {
        if (err) {
            return console.error(err);
        }
    })