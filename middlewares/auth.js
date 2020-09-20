/**
 * @file Middleware class for handle/validate the authentication of the request.
 * @author Hasitha Gamage
 */

import atob from 'atob';

function authenticate(req, res, next) {
    const auth = {
        login: process.env.NR_USER || 'test', // Default Username: test
        password: atob(process.env.PASS_HASH || 'dGVzdA==') // Default Password: test
    };
  
    // parse login and password from headers
    const b64auth = (req.headers.authorization || '').split(' ')[1] || ''
    const [login, password] = Buffer.from(b64auth, 'base64').toString().split(':')
  
    // Verify login and password are set and correct
    if (login && password && login === auth.login && password === auth.password) {
      // Access granted...
      return next()
    }
  
    // Access denied...
    res.set('WWW-Authenticate', 'Basic realm="401"') // change this
    res.status(401).send('Authentication required.') // custom message
}

export default authenticate;
