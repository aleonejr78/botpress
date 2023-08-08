import { Client } from '@botpress/client'
import { Merge, Cast } from '../../type-utils'
import { BaseIntegration } from '../generic'
import { GetChannelByName } from './types'

type Arg<F extends (...args: any[]) => any> = Parameters<F>[number]
type Res<F extends (...args: any[]) => any> = ReturnType<F>
type AsTags<T extends Record<string, string | undefined>> = Cast<T, Record<string, string>>

export type CreateConversation<TIntegration extends BaseIntegration> = <
  ChannelName extends keyof TIntegration['channels']
>(x: {
  channel: Cast<ChannelName, string>
  tags: AsTags<Partial<Record<keyof GetChannelByName<TIntegration, ChannelName>['conversation']['tags'], string>>>
}) => Res<Client['createConversation']>

export type GetConversation<_TIntegration extends BaseIntegration> = Client['getConversation']

export type ListConversations<TIntegration extends BaseIntegration> = (
  x: Merge<
    Arg<Client['listConversations']>,
    {
      tags?: AsTags<Partial<Record<keyof TIntegration['channels'][string]['conversation']['tags'], string>>>
    }
  >
) => Res<Client['listConversations']>

export type GetOrCreateConversation<TIntegration extends BaseIntegration> = <
  ChannelName extends keyof TIntegration['channels']
>(x: {
  channel: Cast<ChannelName, string>
  tags: AsTags<Partial<Record<keyof GetChannelByName<TIntegration, ChannelName>['conversation']['tags'], string>>>
}) => Res<Client['getOrCreateConversation']>

export type UpdateConversation<TIntegration extends BaseIntegration> = (
  x: Merge<
    Arg<Client['updateConversation']>,
    {
      tags: AsTags<Partial<Record<keyof TIntegration['channels'][string]['conversation']['tags'], string>>>
    }
  >
) => Res<Client['updateConversation']>

export type DeleteConversation<_TIntegration extends BaseIntegration> = Client['deleteConversation']

export type CreateEvent<TIntegration extends BaseIntegration> = <TEvent extends keyof TIntegration['events']>(
  x: Merge<
    Arg<Client['createEvent']>,
    {
      type: Cast<TEvent, string>
      payload: TIntegration['events'][TEvent]['payload']
    }
  >
) => Res<Client['createEvent']>

export type GetEvent<_TIntegration extends BaseIntegration> = Client['getEvent']

export type ListEvents<TIntegration extends BaseIntegration> = (
  x: Merge<
    Arg<Client['listEvents']>,
    {
      type: Cast<keyof TIntegration['events'], string>
    }
  >
) => Res<Client['listEvents']>

export type CreateMessage<TIntegration extends BaseIntegration> = <
  TChannel extends keyof TIntegration['channels'],
  TMessage extends keyof TIntegration['channels'][TChannel]['messages']
>(
  x: Merge<
    Arg<Client['createMessage']>,
    {
      type: Cast<TMessage, string> // TODO: conversation should be used to infer the channel of the message
      payload: TIntegration['channels'][TChannel]['messages'][TMessage]
      tags: AsTags<Partial<Record<keyof TIntegration['channels'][TChannel]['message']['tags'], string>>>
    }
  >
) => Res<Client['createMessage']>

export type GetOrCreateMessage<TIntegration extends BaseIntegration> = <
  TMessage extends keyof TIntegration['channels'][string]['messages']
>(
  x: Merge<
    Arg<Client['getOrCreateMessage']>,
    {
      type: Cast<TMessage, string> // TODO: conversation should be used to infer the channel of the message
      payload: TIntegration['channels'][string]['messages'][TMessage]
      tags: AsTags<Partial<Record<keyof TIntegration['channels'][string]['message']['tags'], string>>>
    }
  >
) => Res<Client['getOrCreateMessage']>

export type GetMessage<_TIntegration extends BaseIntegration> = Client['getMessage']

export type UpdateMessage<TIntegration extends BaseIntegration> = (
  x: Merge<
    Arg<Client['updateMessage']>,
    {
      tags: AsTags<Partial<Record<keyof TIntegration['channels'][string]['message']['tags'], string>>>
    }
  >
) => Res<Client['updateMessage']>

export type ListMessages<TIntegration extends BaseIntegration> = (
  x: Merge<
    Arg<Client['listMessages']>,
    {
      tags: AsTags<Partial<Record<keyof TIntegration['channels'][string]['message']['tags'], string>>>
    }
  >
) => Res<Client['listMessages']>

export type DeleteMessage<_TIntegration extends BaseIntegration> = Client['deleteMessage']

export type CreateUser<TIntegration extends BaseIntegration> = (x: {
  tags: AsTags<Partial<Record<keyof TIntegration['user']['tags'], string>>>
}) => Res<Client['createUser']>

export type GetUser<_TIntegration extends BaseIntegration> = Client['getUser']

export type ListUsers<TIntegration extends BaseIntegration> = (
  x: Merge<
    Arg<Client['listUsers']>,
    {
      tags: AsTags<Partial<Record<keyof TIntegration['user']['tags'], string>>>
    }
  >
) => Res<Client['listUsers']>

export type GetOrCreateUser<TIntegration extends BaseIntegration> = (x: {
  tags: AsTags<Partial<Record<keyof TIntegration['user']['tags'], string>>>
}) => Res<Client['getOrCreateUser']>

export type UpdateUser<TIntegration extends BaseIntegration> = (
  x: Merge<
    Arg<Client['updateUser']>,
    {
      tags: AsTags<Partial<Record<keyof TIntegration['user']['tags'], string>>>
    }
  >
) => Res<Client['updateUser']>

export type DeleteUser<_TIntegration extends BaseIntegration> = Client['deleteUser']

export type GetState<TIntegration extends BaseIntegration> = <TState extends keyof TIntegration['states']>(
  x: Merge<
    Arg<Client['getState']>,
    {
      name: Cast<TState, string> // TODO: use state name to infer state type
    }
  >
) => Promise<{
  state: Merge<
    Awaited<Res<Client['getState']>>['state'],
    {
      payload: TIntegration['states'][TState]
    }
  >
}>

export type SetState<TIntegration extends BaseIntegration> = <TState extends keyof TIntegration['states']>(
  x: Merge<
    Arg<Client['setState']>,
    {
      name: Cast<TState, string> // TODO: use state name to infer state type
      payload: TIntegration['states'][TState]
    }
  >
) => Promise<{
  state: Merge<
    Awaited<Res<Client['setState']>>['state'],
    {
      payload: TIntegration['states'][TState]
    }
  >
}>

export type PatchState<TIntegration extends BaseIntegration> = <TState extends keyof TIntegration['states']>(
  x: Merge<
    Arg<Client['patchState']>,
    {
      name: Cast<TState, string> // TODO: use state name to infer state type
      payload: Partial<TIntegration['states'][TState]>
    }
  >
) => Promise<{
  state: Merge<
    Awaited<Res<Client['patchState']>>['state'],
    {
      payload: TIntegration['states'][TState]
    }
  >
}>

export type ConfigureIntegration<_TIntegration extends BaseIntegration> = Client['configureIntegration']
