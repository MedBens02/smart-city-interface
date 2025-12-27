import type { ClaimMessage } from "@/lib/types"
import { format, isSameDay } from "date-fns"

export interface MessageGroup {
  date: string
  messages: ClaimMessage[]
}

export function groupMessagesByDate(messages: ClaimMessage[]): MessageGroup[] {
  if (messages.length === 0) return []

  const groups: MessageGroup[] = []
  let currentGroup: MessageGroup | null = null

  messages.forEach((message) => {
    const messageDate = new Date(message.timestamp)
    const dateLabel = format(messageDate, "MMMM d, yyyy")

    if (!currentGroup || !isSameDay(new Date(currentGroup.messages[0].timestamp), messageDate)) {
      currentGroup = {
        date: dateLabel,
        messages: [message],
      }
      groups.push(currentGroup)
    } else {
      currentGroup.messages.push(message)
    }
  })

  return groups
}
