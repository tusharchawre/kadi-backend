"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const express_1 = __importDefault(require("express"));
const bcrypt_1 = __importDefault(require("bcrypt"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
require("dotenv/config");
const middleware_1 = require("./middleware");
const linkGen_1 = require("./linkGen");
require('dotenv').config();
const app = (0, express_1.default)();
const client = new client_1.PrismaClient();
app.use(express_1.default.json());
app.post("/api/v1/user/register", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const username = req.body.username;
    const password = req.body.password;
    const email = req.body.email;
    const hashedPassword = yield bcrypt_1.default.hash(password, 10);
    const user = yield client.user.create({
        data: {
            email: email,
            name: username,
            password: hashedPassword
        }
    });
    res.json({
        message: "User Created Succesfully"
    });
}));
app.post("/api/v1/user/login", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const username = req.body.username;
    const password = req.body.password;
    const user = yield client.user.findFirst({
        where: {
            name: username
        }
    });
    if (!user) {
        res.json({
            message: "User doesnt exisy"
        });
        return;
    }
    const passwordCheck = yield bcrypt_1.default.compare(password, user.password);
    const token = yield jsonwebtoken_1.default.sign({
        id: user.id
    }, process.env.JWT_password);
    if (passwordCheck) {
        res.json({
            token
        });
    }
    else {
        res.json({
            message: "Invalid Credentials"
        });
    }
}));
app.post("/api/v1/content", middleware_1.userMiddlware, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { link, type, title } = req.body;
    try {
        yield client.content.create({
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
    }
    catch (error) {
        console.error(error);
        res.status(500).json({
            error: "An error occurred while creating content."
        });
    }
}));
app.get("/api/v1/content", middleware_1.userMiddlware, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    // @ts-ignore
    const userId = req.userId;
    try {
        const content = yield client.content.findMany({
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
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: "An error occurred while fetching content." });
    }
}));
app.delete("/api/v1/content", middleware_1.userMiddlware, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const contentId = req.body.contentId;
    yield client.content.deleteMany({
        where: {
            id: contentId
        }
    });
    res.json({
        message: "Deleted"
    });
}));
app.post("/api/v1/user/sharelink", middleware_1.userMiddlware, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const share = req.body.share;
    if (share) {
        const hash = yield client.link.create({
            data: {
                userId: req.userId,
                hash: (0, linkGen_1.linkGen)()
            }
        });
        res.json({
            hash
        });
    }
    else {
        client.link.delete({
            where: {
                id: req.userId
            }
        });
        res.json({
            message: "The link was deleted"
        });
    }
}));
app.get("/api/v1/user/:shareLink", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const shareLink = req.params.shareLink;
    const link = yield client.link.findFirst({
        where: {
            hash: shareLink
        }
    });
    if (!link) {
        res.status(411).json({
            message: "This link is private"
        });
        return;
    }
    const content = yield client.content.findMany({
        where: {
            userId: link.userId
        }
    });
    const user = yield client.user.findFirst({
        where: {
            id: link.userId
        }
    });
    if (!user) {
        res.json({
            message: "User not found, error should ideally not happen"
        });
        return;
    }
    res.json({
        username: user.name,
        content: content
    });
}));
app.listen(3000);
