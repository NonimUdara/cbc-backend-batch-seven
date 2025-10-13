import axios from "axios";
import User from "../models/user.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

export function createUser(req, res) {

    const hashedPassword = bcrypt.hashSync(req.body.password, 10);

    const user = new User(
        {
            email: req.body.email,
            firstName: req.body.firstName,
            lastName: req.body.lastName,
            password: hashedPassword,
        }

    )

    user.save().then(
        () => {
            res.json({
                message: "User created successfully"
            })
        }
    ).catch(
        () => {
            res.json({
                error: "Failed to create user"
            })
        }
    )
}

export function loginUser(req, res) {
    User.findOne(
        {
            email: req.body.email
        }
    ).then(
        (user) => {
            if (user == null) {
                res.status(404).json({
                    error: "User not found"
                });
            } else {
                const isPasswordMatching = bcrypt.compareSync(req.body.password, user.password);
                if (isPasswordMatching) {

                    const token = jwt.sign(
                        {
                            email: user.email,
                            firstName: user.firstName,
                            lastName: user.lastName,
                            role: user.role,
                            isEmailVerified: user.isEmailVerified,
                            image: user.image
                        }, process.env.JWT_SECRET, // Use the secret from .env file
                    );

                    res.json({
                        message: "Login successful",
                        token: token,
                        user: {
                            email: user.email,
                            firstName: user.firstName,
                            lastName: user.lastName,
                            role: user.role,
                            isEmailVerified: user.isEmailVerified,
                        }
                    });
                } else {
                    res.status(500).json({
                        error: "Invalid password"
                    });
                }
            }
        }
    )
}

export function isAdmin(req) {
    if (req.user == null) {

        return false;
    }

    if (req.user.role !== "admin") {

        return false;
    }

    return true;

}

export function isCustomer(req) {
    if (req.user == null) {

        return false;
    }

    if (req.user.role !== "customer") {

        return false;
    }

    return true;
}

export function getUser(req, res) {
    if (req.user == null) {
        res.status(401).json({
            message: "Unauthorized"
        });
        return;
    } else {
        req.user
    }

    res.json(req.user);
}

export async function googleLogin(req, res) {

    const token = req.body.token;

    if (token == null) {
        res.status(400).json(
            {
                message: "Token is required"
            }
        );
        return;
    }
    try {

        const googleResponse = await axios.get("https://www.googleapis.com/oauth2/v3/userinfo",
            {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            }
        );

        console.log(googleResponse.data);

        const googleUser = googleResponse.data;

        const user = await User.findOne({ email: googleUser.email });

        // console.log(user);

        if (user == null) {
            //create user
            const newUser = new User(
                {
                    email: googleUser.email,
                    firstName: googleUser.given_name,
                    lastName: googleUser.family_name,
                    password: "db6yugbr876786gbrt8747",
                    isEmailVerified: googleUser.email_verified,
                    image: googleUser.picture
                }
            );

            let savedUser = await newUser.save();

            const jwtToken = jwt.sign(
                {
                    email: savedUser.email,
                    firstName: savedUser.firstName,
                    lastName: savedUser.lastName,
                    role: savedUser.role,
                    isEmailVerified: savedUser.isEmailVerified,
                    image: savedUser.image
                }, 
                process.env.JWT_SECRET, // Use the secret from .env file
            );

            res.json({
                message: "Login successful",
                token: jwtToken,
                user: {
                    email: savedUser.email,
                    firstName: savedUser.firstName,
                    lastName: savedUser.lastName,
                    role: savedUser.role,
                    isEmailVerified: savedUser.isEmailVerified,
                    image: savedUser.image
                }
            });
            return;

        } else {
            //login the user
            const jwtToken = jwt.sign(
                {
                    email: user.email,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    role: user.role,
                    isEmailVerified: user.isEmailVerified,
                    image: user.image
                }, 
                process.env.JWT_SECRET, // Use the secret from .env file
            );
            res.json({
                message: "Login successful",
                token: jwtToken,
                user: {
                    email: user.email,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    role: user.role,
                    isEmailVerified: user.isEmailVerified,
                    image: user.image
                },
            });
            return;
            
        }


    } catch (err) {
        res.status(500).json(
            {
                error: "Failed to login with google"
            }
        )
    }

}
