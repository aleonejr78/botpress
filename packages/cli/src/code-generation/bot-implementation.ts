import * as bpsdk from '@botpress/sdk'
import { z } from 'zod'
import * as utils from '../utils'
import { ConfigurationModule } from './integration-schemas/configuration-module'
import { EventsModule } from './integration-schemas/events-module'
import { StatesModule } from './integration-schemas/states-module'
import { ReExportTypeModule } from './module'
import * as types from './typings'

export class BotImplementationIndexModule extends ReExportTypeModule {
  public static async create(sdkBot: bpsdk.BotDefinition): Promise<BotImplementationIndexModule> {
    const bot = this._mapBot(sdkBot)

    const configModule = await ConfigurationModule.create(bot.configuration ?? { schema: {} })
    configModule.unshift('configuration')

    const eventsModule = await EventsModule.create(bot.events ?? {})
    eventsModule.unshift('events')

    const statesModule = await StatesModule.create(bot.states ?? {})
    statesModule.unshift('states')

    const inst = new BotImplementationIndexModule({
      exportName: 'Integration',
    })

    inst.pushDep(configModule)
    inst.pushDep(eventsModule)
    inst.pushDep(statesModule)

    return inst
  }

  private static _mapBot = (b: bpsdk.BotDefinition): types.BotDefinition => ({
    conversation: {
      tags: b.conversation?.tags ?? {},
    },
    message: {
      tags: b.message?.tags ?? {},
    },
    user: {
      tags: b.user?.tags ?? {},
    },
    configuration: b.configuration ? { ...this._mapSchema(b.configuration), data: {} } : { schema: {}, data: {} },
    events: b.events ? utils.records.mapValues(b.events, this._mapSchema) : {},
    states: b.states ? utils.records.mapValues(b.states, this._mapSchema) : {},
  })

  private static _mapSchema = <T extends { schema: z.ZodObject<any> }>(
    x: T
  ): utils.types.Merge<T, { schema: ReturnType<typeof utils.schema.mapZodToJsonSchema> }> => ({
    ...x,
    schema: utils.schema.mapZodToJsonSchema(x),
  })
}
