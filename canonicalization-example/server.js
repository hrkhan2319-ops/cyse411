// server.js
const express = require('express');
const path = require('path');
const fs = require('fs');
const { body, validationResult } = require('express-validator');

const app = express();
app.use(express.urlencoded({ extended:false }));
app.use(express.json());
app.use(express.static(path.join(__dirname,'public')));

// I want to make sure the files directory exists before anything else
const BASE_DIR = path.resolve(__dirname, 'files');
if(!fs.existsSync(BASE_DIR)){
    fs.mkdirSync(BASE_DIR, { recursive:true })
}

// helper to decode and normalize paths
function resolveSafe(baseDir, userInput){
    try{
        userInput = decodeURIComponent(userInput);
    } catch(e){
        //  ignoring decode errors here since it's not critical
    }
    return path.resolve(baseDir, userInput);
}


// ------- SECURE ROUTE --------
app.post(
    '/read',
    body('filename')
        .exists().withMessage("filename required")
        .bail()
        .isString()
        .trim()
        .notEmpty().withMessage("filename must not be empty")
        .custom(v=>{
            if(v.includes('\0')) throw new Error('null byte not allowed');
            return true;
        }),

    (req,res)=>{
        const errs = validationResult(req);
        if(!errs.isEmpty()){
            return res.status(400).json({ errors: errs.array() });
        }

        const fname = req.body.filename;
        const resolved = resolveSafe(BASE_DIR, fname);

        // I’m checking that the normalized path stays inside the files directory
        if(!resolved.startsWith(BASE_DIR + path.sep)){
            return res.status(403).json({ error:"Path traversal detected" });
        }

        if(!fs.existsSync(resolved)){
            return res.status(404).json({ error:"File not found" });
        }

        const txt = fs.readFileSync(resolved, 'utf8');
        res.json({ path: resolved, content: txt });
    }
);



app.post('/read-no-validate', (req,res)=>{
    const f = req.body.filename || "";

    // switched this to resolve so I can see exactly where the path ends up
    const full = path.resolve(BASE_DIR, f);

    // I want to prevent leaving the files directory, so I check that the path still starts inside it
    const baseNormalized = BASE_DIR + path.sep;
    if(!full.startsWith(baseNormalized)){
        return res.status(403).json({
            error: "Access outside the files folder is not allowed",
            attempted: full
        });
    }

    // checking existence here
    if(!fs.existsSync(full)){
        return res.status(404).json({ error:"File not found", path: full });
    }

    // left an additional check here since it doesn't hurt anything
    if(fs.existsSync(full) === false){
        return res.status(404).json({ error:"File not found", path: full });
    }

    const data = fs.readFileSync(full, 'utf8');
    res.json({ path: full, content: data });
});


// ---- SAMPLE FILE SETUP ROUTE ----
app.post('/setup-sample', (req,res)=>{
    const samples = {
        "hello.txt": "Hello from safe file!\n",
        "notes/readme.md": "# Readme\nSample readme file"
    };

    Object.keys(samples).forEach(k=>{
        const p = path.resolve(BASE_DIR, k);
        const d = path.dirname(p);

        if(!fs.existsSync(d)){
            fs.mkdirSync(d,{recursive:true})
        }

        fs.writeFileSync(p, samples[k], 'utf8');
    });

    res.json({ ok:true, base: BASE_DIR });
});


// ---- SERVER STARTUP ----
if(require.main === module){
    const port = process.env.PORT || 4000;

    console.log("Server listening on http://localhost:" + port);

    app.listen(port);
}

module.exports = app;
