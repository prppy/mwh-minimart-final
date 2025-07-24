/**
 * using argon2 based on owasp top 10
 * https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html
 * created: 16/6/2025
 */
import argon2 from "argon2"
import crypto from 'crypto'

/**
 * password - request body (req.body.password)
 * @param {*} req 
 * @param {*} res 
 * @param {*} next 
 */
export const generateHashedPassword = async (req, res, next) => {
    try {
        const plainPassword = req.body.Password_Plain
        const PEPPERED_SECRET = process.env.PEPPERED_SECRET   

        if (!plainPassword) {
            res.status(404).json({
                "message": "missing required fields"
            })

        }   

        if (!PEPPERED_SECRET) {
            res.status(404).json({
                "message": "internal server error"
            })
        }     

        const pepperedPassword = crypto.createHmac('sha256', PEPPERED_SECRET).update(plainPassword).digest('hex')
        const hashedPassword = await argon2.hash(pepperedPassword);
        
        res.locals.Password_Hash = hashedPassword
        next()

    } catch (e) {
        console.error(e.message)
        res.status(400).json({
            message: "An error has occurred"
        })
    }
}

/**
 * inputPassword - req.body (req.body.inputPassword)
 * hashedPassword - res.locals (res.locals.hashedPassword)
 * @param {*} req 
 * @param {*} res 
 * @param {*} next 
 */
export const verifyHashedPassword = async (req, res, next) => {
    try {
        const Password_Plain = req.body.Password_Plain
        const { Password_Hash } = res.locals
        const PEPPERED_SECRET = process.env.PEPPERED_SECRET  

        if (!Password_Plain || !Password_Hash) {
            res.status(404).json({
                "message": "missing required fields"
            })

        } 

        if (!PEPPERED_SECRET) {
            res.status(404).json({
                "message": "internal server error"
            })
        }     

        const pepperedPassword = crypto.createHmac('sha256', PEPPERED_SECRET).update(inputPassword).digest('hex');
        const isMatch = await argon2.verify(hashedPassword, pepperedPassword);

        if (isMatch) {
            // correct password
            next()

        } else {
            // wrong password
            res.status(401).json({
                message: "Password Authentication Failed"
            })
        }

    } catch (e) {
        console.error(e.message)
        res.status(400).json({
            message: "An error has occurred"
        })
    }
}