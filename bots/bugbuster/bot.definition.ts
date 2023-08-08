import { BotDefinition } from '@botpress/sdk'
import { z } from 'zod'

export default new BotDefinition({
  states: {
    myState: {
      type: 'user',
      schema: z.object({ astring: z.string(), anumber: z.number() }),
    },
  },
  events: {
    myEvent: {
      schema: z.object({ abool: z.boolean() }),
    },
  },
})
