
import connectDB from '../lib/db/mongodb'
import User from '../lib/models/User'

const email = process.argv[2]
const role = (process.argv[3] || 'tech') as 'student' | 'tech' | 'admin'

if (!email) {
    console.error('Please provide an email address.')
    process.exit(1)
}

async function promote() {
    try {
        await connectDB()
        console.log(`Connecting to DB to promote ${email}...`)

        // Find by exact email first
        let user = await User.findOne({ email })

        // If not found, try case-insensitive regex
        if (!user) {
            user = await User.findOne({ email: { $regex: new RegExp(`^${email}$`, 'i') } })
        }

        if (user) {
            user.role = role
            await user.save()
            console.log(`SUCCESS: Updated user '${user.name}' (${user.email}) to role '${user.role}'`)
        } else {
            console.error(`ERROR: User with email '${email}' not found.`)

            // List all users to help debug
            const allUsers = await User.find({}, 'email name')
            console.log('Available users:', allUsers.map(u => `${u.email} (${u.name})`).join(', '))
        }
    } catch (error) {
        console.error('Error promoting user:', error)
    } finally {
        process.exit()
    }
}

promote()
