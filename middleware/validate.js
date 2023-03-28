const validate = (req, res, next) => {
    if (!req.cookies.jwt) res.redirect('/login')
    next()
}

module.exports = validate
