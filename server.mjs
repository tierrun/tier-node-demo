import express from 'express'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'
const __dirname = dirname(fileURLToPath(import.meta.url))

const app = express()
const port = +process.env.PORT || 80
import cookieParser from 'cookie-parser'
import bodyParser from 'body-parser'

app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.urlencoded({ extended: false }))
app.use(express.json())
app.use(cookieParser())

import routes from './lib/routes.mjs'
app.use(routes)

app.use(express.static(resolve(__dirname, 'lib/static')))
app.set('view engine', 'ejs')
app.set('views', resolve(__dirname, 'lib/templates'))

app.get('/ping', (_, res) => res.end('pong'))

app.listen(port, '0.0.0.0', () => {
  console.log(`listening on http://localhost:${port}`)
})
