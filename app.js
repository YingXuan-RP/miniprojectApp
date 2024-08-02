const express = require('express');
const mysql = require('mysql2');
const multer = require('multer');
const app = express();
const port = 3000;

//Set up multer
const storage = multer.diskStorage({
    destination:  (req, file, cb) => {
        cb(null, 'public/images');
    },
    filename:  (req, file, cb) => {
        cb(null,file.originalname);
    }
});
const upload = multer({ storage: storage });

app.set('view engine','ejs');
app.use(express.urlencoded({ extended: false }));
app.use(express.static('public'));

// Create MySQL connection
const connection = mysql.createConnection({
    host: 'db4free.net',
    user: 'yxminiproject',
    password: 'Sunflowerlodge0311',
    database: 'yxminiproject'
});
    connection.connect((err) => {
    if (err) {
    console.error('Error connecting to MySQL:', err);
    return;
    }
    console.log('Connected to MySQL database');
});


//------------------------------------------Index

app.get('/', (req, res) => {
    res.render('index');
  });

//---------------------------------------Log out 
app.get('/logout',function(req,res){
    loggedin = false;
    res.redirect('/');
});


//---------------------------------------Sign up
// Sign up 
app.get('/signupForm',function(req,res){
    res.render('signup');
});

app.post('/signupForm',function(req,res){
    const {email,username,password,confirmpassword,role,sector} = req.body;

    if (password !== confirmpassword){
        res.send('Passwords do not match');
    }

    const sql = 'SELECT * FROM users WHERE email = ? OR username = ?';
    connection.query(sql, [email,username], (error, result) => {
        if (error) {
            console.error('Database query error:', error.message);
            return res.status(500).send('Error checking for existing user');
        }
        if (result.length > 0) {
            return res.send('User already exists');
        }
        const sql = 'INSERT INTO users(email,username,password,role,sector) VALUES(?,?,?,?,?)';
        connection.query(sql, [email,username,password,confirmpassword,role,sector], (error, result) => {
            if (error) {
                console.error('Error adding user:', error.message);
                return res.status(500).send('Error adding user');
            }
            res.redirect('/loginForm');
        });
    }
    );
});

//------------------------------------------Login
let loggedin = false;
// Login page
app.get('/loginForm',function(req,res){
    res.render('login');
});

app.post('/loginForm',function(req,res){
    const { username,password } = req.body;
    const sql = 'SELECT * FROM users WHERE username = ? AND password = ?';
    connection.query(sql, [username,password], (error, result) => {
        if (error) {
            console.error('Database query error:', error.message);
            return res.status(500).send('Error checking for existing user');
        }
        if (result.length > 0) {
            loggedin = true;
            res.redirect('/dashboard');
        } else {
            res.send('Incorrect username or password');
        }
    });
});

//------------------------------------Dashboard
app.get('/dashboard', (req, res) => {
    if (loggedin){
        res.render('dashboard');
    }
    else{
        res.redirect('/loginForm');
    }
});







//------------------------------------Plan

app.get('/plan',function(req,res){
    res.render('plan');
});




//Companies

app.get('/companies',(req,res) =>{
    const sql = 'SELECT * FROM startup_company';
    connection.query(sql, (error, results) => {
    if (error) {
        console.error('Database query error:', error.message);
        return res.status(500).send('Error Retirving company');
    }
    res.render('companies', {company: results});
    });
});

app.get('/company/:id', (req, res) => {
    const companyId = req.params.id;
    const sql = 'SELECT * FROM startup_company WHERE companyId = ?';
    connection.query(sql,[companyId], (error, results) => {
        if (error) {
            console.error('Database query error:', error.message);
            return res.status(500).send('Error Retrieving  company');
        }
        if (results.length > 0 ){
            res.render('companies', {  company: results[0] });
        } else {
            res.status(404).send('Company not found');
        }
    });
});


//Add company
app.get('/addCompany',(req,res) => {
    res.render('addCompany');
});

app.post('/addCompany',upload.single('file'),(req,res) => {
    const {companyname,companytype,country,industry,overview,
        fundsneeded,investmenttype} = req.body;
    let file;
    if (req.file) {
        file = req.file.filename;
    } else {
        file = null;
    }
    const sql = 'INSERT INTO startup_company(companyname,companytype,country,industry,overview,fundsneeded,investmenttype,file) VALUES(?,?,?,?,?,?,?,?)';
    connection.query(sql,[companyname,companytype,country,industry,overview,fundsneeded,investmenttype,file],(error,result) => {
        if (error) {
            console.error('Error adding company:',error.message);
            return res.status(500).send('Error adding company');
        } else {
        res.redirect('/companies');
        }
    });
});



//Update company
app.get('/updateCompany/:id',(req,res) => {
    const companyId = req.params.id;
    const sql = 'SELECT * FROM startup_company WHERE companyId = ?';
    connection.query(sql,[companyId],(error,results) => {
        if (error) {
            console.error('Datbase query error:',error.message);
            return res.status(500).send('Error Retrieving company by ID');
        }
        if (results.length > 0) {
            res.render('updateCompany',{company:results[0]});
        } else {
            res.status(404).send('Company not found');
        }
    });
});

app.post('/updateCompany/:id',upload.single('file'),(req,res) => {
    const companyId = req.params.id;
    const {companyname,companytype,country,industry,overview,
        fundsneeded,investmenttype} = req.body;
    let file = req.body.currentFile;
    if (req.file) {
        file = req.file.filename;
    } 
    const sql = 'UPDATE startup_company SET companyname = ?,companytype = ?,country = ?,industry = ?,overview = ?,fundsneeded = ?,investmenttype = ?,file = ? WHERE companyId = ?';
    connection.query(sql,[companyname,companytype,country,industry,overview,fundsneeded,investmenttype,file,companyId],(error,result) => {
        if (error) {
            console.error('Error updating company:',error.message);
            return res.status(500).send('Error updating company');
        } else {
        res.redirect('/companies');
        }
    });
});




 
//Deleting company
app.get('/deleteCompany/:id', (req, res) => {
    const companyId = req.params.id;
    const sql = 'DELETE FROM startup_company WHERE companyId = ?';
    connection.query(sql, [companyId], (error, result) => {
        if (error) {
            console.error('Error deleting company:', error);
            return res.status(500).send('Error deleting company');
        }else {
        res.redirect('/companies');
        }
    });
});
    







//Start the server and listen on the specified port
app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
});
    







  