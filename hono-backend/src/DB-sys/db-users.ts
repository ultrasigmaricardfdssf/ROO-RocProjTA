import Database from 'better-sqlite3'

type user{n}

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
          
          function addUser(email : string){
              return "sigmaaa";
          }
          
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

    async getUserByEmail(email : string) {
      const result = this.db.prepare(`
            SELECT * FROM users WHERE email = ?;  
          `).all(email)[0];
      return result != null ? result : null;
    }
}