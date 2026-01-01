import axios from "axios";
import User from "../models/user.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import nodemailer from "nodemailer";
import dotenv from "dotenv";
import OTP from "../models/otpModel.js";
import getDesignedEmail from "../lib/emailDesigner.js";
import sgMail from "../config/sendgrid.js";

dotenv.config();

const transporter = nodemailer.createTransport({
    service: "gmail",
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.APP_PASSWORD,
    }
});

export async function createUser(req, res) {
  try {
    const { email, firstName, lastName, password } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ message: "User with this email already exists." });
    }

    // Hash password
    const hashedPassword = bcrypt.hashSync(password, 10);

    // Create new user
    const user = new User({
      email,
      firstName,
      lastName,
      password: hashedPassword,
    });

    await user.save();

    res.status(201).json({ message: "User created successfully" });
  } catch (error) {
    console.error("Error creating user:", error);
    res.status(500).json({ message: "Failed to create user" });
  }
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

    if (req.user.role !== "user") {

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

export async function sendMESSAGE(req, res) {
  const { name, email, message } = req.body;

  // Basic validation
  if (!name || !email || !message) {
    return res
      .status(400)
      .json({ message: "Name, email, and message are required" });
  }

  try {
    const msg = {
      to: process.env.SUPPORT_EMAIL || "nonimudara123@gmail.com",
      from: process.env.SENDGRID_FROM_EMAIL, // verified sender
      subject: `📩 New Contact Message – ${name}`,
      html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8" />
          <title>New Contact Message</title>
        </head>
        <body style="margin:0; padding:0; background-color:#f4f6f8; font-family:Arial, Helvetica, sans-serif;">
          
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td align="center" style="padding:40px 15px;">
                
                <!-- Card -->
                <table width="100%" max-width="600px" cellpadding="0" cellspacing="0"
                  style="background:#ffffff; border-radius:16px; box-shadow:0 10px 30px rgba(0,0,0,0.08); overflow:hidden;">
                  
                  <!-- Header -->
                  <tr>
                    <td style="background:#FA812F; padding:24px 30px; text-align:center;">
                      <h1 style="margin:0; color:#ffffff; font-size:24px; letter-spacing:0.5px;">
                        New Contact Message
                      </h1>
                      <p style="margin:6px 0 0; color:#fff; opacity:0.9;">
                        Crystal Beauty Clear
                      </p>
                    </td>
                  </tr>

                  <!-- Content -->
                  <tr>
                    <td style="padding:30px;">
                      
                      <p style="font-size:16px; color:#393e46; margin-bottom:24px;">
                        You’ve received a new message from your website contact form.
                      </p>

                      <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
                        <tr>
                          <td style="padding:12px 0; font-weight:bold; color:#111;">👤 Name</td>
                          <td style="padding:12px 0; color:#393e46;">${name}</td>
                        </tr>
                        <tr>
                          <td style="padding:12px 0; font-weight:bold; color:#111;">📧 Email</td>
                          <td style="padding:12px 0; color:#393e46;">${email}</td>
                        </tr>
                      </table>

                      <div style="background:#f9fafb; border-left:4px solid #FA812F; padding:18px; border-radius:10px;">
                        <p style="margin:0; font-weight:bold; color:#111;">💬 Message</p>
                        <p style="margin-top:10px; color:#393e46; line-height:1.6;">
                          ${message.replace(/\n/g, "<br/>")}
                        </p>
                      </div>

                    </td>
                  </tr>

                  <!-- Footer -->
                  <tr>
                    <td style="padding:20px 30px; background:#f4f6f8; text-align:center;">
                      <p style="margin:0; font-size:13px; color:#777;">
                        This email was sent from your website contact page.
                      </p>
                      <p style="margin:6px 0 0; font-size:12px; color:#aaa;">
                        © ${new Date().getFullYear()} Crystal Beauty Clear
                      </p>
                    </td>
                  </tr>

                </table>
                <!-- End Card -->

              </td>
            </tr>
          </table>

        </body>
      </html>
      `,
    };

    await sgMail.send(msg);

    res.status(200).json({ message: "Message sent successfully" });
  } catch (err) {
    console.error("🔥 Error sending contact message:", err);
    res
      .status(500)
      .json({ message: "Failed to send message", error: err.message });
  }
}


// sendOTP function using NodeMailer
// export async function sendOTP(req, res) {

//     const email = req.params.email;
//     if (email == null) {
//         res.status(400).json({
//             message: "Email is required"
//         })
//         return;
//     }

//     //100000 - 999999
//     const otp = Math.floor(100000 + Math.random() * 900000);

//     try {

//         const user = await User.findOne({
//             email: email
//         });

//         const firstName = user ? user.firstName : "User";

//         if (user == null) {
//             res.status(404).json({
//                 error: "User not found"
//             });
//             return;
//         }

//         await OTP.deleteMany({
//             email: email
//         });

//         const newOTP = new OTP({
//             email: email,
//             otp: otp
//         });

//         await newOTP.save();

//         await transporter.verify()
//             .then(() => console.log("✅ SMTP connection successful"))
//             .catch(err => console.error("❌ SMTP connection failed:", err));

//         try {
//             await transporter.sendMail({
//                 from: process.env.EMAIL_USER,
//                 to: email,
//                 subject: "🔒 Your OTP for Password Reset",
//                 html: getDesignedEmail({
//                     otp,
//                     companyName: "Crystal Beauty Clear",
//                     supportEmail: "support@nonimtech.com",
//                     validityMinutes: 10,
//                     firstName: firstName,
//                 }),
//             });
//             console.log("✅ Email sent to", email);
//         } catch (err) {
//             console.error("❌ Failed to send email:", err);
//         }

//         res.json({
//             message: "OTP sent successfully"
//         });


//     } catch (err) {
//         console.error("🔥 Error in sendOTP:", err);
//         res.status(500).json({
//             message: "Failed to send OTP",
//             error: err.message, // Add this
//         });
//     }
// }

// Improved sendOTP function using SendGrid
export async function sendOTP(req, res) {
    const email = req.params.email;

    if (!email) {
        return res.status(400).json({ message: "Email is required" });
    }

    const otp = Math.floor(100000 + Math.random() * 900000);

    try {
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        await OTP.deleteMany({ email });

        await OTP.create({ email, otp });

        const msg = {
            to: email,
            from: process.env.SENDGRID_FROM_EMAIL,
            subject: "🔒 Your OTP for Password Reset",
            html: getDesignedEmail({
                otp,
                companyName: "Crystal Beauty Clear",
                supportEmail: "support@nonimtech.com",
                validityMinutes: 10,
                firstName: user.firstName || "User",
            }),
        };

        await sgMail.send(msg);

        res.json({ message: "OTP sent successfully" });

    } catch (err) {
        console.error("🔥 Error in sendOTP:", err);
        res.status(500).json({
            message: "Failed to send OTP",
            error: err.message,
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

export async function updateUserData(req, res) {
  if (!req.user) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    const updatedUser = await User.findOneAndUpdate(
      { email: req.user.email },
      {
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        image: req.body.image,
      },
      { new: true } // 🔥 return updated data
    );

    res.json({
      message: "Profile updated successfully",
      user: updatedUser,
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to update user data" });
  }
}


export async function updatePassword(req, res) {
  if (!req.user) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    const hashedPassword = bcrypt.hashSync(req.body.password, 10);

    await User.updateOne(
      { email: req.user.email },
      { password: hashedPassword }
    );

    res.json({ message: "Password updated successfully" });
  } catch (error) {
    res.status(500).json({ message: "Failed to update password" });
  }
}
