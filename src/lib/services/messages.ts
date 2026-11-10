import type { ResultSetHeader, RowDataPacket } from "mysql2";
import type { Message, MessagePage } from "@/types/messaging";
import pool from "../db";

type MessageRow = RowDataPacket & Omit<Message, "created_at" | "read_at"> & {
  created_at: Date;
  read_at: Date | null;
};

const messageColumns = `CAST(id AS CHAR) AS id, CAST(conversation_id AS CHAR) AS conversation_id,
  sender_uuid, body, created_at, read_at`;
const pageSize = 50;
const maxId = BigInt("18446744073709551615");

export function isMessagingId(id: unknown): id is string {
  return typeof id === "string" && /^[1-9][0-9]{0,19}$/.test(id) &&
    BigInt(id) <= maxId;
}

function toMessage(row: MessageRow): Message {
  return {
    ...row,
    created_at: row.created_at.toISOString(),
    read_at: row.read_at?.toISOString() ?? null,
  };
}

export async function getMessages(
  conversationId: string,
  userUuid: string,
  before: string | null,
  after: string | null
): Promise<MessagePage | null> {
  const [participants] = await pool.query<RowDataPacket[]>(
    "SELECT 1 FROM conversations WHERE id = CAST(? AS UNSIGNED) AND (user_low_uuid = ? OR user_high_uuid = ?)",
    [conversationId, userUuid, userUuid]
  );
  if (!participants.length) return null;

  const cursor = before ?? after;
  const filter = before ? "AND messages.id < CAST(? AS UNSIGNED)"
    : after ? "AND messages.id > CAST(? AS UNSIGNED)" : "";
  const [rows] = await pool.query<MessageRow[]>(
    `SELECT /*+ INDEX(messages idx_messages_conversation_id) */ ${messageColumns} FROM messages
     WHERE conversation_id = CAST(? AS UNSIGNED) ${filter}
     ORDER BY messages.id ${after ? "ASC" : "DESC"} LIMIT ?`,
    cursor ? [conversationId, cursor, pageSize + 1] : [conversationId, pageSize + 1]
  );
  const page = rows.slice(0, pageSize).map(toMessage);
  return { messages: after ? page : page.reverse(), hasMore: rows.length > pageSize };
}

export async function sendMessage(conversationId: string, senderUuid: string, body: string) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    // Serialize sends within a conversation so a newer ID cannot commit before an older one.
    const [participants] = await connection.query<(RowDataPacket & {
      user_low_uuid: string;
      user_high_uuid: string;
    })[]>(
      `SELECT user_low_uuid, user_high_uuid FROM conversations
       WHERE id = CAST(? AS UNSIGNED) AND (user_low_uuid = ? OR user_high_uuid = ?)
       FOR UPDATE`,
      [conversationId, senderUuid, senderUuid]
    );
    const conversation = participants[0];
    if (!conversation) {
      await connection.rollback();
      return null;
    }

    await connection.query<ResultSetHeader>(
      "INSERT INTO messages (conversation_id, sender_uuid, body) VALUES (CAST(? AS UNSIGNED), ?, ?)",
      [conversationId, senderUuid, body]
    );
    const [rows] = await connection.query<MessageRow[]>(
      `SELECT ${messageColumns} FROM messages WHERE messages.id = LAST_INSERT_ID()`
    );
    const message = toMessage(rows[0]);
    await connection.commit();
    return {
      message,
      participantIds: [conversation.user_low_uuid, conversation.user_high_uuid] as [string, string],
    };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}
