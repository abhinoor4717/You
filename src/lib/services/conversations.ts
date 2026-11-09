import type { RowDataPacket } from "mysql2";
import type { Conversation, ConversationPage } from "@/types/messaging";
import type { UserSummary } from "@/types/user";
import pool from "../db";

type ConversationRow = RowDataPacket & UserSummary & {
  id: string;
  user_low_uuid: string;
  user_high_uuid: string;
  created_at: Date;
  updated_at: Date;
  last_message: string | null;
};

type InboxRow = ConversationRow & {
  activity_seconds: number;
  latest_message_id: string;
};

type InboxCursor = {
  activitySeconds: number;
  latestMessageId: string;
  conversationId: string;
};

const pageSize = 25;
const maxId = BigInt("18446744073709551615");

export function parseInboxCursor(value: string): InboxCursor | null {
  const match = /^(\d{1,10})\.(0|[1-9]\d{0,19})\.([1-9]\d{0,19})$/.exec(value);
  if (!match) return null;

  const [, seconds, latestMessageId, conversationId] = match;
  if (BigInt(latestMessageId) > maxId || BigInt(conversationId) > maxId) return null;

  return { activitySeconds: Number(seconds), latestMessageId, conversationId };
}

const conversationColumns = `
    CAST(c.id AS CHAR) AS id, c.user_low_uuid, c.user_high_uuid, c.created_at,
    peer.uuid, peer.username, peer.first_name, peer.last_name,
    latest.body AS last_message, COALESCE(latest.created_at, c.created_at) AS updated_at
`;
const conversationSource = `
  FROM conversations c
  JOIN users peer ON peer.uuid = IF(c.user_low_uuid = ?, c.user_high_uuid, c.user_low_uuid)
  LEFT JOIN messages latest ON latest.id = (
    SELECT m.id FROM messages m WHERE m.conversation_id = c.id
    ORDER BY m.created_at DESC, m.id DESC LIMIT 1
  )
`;
const activitySeconds = "COALESCE(UNIX_TIMESTAMP(latest.created_at), UNIX_TIMESTAMP(c.created_at))";

function toConversation(row: ConversationRow): Conversation {
  const { id, user_low_uuid, user_high_uuid, created_at, updated_at, last_message } = row;
  const { uuid, username, first_name, last_name } = row;

  return {
    id, user_low_uuid, user_high_uuid, last_message,
    created_at: created_at.toISOString(),
    updated_at: updated_at.toISOString(),
    participant: { uuid, username, first_name, last_name },
  };
}

export async function findConversations(userUuid: string, cursor: InboxCursor | null = null): Promise<ConversationPage> {
  const [rows] = await pool.query<InboxRow[]>(
    `SELECT ${conversationColumns}, ${activitySeconds} AS activity_seconds,
            CAST(COALESCE(latest.id, 0) AS CHAR) AS latest_message_id
     ${conversationSource}
     WHERE (c.user_low_uuid = ? OR c.user_high_uuid = ?)
     ${cursor ? `AND (${activitySeconds}, COALESCE(latest.id, 0), c.id)
       < (?, CAST(? AS UNSIGNED), CAST(? AS UNSIGNED))` : ""}
     ORDER BY activity_seconds DESC, latest.id DESC, c.id DESC
     LIMIT ?`,
    cursor
      ? [userUuid, userUuid, userUuid, cursor.activitySeconds, cursor.latestMessageId, cursor.conversationId, pageSize + 1]
      : [userUuid, userUuid, userUuid, pageSize + 1]
  );
  const page = rows.slice(0, pageSize);
  const last = page.at(-1);
  return {
    conversations: page.map(toConversation),
    nextCursor: last && rows.length > pageSize
      ? `${last.activity_seconds}.${last.latest_message_id}.${last.id}`
      : null,
  };
}

export async function findSpecificConversation(userUuid: string, recipientUuid: string) {
  const [rows] = await pool.query<ConversationRow[]>(
    `SELECT ${conversationColumns} ${conversationSource}
     WHERE c.user_low_uuid = LEAST(?, ?) AND c.user_high_uuid = GREATEST(?, ?)`,
    [userUuid, userUuid, recipientUuid, userUuid, recipientUuid]
  );
  return rows[0] ? toConversation(rows[0]) : null;
}

export async function createConversation(userUuid: string, recipientUuid: string) {
  await pool.query(
    `INSERT INTO conversations (user_low_uuid, user_high_uuid)
     SELECT LEAST(?, peer.uuid), GREATEST(?, peer.uuid)
     FROM users peer WHERE peer.uuid = ? AND peer.uuid <> ?
     ON DUPLICATE KEY UPDATE id = conversations.id`,
    [userUuid, userUuid, recipientUuid, userUuid]
  );
  return findSpecificConversation(userUuid, recipientUuid);
}
