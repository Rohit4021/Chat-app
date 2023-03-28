const jwt = require('jsonwebtoken')
const {Users} = require('../db/conn')

const auth = async (req, res, next) => {
    try {

        res.setHeader('Content-type', 'text/html')

        const token = req.cookies.jwt

        const verifyUser = jwt.verify(token, process.env.SECRET_KEY)
        console.log(verifyUser)

        const user = await Users.findOne({_id: verifyUser._id})
        console.log(user)

        const users = await Users.find()

        for (let i = 0; i < await users.length; i++) {
            const username = await users[i].email
            const chatUsername = username.split(" ").join("").toLowerCase()
            res.write(`<!--<center><div><h4 style="display: inline-block">${username}</h4><a style="display: inline-block; margin-left: 15px" href="/users?user=${chatUsername}">Chat</a></div></center><br>-->`)
            if (username === req.cookies.user) {
                res.write(`<center><div style="display:none;"><h4 style="display: inline-block">${username}</h4><a style="display: inline-block; margin-left: 15px" href="/users?user=${chatUsername}">Chat</a></div></center><br>`)
            } else {
                res.write(`<center><div><h4 style="display: inline-block">${username}</h4><a style="display: inline-block; margin-left: 15px" href="/users?user=${chatUsername}">Chat</a></div></center><br>`)
            }
        }

        res.end()

        // res.render('secret', {
        //     name: user.name,
        //     email: user.email.toUpperCase(),
        //     age: user.age,
        //     phone: user.age
        // })

        next()

    } catch (e) {
        res.status(401).render('login')
    }
}

module.exports = auth
