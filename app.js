require('dotenv').config();
require('./config/database').connect();

///importing user model from databse
const User = require('./model/user')
const auth = require('./middleware/auth')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const express = require('express')

const PORT = process.env.PORT || 8080;
const app = express();

app.use(express.json())

app.route('/register').post(async(req, res) => {
    //register logic goes here

    try {
        //get user input
        const { firstName, lastName, email, password } = req.body;

        //validating user input
        if (!(email && password && firstName && lastName)) {
            res.status(400).send('All input is required');
        }

        //check if user already exists
        //validate if user already exists in our database
        const oldUser = await User.findOne({ email });

        if (oldUser) {
            return res.status(409).send('User Already Exists. Please login.');
        }

        //encypt user password
        const encryptedPassword = await bcrypt.hash(password, 10);

        //creating user in our database
        const user = await User.create({
            firstName,
            lastName,
            email: email.toLowerCase(),
            password: encryptedPassword
        });

        //return new user
        res.status(201).json(user)

    } catch (error) {
        console.log(error)
    }
});

app.route('/login').post(async(req, res) => {
    //login logic begins

    try {
        //get user input
        const { email, password } = req.body;

        //validate input
        if (!(email, password)) {
            res.status(400).send("All the input is required!")
        }

        //validating user credentials in our database
        const existingUser = await User.findOne({ email });
        // console.log(existingUser)

        if (existingUser && (await bcrypt.compare(password, existingUser.password))) {
            //create token
            const token = jwt.sign({ user_id: existingUser._id, email },
                process.env.ACCESS_TOKEN_KEY, {
                    expiresIn: "1h",
                }
            );
            //user
            res.status(200).json({ userDetails: existingUser, accessToken: token })
        }
        res.status(400).send("Invalid Credentials!")
    } catch (error) {
        console.log(error)
    }
});

app.route("/welcome").get(auth, async(req, res) => {
    const userEmail = req.existingUser.email;
    console.log(`Logged in as ${userEmail}`)

    const data = await User.findOne({ email: userEmail });
    res.json({ Logged_In: userEmail, data: data })
});

app.listen(PORT, () => {
    console.log(`Sucessfully connected on PORT: ${PORT}`)
});