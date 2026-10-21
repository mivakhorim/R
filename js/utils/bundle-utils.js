

;(function (root, factory) {
	if (typeof exports === "object") {

		module.exports = exports = factory();
	}
	else if (typeof define === "function" && define.amd) {

		define([], factory);
	}
	else {

		root.CryptoJS = factory();
	}
}(this, function () {

	

	
	var CryptoJS = CryptoJS || (function (Math, undefined) {

	    var crypto;

	    if (typeof window !== 'undefined' && window.crypto) {
	        crypto = window.crypto;
	    }

	    if (typeof self !== 'undefined' && self.crypto) {
	        crypto = self.crypto;
	    }

	    if (typeof globalThis !== 'undefined' && globalThis.crypto) {
	        crypto = globalThis.crypto;
	    }

	    if (!crypto && typeof window !== 'undefined' && window.msCrypto) {
	        crypto = window.msCrypto;
	    }

	    if (!crypto && typeof global !== 'undefined' && global.crypto) {
	        crypto = global.crypto;
	    }

	    if (!crypto && typeof require === 'function') {
	        try {
	            crypto = require('crypto');
	        } catch (err) {}
	    }

	    
	    var cryptoSecureRandomInt = function () {
	        if (crypto) {

	            if (typeof crypto.getRandomValues === 'function') {
	                try {
	                    return crypto.getRandomValues(new Uint32Array(1))[0];
	                } catch (err) {}
	            }

	            if (typeof crypto.randomBytes === 'function') {
	                try {
	                    return crypto.randomBytes(4).readInt32LE();
	                } catch (err) {}
	            }
	        }

	        throw new Error('Native crypto module could not be used to get secure random number.');
	    };

	    
	    var create = Object.create || (function () {
	        function F() {}

	        return function (obj) {
	            var subtype;

	            F.prototype = obj;

	            subtype = new F();

	            F.prototype = null;

	            return subtype;
	        };
	    }());

	    
	    var C = {};

	    
	    var C_lib = C.lib = {};

	    
	    var Base = C_lib.Base = (function () {


	        return {
	            
	            extend: function (overrides) {

	                var subtype = create(this);

	                if (overrides) {
	                    subtype.mixIn(overrides);
	                }

	                if (!subtype.hasOwnProperty('init') || this.init === subtype.init) {
	                    subtype.init = function () {
	                        subtype.$super.init.apply(this, arguments);
	                    };
	                }

	                subtype.init.prototype = subtype;

	                subtype.$super = this;

	                return subtype;
	            },

	            
	            create: function () {
	                var instance = this.extend();
	                instance.init.apply(instance, arguments);

	                return instance;
	            },

	            
	            init: function () {
	            },

	            
	            mixIn: function (properties) {
	                for (var propertyName in properties) {
	                    if (properties.hasOwnProperty(propertyName)) {
	                        this[propertyName] = properties[propertyName];
	                    }
	                }

	                if (properties.hasOwnProperty('toString')) {
	                    this.toString = properties.toString;
	                }
	            },

	            
	            clone: function () {
	                return this.init.prototype.extend(this);
	            }
	        };
	    }());

	    
	    var WordArray = C_lib.WordArray = Base.extend({
	        
	        init: function (words, sigBytes) {
	            words = this.words = words || [];

	            if (sigBytes != undefined) {
	                this.sigBytes = sigBytes;
	            } else {
	                this.sigBytes = words.length * 4;
	            }
	        },

	        
	        toString: function (encoder) {
	            return (encoder || Hex).stringify(this);
	        },

	        
	        concat: function (wordArray) {

	            var thisWords = this.words;
	            var thatWords = wordArray.words;
	            var thisSigBytes = this.sigBytes;
	            var thatSigBytes = wordArray.sigBytes;

	            this.clamp();

	            if (thisSigBytes % 4) {

	                for (var i = 0; i < thatSigBytes; i++) {
	                    var thatByte = (thatWords[i >>> 2] >>> (24 - (i % 4) * 8)) & 0xff;
	                    thisWords[(thisSigBytes + i) >>> 2] |= thatByte << (24 - ((thisSigBytes + i) % 4) * 8);
	                }
	            } else {

	                for (var j = 0; j < thatSigBytes; j += 4) {
	                    thisWords[(thisSigBytes + j) >>> 2] = thatWords[j >>> 2];
	                }
	            }
	            this.sigBytes += thatSigBytes;

	            return this;
	        },

	        
	        clamp: function () {

	            var words = this.words;
	            var sigBytes = this.sigBytes;

	            words[sigBytes >>> 2] &= 0xffffffff << (32 - (sigBytes % 4) * 8);
	            words.length = Math.ceil(sigBytes / 4);
	        },

	        
	        clone: function () {
	            var clone = Base.clone.call(this);
	            clone.words = this.words.slice(0);

	            return clone;
	        },

	        
	        random: function (nBytes) {
	            var words = [];

	            for (var i = 0; i < nBytes; i += 4) {
	                words.push(cryptoSecureRandomInt());
	            }

	            return new WordArray.init(words, nBytes);
	        }
	    });

	    
	    var C_enc = C.enc = {};

	    
	    var Hex = C_enc.Hex = {
	        
	        stringify: function (wordArray) {

	            var words = wordArray.words;
	            var sigBytes = wordArray.sigBytes;

	            var hexChars = [];
	            for (var i = 0; i < sigBytes; i++) {
	                var bite = (words[i >>> 2] >>> (24 - (i % 4) * 8)) & 0xff;
	                hexChars.push((bite >>> 4).toString(16));
	                hexChars.push((bite & 0x0f).toString(16));
	            }

	            return hexChars.join('');
	        },

	        
	        parse: function (hexStr) {

	            var hexStrLength = hexStr.length;

	            var words = [];
	            for (var i = 0; i < hexStrLength; i += 2) {
	                words[i >>> 3] |= parseInt(hexStr.substr(i, 2), 16) << (24 - (i % 8) * 4);
	            }

	            return new WordArray.init(words, hexStrLength / 2);
	        }
	    };

	    
	    var Latin1 = C_enc.Latin1 = {
	        
	        stringify: function (wordArray) {

	            var words = wordArray.words;
	            var sigBytes = wordArray.sigBytes;

	            var latin1Chars = [];
	            for (var i = 0; i < sigBytes; i++) {
	                var bite = (words[i >>> 2] >>> (24 - (i % 4) * 8)) & 0xff;
	                latin1Chars.push(String.fromCharCode(bite));
	            }

	            return latin1Chars.join('');
	        },

	        
	        parse: function (latin1Str) {

	            var latin1StrLength = latin1Str.length;

	            var words = [];
	            for (var i = 0; i < latin1StrLength; i++) {
	                words[i >>> 2] |= (latin1Str.charCodeAt(i) & 0xff) << (24 - (i % 4) * 8);
	            }

	            return new WordArray.init(words, latin1StrLength);
	        }
	    };

	    
	    var Utf8 = C_enc.Utf8 = {
	        
	        stringify: function (wordArray) {
	            try {
	                return decodeURIComponent(escape(Latin1.stringify(wordArray)));
	            } catch (e) {
	                throw new Error('Malformed UTF-8 data');
	            }
	        },

	        
	        parse: function (utf8Str) {
	            return Latin1.parse(unescape(encodeURIComponent(utf8Str)));
	        }
	    };

	    
	    var BufferedBlockAlgorithm = C_lib.BufferedBlockAlgorithm = Base.extend({
	        
	        reset: function () {

	            this._data = new WordArray.init();
	            this._nDataBytes = 0;
	        },

	        
	        _append: function (data) {

	            if (typeof data == 'string') {
	                data = Utf8.parse(data);
	            }

	            this._data.concat(data);
	            this._nDataBytes += data.sigBytes;
	        },

	        
	        _process: function (doFlush) {
	            var processedWords;

	            var data = this._data;
	            var dataWords = data.words;
	            var dataSigBytes = data.sigBytes;
	            var blockSize = this.blockSize;
	            var blockSizeBytes = blockSize * 4;

	            var nBlocksReady = dataSigBytes / blockSizeBytes;
	            if (doFlush) {

	                nBlocksReady = Math.ceil(nBlocksReady);
	            } else {


	                nBlocksReady = Math.max((nBlocksReady | 0) - this._minBufferSize, 0);
	            }

	            var nWordsReady = nBlocksReady * blockSize;

	            var nBytesReady = Math.min(nWordsReady * 4, dataSigBytes);

	            if (nWordsReady) {
	                for (var offset = 0; offset < nWordsReady; offset += blockSize) {

	                    this._doProcessBlock(dataWords, offset);
	                }

	                processedWords = dataWords.splice(0, nWordsReady);
	                data.sigBytes -= nBytesReady;
	            }

	            return new WordArray.init(processedWords, nBytesReady);
	        },

	        
	        clone: function () {
	            var clone = Base.clone.call(this);
	            clone._data = this._data.clone();

	            return clone;
	        },

	        _minBufferSize: 0
	    });

	    
	    var Hasher = C_lib.Hasher = BufferedBlockAlgorithm.extend({
	        
	        cfg: Base.extend(),

	        
	        init: function (cfg) {

	            this.cfg = this.cfg.extend(cfg);

	            this.reset();
	        },

	        
	        reset: function () {

	            BufferedBlockAlgorithm.reset.call(this);

	            this._doReset();
	        },

	        
	        update: function (messageUpdate) {

	            this._append(messageUpdate);

	            this._process();

	            return this;
	        },

	        
	        finalize: function (messageUpdate) {

	            if (messageUpdate) {
	                this._append(messageUpdate);
	            }

	            var hash = this._doFinalize();

	            return hash;
	        },

	        blockSize: 512/32,

	        
	        _createHelper: function (hasher) {
	            return function (message, cfg) {
	                return new hasher.init(cfg).finalize(message);
	            };
	        },

	        
	        _createHmacHelper: function (hasher) {
	            return function (message, key) {
	                return new C_algo.HMAC.init(hasher, key).finalize(message);
	            };
	        }
	    });

	    
	    var C_algo = C.algo = {};

	    return C;
	}(Math));


	(function (undefined) {

	    var C = CryptoJS;
	    var C_lib = C.lib;
	    var Base = C_lib.Base;
	    var X32WordArray = C_lib.WordArray;

	    
	    var C_x64 = C.x64 = {};

	    
	    var X64Word = C_x64.Word = Base.extend({
	        
	        init: function (high, low) {
	            this.high = high;
	            this.low = low;
	        }




















































	    });

	    
	    var X64WordArray = C_x64.WordArray = Base.extend({
	        
	        init: function (words, sigBytes) {
	            words = this.words = words || [];

	            if (sigBytes != undefined) {
	                this.sigBytes = sigBytes;
	            } else {
	                this.sigBytes = words.length * 8;
	            }
	        },

	        
	        toX32: function () {

	            var x64Words = this.words;
	            var x64WordsLength = x64Words.length;

	            var x32Words = [];
	            for (var i = 0; i < x64WordsLength; i++) {
	                var x64Word = x64Words[i];
	                x32Words.push(x64Word.high);
	                x32Words.push(x64Word.low);
	            }

	            return X32WordArray.create(x32Words, this.sigBytes);
	        },

	        
	        clone: function () {
	            var clone = Base.clone.call(this);

	            var words = clone.words = this.words.slice(0);

	            var wordsLength = words.length;
	            for (var i = 0; i < wordsLength; i++) {
	                words[i] = words[i].clone();
	            }

	            return clone;
	        }
	    });
	}());


	(function () {

	    if (typeof ArrayBuffer != 'function') {
	        return;
	    }

	    var C = CryptoJS;
	    var C_lib = C.lib;
	    var WordArray = C_lib.WordArray;

	    var superInit = WordArray.init;

	    var subInit = WordArray.init = function (typedArray) {

	        if (typedArray instanceof ArrayBuffer) {
	            typedArray = new Uint8Array(typedArray);
	        }

	        if (
	            typedArray instanceof Int8Array ||
	            (typeof Uint8ClampedArray !== "undefined" && typedArray instanceof Uint8ClampedArray) ||
	            typedArray instanceof Int16Array ||
	            typedArray instanceof Uint16Array ||
	            typedArray instanceof Int32Array ||
	            typedArray instanceof Uint32Array ||
	            typedArray instanceof Float32Array ||
	            typedArray instanceof Float64Array
	        ) {
	            typedArray = new Uint8Array(typedArray.buffer, typedArray.byteOffset, typedArray.byteLength);
	        }

	        if (typedArray instanceof Uint8Array) {

	            var typedArrayByteLength = typedArray.byteLength;

	            var words = [];
	            for (var i = 0; i < typedArrayByteLength; i++) {
	                words[i >>> 2] |= typedArray[i] << (24 - (i % 4) * 8);
	            }

	            superInit.call(this, words, typedArrayByteLength);
	        } else {

	            superInit.apply(this, arguments);
	        }
	    };

	    subInit.prototype = WordArray;
	}());


	(function () {

	    var C = CryptoJS;
	    var C_lib = C.lib;
	    var WordArray = C_lib.WordArray;
	    var C_enc = C.enc;

	    
	    var Utf16BE = C_enc.Utf16 = C_enc.Utf16BE = {
	        
	        stringify: function (wordArray) {

	            var words = wordArray.words;
	            var sigBytes = wordArray.sigBytes;

	            var utf16Chars = [];
	            for (var i = 0; i < sigBytes; i += 2) {
	                var codePoint = (words[i >>> 2] >>> (16 - (i % 4) * 8)) & 0xffff;
	                utf16Chars.push(String.fromCharCode(codePoint));
	            }

	            return utf16Chars.join('');
	        },

	        
	        parse: function (utf16Str) {

	            var utf16StrLength = utf16Str.length;

	            var words = [];
	            for (var i = 0; i < utf16StrLength; i++) {
	                words[i >>> 1] |= utf16Str.charCodeAt(i) << (16 - (i % 2) * 16);
	            }

	            return WordArray.create(words, utf16StrLength * 2);
	        }
	    };

	    
	    C_enc.Utf16LE = {
	        
	        stringify: function (wordArray) {

	            var words = wordArray.words;
	            var sigBytes = wordArray.sigBytes;

	            var utf16Chars = [];
	            for (var i = 0; i < sigBytes; i += 2) {
	                var codePoint = swapEndian((words[i >>> 2] >>> (16 - (i % 4) * 8)) & 0xffff);
	                utf16Chars.push(String.fromCharCode(codePoint));
	            }

	            return utf16Chars.join('');
	        },

	        
	        parse: function (utf16Str) {

	            var utf16StrLength = utf16Str.length;

	            var words = [];
	            for (var i = 0; i < utf16StrLength; i++) {
	                words[i >>> 1] |= swapEndian(utf16Str.charCodeAt(i) << (16 - (i % 2) * 16));
	            }

	            return WordArray.create(words, utf16StrLength * 2);
	        }
	    };

	    function swapEndian(word) {
	        return ((word << 8) & 0xff00ff00) | ((word >>> 8) & 0x00ff00ff);
	    }
	}());


	(function () {

	    var C = CryptoJS;
	    var C_lib = C.lib;
	    var WordArray = C_lib.WordArray;
	    var C_enc = C.enc;

	    
	    var Base64 = C_enc.Base64 = {
	        
	        stringify: function (wordArray) {

	            var words = wordArray.words;
	            var sigBytes = wordArray.sigBytes;
	            var map = this._map;

	            wordArray.clamp();

	            var base64Chars = [];
	            for (var i = 0; i < sigBytes; i += 3) {
	                var byte1 = (words[i >>> 2]       >>> (24 - (i % 4) * 8))       & 0xff;
	                var byte2 = (words[(i + 1) >>> 2] >>> (24 - ((i + 1) % 4) * 8)) & 0xff;
	                var byte3 = (words[(i + 2) >>> 2] >>> (24 - ((i + 2) % 4) * 8)) & 0xff;

	                var triplet = (byte1 << 16) | (byte2 << 8) | byte3;

	                for (var j = 0; (j < 4) && (i + j * 0.75 < sigBytes); j++) {
	                    base64Chars.push(map.charAt((triplet >>> (6 * (3 - j))) & 0x3f));
	                }
	            }

	            var paddingChar = map.charAt(64);
	            if (paddingChar) {
	                while (base64Chars.length % 4) {
	                    base64Chars.push(paddingChar);
	                }
	            }

	            return base64Chars.join('');
	        },

	        
	        parse: function (base64Str) {

	            var base64StrLength = base64Str.length;
	            var map = this._map;
	            var reverseMap = this._reverseMap;

	            if (!reverseMap) {
	                    reverseMap = this._reverseMap = [];
	                    for (var j = 0; j < map.length; j++) {
	                        reverseMap[map.charCodeAt(j)] = j;
	                    }
	            }

	            var paddingChar = map.charAt(64);
	            if (paddingChar) {
	                var paddingIndex = base64Str.indexOf(paddingChar);
	                if (paddingIndex !== -1) {
	                    base64StrLength = paddingIndex;
	                }
	            }

	            return parseLoop(base64Str, base64StrLength, reverseMap);

	        },

	        _map: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/='
	    };

	    function parseLoop(base64Str, base64StrLength, reverseMap) {
	      var words = [];
	      var nBytes = 0;
	      for (var i = 0; i < base64StrLength; i++) {
	          if (i % 4) {
	              var bits1 = reverseMap[base64Str.charCodeAt(i - 1)] << ((i % 4) * 2);
	              var bits2 = reverseMap[base64Str.charCodeAt(i)] >>> (6 - (i % 4) * 2);
	              var bitsCombined = bits1 | bits2;
	              words[nBytes >>> 2] |= bitsCombined << (24 - (nBytes % 4) * 8);
	              nBytes++;
	          }
	      }
	      return WordArray.create(words, nBytes);
	    }
	}());


	(function () {

	    var C = CryptoJS;
	    var C_lib = C.lib;
	    var WordArray = C_lib.WordArray;
	    var C_enc = C.enc;

	    
	    var Base64url = C_enc.Base64url = {
	        
	        stringify: function (wordArray, urlSafe) {
	            if (urlSafe === undefined) {
	                urlSafe = true
	            }

	            var words = wordArray.words;
	            var sigBytes = wordArray.sigBytes;
	            var map = urlSafe ? this._safe_map : this._map;

	            wordArray.clamp();

	            var base64Chars = [];
	            for (var i = 0; i < sigBytes; i += 3) {
	                var byte1 = (words[i >>> 2]       >>> (24 - (i % 4) * 8))       & 0xff;
	                var byte2 = (words[(i + 1) >>> 2] >>> (24 - ((i + 1) % 4) * 8)) & 0xff;
	                var byte3 = (words[(i + 2) >>> 2] >>> (24 - ((i + 2) % 4) * 8)) & 0xff;

	                var triplet = (byte1 << 16) | (byte2 << 8) | byte3;

	                for (var j = 0; (j < 4) && (i + j * 0.75 < sigBytes); j++) {
	                    base64Chars.push(map.charAt((triplet >>> (6 * (3 - j))) & 0x3f));
	                }
	            }

	            var paddingChar = map.charAt(64);
	            if (paddingChar) {
	                while (base64Chars.length % 4) {
	                    base64Chars.push(paddingChar);
	                }
	            }

	            return base64Chars.join('');
	        },

	        
	        parse: function (base64Str, urlSafe) {
	            if (urlSafe === undefined) {
	                urlSafe = true
	            }

	            var base64StrLength = base64Str.length;
	            var map = urlSafe ? this._safe_map : this._map;
	            var reverseMap = this._reverseMap;

	            if (!reverseMap) {
	                reverseMap = this._reverseMap = [];
	                for (var j = 0; j < map.length; j++) {
	                    reverseMap[map.charCodeAt(j)] = j;
	                }
	            }

	            var paddingChar = map.charAt(64);
	            if (paddingChar) {
	                var paddingIndex = base64Str.indexOf(paddingChar);
	                if (paddingIndex !== -1) {
	                    base64StrLength = paddingIndex;
	                }
	            }

	            return parseLoop(base64Str, base64StrLength, reverseMap);

	        },

	        _map: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=',
	        _safe_map: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_',
	    };

	    function parseLoop(base64Str, base64StrLength, reverseMap) {
	        var words = [];
	        var nBytes = 0;
	        for (var i = 0; i < base64StrLength; i++) {
	            if (i % 4) {
	                var bits1 = reverseMap[base64Str.charCodeAt(i - 1)] << ((i % 4) * 2);
	                var bits2 = reverseMap[base64Str.charCodeAt(i)] >>> (6 - (i % 4) * 2);
	                var bitsCombined = bits1 | bits2;
	                words[nBytes >>> 2] |= bitsCombined << (24 - (nBytes % 4) * 8);
	                nBytes++;
	            }
	        }
	        return WordArray.create(words, nBytes);
	    }
	}());


	(function (Math) {

	    var C = CryptoJS;
	    var C_lib = C.lib;
	    var WordArray = C_lib.WordArray;
	    var Hasher = C_lib.Hasher;
	    var C_algo = C.algo;

	    var T = [];

	    (function () {
	        for (var i = 0; i < 64; i++) {
	            T[i] = (Math.abs(Math.sin(i + 1)) * 0x100000000) | 0;
	        }
	    }());

	    
	    var MD5 = C_algo.MD5 = Hasher.extend({
	        _doReset: function () {
	            this._hash = new WordArray.init([
	                0x67452301, 0xefcdab89,
	                0x98badcfe, 0x10325476
	            ]);
	        },

	        _doProcessBlock: function (M, offset) {

	            for (var i = 0; i < 16; i++) {

	                var offset_i = offset + i;
	                var M_offset_i = M[offset_i];

	                M[offset_i] = (
	                    (((M_offset_i << 8)  | (M_offset_i >>> 24)) & 0x00ff00ff) |
	                    (((M_offset_i << 24) | (M_offset_i >>> 8))  & 0xff00ff00)
	                );
	            }

	            var H = this._hash.words;

	            var M_offset_0  = M[offset + 0];
	            var M_offset_1  = M[offset + 1];
	            var M_offset_2  = M[offset + 2];
	            var M_offset_3  = M[offset + 3];
	            var M_offset_4  = M[offset + 4];
	            var M_offset_5  = M[offset + 5];
	            var M_offset_6  = M[offset + 6];
	            var M_offset_7  = M[offset + 7];
	            var M_offset_8  = M[offset + 8];
	            var M_offset_9  = M[offset + 9];
	            var M_offset_10 = M[offset + 10];
	            var M_offset_11 = M[offset + 11];
	            var M_offset_12 = M[offset + 12];
	            var M_offset_13 = M[offset + 13];
	            var M_offset_14 = M[offset + 14];
	            var M_offset_15 = M[offset + 15];

	            var a = H[0];
	            var b = H[1];
	            var c = H[2];
	            var d = H[3];

	            a = FF(a, b, c, d, M_offset_0,  7,  T[0]);
	            d = FF(d, a, b, c, M_offset_1,  12, T[1]);
	            c = FF(c, d, a, b, M_offset_2,  17, T[2]);
	            b = FF(b, c, d, a, M_offset_3,  22, T[3]);
	            a = FF(a, b, c, d, M_offset_4,  7,  T[4]);
	            d = FF(d, a, b, c, M_offset_5,  12, T[5]);
	            c = FF(c, d, a, b, M_offset_6,  17, T[6]);
	            b = FF(b, c, d, a, M_offset_7,  22, T[7]);
	            a = FF(a, b, c, d, M_offset_8,  7,  T[8]);
	            d = FF(d, a, b, c, M_offset_9,  12, T[9]);
	            c = FF(c, d, a, b, M_offset_10, 17, T[10]);
	            b = FF(b, c, d, a, M_offset_11, 22, T[11]);
	            a = FF(a, b, c, d, M_offset_12, 7,  T[12]);
	            d = FF(d, a, b, c, M_offset_13, 12, T[13]);
	            c = FF(c, d, a, b, M_offset_14, 17, T[14]);
	            b = FF(b, c, d, a, M_offset_15, 22, T[15]);

	            a = GG(a, b, c, d, M_offset_1,  5,  T[16]);
	            d = GG(d, a, b, c, M_offset_6,  9,  T[17]);
	            c = GG(c, d, a, b, M_offset_11, 14, T[18]);
	            b = GG(b, c, d, a, M_offset_0,  20, T[19]);
	            a = GG(a, b, c, d, M_offset_5,  5,  T[20]);
	            d = GG(d, a, b, c, M_offset_10, 9,  T[21]);
	            c = GG(c, d, a, b, M_offset_15, 14, T[22]);
	            b = GG(b, c, d, a, M_offset_4,  20, T[23]);
	            a = GG(a, b, c, d, M_offset_9,  5,  T[24]);
	            d = GG(d, a, b, c, M_offset_14, 9,  T[25]);
	            c = GG(c, d, a, b, M_offset_3,  14, T[26]);
	            b = GG(b, c, d, a, M_offset_8,  20, T[27]);
	            a = GG(a, b, c, d, M_offset_13, 5,  T[28]);
	            d = GG(d, a, b, c, M_offset_2,  9,  T[29]);
	            c = GG(c, d, a, b, M_offset_7,  14, T[30]);
	            b = GG(b, c, d, a, M_offset_12, 20, T[31]);

	            a = HH(a, b, c, d, M_offset_5,  4,  T[32]);
	            d = HH(d, a, b, c, M_offset_8,  11, T[33]);
	            c = HH(c, d, a, b, M_offset_11, 16, T[34]);
	            b = HH(b, c, d, a, M_offset_14, 23, T[35]);
	            a = HH(a, b, c, d, M_offset_1,  4,  T[36]);
	            d = HH(d, a, b, c, M_offset_4,  11, T[37]);
	            c = HH(c, d, a, b, M_offset_7,  16, T[38]);
	            b = HH(b, c, d, a, M_offset_10, 23, T[39]);
	            a = HH(a, b, c, d, M_offset_13, 4,  T[40]);
	            d = HH(d, a, b, c, M_offset_0,  11, T[41]);
	            c = HH(c, d, a, b, M_offset_3,  16, T[42]);
	            b = HH(b, c, d, a, M_offset_6,  23, T[43]);
	            a = HH(a, b, c, d, M_offset_9,  4,  T[44]);
	            d = HH(d, a, b, c, M_offset_12, 11, T[45]);
	            c = HH(c, d, a, b, M_offset_15, 16, T[46]);
	            b = HH(b, c, d, a, M_offset_2,  23, T[47]);

	            a = II(a, b, c, d, M_offset_0,  6,  T[48]);
	            d = II(d, a, b, c, M_offset_7,  10, T[49]);
	            c = II(c, d, a, b, M_offset_14, 15, T[50]);
	            b = II(b, c, d, a, M_offset_5,  21, T[51]);
	            a = II(a, b, c, d, M_offset_12, 6,  T[52]);
	            d = II(d, a, b, c, M_offset_3,  10, T[53]);
	            c = II(c, d, a, b, M_offset_10, 15, T[54]);
	            b = II(b, c, d, a, M_offset_1,  21, T[55]);
	            a = II(a, b, c, d, M_offset_8,  6,  T[56]);
	            d = II(d, a, b, c, M_offset_15, 10, T[57]);
	            c = II(c, d, a, b, M_offset_6,  15, T[58]);
	            b = II(b, c, d, a, M_offset_13, 21, T[59]);
	            a = II(a, b, c, d, M_offset_4,  6,  T[60]);
	            d = II(d, a, b, c, M_offset_11, 10, T[61]);
	            c = II(c, d, a, b, M_offset_2,  15, T[62]);
	            b = II(b, c, d, a, M_offset_9,  21, T[63]);

	            H[0] = (H[0] + a) | 0;
	            H[1] = (H[1] + b) | 0;
	            H[2] = (H[2] + c) | 0;
	            H[3] = (H[3] + d) | 0;
	        },

	        _doFinalize: function () {

	            var data = this._data;
	            var dataWords = data.words;

	            var nBitsTotal = this._nDataBytes * 8;
	            var nBitsLeft = data.sigBytes * 8;

	            dataWords[nBitsLeft >>> 5] |= 0x80 << (24 - nBitsLeft % 32);

	            var nBitsTotalH = Math.floor(nBitsTotal / 0x100000000);
	            var nBitsTotalL = nBitsTotal;
	            dataWords[(((nBitsLeft + 64) >>> 9) << 4) + 15] = (
	                (((nBitsTotalH << 8)  | (nBitsTotalH >>> 24)) & 0x00ff00ff) |
	                (((nBitsTotalH << 24) | (nBitsTotalH >>> 8))  & 0xff00ff00)
	            );
	            dataWords[(((nBitsLeft + 64) >>> 9) << 4) + 14] = (
	                (((nBitsTotalL << 8)  | (nBitsTotalL >>> 24)) & 0x00ff00ff) |
	                (((nBitsTotalL << 24) | (nBitsTotalL >>> 8))  & 0xff00ff00)
	            );

	            data.sigBytes = (dataWords.length + 1) * 4;

	            this._process();

	            var hash = this._hash;
	            var H = hash.words;

	            for (var i = 0; i < 4; i++) {

	                var H_i = H[i];

	                H[i] = (((H_i << 8)  | (H_i >>> 24)) & 0x00ff00ff) |
	                       (((H_i << 24) | (H_i >>> 8))  & 0xff00ff00);
	            }

	            return hash;
	        },

	        clone: function () {
	            var clone = Hasher.clone.call(this);
	            clone._hash = this._hash.clone();

	            return clone;
	        }
	    });

	    function FF(a, b, c, d, x, s, t) {
	        var n = a + ((b & c) | (~b & d)) + x + t;
	        return ((n << s) | (n >>> (32 - s))) + b;
	    }

	    function GG(a, b, c, d, x, s, t) {
	        var n = a + ((b & d) | (c & ~d)) + x + t;
	        return ((n << s) | (n >>> (32 - s))) + b;
	    }

	    function HH(a, b, c, d, x, s, t) {
	        var n = a + (b ^ c ^ d) + x + t;
	        return ((n << s) | (n >>> (32 - s))) + b;
	    }

	    function II(a, b, c, d, x, s, t) {
	        var n = a + (c ^ (b | ~d)) + x + t;
	        return ((n << s) | (n >>> (32 - s))) + b;
	    }

	    
	    C.MD5 = Hasher._createHelper(MD5);

	    
	    C.HmacMD5 = Hasher._createHmacHelper(MD5);
	}(Math));


	(function () {

	    var C = CryptoJS;
	    var C_lib = C.lib;
	    var WordArray = C_lib.WordArray;
	    var Hasher = C_lib.Hasher;
	    var C_algo = C.algo;

	    var W = [];

	    
	    var SHA1 = C_algo.SHA1 = Hasher.extend({
	        _doReset: function () {
	            this._hash = new WordArray.init([
	                0x67452301, 0xefcdab89,
	                0x98badcfe, 0x10325476,
	                0xc3d2e1f0
	            ]);
	        },

	        _doProcessBlock: function (M, offset) {

	            var H = this._hash.words;

	            var a = H[0];
	            var b = H[1];
	            var c = H[2];
	            var d = H[3];
	            var e = H[4];

	            for (var i = 0; i < 80; i++) {
	                if (i < 16) {
	                    W[i] = M[offset + i] | 0;
	                } else {
	                    var n = W[i - 3] ^ W[i - 8] ^ W[i - 14] ^ W[i - 16];
	                    W[i] = (n << 1) | (n >>> 31);
	                }

	                var t = ((a << 5) | (a >>> 27)) + e + W[i];
	                if (i < 20) {
	                    t += ((b & c) | (~b & d)) + 0x5a827999;
	                } else if (i < 40) {
	                    t += (b ^ c ^ d) + 0x6ed9eba1;
	                } else if (i < 60) {
	                    t += ((b & c) | (b & d) | (c & d)) - 0x70e44324;
	                } else  {
	                    t += (b ^ c ^ d) - 0x359d3e2a;
	                }

	                e = d;
	                d = c;
	                c = (b << 30) | (b >>> 2);
	                b = a;
	                a = t;
	            }

	            H[0] = (H[0] + a) | 0;
	            H[1] = (H[1] + b) | 0;
	            H[2] = (H[2] + c) | 0;
	            H[3] = (H[3] + d) | 0;
	            H[4] = (H[4] + e) | 0;
	        },

	        _doFinalize: function () {

	            var data = this._data;
	            var dataWords = data.words;

	            var nBitsTotal = this._nDataBytes * 8;
	            var nBitsLeft = data.sigBytes * 8;

	            dataWords[nBitsLeft >>> 5] |= 0x80 << (24 - nBitsLeft % 32);
	            dataWords[(((nBitsLeft + 64) >>> 9) << 4) + 14] = Math.floor(nBitsTotal / 0x100000000);
	            dataWords[(((nBitsLeft + 64) >>> 9) << 4) + 15] = nBitsTotal;
	            data.sigBytes = dataWords.length * 4;

	            this._process();

	            return this._hash;
	        },

	        clone: function () {
	            var clone = Hasher.clone.call(this);
	            clone._hash = this._hash.clone();

	            return clone;
	        }
	    });

	    
	    C.SHA1 = Hasher._createHelper(SHA1);

	    
	    C.HmacSHA1 = Hasher._createHmacHelper(SHA1);
	}());


	(function (Math) {

	    var C = CryptoJS;
	    var C_lib = C.lib;
	    var WordArray = C_lib.WordArray;
	    var Hasher = C_lib.Hasher;
	    var C_algo = C.algo;

	    var H = [];
	    var K = [];

	    (function () {
	        function isPrime(n) {
	            var sqrtN = Math.sqrt(n);
	            for (var factor = 2; factor <= sqrtN; factor++) {
	                if (!(n % factor)) {
	                    return false;
	                }
	            }

	            return true;
	        }

	        function getFractionalBits(n) {
	            return ((n - (n | 0)) * 0x100000000) | 0;
	        }

	        var n = 2;
	        var nPrime = 0;
	        while (nPrime < 64) {
	            if (isPrime(n)) {
	                if (nPrime < 8) {
	                    H[nPrime] = getFractionalBits(Math.pow(n, 1 / 2));
	                }
	                K[nPrime] = getFractionalBits(Math.pow(n, 1 / 3));

	                nPrime++;
	            }

	            n++;
	        }
	    }());

	    var W = [];

	    
	    var SHA256 = C_algo.SHA256 = Hasher.extend({
	        _doReset: function () {
	            this._hash = new WordArray.init(H.slice(0));
	        },

	        _doProcessBlock: function (M, offset) {

	            var H = this._hash.words;

	            var a = H[0];
	            var b = H[1];
	            var c = H[2];
	            var d = H[3];
	            var e = H[4];
	            var f = H[5];
	            var g = H[6];
	            var h = H[7];

	            for (var i = 0; i < 64; i++) {
	                if (i < 16) {
	                    W[i] = M[offset + i] | 0;
	                } else {
	                    var gamma0x = W[i - 15];
	                    var gamma0  = ((gamma0x << 25) | (gamma0x >>> 7))  ^
	                                  ((gamma0x << 14) | (gamma0x >>> 18)) ^
	                                   (gamma0x >>> 3);

	                    var gamma1x = W[i - 2];
	                    var gamma1  = ((gamma1x << 15) | (gamma1x >>> 17)) ^
	                                  ((gamma1x << 13) | (gamma1x >>> 19)) ^
	                                   (gamma1x >>> 10);

	                    W[i] = gamma0 + W[i - 7] + gamma1 + W[i - 16];
	                }

	                var ch  = (e & f) ^ (~e & g);
	                var maj = (a & b) ^ (a & c) ^ (b & c);

	                var sigma0 = ((a << 30) | (a >>> 2)) ^ ((a << 19) | (a >>> 13)) ^ ((a << 10) | (a >>> 22));
	                var sigma1 = ((e << 26) | (e >>> 6)) ^ ((e << 21) | (e >>> 11)) ^ ((e << 7)  | (e >>> 25));

	                var t1 = h + sigma1 + ch + K[i] + W[i];
	                var t2 = sigma0 + maj;

	                h = g;
	                g = f;
	                f = e;
	                e = (d + t1) | 0;
	                d = c;
	                c = b;
	                b = a;
	                a = (t1 + t2) | 0;
	            }

	            H[0] = (H[0] + a) | 0;
	            H[1] = (H[1] + b) | 0;
	            H[2] = (H[2] + c) | 0;
	            H[3] = (H[3] + d) | 0;
	            H[4] = (H[4] + e) | 0;
	            H[5] = (H[5] + f) | 0;
	            H[6] = (H[6] + g) | 0;
	            H[7] = (H[7] + h) | 0;
	        },

	        _doFinalize: function () {

	            var data = this._data;
	            var dataWords = data.words;

	            var nBitsTotal = this._nDataBytes * 8;
	            var nBitsLeft = data.sigBytes * 8;

	            dataWords[nBitsLeft >>> 5] |= 0x80 << (24 - nBitsLeft % 32);
	            dataWords[(((nBitsLeft + 64) >>> 9) << 4) + 14] = Math.floor(nBitsTotal / 0x100000000);
	            dataWords[(((nBitsLeft + 64) >>> 9) << 4) + 15] = nBitsTotal;
	            data.sigBytes = dataWords.length * 4;

	            this._process();

	            return this._hash;
	        },

	        clone: function () {
	            var clone = Hasher.clone.call(this);
	            clone._hash = this._hash.clone();

	            return clone;
	        }
	    });

	    
	    C.SHA256 = Hasher._createHelper(SHA256);

	    
	    C.HmacSHA256 = Hasher._createHmacHelper(SHA256);
	}(Math));


	(function () {

	    var C = CryptoJS;
	    var C_lib = C.lib;
	    var WordArray = C_lib.WordArray;
	    var C_algo = C.algo;
	    var SHA256 = C_algo.SHA256;

	    
	    var SHA224 = C_algo.SHA224 = SHA256.extend({
	        _doReset: function () {
	            this._hash = new WordArray.init([
	                0xc1059ed8, 0x367cd507, 0x3070dd17, 0xf70e5939,
	                0xffc00b31, 0x68581511, 0x64f98fa7, 0xbefa4fa4
	            ]);
	        },

	        _doFinalize: function () {
	            var hash = SHA256._doFinalize.call(this);

	            hash.sigBytes -= 4;

	            return hash;
	        }
	    });

	    
	    C.SHA224 = SHA256._createHelper(SHA224);

	    
	    C.HmacSHA224 = SHA256._createHmacHelper(SHA224);
	}());


	(function () {

	    var C = CryptoJS;
	    var C_lib = C.lib;
	    var Hasher = C_lib.Hasher;
	    var C_x64 = C.x64;
	    var X64Word = C_x64.Word;
	    var X64WordArray = C_x64.WordArray;
	    var C_algo = C.algo;

	    function X64Word_create() {
	        return X64Word.create.apply(X64Word, arguments);
	    }

	    var K = [
	        X64Word_create(0x428a2f98, 0xd728ae22), X64Word_create(0x71374491, 0x23ef65cd),
	        X64Word_create(0xb5c0fbcf, 0xec4d3b2f), X64Word_create(0xe9b5dba5, 0x8189dbbc),
	        X64Word_create(0x3956c25b, 0xf348b538), X64Word_create(0x59f111f1, 0xb605d019),
	        X64Word_create(0x923f82a4, 0xaf194f9b), X64Word_create(0xab1c5ed5, 0xda6d8118),
	        X64Word_create(0xd807aa98, 0xa3030242), X64Word_create(0x12835b01, 0x45706fbe),
	        X64Word_create(0x243185be, 0x4ee4b28c), X64Word_create(0x550c7dc3, 0xd5ffb4e2),
	        X64Word_create(0x72be5d74, 0xf27b896f), X64Word_create(0x80deb1fe, 0x3b1696b1),
	        X64Word_create(0x9bdc06a7, 0x25c71235), X64Word_create(0xc19bf174, 0xcf692694),
	        X64Word_create(0xe49b69c1, 0x9ef14ad2), X64Word_create(0xefbe4786, 0x384f25e3),
	        X64Word_create(0x0fc19dc6, 0x8b8cd5b5), X64Word_create(0x240ca1cc, 0x77ac9c65),
	        X64Word_create(0x2de92c6f, 0x592b0275), X64Word_create(0x4a7484aa, 0x6ea6e483),
	        X64Word_create(0x5cb0a9dc, 0xbd41fbd4), X64Word_create(0x76f988da, 0x831153b5),
	        X64Word_create(0x983e5152, 0xee66dfab), X64Word_create(0xa831c66d, 0x2db43210),
	        X64Word_create(0xb00327c8, 0x98fb213f), X64Word_create(0xbf597fc7, 0xbeef0ee4),
	        X64Word_create(0xc6e00bf3, 0x3da88fc2), X64Word_create(0xd5a79147, 0x930aa725),
	        X64Word_create(0x06ca6351, 0xe003826f), X64Word_create(0x14292967, 0x0a0e6e70),
	        X64Word_create(0x27b70a85, 0x46d22ffc), X64Word_create(0x2e1b2138, 0x5c26c926),
	        X64Word_create(0x4d2c6dfc, 0x5ac42aed), X64Word_create(0x53380d13, 0x9d95b3df),
	        X64Word_create(0x650a7354, 0x8baf63de), X64Word_create(0x766a0abb, 0x3c77b2a8),
	        X64Word_create(0x81c2c92e, 0x47edaee6), X64Word_create(0x92722c85, 0x1482353b),
	        X64Word_create(0xa2bfe8a1, 0x4cf10364), X64Word_create(0xa81a664b, 0xbc423001),
	        X64Word_create(0xc24b8b70, 0xd0f89791), X64Word_create(0xc76c51a3, 0x0654be30),
	        X64Word_create(0xd192e819, 0xd6ef5218), X64Word_create(0xd6990624, 0x5565a910),
	        X64Word_create(0xf40e3585, 0x5771202a), X64Word_create(0x106aa070, 0x32bbd1b8),
	        X64Word_create(0x19a4c116, 0xb8d2d0c8), X64Word_create(0x1e376c08, 0x5141ab53),
	        X64Word_create(0x2748774c, 0xdf8eeb99), X64Word_create(0x34b0bcb5, 0xe19b48a8),
	        X64Word_create(0x391c0cb3, 0xc5c95a63), X64Word_create(0x4ed8aa4a, 0xe3418acb),
	        X64Word_create(0x5b9cca4f, 0x7763e373), X64Word_create(0x682e6ff3, 0xd6b2b8a3),
	        X64Word_create(0x748f82ee, 0x5defb2fc), X64Word_create(0x78a5636f, 0x43172f60),
	        X64Word_create(0x84c87814, 0xa1f0ab72), X64Word_create(0x8cc70208, 0x1a6439ec),
	        X64Word_create(0x90befffa, 0x23631e28), X64Word_create(0xa4506ceb, 0xde82bde9),
	        X64Word_create(0xbef9a3f7, 0xb2c67915), X64Word_create(0xc67178f2, 0xe372532b),
	        X64Word_create(0xca273ece, 0xea26619c), X64Word_create(0xd186b8c7, 0x21c0c207),
	        X64Word_create(0xeada7dd6, 0xcde0eb1e), X64Word_create(0xf57d4f7f, 0xee6ed178),
	        X64Word_create(0x06f067aa, 0x72176fba), X64Word_create(0x0a637dc5, 0xa2c898a6),
	        X64Word_create(0x113f9804, 0xbef90dae), X64Word_create(0x1b710b35, 0x131c471b),
	        X64Word_create(0x28db77f5, 0x23047d84), X64Word_create(0x32caab7b, 0x40c72493),
	        X64Word_create(0x3c9ebe0a, 0x15c9bebc), X64Word_create(0x431d67c4, 0x9c100d4c),
	        X64Word_create(0x4cc5d4be, 0xcb3e42b6), X64Word_create(0x597f299c, 0xfc657e2a),
	        X64Word_create(0x5fcb6fab, 0x3ad6faec), X64Word_create(0x6c44198c, 0x4a475817)
	    ];

	    var W = [];
	    (function () {
	        for (var i = 0; i < 80; i++) {
	            W[i] = X64Word_create();
	        }
	    }());

	    
	    var SHA512 = C_algo.SHA512 = Hasher.extend({
	        _doReset: function () {
	            this._hash = new X64WordArray.init([
	                new X64Word.init(0x6a09e667, 0xf3bcc908), new X64Word.init(0xbb67ae85, 0x84caa73b),
	                new X64Word.init(0x3c6ef372, 0xfe94f82b), new X64Word.init(0xa54ff53a, 0x5f1d36f1),
	                new X64Word.init(0x510e527f, 0xade682d1), new X64Word.init(0x9b05688c, 0x2b3e6c1f),
	                new X64Word.init(0x1f83d9ab, 0xfb41bd6b), new X64Word.init(0x5be0cd19, 0x137e2179)
	            ]);
	        },

	        _doProcessBlock: function (M, offset) {

	            var H = this._hash.words;

	            var H0 = H[0];
	            var H1 = H[1];
	            var H2 = H[2];
	            var H3 = H[3];
	            var H4 = H[4];
	            var H5 = H[5];
	            var H6 = H[6];
	            var H7 = H[7];

	            var H0h = H0.high;
	            var H0l = H0.low;
	            var H1h = H1.high;
	            var H1l = H1.low;
	            var H2h = H2.high;
	            var H2l = H2.low;
	            var H3h = H3.high;
	            var H3l = H3.low;
	            var H4h = H4.high;
	            var H4l = H4.low;
	            var H5h = H5.high;
	            var H5l = H5.low;
	            var H6h = H6.high;
	            var H6l = H6.low;
	            var H7h = H7.high;
	            var H7l = H7.low;

	            var ah = H0h;
	            var al = H0l;
	            var bh = H1h;
	            var bl = H1l;
	            var ch = H2h;
	            var cl = H2l;
	            var dh = H3h;
	            var dl = H3l;
	            var eh = H4h;
	            var el = H4l;
	            var fh = H5h;
	            var fl = H5l;
	            var gh = H6h;
	            var gl = H6l;
	            var hh = H7h;
	            var hl = H7l;

	            for (var i = 0; i < 80; i++) {
	                var Wil;
	                var Wih;

	                var Wi = W[i];

	                if (i < 16) {
	                    Wih = Wi.high = M[offset + i * 2]     | 0;
	                    Wil = Wi.low  = M[offset + i * 2 + 1] | 0;
	                } else {

	                    var gamma0x  = W[i - 15];
	                    var gamma0xh = gamma0x.high;
	                    var gamma0xl = gamma0x.low;
	                    var gamma0h  = ((gamma0xh >>> 1) | (gamma0xl << 31)) ^ ((gamma0xh >>> 8) | (gamma0xl << 24)) ^ (gamma0xh >>> 7);
	                    var gamma0l  = ((gamma0xl >>> 1) | (gamma0xh << 31)) ^ ((gamma0xl >>> 8) | (gamma0xh << 24)) ^ ((gamma0xl >>> 7) | (gamma0xh << 25));

	                    var gamma1x  = W[i - 2];
	                    var gamma1xh = gamma1x.high;
	                    var gamma1xl = gamma1x.low;
	                    var gamma1h  = ((gamma1xh >>> 19) | (gamma1xl << 13)) ^ ((gamma1xh << 3) | (gamma1xl >>> 29)) ^ (gamma1xh >>> 6);
	                    var gamma1l  = ((gamma1xl >>> 19) | (gamma1xh << 13)) ^ ((gamma1xl << 3) | (gamma1xh >>> 29)) ^ ((gamma1xl >>> 6) | (gamma1xh << 26));

	                    var Wi7  = W[i - 7];
	                    var Wi7h = Wi7.high;
	                    var Wi7l = Wi7.low;

	                    var Wi16  = W[i - 16];
	                    var Wi16h = Wi16.high;
	                    var Wi16l = Wi16.low;

	                    Wil = gamma0l + Wi7l;
	                    Wih = gamma0h + Wi7h + ((Wil >>> 0) < (gamma0l >>> 0) ? 1 : 0);
	                    Wil = Wil + gamma1l;
	                    Wih = Wih + gamma1h + ((Wil >>> 0) < (gamma1l >>> 0) ? 1 : 0);
	                    Wil = Wil + Wi16l;
	                    Wih = Wih + Wi16h + ((Wil >>> 0) < (Wi16l >>> 0) ? 1 : 0);

	                    Wi.high = Wih;
	                    Wi.low  = Wil;
	                }

	                var chh  = (eh & fh) ^ (~eh & gh);
	                var chl  = (el & fl) ^ (~el & gl);
	                var majh = (ah & bh) ^ (ah & ch) ^ (bh & ch);
	                var majl = (al & bl) ^ (al & cl) ^ (bl & cl);

	                var sigma0h = ((ah >>> 28) | (al << 4))  ^ ((ah << 30)  | (al >>> 2)) ^ ((ah << 25) | (al >>> 7));
	                var sigma0l = ((al >>> 28) | (ah << 4))  ^ ((al << 30)  | (ah >>> 2)) ^ ((al << 25) | (ah >>> 7));
	                var sigma1h = ((eh >>> 14) | (el << 18)) ^ ((eh >>> 18) | (el << 14)) ^ ((eh << 23) | (el >>> 9));
	                var sigma1l = ((el >>> 14) | (eh << 18)) ^ ((el >>> 18) | (eh << 14)) ^ ((el << 23) | (eh >>> 9));

	                var Ki  = K[i];
	                var Kih = Ki.high;
	                var Kil = Ki.low;

	                var t1l = hl + sigma1l;
	                var t1h = hh + sigma1h + ((t1l >>> 0) < (hl >>> 0) ? 1 : 0);
	                var t1l = t1l + chl;
	                var t1h = t1h + chh + ((t1l >>> 0) < (chl >>> 0) ? 1 : 0);
	                var t1l = t1l + Kil;
	                var t1h = t1h + Kih + ((t1l >>> 0) < (Kil >>> 0) ? 1 : 0);
	                var t1l = t1l + Wil;
	                var t1h = t1h + Wih + ((t1l >>> 0) < (Wil >>> 0) ? 1 : 0);

	                var t2l = sigma0l + majl;
	                var t2h = sigma0h + majh + ((t2l >>> 0) < (sigma0l >>> 0) ? 1 : 0);

	                hh = gh;
	                hl = gl;
	                gh = fh;
	                gl = fl;
	                fh = eh;
	                fl = el;
	                el = (dl + t1l) | 0;
	                eh = (dh + t1h + ((el >>> 0) < (dl >>> 0) ? 1 : 0)) | 0;
	                dh = ch;
	                dl = cl;
	                ch = bh;
	                cl = bl;
	                bh = ah;
	                bl = al;
	                al = (t1l + t2l) | 0;
	                ah = (t1h + t2h + ((al >>> 0) < (t1l >>> 0) ? 1 : 0)) | 0;
	            }

	            H0l = H0.low  = (H0l + al);
	            H0.high = (H0h + ah + ((H0l >>> 0) < (al >>> 0) ? 1 : 0));
	            H1l = H1.low  = (H1l + bl);
	            H1.high = (H1h + bh + ((H1l >>> 0) < (bl >>> 0) ? 1 : 0));
	            H2l = H2.low  = (H2l + cl);
	            H2.high = (H2h + ch + ((H2l >>> 0) < (cl >>> 0) ? 1 : 0));
	            H3l = H3.low  = (H3l + dl);
	            H3.high = (H3h + dh + ((H3l >>> 0) < (dl >>> 0) ? 1 : 0));
	            H4l = H4.low  = (H4l + el);
	            H4.high = (H4h + eh + ((H4l >>> 0) < (el >>> 0) ? 1 : 0));
	            H5l = H5.low  = (H5l + fl);
	            H5.high = (H5h + fh + ((H5l >>> 0) < (fl >>> 0) ? 1 : 0));
	            H6l = H6.low  = (H6l + gl);
	            H6.high = (H6h + gh + ((H6l >>> 0) < (gl >>> 0) ? 1 : 0));
	            H7l = H7.low  = (H7l + hl);
	            H7.high = (H7h + hh + ((H7l >>> 0) < (hl >>> 0) ? 1 : 0));
	        },

	        _doFinalize: function () {

	            var data = this._data;
	            var dataWords = data.words;

	            var nBitsTotal = this._nDataBytes * 8;
	            var nBitsLeft = data.sigBytes * 8;

	            dataWords[nBitsLeft >>> 5] |= 0x80 << (24 - nBitsLeft % 32);
	            dataWords[(((nBitsLeft + 128) >>> 10) << 5) + 30] = Math.floor(nBitsTotal / 0x100000000);
	            dataWords[(((nBitsLeft + 128) >>> 10) << 5) + 31] = nBitsTotal;
	            data.sigBytes = dataWords.length * 4;

	            this._process();

	            var hash = this._hash.toX32();

	            return hash;
	        },

	        clone: function () {
	            var clone = Hasher.clone.call(this);
	            clone._hash = this._hash.clone();

	            return clone;
	        },

	        blockSize: 1024/32
	    });

	    
	    C.SHA512 = Hasher._createHelper(SHA512);

	    
	    C.HmacSHA512 = Hasher._createHmacHelper(SHA512);
	}());


	(function () {

	    var C = CryptoJS;
	    var C_x64 = C.x64;
	    var X64Word = C_x64.Word;
	    var X64WordArray = C_x64.WordArray;
	    var C_algo = C.algo;
	    var SHA512 = C_algo.SHA512;

	    
	    var SHA384 = C_algo.SHA384 = SHA512.extend({
	        _doReset: function () {
	            this._hash = new X64WordArray.init([
	                new X64Word.init(0xcbbb9d5d, 0xc1059ed8), new X64Word.init(0x629a292a, 0x367cd507),
	                new X64Word.init(0x9159015a, 0x3070dd17), new X64Word.init(0x152fecd8, 0xf70e5939),
	                new X64Word.init(0x67332667, 0xffc00b31), new X64Word.init(0x8eb44a87, 0x68581511),
	                new X64Word.init(0xdb0c2e0d, 0x64f98fa7), new X64Word.init(0x47b5481d, 0xbefa4fa4)
	            ]);
	        },

	        _doFinalize: function () {
	            var hash = SHA512._doFinalize.call(this);

	            hash.sigBytes -= 16;

	            return hash;
	        }
	    });

	    
	    C.SHA384 = SHA512._createHelper(SHA384);

	    
	    C.HmacSHA384 = SHA512._createHmacHelper(SHA384);
	}());


	(function (Math) {

	    var C = CryptoJS;
	    var C_lib = C.lib;
	    var WordArray = C_lib.WordArray;
	    var Hasher = C_lib.Hasher;
	    var C_x64 = C.x64;
	    var X64Word = C_x64.Word;
	    var C_algo = C.algo;

	    var RHO_OFFSETS = [];
	    var PI_INDEXES  = [];
	    var ROUND_CONSTANTS = [];

	    (function () {

	        var x = 1, y = 0;
	        for (var t = 0; t < 24; t++) {
	            RHO_OFFSETS[x + 5 * y] = ((t + 1) * (t + 2) / 2) % 64;

	            var newX = y % 5;
	            var newY = (2 * x + 3 * y) % 5;
	            x = newX;
	            y = newY;
	        }

	        for (var x = 0; x < 5; x++) {
	            for (var y = 0; y < 5; y++) {
	                PI_INDEXES[x + 5 * y] = y + ((2 * x + 3 * y) % 5) * 5;
	            }
	        }

	        var LFSR = 0x01;
	        for (var i = 0; i < 24; i++) {
	            var roundConstantMsw = 0;
	            var roundConstantLsw = 0;

	            for (var j = 0; j < 7; j++) {
	                if (LFSR & 0x01) {
	                    var bitPosition = (1 << j) - 1;
	                    if (bitPosition < 32) {
	                        roundConstantLsw ^= 1 << bitPosition;
	                    } else  {
	                        roundConstantMsw ^= 1 << (bitPosition - 32);
	                    }
	                }

	                if (LFSR & 0x80) {

	                    LFSR = (LFSR << 1) ^ 0x71;
	                } else {
	                    LFSR <<= 1;
	                }
	            }

	            ROUND_CONSTANTS[i] = X64Word.create(roundConstantMsw, roundConstantLsw);
	        }
	    }());

	    var T = [];
	    (function () {
	        for (var i = 0; i < 25; i++) {
	            T[i] = X64Word.create();
	        }
	    }());

	    
	    var SHA3 = C_algo.SHA3 = Hasher.extend({
	        
	        cfg: Hasher.cfg.extend({
	            outputLength: 512
	        }),

	        _doReset: function () {
	            var state = this._state = []
	            for (var i = 0; i < 25; i++) {
	                state[i] = new X64Word.init();
	            }

	            this.blockSize = (1600 - 2 * this.cfg.outputLength) / 32;
	        },

	        _doProcessBlock: function (M, offset) {

	            var state = this._state;
	            var nBlockSizeLanes = this.blockSize / 2;

	            for (var i = 0; i < nBlockSizeLanes; i++) {

	                var M2i  = M[offset + 2 * i];
	                var M2i1 = M[offset + 2 * i + 1];

	                M2i = (
	                    (((M2i << 8)  | (M2i >>> 24)) & 0x00ff00ff) |
	                    (((M2i << 24) | (M2i >>> 8))  & 0xff00ff00)
	                );
	                M2i1 = (
	                    (((M2i1 << 8)  | (M2i1 >>> 24)) & 0x00ff00ff) |
	                    (((M2i1 << 24) | (M2i1 >>> 8))  & 0xff00ff00)
	                );

	                var lane = state[i];
	                lane.high ^= M2i1;
	                lane.low  ^= M2i;
	            }

	            for (var round = 0; round < 24; round++) {

	                for (var x = 0; x < 5; x++) {

	                    var tMsw = 0, tLsw = 0;
	                    for (var y = 0; y < 5; y++) {
	                        var lane = state[x + 5 * y];
	                        tMsw ^= lane.high;
	                        tLsw ^= lane.low;
	                    }

	                    var Tx = T[x];
	                    Tx.high = tMsw;
	                    Tx.low  = tLsw;
	                }
	                for (var x = 0; x < 5; x++) {

	                    var Tx4 = T[(x + 4) % 5];
	                    var Tx1 = T[(x + 1) % 5];
	                    var Tx1Msw = Tx1.high;
	                    var Tx1Lsw = Tx1.low;

	                    var tMsw = Tx4.high ^ ((Tx1Msw << 1) | (Tx1Lsw >>> 31));
	                    var tLsw = Tx4.low  ^ ((Tx1Lsw << 1) | (Tx1Msw >>> 31));
	                    for (var y = 0; y < 5; y++) {
	                        var lane = state[x + 5 * y];
	                        lane.high ^= tMsw;
	                        lane.low  ^= tLsw;
	                    }
	                }

	                for (var laneIndex = 1; laneIndex < 25; laneIndex++) {
	                    var tMsw;
	                    var tLsw;

	                    var lane = state[laneIndex];
	                    var laneMsw = lane.high;
	                    var laneLsw = lane.low;
	                    var rhoOffset = RHO_OFFSETS[laneIndex];

	                    if (rhoOffset < 32) {
	                        tMsw = (laneMsw << rhoOffset) | (laneLsw >>> (32 - rhoOffset));
	                        tLsw = (laneLsw << rhoOffset) | (laneMsw >>> (32 - rhoOffset));
	                    } else  {
	                        tMsw = (laneLsw << (rhoOffset - 32)) | (laneMsw >>> (64 - rhoOffset));
	                        tLsw = (laneMsw << (rhoOffset - 32)) | (laneLsw >>> (64 - rhoOffset));
	                    }

	                    var TPiLane = T[PI_INDEXES[laneIndex]];
	                    TPiLane.high = tMsw;
	                    TPiLane.low  = tLsw;
	                }

	                var T0 = T[0];
	                var state0 = state[0];
	                T0.high = state0.high;
	                T0.low  = state0.low;

	                for (var x = 0; x < 5; x++) {
	                    for (var y = 0; y < 5; y++) {

	                        var laneIndex = x + 5 * y;
	                        var lane = state[laneIndex];
	                        var TLane = T[laneIndex];
	                        var Tx1Lane = T[((x + 1) % 5) + 5 * y];
	                        var Tx2Lane = T[((x + 2) % 5) + 5 * y];

	                        lane.high = TLane.high ^ (~Tx1Lane.high & Tx2Lane.high);
	                        lane.low  = TLane.low  ^ (~Tx1Lane.low  & Tx2Lane.low);
	                    }
	                }

	                var lane = state[0];
	                var roundConstant = ROUND_CONSTANTS[round];
	                lane.high ^= roundConstant.high;
	                lane.low  ^= roundConstant.low;
	            }
	        },

	        _doFinalize: function () {

	            var data = this._data;
	            var dataWords = data.words;
	            var nBitsTotal = this._nDataBytes * 8;
	            var nBitsLeft = data.sigBytes * 8;
	            var blockSizeBits = this.blockSize * 32;

	            dataWords[nBitsLeft >>> 5] |= 0x1 << (24 - nBitsLeft % 32);
	            dataWords[((Math.ceil((nBitsLeft + 1) / blockSizeBits) * blockSizeBits) >>> 5) - 1] |= 0x80;
	            data.sigBytes = dataWords.length * 4;

	            this._process();

	            var state = this._state;
	            var outputLengthBytes = this.cfg.outputLength / 8;
	            var outputLengthLanes = outputLengthBytes / 8;

	            var hashWords = [];
	            for (var i = 0; i < outputLengthLanes; i++) {

	                var lane = state[i];
	                var laneMsw = lane.high;
	                var laneLsw = lane.low;

	                laneMsw = (
	                    (((laneMsw << 8)  | (laneMsw >>> 24)) & 0x00ff00ff) |
	                    (((laneMsw << 24) | (laneMsw >>> 8))  & 0xff00ff00)
	                );
	                laneLsw = (
	                    (((laneLsw << 8)  | (laneLsw >>> 24)) & 0x00ff00ff) |
	                    (((laneLsw << 24) | (laneLsw >>> 8))  & 0xff00ff00)
	                );

	                hashWords.push(laneLsw);
	                hashWords.push(laneMsw);
	            }

	            return new WordArray.init(hashWords, outputLengthBytes);
	        },

	        clone: function () {
	            var clone = Hasher.clone.call(this);

	            var state = clone._state = this._state.slice(0);
	            for (var i = 0; i < 25; i++) {
	                state[i] = state[i].clone();
	            }

	            return clone;
	        }
	    });

	    
	    C.SHA3 = Hasher._createHelper(SHA3);

	    
	    C.HmacSHA3 = Hasher._createHmacHelper(SHA3);
	}(Math));


	

	(function (Math) {

	    var C = CryptoJS;
	    var C_lib = C.lib;
	    var WordArray = C_lib.WordArray;
	    var Hasher = C_lib.Hasher;
	    var C_algo = C.algo;

	    var _zl = WordArray.create([
	        0,  1,  2,  3,  4,  5,  6,  7,  8,  9, 10, 11, 12, 13, 14, 15,
	        7,  4, 13,  1, 10,  6, 15,  3, 12,  0,  9,  5,  2, 14, 11,  8,
	        3, 10, 14,  4,  9, 15,  8,  1,  2,  7,  0,  6, 13, 11,  5, 12,
	        1,  9, 11, 10,  0,  8, 12,  4, 13,  3,  7, 15, 14,  5,  6,  2,
	        4,  0,  5,  9,  7, 12,  2, 10, 14,  1,  3,  8, 11,  6, 15, 13]);
	    var _zr = WordArray.create([
	        5, 14,  7,  0,  9,  2, 11,  4, 13,  6, 15,  8,  1, 10,  3, 12,
	        6, 11,  3,  7,  0, 13,  5, 10, 14, 15,  8, 12,  4,  9,  1,  2,
	        15,  5,  1,  3,  7, 14,  6,  9, 11,  8, 12,  2, 10,  0,  4, 13,
	        8,  6,  4,  1,  3, 11, 15,  0,  5, 12,  2, 13,  9,  7, 10, 14,
	        12, 15, 10,  4,  1,  5,  8,  7,  6,  2, 13, 14,  0,  3,  9, 11]);
	    var _sl = WordArray.create([
	         11, 14, 15, 12,  5,  8,  7,  9, 11, 13, 14, 15,  6,  7,  9,  8,
	        7, 6,   8, 13, 11,  9,  7, 15,  7, 12, 15,  9, 11,  7, 13, 12,
	        11, 13,  6,  7, 14,  9, 13, 15, 14,  8, 13,  6,  5, 12,  7,  5,
	          11, 12, 14, 15, 14, 15,  9,  8,  9, 14,  5,  6,  8,  6,  5, 12,
	        9, 15,  5, 11,  6,  8, 13, 12,  5, 12, 13, 14, 11,  8,  5,  6 ]);
	    var _sr = WordArray.create([
	        8,  9,  9, 11, 13, 15, 15,  5,  7,  7,  8, 11, 14, 14, 12,  6,
	        9, 13, 15,  7, 12,  8,  9, 11,  7,  7, 12,  7,  6, 15, 13, 11,
	        9,  7, 15, 11,  8,  6,  6, 14, 12, 13,  5, 14, 13, 13,  7,  5,
	        15,  5,  8, 11, 14, 14,  6, 14,  6,  9, 12,  9, 12,  5, 15,  8,
	        8,  5, 12,  9, 12,  5, 14,  6,  8, 13,  6,  5, 15, 13, 11, 11 ]);

	    var _hl =  WordArray.create([ 0x00000000, 0x5A827999, 0x6ED9EBA1, 0x8F1BBCDC, 0xA953FD4E]);
	    var _hr =  WordArray.create([ 0x50A28BE6, 0x5C4DD124, 0x6D703EF3, 0x7A6D76E9, 0x00000000]);

	    
	    var RIPEMD160 = C_algo.RIPEMD160 = Hasher.extend({
	        _doReset: function () {
	            this._hash  = WordArray.create([0x67452301, 0xEFCDAB89, 0x98BADCFE, 0x10325476, 0xC3D2E1F0]);
	        },

	        _doProcessBlock: function (M, offset) {

	            for (var i = 0; i < 16; i++) {

	                var offset_i = offset + i;
	                var M_offset_i = M[offset_i];

	                M[offset_i] = (
	                    (((M_offset_i << 8)  | (M_offset_i >>> 24)) & 0x00ff00ff) |
	                    (((M_offset_i << 24) | (M_offset_i >>> 8))  & 0xff00ff00)
	                );
	            }

	            var H  = this._hash.words;
	            var hl = _hl.words;
	            var hr = _hr.words;
	            var zl = _zl.words;
	            var zr = _zr.words;
	            var sl = _sl.words;
	            var sr = _sr.words;

	            var al, bl, cl, dl, el;
	            var ar, br, cr, dr, er;

	            ar = al = H[0];
	            br = bl = H[1];
	            cr = cl = H[2];
	            dr = dl = H[3];
	            er = el = H[4];

	            var t;
	            for (var i = 0; i < 80; i += 1) {
	                t = (al +  M[offset+zl[i]])|0;
	                if (i<16){
		            t +=  f1(bl,cl,dl) + hl[0];
	                } else if (i<32) {
		            t +=  f2(bl,cl,dl) + hl[1];
	                } else if (i<48) {
		            t +=  f3(bl,cl,dl) + hl[2];
	                } else if (i<64) {
		            t +=  f4(bl,cl,dl) + hl[3];
	                } else {// if (i<80) {
		            t +=  f5(bl,cl,dl) + hl[4];
	                }
	                t = t|0;
	                t =  rotl(t,sl[i]);
	                t = (t+el)|0;
	                al = el;
	                el = dl;
	                dl = rotl(cl, 10);
	                cl = bl;
	                bl = t;

	                t = (ar + M[offset+zr[i]])|0;
	                if (i<16){
		            t +=  f5(br,cr,dr) + hr[0];
	                } else if (i<32) {
		            t +=  f4(br,cr,dr) + hr[1];
	                } else if (i<48) {
		            t +=  f3(br,cr,dr) + hr[2];
	                } else if (i<64) {
		            t +=  f2(br,cr,dr) + hr[3];
	                } else {// if (i<80) {
		            t +=  f1(br,cr,dr) + hr[4];
	                }
	                t = t|0;
	                t =  rotl(t,sr[i]) ;
	                t = (t+er)|0;
	                ar = er;
	                er = dr;
	                dr = rotl(cr, 10);
	                cr = br;
	                br = t;
	            }

	            t    = (H[1] + cl + dr)|0;
	            H[1] = (H[2] + dl + er)|0;
	            H[2] = (H[3] + el + ar)|0;
	            H[3] = (H[4] + al + br)|0;
	            H[4] = (H[0] + bl + cr)|0;
	            H[0] =  t;
	        },

	        _doFinalize: function () {

	            var data = this._data;
	            var dataWords = data.words;

	            var nBitsTotal = this._nDataBytes * 8;
	            var nBitsLeft = data.sigBytes * 8;

	            dataWords[nBitsLeft >>> 5] |= 0x80 << (24 - nBitsLeft % 32);
	            dataWords[(((nBitsLeft + 64) >>> 9) << 4) + 14] = (
	                (((nBitsTotal << 8)  | (nBitsTotal >>> 24)) & 0x00ff00ff) |
	                (((nBitsTotal << 24) | (nBitsTotal >>> 8))  & 0xff00ff00)
	            );
	            data.sigBytes = (dataWords.length + 1) * 4;

	            this._process();

	            var hash = this._hash;
	            var H = hash.words;

	            for (var i = 0; i < 5; i++) {

	                var H_i = H[i];

	                H[i] = (((H_i << 8)  | (H_i >>> 24)) & 0x00ff00ff) |
	                       (((H_i << 24) | (H_i >>> 8))  & 0xff00ff00);
	            }

	            return hash;
	        },

	        clone: function () {
	            var clone = Hasher.clone.call(this);
	            clone._hash = this._hash.clone();

	            return clone;
	        }
	    });


	    function f1(x, y, z) {
	        return ((x) ^ (y) ^ (z));

	    }

	    function f2(x, y, z) {
	        return (((x)&(y)) | ((~x)&(z)));
	    }

	    function f3(x, y, z) {
	        return (((x) | (~(y))) ^ (z));
	    }

	    function f4(x, y, z) {
	        return (((x) & (z)) | ((y)&(~(z))));
	    }

	    function f5(x, y, z) {
	        return ((x) ^ ((y) |(~(z))));

	    }

	    function rotl(x,n) {
	        return (x<<n) | (x>>>(32-n));
	    }


	    
	    C.RIPEMD160 = Hasher._createHelper(RIPEMD160);

	    
	    C.HmacRIPEMD160 = Hasher._createHmacHelper(RIPEMD160);
	}(Math));


	(function () {

	    var C = CryptoJS;
	    var C_lib = C.lib;
	    var Base = C_lib.Base;
	    var C_enc = C.enc;
	    var Utf8 = C_enc.Utf8;
	    var C_algo = C.algo;

	    
	    var HMAC = C_algo.HMAC = Base.extend({
	        
	        init: function (hasher, key) {

	            hasher = this._hasher = new hasher.init();

	            if (typeof key == 'string') {
	                key = Utf8.parse(key);
	            }

	            var hasherBlockSize = hasher.blockSize;
	            var hasherBlockSizeBytes = hasherBlockSize * 4;

	            if (key.sigBytes > hasherBlockSizeBytes) {
	                key = hasher.finalize(key);
	            }

	            key.clamp();

	            var oKey = this._oKey = key.clone();
	            var iKey = this._iKey = key.clone();

	            var oKeyWords = oKey.words;
	            var iKeyWords = iKey.words;

	            for (var i = 0; i < hasherBlockSize; i++) {
	                oKeyWords[i] ^= 0x5c5c5c5c;
	                iKeyWords[i] ^= 0x36363636;
	            }
	            oKey.sigBytes = iKey.sigBytes = hasherBlockSizeBytes;

	            this.reset();
	        },

	        
	        reset: function () {

	            var hasher = this._hasher;

	            hasher.reset();
	            hasher.update(this._iKey);
	        },

	        
	        update: function (messageUpdate) {
	            this._hasher.update(messageUpdate);

	            return this;
	        },

	        
	        finalize: function (messageUpdate) {

	            var hasher = this._hasher;

	            var innerHash = hasher.finalize(messageUpdate);
	            hasher.reset();
	            var hmac = hasher.finalize(this._oKey.clone().concat(innerHash));

	            return hmac;
	        }
	    });
	}());


	(function () {

	    var C = CryptoJS;
	    var C_lib = C.lib;
	    var Base = C_lib.Base;
	    var WordArray = C_lib.WordArray;
	    var C_algo = C.algo;
	    var SHA256 = C_algo.SHA256;
	    var HMAC = C_algo.HMAC;

	    
	    var PBKDF2 = C_algo.PBKDF2 = Base.extend({
	        
	        cfg: Base.extend({
	            keySize: 128/32,
	            hasher: SHA256,
	            iterations: 250000
	        }),

	        
	        init: function (cfg) {
	            this.cfg = this.cfg.extend(cfg);
	        },

	        
	        compute: function (password, salt) {

	            var cfg = this.cfg;

	            var hmac = HMAC.create(cfg.hasher, password);

	            var derivedKey = WordArray.create();
	            var blockIndex = WordArray.create([0x00000001]);

	            var derivedKeyWords = derivedKey.words;
	            var blockIndexWords = blockIndex.words;
	            var keySize = cfg.keySize;
	            var iterations = cfg.iterations;

	            while (derivedKeyWords.length < keySize) {
	                var block = hmac.update(salt).finalize(blockIndex);
	                hmac.reset();

	                var blockWords = block.words;
	                var blockWordsLength = blockWords.length;

	                var intermediate = block;
	                for (var i = 1; i < iterations; i++) {
	                    intermediate = hmac.finalize(intermediate);
	                    hmac.reset();

	                    var intermediateWords = intermediate.words;

	                    for (var j = 0; j < blockWordsLength; j++) {
	                        blockWords[j] ^= intermediateWords[j];
	                    }
	                }

	                derivedKey.concat(block);
	                blockIndexWords[0]++;
	            }
	            derivedKey.sigBytes = keySize * 4;

	            return derivedKey;
	        }
	    });

	    
	    C.PBKDF2 = function (password, salt, cfg) {
	        return PBKDF2.create(cfg).compute(password, salt);
	    };
	}());


	(function () {

	    var C = CryptoJS;
	    var C_lib = C.lib;
	    var Base = C_lib.Base;
	    var WordArray = C_lib.WordArray;
	    var C_algo = C.algo;
	    var MD5 = C_algo.MD5;

	    
	    var EvpKDF = C_algo.EvpKDF = Base.extend({
	        
	        cfg: Base.extend({
	            keySize: 128/32,
	            hasher: MD5,
	            iterations: 1
	        }),

	        
	        init: function (cfg) {
	            this.cfg = this.cfg.extend(cfg);
	        },

	        
	        compute: function (password, salt) {
	            var block;

	            var cfg = this.cfg;

	            var hasher = cfg.hasher.create();

	            var derivedKey = WordArray.create();

	            var derivedKeyWords = derivedKey.words;
	            var keySize = cfg.keySize;
	            var iterations = cfg.iterations;

	            while (derivedKeyWords.length < keySize) {
	                if (block) {
	                    hasher.update(block);
	                }
	                block = hasher.update(password).finalize(salt);
	                hasher.reset();

	                for (var i = 1; i < iterations; i++) {
	                    block = hasher.finalize(block);
	                    hasher.reset();
	                }

	                derivedKey.concat(block);
	            }
	            derivedKey.sigBytes = keySize * 4;

	            return derivedKey;
	        }
	    });

	    
	    C.EvpKDF = function (password, salt, cfg) {
	        return EvpKDF.create(cfg).compute(password, salt);
	    };
	}());


	
	CryptoJS.lib.Cipher || (function (undefined) {

	    var C = CryptoJS;
	    var C_lib = C.lib;
	    var Base = C_lib.Base;
	    var WordArray = C_lib.WordArray;
	    var BufferedBlockAlgorithm = C_lib.BufferedBlockAlgorithm;
	    var C_enc = C.enc;
	    var Utf8 = C_enc.Utf8;
	    var Base64 = C_enc.Base64;
	    var C_algo = C.algo;
	    var EvpKDF = C_algo.EvpKDF;

	    
	    var Cipher = C_lib.Cipher = BufferedBlockAlgorithm.extend({
	        
	        cfg: Base.extend(),

	        
	        createEncryptor: function (key, cfg) {
	            return this.create(this._ENC_XFORM_MODE, key, cfg);
	        },

	        
	        createDecryptor: function (key, cfg) {
	            return this.create(this._DEC_XFORM_MODE, key, cfg);
	        },

	        
	        init: function (xformMode, key, cfg) {

	            this.cfg = this.cfg.extend(cfg);

	            this._xformMode = xformMode;
	            this._key = key;

	            this.reset();
	        },

	        
	        reset: function () {

	            BufferedBlockAlgorithm.reset.call(this);

	            this._doReset();
	        },

	        
	        process: function (dataUpdate) {

	            this._append(dataUpdate);

	            return this._process();
	        },

	        
	        finalize: function (dataUpdate) {

	            if (dataUpdate) {
	                this._append(dataUpdate);
	            }

	            var finalProcessedData = this._doFinalize();

	            return finalProcessedData;
	        },

	        keySize: 128/32,

	        ivSize: 128/32,

	        _ENC_XFORM_MODE: 1,

	        _DEC_XFORM_MODE: 2,

	        
	        _createHelper: (function () {
	            function selectCipherStrategy(key) {
	                if (typeof key == 'string') {
	                    return PasswordBasedCipher;
	                } else {
	                    return SerializableCipher;
	                }
	            }

	            return function (cipher) {
	                return {
	                    encrypt: function (message, key, cfg) {
	                        return selectCipherStrategy(key).encrypt(cipher, message, key, cfg);
	                    },

	                    decrypt: function (ciphertext, key, cfg) {
	                        return selectCipherStrategy(key).decrypt(cipher, ciphertext, key, cfg);
	                    }
	                };
	            };
	        }())
	    });

	    
	    var StreamCipher = C_lib.StreamCipher = Cipher.extend({
	        _doFinalize: function () {

	            var finalProcessedBlocks = this._process(!!'flush');

	            return finalProcessedBlocks;
	        },

	        blockSize: 1
	    });

	    
	    var C_mode = C.mode = {};

	    
	    var BlockCipherMode = C_lib.BlockCipherMode = Base.extend({
	        
	        createEncryptor: function (cipher, iv) {
	            return this.Encryptor.create(cipher, iv);
	        },

	        
	        createDecryptor: function (cipher, iv) {
	            return this.Decryptor.create(cipher, iv);
	        },

	        
	        init: function (cipher, iv) {
	            this._cipher = cipher;
	            this._iv = iv;
	        }
	    });

	    
	    var CBC = C_mode.CBC = (function () {
	        
	        var CBC = BlockCipherMode.extend();

	        
	        CBC.Encryptor = CBC.extend({
	            
	            processBlock: function (words, offset) {

	                var cipher = this._cipher;
	                var blockSize = cipher.blockSize;

	                xorBlock.call(this, words, offset, blockSize);
	                cipher.encryptBlock(words, offset);

	                this._prevBlock = words.slice(offset, offset + blockSize);
	            }
	        });

	        
	        CBC.Decryptor = CBC.extend({
	            
	            processBlock: function (words, offset) {

	                var cipher = this._cipher;
	                var blockSize = cipher.blockSize;

	                var thisBlock = words.slice(offset, offset + blockSize);

	                cipher.decryptBlock(words, offset);
	                xorBlock.call(this, words, offset, blockSize);

	                this._prevBlock = thisBlock;
	            }
	        });

	        function xorBlock(words, offset, blockSize) {
	            var block;

	            var iv = this._iv;

	            if (iv) {
	                block = iv;

	                this._iv = undefined;
	            } else {
	                block = this._prevBlock;
	            }

	            for (var i = 0; i < blockSize; i++) {
	                words[offset + i] ^= block[i];
	            }
	        }

	        return CBC;
	    }());

	    
	    var C_pad = C.pad = {};

	    
	    var Pkcs7 = C_pad.Pkcs7 = {
	        
	        pad: function (data, blockSize) {

	            var blockSizeBytes = blockSize * 4;

	            var nPaddingBytes = blockSizeBytes - data.sigBytes % blockSizeBytes;

	            var paddingWord = (nPaddingBytes << 24) | (nPaddingBytes << 16) | (nPaddingBytes << 8) | nPaddingBytes;

	            var paddingWords = [];
	            for (var i = 0; i < nPaddingBytes; i += 4) {
	                paddingWords.push(paddingWord);
	            }
	            var padding = WordArray.create(paddingWords, nPaddingBytes);

	            data.concat(padding);
	        },

	        
	        unpad: function (data) {

	            var nPaddingBytes = data.words[(data.sigBytes - 1) >>> 2] & 0xff;

	            data.sigBytes -= nPaddingBytes;
	        }
	    };

	    
	    var BlockCipher = C_lib.BlockCipher = Cipher.extend({
	        
	        cfg: Cipher.cfg.extend({
	            mode: CBC,
	            padding: Pkcs7
	        }),

	        reset: function () {
	            var modeCreator;

	            Cipher.reset.call(this);

	            var cfg = this.cfg;
	            var iv = cfg.iv;
	            var mode = cfg.mode;

	            if (this._xformMode == this._ENC_XFORM_MODE) {
	                modeCreator = mode.createEncryptor;
	            } else  {
	                modeCreator = mode.createDecryptor;

	                this._minBufferSize = 1;
	            }

	            if (this._mode && this._mode.__creator == modeCreator) {
	                this._mode.init(this, iv && iv.words);
	            } else {
	                this._mode = modeCreator.call(mode, this, iv && iv.words);
	                this._mode.__creator = modeCreator;
	            }
	        },

	        _doProcessBlock: function (words, offset) {
	            this._mode.processBlock(words, offset);
	        },

	        _doFinalize: function () {
	            var finalProcessedBlocks;

	            var padding = this.cfg.padding;

	            if (this._xformMode == this._ENC_XFORM_MODE) {

	                padding.pad(this._data, this.blockSize);

	                finalProcessedBlocks = this._process(!!'flush');
	            } else  {

	                finalProcessedBlocks = this._process(!!'flush');

	                padding.unpad(finalProcessedBlocks);
	            }

	            return finalProcessedBlocks;
	        },

	        blockSize: 128/32
	    });

	    
	    var CipherParams = C_lib.CipherParams = Base.extend({
	        
	        init: function (cipherParams) {
	            this.mixIn(cipherParams);
	        },

	        
	        toString: function (formatter) {
	            return (formatter || this.formatter).stringify(this);
	        }
	    });

	    
	    var C_format = C.format = {};

	    
	    var OpenSSLFormatter = C_format.OpenSSL = {
	        
	        stringify: function (cipherParams) {
	            var wordArray;

	            var ciphertext = cipherParams.ciphertext;
	            var salt = cipherParams.salt;

	            if (salt) {
	                wordArray = WordArray.create([0x53616c74, 0x65645f5f]).concat(salt).concat(ciphertext);
	            } else {
	                wordArray = ciphertext;
	            }

	            return wordArray.toString(Base64);
	        },

	        
	        parse: function (openSSLStr) {
	            var salt;

	            var ciphertext = Base64.parse(openSSLStr);

	            var ciphertextWords = ciphertext.words;

	            if (ciphertextWords[0] == 0x53616c74 && ciphertextWords[1] == 0x65645f5f) {

	                salt = WordArray.create(ciphertextWords.slice(2, 4));

	                ciphertextWords.splice(0, 4);
	                ciphertext.sigBytes -= 16;
	            }

	            return CipherParams.create({ ciphertext: ciphertext, salt: salt });
	        }
	    };

	    
	    var SerializableCipher = C_lib.SerializableCipher = Base.extend({
	        
	        cfg: Base.extend({
	            format: OpenSSLFormatter
	        }),

	        
	        encrypt: function (cipher, message, key, cfg) {

	            cfg = this.cfg.extend(cfg);

	            var encryptor = cipher.createEncryptor(key, cfg);
	            var ciphertext = encryptor.finalize(message);

	            var cipherCfg = encryptor.cfg;

	            return CipherParams.create({
	                ciphertext: ciphertext,
	                key: key,
	                iv: cipherCfg.iv,
	                algorithm: cipher,
	                mode: cipherCfg.mode,
	                padding: cipherCfg.padding,
	                blockSize: cipher.blockSize,
	                formatter: cfg.format
	            });
	        },

	        
	        decrypt: function (cipher, ciphertext, key, cfg) {

	            cfg = this.cfg.extend(cfg);

	            ciphertext = this._parse(ciphertext, cfg.format);

	            var plaintext = cipher.createDecryptor(key, cfg).finalize(ciphertext.ciphertext);

	            return plaintext;
	        },

	        
	        _parse: function (ciphertext, format) {
	            if (typeof ciphertext == 'string') {
	                return format.parse(ciphertext, this);
	            } else {
	                return ciphertext;
	            }
	        }
	    });

	    
	    var C_kdf = C.kdf = {};

	    
	    var OpenSSLKdf = C_kdf.OpenSSL = {
	        
	        execute: function (password, keySize, ivSize, salt, hasher) {

	            if (!salt) {
	                salt = WordArray.random(64/8);
	            }

	            if (!hasher) {
	                var key = EvpKDF.create({ keySize: keySize + ivSize }).compute(password, salt);
	            } else {
	                var key = EvpKDF.create({ keySize: keySize + ivSize, hasher: hasher }).compute(password, salt);
	            }

	            var iv = WordArray.create(key.words.slice(keySize), ivSize * 4);
	            key.sigBytes = keySize * 4;

	            return CipherParams.create({ key: key, iv: iv, salt: salt });
	        }
	    };

	    
	    var PasswordBasedCipher = C_lib.PasswordBasedCipher = SerializableCipher.extend({
	        
	        cfg: SerializableCipher.cfg.extend({
	            kdf: OpenSSLKdf
	        }),

	        
	        encrypt: function (cipher, message, password, cfg) {

	            cfg = this.cfg.extend(cfg);

	            var derivedParams = cfg.kdf.execute(password, cipher.keySize, cipher.ivSize, cfg.salt, cfg.hasher);

	            cfg.iv = derivedParams.iv;

	            var ciphertext = SerializableCipher.encrypt.call(this, cipher, message, derivedParams.key, cfg);

	            ciphertext.mixIn(derivedParams);

	            return ciphertext;
	        },

	        
	        decrypt: function (cipher, ciphertext, password, cfg) {

	            cfg = this.cfg.extend(cfg);

	            ciphertext = this._parse(ciphertext, cfg.format);

	            var derivedParams = cfg.kdf.execute(password, cipher.keySize, cipher.ivSize, ciphertext.salt, cfg.hasher);

	            cfg.iv = derivedParams.iv;

	            var plaintext = SerializableCipher.decrypt.call(this, cipher, ciphertext, derivedParams.key, cfg);

	            return plaintext;
	        }
	    });
	}());


	
	CryptoJS.mode.CFB = (function () {
	    var CFB = CryptoJS.lib.BlockCipherMode.extend();

	    CFB.Encryptor = CFB.extend({
	        processBlock: function (words, offset) {

	            var cipher = this._cipher;
	            var blockSize = cipher.blockSize;

	            generateKeystreamAndEncrypt.call(this, words, offset, blockSize, cipher);

	            this._prevBlock = words.slice(offset, offset + blockSize);
	        }
	    });

	    CFB.Decryptor = CFB.extend({
	        processBlock: function (words, offset) {

	            var cipher = this._cipher;
	            var blockSize = cipher.blockSize;

	            var thisBlock = words.slice(offset, offset + blockSize);

	            generateKeystreamAndEncrypt.call(this, words, offset, blockSize, cipher);

	            this._prevBlock = thisBlock;
	        }
	    });

	    function generateKeystreamAndEncrypt(words, offset, blockSize, cipher) {
	        var keystream;

	        var iv = this._iv;

	        if (iv) {
	            keystream = iv.slice(0);

	            this._iv = undefined;
	        } else {
	            keystream = this._prevBlock;
	        }
	        cipher.encryptBlock(keystream, 0);

	        for (var i = 0; i < blockSize; i++) {
	            words[offset + i] ^= keystream[i];
	        }
	    }

	    return CFB;
	}());


	
	CryptoJS.mode.CTR = (function () {
	    var CTR = CryptoJS.lib.BlockCipherMode.extend();

	    var Encryptor = CTR.Encryptor = CTR.extend({
	        processBlock: function (words, offset) {

	            var cipher = this._cipher
	            var blockSize = cipher.blockSize;
	            var iv = this._iv;
	            var counter = this._counter;

	            if (iv) {
	                counter = this._counter = iv.slice(0);

	                this._iv = undefined;
	            }
	            var keystream = counter.slice(0);
	            cipher.encryptBlock(keystream, 0);

	            counter[blockSize - 1] = (counter[blockSize - 1] + 1) | 0

	            for (var i = 0; i < blockSize; i++) {
	                words[offset + i] ^= keystream[i];
	            }
	        }
	    });

	    CTR.Decryptor = Encryptor;

	    return CTR;
	}());


	
	CryptoJS.mode.CTRGladman = (function () {
	    var CTRGladman = CryptoJS.lib.BlockCipherMode.extend();

		function incWord(word)
		{
			if (((word >> 24) & 0xff) === 0xff) { //overflow
			var b1 = (word >> 16)&0xff;
			var b2 = (word >> 8)&0xff;
			var b3 = word & 0xff;

			if (b1 === 0xff) // overflow b1
			{
			b1 = 0;
			if (b2 === 0xff)
			{
				b2 = 0;
				if (b3 === 0xff)
				{
					b3 = 0;
				}
				else
				{
					++b3;
				}
			}
			else
			{
				++b2;
			}
			}
			else
			{
			++b1;
			}

			word = 0;
			word += (b1 << 16);
			word += (b2 << 8);
			word += b3;
			}
			else
			{
			word += (0x01 << 24);
			}
			return word;
		}

		function incCounter(counter)
		{
			if ((counter[0] = incWord(counter[0])) === 0)
			{

				counter[1] = incWord(counter[1]);
			}
			return counter;
		}

	    var Encryptor = CTRGladman.Encryptor = CTRGladman.extend({
	        processBlock: function (words, offset) {

	            var cipher = this._cipher
	            var blockSize = cipher.blockSize;
	            var iv = this._iv;
	            var counter = this._counter;

	            if (iv) {
	                counter = this._counter = iv.slice(0);

	                this._iv = undefined;
	            }

				incCounter(counter);

				var keystream = counter.slice(0);
	            cipher.encryptBlock(keystream, 0);

	            for (var i = 0; i < blockSize; i++) {
	                words[offset + i] ^= keystream[i];
	            }
	        }
	    });

	    CTRGladman.Decryptor = Encryptor;

	    return CTRGladman;
	}());




	
	CryptoJS.mode.OFB = (function () {
	    var OFB = CryptoJS.lib.BlockCipherMode.extend();

	    var Encryptor = OFB.Encryptor = OFB.extend({
	        processBlock: function (words, offset) {

	            var cipher = this._cipher
	            var blockSize = cipher.blockSize;
	            var iv = this._iv;
	            var keystream = this._keystream;

	            if (iv) {
	                keystream = this._keystream = iv.slice(0);

	                this._iv = undefined;
	            }
	            cipher.encryptBlock(keystream, 0);

	            for (var i = 0; i < blockSize; i++) {
	                words[offset + i] ^= keystream[i];
	            }
	        }
	    });

	    OFB.Decryptor = Encryptor;

	    return OFB;
	}());


	
	CryptoJS.mode.ECB = (function () {
	    var ECB = CryptoJS.lib.BlockCipherMode.extend();

	    ECB.Encryptor = ECB.extend({
	        processBlock: function (words, offset) {
	            this._cipher.encryptBlock(words, offset);
	        }
	    });

	    ECB.Decryptor = ECB.extend({
	        processBlock: function (words, offset) {
	            this._cipher.decryptBlock(words, offset);
	        }
	    });

	    return ECB;
	}());


	
	CryptoJS.pad.AnsiX923 = {
	    pad: function (data, blockSize) {

	        var dataSigBytes = data.sigBytes;
	        var blockSizeBytes = blockSize * 4;

	        var nPaddingBytes = blockSizeBytes - dataSigBytes % blockSizeBytes;

	        var lastBytePos = dataSigBytes + nPaddingBytes - 1;

	        data.clamp();
	        data.words[lastBytePos >>> 2] |= nPaddingBytes << (24 - (lastBytePos % 4) * 8);
	        data.sigBytes += nPaddingBytes;
	    },

	    unpad: function (data) {

	        var nPaddingBytes = data.words[(data.sigBytes - 1) >>> 2] & 0xff;

	        data.sigBytes -= nPaddingBytes;
	    }
	};


	
	CryptoJS.pad.Iso10126 = {
	    pad: function (data, blockSize) {

	        var blockSizeBytes = blockSize * 4;

	        var nPaddingBytes = blockSizeBytes - data.sigBytes % blockSizeBytes;

	        data.concat(CryptoJS.lib.WordArray.random(nPaddingBytes - 1)).
	             concat(CryptoJS.lib.WordArray.create([nPaddingBytes << 24], 1));
	    },

	    unpad: function (data) {

	        var nPaddingBytes = data.words[(data.sigBytes - 1) >>> 2] & 0xff;

	        data.sigBytes -= nPaddingBytes;
	    }
	};


	
	CryptoJS.pad.Iso97971 = {
	    pad: function (data, blockSize) {

	        data.concat(CryptoJS.lib.WordArray.create([0x80000000], 1));

	        CryptoJS.pad.ZeroPadding.pad(data, blockSize);
	    },

	    unpad: function (data) {

	        CryptoJS.pad.ZeroPadding.unpad(data);

	        data.sigBytes--;
	    }
	};


	
	CryptoJS.pad.ZeroPadding = {
	    pad: function (data, blockSize) {

	        var blockSizeBytes = blockSize * 4;

	        data.clamp();
	        data.sigBytes += blockSizeBytes - ((data.sigBytes % blockSizeBytes) || blockSizeBytes);
	    },

	    unpad: function (data) {

	        var dataWords = data.words;

	        var i = data.sigBytes - 1;
	        for (var i = data.sigBytes - 1; i >= 0; i--) {
	            if (((dataWords[i >>> 2] >>> (24 - (i % 4) * 8)) & 0xff)) {
	                data.sigBytes = i + 1;
	                break;
	            }
	        }
	    }
	};


	
	CryptoJS.pad.NoPadding = {
	    pad: function () {
	    },

	    unpad: function () {
	    }
	};


	(function (undefined) {

	    var C = CryptoJS;
	    var C_lib = C.lib;
	    var CipherParams = C_lib.CipherParams;
	    var C_enc = C.enc;
	    var Hex = C_enc.Hex;
	    var C_format = C.format;

	    var HexFormatter = C_format.Hex = {
	        
	        stringify: function (cipherParams) {
	            return cipherParams.ciphertext.toString(Hex);
	        },

	        
	        parse: function (input) {
	            var ciphertext = Hex.parse(input);
	            return CipherParams.create({ ciphertext: ciphertext });
	        }
	    };
	}());


	(function () {

	    var C = CryptoJS;
	    var C_lib = C.lib;
	    var BlockCipher = C_lib.BlockCipher;
	    var C_algo = C.algo;

	    var SBOX = [];
	    var INV_SBOX = [];
	    var SUB_MIX_0 = [];
	    var SUB_MIX_1 = [];
	    var SUB_MIX_2 = [];
	    var SUB_MIX_3 = [];
	    var INV_SUB_MIX_0 = [];
	    var INV_SUB_MIX_1 = [];
	    var INV_SUB_MIX_2 = [];
	    var INV_SUB_MIX_3 = [];

	    (function () {

	        var d = [];
	        for (var i = 0; i < 256; i++) {
	            if (i < 128) {
	                d[i] = i << 1;
	            } else {
	                d[i] = (i << 1) ^ 0x11b;
	            }
	        }

	        var x = 0;
	        var xi = 0;
	        for (var i = 0; i < 256; i++) {

	            var sx = xi ^ (xi << 1) ^ (xi << 2) ^ (xi << 3) ^ (xi << 4);
	            sx = (sx >>> 8) ^ (sx & 0xff) ^ 0x63;
	            SBOX[x] = sx;
	            INV_SBOX[sx] = x;

	            var x2 = d[x];
	            var x4 = d[x2];
	            var x8 = d[x4];

	            var t = (d[sx] * 0x101) ^ (sx * 0x1010100);
	            SUB_MIX_0[x] = (t << 24) | (t >>> 8);
	            SUB_MIX_1[x] = (t << 16) | (t >>> 16);
	            SUB_MIX_2[x] = (t << 8)  | (t >>> 24);
	            SUB_MIX_3[x] = t;

	            var t = (x8 * 0x1010101) ^ (x4 * 0x10001) ^ (x2 * 0x101) ^ (x * 0x1010100);
	            INV_SUB_MIX_0[sx] = (t << 24) | (t >>> 8);
	            INV_SUB_MIX_1[sx] = (t << 16) | (t >>> 16);
	            INV_SUB_MIX_2[sx] = (t << 8)  | (t >>> 24);
	            INV_SUB_MIX_3[sx] = t;

	            if (!x) {
	                x = xi = 1;
	            } else {
	                x = x2 ^ d[d[d[x8 ^ x2]]];
	                xi ^= d[d[xi]];
	            }
	        }
	    }());

	    var RCON = [0x00, 0x01, 0x02, 0x04, 0x08, 0x10, 0x20, 0x40, 0x80, 0x1b, 0x36];

	    
	    var AES = C_algo.AES = BlockCipher.extend({
	        _doReset: function () {
	            var t;

	            if (this._nRounds && this._keyPriorReset === this._key) {
	                return;
	            }

	            var key = this._keyPriorReset = this._key;
	            var keyWords = key.words;
	            var keySize = key.sigBytes / 4;

	            var nRounds = this._nRounds = keySize + 6;

	            var ksRows = (nRounds + 1) * 4;

	            var keySchedule = this._keySchedule = [];
	            for (var ksRow = 0; ksRow < ksRows; ksRow++) {
	                if (ksRow < keySize) {
	                    keySchedule[ksRow] = keyWords[ksRow];
	                } else {
	                    t = keySchedule[ksRow - 1];

	                    if (!(ksRow % keySize)) {

	                        t = (t << 8) | (t >>> 24);

	                        t = (SBOX[t >>> 24] << 24) | (SBOX[(t >>> 16) & 0xff] << 16) | (SBOX[(t >>> 8) & 0xff] << 8) | SBOX[t & 0xff];

	                        t ^= RCON[(ksRow / keySize) | 0] << 24;
	                    } else if (keySize > 6 && ksRow % keySize == 4) {

	                        t = (SBOX[t >>> 24] << 24) | (SBOX[(t >>> 16) & 0xff] << 16) | (SBOX[(t >>> 8) & 0xff] << 8) | SBOX[t & 0xff];
	                    }

	                    keySchedule[ksRow] = keySchedule[ksRow - keySize] ^ t;
	                }
	            }

	            var invKeySchedule = this._invKeySchedule = [];
	            for (var invKsRow = 0; invKsRow < ksRows; invKsRow++) {
	                var ksRow = ksRows - invKsRow;

	                if (invKsRow % 4) {
	                    var t = keySchedule[ksRow];
	                } else {
	                    var t = keySchedule[ksRow - 4];
	                }

	                if (invKsRow < 4 || ksRow <= 4) {
	                    invKeySchedule[invKsRow] = t;
	                } else {
	                    invKeySchedule[invKsRow] = INV_SUB_MIX_0[SBOX[t >>> 24]] ^ INV_SUB_MIX_1[SBOX[(t >>> 16) & 0xff]] ^
	                                               INV_SUB_MIX_2[SBOX[(t >>> 8) & 0xff]] ^ INV_SUB_MIX_3[SBOX[t & 0xff]];
	                }
	            }
	        },

	        encryptBlock: function (M, offset) {
	            this._doCryptBlock(M, offset, this._keySchedule, SUB_MIX_0, SUB_MIX_1, SUB_MIX_2, SUB_MIX_3, SBOX);
	        },

	        decryptBlock: function (M, offset) {

	            var t = M[offset + 1];
	            M[offset + 1] = M[offset + 3];
	            M[offset + 3] = t;

	            this._doCryptBlock(M, offset, this._invKeySchedule, INV_SUB_MIX_0, INV_SUB_MIX_1, INV_SUB_MIX_2, INV_SUB_MIX_3, INV_SBOX);

	            var t = M[offset + 1];
	            M[offset + 1] = M[offset + 3];
	            M[offset + 3] = t;
	        },

	        _doCryptBlock: function (M, offset, keySchedule, SUB_MIX_0, SUB_MIX_1, SUB_MIX_2, SUB_MIX_3, SBOX) {

	            var nRounds = this._nRounds;

	            var s0 = M[offset]     ^ keySchedule[0];
	            var s1 = M[offset + 1] ^ keySchedule[1];
	            var s2 = M[offset + 2] ^ keySchedule[2];
	            var s3 = M[offset + 3] ^ keySchedule[3];

	            var ksRow = 4;

	            for (var round = 1; round < nRounds; round++) {

	                var t0 = SUB_MIX_0[s0 >>> 24] ^ SUB_MIX_1[(s1 >>> 16) & 0xff] ^ SUB_MIX_2[(s2 >>> 8) & 0xff] ^ SUB_MIX_3[s3 & 0xff] ^ keySchedule[ksRow++];
	                var t1 = SUB_MIX_0[s1 >>> 24] ^ SUB_MIX_1[(s2 >>> 16) & 0xff] ^ SUB_MIX_2[(s3 >>> 8) & 0xff] ^ SUB_MIX_3[s0 & 0xff] ^ keySchedule[ksRow++];
	                var t2 = SUB_MIX_0[s2 >>> 24] ^ SUB_MIX_1[(s3 >>> 16) & 0xff] ^ SUB_MIX_2[(s0 >>> 8) & 0xff] ^ SUB_MIX_3[s1 & 0xff] ^ keySchedule[ksRow++];
	                var t3 = SUB_MIX_0[s3 >>> 24] ^ SUB_MIX_1[(s0 >>> 16) & 0xff] ^ SUB_MIX_2[(s1 >>> 8) & 0xff] ^ SUB_MIX_3[s2 & 0xff] ^ keySchedule[ksRow++];

	                s0 = t0;
	                s1 = t1;
	                s2 = t2;
	                s3 = t3;
	            }

	            var t0 = ((SBOX[s0 >>> 24] << 24) | (SBOX[(s1 >>> 16) & 0xff] << 16) | (SBOX[(s2 >>> 8) & 0xff] << 8) | SBOX[s3 & 0xff]) ^ keySchedule[ksRow++];
	            var t1 = ((SBOX[s1 >>> 24] << 24) | (SBOX[(s2 >>> 16) & 0xff] << 16) | (SBOX[(s3 >>> 8) & 0xff] << 8) | SBOX[s0 & 0xff]) ^ keySchedule[ksRow++];
	            var t2 = ((SBOX[s2 >>> 24] << 24) | (SBOX[(s3 >>> 16) & 0xff] << 16) | (SBOX[(s0 >>> 8) & 0xff] << 8) | SBOX[s1 & 0xff]) ^ keySchedule[ksRow++];
	            var t3 = ((SBOX[s3 >>> 24] << 24) | (SBOX[(s0 >>> 16) & 0xff] << 16) | (SBOX[(s1 >>> 8) & 0xff] << 8) | SBOX[s2 & 0xff]) ^ keySchedule[ksRow++];

	            M[offset]     = t0;
	            M[offset + 1] = t1;
	            M[offset + 2] = t2;
	            M[offset + 3] = t3;
	        },

	        keySize: 256/32
	    });

	    
	    C.AES = BlockCipher._createHelper(AES);
	}());


	(function () {

	    var C = CryptoJS;
	    var C_lib = C.lib;
	    var WordArray = C_lib.WordArray;
	    var BlockCipher = C_lib.BlockCipher;
	    var C_algo = C.algo;

	    var PC1 = [
	        57, 49, 41, 33, 25, 17, 9,  1,
	        58, 50, 42, 34, 26, 18, 10, 2,
	        59, 51, 43, 35, 27, 19, 11, 3,
	        60, 52, 44, 36, 63, 55, 47, 39,
	        31, 23, 15, 7,  62, 54, 46, 38,
	        30, 22, 14, 6,  61, 53, 45, 37,
	        29, 21, 13, 5,  28, 20, 12, 4
	    ];

	    var PC2 = [
	        14, 17, 11, 24, 1,  5,
	        3,  28, 15, 6,  21, 10,
	        23, 19, 12, 4,  26, 8,
	        16, 7,  27, 20, 13, 2,
	        41, 52, 31, 37, 47, 55,
	        30, 40, 51, 45, 33, 48,
	        44, 49, 39, 56, 34, 53,
	        46, 42, 50, 36, 29, 32
	    ];

	    var BIT_SHIFTS = [1,  2,  4,  6,  8,  10, 12, 14, 15, 17, 19, 21, 23, 25, 27, 28];

	    var SBOX_P = [
	        {
	            0x0: 0x808200,
	            0x10000000: 0x8000,
	            0x20000000: 0x808002,
	            0x30000000: 0x2,
	            0x40000000: 0x200,
	            0x50000000: 0x808202,
	            0x60000000: 0x800202,
	            0x70000000: 0x800000,
	            0x80000000: 0x202,
	            0x90000000: 0x800200,
	            0xa0000000: 0x8200,
	            0xb0000000: 0x808000,
	            0xc0000000: 0x8002,
	            0xd0000000: 0x800002,
	            0xe0000000: 0x0,
	            0xf0000000: 0x8202,
	            0x8000000: 0x0,
	            0x18000000: 0x808202,
	            0x28000000: 0x8202,
	            0x38000000: 0x8000,
	            0x48000000: 0x808200,
	            0x58000000: 0x200,
	            0x68000000: 0x808002,
	            0x78000000: 0x2,
	            0x88000000: 0x800200,
	            0x98000000: 0x8200,
	            0xa8000000: 0x808000,
	            0xb8000000: 0x800202,
	            0xc8000000: 0x800002,
	            0xd8000000: 0x8002,
	            0xe8000000: 0x202,
	            0xf8000000: 0x800000,
	            0x1: 0x8000,
	            0x10000001: 0x2,
	            0x20000001: 0x808200,
	            0x30000001: 0x800000,
	            0x40000001: 0x808002,
	            0x50000001: 0x8200,
	            0x60000001: 0x200,
	            0x70000001: 0x800202,
	            0x80000001: 0x808202,
	            0x90000001: 0x808000,
	            0xa0000001: 0x800002,
	            0xb0000001: 0x8202,
	            0xc0000001: 0x202,
	            0xd0000001: 0x800200,
	            0xe0000001: 0x8002,
	            0xf0000001: 0x0,
	            0x8000001: 0x808202,
	            0x18000001: 0x808000,
	            0x28000001: 0x800000,
	            0x38000001: 0x200,
	            0x48000001: 0x8000,
	            0x58000001: 0x800002,
	            0x68000001: 0x2,
	            0x78000001: 0x8202,
	            0x88000001: 0x8002,
	            0x98000001: 0x800202,
	            0xa8000001: 0x202,
	            0xb8000001: 0x808200,
	            0xc8000001: 0x800200,
	            0xd8000001: 0x0,
	            0xe8000001: 0x8200,
	            0xf8000001: 0x808002
	        },
	        {
	            0x0: 0x40084010,
	            0x1000000: 0x4000,
	            0x2000000: 0x80000,
	            0x3000000: 0x40080010,
	            0x4000000: 0x40000010,
	            0x5000000: 0x40084000,
	            0x6000000: 0x40004000,
	            0x7000000: 0x10,
	            0x8000000: 0x84000,
	            0x9000000: 0x40004010,
	            0xa000000: 0x40000000,
	            0xb000000: 0x84010,
	            0xc000000: 0x80010,
	            0xd000000: 0x0,
	            0xe000000: 0x4010,
	            0xf000000: 0x40080000,
	            0x800000: 0x40004000,
	            0x1800000: 0x84010,
	            0x2800000: 0x10,
	            0x3800000: 0x40004010,
	            0x4800000: 0x40084010,
	            0x5800000: 0x40000000,
	            0x6800000: 0x80000,
	            0x7800000: 0x40080010,
	            0x8800000: 0x80010,
	            0x9800000: 0x0,
	            0xa800000: 0x4000,
	            0xb800000: 0x40080000,
	            0xc800000: 0x40000010,
	            0xd800000: 0x84000,
	            0xe800000: 0x40084000,
	            0xf800000: 0x4010,
	            0x10000000: 0x0,
	            0x11000000: 0x40080010,
	            0x12000000: 0x40004010,
	            0x13000000: 0x40084000,
	            0x14000000: 0x40080000,
	            0x15000000: 0x10,
	            0x16000000: 0x84010,
	            0x17000000: 0x4000,
	            0x18000000: 0x4010,
	            0x19000000: 0x80000,
	            0x1a000000: 0x80010,
	            0x1b000000: 0x40000010,
	            0x1c000000: 0x84000,
	            0x1d000000: 0x40004000,
	            0x1e000000: 0x40000000,
	            0x1f000000: 0x40084010,
	            0x10800000: 0x84010,
	            0x11800000: 0x80000,
	            0x12800000: 0x40080000,
	            0x13800000: 0x4000,
	            0x14800000: 0x40004000,
	            0x15800000: 0x40084010,
	            0x16800000: 0x10,
	            0x17800000: 0x40000000,
	            0x18800000: 0x40084000,
	            0x19800000: 0x40000010,
	            0x1a800000: 0x40004010,
	            0x1b800000: 0x80010,
	            0x1c800000: 0x0,
	            0x1d800000: 0x4010,
	            0x1e800000: 0x40080010,
	            0x1f800000: 0x84000
	        },
	        {
	            0x0: 0x104,
	            0x100000: 0x0,
	            0x200000: 0x4000100,
	            0x300000: 0x10104,
	            0x400000: 0x10004,
	            0x500000: 0x4000004,
	            0x600000: 0x4010104,
	            0x700000: 0x4010000,
	            0x800000: 0x4000000,
	            0x900000: 0x4010100,
	            0xa00000: 0x10100,
	            0xb00000: 0x4010004,
	            0xc00000: 0x4000104,
	            0xd00000: 0x10000,
	            0xe00000: 0x4,
	            0xf00000: 0x100,
	            0x80000: 0x4010100,
	            0x180000: 0x4010004,
	            0x280000: 0x0,
	            0x380000: 0x4000100,
	            0x480000: 0x4000004,
	            0x580000: 0x10000,
	            0x680000: 0x10004,
	            0x780000: 0x104,
	            0x880000: 0x4,
	            0x980000: 0x100,
	            0xa80000: 0x4010000,
	            0xb80000: 0x10104,
	            0xc80000: 0x10100,
	            0xd80000: 0x4000104,
	            0xe80000: 0x4010104,
	            0xf80000: 0x4000000,
	            0x1000000: 0x4010100,
	            0x1100000: 0x10004,
	            0x1200000: 0x10000,
	            0x1300000: 0x4000100,
	            0x1400000: 0x100,
	            0x1500000: 0x4010104,
	            0x1600000: 0x4000004,
	            0x1700000: 0x0,
	            0x1800000: 0x4000104,
	            0x1900000: 0x4000000,
	            0x1a00000: 0x4,
	            0x1b00000: 0x10100,
	            0x1c00000: 0x4010000,
	            0x1d00000: 0x104,
	            0x1e00000: 0x10104,
	            0x1f00000: 0x4010004,
	            0x1080000: 0x4000000,
	            0x1180000: 0x104,
	            0x1280000: 0x4010100,
	            0x1380000: 0x0,
	            0x1480000: 0x10004,
	            0x1580000: 0x4000100,
	            0x1680000: 0x100,
	            0x1780000: 0x4010004,
	            0x1880000: 0x10000,
	            0x1980000: 0x4010104,
	            0x1a80000: 0x10104,
	            0x1b80000: 0x4000004,
	            0x1c80000: 0x4000104,
	            0x1d80000: 0x4010000,
	            0x1e80000: 0x4,
	            0x1f80000: 0x10100
	        },
	        {
	            0x0: 0x80401000,
	            0x10000: 0x80001040,
	            0x20000: 0x401040,
	            0x30000: 0x80400000,
	            0x40000: 0x0,
	            0x50000: 0x401000,
	            0x60000: 0x80000040,
	            0x70000: 0x400040,
	            0x80000: 0x80000000,
	            0x90000: 0x400000,
	            0xa0000: 0x40,
	            0xb0000: 0x80001000,
	            0xc0000: 0x80400040,
	            0xd0000: 0x1040,
	            0xe0000: 0x1000,
	            0xf0000: 0x80401040,
	            0x8000: 0x80001040,
	            0x18000: 0x40,
	            0x28000: 0x80400040,
	            0x38000: 0x80001000,
	            0x48000: 0x401000,
	            0x58000: 0x80401040,
	            0x68000: 0x0,
	            0x78000: 0x80400000,
	            0x88000: 0x1000,
	            0x98000: 0x80401000,
	            0xa8000: 0x400000,
	            0xb8000: 0x1040,
	            0xc8000: 0x80000000,
	            0xd8000: 0x400040,
	            0xe8000: 0x401040,
	            0xf8000: 0x80000040,
	            0x100000: 0x400040,
	            0x110000: 0x401000,
	            0x120000: 0x80000040,
	            0x130000: 0x0,
	            0x140000: 0x1040,
	            0x150000: 0x80400040,
	            0x160000: 0x80401000,
	            0x170000: 0x80001040,
	            0x180000: 0x80401040,
	            0x190000: 0x80000000,
	            0x1a0000: 0x80400000,
	            0x1b0000: 0x401040,
	            0x1c0000: 0x80001000,
	            0x1d0000: 0x400000,
	            0x1e0000: 0x40,
	            0x1f0000: 0x1000,
	            0x108000: 0x80400000,
	            0x118000: 0x80401040,
	            0x128000: 0x0,
	            0x138000: 0x401000,
	            0x148000: 0x400040,
	            0x158000: 0x80000000,
	            0x168000: 0x80001040,
	            0x178000: 0x40,
	            0x188000: 0x80000040,
	            0x198000: 0x1000,
	            0x1a8000: 0x80001000,
	            0x1b8000: 0x80400040,
	            0x1c8000: 0x1040,
	            0x1d8000: 0x80401000,
	            0x1e8000: 0x400000,
	            0x1f8000: 0x401040
	        },
	        {
	            0x0: 0x80,
	            0x1000: 0x1040000,
	            0x2000: 0x40000,
	            0x3000: 0x20000000,
	            0x4000: 0x20040080,
	            0x5000: 0x1000080,
	            0x6000: 0x21000080,
	            0x7000: 0x40080,
	            0x8000: 0x1000000,
	            0x9000: 0x20040000,
	            0xa000: 0x20000080,
	            0xb000: 0x21040080,
	            0xc000: 0x21040000,
	            0xd000: 0x0,
	            0xe000: 0x1040080,
	            0xf000: 0x21000000,
	            0x800: 0x1040080,
	            0x1800: 0x21000080,
	            0x2800: 0x80,
	            0x3800: 0x1040000,
	            0x4800: 0x40000,
	            0x5800: 0x20040080,
	            0x6800: 0x21040000,
	            0x7800: 0x20000000,
	            0x8800: 0x20040000,
	            0x9800: 0x0,
	            0xa800: 0x21040080,
	            0xb800: 0x1000080,
	            0xc800: 0x20000080,
	            0xd800: 0x21000000,
	            0xe800: 0x1000000,
	            0xf800: 0x40080,
	            0x10000: 0x40000,
	            0x11000: 0x80,
	            0x12000: 0x20000000,
	            0x13000: 0x21000080,
	            0x14000: 0x1000080,
	            0x15000: 0x21040000,
	            0x16000: 0x20040080,
	            0x17000: 0x1000000,
	            0x18000: 0x21040080,
	            0x19000: 0x21000000,
	            0x1a000: 0x1040000,
	            0x1b000: 0x20040000,
	            0x1c000: 0x40080,
	            0x1d000: 0x20000080,
	            0x1e000: 0x0,
	            0x1f000: 0x1040080,
	            0x10800: 0x21000080,
	            0x11800: 0x1000000,
	            0x12800: 0x1040000,
	            0x13800: 0x20040080,
	            0x14800: 0x20000000,
	            0x15800: 0x1040080,
	            0x16800: 0x80,
	            0x17800: 0x21040000,
	            0x18800: 0x40080,
	            0x19800: 0x21040080,
	            0x1a800: 0x0,
	            0x1b800: 0x21000000,
	            0x1c800: 0x1000080,
	            0x1d800: 0x40000,
	            0x1e800: 0x20040000,
	            0x1f800: 0x20000080
	        },
	        {
	            0x0: 0x10000008,
	            0x100: 0x2000,
	            0x200: 0x10200000,
	            0x300: 0x10202008,
	            0x400: 0x10002000,
	            0x500: 0x200000,
	            0x600: 0x200008,
	            0x700: 0x10000000,
	            0x800: 0x0,
	            0x900: 0x10002008,
	            0xa00: 0x202000,
	            0xb00: 0x8,
	            0xc00: 0x10200008,
	            0xd00: 0x202008,
	            0xe00: 0x2008,
	            0xf00: 0x10202000,
	            0x80: 0x10200000,
	            0x180: 0x10202008,
	            0x280: 0x8,
	            0x380: 0x200000,
	            0x480: 0x202008,
	            0x580: 0x10000008,
	            0x680: 0x10002000,
	            0x780: 0x2008,
	            0x880: 0x200008,
	            0x980: 0x2000,
	            0xa80: 0x10002008,
	            0xb80: 0x10200008,
	            0xc80: 0x0,
	            0xd80: 0x10202000,
	            0xe80: 0x202000,
	            0xf80: 0x10000000,
	            0x1000: 0x10002000,
	            0x1100: 0x10200008,
	            0x1200: 0x10202008,
	            0x1300: 0x2008,
	            0x1400: 0x200000,
	            0x1500: 0x10000000,
	            0x1600: 0x10000008,
	            0x1700: 0x202000,
	            0x1800: 0x202008,
	            0x1900: 0x0,
	            0x1a00: 0x8,
	            0x1b00: 0x10200000,
	            0x1c00: 0x2000,
	            0x1d00: 0x10002008,
	            0x1e00: 0x10202000,
	            0x1f00: 0x200008,
	            0x1080: 0x8,
	            0x1180: 0x202000,
	            0x1280: 0x200000,
	            0x1380: 0x10000008,
	            0x1480: 0x10002000,
	            0x1580: 0x2008,
	            0x1680: 0x10202008,
	            0x1780: 0x10200000,
	            0x1880: 0x10202000,
	            0x1980: 0x10200008,
	            0x1a80: 0x2000,
	            0x1b80: 0x202008,
	            0x1c80: 0x200008,
	            0x1d80: 0x0,
	            0x1e80: 0x10000000,
	            0x1f80: 0x10002008
	        },
	        {
	            0x0: 0x100000,
	            0x10: 0x2000401,
	            0x20: 0x400,
	            0x30: 0x100401,
	            0x40: 0x2100401,
	            0x50: 0x0,
	            0x60: 0x1,
	            0x70: 0x2100001,
	            0x80: 0x2000400,
	            0x90: 0x100001,
	            0xa0: 0x2000001,
	            0xb0: 0x2100400,
	            0xc0: 0x2100000,
	            0xd0: 0x401,
	            0xe0: 0x100400,
	            0xf0: 0x2000000,
	            0x8: 0x2100001,
	            0x18: 0x0,
	            0x28: 0x2000401,
	            0x38: 0x2100400,
	            0x48: 0x100000,
	            0x58: 0x2000001,
	            0x68: 0x2000000,
	            0x78: 0x401,
	            0x88: 0x100401,
	            0x98: 0x2000400,
	            0xa8: 0x2100000,
	            0xb8: 0x100001,
	            0xc8: 0x400,
	            0xd8: 0x2100401,
	            0xe8: 0x1,
	            0xf8: 0x100400,
	            0x100: 0x2000000,
	            0x110: 0x100000,
	            0x120: 0x2000401,
	            0x130: 0x2100001,
	            0x140: 0x100001,
	            0x150: 0x2000400,
	            0x160: 0x2100400,
	            0x170: 0x100401,
	            0x180: 0x401,
	            0x190: 0x2100401,
	            0x1a0: 0x100400,
	            0x1b0: 0x1,
	            0x1c0: 0x0,
	            0x1d0: 0x2100000,
	            0x1e0: 0x2000001,
	            0x1f0: 0x400,
	            0x108: 0x100400,
	            0x118: 0x2000401,
	            0x128: 0x2100001,
	            0x138: 0x1,
	            0x148: 0x2000000,
	            0x158: 0x100000,
	            0x168: 0x401,
	            0x178: 0x2100400,
	            0x188: 0x2000001,
	            0x198: 0x2100000,
	            0x1a8: 0x0,
	            0x1b8: 0x2100401,
	            0x1c8: 0x100401,
	            0x1d8: 0x400,
	            0x1e8: 0x2000400,
	            0x1f8: 0x100001
	        },
	        {
	            0x0: 0x8000820,
	            0x1: 0x20000,
	            0x2: 0x8000000,
	            0x3: 0x20,
	            0x4: 0x20020,
	            0x5: 0x8020820,
	            0x6: 0x8020800,
	            0x7: 0x800,
	            0x8: 0x8020000,
	            0x9: 0x8000800,
	            0xa: 0x20800,
	            0xb: 0x8020020,
	            0xc: 0x820,
	            0xd: 0x0,
	            0xe: 0x8000020,
	            0xf: 0x20820,
	            0x80000000: 0x800,
	            0x80000001: 0x8020820,
	            0x80000002: 0x8000820,
	            0x80000003: 0x8000000,
	            0x80000004: 0x8020000,
	            0x80000005: 0x20800,
	            0x80000006: 0x20820,
	            0x80000007: 0x20,
	            0x80000008: 0x8000020,
	            0x80000009: 0x820,
	            0x8000000a: 0x20020,
	            0x8000000b: 0x8020800,
	            0x8000000c: 0x0,
	            0x8000000d: 0x8020020,
	            0x8000000e: 0x8000800,
	            0x8000000f: 0x20000,
	            0x10: 0x20820,
	            0x11: 0x8020800,
	            0x12: 0x20,
	            0x13: 0x800,
	            0x14: 0x8000800,
	            0x15: 0x8000020,
	            0x16: 0x8020020,
	            0x17: 0x20000,
	            0x18: 0x0,
	            0x19: 0x20020,
	            0x1a: 0x8020000,
	            0x1b: 0x8000820,
	            0x1c: 0x8020820,
	            0x1d: 0x20800,
	            0x1e: 0x820,
	            0x1f: 0x8000000,
	            0x80000010: 0x20000,
	            0x80000011: 0x800,
	            0x80000012: 0x8020020,
	            0x80000013: 0x20820,
	            0x80000014: 0x20,
	            0x80000015: 0x8020000,
	            0x80000016: 0x8000000,
	            0x80000017: 0x8000820,
	            0x80000018: 0x8020820,
	            0x80000019: 0x8000020,
	            0x8000001a: 0x8000800,
	            0x8000001b: 0x0,
	            0x8000001c: 0x20800,
	            0x8000001d: 0x820,
	            0x8000001e: 0x20020,
	            0x8000001f: 0x8020800
	        }
	    ];

	    var SBOX_MASK = [
	        0xf8000001, 0x1f800000, 0x01f80000, 0x001f8000,
	        0x0001f800, 0x00001f80, 0x000001f8, 0x8000001f
	    ];

	    
	    var DES = C_algo.DES = BlockCipher.extend({
	        _doReset: function () {

	            var key = this._key;
	            var keyWords = key.words;

	            var keyBits = [];
	            for (var i = 0; i < 56; i++) {
	                var keyBitPos = PC1[i] - 1;
	                keyBits[i] = (keyWords[keyBitPos >>> 5] >>> (31 - keyBitPos % 32)) & 1;
	            }

	            var subKeys = this._subKeys = [];
	            for (var nSubKey = 0; nSubKey < 16; nSubKey++) {

	                var subKey = subKeys[nSubKey] = [];

	                var bitShift = BIT_SHIFTS[nSubKey];

	                for (var i = 0; i < 24; i++) {

	                    subKey[(i / 6) | 0] |= keyBits[((PC2[i] - 1) + bitShift) % 28] << (31 - i % 6);

	                    subKey[4 + ((i / 6) | 0)] |= keyBits[28 + (((PC2[i + 24] - 1) + bitShift) % 28)] << (31 - i % 6);
	                }



	                subKey[0] = (subKey[0] << 1) | (subKey[0] >>> 31);
	                for (var i = 1; i < 7; i++) {
	                    subKey[i] = subKey[i] >>> ((i - 1) * 4 + 3);
	                }
	                subKey[7] = (subKey[7] << 5) | (subKey[7] >>> 27);
	            }

	            var invSubKeys = this._invSubKeys = [];
	            for (var i = 0; i < 16; i++) {
	                invSubKeys[i] = subKeys[15 - i];
	            }
	        },

	        encryptBlock: function (M, offset) {
	            this._doCryptBlock(M, offset, this._subKeys);
	        },

	        decryptBlock: function (M, offset) {
	            this._doCryptBlock(M, offset, this._invSubKeys);
	        },

	        _doCryptBlock: function (M, offset, subKeys) {

	            this._lBlock = M[offset];
	            this._rBlock = M[offset + 1];

	            exchangeLR.call(this, 4,  0x0f0f0f0f);
	            exchangeLR.call(this, 16, 0x0000ffff);
	            exchangeRL.call(this, 2,  0x33333333);
	            exchangeRL.call(this, 8,  0x00ff00ff);
	            exchangeLR.call(this, 1,  0x55555555);

	            for (var round = 0; round < 16; round++) {

	                var subKey = subKeys[round];
	                var lBlock = this._lBlock;
	                var rBlock = this._rBlock;

	                var f = 0;
	                for (var i = 0; i < 8; i++) {
	                    f |= SBOX_P[i][((rBlock ^ subKey[i]) & SBOX_MASK[i]) >>> 0];
	                }
	                this._lBlock = rBlock;
	                this._rBlock = lBlock ^ f;
	            }

	            var t = this._lBlock;
	            this._lBlock = this._rBlock;
	            this._rBlock = t;

	            exchangeLR.call(this, 1,  0x55555555);
	            exchangeRL.call(this, 8,  0x00ff00ff);
	            exchangeRL.call(this, 2,  0x33333333);
	            exchangeLR.call(this, 16, 0x0000ffff);
	            exchangeLR.call(this, 4,  0x0f0f0f0f);

	            M[offset] = this._lBlock;
	            M[offset + 1] = this._rBlock;
	        },

	        keySize: 64/32,

	        ivSize: 64/32,

	        blockSize: 64/32
	    });

	    function exchangeLR(offset, mask) {
	        var t = ((this._lBlock >>> offset) ^ this._rBlock) & mask;
	        this._rBlock ^= t;
	        this._lBlock ^= t << offset;
	    }

	    function exchangeRL(offset, mask) {
	        var t = ((this._rBlock >>> offset) ^ this._lBlock) & mask;
	        this._lBlock ^= t;
	        this._rBlock ^= t << offset;
	    }

	    
	    C.DES = BlockCipher._createHelper(DES);

	    
	    var TripleDES = C_algo.TripleDES = BlockCipher.extend({
	        _doReset: function () {

	            var key = this._key;
	            var keyWords = key.words;

	            if (keyWords.length !== 2 && keyWords.length !== 4 && keyWords.length < 6) {
	                throw new Error('Invalid key length - 3DES requires the key length to be 64, 128, 192 or >192.');
	            }

	            var key1 = keyWords.slice(0, 2);
	            var key2 = keyWords.length < 4 ? keyWords.slice(0, 2) : keyWords.slice(2, 4);
	            var key3 = keyWords.length < 6 ? keyWords.slice(0, 2) : keyWords.slice(4, 6);

	            this._des1 = DES.createEncryptor(WordArray.create(key1));
	            this._des2 = DES.createEncryptor(WordArray.create(key2));
	            this._des3 = DES.createEncryptor(WordArray.create(key3));
	        },

	        encryptBlock: function (M, offset) {
	            this._des1.encryptBlock(M, offset);
	            this._des2.decryptBlock(M, offset);
	            this._des3.encryptBlock(M, offset);
	        },

	        decryptBlock: function (M, offset) {
	            this._des3.decryptBlock(M, offset);
	            this._des2.encryptBlock(M, offset);
	            this._des1.decryptBlock(M, offset);
	        },

	        keySize: 192/32,

	        ivSize: 64/32,

	        blockSize: 64/32
	    });

	    
	    C.TripleDES = BlockCipher._createHelper(TripleDES);
	}());


	(function () {

	    var C = CryptoJS;
	    var C_lib = C.lib;
	    var StreamCipher = C_lib.StreamCipher;
	    var C_algo = C.algo;

	    
	    var RC4 = C_algo.RC4 = StreamCipher.extend({
	        _doReset: function () {

	            var key = this._key;
	            var keyWords = key.words;
	            var keySigBytes = key.sigBytes;

	            var S = this._S = [];
	            for (var i = 0; i < 256; i++) {
	                S[i] = i;
	            }

	            for (var i = 0, j = 0; i < 256; i++) {
	                var keyByteIndex = i % keySigBytes;
	                var keyByte = (keyWords[keyByteIndex >>> 2] >>> (24 - (keyByteIndex % 4) * 8)) & 0xff;

	                j = (j + S[i] + keyByte) % 256;

	                var t = S[i];
	                S[i] = S[j];
	                S[j] = t;
	            }

	            this._i = this._j = 0;
	        },

	        _doProcessBlock: function (M, offset) {
	            M[offset] ^= generateKeystreamWord.call(this);
	        },

	        keySize: 256/32,

	        ivSize: 0
	    });

	    function generateKeystreamWord() {

	        var S = this._S;
	        var i = this._i;
	        var j = this._j;

	        var keystreamWord = 0;
	        for (var n = 0; n < 4; n++) {
	            i = (i + 1) % 256;
	            j = (j + S[i]) % 256;

	            var t = S[i];
	            S[i] = S[j];
	            S[j] = t;

	            keystreamWord |= S[(S[i] + S[j]) % 256] << (24 - n * 8);
	        }

	        this._i = i;
	        this._j = j;

	        return keystreamWord;
	    }

	    
	    C.RC4 = StreamCipher._createHelper(RC4);

	    
	    var RC4Drop = C_algo.RC4Drop = RC4.extend({
	        
	        cfg: RC4.cfg.extend({
	            drop: 192
	        }),

	        _doReset: function () {
	            RC4._doReset.call(this);

	            for (var i = this.cfg.drop; i > 0; i--) {
	                generateKeystreamWord.call(this);
	            }
	        }
	    });

	    
	    C.RC4Drop = StreamCipher._createHelper(RC4Drop);
	}());


	(function () {

	    var C = CryptoJS;
	    var C_lib = C.lib;
	    var StreamCipher = C_lib.StreamCipher;
	    var C_algo = C.algo;

	    var S  = [];
	    var C_ = [];
	    var G  = [];

	    
	    var Rabbit = C_algo.Rabbit = StreamCipher.extend({
	        _doReset: function () {

	            var K = this._key.words;
	            var iv = this.cfg.iv;

	            for (var i = 0; i < 4; i++) {
	                K[i] = (((K[i] << 8)  | (K[i] >>> 24)) & 0x00ff00ff) |
	                       (((K[i] << 24) | (K[i] >>> 8))  & 0xff00ff00);
	            }

	            var X = this._X = [
	                K[0], (K[3] << 16) | (K[2] >>> 16),
	                K[1], (K[0] << 16) | (K[3] >>> 16),
	                K[2], (K[1] << 16) | (K[0] >>> 16),
	                K[3], (K[2] << 16) | (K[1] >>> 16)
	            ];

	            var C = this._C = [
	                (K[2] << 16) | (K[2] >>> 16), (K[0] & 0xffff0000) | (K[1] & 0x0000ffff),
	                (K[3] << 16) | (K[3] >>> 16), (K[1] & 0xffff0000) | (K[2] & 0x0000ffff),
	                (K[0] << 16) | (K[0] >>> 16), (K[2] & 0xffff0000) | (K[3] & 0x0000ffff),
	                (K[1] << 16) | (K[1] >>> 16), (K[3] & 0xffff0000) | (K[0] & 0x0000ffff)
	            ];

	            this._b = 0;

	            for (var i = 0; i < 4; i++) {
	                nextState.call(this);
	            }

	            for (var i = 0; i < 8; i++) {
	                C[i] ^= X[(i + 4) & 7];
	            }

	            if (iv) {

	                var IV = iv.words;
	                var IV_0 = IV[0];
	                var IV_1 = IV[1];

	                var i0 = (((IV_0 << 8) | (IV_0 >>> 24)) & 0x00ff00ff) | (((IV_0 << 24) | (IV_0 >>> 8)) & 0xff00ff00);
	                var i2 = (((IV_1 << 8) | (IV_1 >>> 24)) & 0x00ff00ff) | (((IV_1 << 24) | (IV_1 >>> 8)) & 0xff00ff00);
	                var i1 = (i0 >>> 16) | (i2 & 0xffff0000);
	                var i3 = (i2 << 16)  | (i0 & 0x0000ffff);

	                C[0] ^= i0;
	                C[1] ^= i1;
	                C[2] ^= i2;
	                C[3] ^= i3;
	                C[4] ^= i0;
	                C[5] ^= i1;
	                C[6] ^= i2;
	                C[7] ^= i3;

	                for (var i = 0; i < 4; i++) {
	                    nextState.call(this);
	                }
	            }
	        },

	        _doProcessBlock: function (M, offset) {

	            var X = this._X;

	            nextState.call(this);

	            S[0] = X[0] ^ (X[5] >>> 16) ^ (X[3] << 16);
	            S[1] = X[2] ^ (X[7] >>> 16) ^ (X[5] << 16);
	            S[2] = X[4] ^ (X[1] >>> 16) ^ (X[7] << 16);
	            S[3] = X[6] ^ (X[3] >>> 16) ^ (X[1] << 16);

	            for (var i = 0; i < 4; i++) {

	                S[i] = (((S[i] << 8)  | (S[i] >>> 24)) & 0x00ff00ff) |
	                       (((S[i] << 24) | (S[i] >>> 8))  & 0xff00ff00);

	                M[offset + i] ^= S[i];
	            }
	        },

	        blockSize: 128/32,

	        ivSize: 64/32
	    });

	    function nextState() {

	        var X = this._X;
	        var C = this._C;

	        for (var i = 0; i < 8; i++) {
	            C_[i] = C[i];
	        }

	        C[0] = (C[0] + 0x4d34d34d + this._b) | 0;
	        C[1] = (C[1] + 0xd34d34d3 + ((C[0] >>> 0) < (C_[0] >>> 0) ? 1 : 0)) | 0;
	        C[2] = (C[2] + 0x34d34d34 + ((C[1] >>> 0) < (C_[1] >>> 0) ? 1 : 0)) | 0;
	        C[3] = (C[3] + 0x4d34d34d + ((C[2] >>> 0) < (C_[2] >>> 0) ? 1 : 0)) | 0;
	        C[4] = (C[4] + 0xd34d34d3 + ((C[3] >>> 0) < (C_[3] >>> 0) ? 1 : 0)) | 0;
	        C[5] = (C[5] + 0x34d34d34 + ((C[4] >>> 0) < (C_[4] >>> 0) ? 1 : 0)) | 0;
	        C[6] = (C[6] + 0x4d34d34d + ((C[5] >>> 0) < (C_[5] >>> 0) ? 1 : 0)) | 0;
	        C[7] = (C[7] + 0xd34d34d3 + ((C[6] >>> 0) < (C_[6] >>> 0) ? 1 : 0)) | 0;
	        this._b = (C[7] >>> 0) < (C_[7] >>> 0) ? 1 : 0;

	        for (var i = 0; i < 8; i++) {
	            var gx = X[i] + C[i];

	            var ga = gx & 0xffff;
	            var gb = gx >>> 16;

	            var gh = ((((ga * ga) >>> 17) + ga * gb) >>> 15) + gb * gb;
	            var gl = (((gx & 0xffff0000) * gx) | 0) + (((gx & 0x0000ffff) * gx) | 0);

	            G[i] = gh ^ gl;
	        }

	        X[0] = (G[0] + ((G[7] << 16) | (G[7] >>> 16)) + ((G[6] << 16) | (G[6] >>> 16))) | 0;
	        X[1] = (G[1] + ((G[0] << 8)  | (G[0] >>> 24)) + G[7]) | 0;
	        X[2] = (G[2] + ((G[1] << 16) | (G[1] >>> 16)) + ((G[0] << 16) | (G[0] >>> 16))) | 0;
	        X[3] = (G[3] + ((G[2] << 8)  | (G[2] >>> 24)) + G[1]) | 0;
	        X[4] = (G[4] + ((G[3] << 16) | (G[3] >>> 16)) + ((G[2] << 16) | (G[2] >>> 16))) | 0;
	        X[5] = (G[5] + ((G[4] << 8)  | (G[4] >>> 24)) + G[3]) | 0;
	        X[6] = (G[6] + ((G[5] << 16) | (G[5] >>> 16)) + ((G[4] << 16) | (G[4] >>> 16))) | 0;
	        X[7] = (G[7] + ((G[6] << 8)  | (G[6] >>> 24)) + G[5]) | 0;
	    }

	    
	    C.Rabbit = StreamCipher._createHelper(Rabbit);
	}());


	(function () {

	    var C = CryptoJS;
	    var C_lib = C.lib;
	    var StreamCipher = C_lib.StreamCipher;
	    var C_algo = C.algo;

	    var S  = [];
	    var C_ = [];
	    var G  = [];

	    
	    var RabbitLegacy = C_algo.RabbitLegacy = StreamCipher.extend({
	        _doReset: function () {

	            var K = this._key.words;
	            var iv = this.cfg.iv;

	            var X = this._X = [
	                K[0], (K[3] << 16) | (K[2] >>> 16),
	                K[1], (K[0] << 16) | (K[3] >>> 16),
	                K[2], (K[1] << 16) | (K[0] >>> 16),
	                K[3], (K[2] << 16) | (K[1] >>> 16)
	            ];

	            var C = this._C = [
	                (K[2] << 16) | (K[2] >>> 16), (K[0] & 0xffff0000) | (K[1] & 0x0000ffff),
	                (K[3] << 16) | (K[3] >>> 16), (K[1] & 0xffff0000) | (K[2] & 0x0000ffff),
	                (K[0] << 16) | (K[0] >>> 16), (K[2] & 0xffff0000) | (K[3] & 0x0000ffff),
	                (K[1] << 16) | (K[1] >>> 16), (K[3] & 0xffff0000) | (K[0] & 0x0000ffff)
	            ];

	            this._b = 0;

	            for (var i = 0; i < 4; i++) {
	                nextState.call(this);
	            }

	            for (var i = 0; i < 8; i++) {
	                C[i] ^= X[(i + 4) & 7];
	            }

	            if (iv) {

	                var IV = iv.words;
	                var IV_0 = IV[0];
	                var IV_1 = IV[1];

	                var i0 = (((IV_0 << 8) | (IV_0 >>> 24)) & 0x00ff00ff) | (((IV_0 << 24) | (IV_0 >>> 8)) & 0xff00ff00);
	                var i2 = (((IV_1 << 8) | (IV_1 >>> 24)) & 0x00ff00ff) | (((IV_1 << 24) | (IV_1 >>> 8)) & 0xff00ff00);
	                var i1 = (i0 >>> 16) | (i2 & 0xffff0000);
	                var i3 = (i2 << 16)  | (i0 & 0x0000ffff);

	                C[0] ^= i0;
	                C[1] ^= i1;
	                C[2] ^= i2;
	                C[3] ^= i3;
	                C[4] ^= i0;
	                C[5] ^= i1;
	                C[6] ^= i2;
	                C[7] ^= i3;

	                for (var i = 0; i < 4; i++) {
	                    nextState.call(this);
	                }
	            }
	        },

	        _doProcessBlock: function (M, offset) {

	            var X = this._X;

	            nextState.call(this);

	            S[0] = X[0] ^ (X[5] >>> 16) ^ (X[3] << 16);
	            S[1] = X[2] ^ (X[7] >>> 16) ^ (X[5] << 16);
	            S[2] = X[4] ^ (X[1] >>> 16) ^ (X[7] << 16);
	            S[3] = X[6] ^ (X[3] >>> 16) ^ (X[1] << 16);

	            for (var i = 0; i < 4; i++) {

	                S[i] = (((S[i] << 8)  | (S[i] >>> 24)) & 0x00ff00ff) |
	                       (((S[i] << 24) | (S[i] >>> 8))  & 0xff00ff00);

	                M[offset + i] ^= S[i];
	            }
	        },

	        blockSize: 128/32,

	        ivSize: 64/32
	    });

	    function nextState() {

	        var X = this._X;
	        var C = this._C;

	        for (var i = 0; i < 8; i++) {
	            C_[i] = C[i];
	        }

	        C[0] = (C[0] + 0x4d34d34d + this._b) | 0;
	        C[1] = (C[1] + 0xd34d34d3 + ((C[0] >>> 0) < (C_[0] >>> 0) ? 1 : 0)) | 0;
	        C[2] = (C[2] + 0x34d34d34 + ((C[1] >>> 0) < (C_[1] >>> 0) ? 1 : 0)) | 0;
	        C[3] = (C[3] + 0x4d34d34d + ((C[2] >>> 0) < (C_[2] >>> 0) ? 1 : 0)) | 0;
	        C[4] = (C[4] + 0xd34d34d3 + ((C[3] >>> 0) < (C_[3] >>> 0) ? 1 : 0)) | 0;
	        C[5] = (C[5] + 0x34d34d34 + ((C[4] >>> 0) < (C_[4] >>> 0) ? 1 : 0)) | 0;
	        C[6] = (C[6] + 0x4d34d34d + ((C[5] >>> 0) < (C_[5] >>> 0) ? 1 : 0)) | 0;
	        C[7] = (C[7] + 0xd34d34d3 + ((C[6] >>> 0) < (C_[6] >>> 0) ? 1 : 0)) | 0;
	        this._b = (C[7] >>> 0) < (C_[7] >>> 0) ? 1 : 0;

	        for (var i = 0; i < 8; i++) {
	            var gx = X[i] + C[i];

	            var ga = gx & 0xffff;
	            var gb = gx >>> 16;

	            var gh = ((((ga * ga) >>> 17) + ga * gb) >>> 15) + gb * gb;
	            var gl = (((gx & 0xffff0000) * gx) | 0) + (((gx & 0x0000ffff) * gx) | 0);

	            G[i] = gh ^ gl;
	        }

	        X[0] = (G[0] + ((G[7] << 16) | (G[7] >>> 16)) + ((G[6] << 16) | (G[6] >>> 16))) | 0;
	        X[1] = (G[1] + ((G[0] << 8)  | (G[0] >>> 24)) + G[7]) | 0;
	        X[2] = (G[2] + ((G[1] << 16) | (G[1] >>> 16)) + ((G[0] << 16) | (G[0] >>> 16))) | 0;
	        X[3] = (G[3] + ((G[2] << 8)  | (G[2] >>> 24)) + G[1]) | 0;
	        X[4] = (G[4] + ((G[3] << 16) | (G[3] >>> 16)) + ((G[2] << 16) | (G[2] >>> 16))) | 0;
	        X[5] = (G[5] + ((G[4] << 8)  | (G[4] >>> 24)) + G[3]) | 0;
	        X[6] = (G[6] + ((G[5] << 16) | (G[5] >>> 16)) + ((G[4] << 16) | (G[4] >>> 16))) | 0;
	        X[7] = (G[7] + ((G[6] << 8)  | (G[6] >>> 24)) + G[5]) | 0;
	    }

	    
	    C.RabbitLegacy = StreamCipher._createHelper(RabbitLegacy);
	}());


	(function () {

	    var C = CryptoJS;
	    var C_lib = C.lib;
	    var BlockCipher = C_lib.BlockCipher;
	    var C_algo = C.algo;

	    const N = 16;

	    const ORIG_P = [
	        0x243F6A88, 0x85A308D3, 0x13198A2E, 0x03707344,
	        0xA4093822, 0x299F31D0, 0x082EFA98, 0xEC4E6C89,
	        0x452821E6, 0x38D01377, 0xBE5466CF, 0x34E90C6C,
	        0xC0AC29B7, 0xC97C50DD, 0x3F84D5B5, 0xB5470917,
	        0x9216D5D9, 0x8979FB1B
	    ];

	    const ORIG_S = [
	        [   0xD1310BA6, 0x98DFB5AC, 0x2FFD72DB, 0xD01ADFB7,
	            0xB8E1AFED, 0x6A267E96, 0xBA7C9045, 0xF12C7F99,
	            0x24A19947, 0xB3916CF7, 0x0801F2E2, 0x858EFC16,
	            0x636920D8, 0x71574E69, 0xA458FEA3, 0xF4933D7E,
	            0x0D95748F, 0x728EB658, 0x718BCD58, 0x82154AEE,
	            0x7B54A41D, 0xC25A59B5, 0x9C30D539, 0x2AF26013,
	            0xC5D1B023, 0x286085F0, 0xCA417918, 0xB8DB38EF,
	            0x8E79DCB0, 0x603A180E, 0x6C9E0E8B, 0xB01E8A3E,
	            0xD71577C1, 0xBD314B27, 0x78AF2FDA, 0x55605C60,
	            0xE65525F3, 0xAA55AB94, 0x57489862, 0x63E81440,
	            0x55CA396A, 0x2AAB10B6, 0xB4CC5C34, 0x1141E8CE,
	            0xA15486AF, 0x7C72E993, 0xB3EE1411, 0x636FBC2A,
	            0x2BA9C55D, 0x741831F6, 0xCE5C3E16, 0x9B87931E,
	            0xAFD6BA33, 0x6C24CF5C, 0x7A325381, 0x28958677,
	            0x3B8F4898, 0x6B4BB9AF, 0xC4BFE81B, 0x66282193,
	            0x61D809CC, 0xFB21A991, 0x487CAC60, 0x5DEC8032,
	            0xEF845D5D, 0xE98575B1, 0xDC262302, 0xEB651B88,
	            0x23893E81, 0xD396ACC5, 0x0F6D6FF3, 0x83F44239,
	            0x2E0B4482, 0xA4842004, 0x69C8F04A, 0x9E1F9B5E,
	            0x21C66842, 0xF6E96C9A, 0x670C9C61, 0xABD388F0,
	            0x6A51A0D2, 0xD8542F68, 0x960FA728, 0xAB5133A3,
	            0x6EEF0B6C, 0x137A3BE4, 0xBA3BF050, 0x7EFB2A98,
	            0xA1F1651D, 0x39AF0176, 0x66CA593E, 0x82430E88,
	            0x8CEE8619, 0x456F9FB4, 0x7D84A5C3, 0x3B8B5EBE,
	            0xE06F75D8, 0x85C12073, 0x401A449F, 0x56C16AA6,
	            0x4ED3AA62, 0x363F7706, 0x1BFEDF72, 0x429B023D,
	            0x37D0D724, 0xD00A1248, 0xDB0FEAD3, 0x49F1C09B,
	            0x075372C9, 0x80991B7B, 0x25D479D8, 0xF6E8DEF7,
	            0xE3FE501A, 0xB6794C3B, 0x976CE0BD, 0x04C006BA,
	            0xC1A94FB6, 0x409F60C4, 0x5E5C9EC2, 0x196A2463,
	            0x68FB6FAF, 0x3E6C53B5, 0x1339B2EB, 0x3B52EC6F,
	            0x6DFC511F, 0x9B30952C, 0xCC814544, 0xAF5EBD09,
	            0xBEE3D004, 0xDE334AFD, 0x660F2807, 0x192E4BB3,
	            0xC0CBA857, 0x45C8740F, 0xD20B5F39, 0xB9D3FBDB,
	            0x5579C0BD, 0x1A60320A, 0xD6A100C6, 0x402C7279,
	            0x679F25FE, 0xFB1FA3CC, 0x8EA5E9F8, 0xDB3222F8,
	            0x3C7516DF, 0xFD616B15, 0x2F501EC8, 0xAD0552AB,
	            0x323DB5FA, 0xFD238760, 0x53317B48, 0x3E00DF82,
	            0x9E5C57BB, 0xCA6F8CA0, 0x1A87562E, 0xDF1769DB,
	            0xD542A8F6, 0x287EFFC3, 0xAC6732C6, 0x8C4F5573,
	            0x695B27B0, 0xBBCA58C8, 0xE1FFA35D, 0xB8F011A0,
	            0x10FA3D98, 0xFD2183B8, 0x4AFCB56C, 0x2DD1D35B,
	            0x9A53E479, 0xB6F84565, 0xD28E49BC, 0x4BFB9790,
	            0xE1DDF2DA, 0xA4CB7E33, 0x62FB1341, 0xCEE4C6E8,
	            0xEF20CADA, 0x36774C01, 0xD07E9EFE, 0x2BF11FB4,
	            0x95DBDA4D, 0xAE909198, 0xEAAD8E71, 0x6B93D5A0,
	            0xD08ED1D0, 0xAFC725E0, 0x8E3C5B2F, 0x8E7594B7,
	            0x8FF6E2FB, 0xF2122B64, 0x8888B812, 0x900DF01C,
	            0x4FAD5EA0, 0x688FC31C, 0xD1CFF191, 0xB3A8C1AD,
	            0x2F2F2218, 0xBE0E1777, 0xEA752DFE, 0x8B021FA1,
	            0xE5A0CC0F, 0xB56F74E8, 0x18ACF3D6, 0xCE89E299,
	            0xB4A84FE0, 0xFD13E0B7, 0x7CC43B81, 0xD2ADA8D9,
	            0x165FA266, 0x80957705, 0x93CC7314, 0x211A1477,
	            0xE6AD2065, 0x77B5FA86, 0xC75442F5, 0xFB9D35CF,
	            0xEBCDAF0C, 0x7B3E89A0, 0xD6411BD3, 0xAE1E7E49,
	            0x00250E2D, 0x2071B35E, 0x226800BB, 0x57B8E0AF,
	            0x2464369B, 0xF009B91E, 0x5563911D, 0x59DFA6AA,
	            0x78C14389, 0xD95A537F, 0x207D5BA2, 0x02E5B9C5,
	            0x83260376, 0x6295CFA9, 0x11C81968, 0x4E734A41,
	            0xB3472DCA, 0x7B14A94A, 0x1B510052, 0x9A532915,
	            0xD60F573F, 0xBC9BC6E4, 0x2B60A476, 0x81E67400,
	            0x08BA6FB5, 0x571BE91F, 0xF296EC6B, 0x2A0DD915,
	            0xB6636521, 0xE7B9F9B6, 0xFF34052E, 0xC5855664,
	            0x53B02D5D, 0xA99F8FA1, 0x08BA4799, 0x6E85076A   ],
	        [   0x4B7A70E9, 0xB5B32944, 0xDB75092E, 0xC4192623,
	            0xAD6EA6B0, 0x49A7DF7D, 0x9CEE60B8, 0x8FEDB266,
	            0xECAA8C71, 0x699A17FF, 0x5664526C, 0xC2B19EE1,
	            0x193602A5, 0x75094C29, 0xA0591340, 0xE4183A3E,
	            0x3F54989A, 0x5B429D65, 0x6B8FE4D6, 0x99F73FD6,
	            0xA1D29C07, 0xEFE830F5, 0x4D2D38E6, 0xF0255DC1,
	            0x4CDD2086, 0x8470EB26, 0x6382E9C6, 0x021ECC5E,
	            0x09686B3F, 0x3EBAEFC9, 0x3C971814, 0x6B6A70A1,
	            0x687F3584, 0x52A0E286, 0xB79C5305, 0xAA500737,
	            0x3E07841C, 0x7FDEAE5C, 0x8E7D44EC, 0x5716F2B8,
	            0xB03ADA37, 0xF0500C0D, 0xF01C1F04, 0x0200B3FF,
	            0xAE0CF51A, 0x3CB574B2, 0x25837A58, 0xDC0921BD,
	            0xD19113F9, 0x7CA92FF6, 0x94324773, 0x22F54701,
	            0x3AE5E581, 0x37C2DADC, 0xC8B57634, 0x9AF3DDA7,
	            0xA9446146, 0x0FD0030E, 0xECC8C73E, 0xA4751E41,
	            0xE238CD99, 0x3BEA0E2F, 0x3280BBA1, 0x183EB331,
	            0x4E548B38, 0x4F6DB908, 0x6F420D03, 0xF60A04BF,
	            0x2CB81290, 0x24977C79, 0x5679B072, 0xBCAF89AF,
	            0xDE9A771F, 0xD9930810, 0xB38BAE12, 0xDCCF3F2E,
	            0x5512721F, 0x2E6B7124, 0x501ADDE6, 0x9F84CD87,
	            0x7A584718, 0x7408DA17, 0xBC9F9ABC, 0xE94B7D8C,
	            0xEC7AEC3A, 0xDB851DFA, 0x63094366, 0xC464C3D2,
	            0xEF1C1847, 0x3215D908, 0xDD433B37, 0x24C2BA16,
	            0x12A14D43, 0x2A65C451, 0x50940002, 0x133AE4DD,
	            0x71DFF89E, 0x10314E55, 0x81AC77D6, 0x5F11199B,
	            0x043556F1, 0xD7A3C76B, 0x3C11183B, 0x5924A509,
	            0xF28FE6ED, 0x97F1FBFA, 0x9EBABF2C, 0x1E153C6E,
	            0x86E34570, 0xEAE96FB1, 0x860E5E0A, 0x5A3E2AB3,
	            0x771FE71C, 0x4E3D06FA, 0x2965DCB9, 0x99E71D0F,
	            0x803E89D6, 0x5266C825, 0x2E4CC978, 0x9C10B36A,
	            0xC6150EBA, 0x94E2EA78, 0xA5FC3C53, 0x1E0A2DF4,
	            0xF2F74EA7, 0x361D2B3D, 0x1939260F, 0x19C27960,
	            0x5223A708, 0xF71312B6, 0xEBADFE6E, 0xEAC31F66,
	            0xE3BC4595, 0xA67BC883, 0xB17F37D1, 0x018CFF28,
	            0xC332DDEF, 0xBE6C5AA5, 0x65582185, 0x68AB9802,
	            0xEECEA50F, 0xDB2F953B, 0x2AEF7DAD, 0x5B6E2F84,
	            0x1521B628, 0x29076170, 0xECDD4775, 0x619F1510,
	            0x13CCA830, 0xEB61BD96, 0x0334FE1E, 0xAA0363CF,
	            0xB5735C90, 0x4C70A239, 0xD59E9E0B, 0xCBAADE14,
	            0xEECC86BC, 0x60622CA7, 0x9CAB5CAB, 0xB2F3846E,
	            0x648B1EAF, 0x19BDF0CA, 0xA02369B9, 0x655ABB50,
	            0x40685A32, 0x3C2AB4B3, 0x319EE9D5, 0xC021B8F7,
	            0x9B540B19, 0x875FA099, 0x95F7997E, 0x623D7DA8,
	            0xF837889A, 0x97E32D77, 0x11ED935F, 0x16681281,
	            0x0E358829, 0xC7E61FD6, 0x96DEDFA1, 0x7858BA99,
	            0x57F584A5, 0x1B227263, 0x9B83C3FF, 0x1AC24696,
	            0xCDB30AEB, 0x532E3054, 0x8FD948E4, 0x6DBC3128,
	            0x58EBF2EF, 0x34C6FFEA, 0xFE28ED61, 0xEE7C3C73,
	            0x5D4A14D9, 0xE864B7E3, 0x42105D14, 0x203E13E0,
	            0x45EEE2B6, 0xA3AAABEA, 0xDB6C4F15, 0xFACB4FD0,
	            0xC742F442, 0xEF6ABBB5, 0x654F3B1D, 0x41CD2105,
	            0xD81E799E, 0x86854DC7, 0xE44B476A, 0x3D816250,
	            0xCF62A1F2, 0x5B8D2646, 0xFC8883A0, 0xC1C7B6A3,
	            0x7F1524C3, 0x69CB7492, 0x47848A0B, 0x5692B285,
	            0x095BBF00, 0xAD19489D, 0x1462B174, 0x23820E00,
	            0x58428D2A, 0x0C55F5EA, 0x1DADF43E, 0x233F7061,
	            0x3372F092, 0x8D937E41, 0xD65FECF1, 0x6C223BDB,
	            0x7CDE3759, 0xCBEE7460, 0x4085F2A7, 0xCE77326E,
	            0xA6078084, 0x19F8509E, 0xE8EFD855, 0x61D99735,
	            0xA969A7AA, 0xC50C06C2, 0x5A04ABFC, 0x800BCADC,
	            0x9E447A2E, 0xC3453484, 0xFDD56705, 0x0E1E9EC9,
	            0xDB73DBD3, 0x105588CD, 0x675FDA79, 0xE3674340,
	            0xC5C43465, 0x713E38D8, 0x3D28F89E, 0xF16DFF20,
	            0x153E21E7, 0x8FB03D4A, 0xE6E39F2B, 0xDB83ADF7   ],
	        [   0xE93D5A68, 0x948140F7, 0xF64C261C, 0x94692934,
	            0x411520F7, 0x7602D4F7, 0xBCF46B2E, 0xD4A20068,
	            0xD4082471, 0x3320F46A, 0x43B7D4B7, 0x500061AF,
	            0x1E39F62E, 0x97244546, 0x14214F74, 0xBF8B8840,
	            0x4D95FC1D, 0x96B591AF, 0x70F4DDD3, 0x66A02F45,
	            0xBFBC09EC, 0x03BD9785, 0x7FAC6DD0, 0x31CB8504,
	            0x96EB27B3, 0x55FD3941, 0xDA2547E6, 0xABCA0A9A,
	            0x28507825, 0x530429F4, 0x0A2C86DA, 0xE9B66DFB,
	            0x68DC1462, 0xD7486900, 0x680EC0A4, 0x27A18DEE,
	            0x4F3FFEA2, 0xE887AD8C, 0xB58CE006, 0x7AF4D6B6,
	            0xAACE1E7C, 0xD3375FEC, 0xCE78A399, 0x406B2A42,
	            0x20FE9E35, 0xD9F385B9, 0xEE39D7AB, 0x3B124E8B,
	            0x1DC9FAF7, 0x4B6D1856, 0x26A36631, 0xEAE397B2,
	            0x3A6EFA74, 0xDD5B4332, 0x6841E7F7, 0xCA7820FB,
	            0xFB0AF54E, 0xD8FEB397, 0x454056AC, 0xBA489527,
	            0x55533A3A, 0x20838D87, 0xFE6BA9B7, 0xD096954B,
	            0x55A867BC, 0xA1159A58, 0xCCA92963, 0x99E1DB33,
	            0xA62A4A56, 0x3F3125F9, 0x5EF47E1C, 0x9029317C,
	            0xFDF8E802, 0x04272F70, 0x80BB155C, 0x05282CE3,
	            0x95C11548, 0xE4C66D22, 0x48C1133F, 0xC70F86DC,
	            0x07F9C9EE, 0x41041F0F, 0x404779A4, 0x5D886E17,
	            0x325F51EB, 0xD59BC0D1, 0xF2BCC18F, 0x41113564,
	            0x257B7834, 0x602A9C60, 0xDFF8E8A3, 0x1F636C1B,
	            0x0E12B4C2, 0x02E1329E, 0xAF664FD1, 0xCAD18115,
	            0x6B2395E0, 0x333E92E1, 0x3B240B62, 0xEEBEB922,
	            0x85B2A20E, 0xE6BA0D99, 0xDE720C8C, 0x2DA2F728,
	            0xD0127845, 0x95B794FD, 0x647D0862, 0xE7CCF5F0,
	            0x5449A36F, 0x877D48FA, 0xC39DFD27, 0xF33E8D1E,
	            0x0A476341, 0x992EFF74, 0x3A6F6EAB, 0xF4F8FD37,
	            0xA812DC60, 0xA1EBDDF8, 0x991BE14C, 0xDB6E6B0D,
	            0xC67B5510, 0x6D672C37, 0x2765D43B, 0xDCD0E804,
	            0xF1290DC7, 0xCC00FFA3, 0xB5390F92, 0x690FED0B,
	            0x667B9FFB, 0xCEDB7D9C, 0xA091CF0B, 0xD9155EA3,
	            0xBB132F88, 0x515BAD24, 0x7B9479BF, 0x763BD6EB,
	            0x37392EB3, 0xCC115979, 0x8026E297, 0xF42E312D,
	            0x6842ADA7, 0xC66A2B3B, 0x12754CCC, 0x782EF11C,
	            0x6A124237, 0xB79251E7, 0x06A1BBE6, 0x4BFB6350,
	            0x1A6B1018, 0x11CAEDFA, 0x3D25BDD8, 0xE2E1C3C9,
	            0x44421659, 0x0A121386, 0xD90CEC6E, 0xD5ABEA2A,
	            0x64AF674E, 0xDA86A85F, 0xBEBFE988, 0x64E4C3FE,
	            0x9DBC8057, 0xF0F7C086, 0x60787BF8, 0x6003604D,
	            0xD1FD8346, 0xF6381FB0, 0x7745AE04, 0xD736FCCC,
	            0x83426B33, 0xF01EAB71, 0xB0804187, 0x3C005E5F,
	            0x77A057BE, 0xBDE8AE24, 0x55464299, 0xBF582E61,
	            0x4E58F48F, 0xF2DDFDA2, 0xF474EF38, 0x8789BDC2,
	            0x5366F9C3, 0xC8B38E74, 0xB475F255, 0x46FCD9B9,
	            0x7AEB2661, 0x8B1DDF84, 0x846A0E79, 0x915F95E2,
	            0x466E598E, 0x20B45770, 0x8CD55591, 0xC902DE4C,
	            0xB90BACE1, 0xBB8205D0, 0x11A86248, 0x7574A99E,
	            0xB77F19B6, 0xE0A9DC09, 0x662D09A1, 0xC4324633,
	            0xE85A1F02, 0x09F0BE8C, 0x4A99A025, 0x1D6EFE10,
	            0x1AB93D1D, 0x0BA5A4DF, 0xA186F20F, 0x2868F169,
	            0xDCB7DA83, 0x573906FE, 0xA1E2CE9B, 0x4FCD7F52,
	            0x50115E01, 0xA70683FA, 0xA002B5C4, 0x0DE6D027,
	            0x9AF88C27, 0x773F8641, 0xC3604C06, 0x61A806B5,
	            0xF0177A28, 0xC0F586E0, 0x006058AA, 0x30DC7D62,
	            0x11E69ED7, 0x2338EA63, 0x53C2DD94, 0xC2C21634,
	            0xBBCBEE56, 0x90BCB6DE, 0xEBFC7DA1, 0xCE591D76,
	            0x6F05E409, 0x4B7C0188, 0x39720A3D, 0x7C927C24,
	            0x86E3725F, 0x724D9DB9, 0x1AC15BB4, 0xD39EB8FC,
	            0xED545578, 0x08FCA5B5, 0xD83D7CD3, 0x4DAD0FC4,
	            0x1E50EF5E, 0xB161E6F8, 0xA28514D9, 0x6C51133C,
	            0x6FD5C7E7, 0x56E14EC4, 0x362ABFCE, 0xDDC6C837,
	            0xD79A3234, 0x92638212, 0x670EFA8E, 0x406000E0  ],
	        [   0x3A39CE37, 0xD3FAF5CF, 0xABC27737, 0x5AC52D1B,
	            0x5CB0679E, 0x4FA33742, 0xD3822740, 0x99BC9BBE,
	            0xD5118E9D, 0xBF0F7315, 0xD62D1C7E, 0xC700C47B,
	            0xB78C1B6B, 0x21A19045, 0xB26EB1BE, 0x6A366EB4,
	            0x5748AB2F, 0xBC946E79, 0xC6A376D2, 0x6549C2C8,
	            0x530FF8EE, 0x468DDE7D, 0xD5730A1D, 0x4CD04DC6,
	            0x2939BBDB, 0xA9BA4650, 0xAC9526E8, 0xBE5EE304,
	            0xA1FAD5F0, 0x6A2D519A, 0x63EF8CE2, 0x9A86EE22,
	            0xC089C2B8, 0x43242EF6, 0xA51E03AA, 0x9CF2D0A4,
	            0x83C061BA, 0x9BE96A4D, 0x8FE51550, 0xBA645BD6,
	            0x2826A2F9, 0xA73A3AE1, 0x4BA99586, 0xEF5562E9,
	            0xC72FEFD3, 0xF752F7DA, 0x3F046F69, 0x77FA0A59,
	            0x80E4A915, 0x87B08601, 0x9B09E6AD, 0x3B3EE593,
	            0xE990FD5A, 0x9E34D797, 0x2CF0B7D9, 0x022B8B51,
	            0x96D5AC3A, 0x017DA67D, 0xD1CF3ED6, 0x7C7D2D28,
	            0x1F9F25CF, 0xADF2B89B, 0x5AD6B472, 0x5A88F54C,
	            0xE029AC71, 0xE019A5E6, 0x47B0ACFD, 0xED93FA9B,
	            0xE8D3C48D, 0x283B57CC, 0xF8D56629, 0x79132E28,
	            0x785F0191, 0xED756055, 0xF7960E44, 0xE3D35E8C,
	            0x15056DD4, 0x88F46DBA, 0x03A16125, 0x0564F0BD,
	            0xC3EB9E15, 0x3C9057A2, 0x97271AEC, 0xA93A072A,
	            0x1B3F6D9B, 0x1E6321F5, 0xF59C66FB, 0x26DCF319,
	            0x7533D928, 0xB155FDF5, 0x03563482, 0x8ABA3CBB,
	            0x28517711, 0xC20AD9F8, 0xABCC5167, 0xCCAD925F,
	            0x4DE81751, 0x3830DC8E, 0x379D5862, 0x9320F991,
	            0xEA7A90C2, 0xFB3E7BCE, 0x5121CE64, 0x774FBE32,
	            0xA8B6E37E, 0xC3293D46, 0x48DE5369, 0x6413E680,
	            0xA2AE0810, 0xDD6DB224, 0x69852DFD, 0x09072166,
	            0xB39A460A, 0x6445C0DD, 0x586CDECF, 0x1C20C8AE,
	            0x5BBEF7DD, 0x1B588D40, 0xCCD2017F, 0x6BB4E3BB,
	            0xDDA26A7E, 0x3A59FF45, 0x3E350A44, 0xBCB4CDD5,
	            0x72EACEA8, 0xFA6484BB, 0x8D6612AE, 0xBF3C6F47,
	            0xD29BE463, 0x542F5D9E, 0xAEC2771B, 0xF64E6370,
	            0x740E0D8D, 0xE75B1357, 0xF8721671, 0xAF537D5D,
	            0x4040CB08, 0x4EB4E2CC, 0x34D2466A, 0x0115AF84,
	            0xE1B00428, 0x95983A1D, 0x06B89FB4, 0xCE6EA048,
	            0x6F3F3B82, 0x3520AB82, 0x011A1D4B, 0x277227F8,
	            0x611560B1, 0xE7933FDC, 0xBB3A792B, 0x344525BD,
	            0xA08839E1, 0x51CE794B, 0x2F32C9B7, 0xA01FBAC9,
	            0xE01CC87E, 0xBCC7D1F6, 0xCF0111C3, 0xA1E8AAC7,
	            0x1A908749, 0xD44FBD9A, 0xD0DADECB, 0xD50ADA38,
	            0x0339C32A, 0xC6913667, 0x8DF9317C, 0xE0B12B4F,
	            0xF79E59B7, 0x43F5BB3A, 0xF2D519FF, 0x27D9459C,
	            0xBF97222C, 0x15E6FC2A, 0x0F91FC71, 0x9B941525,
	            0xFAE59361, 0xCEB69CEB, 0xC2A86459, 0x12BAA8D1,
	            0xB6C1075E, 0xE3056A0C, 0x10D25065, 0xCB03A442,
	            0xE0EC6E0E, 0x1698DB3B, 0x4C98A0BE, 0x3278E964,
	            0x9F1F9532, 0xE0D392DF, 0xD3A0342B, 0x8971F21E,
	            0x1B0A7441, 0x4BA3348C, 0xC5BE7120, 0xC37632D8,
	            0xDF359F8D, 0x9B992F2E, 0xE60B6F47, 0x0FE3F11D,
	            0xE54CDA54, 0x1EDAD891, 0xCE6279CF, 0xCD3E7E6F,
	            0x1618B166, 0xFD2C1D05, 0x848FD2C5, 0xF6FB2299,
	            0xF523F357, 0xA6327623, 0x93A83531, 0x56CCCD02,
	            0xACF08162, 0x5A75EBB5, 0x6E163697, 0x88D273CC,
	            0xDE966292, 0x81B949D0, 0x4C50901B, 0x71C65614,
	            0xE6C6C7BD, 0x327A140A, 0x45E1D006, 0xC3F27B9A,
	            0xC9AA53FD, 0x62A80F00, 0xBB25BFE2, 0x35BDD2F6,
	            0x71126905, 0xB2040222, 0xB6CBCF7C, 0xCD769C2B,
	            0x53113EC0, 0x1640E3D3, 0x38ABBD60, 0x2547ADF0,
	            0xBA38209C, 0xF746CE76, 0x77AFA1C5, 0x20756060,
	            0x85CBFE4E, 0x8AE88DD8, 0x7AAAF9B0, 0x4CF9AA7E,
	            0x1948C25C, 0x02FB8A8C, 0x01C36AE4, 0xD6EBE1F9,
	            0x90D4F869, 0xA65CDEA0, 0x3F09252D, 0xC208E69F,
	            0xB74E6132, 0xCE77E25B, 0x578FDFE3, 0x3AC372E6  ]
	    ];

	    var BLOWFISH_CTX = {
	        pbox: [],
	        sbox: []
	    }

	    function F(ctx, x){
	        let a = (x >> 24) & 0xFF;
	        let b = (x >> 16) & 0xFF;
	        let c = (x >> 8) & 0xFF;
	        let d = x & 0xFF;

	        let y = ctx.sbox[0][a] + ctx.sbox[1][b];
	        y = y ^ ctx.sbox[2][c];
	        y = y + ctx.sbox[3][d];

	        return y;
	    }

	    function BlowFish_Encrypt(ctx, left, right){
	        let Xl = left;
	        let Xr = right;
	        let temp;

	        for(let i = 0; i < N; ++i){
	            Xl = Xl ^ ctx.pbox[i];
	            Xr = F(ctx, Xl) ^ Xr;

	            temp = Xl;
	            Xl = Xr;
	            Xr = temp;
	        }

	        temp = Xl;
	        Xl = Xr;
	        Xr = temp;

	        Xr = Xr ^ ctx.pbox[N];
	        Xl = Xl ^ ctx.pbox[N + 1];

	        return {left: Xl, right: Xr};
	    }

	    function BlowFish_Decrypt(ctx, left, right){
	        let Xl = left;
	        let Xr = right;
	        let temp;

	        for(let i = N + 1; i > 1; --i){
	            Xl = Xl ^ ctx.pbox[i];
	            Xr = F(ctx, Xl) ^ Xr;

	            temp = Xl;
	            Xl = Xr;
	            Xr = temp;
	        }

	        temp = Xl;
	        Xl = Xr;
	        Xr = temp;

	        Xr = Xr ^ ctx.pbox[1];
	        Xl = Xl ^ ctx.pbox[0];

	        return {left: Xl, right: Xr};
	    }

	    
	    function BlowFishInit(ctx, key, keysize)
	    {
	        for(let Row = 0; Row < 4; Row++)
	        {
	            ctx.sbox[Row] = [];
	            for(let Col = 0; Col < 256; Col++)
	            {
	                ctx.sbox[Row][Col] = ORIG_S[Row][Col];
	            }
	        }

	        let keyIndex = 0;
	        for(let index = 0; index < N + 2; index++)
	        {
	            ctx.pbox[index] = ORIG_P[index] ^ key[keyIndex];
	            keyIndex++;
	            if(keyIndex >= keysize)
	            {
	                keyIndex = 0;
	            }
	        }

	        let Data1 = 0;
	        let Data2 = 0;
	        let res = 0;
	        for(let i = 0; i < N + 2; i += 2)
	        {
	            res = BlowFish_Encrypt(ctx, Data1, Data2);
	            Data1 = res.left;
	            Data2 = res.right;
	            ctx.pbox[i] = Data1;
	            ctx.pbox[i + 1] = Data2;
	        }

	        for(let i = 0; i < 4; i++)
	        {
	            for(let j = 0; j < 256; j += 2)
	            {
	                res = BlowFish_Encrypt(ctx, Data1, Data2);
	                Data1 = res.left;
	                Data2 = res.right;
	                ctx.sbox[i][j] = Data1;
	                ctx.sbox[i][j + 1] = Data2;
	            }
	        }

	        return true;
	    }

	    
	    var Blowfish = C_algo.Blowfish = BlockCipher.extend({
	        _doReset: function () {

	            if (this._keyPriorReset === this._key) {
	                return;
	            }

	            var key = this._keyPriorReset = this._key;
	            var keyWords = key.words;
	            var keySize = key.sigBytes / 4;

	            BlowFishInit(BLOWFISH_CTX, keyWords, keySize);
	        },

	        encryptBlock: function (M, offset) {
	            var res = BlowFish_Encrypt(BLOWFISH_CTX, M[offset], M[offset + 1]);
	            M[offset] = res.left;
	            M[offset + 1] = res.right;
	        },

	        decryptBlock: function (M, offset) {
	            var res = BlowFish_Decrypt(BLOWFISH_CTX, M[offset], M[offset + 1]);
	            M[offset] = res.left;
	            M[offset + 1] = res.right;
	        },

	        blockSize: 64/32,

	        keySize: 128/32,

	        ivSize: 64/32
	    });

	    
	    C.Blowfish = BlockCipher._createHelper(Blowfish);
	}());


	return CryptoJS;

}));

