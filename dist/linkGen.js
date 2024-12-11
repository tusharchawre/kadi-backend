"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.linkGen = void 0;
const linkGen = () => {
    let string = "qwertyuiopasdfghjklzxcvbnm1234567890";
    let a = "";
    for (let i = 0; i < 7; i++) {
        a += string[Math.floor(Math.random() * 36)];
    }
    return a;
};
exports.linkGen = linkGen;
