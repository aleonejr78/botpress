import { RuntimeError } from '@botpress/client'
import { WhatsAppAPI, Types } from 'whatsapp-api-js'
import z from 'zod'
import * as botpress from '.botpress'

const {
  Template: { Template, Language },
} = Types

export const createConversation: botpress.IntegrationProps['createConversation'] = async ({
  client,
  channel,
  tags,
  ctx,
}) => {
  const phoneNumberId = ctx.configuration.phoneNumberId
  if (!phoneNumberId) {
    throw new RuntimeError('Phone number ID is not configured')
  }

  const userPhoneTag = 'userPhone'
  const userPhone = tags[userPhoneTag]
  if (!userPhone) {
    throw new RuntimeError(`A Whatsapp recipient phone number needs to be provided in the '${userPhoneTag}' tag`)
  }

  /*
  Whatsapp only allows using Message Templates for proactively starting conversations with users.
  See: https://developers.facebook.com/docs/whatsapp/pricing#opening-conversations
  */
  const templateNameTag = 'templateName'
  const templateName = tags[templateNameTag]
  if (!templateName) {
    throw new RuntimeError(`A Whatsapp template name needs to be provided in the '${templateNameTag}' tag`)
  }

  const templateLanguage = tags.templateLanguage || 'en_US'

  const templateVariablesTag = 'templateVariables'
  const templateVariablesSchema = z.array(z.string().or(z.number()))
  let templateVariables: z.infer<typeof templateVariablesSchema> = []

  if (templateVariablesTag in tags) {
    let templateVariablesRaw = []

    try {
      templateVariablesRaw = JSON.parse(tags[templateVariablesTag]!)
    } catch (err) {
      throw new RuntimeError(
        `Template variables received isn't valid JSON (error: ${(err as Error)?.message ?? ''}). Received: ${
          tags[templateVariablesTag]
        }})`
      )
    }

    const validationResult = templateVariablesSchema.safeParse(templateVariablesRaw)
    if (!validationResult.success) {
      throw new RuntimeError(
        `Template variables should be an array of strings or numbers (error: ${validationResult.error}))`
      )
    }

    templateVariables = validationResult.data
  }

  const { conversation } = await client.getOrCreateConversation({
    channel,
    tags: {
      ['phoneNumberId']: phoneNumberId,
      [userPhoneTag]: userPhone,
      [templateNameTag]: templateName,
    },
  })

  const whatsapp = new WhatsAppAPI(ctx.configuration.accessToken)

  const template = new Template(templateName, new Language(templateLanguage), {
    type: 'body',
    parameters: templateVariables.map((variable) => ({
      type: 'text',
      text: variable,
    })),
  })

  const response = await whatsapp.sendMessage(phoneNumberId, userPhone, template)

  if (response?.error) {
    throw new RuntimeError(
      `Failed to start Whatsapp conversation using template "${templateName}" and language "${templateLanguage}" - Error: ${JSON.stringify(
        response.error
      )}`
    )
  }

  return {
    body: JSON.stringify({ conversation: { id: conversation.id } }),
    headers: {},
    statusCode: 200,
  }
}
