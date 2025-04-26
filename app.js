const env = require('env');
const express = require('express');
const session = require('express-session');
const passport = require('passport');
const DiscordStrategy = require('passport-discord').Strategy;
require('dotenv').config(); // Load environment variables from .env file

const app = express();

// Configure session middleware
app.use(session({
    secret: 'your-secret-key', // Replace with a secure secret
    resave: false, // Prevents resaving session if it hasn't been modified
    saveUninitialized: false, // Prevents saving uninitialized sessions
    cookie: { secure: false } // Set to true if using HTTPS
}));

// Initialize Passport
app.use(passport.initialize());
app.use(passport.session());

// Serialize and deserialize user
passport.serializeUser((user, done) => {
    // Store the entire user profile in the session
    done(null, user);
});

passport.deserializeUser((user, done) => {
    // Retrieve the user profile from the session
    done(null, user);
});

// Configure Passport with Discord strategy
passport.use(new DiscordStrategy({
    clientID: process.env.clientId || "fuckshyt",
    clientSecret: process.env.clientSecret || "fuckshyt", // Replace with your Discord app's client secret
    callbackURL: 'http://localhost:3000/auth/discord/callback', // Replace with your callback URL
    scope: ['identify', 'email', 'guilds'] // 'guilds' scope is required to fetch guilds
}, (accessToken, refreshToken, profile, done) => {
    // Filter guilds where the user is an admin or manager
    if (profile.guilds) {
        profile.guilds = profile.guilds.filter(guild => {
            const permissions = BigInt(guild.permissions);
            const ADMINISTRATOR = BigInt(0x8);
            const MANAGE_GUILD = BigInt(0x20);
            return (permissions & ADMINISTRATOR) === ADMINISTRATOR || (permissions & MANAGE_GUILD) === MANAGE_GUILD;
        });
    }
    return done(null, profile);
}));

// Routes
app.get('/', (req, res) => {
    res.render('index', { user: req.user });
});

app.get('/auth/discord', passport.authenticate('discord'));

app.get('/auth/discord/callback', passport.authenticate('discord', {
    failureRedirect: '/'
}), (req, res) => {
    // Successful authentication
    req.session.save(() => { // Explicitly save the session
        res.redirect('/');
    });
});

app.get('/logout', (req, res) => {
    req.logout(() => {
        req.session.destroy(() => { // Destroy the session on logout
            res.redirect('/');
        });
    });
});

// Set up EJS as the view engine
app.set('view engine', 'ejs');

// Start the server
app.listen(3000, () => {
    console.log('Server is running on http://localhost:3000');
});