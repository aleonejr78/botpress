import { SchemaDefinition } from '../schema'
import { AnyZodObject } from '../type-utils'

type BaseStates = Record<string, AnyZodObject>
type BaseEvents = Record<string, AnyZodObject>

type TagDefinition = {
  title?: string
  description?: string
}

type StateDefinition<TState extends BaseStates[string]> = SchemaDefinition<TState> & {
  type: 'conversation' | 'user' | 'bot'
  expiry?: number
}

type RecurringEventDefinition = {
  type: string
  payload: Record<string, any>
  schedule: { cron: string }
}

type EventDefinition<TEvent extends BaseEvents[string]> = SchemaDefinition<TEvent>

type ConfigurationDefinition = SchemaDefinition

type UserDefinition = {
  tags?: Record<string, TagDefinition>
}

type ConversationDefinition = {
  tags?: Record<string, TagDefinition>
}

type MessageDefinition = {
  tags?: Record<string, TagDefinition>
}

export type BotDefinitionProps<TStates extends BaseStates = BaseStates, TEvents extends BaseEvents = BaseEvents> = {
  user?: UserDefinition
  conversation?: ConversationDefinition
  message?: MessageDefinition
  states?: { [K in keyof TStates]: StateDefinition<TStates[K]> }
  configuration?: ConfigurationDefinition
  events?: { [K in keyof TEvents]: EventDefinition<TEvents[K]> }
  recurringEvents?: Record<string, RecurringEventDefinition>
}

export class BotDefinition<TStates extends BaseStates = BaseStates, TEvents extends BaseEvents = BaseEvents> {
  public readonly user: BotDefinitionProps['user']
  public readonly conversation: BotDefinitionProps['conversation']
  public readonly message: BotDefinitionProps['message']
  public readonly states: BotDefinitionProps['states']
  public readonly configuration: BotDefinitionProps['configuration']
  public readonly events: BotDefinitionProps['events']
  public readonly recurringEvents: BotDefinitionProps['recurringEvents']
  public constructor(props: BotDefinitionProps<TStates, TEvents>) {
    const { user, conversation, message, states, configuration, events, recurringEvents } = props
    this.user = user
    this.conversation = conversation
    this.message = message
    this.states = states
    this.configuration = configuration
    this.events = events
    this.recurringEvents = recurringEvents
  }
}
