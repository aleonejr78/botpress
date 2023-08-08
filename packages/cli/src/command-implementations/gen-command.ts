import type * as sdk from '@botpress/sdk'
import chalk from 'chalk'
import _ from 'lodash'
import * as codegen from '../code-generation'
import type commandDefinitions from '../command-definitions'
import * as errors from '../errors'
import * as utils from '../utils'
import { ProjectCommand } from './project-command'

export type GenerateCommandDefinition = typeof commandDefinitions.generate
export class GenerateCommand extends ProjectCommand<GenerateCommandDefinition> {
  public async run(): Promise<void> {
    const def = await this.readDefinitionFromFS()
    if (def.type === 'integration') {
      await this._generateIntegrationTypings(def.definition)
      return
    }
    await this._generateBotTypings(def.definition)
  }

  private _generateBotTypings = async (botDef: sdk.BotDefinition): Promise<void> => {
    const line = this.logger.line()

    line.started('Generating typings for bot...')

    const fromWorkDir = this.projectPaths.rel('workDir')
    const fromOutDir = this.projectPaths.rel('outDir')

    const typingFiles = await codegen.generateBotImplementationTypings(botDef, fromOutDir.implementationDir)
    await this.writeGeneratedFilesToOutFolder(typingFiles)
    await this.generateBotIndex()

    line.success(`Typings available at ${chalk.grey(fromWorkDir.outDir)}`)
  }

  private _generateIntegrationTypings = async (integrationDef: sdk.IntegrationDefinition): Promise<void> => {
    this._validateSecrets(integrationDef)

    const line = this.logger.line()

    const { name } = integrationDef
    line.started(`Generating typings for integration ${chalk.bold(name)}...`)

    const fromWorkDir = this.projectPaths.rel('workDir')
    const fromOutDir = this.projectPaths.rel('outDir')

    const typingFiles = await codegen.generateIntegrationImplementationTypings(
      integrationDef,
      fromOutDir.implementationDir
    )

    const secretFiles = await codegen.generateIntegrationSecrets(integrationDef, fromOutDir.secretsDir)

    const indexFile = await codegen.generateIntegrationIndex(fromOutDir.implementationDir, fromOutDir.secretsDir)

    const generatedFiles = [...typingFiles, ...secretFiles, indexFile]

    await this.writeGeneratedFilesToOutFolder(generatedFiles)

    line.success(`Typings available at ${chalk.grey(fromWorkDir.outDir)}`)
  }

  private _validateSecrets(integrationDef: sdk.IntegrationDefinition): void {
    const { secrets } = integrationDef
    if (!secrets) {
      return
    }

    for (const secret of secrets) {
      if (!utils.casing.is.screamingSnakeCase(secret)) {
        throw new errors.BotpressCLIError(`Secret ${secret} should be in SCREAMING_SNAKE_CASE`)
      }
    }

    const groups = _(secrets)
      .groupBy()
      .mapValues((s) => s.length)
      .toPairs()
      .value()

    for (const [secret, count] of groups) {
      if (count > 1) {
        throw new errors.BotpressCLIError(`Secret ${secret} is dupplicated; It appears ${count} times`)
      }
    }
  }
}
