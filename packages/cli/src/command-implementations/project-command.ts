import type * as bpclient from '@botpress/client'
import type * as bpsdk from '@botpress/sdk'
import type { YargsConfig } from '@bpinternal/yargs-extra'
import bluebird from 'bluebird'
import chalk from 'chalk'
import fs from 'fs'
import _ from 'lodash'
import pathlib from 'path'
import * as codegen from '../code-generation'
import type * as config from '../config'
import * as consts from '../consts'
import * as errors from '../errors'
import type { CommandArgv, CommandDefinition } from '../typings'
import * as utils from '../utils'
import { GlobalCommand } from './global-command'

export type IntegrationInstallDir = codegen.IntegrationInstanceJson & {
  dirname: string
}

export type ProjectCommandDefinition = CommandDefinition<typeof config.schemas.project>
export type ProjectCache = { botId: string; devId: string }

type ConfigurableProjectPaths = { entryPoint: string; outDir: string; workDir: string }
type ConstantProjectPaths = typeof consts.fromOutDir & typeof consts.fromWorkDir
type AllProjectPaths = ConfigurableProjectPaths & ConstantProjectPaths

class ProjectPaths extends utils.path.PathStore<keyof AllProjectPaths> {
  public constructor(argv: CommandArgv<ProjectCommandDefinition>) {
    const absWorkDir = utils.path.absoluteFrom(utils.path.cwd(), argv.workDir)
    const absEntrypoint = utils.path.absoluteFrom(absWorkDir, argv.entryPoint)
    const absOutDir = utils.path.absoluteFrom(absWorkDir, argv.outDir)
    super({
      workDir: absWorkDir,
      entryPoint: absEntrypoint,
      outDir: absOutDir,
      ..._.mapValues(consts.fromOutDir, (p) => utils.path.absoluteFrom(absOutDir, p)),
      ..._.mapValues(consts.fromWorkDir, (p) => utils.path.absoluteFrom(absWorkDir, p)),
    })
  }
}

type ProjectDefinition =
  | {
      type: 'bot'
      definition: bpsdk.BotDefinition
    }
  | {
      type: 'integration'
      definition: bpsdk.IntegrationDefinition
    }

export abstract class ProjectCommand<C extends ProjectCommandDefinition> extends GlobalCommand<C> {
  protected get projectPaths() {
    return new ProjectPaths(this.argv)
  }

  protected get projectCache() {
    return new utils.cache.FSKeyValueCache<ProjectCache>(this.projectPaths.abs.projectCacheFile)
  }

  protected parseBot(botDef: bpsdk.BotDefinition, bot: bpsdk.Bot) {
    return {
      ...botDef,
      integrations: _(bot.props.integrations)
        .values()
        .filter(<T>(x: T | undefined): x is T => !!x)
        .keyBy((i) => i.id)
        .mapValues(({ enabled, configuration }) => ({ enabled, configuration }))
        .value(),
      configuration: botDef.configuration
        ? {
            ...botDef.configuration,
            schema: utils.schema.mapZodToJsonSchema(botDef.configuration),
          }
        : undefined,
      events: botDef.events
        ? _.mapValues(botDef.events, (event) => ({
            ...event,
            schema: utils.schema.mapZodToJsonSchema(event),
          }))
        : undefined,
      states: botDef.states
        ? _.mapValues(botDef.states, (state) => ({
            ...state,
            schema: utils.schema.mapZodToJsonSchema(state),
          }))
        : undefined,
    }
  }

  protected parseIntegrationDefinition(integration: bpsdk.IntegrationDefinition) {
    return {
      ...integration,
      configuration: integration.configuration
        ? {
            ...integration.configuration,
            schema: utils.schema.mapZodToJsonSchema(integration.configuration),
          }
        : undefined,
      events: integration.events
        ? _.mapValues(integration.events, (event) => ({
            ...event,
            schema: utils.schema.mapZodToJsonSchema(event),
          }))
        : undefined,
      actions: integration.actions
        ? _.mapValues(integration.actions, (action) => ({
            ...action,
            input: {
              ...action.input,
              schema: utils.schema.mapZodToJsonSchema(action.input),
            },
            output: {
              ...action.output,
              schema: utils.schema.mapZodToJsonSchema(action.output),
            },
          }))
        : undefined,
      channels: integration.channels
        ? _.mapValues(integration.channels, (channel) => ({
            ...channel,
            messages: _.mapValues(channel.messages, (message) => ({
              ...message,
              schema: utils.schema.mapZodToJsonSchema(message),
            })),
          }))
        : undefined,
      states: integration.states
        ? _.mapValues(integration.states, (state) => ({
            ...state,
            schema: utils.schema.mapZodToJsonSchema(state),
          }))
        : undefined,
    }
  }

