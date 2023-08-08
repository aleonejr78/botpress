import type * as bpclient from '@botpress/client'
import type * as bpsdk from '@botpress/sdk'
import pathlib from 'path'
import * as utils from '../utils'
import { BotImplementationIndexModule } from './bot-implementation'
import { GENERATED_HEADER, INDEX_FILE } from './const'
import { IntegrationImplementationIndexModule } from './integration-implementation'
import { IntegrationInstanceIndexModule } from './integration-instance'
import { IntegrationSecretIndexModule } from './integration-secret'
import type * as types from './typings'

export { File } from './typings'
export { secretEnvVariableName } from './integration-secret'
export const INTEGRATION_JSON = 'integration.json'

export const generateIntegrationImplementationTypings = async (
  integration: bpsdk.IntegrationDefinition,
  implementationTypingsPath: string
): Promise<types.File[]> => {
  const indexModule = await IntegrationImplementationIndexModule.create(integration)
  indexModule.unshift(implementationTypingsPath)
  return indexModule.flatten()
}

export const generateIntegrationSecrets = async (
  integration: bpsdk.IntegrationDefinition,
  secretsPath: string
): Promise<types.File[]> => {
  const indexModule = await IntegrationSecretIndexModule.create(integration)
  indexModule.unshift(secretsPath)
  return indexModule.flatten()
}

export const generateIntegrationIndex = async (
  implementationTypingsPath: string,
  implementationSecretsPath: string
): Promise<types.File> => {
  let content = ''
  content += `export * from './${implementationTypingsPath}'\n`
  content += `export * from './${implementationSecretsPath}'\n`
  return {
    path: INDEX_FILE,
    content,
  }
}

export type IntegrationInstanceJson = {
  name: string
  version: string
  id: string
}

export const generateIntegrationInstance = async (
  integration: bpclient.Integration,
  installPath: string
): Promise<types.File[]> => {
  const indexModule = await IntegrationInstanceIndexModule.create(integration)
  const dirname = utils.casing.to.kebabCase(integration.name)
  indexModule.unshift(installPath, dirname)
  const files = indexModule.flatten()

  const { name, version, id } = integration
  const json: IntegrationInstanceJson = {
    name,
    version,
    id,
  }
  files.push({
    path: pathlib.join(installPath, dirname, INTEGRATION_JSON),
    content: JSON.stringify(json, null, 2),
  })

  return files
}

export const generateBotImplementationTypings = async (
  bot: bpsdk.BotDefinition,
  implementationTypingsPath: string
): Promise<types.File[]> => {
  const indexModule = await BotImplementationIndexModule.create(bot)
  indexModule.unshift(implementationTypingsPath)
  return indexModule.flatten()
}

export const generateBotIndex = async (
  implementationTypingsPath: string,
  installPath: string,
  instances: string[]
): Promise<types.File> => {
  // TODO: only import from implementation if it was generated

  const lines: string[] = [
    GENERATED_HEADER,
    "import * as sdk from '@botpress/sdk'",
    `import * as implementation from './${implementationTypingsPath}'`,
    ...instances.map(
      (instance) => `import * as ${utils.casing.to.camelCase(instance)} from './${installPath}/${instance}'`
    ),
    ...instances.map(
      (instance) => `export * as ${utils.casing.to.camelCase(instance)} from './${installPath}/${instance}'`
    ),
    '',
    'type TBot = {',
    '  integrations: {',
    ...instances.map(
      (instance) =>
        `    ${utils.casing.to.camelCase(instance)}: ${utils.casing.to.camelCase(
          instance
        )}.T${utils.casing.to.pascalCase(instance)}`
    ),
    '  }',
    '  states: implementation.states.States',
    '  events: implementation.events.Events',
    '}',
    '',
    'export class Bot extends sdk.Bot<TBot> {}',
  ]

  return {
    path: INDEX_FILE,
    content: lines.join('\n'),
  }
}
