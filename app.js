//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const mongodb = require("mongodb");
const _ = require("lodash");

mongoose.set('strictQuery', true);


const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));


mongoose.connect("mongodb://localhost:27017/todolistDB", {useNewUrlParser: true});


const itemsSchema = {
  name: String
};

const Item = mongoose.model("Item", itemsSchema);


const item1 = new Item({
  name: "Code"
});

const item2 = new Item({
  name: "Sleep"
});

const item3 = new Item({
  name: "College"
});

const defaultItems = [item1, item2, item3];

const listSchema = {
  name: String,
  items: [itemsSchema]
};

const List = mongoose.model("list", listSchema);

app.get("/", function(req, res) {

  Item.find({}, function(err, foundItems){

    if(foundItems.length == 0){
      Item.insertMany(defaultItems, function(err){
        if(err){
          console.log(err);
        }else{
          console.log("Successfully added to the DB.");
        }
        res.redirect("/");
      });
    }else{
      res.render("list", {listTitle: "Today", newListItems: foundItems});
    }
    
  });

});

app.get("/:customListName", function(req, res){
  
  const customListName = _.capitalize(req.params.customListName)

  
  List.findOne({name: customListName}, function(err, result){
     if(!err){
      if(!result){

        const list = new List({
          name: customListName,
          items: defaultItems
        });
      
        list.save();
        res.redirect("/" + customListName);
      
      }else{
        
        res.render("list", {listTitle: result.name, newListItems: result.items});
        
      }
     }
  });



});

app.post("/", function(req, res){

  const itemName = req.body.newItem;
  const listName = req.body.list;

  const item = new Item({
    name: itemName
  });


  if(listName === "Today"){
    item.save();
    res.redirect("/");
  }else{
    List.findOne({name: listName}, function(err, foundList){
      if(!err){
        foundList.items.push(item);
        foundList.save();
        res.redirect("/" + listName);
      } 
    });
  }

  
});

app.post("/delete", function(req, res){

  const checkbox = req.body.checkbox;
  const listName = req.body.listName;

  if(listName === "Today"){
    Item.findByIdAndRemove(checkbox, function(err){
      if(err){
        console.log(err);
      }else{
        console.log("Successfully deleted the item from DB.");
        res.redirect("/");
      } 
    }); 
  }else{
    List.findOneAndUpdate({name: listName}, {$pull: {items: {_id: checkbox}}}, function(err, foundItems){
      if(!err){
        res.redirect("/" + listName);
      }else{
        console.log(err)
      }
    });
  }
  
});


app.get("/about", function(req, res){
  res.render("about");
});

app.listen(3000, function() {
  console.log("Server started on port 3000");
});