  protected async readDefinitionFromFS(): Promise<ProjectDefinition> {
    const abs = this.projectPaths.abs
    const rel = this.projectPaths.rel('workDir')

    if (fs.existsSync(abs.integrationDefinition)) {
      const { outputFiles } = await utils.esbuild.buildEntrypoint({
        cwd: abs.workDir,
        outfile: '',
        entrypoint: rel.integrationDefinition,
        write: false,
      })

      const artifact = outputFiles[0]
      if (!artifact) {
        throw new errors.BotpressCLIError('Could not read integration definition')
      }

      const { default: definition } = utils.require.requireJsCode<{ default: bpsdk.IntegrationDefinition }>(
        artifact.text
      )

      return { type: 'integration', definition }
    }

    // TODO: remove dupplication with integration definition above
    if (fs.existsSync(abs.botDefinition)) {
      const { outputFiles } = await utils.esbuild.buildEntrypoint({
        cwd: abs.workDir,
        outfile: '',
        entrypoint: rel.botDefinition,
        write: false,
      })

      const artifact = outputFiles[0]
      if (!artifact) {
        throw new errors.BotpressCLIError('Could not read bot definition')
      }

      const { default: definition } = utils.require.requireJsCode<{ default: bpsdk.BotDefinition }>(artifact.text)

      return { type: 'bot', definition }
    }

    throw new errors.BotpressCLIError('Could not find bot or integration definition')
  }

  protected async writeGeneratedFilesToOutFolder(files: codegen.File[]) {
    for (const file of files) {
      const filePath = utils.path.absoluteFrom(this.projectPaths.abs.outDir, file.path)
      const dirPath = pathlib.dirname(filePath)
      await fs.promises.mkdir(dirPath, { recursive: true })
      await fs.promises.writeFile(filePath, file.content)
    }
  }

  protected displayWebhookUrls(bot: bpclient.Bot) {
    if (!_.keys(bot.integrations).length) {
      this.logger.debug('No integrations in bot')
      return
    }

    this.logger.log('Integrations:')
    for (const integration of Object.values(bot.integrations)) {
      if (!integration.enabled) {
        this.logger.log(`${chalk.grey(integration.name)} ${chalk.italic('(disabled)')}: ${integration.webhookUrl}`, {
          prefix: { symbol: '○', indent: 2 },
        })
      } else {
        this.logger.log(`${chalk.bold(integration.name)} : ${integration.webhookUrl}`, {
          prefix: { symbol: '●', indent: 2 },
        })
      }
    }
  }

  protected async promptSecrets(
    integrationDef: bpsdk.IntegrationDefinition,
    argv: YargsConfig<typeof config.schemas.secrets>
  ): Promise<Record<string, string>> {
    const { secrets: secretDefinitions } = integrationDef
    if (!secretDefinitions) {
      return {}
    }

    const secretArgv = this._parseArgvSecrets(argv.secrets)
    const invalidSecret = Object.keys(secretArgv).find((s) => !secretDefinitions.includes(s))
    if (invalidSecret) {
      throw new errors.BotpressCLIError(`Secret ${invalidSecret} is not defined in integration definition`)
    }

    const values: Record<string, string> = {}
    for (const secretDef of secretDefinitions) {
      const argvSecret = secretArgv[secretDef]
      if (argvSecret) {
        this.logger.debug(`Using secret "${secretDef}" from argv`)
        values[secretDef] = argvSecret
        continue
      }

      const prompted = await this.prompt.text(`Enter value for secret "${secretDef}"`)
      if (!prompted) {
        throw new errors.BotpressCLIError('Secret is required')
      }
      values[secretDef] = prompted
    }

    const envVariables = _.mapKeys(values, (_v, k) => codegen.secretEnvVariableName(k))
    return envVariables
  }

  protected async generateBotIndex() {
    const allInstances = await this.listIntegrationInstances()
    const indexFile = await codegen.generateBotIndex(
      this.projectPaths.rel('outDir').implementationDir,
      this.projectPaths.rel('outDir').installDir,
      allInstances.map((i) => i.dirname)
    )
    await this.writeGeneratedFilesToOutFolder([indexFile])
  }

  protected async listIntegrationInstances(): Promise<IntegrationInstallDir[]> {
    const installPath = this.projectPaths.abs.installDir
    if (!fs.existsSync(installPath)) {
      this.logger.debug('Install path does not exist. Skipping listing of integration instances')
      return []
    }

    const allFiles = await fs.promises.readdir(installPath)
    const allPaths = allFiles.map((name) => pathlib.join(installPath, name))
    const directories = await bluebird.filter(allPaths, async (path) => {
      const stat = await fs.promises.stat(path)
      return stat.isDirectory()
    })

    let jsons = directories.map((root) => ({ root, json: pathlib.join(root, codegen.INTEGRATION_JSON) }))
    jsons = jsons.filter(({ json: x }) => fs.existsSync(x))

    return bluebird.map(jsons, async ({ root, json }) => {
      const content: string = await fs.promises.readFile(json, 'utf-8')
      const { name, version, id } = JSON.parse(content) as codegen.IntegrationInstanceJson
      const dirname = pathlib.basename(root)
      return {
        dirname,
        id,
        name,
        version,
      }
    })
  }

  private _parseArgvSecrets(argvSecrets: string[]): Record<string, string> {
    const parsed: Record<string, string> = {}
    for (const secret of argvSecrets) {
      const [key, value] = this._splitOnce(secret, '=')
      if (!value) {
        throw new errors.BotpressCLIError(
          `Secret "${key}" is missing a value. Expected format: "SECRET_NAME=secretValue"`
        )
      }
      parsed[key!] = value
    }

    return parsed
  }

  private _splitOnce = (text: string, separator: string): [string, string | undefined] => {
    const index = text.indexOf(separator)
    if (index === -1) {
      return [text, undefined]
    }
    return [text.slice(0, index), text.slice(index + 1)]
  }
}
