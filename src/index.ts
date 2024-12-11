import { PrismaClient } from "@prisma/client"
import express from "express"
import bcrypt from "bcrypt"
import jwt from "jsonwebtoken"
import 'dotenv/config'
import { userMiddlware } from "./middleware"
import { linkGen } from "./linkGen"

require('dotenv').config()



const app = express()

const client = new PrismaClient()

app.use(express.json());

app.post("/api/v1/user/register", async (req, res)=>{
    const username = req.body.username
    const password = req.body.password
    const email =  req.body.email

    const hashedPassword = await bcrypt.hash(password, 10)
    const user  =  await client.user.create({
        data:{
            email : email,
            name: username,
            password: hashedPassword
        }
    })

    res.json({
        message : "User Created Succesfully"
    })

})

app.post("/api/v1/user/login",  async (req,res)=>{
    const username = req.body.username
    const password = req.body.password

    const user = await client.user.findFirst({
        where: {
            name : username
        }
    })

    if(!user){
        res.json({
            message: "User doesnt exisy"
        })
        return;}
    

        const passwordCheck = await bcrypt.compare(password, user.password);

        const token = await jwt.sign({
            id: user.id
        }, process.env.JWT_password as string)

        if(passwordCheck){
            res.json({
                token
            })
        }
        else{
            res.json({
                message: "Invalid Credentials"
            })
        }
        
    }
)

app.post("/api/v1/content", userMiddlware, async (req, res) => {
    const { link, type, title } = req.body;
  
    try {
      await client.content.create({
        data: {
          link,
          type,
          title,
          userId: req.userId
        },
      });
  
      res.status(201).json({ 
        message: "Content created successfully!" 
    });
    } catch (error) {
      console.error(error);
      res.status(500).json({ 
        error: "An error occurred while creating content." 
    });
    }
  });
  
  app.get("/api/v1/content", userMiddlware , async (req, res) => {
    // @ts-ignore
    const userId = req.userId;
  
    try {
      const content = await client.content.findMany({
        where: {
          userId: userId,
        },
        include: {
          user: {
            select: {
              name: true,
            },
          },
        },
      });
  
      res.json({ content });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "An error occurred while fetching content." });
    }
  });
  
  app.delete("/api/v1/content", userMiddlware, async (req, res)=>{
    const contentId = req.body.contentId;

    await client.content.deleteMany({
        where: {
            id: contentId
        }
    })

    res.json({
        message: "Deleted"
    })
  })


  app.post("/api/v1/user/sharelink",userMiddlware,  async (req,res)=>{
    const share = req.body.share

    if(share){
      const hash  = await client.link.create({
        data:{
          userId: req.userId,
          hash: linkGen()
        }
      })

      res.json({
        hash
      })
    }
    else{
      client.link.delete({
        where:{
          id:  req.userId
        }
      })
      res.json({
        message: "The link was deleted"
      })
    }



  })


  app.get("/api/v1/user/:shareLink", async ( req, res)=>{
    const shareLink =  req.params.shareLink

    const link = await client.link.findFirst({
      where:{
        hash: shareLink
      }
    })

    if(!link){
      res.status(411).json({
        message: "This link is private"
      })
      return;
    }

    const content = await client.content.findMany({
      where:{
        userId : link.userId
      }
    })

    const user = await client.user.findFirst({
      where: {
        id: link.userId
      }
    })

    if(!user){
      res.json({
        message: "User not found, error should ideally not happen"
      })
      return;
    }

    res.json({
      username: user.name,
      content: content
    })



  })

app.listen(3000)