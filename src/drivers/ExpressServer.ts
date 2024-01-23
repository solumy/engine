import express, { type Express } from 'express'
import cors from 'cors'
import helmet from 'helmet'
import cookieParser from 'cookie-parser'
import http, { Server as HttpServer } from 'http'
import type { IServer, IServerInstance } from '@domain/drivers/IServer'
import type { ILogger, ILoggerLog } from '@domain/drivers/ILogger'

export class ExpressServer implements IServer {
  constructor(private logger: ILogger) {}

  create(port = 9000) {
    const log = this.logger.init('server:express:' + port)
    return new ExpressServerInstance(log, port)
  }
}

class ExpressServerInstance implements IServerInstance {
  private express: Express
  private server?: HttpServer

  constructor(
    private log: ILoggerLog,
    private port: number
  ) {
    this.express = express()
    this.express.use(cors())
    this.express.use(helmet())
    this.express.use(cookieParser())
    this.express.use(express.json())
    this.express.use(express.urlencoded({ extended: true }))
    this.express.use((req, res) => {
      this.log(`${req.method} ${req.originalUrl}`)
      res.send('Hello World!')
    })
  }

  async start() {
    await new Promise((resolve, reject) => {
      this.server = http.createServer(this.express)
      this.server.listen(this.port, () => resolve(null))
      this.server.on('error', reject)
    })
    const url = `http://localhost:${this.port}`
    this.log(`Server started at ${url}`)
    return url
  }

  async stop() {
    await new Promise((resolve) => {
      if (!this.server) return resolve(null)
      this.server.close(async () => resolve(null))
    })
    this.log(`Server stopped`)
  }
}
