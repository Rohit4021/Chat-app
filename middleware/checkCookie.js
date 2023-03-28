const jwt = require('jsonwebtoken')
const Users = require('../db/conn')

const checkCookie = async (req, res, next) => {
    try {
        if (!req.cookies.jwt) {
            res.render('index')
        } else {
            res.render('index', {
                logout: true
            })
        }

        next()
    } catch (e) {

    }
}

module.exports = checkCookie
