const express = require("express");
const cors = require("cors");
const { v4: uuid } = require("uuid");

const app = express();

app.use(cors());
app.use(express.json());

const scripts = {};

app.post("/save", (req,res)=>{

    const id = uuid();

    scripts[id] = req.body.code;

    res.json({
        success:true,
        id:id
    });
});

app.get("/raw/:id",(req,res)=>{

    const code = scripts[req.params.id];

    if(!code)
        return res.status(404).send("Not Found");

    res.send(code);
});

app.listen(3000);
