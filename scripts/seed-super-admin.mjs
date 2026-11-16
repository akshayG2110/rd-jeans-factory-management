import fs from 'fs'
import bcrypt from 'bcryptjs'
import { MongoClient } from 'mongodb'

async function run() {
  const env = fs.readFileSync('.env.local', 'utf8')
  const match = env.match(/MONGODB_URI=(.*)/)
  const uri = match ? match[1].trim() : 'mongodb://localhost:27017'
  const client = new MongoClient(uri)

  try {
    await client.connect()
    const db = client.db()
    const usersCol = db.collection('users')
    const existing = await usersCol.findOne({ username: 'AkshayGohel21' })
    const salt = await bcrypt.genSalt(10)
    const hash = await bcrypt.hash('Akshay21', salt)

    if (!existing) {
      await usersCol.insertOne({
        id: 999,
        username: 'AkshayGohel21',
        display_name: 'Akshay Gohel (Super Admin)',
        role: 'SuperAdmin',
        status: 'Active',
        password_hash: hash,
        created_at: new Date().toISOString()
      })
      console.log('Created Super Admin: AkshayGohel21 / Akshay21')
    } else {
      await usersCol.updateOne(
        { _id: existing._id },
        { $set: { password_hash: hash, role: 'SuperAdmin', status: 'Active' } }
      )
      console.log('Updated Super Admin: AkshayGohel21 / Akshay21')
    }
  } catch (err) {
    console.error('Error:', err)
  } finally {
    await client.close()
  }
}

run()
