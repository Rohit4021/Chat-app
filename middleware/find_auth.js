const jwt = require('jsonwebtoken')
const {Users} = require('../db/conn')

const find_auth = async (req, res, next) => {
    try {

        res.setHeader('Content-type', 'text/html')

        const token = req.cookies.jwt

        const verifyUser = jwt.verify(token, process.env.SECRET_KEY)
        console.log(verifyUser)

        const user = await Users.findOne({_id: verifyUser._id})
        console.log(user)

        const users = await Users.find()

        res.write('<head><meta name="viewport" content="width=device-width,initial scale=1" /><meta charset="UTF-8"/></head><center><div id="container">')

        for (let i = 0; i < await users.length; i++) {
            // const username = await users[i].email
            //
            //
            // const name = await user.friends[i]
            //
            //     if (username === req.cookies.user) {
            //
            //     } else {
            //         if (username === name && users[i].success === false) {
            //             res.write(`<center><div><h4 id="user_name" style="display: inline-block">${username}</h4><button id="${username}" onclick="add(this)" style="display: inline-block; margin-left: 15px">Requested</button></div></center><br><script src="/socket.io/socket.io.js"></script><script>const socket = io.connect(); function add(btn) { socket.emit('addFriend', btn.id) }</script>`)
            //         } else if (username === name && users[i].success === true) {
            //             res.write(`<center><div><h4 id="user_name" style="display: inline-block">${username}</h4><button id="${username}" onclick="add(this)" style="display: inline-block; margin-left: 15px">Added</button></div></center><br><script src="/socket.io/socket.io.js"></script><script>const socket = io.connect(); function add(btn) { socket.emit('addFriend', btn.id) }</script>`)
            //         } else {
            //             res.write(`<center><div><h4 id="user_name" style="display: inline-block">${username}</h4><button id="${username}" onclick="add(this)" style="display: inline-block; margin-left: 15px">Add Friend</button></div></center><br><script src="/socket.io/socket.io.js"></script><script>const socket = io.connect(); function add(btn) { socket.emit('addFriend', btn.id) }</script>`)
            //         }
            //     }
            //
            //
            //
            //
            //     console.log(`friend =====>  ${name}`)
            //     console.log(`success =====>  ${users[i].success}`)


            const username = await users[i].email


                if (username === req.cookies.user) {

                } else {
                    res.write(`<h4 class="${username}" style="display: inline-block">${username}</h4><button id="${username}" onclick="add(this)" style="display: inline-block; margin-left: 15px">Add Friend</button><br><script src="/socket.io/socket.io.js"></script>`)
                }

            }



        res.write('</div></center><script src="/friendsFilter.js"></script>')



        res.end()

        next()

    } catch (e) {
        console.log(e)
        res.render('login')
    }
}

module.exports = find_auth
