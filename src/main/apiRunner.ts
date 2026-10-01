export interface ApiRequest {
  url: string
  method: string
  headers?: Record<string, string>
  body?: string
}

export interface ApiResponse {
  status: number
  statusText: string
  timeMs: number
  headers: Record<string, string>
  data: any
}

export class ApiRunnerService {
  async execute(req: ApiRequest): Promise<ApiResponse> {
    const startTime = performance.now()
    try {
      const options: RequestInit = {
        method: req.method || 'GET',
        headers: req.headers || {}
      }

      if (req.body && req.method !== 'GET' && req.method !== 'HEAD') {
        options.body = req.body
      }

      const response = await fetch(req.url, options)
      const endTime = performance.now()

      const resHeaders: Record<string, string> = {}
      response.headers.forEach((value, key) => {
        resHeaders[key] = value
      })

      let data: any
      const contentType = response.headers.get('content-type') || ''
      if (contentType.includes('application/json')) {
        data = await response.json().catch(() => response.text())
      } else {
        data = await response.text()
      }

      return {
        status: response.status,
        statusText: response.statusText,
        timeMs: Math.round(endTime - startTime),
        headers: resHeaders,
        data
      }
    } catch (err: any) {
      const endTime = performance.now()
      return {
        status: 0,
        statusText: err.message || 'Request Failed',
        timeMs: Math.round(endTime - startTime),
        headers: {},
        data: { error: err.message }
      }
    }
  }
}
