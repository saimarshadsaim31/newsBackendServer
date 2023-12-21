import * as dotenv from 'dotenv'
dotenv.config()
import express from 'express'
const app = express()
import morgan from 'morgan'
import cookieParser from 'cookie-parser'
import helmet from 'helmet'

// routers
import newsRouter from './routes/newsRoute.js'

// middleware
import errorHandlerMiddleware from './middleware/errorHandlerMiddleware.js'
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'))
}
app.use(cookieParser())
app.use(express.json())
app.use(helmet())

app.get('/', (req, res) => {
  res.send('Hello World')
})

app.use('/api/v1/news', newsRouter)

app.use('*', (req, res) => {
  res.status(404).json({ msg: 'not found' })
})

app.use(errorHandlerMiddleware)

const port = process.env.PORT || 5000

try {
  app.listen(port, () => {
    console.log(`server running on PORT ${port}...`)
  })
} catch (error) {
  console.log(error)
  process.exit(1)
}
