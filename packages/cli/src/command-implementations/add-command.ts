import type * as bpclient from '@botpress/client'
import chalk from 'chalk'
import * as fs from 'fs'
import * as pathlib from 'path'
import * as codegen from '../code-generation'
import type commandDefinitions from '../command-definitions'
import * as errors from '../errors'
import { parseIntegrationRef } from '../integration-ref'
import { IntegrationInstallDir, ProjectCommand } from './project-command'

export type AddCommandDefinition = typeof commandDefinitions.add
export class AddCommand extends ProjectCommand<AddCommandDefinition> {
  public async run(): Promise<void> {
    const integrationDef = await this.readDefinitionFromFS()
    if (integrationDef.type === 'integration') {
      throw new errors.ExclusiveBotFeatureError()
    }

    const integrationRef = this.argv.integrationRef

    const api = await this.ensureLoginAndCreateClient(this.argv)
    const parsedRef = parseIntegrationRef(integrationRef)
    if (!parsedRef) {
      throw new errors.InvalidIntegrationReferenceError(integrationRef)
    }

    const integration = await api.findIntegration(parsedRef)
    if (!integration) {
      throw new errors.BotpressCLIError(`Integration "${integrationRef}" not found`)
    }

    const allInstances = await this.listIntegrationInstances()
    const existingInstance = allInstances.find((i) => i.name === integration.name)
    if (existingInstance) {
      this.logger.warn(`Integration with name "${integration.name}" already installed.`)
      const res = await this.prompt.confirm('Do you want to overwrite the existing instance?')
      if (!res) {
        this.logger.log('Aborted')
        return
      }

      await this._uninstallIntegration(existingInstance)
    }

    await this._generateIntegrationInstance(integration)
  }

  private async _uninstallIntegration(instance: IntegrationInstallDir) {
    const installDir = this.projectPaths.abs.installDir
    const instancePath = pathlib.join(installDir, instance.dirname)
    await fs.promises.rm(instancePath, { recursive: true })
    await this.generateBotIndex()
  }

  private async _generateIntegrationInstance(integration: bpclient.Integration) {
    const line = this.logger.line()

    const { name, version } = integration
    line.started(`Installing ${chalk.bold(name)} v${version}...`)

    const instanceFiles = await codegen.generateIntegrationInstance(
      integration,
      this.projectPaths.rel('outDir').installDir
    )
    await this.writeGeneratedFilesToOutFolder(instanceFiles)
    await this.generateBotIndex()

    const rel = this.projectPaths.rel('workDir')
    line.success(`Installed integration available at ${chalk.grey(rel.outDir)}`)
  }
}
