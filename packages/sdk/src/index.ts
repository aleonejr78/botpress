export * as messages from './message'
export * from './const'
export * from './serve'

export {
  IntegrationDefinition,
  IntegrationDefinitionProps,
  IntegrationImplementation as Integration,
  IntegrationImplementationProps as IntegrationProps,
  IntegrationContext,
  IntegrationSpecificClient,
} from './integration'

export {
  BotDefinition,
  BotDefinitionProps,
  BotImplementation as Bot,
  BotImplementationProps as BotProps,
  BotContext,
  BotSpecificClient,
} from './bot'

/**
 * @deprecated Infer type of integration message handlers instead
 */
export type AckFunction = (props: { tags: Record<string, string> }) => Promise<void>
