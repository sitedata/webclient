// 'use strict'; // to make UMD bundles work

self.window = { crypto: self.crypto || self.msCrypto }; // to make UMD bundles work

importScripts('/polyfill.min.js');
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
importScripts('/openpgp.min.js');
var openpgp = window.openpgp;
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
    }"use strict";

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
    
    var encryptContent = createAsyncFunction( /*#__PURE__*/regeneratorRuntime.mark(function _callee(data, publicKeys) {
        var options;
        return regeneratorRuntime.wrap(function _callee$(_context) {
            while (1) {
                switch (_context.prev = _context.next) {
                    case 0:
                        if (data) {
                            _context.next = 2;
                            break;
                        }
    
                        return _context.abrupt("return", null);
    
                    case 2:
                        options = {
                            data: data,
                            publicKeys: publicKeys.map(function (item) {
                                return openpgp.key.readArmored(item).keys[0];
                            })
                        };
                        return _context.abrupt("return", openpgp.encrypt(options).then(function (ciphertext) {
                            return ciphertext.data;
                        }));
    
                    case 4:
                    case "end":
                        return _context.stop();
                }
            }
        }, _callee, this);
    }));