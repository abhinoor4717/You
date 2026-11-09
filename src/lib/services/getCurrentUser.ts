import { auth0 } from '@/lib/auth0'
import type { CurrentUser } from '@/types/user';
import pool from '../db';
import { RowDataPacket } from 'mysql2';

export async function getCurrentUser(): Promise<CurrentUser | null> {
    const session = await auth0.getSession();
    const email = session?.user.email;
    if (!email) return null;

    try {
        const [rows] = await pool.query<(CurrentUser & RowDataPacket)[]>(
            `SELECT u.uuid, u.username, u.first_name, u.last_name,
                (SELECT COUNT(*) FROM follows WHERE followed_uuid = u.uuid) AS followers_count,
                (SELECT COUNT(*) FROM follows WHERE follower_uuid = u.uuid) AS following_count
             FROM users u WHERE u.email = ?`,
            [email]
        );
        return rows[0] ?? null;

    } catch (error) {
        console.log(error);
        return null;
    }
}
