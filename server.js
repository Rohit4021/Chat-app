const express = require('express')
const app = express()
const hbs = require('hbs')
const http = require('http').createServer(app)
const {Chats, Users} = require('./db/conn')
const cookieParser = require('cookie-parser')
const url = require('url')
const nodemailer = require('nodemailer')
const imageToUri = require('image-to-uri')
const validator = require('validator')
const io = require('socket.io')(http)
const checkCookie = require('./middleware/checkCookie')
const path = require("path");
const bcrypt = require('bcrypt')
const auth = require("./middleware/auth");
const validate = require('./middleware/validate')
const find_auth = require('./middleware/find_auth')
const jwt = require('jsonwebtoken')
const getUserEmail = require("./middleware/getUserEmail");
const fileUpload = require('express-fileupload')
require('dotenv').config()

const PORT = process.env.PORT || 8000

app.use(fileUpload())
app.use(cookieParser())
app.set('view engine', 'hbs')
// app.use(express.static(__dirname + '/public'))
app.use(express.urlencoded({
    extended: true
}))

http.listen(PORT, () => {
    console.log(`Listening at port : ${PORT}`)
})

const partial_path = path.join(__dirname + '/views/partials/')

hbs.registerPartials(partial_path)

const split = (word, sign) => {
    return word.split(sign)
}

app.get('/', checkCookie, (req, res) => {
    // res.render('index')
})

app.get('/logout', (req, res) => {
    res.clearCookie('jwt')
    res.redirect('/')
})

app.get('/secret', auth, async (req, res) => {
    // res.render('secret')

    io.on('connection', (socket) => {
        socket.on('addFriend', async friend => {
            console.log('Friend =====>' + friend)
            const addFriend = await Users.updateOne({
                email: req.cookies.user
            }, {
                $push: {
                    friends: {
                        friend: friend
                    }
                }
            })

            // const update = await Chats.updateOne({
            //     twoUser: name
            // }, {
            //     $push: {
            //         chats: {
            //             username: msg.user,
            //             msg: msg.message
            //         }
            //     }
            // })

            console.log(addFriend)
        })
    })

})

app.get('/signup', (req, res) => {
    res.render('signup')
})

app.get('/profile', validate, async (req, res) => {
    const token = req.cookies.jwt
    const verifyUser = jwt.verify(token, process.env.SECRET_KEY)
    const friends = await Users.find({_id: verifyUser._id}, {
        'friends.num': 0
    })
    let y = friends[0].friends
    let friendsPic = []
    let friendsList = []
    const name = friends[0].name
    const myPic = friends[0].pic
    const email = friends[0].email

    for (let i = 0; i < y.length; i++) {
        if (y[i].success) {
            let pic = await Users.find({email: y[i].friend})
            friendsPic.push(pic[0].pic)
            friendsList.push(y[i].friend)
        }

    }

    io.once('connection', (socket) => {
        socket.emit('friends', {friendsList, friendsPic})
        socket.emit('loadProfile', {name, myPic, email})

        socket.on('changePic', async file => {
            const pic = await Users.updateOne({
                username: req.cookies.user
            }, {
                pic: file
            })
        })
    })
    res.render('profile')
})


app.get('/users/edit/:edit', (req, res) => {
    res.render('edit')
})


app.post('/register', async (req, res) => {


    let monthNumber = 0
    const months = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december']

    for (let i = 0; i < months.length; i++) {
        if (months[i] === req.body.month)
            monthNumber = i + 1
    }


    const fullName = req.body.full_name
    const email = req.body.email
    const dob = `${req.body.day}/${monthNumber}/${req.body.year}`
    const username = req.body.username
    const pass = req.body.pass
    const confirm_pass = req.body.confirm_pass

    if (validator.isEmail(email)) {
        if (pass !== confirm_pass) {
            console.log('Error! password not matched')
            res.render('signup', {
                pass: true
            })
        } else {
            const emailExist = await Users.find({email})

            if (emailExist.length !== 0) {
                res.render('signup', {
                    email: true
                })
            } else {
                const createUser = async () => {
                    try {
                        const salt = bcrypt.genSaltSync(10)
                        const hash = bcrypt.hashSync(pass, salt)
                        const user = await new Users({
                            name: fullName,
                            email,
                            dob,
                            username,
                            password: hash
                        })

                        const token = await user.generateAuthToken()
                        console.log(token)

                        res.cookie('jwt', token, {
                            expires: new Date(Date.now() + 78840000000000)
                        })

                        res.cookie('user', username, {
                            expires: new Date(Date.now() + 78840000000000)
                        })

                        const result = await user.save()


                        console.log(result)
                        res.render('check')
                    } catch (e) {
                        console.log(e)
                    }
                }

                createUser()

                // const transporter = nodemailer.createTransport({
                //     service: 'gmail',
                //     auth: {
                //         user: 'rohitkm40021@gmail.com',
                //         pass: process.env.email_pass
                //     }
                // })
                //
                // const mailOptions = {
                //     from: 'rohitkm40021@gmail.com',
                //     to: email,
                //     subject: 'Activation Mail',
                //     text: 'Thank you for registering to our website. To activate your account, please open this link :- ' +
                //         `https://mywebsite-iuji.onrender.com/user?email=${email}`
                // }
                //
                // transporter.sendMail(mailOptions, function (error, info) {
                //     if (error) {
                //         console.log(error)
                //     } else {
                //         console.log('Email sent : ' + info)
                //     }
                // })

            }
        }
    } else {
        res.render('signup', {
            notEmail: true
        })
    }


})