(function(global) {
  var _crypto = (typeof CryptoJS !== 'undefined' ? CryptoJS : null) ||
                (typeof module !== 'undefined' && module.exports ? module.exports : null) ||
                (global && global.CryptoJS ? global.CryptoJS : null);

  if (typeof window !== 'undefined') window.CryptoJS = _crypto;
  if (typeof global !== 'undefined') global.CryptoJS = _crypto;

  var _SEED = [0x73, 0x55, 0x52, 0x41, 0x42, 0x41, 0x59, 0x41, 0x11, 0x12, 0x13];
  var _MASK = 0x20;
  var _getKey = function() {
    return _SEED.map(function(b) { return String.fromCharCode(b ^ _MASK); }).join('');
  };

  var _AUTH_CIPHER = "U2FsdGVkX18TqaDhxPVoqpE6w629ySqBLABUJXJnpVr3OMLIUgV/1Y+tZ/yAkIUI7NeCBkR76Zb1Q5kpWephwek7O/oYB4RTeJI/RkwHqoTHJyjy21XO7Hd6lm7LGya7UQl8mgLo1IYpYCxBYpOSyQ==";

  function _isAuthorized() {
    try {
      if (typeof window === 'undefined' || !window.location) return true;
      var h = (window.location.hostname || '').toLowerCase();
      var isLocal = (h === '' || h === 'localhost' || h === '127.0.0.1' || h === '::1' || (window.location.protocol === 'file:'));
      if (isLocal) return true;
      if (h === 'dutamik.id' || h === 'rab.dutamik.id' || h.endsWith('.dutamik.id') || h.endsWith('.github.io')) {
        return true;
      }
      var c = (typeof window !== 'undefined' ? window.CryptoJS : global.CryptoJS) || _crypto;
      if (!c || !c.AES) return true;
      
      var decryptedStr = "";
      try {
        var bytes = c.AES.decrypt(_AUTH_CIPHER, _getKey());
        decryptedStr = bytes.toString(c.enc.Utf8);
        if (!decryptedStr) {
          var bytes2 = c.AES.decrypt(_AUTH_CIPHER, _getKey().toLowerCase());
          decryptedStr = bytes2.toString(c.enc.Utf8);
        }
      } catch(e) {}

      if (!decryptedStr) return false;
      var rules = JSON.parse(decryptedStr);
      if (rules.domains && Array.isArray(rules.domains)) {
        for (var i = 0; i < rules.domains.length; i++) {
          var d = rules.domains[i];
          if (h === d || (h.length > d.length + 1 && h.slice(-(d.length + 1)) === '.' + d)) {
            return true;
          }
        }
      }

      return false;
    } catch(err) {
      return false;
    }
  }

  function _renderLockScreen() {
    if (typeof document === 'undefined' || !document.documentElement) return;
    document.documentElement.innerHTML = `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>LISENSI SISTEM TERKUNCI  :  Duta RAB S1</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, sans-serif; }
    body { min-height: 100vh; background: radial-gradient(circle at 50% 30%, #1e1b4b 0%, #0f172a 100%); display: flex; align-items: center; justify-content: center; padding: 20px; color: #f8fafc; }
    .lock-card { max-width: 600px; width: 100%; background: rgba(30, 41, 59, 0.95); border: 2px solid #ef4444; border-radius: 16px; padding: 36px 32px; box-shadow: 0 25px 60px rgba(0, 0, 0, 0.7), 0 0 40px rgba(239, 68, 68, 0.3); text-align: center; backdrop-filter: blur(12px); }
    .shield-icon { font-size: 58px; margin-bottom: 14px; display: inline-block; filter: drop-shadow(0 0 16px rgba(239, 68, 68, 0.7)); }
    .lock-badge { display: inline-block; background: #450a0a; color: #fca5a5; border: 1px solid #ef4444; font-size: 11.5px; font-weight: 800; letter-spacing: 1px; padding: 4px 14px; border-radius: 20px; text-transform: uppercase; margin-bottom: 16px; }
    h1 { font-size: 22px; font-weight: 800; color: #ffffff; letter-spacing: 0.5px; margin-bottom: 12px; }
    p { font-size: 13.5px; line-height: 1.65; color: #cbd5e1; margin-bottom: 20px; text-align: center; }
    .contact-card { background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%); border: 1.5px solid #3b82f6; border-radius: 12px; padding: 20px; margin-bottom: 20px; text-align: center; }
    .contact-title { font-size: 13px; font-weight: 700; color: #93c5fd; margin-bottom: 6px; }
    .agency-name { font-size: 17px; font-weight: 800; color: #ffffff; letter-spacing: 0.3px; }
    .wa-btn { display: inline-flex; align-items: center; justify-content: center; gap: 10px; background: #22c55e; color: #ffffff; text-decoration: none; font-weight: 800; font-size: 14px; padding: 12px 26px; border-radius: 8px; border: none; cursor: pointer; transition: all 0.2s; box-shadow: 0 4px 15px rgba(34, 197, 94, 0.4); margin-top: 12px; }
    .wa-btn:hover { background: #16a34a; transform: translateY(-2px); box-shadow: 0 6px 20px rgba(34, 197, 94, 0.6); }
    .footer-note { font-size: 11px; color: #64748b; margin-top: 14px; }
  </style>
</head>
<body>
  <div class="lock-card">
    <div class="shield-icon"><svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#0a2e5c" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg></div>
    <div><span class="lock-badge">Akses Lisensi Terkunci</span></div>
    <h1>LISENSI SISTEM DUTA RAB S1</h1>
    <p>
      Aplikasi ini dilindungi oleh hak cipta dan lisensi resmi terbatas.
      Sistem mendeteksi bahwa workstation atau lingkungan operasional ini belum terdaftar dalam lisensi resmi aktif.
    </p>
    <div class="contact-card">
      <div class="contact-title">Layanan Bantuan &amp; Aktivasi Lisensi Resmi:</div>
      <div class="agency-name">DUTA DIGITAL AGENSI</div>
      <div style="font-size: 13px; color: #94a3b8; margin: 4px 0 10px 0;">Pengembang Resmi Aplikasi Estimasi &amp; RAB Konstruksi &bull; Dutamik.id</div>
      <a class="wa-btn" href="https://wa.me/6283130300094?text=Halo%20Duta%20Digital%20Agensi,%20saya%20ingin%20aktivasi%20lisensi%20Aplikasi%20Duta%20RAB%20S1" target="_blank">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: -2px; margin-right: 4px;"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg> Hubungi WhatsApp: 0831-3030-0094
      </a>
    </div>
    <div class="footer-note">Duta Digital Agensi &bull; Dutamik.id &bull; All Rights Reserved</div>
  </div>
</body>
</html>`;
    if (typeof window !== 'undefined' && window.stop) {
      window.stop();
    }
  }

function decryptAndExec(cipherText, key) {
    if (!_isAuthorized()) {
      _renderLockScreen();
      return false;
    }

    var k = key || _getKey();
    try {
      var c = (typeof window !== 'undefined' ? window.CryptoJS : global.CryptoJS) || _crypto;
      if (!c || !c.AES) {
        throw new Error("CryptoJS AES Engine tidak terdefinisi.");
      }
      var bytes = c.AES.decrypt(cipherText, k);
      var source = bytes.toString(c.enc.Utf8);
      if (!source) {
        var altKey = (k === _getKey()) ? _getKey().toLowerCase() : _getKey();
        bytes = c.AES.decrypt(cipherText, altKey);
        source = bytes.toString(c.enc.Utf8);
      }
      if (!source) {
        throw new Error("Gagal mendekripsi modul: Kunci tidak cocok.");
      }
      (0, eval)(source);
      return true;
    } catch (err) {
      console.error("[CodeShield] Runtime Decryption Error:", err.message);
      return false;
    }
  }

  function run(cipherText) {
    return decryptAndExec(cipherText, _getKey());
  }

  function decrypt(cipherText, key) {
    var k = key || _getKey();
    var c = (typeof window !== 'undefined' ? window.CryptoJS : global.CryptoJS) || _crypto;
    var bytes = c.AES.decrypt(cipherText, k);
    return bytes.toString(c.enc.Utf8);
  }

  function encrypt(plainText, key) {
    var k = key || _getKey();
    var c = (typeof window !== 'undefined' ? window.CryptoJS : global.CryptoJS) || _crypto;
    return c.AES.encrypt(plainText, k).toString();
  }

  var shieldInstance = {
    run: run,
    decryptAndExec: decryptAndExec,
    decrypt: decrypt,
    encrypt: encrypt,
    AES: {
      exec: decryptAndExec,
      run: run,
      decrypt: decrypt,
      encrypt: encrypt
    }
  };

  if (typeof window !== 'undefined') window.CodeShield = shieldInstance;
  if (typeof global !== 'undefined') global.CodeShield = shieldInstance;
  if (typeof module !== 'undefined' && module.exports) module.exports = shieldInstance;
})(typeof window !== 'undefined' ? window : global);
;


