import { DbUser, PublicUser } from "@/types/user";
import pool from "../db";
import { RowDataPacket } from "mysql2";

type UserLookupField = "uuid" | "email" | "username";

const lookupColumns: Record<UserLookupField, string> = {
    uuid: "uuid",
    email: "email",
    username: "username",
};

async function getUserBy(
    field: UserLookupField,
    value: string
): Promise<PublicUser | null> {
    try {
        const column = lookupColumns[field];
        const [rows] = await pool.query<DbUser[]>(
            `SELECT * FROM users WHERE ${column} = ? LIMIT 1`,
            [value]
        );

        const user = rows[0];
        if (!user) return null;

        const [followers, following] = await Promise.all([
            getFollowers(user.uuid),
            getFollowings(user.uuid),
        ]);

        if (followers === null || following === null) return null;

        return {
            uuid: user.uuid,
            first_name: user.first_name,
            last_name: user.last_name,
            username: user.username,
            followers,
            following,
        };
    } catch (error) {
        console.error(`Unable to retrieve user by ${field}:`, error);
        return null;
    }
}

export const getUserByUuid = (uuid: string) => getUserBy("uuid", uuid);
export const getUserByEmail = (email: string) => getUserBy("email", email);
export const getUserByUsername = (username: string) =>
    getUserBy("username", username);

interface FollowerRow extends RowDataPacket {
    follower_uuid: string;
}

interface FollowingRow extends RowDataPacket {
    followed_uuid: string;
}

export async function getFollowers(uuid: string): Promise<string[] | null> {
    try {
        const [rows] = await pool.query<FollowerRow[]>(
            "SELECT follower_uuid FROM follows WHERE followed_uuid = ?",
            [uuid]
        );

        return rows.map((row) => row.follower_uuid);
    } catch (error) {
        console.error("Unable to retrieve followers:", error);
        return null;
    }
}

export async function getFollowings(uuid: string): Promise<string[] | null> {
    try {
        const [rows] = await pool.query<FollowingRow[]>(
            "SELECT followed_uuid FROM follows WHERE follower_uuid = ?",
            [uuid]
        );

        return rows.map((row) => row.followed_uuid);
    } catch (error) {
        console.error("Unable to retrieve followings:", error);
        return null;
    }
}