import type { Queue } from '@domain/services/Queue'
import type { Server } from '@domain/services/Server'
import { Json } from '@domain/entities/response/Json'
import type { Post } from '@domain/entities/request/Post'

interface Params {
  automation: string
  path: string
  method: 'POST'
  server: Server
  queue: Queue
}

export class WebhookCalled {
  constructor(private params: Params) {}

  get path() {
    const { path } = this.params
    return `/api/automation/${path}`
  }

  init = async () => {
    const { server, method } = this.params
    if (method === 'POST') {
      await server.post(this.path, this.post)
    }
  }

  post = async (request: Post) => {
    const { automation, queue } = this.params
    const result = {
      path: request.path,
      baseUrl: request.baseUrl,
      body: request.body,
      headers: request.headers,
      query: request.query,
      params: request.params,
    }
    const jobId = await queue.add(automation, result)
    return new Json({ success: true, id: jobId })
  }
}
