import { Integration, Bot } from '@botpress/client'

export type File = { path: string; content: string }

export type IntegrationDefinition = Pick<
  Integration,
  'name' | 'version' | 'configuration' | 'channels' | 'states' | 'events' | 'actions' | 'user'
>

export type BotDefinition = Pick<Bot, 'user' | 'conversation' | 'message' | 'states' | 'configuration' | 'events'>

export type ConfigurationDefinition = IntegrationDefinition['configuration']
export type ChannelDefinition = IntegrationDefinition['channels'][string]
export type MessageDefinition = ChannelDefinition['messages'][string]
export type ActionDefinition = IntegrationDefinition['actions'][string]
export type EventDefinition = IntegrationDefinition['events'][string] | BotDefinition['events'][string]
export type StateDefinition = IntegrationDefinition['states'][string] | BotDefinition['states'][string]
export type UserDefinition = IntegrationDefinition['user'] | BotDefinition['user']
