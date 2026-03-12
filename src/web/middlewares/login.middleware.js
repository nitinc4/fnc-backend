async function checkLogin(req, res, next) {

    const token = req.cookies.token;
    if (token) {
        return res.redirect('/dashboard');
    }
    next();
}

export default checkLogin;