app.get('/login', (req, res) => {
    res.render('login')
})

app.post('/login', async (req, res) => {
    const username = req.body.username
    const pwd = req.body.pass

    const usernames = await Users.find({username})

    if (usernames.length !== 0) {
        if (usernames[0].success !== true) {
            res.render('login', {
                unauth: true
            })
        } else {
            await bcrypt.compare(pwd, usernames[0].password, async (err, data) => {
                if (data) {

                    const token = await usernames[0].generateAuthToken()
                    console.log(`the token part => ${token}`)

                    res.cookie('jwt', token, {
                        expires: new Date(Date.now() + 7884000000000)
                    })

                    res.cookie('user', username, {
                        expires: new Date(Date.now() + 78840000000000)
                    })


                    res.redirect('/secret')


                } else {
                    res.render('login', {
                        invalid_credentials: true
                    })
                }
            })
        }
    } else {
        res.render('login', {
            invalid_credentials: true
        })
    }

})

app.get('/user', async (req, res) => {
    const email = req.query.email
    console.log(email)
    const emailDB = await Users.find({email: email})
    if (emailDB.length !== 0) {
        if (emailDB[0].success !== true) {
            try {
                const updateSuccess = await Users.updateOne({
                    email: email
                }, {
                    success: true
                })

                console.log(updateSuccess)
                res.render('auth')
            } catch (err) {
                console.log(err)
                res.render('unauth')
            }
        } else {
            res.render('aauth')
        }
    } else {
        res.render('nouser')
    }


})

app.get('/client.js', (req, res) => {
    res.sendFile(__dirname + '/public/client.js')
})

app.get('/friendsFilter.js', (req, res) => {
    res.sendFile(__dirname + '/public/friendsFilter.js')
})

app.get('/style.css', (req, res) => {
    res.sendFile(__dirname + '/public/style.css')
})

app.get('/edit.css', (req, res) => {
    res.sendFile(__dirname + '/public/edit.css')
})

app.get('/style_profile.css', (req, res) => {
    res.sendFile(__dirname + '/public/style_profile.css')
})

app.get('/camera.png', (req, res) => {
    res.sendFile(__dirname + '/public/camera.png')
})

app.get('/default_profile.png', (req, res) => {
    res.sendFile(__dirname + '/public/default_profile.jpg')
})

app.get('/wassup.png', (req, res) => {
    res.sendFile(__dirname + '/public/wassup.png')
})

app.get('/find', find_auth, async (req, res) => {
    io.once('connection', async (socket) => {
        const token = req.cookies.jwt
        const verifyUser = jwt.verify(token, process.env.SECRET_KEY)
        const friends = await Users.find({_id: verifyUser._id}, {
            'friends.num': 0
        })
        let y = friends[0].friends
        socket.emit('list', y)


        socket.on('cancelRequest', async id => {
            try {
                const cancel = await Users.updateOne({
                    email: id
                }, {
                    $pull: {
                        requests: {
                            user: req.cookies.user
                        }
                    }
                })

                const deleteFriend = await Users.updateOne({
                    email: req.cookies.user
                }, {
                    $pull: {
                        friends: {
                            user: id
                        }
                    }
                })
            } catch (e) {
                console.log(e)
            }
        })


        socket.on('addFriend', async friend => {
            console.log('Friend =====>' + friend)
            try {
                const addFriend = await Users.updateOne({
                    email: req.cookies.user
                }, {
                    $push: {
                        friends: {
                            friend: friend
                        }
                    }
                })

                console.log('addFriend =====> ' + addFriend)

                const sendRequest = await Users.updateOne({
                    email: friend
                }, {
                    $push: {
                        requests: {
                            user: req.cookies.user
                        }
                    }
                })

                console.log(req.cookies.user)

                console.log('Send Request ======> ' + sendRequest)
            } catch (e) {
                res.status(401).json('An error has occured')
            }
        })
    })

})

let first
let second

