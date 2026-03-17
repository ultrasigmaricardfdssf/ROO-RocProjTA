import { UsersDB } from './DB-sys/db-users.js';

// some kind of setup, ig??

class DBManager{
    users = new UsersDB();
}

export const dbmanager = new DBManager();