"use strict"; // to make UMD bundles work

self.window = { crypto: self.crypto || self.msCrypto }; // to make UMD bundles work

importScripts('/polyfill.min.js');
importScripts('/openpgp.compat.js');

function createAsyncFunction(fn) {
    return function () {
        var gen = fn.apply(this, arguments);
        return new Promise(function (resolve, reject) {
        function step(key, arg) {
            try {
            var info = gen[key](arg);
            var value = info.value;
            } catch (error) {
            reject(error);
            return;
            }
            if (info.done) {
            resolve(value);
            } else {
            return Promise.resolve(value).then(function (value) {
                step("next", value);
            }, function (err) {
                step("throw", err);
            });
            }
        }
        return step("next");
        });
    };
}

var openpgp = window.openpgp;

var decryptedPrivKeyObj;
var decryptedSecureMsgPrivKeyObj;

onmessage = function onmessage(event) {
    initDecrypt(event);
};

var initDecrypt = createAsyncFunction( /*#__PURE__*/regeneratorRuntime.mark(function _callee(event) {
    return regeneratorRuntime.wrap(function _callee$(_context) {
        while (1) {
            switch (_context.prev = _context.next) {
                case 0:
                    if (!event.data.clear) {
                        _context.next = 4;
                        break;
                    }

                    decryptedPrivKeyObj = null;
                    _context.next = 28;
                    break;

                case 4:
                    if (!event.data.generateKeys) {
                        _context.next = 8;
                        break;
                    }

                    generateKeys(event.data.options).then(function (data) {
                        postMessage({ generateKeys: true, keys: data, callerId: event.data.callerId, forEmail: !!event.data.forEmail });
                    });
                    _context.next = 28;
                    break;

                case 8:
                    if (!event.data.decryptSecureMessageKey) {
                        _context.next = 15;
                        break;
                    }

                    _context.next = 11;
                    return openpgp.key.readArmored(event.data.privKey);

                case 11:
                    decryptedSecureMsgPrivKeyObj = _context.sent.keys[0];

                    decryptedSecureMsgPrivKeyObj.decrypt(event.data.password).then(function (res) {
                        postMessage({ decryptSecureMessageKey: true, decryptedKey: decryptedSecureMsgPrivKeyObj });
                    }).catch(function (error) {
                        postMessage({ decryptSecureMessageKey: true, error: error.message });
                    });
                    _context.next = 28;
                    break;

                case 15:
                    if (!event.data.decryptSecureMessageContent) {
                        _context.next = 19;
                        break;
                    }

                    if (!event.data.content) {
                        postMessage({ decryptedContent: event.data.content, decryptSecureMessageContent: true });
                    } else {
                        decryptContent(event.data.content, decryptedSecureMsgPrivKeyObj).then(function (data) {
                            postMessage({ decryptedContent: data, decryptSecureMessageContent: true });
                        });
                    }
                    _context.next = 28;
                    break;

                case 19:
                    if (decryptedPrivKeyObj) {
                        _context.next = 27;
                        break;
                    }

                    _context.next = 22;
                    return openpgp.key.readArmored(event.data.privkey);

                case 22:
                    decryptedPrivKeyObj = _context.sent.keys[0];

                    decryptedPrivKeyObj.decrypt(event.data.user_key);
                    postMessage({ key: decryptedPrivKeyObj });
                    _context.next = 28;
                    break;

                case 27:
                    if (event.data.decrypt) {
                        if (!event.data.content) {
                            postMessage({ decryptedContent: event.data.content, decrypted: true, callerId: event.data.callerId });
                        } else {
                            decryptContent(event.data.content, decryptedPrivKeyObj).then(function (data) {
                                postMessage({ decryptedContent: data, decrypted: true, callerId: event.data.callerId });
                            });
                        }
                    }

                case 28:
                case "end":
                    return _context.stop();
            }
        }
    }, _callee, this);
}));

var decryptContent = createAsyncFunction( /*#__PURE__*/regeneratorRuntime.mark(function _callee2(data, privKeyObj) {
    var options;
    return regeneratorRuntime.wrap(function _callee2$(_context2) {
        while (1) {
            switch (_context2.prev = _context2.next) {
                case 0:
                    _context2.next = 2;
                    return openpgp.message.readArmored(data);

                case 2:
                    _context2.t0 = _context2.sent;
                    _context2.t1 = [privKeyObj];
                    options = {
                        message: _context2.t0,
                        privateKeys: _context2.t1
                    };
                    return _context2.abrupt("return", openpgp.decrypt(options).then(function (plaintext) {
                        return plaintext.data;
                    }));

                case 6:
                case "end":
                    return _context2.stop();
            }
        }
    }, _callee2, this);
}));

function generateKeys(options) {
    // return openpgp.generateKey(options).then(key => {
    //     return {
    //         public_key: key.publicKeyArmored,
    //         private_key: key.privateKeyArmored,
    //         fingerprint: openpgp.key.readArmored(key.publicKeyArmored).keys[0].primaryKey.getFingerprint()
    //     };
    // });
}