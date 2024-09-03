const express = require("express");
const {randomBytes} = require('crypto')
const cors = require('cors')
const axios = require('axios')

const app = express();
app.use(cors())
app.use(express.json())
app.use(express.urlencoded({extended:true}))
const commentsByPostId = {};

app.get("/posts/:id/comments", (req, res) => {
    res.send(commentsByPostId[req.params.id] || [])
});

app.post("/posts/:id/comments", async (req, res) => {
    const commentId = randomBytes(4).toString('hex');
    const postId = req.params.id;
    const {content} = req.body;

    const comments = commentsByPostId[postId] || [];
    comments.push({id:commentId, content, status: 'pending'});
    commentsByPostId[postId] = comments;
    await axios.post('http://localhost:4005/events',{
      type:'CommentCreated',
      data:{
        id:commentId,
        content,    
        postId,
        status:'pending'
      }
    }).catch((err) => {
      console.log(err.message);
    });
    res.status(201).send(comments)
});

app.post('/events',async(req,res)=>{
  console.log('Recieved ',req.body.type)
  const {type,data} = req.body
  if(type==='CommentModerated') {
    const {postId,id,status,content} = data;
    const comments = commentsByPostId[postId];
    const comment = comments.find(comment=>{
      return comment.id === id;
    })
    comment.status = status
    await axios.post('http://localhost:4005/events',{
      type:'CommentUpdated',
      data:{
        id,
        postId,
        status,
        content
      }
    }).catch(err=>{
      console.log(err.message)
    })
  }
  res.send({})
})

app.listen(4001, () => {
  console.log("Listening on port 4001");
});