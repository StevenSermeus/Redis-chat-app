const express = require('express');
const app = express();
const PORT = 5000;
const http = require('http');
const socketio = require('socket.io')
const Redis = require("ioredis");
const server = http.createServer(app);
const io = socketio(server).listen(server,{
    cors:{origin:"*"}
});
const client = new Redis.Cluster([{
    host: '127.0.0.1',
    port: 30001
},
    {
        host: '127.0.0.1',
        port: 30002
    },
    {
        host: '127.0.0.1',
        port: 30003
    },
    {
        host: '127.0.0.1',
        port: 30004
    },
    {
        host: '127.0.0.1',
        port: 30005
    },
    {
        host: '127.0.0.1',
        port: 30006
    }
]);

let messageId;

client.get("incr").then((messageIdBd)=>{messageId = messageIdBd});


app.set("view engine","ejs");


    io.on("connection", (socket) => {
        socket.on("joinRoom", ({username, room}) => {
            io.emit("join" + room, username);
	    console.time("timer");
            client.hgetall(room,(err, payloads)=>{
                if(!err) {
                    for (let payload in payloads) {
                        socket.emit(room, JSON.parse(payloads[payload]));
                    }
                }
		console.timeEnd("timer");
        console.log("il a fallut le temps si dessus")
            });
        });
        socket.on("leaveRoom", ({username, room}) => {
            io.emit("leave" + room, username);
        });

        socket.on("message", ({message, from, date, room}) => {
            let object = {'message':message,'from':from,'date':date};
            client.hset(room,messageId,JSON.stringify(object));
            messageId++;
            client.set("incr",messageId)
            io.emit(room, {from, message, date});
        });
    });

app.get("/",(req,res)=>{
    res.render("index");
});


app.get("/chat", (req, res) => {
    let username = req.query.username;
    let room = req.query.room;
    if(room == "" || username ==""){
        res.render("rien.ejs",{});
    }
    else{
        res.render("chat",{ username,room });
    }

});
app.get("/chatApp",(req,res)=>{
    res.render("index");
});

server.listen(PORT, ()=>{
    console.log("localhost:"+PORT);
});

app.get("/clearChat",(req,res)=>{
    client.nodes("master").map((node) => node.flushdb());
    messageId = 0;
});
