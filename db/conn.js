const mongoose = require('mongoose')
const jwt = require("jsonwebtoken");
const res = require("express/lib/response");
mongoose.set('strictQuery', false)
require('dotenv').config()

mongoose.connect(`mongodb+srv://${process.env.USER}:${process.env.PASS}@chatapp.t4fgyxk.mongodb.net/?retryWrites=true&w=majority`, {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => {
// mongoose.connect(`mongodb://0.0.0.0:27017/rohit`).then(() => {
    console.log('Connection Successful')
}).catch((e) => {
    console.log(e)
})


const users = new mongoose.Schema({
    name: String,
    pic: {
        type: String,
        default: '/default_profile.png'
    },
    email: {
        type: String,
        unique: true
    },
    dob: String,
    username: {
        type: String,
        unique: true
    },
    password: String,
    success: {
        type: Boolean,
        default: false
    },
    friends: [
        {
            friend: String,
            success: {
                type: Boolean,
                default: false
            },
            num: {
                type: Number,
                default: 5
            }
        }
    ],
    requests: [
        {
            user: String
        }
    ],
    tokens: [{
        token: {
            type: String,
            required: true
        }
    }]
})


users.methods.generateAuthToken = async function () {
    try {
        const token = await jwt.sign({_id: this._id.toString()}, process.env.SECRET_KEY)
        this.tokens = this.tokens.concat({token})
        await this.save()
        return token
    } catch (e) {
        res.send("Error!")
        console.log(e)
    }
}


const Users = new mongoose.model('User', users)


const conn = new mongoose.Schema({
    twoUser: {
        type: String,
        unique: true
    },
    chats: [
        {
            username: String,
            msg: String,
            date: {
                type: Date,
                default: new Date()
            }
        }
    ]
})

const Chats = new mongoose.model('Chat', conn)


module.exports = {
    Chats,
    Users
}
