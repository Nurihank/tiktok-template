import dotenv from 'dotenv'
import mysql from 'mysql2/promise'

dotenv.config({ path: './.env' })

export default class Database {
  constructor() {
    this.pool = mysql.createPool({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
    })
  }

  async query(sql, params) {
    const [results] = await this.pool.execute(sql, params)
    return results
  }
}
