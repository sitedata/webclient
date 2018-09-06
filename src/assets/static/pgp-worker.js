'use strict';

self.window = { crypto: self.crypto || self.msCrypto }; // to make UMD bundles work

importScripts('/openpgp.min.js');
var openpgp = window.openpgp;

var decryptedPrivKeyObj;
var decryptedSecureMsgPrivKeyObj;


onmessage = function onmessage(event) {
    if (event.data.clear) {
        decryptedPrivKeyObj = null;
    }
    else if (event.data.generateKeys) {
        generateKeys(event.data.options).then(function (data) {
            postMessage({generateKeys: true, keys: data, callerId: event.data.callerId, forEmail: !!event.data.forEmail});
        })
    }
    else if (event.data.decryptSecureMessageKey) {
	    decryptedSecureMsgPrivKeyObj = openpgp.key.readArmored(event.data.privKey).keys[0];
	    decryptedSecureMsgPrivKeyObj.decrypt(event.data.password)
		    .then(function (res) {
			    postMessage({decryptSecureMessageKey: true, decryptedKey: decryptedSecureMsgPrivKeyObj});
		    })
		    .catch(function (error) {
			    postMessage({ decryptSecureMessageKey: true, error: error.message});
		    });
    }
    else if (event.data.decryptSecureMessageContent) {
	    if (!event.data.content) {
		    postMessage({decryptedContent: event.data.content, decryptSecureMessageContent: true});
	    } else {
		    decryptContent(event.data.content, decryptedSecureMsgPrivKeyObj).then(function (data) {
			    postMessage({decryptedContent: data, decryptSecureMessageContent: true});
		    })
	    }
    }
    else if (!decryptedPrivKeyObj) {
        decryptedPrivKeyObj = openpgp.key.readArmored(event.data.privkey).keys[0];
        decryptedPrivKeyObj.decrypt(event.data.user_key);
        postMessage({ key: decryptedPrivKeyObj});
    }
    else if (event.data.decrypt) {
        if (!event.data.content) {
            postMessage({decryptedContent: event.data.content, decrypted: true, callerId: event.data.callerId});
        } else {
            decryptContent(event.data.content, decryptedPrivKeyObj).then(function (data) {
                postMessage({decryptedContent: data, decrypted: true, callerId: event.data.callerId});
            })
        }
    }
}

function decryptContent(data, privKeyObj) {
    var options = {
        message: openpgp.message.readArmored(data),
        privateKeys: [privKeyObj]
    };

    return openpgp.decrypt(options).then(function (plaintext) {
        return plaintext.data;
    }).catch(function (error) {
        console.log(error);
        return error;
    })
}

function generateKeys(options) {
    return openpgp.generateKey(options).then(function (key) {
        return {
            public_key: key.publicKeyArmored,
            private_key: key.privateKeyArmored,
            fingerprint: openpgp.key.readArmored(key.publicKeyArmored).keys[0].primaryKey.getFingerprint()
        };
    });
}

