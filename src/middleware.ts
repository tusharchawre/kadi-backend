import { Request, Response , NextFunction } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";


export const userMiddlware = (req: Request, res:Response , next: NextFunction) => {

    const header = req.headers["authorization"]

    const decoded = jwt.verify(header as string, process.env.JWT_password as string )

    if(decoded){
        if(typeof decoded === "string"){
            res.status(403).json({
                message : "You are not logged in"
            })
            return;
        }
        // @ts-ignore
        req.userId = (decoded as JwtPayload).id;
        next();
    }
    else{
        res.status(403).json({
            message: "You are not logged in"
        })
    }




}