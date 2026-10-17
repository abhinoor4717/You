import { User } from '@/types/user';
import mysql from 'mysql2/promise';
import { NextResponse } from 'next/server';

const pool = mysql.createPool({
  host:             process.env.MYSQL_HOST,
  port:             Number(process.env.MYSQL_PORT ?? 3306),
  user:             process.env.MYSQL_USER,
  password:         process.env.MYSQL_PASSWORD,
  database:         process.env.MYSQL_DATABASE,
  connectionLimit:  10,
  waitForConnections: true,
  queueLimit:       0,
});

export default pool;