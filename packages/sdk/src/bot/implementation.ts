import type { Server } from 'node:http'
import { serve } from '../serve'
import { Cast } from '../type-utils'
import { BaseBot } from './generic'
import { botHandler, MessageHandler, EventHandler, StateExpiredHandler } from './server'

type IntegrationInstance<TName extends string> = {
  id: string
  enabled?: boolean
  configuration?: Record<string, any>

  name: TName
  version: string
}

export type BotImplementationProps<TBot extends BaseBot = BaseBot> = {
  integrations?: {
    [K in keyof TBot['integrations']]?: IntegrationInstance<Cast<K, string>>
  }
}

export type BotState<TBot extends BaseBot> = {
  messageHandlers: MessageHandler<TBot>[]
  eventHandlers: EventHandler<TBot>[]
  stateExpiredHandlers: StateExpiredHandler<TBot>[]
}

export class BotImplementation<TBot extends BaseBot = BaseBot> {
  private _state: BotState<TBot> = {
    messageHandlers: [],
    eventHandlers: [],
    stateExpiredHandlers: [],
  }

  public readonly props: BotImplementationProps<TBot>

  public constructor(props: BotImplementationProps<TBot>) {
    this.props = props
  }

  public readonly message = (handler: MessageHandler<TBot>): void => {
    this._state.messageHandlers.push(handler)
  }
  public readonly event = (handler: EventHandler<TBot>): void => {
    this._state.eventHandlers.push(handler)
  }
  public readonly stateExpired = (handler: StateExpiredHandler<TBot>): void => {
    this._state.stateExpiredHandlers.push(handler)
  }

  public readonly handler = botHandler(this._state)
  public readonly start = (port?: number): Promise<Server> => serve(this.handler, port)
}
