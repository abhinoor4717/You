import { RowDataPacket } from "mysql2";

export interface User extends RowDataPacket {
  uuid: string;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  age: number;
  birthday: Date | string; // Date or string depending on your MySQL driver config
  created_at?: Date;     // Optional because it has a default value on insert
}
