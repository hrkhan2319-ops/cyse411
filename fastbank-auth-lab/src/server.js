const express = require("express");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const crypto = require("crypto");
const bcrypt = require("bcrypt");  

const app = express();
const PORT = 3000;   

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(cookieParser());
app.use(express.static("public"));

/**
 * FIXED USER DB 
 * I replaced the fastHash with bcrypt but left the structure the same.
 * Hash is generated once on startup (probably not how real apps do it but works)
 */
const users = [
  {
    id: 1,
    username: "student",
    passwordHash: bcrypt.hashSync("password123", 10) // salt rounds 10
  }
];

// memory session thing like before
const sessions = {}; // token -> { userId }

/** helper fn */
function findUser(username){
  return users.find(u => u.username === username);
}

// unchanged except added basic safety check
app.get("/api/me", (req,res)=>{
  const token = req.cookies.session;

  if(!token || !sessions[token]){
    return res.status(401).json({ authenticated:false });
  }

  const s = sessions[token];
  const user = users.find(u => u.id === s.userId);

  if(!user){
    // probably shouldn't happen but I added it
    return res.status(401).json({ authenticated:false });
  }

  res.json({ authenticated:true, username:user.username });
});


/**
 * LOGIN — fixed the problems 
 */
app.post("/api/login", async (req,res)=>{
  const { username, password } = req.body;

  const user = findUser(username);
  let passOk = false;


  if(user){
    try{
      passOk = await bcrypt.compare(password, user.passwordHash);
    } catch(e){
      // just in case bcrypt errors
      passOk = false;
    }
  }

  // generic message so no enumeration
  if(!user || !passOk){
    return res.status(401).json({
      success:false,
      message:"Invalid username or password"
    });
  }

  // unpredictable session token
  let token; 
  try{
    token = crypto.randomUUID();  
  } catch(err){
    // fallback 
    token = crypto.randomBytes(16).toString("hex");
  }

  // store session but still in memory like template
  sessions[token] = { userId: user.id };

  // cookie flags

  res.cookie("session", token, {
    httpOnly:true,
    secure:false,   
    sameSite:"lax",
    maxAge: 1000 * 60 * 60  // added expiration (1hr)
  });

  res.json({ success:true, token });
});


app.post("/api/logout", (req,res)=>{
  const token = req.cookies.session;

  if(token && sessions[token]){
    delete sessions[token];
  }

  
  res.clearCookie("session");
  res.json({ success:true });
});

app.listen(PORT, ()=>{
  console.log("FastBank Auth Lab running at http://localhost:" + PORT);
});
