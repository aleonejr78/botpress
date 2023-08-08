import { BaseIntegration } from '../integration/generic'

export type BaseBot = {
  integrations: Record<string, BaseIntegration>
  events: Record<string, any>
  states: Record<string, any>
}