app.get('/requests', async (req, res) => {
    res.setHeader('Content-type', 'text/html')
    const user = await Users.find({
        email: req.cookies.user
    })

    console.log(user)
    const requests = user[0].requests
    for (let i = 0; i < await user.length; i++) {
        if (requests.length === 0) {
            res.write(`<h3>No Friend Request</h3>`)
        } else {
            const request = requests[i].user
            res.write(`<center><h3>${request}</h3><button id="${request}" onclick="accept(this)">Accept</button><button id="${request}" onclick="decline(this)">Decline</button></center><script src="/socket.io/socket.io.js"></script><script>const socket = io.connect(); function accept(btn) { socket.emit('acceptRequest', btn.id) } function decline(btn) { socket.emit('declineRequest', btn.id) }</script>`)
        }
    }

    res.end()

    io.once('connection', (socket) => {
        socket.on('declineRequest', async request => {
            const declineRequest = await Users.updateOne({
                email: req.cookies.user
            }, {
                $pull: {
                    requests: {
                        user: request
                    }
                }
            })

            const updateFriendSuccess = await Users.findOneAndUpdate({
                email: request
            }, {
                $set: {
                    "friends.$[el].success": false
                }
            }, {
                arrayFilters: [{
                    "el.friend": req.cookies.user
                }]
            })


        })

        socket.on('acceptRequest', async request => {
            const requester = await Users.find({
                email: request
            })

            const acceptRequest = await Users.updateOne({
                email: req.cookies.user
            }, {
                $pull: {
                    requests: {
                        user: request
                    }
                }
            })


            const updateFriendSuccess = await Users.findOneAndUpdate({
                email: request
            }, {
                $set: {
                    "friends.$[el].success": true
                }
            }, {
                arrayFilters: [{
                    "el.friend": req.cookies.user
                }]
            })


            // const secondAddedFriend = await Users.updateOne({
            //     email: request
            // }, {
            //     $push: {
            //         friends: {
            //             friend: req.cookies.user,
            //             success: true
            //         }
            //     }
            // })

            const addFriend = await Users.updateOne({
                email: req.cookies.user
            }, {
                $push: {
                    friends: {
                        friend: request,
                        success: true
                    }
                }
            })


        })
    })
})


app.get('/users', getUserEmail, (req, res) => {
    const username = req.cookies.user
    const to = req.query.user
    res.redirect(`http://localhost:8000/chats/${username}_${to}`)
})

app.get('/chats/:chat', async (req, res) => {

    res.render('chat')

    const chats = await Chats.find()

    const splitParam = split(req.params.chat, '_')

    console.log('You ====>' + splitParam[0])
    console.log('Other ====>' + splitParam[1])

    console.log('Param =====> ' + req.params.chat)

    io.once("connection", async (socket) => {
        socket.emit('conn')
        console.log('Connection Successful')

        socket.once('join', () => {
            io.emit('join')
            socket.join(splitParam[0] + splitParam[1])
            socket.join(splitParam[1] + splitParam[0])
            console.log('Join event ==============> ' + splitParam[0])
            console.log('Join event ==============> ' + splitParam[1])

            first = splitParam[0]
            second = splitParam[1]

        })

        let name

        const user1 = await Chats.find({
            twoUser: splitParam[0] + splitParam[1]
        })

        const user2 = await Chats.find({
            twoUser: splitParam[1] + splitParam[0]
        })

        if (user1.length !== 0) {
            name = splitParam[0] + splitParam[1]
        } else {
            if (user2.length !== 0) {
                name = splitParam[1] + splitParam[0]
            } else {
                const newChat = new Chats({
                    twoUser: splitParam[0] + splitParam[1]
                })

                const save = await newChat.save()
                name = splitParam[0] + splitParam[1]
                console.log(`Save ====>` + save)
            }
        }

        socket.on('message', async (msg) => {

            console.log('All includes')

            socket.join(splitParam[0] + splitParam[1])
            socket.join(splitParam[1] + splitParam[0])
            const send = await socket.to(splitParam[0] + splitParam[1]).to(splitParam[1] + splitParam[0]).emit('msg', msg)
            if (send === true) {
                console.log('Chat sent')
                console.log(socket.rooms)
            } else {
                console.log('Chat not sent.')
            }

            const update = await Chats.updateOne({
                twoUser: name
            }, {
                $push: {
                    chats: {
                        username: msg.user,
                        msg: msg.message
                    }
                }
            })
            const chat = await Chats.find({
                twoUser: name
            })
            console.log(chat)
            console.log(chats)
            console.log('Name =====>' + name)
            console.log(update)
        })

        const personalChats = await Chats.find({
            twoUser: name
        })


        socket.emit('chatHistory', personalChats)

        socket.on('disconnect', async () => {

            console.log('User disconnected.')

        })


    })


    setTimeout(() => {
        res.end()
    }, 5000)

})

app.get('/*', (req, res) => {
    res.render('error')
})

