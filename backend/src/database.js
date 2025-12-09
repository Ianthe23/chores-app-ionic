import sqlite3 from "sqlite3";
import { promisify } from "util";

const db = new sqlite3.Database("./chores.db");

// Promisify database methods
db.getAsync = promisify(db.get.bind(db));
db.allAsync = promisify(db.all.bind(db));

// Custom promisified run method that returns 'this' context with lastID
db.runAsync = function(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function(err) {
      if (err) {
        reject(err);
      } else {
        resolve({
          lastID: this.lastID,
          lastInsertRowid: this.lastID,
          changes: this.changes
        });
      }
    });
  });
};

export const initDatabase = async () => {
  try {
    // Create users table
    await db.runAsync(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create chores table
    await db.runAsync(`
      CREATE TABLE IF NOT EXISTS chores (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        title TEXT NOT NULL,
        description TEXT,
        completed BOOLEAN DEFAULT FALSE,
        status TEXT DEFAULT 'pending',
        priority TEXT DEFAULT 'medium',
        due_date DATETIME,
        points INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
      )
    `);

    // Add status column to existing tables (migration)
    try {
      await db.runAsync(`ALTER TABLE chores ADD COLUMN status TEXT DEFAULT 'pending'`);
    } catch (error) {
      // Column might already exist, ignore error
      if (!error.message.includes('duplicate column name')) {
        console.log('Status column migration note:', error.message);
      }
    }

    // Add points column to existing tables (migration)
    try {
      await db.runAsync(`ALTER TABLE chores ADD COLUMN points INTEGER DEFAULT 0`);
    } catch (error) {
      if (!error.message.includes('duplicate column name')) {
        console.log('Points column migration note:', error.message);
      }
    }

    // Add photo_url column to existing tables (migration)
    try {
      await db.runAsync(`ALTER TABLE chores ADD COLUMN photo_url TEXT`);
    } catch (error) {
      if (!error.message.includes('duplicate column name')) {
        console.log('Photo URL column migration note:', error.message);
      }
    }

    // Add photo_path column to existing tables (migration)
    try {
      await db.runAsync(`ALTER TABLE chores ADD COLUMN photo_path TEXT`);
    } catch (error) {
      if (!error.message.includes('duplicate column name')) {
        console.log('Photo path column migration note:', error.message);
      }
    }

    // Add latitude column to existing tables (migration)
    try {
      await db.runAsync(`ALTER TABLE chores ADD COLUMN latitude REAL`);
    } catch (error) {
      if (!error.message.includes('duplicate column name')) {
        console.log('Latitude column migration note:', error.message);
      }
    }

    // Add longitude column to existing tables (migration)
    try {
      await db.runAsync(`ALTER TABLE chores ADD COLUMN longitude REAL`);
    } catch (error) {
      if (!error.message.includes('duplicate column name')) {
        console.log('Longitude column migration note:', error.message);
      }
    }

    // Add location_name column to existing tables (migration)
    try {
      await db.runAsync(`ALTER TABLE chores ADD COLUMN location_name TEXT`);
    } catch (error) {
      if (!error.message.includes('duplicate column name')) {
        console.log('Location name column migration note:', error.message);
      }
    }

    // Update existing records to have proper status based on completed field
    await db.runAsync(`
      UPDATE chores 
      SET status = CASE 
        WHEN completed = 1 THEN 'completed' 
        ELSE 'pending' 
      END 
      WHERE status IS NULL OR status = ''
    `);

    console.log("✅ Database initialized successfully");
  } catch (error) {
    console.error("❌ Database initialization failed:", error);
    throw error;
  }
};

export default db;
