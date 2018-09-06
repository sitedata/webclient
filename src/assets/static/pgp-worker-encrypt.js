'use strict'; // to make UMD bundles work

self.window = {crypto: self.crypto}; // to make UMD bundles work

importScripts('/openpgp.min.js');
var openpgp = window.openpgp;


onmessage = function onmessage(event) {
    if (event.data.encrypt) {
        encryptContent(event.data.content, event.data.publicKeys).then(function (data) {
            postMessage({ encryptedContent: data, encrypted: true, callerId: event.data.callerId });
        });
    } else if (event.data.encryptSecureMessageReply) {
        encryptContent(event.data.content, event.data.publicKeys).then(function (data) {
            postMessage({ encryptedContent: data, encryptSecureMessageReply: true });
        });
    }
};

function encryptContent (data, publicKeys) {
    return new Promise(function(resolve, reject){
        if (!data) {
            resolve(null);
        }
        const options = {
            data: data,
            publicKeys: publicKeys.map(function(item){ return openpgp.key.readArmored(item).keys[0];})
        };
        
        openpgp.encrypt(options).then(function(ciphertext) {
            resolve(ciphertext.data);
        })
    })
}