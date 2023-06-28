import type { Client } from '@botpress/client'
import { Request } from '@botpress/sdk'
import { LinearClient } from '@linear/sdk'
import axios from 'axios'
import queryString from 'query-string'
import { z } from 'zod'
import { IntegrationCtx } from './types'
import { secrets } from '.botpress'

const linearEndpoint = 'https://api.linear.app'

const oauthHeaders = {
  'Content-Type': 'application/x-www-form-urlencoded',
} as const

export async function getAccessToken(code: string) {
  await axios.post(
    `${linearEndpoint}/oauth/token`,
    {
      code,
      grant_type: 'authorization_code',
    },
    {
      headers: oauthHeaders,
    }
  )
}

const oauthSchema = z.object({
  access_token: z.string(),
  expires_in: z.number(),
})

export class LinearOauthClient {
  private clientId: string
  private clientSecret: string

  constructor() {
    this.clientId = secrets.CLIENT_ID
    this.clientSecret = secrets.CLIENT_SECRET
  }

  async getAccessToken(code: string) {
    const expiresAt = new Date()

    const res = await axios.post(
      `${linearEndpoint}/oauth/token`,
      {
        client_id: this.clientId,
        client_secret: this.clientSecret,
        redirect_uri: `${process.env.BP_WEBHOOK_URL}/oauth`,
        code,
        grant_type: 'authorization_code',
      },
      {
        headers: oauthHeaders,
      }
    )

    const { access_token, expires_in } = oauthSchema.parse(res.data)

    expiresAt.setSeconds(expiresAt.getSeconds() + expires_in)

    return {
      accessToken: access_token,
      expiresAt: expiresAt.toISOString(),
    }
  }

  async getLinearClient(client: Client, integrationId: string) {
    const {
      state: { payload },
    } = await client.getState({
      type: 'integration',
      name: 'credentials',
      id: integrationId,
    })

    return new LinearClient({ accessToken: payload.accessToken })
  }
}

export const handleOauth = async (req: Request, client: Client, ctx: IntegrationCtx) => {
  const linearOauthClient = new LinearOauthClient()

  console.log('oauth flow called', req.query)
  const query = queryString.parse(req.query)
  const code = query.code

  if (typeof code !== 'string') {
    throw new Error('Handler received an empty code')
  }

  console.log('before get access token', code)
  const { accessToken, expiresAt } = await linearOauthClient.getAccessToken(code)
  console.log('after get access token', accessToken, expiresAt)

  await client.setState({
    type: 'integration',
    name: 'credentials',
    id: ctx.integrationId,
    payload: {
      accessToken,
      expiresAt,
    },
  })

  console.log('set state done')

  const linearClient = new LinearClient({ accessToken })
  console.log('linear client created')
  const organization = await linearClient.organization
  console.log('org is ', organization)
  await client.configureIntegration({ identifier: organization.id })
  console.log('configure integration done')

  return {}
}
