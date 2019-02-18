var express = require("express");
var router = express.Router();
var passport = require("passport");
var User = require("../models/user");
var campGround = require("../models/campgrounds");
var async = require("async");
var nodemailer = require("nodemailer");
var crypto = require("crypto");

router.get("/", function(req, res) {
    
    res.render("landing");
});

router.get("/register", function(req, res) {
    
    res.render("register", {page: "register"});
});

router.post("/register", function(req, res) {
    
    var newUser = new User({
        
        username: req.body.username,
        firstname: req.body.firstname,
        lastname: req.body.lastname,
        avatar: req.body.avatar,
        email: req.body.email,
        phone: req.body.phone
    });
    
    if (req.body.admincode === "secretcode123")
        newUser.isAdmin = true;
    
    User.register(newUser, req.body.password, function(error, user) {
        
        if (error) {
            
            req.flash("error", error.message);
            return res.redirect("/register");
        }
        
        else {
            
            passport.authenticate("local")(req, res, function() {
                
                req.flash("success", "Successfully Signed up! Welcome to YelpCamp " + user.username);
                res.redirect("/campgrounds");
            });
        }
    });
});

router.get("/login", function(req, res) {
    
    res.render("login", {page: "login"});
});

router.post("/login", passport.authenticate("local", 

    {
        successRedirect: "/campgrounds",
        failureRedirect: "/login"
    }), function(req, res) {
    
});

router.get("/logout", function(req, res) {
    
   req.logout();
   req.flash("success", "Logged you out!");
   res.redirect("/campgrounds");
});

router.get("/forgot", function(req, res) {
    
    res.render("forgot");
});

router.post('/forgot', function(req, res, next) {
    
  async.waterfall([
      
    function(done) {
        
      crypto.randomBytes(20, function(error, buf) {
          
        var token = buf.toString('hex');
        done(error, token);
      });
    },
    
    function(token, done) {
        
      User.findOne({ email: req.body.email }, function(error, user) {
          
        if (!user) {
          req.flash("error", "No account with that email address exists.");
          return res.redirect('/forgot');
        }

        user.resetPasswordToken = token;
        user.resetPasswordExpires = Date.now() + 3600000; // 1 hour

        user.save(function(err) {
            
          done(err, token, user);
        });
      });
    },
    
    function(token, user, done) {
        
      var smtpTransport = nodemailer.createTransport({
          
        service: 'Gmail', 
        auth: {
          user: 'dhruv3456@gmail.com',
          pass: process.env.GMAILPW
        }
      });
      
      var mailOptions = {
          
        to: user.email,
        from: 'dhruv3456@gmail.com',
        subject: 'YelpCamp Password Reset',
        text: 'You are receiving this because you (or someone else) have requested the reset of the password for your account.\n\n' +
          'Please click on the following link, or paste this into your browser to complete the process:\n\n' +
          'http://' + req.headers.host + '/reset/' + token + '\n\n' +
          'If you did not request this, please ignore this email and your password will remain unchanged.\n'
      };
      
      smtpTransport.sendMail(mailOptions, function(err) {
          
        console.log('mail sent');
        req.flash('success', 'An e-mail has been sent to ' + user.email + ' with further instructions.');
        done(err, 'done');
      });
    }
  ], function(err) {
        if (err) return next(err);
        res.redirect('/forgot');
    });
});

router.get('/reset/:token', function(req, res) {
    
  User.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } }, function(error, user) {
      
    if (!user) {
        
      req.flash('error', 'Password reset token is invalid or has expired.');
      return res.redirect('/forgot');
    }
    
    res.render('reset', {token: req.params.token});
  });
});

router.post('/reset/:token', function(req, res) {
    
  async.waterfall([
      
    function(done) {
        
      User.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } }, function(error, user) {
          
        if (!user) {
            
          req.flash("error", "Password reset token is invalid or has expired.");
          return res.redirect("back");
        }
        
        if(req.body.password === req.body.confirm) {
            
          user.setPassword(req.body.password, function(error) {
              
            user.resetPasswordToken = undefined;
            user.resetPasswordExpires = undefined;

            user.save(function(error) {
                
              req.logIn(user, function(error) {
                  
                done(error, user);
              });
            });
          })
        } else {
            req.flash("error", "Passwords do not match.");
            return res.redirect('back');
        }
      });
    },
    function(user, done) {
      var smtpTransport = nodemailer.createTransport({
        service: 'Gmail', 
        auth: {
          user: 'learntocodeinfo@gmail.com',
          pass: process.env.GMAILPW
        }
      });
      var mailOptions = {
        to: user.email,
        from: 'learntocodeinfo@mail.com',
        subject: 'Your password has been changed',
        text: 'Hello,\n\n' +
          'This is a confirmation that the password for your account ' + user.email + ' has just been changed.\n'
      };
      smtpTransport.sendMail(mailOptions, function(err) {
        req.flash('success', 'Success! Your password has been changed.');
        done(err);
      });
    }
  ], function(err) {
    res.redirect('/campgrounds');
  });
});

router.get("/users/:id", function(req, res) {
    
    User.findById(req.params.id, function(error, foundUser) {
        
        if (error) {
            
            req.flash("error", "Cannot find user");
            res.redirect("/campgrounds");
        }
        
        else {
            
            campGround.find().where("author.id").equals(foundUser._id).exec(function(error, campgrounds) {
                
                if (error) {
                    
                    req.flash("error", "Something went wrong");
                    res.redirect("/campgrounds");
                }
                
                else
                    res.render("users/show", {user: foundUser, campgrounds: campgrounds});
            });
        }
    });
});

module.exports = router;