import type { ApiClient as AutoGeneratedClient } from '../../gen/client'
import type { ClientDefinition } from '../definition'

export * from './common'
export { CallAction } from './call-action'
export { CreateConversation } from './create-conversation'

export type ListConversations<_C extends ClientDefinition> = AutoGeneratedClient['listConversations']
export type GetOrCreateConversation<_C extends ClientDefinition> = AutoGeneratedClient['getOrCreateConversation']
export type UpdateConversation<_C extends ClientDefinition> = AutoGeneratedClient['updateConversation']

export type CreateEvent<_C extends ClientDefinition> = AutoGeneratedClient['createEvent']
export type ListEvents<_C extends ClientDefinition> = AutoGeneratedClient['listEvents']

export type CreateMessage<_C extends ClientDefinition> = AutoGeneratedClient['createMessage']
export type GetOrCreateMessage<_C extends ClientDefinition> = AutoGeneratedClient['getOrCreateMessage']
export type UpdateMessage<_C extends ClientDefinition> = AutoGeneratedClient['updateMessage']
export type ListMessages<_C extends ClientDefinition> = AutoGeneratedClient['listMessages']

export type CreateUser<_C extends ClientDefinition> = AutoGeneratedClient['createUser']
export type ListUsers<_C extends ClientDefinition> = AutoGeneratedClient['listUsers']
export type GetOrCreateUser<_C extends ClientDefinition> = AutoGeneratedClient['getOrCreateUser']
export type UpdateUser<_C extends ClientDefinition> = AutoGeneratedClient['updateUser']

export type GetState<_C extends ClientDefinition> = AutoGeneratedClient['getState']
export type SetState<_C extends ClientDefinition> = AutoGeneratedClient['setState']
export type PatchState<_C extends ClientDefinition> = AutoGeneratedClient['patchState']
