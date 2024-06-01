const UserModel = require('../model/user.model');
const bcrypt = require('bcrypt');
const nodemailer = require('nodemailer');
const jwt = require('jsonwebtoken');
const userModel = require('../model/user.model');
const SALT = Number(process.env.SALT);
const signup = async (req, res, next) => {
  const { password, email } = req.body;
  console.log(req.body);
  const hasedPassword = await bcrypt.hash(password, SALT);
  try {
    const user = new UserModel({
      ...req.body, password: hasedPassword
    });
    await user.save();
    req.session.islogin = true;
    req.session.user = user._id;
    res.status(201).json({ message: 'You have successfully registered. Please login now' })
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
}

const login = async (req, res, next) => {
  const { password, email } = req.body;

  try {
    const user = await UserModel.findOne({ email: email });

    if (!user) {
      return res.status(404).json({ message: 'Invalid email or password' })
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(404).json({ message: 'Invalid email or password' })
    }

    req.session.islogin = true;
    req.session.user = user._id;
    req.session.save();
    user.password = undefined;
    res.status(200).json({ message: 'you have login successfully', user });

  } catch (error) {
    res.status(404).json({ message: error });
  }


}

const logout = async (req, res, next) => {

  try {
    req.session.islogin = false;
    res.status(200).json({ message: 'you have logout successfully' });
  } catch (error) {
    res.status(404).json({ message: error });
  }
}

const isLognin = async (req, res, next) => {
  if (await req.session?.islogin && await req.session?.user) {
    console.log(req)
    const user = await UserModel.findById(req.session.user);
    const newUser = {
      email: user.email,
      role: user.role,
      username: user.username
    }
    res.status(200).json(newUser);
  } else {
    res.status(404).json({ message: 'user is not login' });
  }
  // try {
  //   console.log(await req.session)
  // } catch (error) {
  //   console.log(error)
  // }

}
const forgetPassword = async (req, res, next) => {
  const { email } = req.body;
  const user = await UserModel.findOne({ email: email });
  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }
  const token = jwt.sign({ email }, process.env.JWT_SECRET, { expiresIn: '15m' });
  // user.resetPasswordToken = token;
  // user.resetPasswordExpires = Date.now() + 900000; // 15 minutes
  // await user.save();


  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD,
    },
  });

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: 'Reset your password',
    html: `<p>Please click this <a href="http://localhost:${process.env.PORT}/session/updatepassword/${token}">link</a> to reset your password.</p>`,
  };
  transporter.sendMail(mailOptions, (error, info) => {
    // if (error) {
    //   console.log(error);
    // } else {
    //   console.log('Email sent: ' + info.response);
    // }
    res.status(200).json({ message: 'Reset link sent to email' });
  });
}

const updatePassword = async (req, res, next) => {
  const { token } = req.params;
  // const user = await UserModel.findOne({
  //   resetPasswordToken: token,
  //   resetPasswordExpires: { $gt: Date.now() },
  // });
  try {
    const userdata = jwt.verify(token, process.env.JWT_SECRET);
  }
  catch (error) {
    console.log("error")
    return res.status(400).json({ message: 'Invalid or expired token' });
  }
  const user = await userModel.findOne({ email: userdata.email });
  user.password = await bcrypt.hash(req.body.password, SALT);
  // user.resetPasswordToken = undefined;
  // user.resetPasswordExpires = undefined;

  try {
    await user.save();
    req.session.islogin = true;
    req.session.user = user._id;
    res.status(200).json({ message: 'password is updated ....' })
  } catch (error) {
    return res.status(400).json({ message: error });
  }

}
module.exports = { signup, login, logout, isLognin, forgetPassword, updatePassword }