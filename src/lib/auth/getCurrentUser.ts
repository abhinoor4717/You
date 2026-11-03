import { auth0 } from '@/lib/auth0'
import { PublicUser, User } from '@/types/user';
import pool from '../db';
import { RowDataPacket } from 'mysql2';

interface Count extends RowDataPacket {
    count: number
};

export async function getCurrentUser(): Promise<PublicUser | null> {
    const session = await auth0.getSession();

    if (!session) return null;

    try {
        const sessionEmail = session.user.email!;
        
        const [rows] = await pool.query<User[]>(
            "SELECT * FROM users WHERE email = ?",
            [sessionEmail]
        );
        if (rows.length == 0) return null;

        let user: PublicUser = rows[0];
        
        const [followersCount] = await pool.query<Count[]>("SELECT COUNT(*) AS count FROM follows WHERE followed_uuid = ?",
            [user.uuid]
        )
        user.followers_count = followersCount[0].count;

        const [followingCount] = await pool.query<Count[]>("SELECT COUNT(*) AS count FROM follows WHERE follower_uuid = ?",
            [user.uuid]
        )
        user.following_count = followingCount[0].count;

        return user;

    } catch (error) {
        console.log(error);
        return null;
    }
}