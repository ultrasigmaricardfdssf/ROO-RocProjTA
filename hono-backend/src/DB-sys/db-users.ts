import Database from 'better-sqlite3'
import bcrypt from 'bcrypt'
import type { User } from '../auth/auth.service.js'

export class UsersDB {
    private db : Database.Database

    constructor(){
        this.db = new Database('databases/users.db');

        this.db.exec(`
            CREATE TABLE IF NOT EXISTS users (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              username TEXT UNIQUE,
              email TEXT NOT NULL UNIQUE,
              password TEXT NOT NULL,
              about_me TEXT,
              role_id INTEGER NOT NULL,
              notifiable BOOLEAN,
              created_at INTEGER DEFAULT (unixepoch())
            )  
          `)
          
          const mail = 'b@a.com'
          const username = 'adam'
          
          /*const resulta = this.db
            .prepare(
              `
            INSERT INTO users (email, username)
            VALUES (?, ?)
          `,
            )
            .run(mail, username)*/
          
          // const result = this.db.prepare('SELECT * FROM users WHERE username = ?').all('adam')
          
          // console.log("ih")
    }

    jsonToUser(json : any) : User{
      return {
        id: json.id,
        username: json.username,
        email: json.email,
        password: json.password,
        role: json.role,
        notified: json.notified,
        description: json.description,
        created_at: json.created_at
        
      }
    }

    getUserByEmail(email : string) : User | null {
      const result = this.db.prepare(`
            SELECT * FROM users WHERE email = ?;  
          `).all(email)[0];
      return result != null ? this.jsonToUser(result) : null;
    }

    getUserByUsername(username : string)
    {

    }

    register(username : string, email : string, password : string)
    {
      let hashedPassword = bcrypt.hashSync(password, 10);

      const result = this.db
            .prepare(
              `
            INSERT INTO users (username, email, password, role_id)
            VALUES (?, ?, ?, 0)
          `,
            )
            .run(username, email, hashedPassword);

      return result;
    }
}