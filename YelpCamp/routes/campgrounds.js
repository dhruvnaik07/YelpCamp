var express = require("express");
var router = express.Router();
var campGround = require("../models/campgrounds");
var middleware = require("../middleware");
var multer = require('multer');

var storage = multer.diskStorage({
    
  filename: function(req, file, callback) {
      
    callback(null, Date.now() + file.originalname);
  }
});

var imageFilter = function (req, file, cb) {
    // accept image files only
    if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/i)) {
        
        return cb(new Error('Only image files are allowed!'), false);
    }
    cb(null, true);
};

var upload = multer({ storage: storage, fileFilter: imageFilter})

var cloudinary = require("cloudinary");

cloudinary.config({ 
    
  cloud_name: "dix40cgoh", 
  api_key: process.env.CLOUDINARY_API_KEY, 
  api_secret: process.env.CLOUDINARY_API_SECRET
});

router.get("/", function(req, res) {
    
    if (req.query.search) {
        
        const regex = new RegExp(escapeRegex(req.query.search), 'gi');
        campGround.find({name: regex}, function(error, camp) {
        
            if (error)
                console.log("An error");
            
            else {
                
                if (camp.length == 0) {
                    
                    req.flash("error", "We could not find any campground with given search input!");
                    res.redirect("/campgrounds");
                }
                
                else
                    res.render("campgrounds/index", {campgrounds: camp, page: "campgrounds"});
            }
        });
    }
    
    else {
        
        campGround.find({}, function(error, camp) {
        
            if (error)
                console.log("An error");
            
            else
                res.render("campgrounds/index", {campgrounds: camp, page: "campgrounds"});
        });
    }
});

router.get("/new", middleware.isLoggedIn,function(req, res) {
    
    res.render("campgrounds/create");
});

router.get("/:id", function(req, res) {
    
    campGround.findById(req.params.id).populate("comments").exec(function(error, foundCamp) {
       
        if (error || !foundCamp) {
            
            req.flash("error", "Campground not found");
            res.redirect("/campgrounds");
        }
            
        else
            res.render("campgrounds/show", {camp: foundCamp});
    });
});

router.post("/", middleware.isLoggedIn, upload.single('image'), function(req, res) {
    
    cloudinary.v2.uploader.upload(req.file.path, function(error, result) {
        
        if (error) {
            
            req.flash("error", error.message);
            return res.redirect("back");
        }
    // add cloudinary url for the image to the campground object under image property
      req.body.campground.image = result.secure_url;
      // add author to campground
      
      req.body.campground.author = {
        id: req.user._id,
        username: req.user.username
      };
      
      campGround.create(req.body.campground, function(error, campground) {
          
        if (error) {
            
          req.flash('error', error.message);
          return res.redirect('back');
        }
        
        res.redirect('/campgrounds/' + campground.id);
      });
    });
});

router.get("/:id/edit",middleware.checkCampgroundOwnership, function(req, res) {
        
    campGround.findById(req.params.id, function(error, foundCamp) {

        res.render("campgrounds/edit", {camp: foundCamp});
    });
});

router.put("/:id", middleware.checkCampgroundOwnership, function(req, res) {
    
   campGround.findByIdAndUpdate(req.params.id, req.body.camp, function(error, updatedCamp) {
       
        if (error)
            console.log(error);
            
        else
            res.redirect("/campgrounds/" + req.params.id);
   });
});

router.delete("/:id", middleware.checkCampgroundOwnership, function(req, res) {
    
    campGround.findByIdAndRemove(req.params.id, function(error) {
        
        if (error)
            console.log(error);
            
        else
            res.redirect("/campgrounds");
    });
});

function escapeRegex(text) {
    
    return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
};

module.exports = router;
