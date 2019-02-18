var express = require("express");
var router = express.Router({mergeParams: true});
var campGround = require("../models/campgrounds");
var Comment = require("../models/comment");
var middleware = require("../middleware");

router.get("/new", middleware.isLoggedIn, function(req, res) {
    
    campGround.findById(req.params.id, function(error, camp) {
        
        if (error)
            console.log(error);
            
        else
            res.render("comments/create", {camp: camp});
    });
});

router.post("/", middleware.isLoggedIn, function(req, res) {
    
    campGround.findById(req.params.id, function(error, camp) {
        
        if (error)
            console.log(error);
            
        else {
            
            Comment.create(req.body.comment, function(error, comment) {
                
                if (error) {
                    
                    req.flash("error", "Error in database");
                    console.log(error);
                }
                    
                else {
                 
                    comment.author.id = req.user._id;
                    comment.author.username = req.user.username;
                    comment.save();
                    
                    camp.comments.push(comment);
                    camp.save();
                    res.redirect("/campgrounds/" + camp._id);
                }
            });
        }
    });
});

router.get("/:comment_id/edit", middleware.checkCommentOwnership,function(req, res) {
    
    Comment.findById(req.params.comment_id, function(error, foundComment) {
        
        if (error || !foundComment) {
            
            req.flash("error", "Comment not found");
            res.redirect("back");
        }
            
        else
            res.render("comments/edit", {camp_id: req.params.id, comment: foundComment});
    });
});

router.put("/:comment_id", middleware.checkCommentOwnership, function(req, res) {
    
    Comment.findByIdAndUpdate(req.params.comment_id, req.body.comment, function(error, updatedComment) {
        
        if (error)
            console.log(error);
            
        else
            res.redirect("/campgrounds/" + req.params.id);
    });
});

router.delete("/:comment_id", middleware.checkCommentOwnership, function(req, res) {
    
    Comment.findByIdAndRemove(req.params.comment_id, function(error) {
        
        if (error)
            console.log(error);
        
        else {
            
            req.flash("Success", "Comment has been deleted");
            res.redirect("/campgrounds/" + req.params.id);
        }
        
    });
});

module.exports = router;