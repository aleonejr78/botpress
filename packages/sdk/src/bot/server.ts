import * as bpclient from '@botpress/client'
import { log } from '../log'
import { Request, Response, parseBody } from '../serve'
import { BotSpecificClient } from './client'
import { BotContext, extractContext } from './context'
import { BaseBot } from './generic'

type CommonArgs<TBot extends BaseBot> = {
  ctx: BotContext
  client: BotSpecificClient<TBot>
}

type MessagePayload = {
  user: bpclient.User
  conversation: bpclient.Conversation
  message: bpclient.Message
  event: bpclient.Event
}
type MessageArgs<TBot extends BaseBot> = CommonArgs<TBot> & MessagePayload

type EventPayload = { event: bpclient.Event }
type EventArgs<TBot extends BaseBot> = CommonArgs<TBot> & EventPayload

type StateExpiredPayload = { state: bpclient.State }
type StateExpiredArgs<TBot extends BaseBot> = CommonArgs<TBot> & StateExpiredPayload

export type MessageHandler<TBot extends BaseBot> = (args: MessageArgs<TBot>) => Promise<void>

export type EventHandler<TBot extends BaseBot> = (args: EventArgs<TBot>) => Promise<void>

export type StateExpiredHandler<TBot extends BaseBot> = (args: StateExpiredArgs<TBot>) => Promise<void>

export type BotHandlers<TBot extends BaseBot> = {
  messageHandlers: MessageHandler<TBot>[]
  eventHandlers: EventHandler<TBot>[]
  stateExpiredHandlers: StateExpiredHandler<TBot>[]
}

type ServerProps<TBot extends BaseBot> = CommonArgs<TBot> & {
  req: Request
  instance: BotHandlers<TBot>
}

export const botHandler =
  <TBot extends BaseBot>(instance: BotHandlers<TBot>) =>
  async (req: Request): Promise<Response | void> => {
    const ctx = extractContext(req.headers)

    if (ctx.operation !== 'ping') {
      log.info(`Received ${ctx.operation} operation for bot ${ctx.botId} of type ${ctx.type}`)
    }

    const client = new BotSpecificClient(new bpclient.Client({ botId: ctx.botId }))

    const props = {
      req,
      ctx,
      client,
      instance,
    }

    switch (ctx.operation) {
      case 'event_received':
        await onEventReceived<TBot>(props)
        break
      case 'register':
        await onRegister<TBot>(props)
        break
      case 'unregister':
        await onUnregister<TBot>(props)
        break
      case 'ping':
        await onPing<TBot>(props)
        break
      default:
        throw new Error(`Unknown operation ${ctx.operation}`)
    }

    return { status: 200 }
  }

const onPing = async <TBot extends BaseBot>(_: ServerProps<TBot>) => {}
const onRegister = async <TBot extends BaseBot>(_: ServerProps<TBot>) => {}
const onUnregister = async <TBot extends BaseBot>(_: ServerProps<TBot>) => {}
const onEventReceived = async <TBot extends BaseBot>({ ctx, req, client, instance }: ServerProps<TBot>) => {
  log.debug(`Received event ${ctx.type}`)

  const body = parseBody<EventPayload>(req)

  switch (ctx.type) {
    case 'message_created':
      const messagePayload: MessagePayload = {
        user: body.event.payload.user,
        conversation: body.event.payload.conversation,
        message: body.event.payload.message,
        event: body.event,
      }

      await Promise.all(
        instance.messageHandlers.map((handler) =>
          handler({
            client,
            ctx,
            ...messagePayload,
          })
        )
      )
      break
    case 'state_expired':
      const statePayload: StateExpiredPayload = { state: body.event.payload.state }
      await Promise.all(
        instance.stateExpiredHandlers.map((handler) =>
          handler({
            client,
            ctx,
            ...statePayload,
          })
        )
      )
      break
    default:
      const eventPayload: EventPayload = { event: body.event }
      await Promise.all(
        instance.eventHandlers.map((handler) =>
          handler({
            client,
            ctx,
            ...eventPayload,
          })
        )
      )
  }
}
