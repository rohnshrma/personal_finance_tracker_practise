//imports//
const express = require("express")
const app = express()
const bodyParser = require('body-parser')
const mongoose = require("mongoose")
const bcrypt = require("bcrypt")
//step 1
const session = require("express-session")
const { name } = require("ejs")






const PORT = process.env.PORT || 3000
//mongoose and app server setup//
const mongo_url = "mongodb+srv://tannushree:admin_tannushree@cluster0.tq26bem.mongodb.net/financeTrackerDB"
mongoose.connect(mongo_url)
    .then(() => {
        console.log("database connected");
        app.listen(PORT, () => {
            console.log("Server Started on port:", PORT);


        })
    })
    .catch((err) => {
        console.log(err);

    })

//middleware
//===
app.use(bodyParser.urlencoded({ extended: true }))
app.set("view engine", "ejs")
app.use(express.static("public"))


//step 2 setup session allow request to access session and store info if they need to
app.use(session({
    secret: "hello world",
    resave: false,
    saveUninitialized: false
}))
//Schema
//====

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    }
})

const expenseSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        minLength: 3
    },
    category: {
        type: String,
        required: true


    },
    amount: {
        type: Number,
        required: true
    }
})

//model
const User = new mongoose.model("user", userSchema)
const Expense = new mongoose.model("expense", expenseSchema)
//==





//function to check if the userid is in our browser to confirm if the user is logged in or not
const isLoggedIn = (req, res, next) => {
    if (req.session.userId) {
        next()

    }
    else {
        res.redirect("/login")
    }

}

//===rotues
app.get("/", (req, res) => {
    Expense.find({})
        .then((foundExpenses) => {
            console.log(foundExpenses);
            if (foundExpenses.length > 0) {
                res.render("dashboard", {
                    data: foundExpenses.reverse()
                })
            } else {
                res.render("dashboard", {
                    data: "No Expenses Found"
                })
            }

        })

        .catch((error) => {
            console.log(error);

        })


})


app.get("/login", (req, res) => {
    res.render("login.ejs")

})

app.post("/login", (req, res) => {
    var email = req.body.useremail
    var pass = req.body.password

    User.find({ email: email })
        .then((foundUser) => {
            if (foundUser.length == 0) {
                res.send("no user found");
                return;
            }
            else {
                //bcrypting password then storing the bcrypting password in the database//
                //once you login with correct details it says login successfully if wrong entred then password doesnt match //
                bcrypt.compare(pass, foundUser[0].password).then(function (result) {
                    if (result == true) {
                        console.log(foundUser[0]);
                        //step 4: once we enter correct details then it shows us the id that this user is registred with this id//
                        req.session.userId = foundUser[0].id
                        res.redirect("/");
                    }

                    else {
                        res.send("password doesn't not match");
                    }
                });
            }
        })


})



app.get("/logout", (req, res) => {
    res.send("logged out");

})

app.get("/signup", (req, res) => {
    res.render("signup")

})


app.post("/signup", (req, res) => {
    var name = req.body.username
    var email = req.body.useremail
    var pass = req.body.password

    //--putting info into the database//
    //converting password to hash after inputing the data//

    bcrypt.hash(pass, 10, function (err, hash) {
        if (err) {
            console.log(err);
            res.render('404.ejs')
        }
        else {
            const new_user = new User({
                username: name,
                email: email,
                password: hash
            })
            //after storing a new user in database//
            new_user.save()
                .then((user) => {
                    //step 3: save data in browse
                    //store the _id of the user created with the name userId
                    console.log(user);
                    req.session.userId = user._id
                    res.redirect("/")
                    console.log(new_user);
                })
                .catch((err) => {
                    console.log(err);
                    res.redirect("/login")
                })
        }
    });
})

app.get("/addExpense", isLoggedIn, (req, res) => {
    res.render("addExpense")

})


app.post("/addExpense", (req, res) => {
    console.log(req.body);
    var name = req.body.name
    var amount = req.body.amount
    var category = req.body.category
    const expense = new Expense({
        name: name,
        amount: amount,
        category: category

    })
    expense.save()
        .then((expense) => {
            console.log("expense added successfully => ", expense);
            res.redirect("/");

        })
        .catch((error) => {
            console.log(error);
            res.render("404.ejs");

        })

})

// category route
app.get("/category/:category?", (req, res) => {
    // text written after "category/" will be accessed using req.params.category and then stored in selected_category 
    const selected_category = req.params.category
    // if the user enters a category then filter will be an object {category : selected_category}, if he doesn't it will be 
    // an empty object {}

    console.log("category => ", selected_category);

    const filter = selected_category ? { category: selected_category } : {}
    console.log("filter =>", filter);

    Expense.find(filter)
        .then((foundExpenses) => {
            console.log(foundExpenses);
            if (foundExpenses.length > 0) {
                res.render("dashboard", {
                    data: foundExpenses.reverse()
                })
            } else {
                res.render("dashboard", {
                    data: "No Expenses Found"
                })
            }
        })
        .catch((err) => {
            console.log(err);
        })
})

app.get("/delete/:id", (req, res) => {
    const expenseId = req.params.id;
    Expense.findByIdAndRemove(expenseId)
        .then((deletedItem) => {
            console.log("deleted successfully => ", deletedItem);
            res.redirect("/")
        })
        .catch((err) => {
            console.error("Error deleting expense => ", err)
        })
})