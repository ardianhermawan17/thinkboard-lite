import { requestContext } from "../../../../../../server/db/client"
import { errorMessage } from "../../../../../../server/db/errors"
import { errorResponse } from "../../../../../../server/http"
import { subscribeRun } from "../../../../../../server/pipeline/service"

/** GET /api/v1/runs/:id/stream (blueprint command `run-stream`) — SSE; the service owns the events. */
export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { db } = await requestContext(request)
    const { id } = await context.params
    const encoder = new TextEncoder()
    const stream = new ReadableStream<Uint8Array>({
      async start(controller) {
        try {
          for await (const event of subscribeRun(db, id, request.signal)) {
            controller.enqueue(encoder.encode(`event: ${event.type}\ndata: ${JSON.stringify(event.data)}\n\n`))
          }
          controller.close()
        } catch (error) {
          // headers are already sent: an error after this point is an SSE event, not an HTTP status.
          controller.enqueue(encoder.encode(`event: error\ndata: ${JSON.stringify({ message: errorMessage(error) })}\n\n`))
          controller.close()
        }
      },
    })
    // spec §4.3: no compression on this route — identity + no-transform keep the stream unbuffered.
    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache, no-transform",
        "Content-Encoding": "identity",
        Connection: "keep-alive",
      },
    })
  } catch (error) {
    return errorResponse(error)
  }
}