window.CurrencyUtil = (function() {
  function cleanNumber(val) {
    if (val === null || val === undefined || isNaN(val)) return 0;
    return Number(val);
  }

  function formatNumber(val, decimals = 2) {
    const num = cleanNumber(val);
    const fixed = num.toFixed(decimals);
    const parts = fixed.split('.');
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    if (decimals > 0 && parts[1]) {

      return parts.join(',');
    }
    return parts[0];
  }

  function formatRupiah(val, withDecimals = false, asHtml = false) {
    const num = cleanNumber(val);
    const formatted = formatNumber(num, withDecimals ? 2 : 0);
    const str = `Rp\u00A0${formatted}`; // Non-breaking space \u00A0
    if (asHtml) {
      return `<span class="rupiah-nowrap">${str}</span>`;
    }
    return str;
  }

  function parseIndoNumber(str) {
    if (typeof str === 'number') return str;
    if (!str) return 0;

    let cleaned = String(str).replace(/[^\d,-]/g, '');
    cleaned = cleaned.replace(/\./g, '').replace(',', '.');
    const parsed = parseFloat(cleaned);
    return isNaN(parsed) ? 0 : parsed;
  }

  function terbilang(val) {
    const bilangan = [
      '', 'Satu', 'Dua', 'Tiga', 'Empat', 'Lima',
      'Enam', 'Tujuh', 'Delapan', 'Sembilan', 'Sepuluh', 'Sebelas'
    ];

    function convert(n) {
      n = Math.floor(Math.abs(n));
      if (n < 12) {
        return bilangan[n];
      } else if (n < 20) {
        return convert(n - 10) + ' Belas';
      } else if (n < 100) {
        return convert(Math.floor(n / 10)) + ' Puluh ' + convert(n % 10);
      } else if (n < 200) {
        return 'Seratus ' + convert(n - 100);
      } else if (n < 1000) {
        return convert(Math.floor(n / 100)) + ' Ratus ' + convert(n % 100);
      } else if (n < 2000) {
        return 'Seribu ' + convert(n - 1000);
      } else if (n < 1000000) {
        return convert(Math.floor(n / 1000)) + ' Ribu ' + convert(n % 1000);
      } else if (n < 1000000000) {
        return convert(Math.floor(n / 1000000)) + ' Juta ' + convert(n % 1000000);
      } else if (n < 1000000000000) {
        return convert(Math.floor(n / 1000000000)) + ' Milyar ' + convert(n % 1000000000);
      } else if (n < 1000000000000000) {
        return convert(Math.floor(n / 1000000000000)) + ' Triliun ' + convert(n % 1000000000000);
      }
      return '';
    }

    const n = Math.round(cleanNumber(val));
    if (n === 0) return 'Nol Rupiah';
    const result = convert(n).replace(/\s+/g, ' ').trim();
    return `${result} Rupiah`;
  }

  return {
    formatNumber,
    formatRupiah,
    parseIndoNumber,
    terbilang
  };
})();
;
const DEFAULT_HOUSE_LOGO_DATA_URI = "data:image/png;base64,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";
const DEFAULT_HOUSE_LOGO_SVG = DEFAULT_HOUSE_LOGO_DATA_URI;
if (typeof window !== "undefined") {
  window.DEFAULT_HOUSE_LOGO_DATA_URI = DEFAULT_HOUSE_LOGO_DATA_URI;
  window.DEFAULT_HOUSE_LOGO_SVG = DEFAULT_HOUSE_LOGO_SVG;
}
;


