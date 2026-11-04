import { RowDataPacket } from "mysql2";

export interface DbUser extends RowDataPacket {
    uuid: string,
    username: string,
    email: string,
    first_name: string,
    last_name: string,
    birthday: Date | string,
    created_at: Date
}

export interface User extends RowDataPacket {
  uuid: string;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  birthday: Date | string; // Date or string depending on your MySQL driver config
  created_at?: Date;     // Optional because it has a default value on insert
}

export type PublicUser = Pick<User, "uuid" | "first_name" | "last_name" | "username"> & {
  followers: string[],
  following: string[]
};