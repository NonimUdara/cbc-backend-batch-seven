import axios from "axios";
import User from "../models/user.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import nodemailer from "nodemailer";
import dotenv from "dotenv";
import OTP from "../models/otpModel.js";
import getDesignedEmail from "../lib/emailDesigner.js";

dotenv.config();

const transporter = nodemailer.createTransport({
    service: "gmail",
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.App_PASSWORD
    }
});

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

                if (user.isBlock) {
                    res.status(403).json({
                        message: "Your account has been blocked contact admin"
                    });
                    return;
                }

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

        // console.log(googleResponse.data);

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

            if (user.isBlock) {
                res.status(403).json({
                    message: "Your account has been blocked contact admin"
                });
                return;
            }

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

export async function getAllUsers(req, res) {
    if (!isAdmin(req)) {
        res.status(403).json({
            message: "You are not authorized to view all users"
        })
        return;
    }
    try {
        const users = await User.find();
        res.json(users);
    } catch (error) {
        console.error("Error fetching users:", error);
        res.status(500).json({
            error: "Failed to fetch users"
        });
    }
}

export async function blockorUnblockUser(req, res) {

    if (!isAdmin(req)) {
        res.status(403).json({
            message: "You are not authorized to block or unblock a user"
        })
        return;
    }

    if (req.user.email == req.params.email) {
        res.status(400).json({
            message: "You cannot block or unblock yourself"
        })
        return;
    }

    try {

        await User.updateOne(
            { email: req.params.email },
            { isBlock: req.body.isBlock }
        );

        res.json({
            message: "User blocked or unblocked successfully"
        });

    } catch (error) {
        console.error("Error blocking or unblocking user:", error);
        res.status(500).json({
            error: "Failed to block or unblock user"
        });
    }

}

export async function sendOTP(req, res) {

    const email = req.params.email;
    if (email == null) {
        res.status(400).json({
            message: "Email is required"
        })
        return;
    }

    //100000 - 999999
    const otp = Math.floor(100000 + Math.random() * 900000);

    try {

        const user = await User.findOne({
            email: email
        });

        const firstName = user ? user.firstName : "User";

        if (user == null) {
            res.status(404).json({
                error: "User not found"
            });
            return;
        }

        await OTP.deleteMany({
            email: email
        });

        const newOTP = new OTP({
            email: email,
            otp: otp
        });

        await newOTP.save();

        await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: email,
            subject: "🔒 Your OTP for Password Reset",
            html: getDesignedEmail({
                otp,
                companyName: "Crystal Beauty Clear",
                supportEmail: "support@nonimtech.com",
                validityMinutes: 10,
                firstName: firstName,
            }),
        });

        res.json({
            message: "OTP sent successfully"
        });


    } catch (err) {
        console.error("🔥 Error in sendOTP:", err);
        res.status(500).json({
            message: "Failed to send OTP",
            error: err.message, // Add this
        });
    }
}

export async function changePasswordViaOTP(req, res) {
    const email = req.body.email;
    const otp = req.body.otp;
    const newPassword = req.body.newPassword;

    try {
        const otpRecord = await OTP.findOne({
            email: email,
            otp: otp
        });

        if (otpRecord == null) {
            res.status(400).json({
                message: "Invalid OTP"
            });
            return;
        }

        await OTP.deleteMany({
            email: email
        });

        const hashedPassword = bcrypt.hashSync(newPassword, 10);

        await User.updateOne(
            { email: email },
            { password: hashedPassword }
        );
        res.json({
            message: "Password changed successfully"
        });
    } catch (error) {
        res.status(500).json({
            message: "Failed to change password"
        });
    }

}