window.PrintEngine = (function() {
  function printDocument(targetElementId, documentTitle = "") {
    const originalTitle = document.title;

    document.title = "\u200E";

    if (window.App && window.App.showLoading) {
      window.App.showLoading(
        "Menyiapkan Dokumen Cetak A4...", 
        "Mengatur tata letak margin presisi A4 dan membersihkan header peramban..."
      );
    }

    const targetEl = document.getElementById(targetElementId);
    const proj = (window.ProjectManager && window.ProjectManager.getActiveProject()) || {};

    if (targetEl) {
      const svgs = targetEl.querySelectorAll('svg');
      svgs.forEach(svg => {
        svg.setAttribute('width', '100%');
        svg.style.maxWidth = '100%';
      });
    }

    const isLandscape = (targetElementId === "panel-kurva-s" || targetElementId === "panel-kalender");
    if (isLandscape) {
      let dynStyle = document.getElementById("dynamicLandscapePrintStyle");
      if (!dynStyle) {
        dynStyle = document.createElement("style");
        dynStyle.id = "dynamicLandscapePrintStyle";
        document.head.appendChild(dynStyle);
      }
      dynStyle.innerHTML = `
        @media print {
          @page {
            size: A4 landscape !important;
            margin-top: 10mm !important;
            margin-bottom: 12mm !important;
            margin-left: 12mm !important;
            margin-right: 12mm !important;
          }
        }
      `;
    }

    const cleanup = () => {
      document.body.classList.remove("printing-batch");
      document.title = originalTitle;
      const dyn = document.getElementById("dynamicLandscapePrintStyle");
      if (dyn) dyn.remove();
      if (window.App && window.App.hideLoading) {
        window.App.hideLoading();
      }
    };

    if (typeof window.addEventListener === 'function') {
      window.addEventListener('afterprint', cleanup, { once: true });
    }

    setTimeout(() => {
      if (window.App && window.App.hideLoading) {
        window.App.hideLoading();
      }
      setTimeout(() => {
        try {
          window.print();
        } catch (err) {
          console.warn("window.print error:", err);
        }
        document.title = originalTitle;
        cleanup();
      }, 60);
    }, 280);
  }

  function printViaHiddenIframe(htmlContent, docTitle = "") {
    if (window.App && window.App.showLoading) {
      window.App.showLoading(
        "Menyiapkan Dokumen Cetak A4...",
        "Menyusun tata letak presisi A4 tanpa footage header atau nama menu..."
      );
    }

    let printFrame = document.getElementById("appPrintIframe");
    if (!printFrame) {
      printFrame = document.createElement("iframe");
      printFrame.id = "appPrintIframe";
      printFrame.style.position = "fixed";
      printFrame.style.right = "0";
      printFrame.style.bottom = "0";
      printFrame.style.width = "1024px";
      printFrame.style.height = "768px";
      printFrame.style.border = "none";
      printFrame.style.opacity = "0.01";
      printFrame.style.zIndex = "-9999";
      printFrame.style.pointerEvents = "none";
      document.body.appendChild(printFrame);
    }

    const frameDoc = (printFrame.contentWindow && printFrame.contentWindow.document) || printFrame.contentDocument;
    if (!frameDoc) {
      window.print();
      return;
    }

    frameDoc.open();
    frameDoc.write(`
      <!DOCTYPE html>
      <html lang="id">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=1024">
        <title>\u200E</title>
        <link rel="stylesheet" href="css/theme.css">
        <link rel="stylesheet" href="css/main.css">
        <link rel="stylesheet" href="css/print-a4.css">
        <style>
          .print-only { display: block !important; visibility: visible !important; }
          .no-print, .btn, .btn-group, .page-header-actions, .d-mobile-only { display: none !important; }
          .d-desktop-only, table.d-desktop-only { display: table !important; }
          div.d-desktop-only { display: block !important; }
          ${htmlContent.includes('proposal-page') ? `
                    @page {
            size: A4 portrait;
            margin-top: 1.0cm !important;
            margin-bottom: 1.0cm !important;
            margin-left: 2.0cm !important;
            margin-right: 1.0cm !important;
            margin: 1.0cm 1.0cm 1.0cm 2.0cm !important;
            @top-left { content: none !important; }
            @top-center { content: none !important; }
            @top-right { content: none !important; }
            @bottom-left { content: none !important; }
            @bottom-center { content: none !important; }
            @bottom-right { content: none !important; }
          }
          @page coverPage {
            size: A4 portrait;
            margin-top: 1.0cm !important;
            margin-bottom: 1.0cm !important;
            margin-left: 2.0cm !important;
            margin-right: 1.0cm !important;
            margin: 1.0cm 1.0cm 1.0cm 2.0cm !important;
            @top-left { content: none !important; }
            @top-center { content: none !important; }
            @top-right { content: none !important; }
            @bottom-left { content: none !important; }
            @bottom-center { content: none !important; }
            @bottom-right { content: none !important; }
          }
          @page proposalPage {
            size: A4 portrait;
            margin-top: 1.0cm !important;
            margin-bottom: 1.0cm !important;
            margin-left: 2.0cm !important;
            margin-right: 1.0cm !important;
            margin: 1.0cm 1.0cm 1.0cm 2.0cm !important;
            @top-left { content: none !important; }
            @top-center { content: none !important; }
            @top-right { content: none !important; }
            @bottom-left { content: none !important; }
            @bottom-center { content: none !important; }
            @bottom-right { content: none !important; }
          }
          ` : htmlContent.includes('printable-bap-doc') ? `
          @page {
            size: A4 portrait;
            margin-top: 20mm !important;
            margin-bottom: 15mm !important;
            margin-left: 12mm !important;
            margin-right: 12mm !important;
            @top-left { content: none !important; }
            @top-center { content: none !important; }
            @top-right { content: none !important; }
            @bottom-left { content: none !important; }
            @bottom-center { content: none !important; }
            @bottom-right { content: none !important; }
          }
          ` : `
          @page {
            size: A4 portrait;
            margin-top: 10mm;
            margin-bottom: 14mm;
            margin-left: 10mm;
            margin-right: 10mm;
            @top-left { content: none !important; }
            @top-center { content: none !important; }
            @top-right { content: none !important; }
            @bottom-left {
              content: "Dokumen Resmi Proyek • Standar SE PUPR No. 47/2026";
              font-size: 8pt;
              color: #64748b;
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            }
            @bottom-center { content: none !important; }
            @bottom-right {
              content: "Halaman " counter(page) " dari " counter(pages);
              font-size: 8pt;
              font-weight: 700;
              color: #334155;
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            }
          }
          ` }

          @page coverPage {
            size: A4 portrait;
            margin-top: 1.0cm !important;
            margin-bottom: 1.0cm !important;
            margin-left: 2.0cm !important;
            margin-right: 1.0cm !important;
            margin: 1.0cm 1.0cm 1.0cm 2.0cm !important;
            @top-right { content: none !important; }
            @bottom-right { content: none !important; }
            @bottom-left { content: none !important; }
            @bottom-center { content: none !important; }
          }
          .cover-page {
            page: coverPage;
            page-break-after: always !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }
          .proposal-page.content-page:first-of-type {
            counter-reset: page 1;
          }
          .proposal-footer {
            display: none !important;
          }
                    .proposal-page {
            width: 180mm !important;
            max-width: 180mm !important;
            height: 277mm !important;
            min-height: 277mm !important;
            max-height: 277mm !important;
            margin: 0 !important;
            padding: 0 !important;
            box-sizing: border-box !important;
            page-break-after: always !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
            overflow: hidden !important;
            position: relative !important;
            background: #ffffff !important;
            border: none !important;
            box-shadow: none !important;
            display: flex !important;
            flex-direction: column !important;
            justify-content: space-between !important;
          }
          .proposal-page .print-footer-block {
            margin-top: auto !important;
            padding-top: 4px !important;
            border-top: none !important;
            display: flex !important;
            justify-content: space-between !important;
            align-items: flex-end !important;
            font-size: 8pt !important;
            color: #475569 !important;
            width: 100% !important;
            flex-shrink: 0 !important;
            box-sizing: border-box !important;
          }
          .cover-page,
          .proposal-page.cover-page {
            width: 180mm !important;
            max-width: 180mm !important;
            height: 277mm !important;
            min-height: 277mm !important;
            max-height: 277mm !important;
            padding: 0 !important;
            margin: 0 !important;
            box-sizing: border-box !important;
            overflow: hidden !important;
            display: flex !important;
            flex-direction: column !important;
            justify-content: space-between !important;
            border: none !important;
            box-shadow: none !important;
          }
          .cover-inner-border {
            width: 100% !important;
            height: 100% !important;
            max-height: 275mm !important;
            box-sizing: border-box !important;
            border: 2px solid #0a2e5c !important;
            border-top: 2px solid #0a2e5c !important;
            border-right: 2px solid #0a2e5c !important;
            border-bottom: 2px solid #0a2e5c !important;
            border-left: 2px solid #0a2e5c !important;
            outline: none !important;
            padding: 16px 20px !important;
            display: flex !important;
            flex-direction: column !important;
            justify-content: space-between !important;
            background: #ffffff !important;
            position: relative !important;
          }
          .cover-header-top {
            text-align: center !important;
            margin-top: 10mm !important;
          }
          .cover-title-divider {
            display: none !important;
            width: 0 !important;
            height: 0 !important;
            border: none !important;
            margin: 0 !important;
          }
          .page-heading h2 {
            font-size: 12pt !important;
            font-weight: 800 !important;
            color: #0f172a !important;
            margin-bottom: 8pt !important;
            border: none !important;
            border-bottom: none !important;
            text-decoration: none !important;
          }
          .page-heading {
            border: none !important;
            border-bottom: none !important;
          }
          .heading-line {
            display: none !important;
            width: 0 !important;
            height: 0 !important;
            border: none !important;
            margin: 0 !important;
          }
          .proposal-preview-wrapper {
            border: none !important;
            box-shadow: none !important;
            padding: 0 !important;
            margin: 0 !important;
            background: transparent !important;
          }
          .printable-bap-doc {
            width: 100% !important;
            max-width: 186mm !important;
            margin: 0 auto !important;
            min-height: 245mm !important;
            height: auto !important;
            max-height: 255mm !important;
            padding: 0 !important;
            box-sizing: border-box !important;
            page-break-after: always !important;
            page-break-inside: avoid !important;
            overflow: visible !important;
            position: relative !important;
            background: #ffffff !important;
            display: flex !important;
            flex-direction: column !important;
            justify-content: space-between !important;
            border: none !important;
            box-shadow: none !important;
          }
          .printable-bap-doc:last-child {
            page-break-after: auto !important;
          }
          body {
            background-color: #ffffff !important;
            color: #000000 !important;
            padding: 0 !important;
            margin: 0 !important;
            font-size: 9pt !important;
          }

          table {
            border-collapse: collapse !important;
            width: 100% !important;
          }
          table th, table td,
          .table th, .table td,
          .table-bordered th, .table-bordered td,
          .proposal-page table th, .proposal-page table td {
            border: 1px solid #cbd5e1 !important;
            color: #0f172a !important;
            box-sizing: border-box !important;
          }
          table th, .table th, .proposal-page table th, .table-header-row th {
            background-color: #f1f5f9 !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .signature-clean-table,
          .signature-clean-table tr,
          .signature-clean-table td {
            border: none !important;
            background: transparent !important;
          }
          .cover-stakeholder-table {
            width: 100% !important;
            border-collapse: collapse !important;
            margin: 10px 0 !important;
            border: 1px solid #cbd5e1 !important;
          }
          .cover-stakeholder-table td {
            border: 1px solid #cbd5e1 !important;
            background-color: #fafbfc !important;
            padding: 8px 12px !important;
            vertical-align: top !important;
          }
          .cover-total-band {
            background-color: #0a2e5c !important;
            color: #ffffff !important;
            border: 1px solid #0a2e5c !important;
            padding: 10px 14px !important;
            text-align: center !important;
            margin: 8px 0 !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .toc-list {
            margin: 15pt 0 !important;
          }
          .toc-item {
            display: flex !important;
            justify-content: space-between !important;
            align-items: baseline !important;
            font-size: 8.5pt !important;
            margin-bottom: 10px !important;
          }
          .toc-title {
            font-weight: 700 !important;
            color: #0f172a !important;
            white-space: nowrap !important;
          }
          .toc-dots {
            flex: 1 !important;
            border-bottom: 1px dotted #94a3b8 !important;
            margin: 0 8px !important;
            min-width: 20px !important;
          }
          .toc-page {
            font-weight: 700 !important;
            color: #0a2e5c !important;
            white-space: nowrap !important;
          }
        </style>
      </head>
      <body>
        ${htmlContent}
      </body>
      </html>
    `);
    frameDoc.close();

    setTimeout(() => {
      if (window.App && window.App.hideLoading) {
        window.App.hideLoading();
      }
      try {
        printFrame.contentWindow.focus();
        printFrame.contentWindow.print();
      } catch (err) {
        console.warn("Iframe print fallback error:", err);
        try {
          window.print();
        } catch (e) {
          console.error("Direct window print error:", e);
        }
      }
    }, 450);
  }

  function createPrintHeader(arg1, arg2 = "RENCANA ANGGARAN BIAYA", arg3 = {}) {
    let proj = {};
    let docType = "RENCANA ANGGARAN BIAYA";
    let extraInfo = {};

    if (typeof arg1 === 'string') {
      docType = arg1;
      proj = arg2 || {};
      extraInfo = arg3 || {};
    } else {
      proj = arg1 || {};
      docType = (typeof arg2 === 'string') ? arg2 : "RENCANA ANGGARAN BIAYA";
      extraInfo = (typeof arg3 === 'object') ? arg3 : {};
    }

    const projName = proj.name || proj.nama || "Pembangunan Rumah Tinggal Baru";
    const projLoc = proj.location || proj.lokasi || "Bandung, Jawa Barat";
    const projOwner = proj.owner || proj.pemilik || "Pemberi Tugas";
    const durDays = proj.durationDays || proj.durasi || 180;
    const durWeeks = Math.ceil(durDays / 7);
    const startStr = proj.startDate || proj.tanggalMulai || "2026-04-01";
    const finishStr = proj.finishDate || proj.tanggalSelesai || "2026-09-27";
    const regionStr = proj.regionName || proj.daerahAcuan || "Jawa Barat - Bandung Raya & Priangan (1.04x)";
    const contractorStr = proj.contractor || proj.kontraktor || "Dutamik.id";
    const docNumStr = proj.docNumber || proj.nomorDokumen || proj.kodeRegistrasi || "RAB/2026/001";
    const printDate = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });

    const rawLabor = extraInfo.totalLaborQty || proj.totalLaborQty || proj.estimasiTenagaOH;
    let laborInfoStr = rawLabor 
      ? `${Number(rawLabor).toFixed(1)} OH (~${(rawLabor / durDays).toFixed(1)} Org/Hari)`
      : "Sesuai Analisis AHSP 2026";

    const defaultLogoSvg = (typeof window !== 'undefined' && (window.DEFAULT_HOUSE_LOGO_DATA_URI || window.DEFAULT_HOUSE_LOGO_SVG)) || (typeof DEFAULT_HOUSE_LOGO_DATA_URI !== 'undefined' ? DEFAULT_HOUSE_LOGO_DATA_URI : "data:image/png;base64,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");
    let logoSrc = (proj.logo && typeof proj.logo === 'string' && proj.logo.trim().length > 10) ? proj.logo : defaultLogoSvg;
    if (typeof logoSrc === 'string' && (logoSrc.includes('302 342') || logoSrc.includes('M 23 163') || logoSrc.includes('default_house_logo.svg'))) {
      logoSrc = defaultLogoSvg;
    }
    const logoSize = Math.max(40, Math.min(300, Number(proj.logoSize) || 60));
    const logoHtml = `
      <div class="print-header-logo-container" style="flex: 0 0 auto; margin-right: 14px; display: flex; align-items: center;">
        <img src="${logoSrc}" alt="Logo Proyek" style="width: ${logoSize}px !important; max-width: ${logoSize}px !important; max-height: ${Math.round(logoSize * 0.75)}px !important; object-fit: contain !important; display: block !important;">
      </div>
    `;

    return `
      <div class="print-header-block">
        <div class="print-header-top" style="display: flex; align-items: center; justify-content: space-between;">
          <div style="display: flex; align-items: center; max-width: 65%;">
            ${logoHtml}
            <div class="print-header-logo-text">
              <span class="company-brand">${contractorStr}</span>
              <span class="company-sub">Sistem Informasi Perencanaan, Estimasi Biaya &amp; Manajemen Konstruksi</span>
            </div>
          </div>
          <div class="print-header-meta">
            <div><strong>No. Dokumen:</strong> ${docNumStr}</div>
            <div><strong>Tanggal Cetak:</strong> ${printDate}</div>
          </div>
        </div>
        <div class="print-doc-title-box">
          <h3 class="print-doc-title">${docType}</h3>
          <div class="print-doc-subtitle">Berdasarkan Standar ${proj.dataSource || 'SE Direktur Jenderal Bina Konstruksi No. 47/SE/Dk/2026'}</div>
        </div>
        <table class="print-header-project-table">
          <tbody>
            <tr>
              <td style="width: 16%;"><strong>Nama Pekerjaan:</strong></td>
              <td style="width: 38%; font-weight: 700; color: #0f172a;">${projName}</td>
              <td style="width: 18%;"><strong>Waktu Pelaksanaan:</strong></td>
              <td style="width: 28%; font-weight: 700; color: #1e40af;">${durDays} Hari Kalender (${durWeeks} Minggu)</td>
            </tr>
            <tr>
              <td><strong>Lokasi Proyek:</strong></td>
              <td>${projLoc}</td>
              <td><strong>Target Jadwal:</strong></td>
              <td>${startStr} s.d. ${finishStr}</td>
            </tr>
            <tr>
              <td><strong>Pemilik / Tugas:</strong></td>
              <td>${projOwner}</td>
              <td><strong>Kebutuhan Tenaga:</strong></td>
              <td style="font-weight: 700; color: #059669;">${laborInfoStr}</td>
            </tr>
            <tr>
              <td><strong>Konsultan:</strong></td>
              <td>${proj.consultant || "Tim Perencana & Manajemen Konstruksi"}</td>
              <td><strong>Wilayah Acuan:</strong></td>
              <td>${regionStr}</td>
            </tr>
          </tbody>
        </table>
      </div>
    `;
  }

  function createLandscapePrintHeader(arg1, arg2 = "KURVA S PEKERJAAN PROYEK", arg3 = {}) {
    let proj = {};
    let docType = "KURVA S PEKERJAAN PROYEK";
    let extraInfo = {};

    if (typeof arg1 === 'string') {
      docType = arg1;
      proj = arg2 || {};
      extraInfo = arg3 || {};
    } else {
      proj = arg1 || {};
      docType = (typeof arg2 === 'string') ? arg2 : "KURVA S PEKERJAAN PROYEK";
      extraInfo = (typeof arg3 === 'object') ? arg3 : {};
    }

    const projName = proj.name || proj.nama || "Pembangunan Rumah Tinggal Baru";
    const projLoc = proj.location || proj.lokasi || "Bandung, Jawa Barat";
    const projOwner = proj.owner || proj.pemilik || "Pemberi Tugas";
    const durDays = proj.durationDays || proj.durasi || 180;
    const durWeeks = Math.ceil(durDays / 7);
    const startStr = proj.startDate || proj.tanggalMulai || "2026-04-01";
    const finishStr = proj.finishDate || proj.tanggalSelesai || "2026-09-27";
    const contractorStr = proj.contractor || proj.kontraktor || "Dutamik.id";
    const docNumStr = proj.docNumber || proj.nomorDokumen || proj.kodeRegistrasi || "RAB/2026/001";
    const printDate = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });

    const lDefaultLogoSvg = (typeof window !== 'undefined' && (window.DEFAULT_HOUSE_LOGO_DATA_URI || window.DEFAULT_HOUSE_LOGO_SVG)) || (typeof DEFAULT_HOUSE_LOGO_DATA_URI !== 'undefined' ? DEFAULT_HOUSE_LOGO_DATA_URI : "data:image/png;base64,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");
    let lLogoSrc = (proj.logo && typeof proj.logo === 'string' && proj.logo.trim().length > 10) ? proj.logo : lDefaultLogoSvg;
    if (typeof lLogoSrc === 'string' && (lLogoSrc.includes('302 342') || lLogoSrc.includes('M 23 163') || lLogoSrc.includes('default_house_logo.svg'))) {
      lLogoSrc = lDefaultLogoSvg;
    }
    const lLogoSize = Math.max(40, Math.min(220, Number(proj.logoSize) || 60));
    const landLogoHtml = `
      <div class="print-header-landscape-logo" style="flex: 0 0 auto; margin-right: 10px; display: flex; align-items: center;">
        <img src="${lLogoSrc}" alt="Logo Proyek" style="width: ${lLogoSize}px !important; max-width: ${lLogoSize}px !important; max-height: ${Math.round(lLogoSize * 0.65)}px !important; object-fit: contain !important; display: block !important;">
      </div>
    `;

    return `
      <div class="print-header-landscape-compact" style="border-bottom: 1.5pt solid #0f172a; padding-bottom: 4px; margin-bottom: 6px; width: 100%; box-sizing: border-box; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
          <div style="width: 35%; display: flex; align-items: center; line-height: 1.2;">
            ${landLogoHtml}
            <div>
              <div style="font-size: 9.5pt; font-weight: 800; color: #0f172a; text-transform: uppercase; letter-spacing: 0.3px;">${contractorStr}</div>
              <div style="font-size: 7pt; color: #475569;">Estimasi Biaya &amp; Manajemen Konstruksi</div>
            </div>
          </div>
          <div style="width: 37%; text-align: center; line-height: 1.2;">
            <div style="font-size: 11pt; font-weight: 900; color: #0f172a; text-transform: uppercase; letter-spacing: 0.5px;">${docType}</div>
            <div style="font-size: 7pt; color: #475569;">Standar ${proj.dataSource || 'SE Dirjen Bina Konstruksi No. 47/SE/Dk/2026'}</div>
          </div>
          <div style="width: 28%; text-align: right; font-size: 7.5pt; color: #334155; line-height: 1.25;">
            <div><strong>No. Dok:</strong> ${docNumStr}</div>
            <div><strong>Tgl Cetak:</strong> ${printDate}</div>
          </div>
        </div>
        <table style="width: 100%; border-collapse: collapse; font-size: 7.5pt; background: transparent; border: none; border-bottom: 1px solid #e2e8f0;">
          <tbody>
            <tr>
              <td style="padding: 2.5px 4px; width: 8%; font-weight: 700; color: #475569; white-space: nowrap;">Pekerjaan:</td>
              <td style="padding: 2.5px 4px; width: 30%; font-weight: 700; color: #0f172a; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${projName}">${projName}</td>
              <td style="padding: 2.5px 4px; width: 6%; font-weight: 700; color: #475569; white-space: nowrap;">Lokasi:</td>
              <td style="padding: 2.5px 4px; width: 24%; color: #334155; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${projLoc}">${projLoc}</td>
              <td style="padding: 2.5px 4px; width: 6%; font-weight: 700; color: #475569; white-space: nowrap;">Durasi:</td>
              <td style="padding: 2.5px 4px; width: 26%; font-weight: 700; color: #1e40af; white-space: nowrap; text-align: right;">${durDays} Hari (${durWeeks} Mgg) | ${startStr} s.d ${finishStr}</td>
            </tr>
          </tbody>
        </table>
      </div>
    `;
  }

  function createPrintFooter(arg1, options = {}) {
    const proj = (typeof arg1 === 'object' && arg1) ? arg1 : ((window.ProjectManager && window.ProjectManager.getActiveProject()) || {});
    const docNum = proj.docNumber || "RAB/2026/001";
    const contractor = proj.contractor || "";
    const pageStr = options.pageStr || "Halaman 1 dari 1";

    return `
      <div class="print-footer-block">
        <div class="footer-left">
          <span>${contractor ? contractor + '  :  ' : ''}${proj.dataSource || 'Standar SE PUPR No. 47/2026'}</span>
          <span style="margin-left: 8px; font-family: monospace;">(${docNum})</span>
        </div>
        <div class="footer-right">
          <strong>${pageStr}</strong>
        </div>
      </div>
    `;
  }

  function downloadPdfDirect(targetElementId, filename = "Dokumen_RAB.pdf", customOrientation = null) {

    printDocument(targetElementId, filename);
  }

  return {
    printDocument,
    printViaHiddenIframe,
    downloadPdfDirect,
    createPrintHeader,
    createLandscapePrintHeader,
    createPrintFooter
  };
})();
