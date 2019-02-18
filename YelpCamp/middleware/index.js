var campGround = require("../models/campgrounds");
var Comment = require("../models/comment");
var middlewareObject = {};

middlewareObject.checkCampgroundOwnership = function(req, res, next) {
    
    if (req.isAuthenticated()) {
        
        campGround.findById(req.params.id, function(error, foundCamp) {
    
            if (error || !foundCamp) {
                
                req.flash("error", "Error from database");
                res.redirect("back");
            }
            
            else {
                
                if (foundCamp.author.id.equals(req.user._id) || req.user.isAdmin)
                    next();
                
                else {
                    
                    req.flash("error", "You don't have the permission!");
                    res.redirect("back");
                }
            }
        });
    } 
    
    else {
        
        req.flash("error", "You need to be logged in!");
        res.redirect("back");
    }
}

middlewareObject.checkCommentOwnership = function(req, res, next) {
    
    if (req.isAuthenticated()) {
        
        Comment.findById(req.params.comment_id, function(error, foundComment) {
    
            if (error || !foundComment) {
                
                req.flash("error", "Comment not found");
                res.redirect("/campgrounds/req.params.id");
            }
            
            else {
                
                if (foundComment.author.id.equals(req.user._id) || req.user.isAdmin)
                    next();
                
                else {
                    
                    req.flash("error", "You don't have the permission!");
                    res.redirect("back");
                }
            }
        });
    } 
    
    else {
        
        req.flash("error", "Campground not found");
        res.redirect("back");
    }    
};

middlewareObject.isLoggedIn = function(req, res, next) {
    
    if (req.isAuthenticated()) {
        
        return next();
    }
    
    req.flash("error", "You need to be logged in!");
    res.redirect("/login");
}

module.exports = middlewareObject;