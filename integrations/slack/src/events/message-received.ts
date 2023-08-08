import { GenericMessageEvent } from '@slack/bolt'
import { IntegrationClient } from 'src/misc/types'
import { getUserAndConversation } from '../misc/utils'

export const executeMessageReceived = async ({
  slackEvent,
  client,
}: {
  slackEvent: GenericMessageEvent
  client: IntegrationClient
}) => {
  // prevents the bot from answering itself
  if (slackEvent.bot_id) {
    return
  }

  await client.createMessage({
    tags: { ts: slackEvent.ts },
    type: 'text',
    payload: {
      text: slackEvent.text!,

      // not declared in the definition:
      // targets: {
      //   dm: { id: slackEvent.user },
      //   thread: { id: slackEvent.channel || slackEvent.user, thread: slackEvent.thread_ts || slackEvent.ts },
      //   channel: { id: slackEvent.channel },
      // },
    },
    ...(await getUserAndConversation(
      { slackUserId: slackEvent.user, slackChannelId: slackEvent.channel, slackThreadId: slackEvent.thread_ts },
      client
    )),
  })
}
