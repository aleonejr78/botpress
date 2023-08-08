import { jsonSchemaToTypeScriptType } from '../generators'
import { Module, ReExportTypeModule } from '../module'
import type * as types from '../typings'

export class ConfigurationSchemaModule extends Module {
  public static async create(configuration: types.ConfigurationDefinition): Promise<ConfigurationSchemaModule> {
    const schema = configuration.schema
    const name = 'configuration'
    return new ConfigurationSchemaModule({
      path: `${name}.ts`,
      exportName: 'Configuration',
      content: await jsonSchemaToTypeScriptType(schema, name),
    })
  }
}

export class ConfigurationModule extends ReExportTypeModule {
  public static async create(config: types.ConfigurationDefinition): Promise<ConfigurationModule> {
    const inst = new ConfigurationModule({ exportName: 'Configuration' })
    inst.pushDep(await ConfigurationSchemaModule.create(config))
    return inst
  }
}
