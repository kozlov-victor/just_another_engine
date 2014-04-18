var ENGINE = (function () {
    return new function () {
        var _external = this;

        var _maxOfArr = function (arr, field) {
            var l = arr.length;
            if (l == 0) return null;
            else if (l == 1) return arr[0][field];
            var maxVal = arr[0][field];
            for (var i = 1; i < l; i++) {
                if (arr[i][field] > maxVal) maxVal = arr[i][field];
            }
            return maxVal;
        };

        var _min = function (a, b) {
            return a < b ? a : b;
        };
        var _delta = function (a, b) {
            var res = a - b;
            return res > 0 ? res : -res;
        };

        var _isPointInRect = function (x, y, rect) {
            return x > rect._x &&
                x < (rect._x + rect._width) &&
                y > rect._y &&
                y < (rect._y + rect._height);
        };

        var _isRectInScreen = function (rect) {
            var scrW = _external.SCREEN.IDEAL_WIDTH;
            var scrH = _external.SCREEN.IDEAL_HEIGHT;
            return rect._x > rect._width >= 0 && rect._x <= scrW &&
                rect._y > rect._height >= 0 && rect._y <= scrH
        }

        var degToRad = function (deg) {
            return deg * (Math.PI / 180);
        };

        var getRandom = function (min, max) {
            var delta = max - min;
            var res = Math.random() * delta;
            res = res + min;
            return res;
        }

        var getDispersedValue = function (initial, dispersion) {
            var delta = initial * dispersion;
            return getRandom(initial - delta, initial + delta);
        }


        this.COMPOSITE_OPERATIONS = {
            NORMAL:'normal', MULTIPLY:'multiply', SCREEN:'screen', OVERLAY:'overlay',
            DARKEN:'darken', LIGHTEN:'lighten', COLOR_DODGE:'color-dodge', COLOR_BURN:'color-burn',
            HARD_LIGHT:'hard-light', SOFT_LIGHT:'soft-light', DIFFERENCE:'difference',
            EXCLUSUIN:'exclusion', HUE:'hue', SATURATION:'saturation',
            COLOR:'color', LUMINOCITY:'luminosity',
            CLEAR:'clear', COPY:'copy', DESTINATION:'destination', SOURCE_OVER:'source-over',
            DESTINATION_OVER:'destination-over', SOURCE_IN:'source-in', DESTINATION_IN:'destination-in',
            SOURCE_OUT:'source-out', DESTINATION_OUT:'destination-out', SOURCE_ATOP:'source-atop',
            DESTINATION_ATOP:'destination-atop', XOR:'xor', LIGHTER:'lighter'

        };

        this.SCREEN = Class.extend({}, {
            _devMode:0,
            IDEAL_WIDTH:240,
            IDEAL_HEIGHT:320,
            SCREEN_WIDTH:screen.width,
            SCREEN_HEIGHT:screen.height,
            SCALED_WIDTH:null,
            SCALED_HEIGHT:null,
            SCALED_FACTOR_X:null,
            SCALED_FACTOR_Y:null,
            SCREEN_LEFT:0,
            SCREEN_TOP:0,
            SCALE_RATIO:window.devicePixelRatio || 1,
            fit:function (cnv, ctx) {
                var realWidth = this.SCREEN_WIDTH;
                var realHeight = this.SCREEN_HEIGHT;
                var idealWidth = this.IDEAL_WIDTH;
                var idealHeight = this.IDEAL_HEIGHT;
                var scaleFactor = _min(realWidth / idealWidth, realHeight / idealHeight);
                var scaledWidth = idealWidth * scaleFactor;
                var scaleDeltaX = _delta(scaledWidth, realWidth) / 2;
                var scaledHeight = idealHeight * scaleFactor;
                var scaleDeltaY = _delta(scaledHeight, realHeight) / 2;
                var ratio = _external.SCREEN.SCALE_RATIO;
                cnv.width = _external.SCREEN.IDEAL_WIDTH / ratio;
                cnv.height = _external.SCREEN.IDEAL_HEIGHT / ratio;

                var oneDivRatio = 1 / ratio;
                ctx.scale(oneDivRatio, oneDivRatio);
                cnv.setAttribute('style', 'position:absolute;width:' + scaledWidth + 'px;height:' + scaledHeight + 'px;left:' + scaleDeltaX + 'px;top:' + scaleDeltaY + 'px');
                console.log('width:' + scaledWidth + 'px,height:' + scaledHeight + 'px,left:' + scaleDeltaX + 'px,top:' + scaleDeltaY + 'px');
                this.SCREEN_LEFT = scaleDeltaX;
                this.SCREEN_TOP = scaleDeltaY;
                this.SCALED_WIDTH = scaledWidth;
                this.SCALED_HEIGHT = scaledHeight;
                this.SCALED_FACTOR_X = this.IDEAL_WIDTH / this.SCALED_WIDTH;
                this.SCALED_FACTOR_Y = this.IDEAL_HEIGHT / this.SCALED_HEIGHT;
                return this;
            },
            refreshSize:function () {
                this.SCREEN_WIDTH = window.innerWidth;
                this.SCREEN_HEIGHT = window.innerHeight;
                return this;
            },
            dispatchMouse:function () {
                var _self = this;
                var objects = _external.SceneManager._currentScene._getObjects();
                var dispatchOneTouch = function (opName, scrX, scrY, objects) {
                    var x = (scrX - _self.SCREEN_LEFT) * _self.SCALED_FACTOR_X;
                    var y = (scrY - _self.SCREEN_TOP) * _self.SCALED_FACTOR_Y;
                    var engineEvent = {x:x, y:y}; // todo может поднять наверх
                    var currentScene = _external.SceneManager._currentScene;
                    var userFn = '_on' + opName + 'Fn';
                    if (currentScene[userFn]) currentScene[userFn](engineEvent);
                    for (var i = objects.length - 1; i >= 0; i--) {
                        var obj = objects[i];
                        if (obj._opacity == 0) continue;
                        if (_isPointInRect(x, y, obj._rect)) {
                            var defaultFn = '_dispatch' + opName;
                            obj[defaultFn](engineEvent);
                            if (obj[userFn]) obj[userFn](engineEvent);
                        }
                    }
                }
                var triggerMouseAction = function (e, opName) {
                    e.preventDefault();
                    e.stopPropagation();
                    var scrX, scrY;
                    if (e.touches) {
                        var touches = e.touches;
                        for (var i = touches.length - 1; i >= 0; i--) {
                            var touch = touches[i];
                            scrX = touch.pageX;
                            scrY = touch.pageY;
                            dispatchOneTouch(opName, scrX, scrY, objects);
                        }
                    } else {
                        scrX = e.pageX;
                        scrY = e.pageY;
                        dispatchOneTouch(opName, scrX, scrY, objects);
                    }
                }
                // click
                var bodyElement = document.getElementsByTagName('body')[0];
                bodyElement.addEventListener(GLOBAL.ACTIONS.START, function (e) {
                    triggerMouseAction(e, 'Click');
                });
                // mouseMove
                bodyElement.addEventListener(GLOBAL.ACTIONS.MOVE, function (e) {
                    triggerMouseAction(e, 'MouseMove');
                });
                return this;
            }
        });

        this._KeyFramesHolder = Class.extend({
            _tasks:null,
            _numOfLoops:null,
            _currentLoop:null,
            init:function () {
                this._tasks = [];
                this._numOfLoops = 1;
                this._currentLoop = 0;
            },
            run:function () {
                var taskProcessed;
                var tasks = this._tasks;
                var maxTime = _maxOfArr(tasks, 'time');
                var _self = this;
                GLOBAL._each(tasks, function (task) {
                    var taskTime = task.time;
                    if (_self._numOfLoops == 0 || _self._numOfLoops == 1) {
                        (function (obj, fn, args) {
                            setTimeout(function () {
                                    fn.apply(obj, args)
                                },
                                taskTime);
                        })(task.object, task.fn, task.args);
                    } else {
                        (function (obj, fn, args) {
                            setTimeout(function () {
                                task.intervalUID = setInterval(function () {
                                        fn.call(obj, args);
                                    },
                                    maxTime + taskTime);
                            }, taskTime);
                        })(task.object, task.fn, task.args);
                    }
                });
            },
            addKeyFrame:function (time, obj, fn, argsArr) {
                this._tasks.push({time:time, object:obj, fn:fn, args:argsArr});
                return this;
            },
            setNumOfLoops:function (n) {
                this._numOfLoops = n;
                return this;
            }
        });

        var Sprite = Class.extend({
            _image:null,
            _width:0,
            _height:0,
            _frameRect:null,
            _currentFrame:0,
            _numOfFramesInWidth:1,
            _numOfFramesInHeight:1,
            init:function (strUrl) {
                this._image = new Image();
                this._image.src = strUrl;
                this._frameRect = {_x:0, _y:0, _width:0, _height:0}
            },
            _revalidateFrame:function (frameWidth, frameHeight, frameNum) {
                this._setFrameSize(frameWidth, frameHeight);
                this._setFrameCurrent(frameNum);
            },
            _setFrameSize:function (frameWidth, frameHeight) {
                if (!(frameWidth && frameHeight)) return;
                this._numOfFramesInWidth = this._width / frameWidth;
                this._numOfFramesInHeight = this._height / frameHeight;
                this._frameRect._width = frameWidth;
                this._frameRect._height = frameHeight;
            },
            _setFrameCurrent:function (frameNum) {
                var currFramePosX = frameNum % this._numOfFramesInWidth;
                var currFramePosY = (frameNum ) % this._numOfFramesInHeight;
                var framePosX = currFramePosX * this._frameRect._width;
                var framePosY = currFramePosY * this._frameRect._height;
                this._frameRect._x = framePosX;
                this._frameRect._y = framePosY;
            }
        });
        this._ClickableObject = Class.extend({
            _onClickFn:null,
            _onMouseMoveFn:null,
            init:function () {
            },
            onClick:function (__onClickFn) {
                this._onClickFn = __onClickFn;
            },
            onMouseMove:function (__onMouseMoveFn) {
                this._onMouseMoveFn = __onMouseMoveFn;
            },
            _dispatchClick:function (e) {
                // поведение элемента при клике, по умолчанию нет, метод будет переопределяться
            },
            _dispatchMouseMove:function (e) {
            }
        });
        this._ScalableObject = _external._ClickableObject.extend({
            _angle:null,
            _scale:null,
            init:function () {
                this._angle = 0;
                this._scale = 1;
            },
            _setAngle:function (angle) {
                this._angle = angle;
            },
            _setScale:function (scale) {
                this._scale = scale;
            }
        });
        this._DrawableObject = _external._ScalableObject.extend({
            _compositeOperation:null,
            _draw:function () {
                TransitionResolver.resolveGameObjectTransitions(this);
                var _options = {};
                _options._opacity = this._opacity;
                _options._angle = this._angle;
                _options._centerX = this._center._x;
                _options._centerY = this._center._y;
                _options._scale = this._scale;
                _options._compositeOperation = this._compositeOperation;
                _external._Context._drawSprite(this._sprite, this._rect._x, this._rect._y, _options);
            },
            setCompositeOperation:function (op) {
                this._compositeOperation = op;
            }
        });
        this._BaseObject = _external._DrawableObject.extend({
            _scene:null,
            _onloadFn:null,
            _opacity:null,
            _animations:null,
            _sprite:null,
            _rect:null,
            _center:null,
            _frameCurrent:0,
            _id:null,
            init:function (strUrl, scene, options) {
                this._super();
                this._doCommonInitOperations(strUrl, scene, options);
            },
            _doCommonInitOperations:function (strUrl, scene, options) {
                this._scene = scene;
                var _options = options || {};
                var showEmmediatly = _options.showEmmediatly || false;
                this._opacity = showEmmediatly ? 1 : 0;
                if (strUrl) this._sprite = new Sprite(strUrl);
                this._animations = [];
                this._rect = {_x:0, _y:0, _width:0, _height:0};
                this._center = {_x:0, _y:0};
                this._scene._addObject(this, options);
                this._compositeOperation = _external.COMPOSITE_OPERATIONS.SOURCE_OVER;
                this._scale = 1;
                this._angle = 0;
            },
            onload:function (__onloadFn) {
                this._onloadFn = __onloadFn;
            },
            setId:function (__id) {
                this._id = __id;
            },
            getId:function () {
                return this._id;
            },
            _setOpacity:function (n) {
                if (n < 0) n = 0;
                else if (n > 1) n = 1;
                this._opacity = n;
                return this;
            },
            _setPosX:function (x) {
                this._rect._x = x;
                return this;
            },
            _setPosY:function (y) {
                this._rect._y = y;
                return this;
            }
        });

        this.GameObject = this._BaseObject.extend({
            init:function (strUrl, scene, options) {
                this._super(strUrl, scene, options);
            },
            _resolveAnimation:function (obj, fnAnim, initial, target, duration, callBackOnComplete, easeFn) {
                if (!duration) {
                    fnAnim.apply(obj, [target]);
                    if (callBackOnComplete) callBackOnComplete();
                    return;
                }
                ;
                var animationObject = {
                    obj:obj,
                    fn:fnAnim,
                    initial:initial,
                    started:new Date().getTime(),
                    target:target,
                    duration:duration,
                    callBack:callBackOnComplete,
                    easeFn: easeFn || _external.EaseFunctions.LINEAR
                }
                this._animations.push(animationObject);
            },
            setFrameCurrent:function (n, callBack) {
                this._frameCurrent = n;
                this._sprite._setFrameCurrent(n);
                if (callBack) callBack();
                return this;
            },
            setFrameSize:function (w, h) {
                this._sprite._setFrameSize(w, h);
                this._rect._width = w;
                this._rect._height = h;
                this._center._x = this._rect._width >> 1;
                this._center._y = this._rect._height >> 1;
                this._sprite._revalidateFrame(w, h, this._frameCurrent);
                return this;
            },
            setOpacity:function (n, mlsc, callBack, easeFn) {
                this._resolveAnimation(this, this._setOpacity, this._opacity, n, mlsc, callBack, easeFn);
                return this;
            },
            rotate:function (angleInDeg, mlsc, callBack, easeFn) {
                this._resolveAnimation(this, this._setAngle, this._angle, degToRad(angleInDeg), mlsc, callBack, easeFn);
                return this;
            },
            setPos:function (x, y) {
                this._rect._x = x;
                this._rect._y = y;
                return this;
            },
            setPosX:function (n, mlsc, callBack, easeFn) {
                this._resolveAnimation(this, this._setPosX, this._rect._x, n, mlsc, callBack, easeFn);
                return this;
            },
            setPosY:function (n, mlsc, callBack, easeFn) {
                this._resolveAnimation(this, this._setPosY, this._rect._y, n, mlsc, callBack, easeFn);
                return this;
            },
            centrate:function () {
                this._rect._x = (_external.SCREEN.IDEAL_WIDTH >> 1) - this._center._x;
                this._rect._y = (_external.SCREEN.IDEAL_HEIGHT >> 1) - this._center._y;
                return this;
            },
            scale:function (n, mlsc, callBack, easeFn) {
                this._resolveAnimation(this, this._setScale, this._scale, n, mlsc, callBack, easeFn);
                return this;
            },
            show:function (mlsc, callBack, easeFn) {
                this.setOpacity(1, mlsc, callBack, easeFn);
                return this;
            },
            hide:function (mlsc, callBack, easeFn) {
                this.setOpacity(0, mlsc, callBack, easeFn);
                return this;
            }
        });

        this._Context = Class.extend({}, {
            _cnv:null,
            _ctx:null,
            _needRestoreCurrentFrame:null,
            _isAlreadySaved:null,
            _currentScene:null,
            _emptyOptions:{},
            init:function (cnv) {
                console.log('initing context of _Context with ' + cnv);
                this._cnv = cnv;
                this._ctx = this._cnv.getContext('2d');
                console.log('>>>>>>>>>>>>>>>>>>>>' + _external.SCREEN.SCREEN_WIDTH + ' * ' + _external.SCREEN.SCREEN_HEIGHT);
                console.log('>>>>>>>>>>>>>>>>>>>> window.devicePixelRatio ' + window.devicePixelRatio);
                var _self = this;
                window.onresize = function () {
                    _external.SCREEN.refreshSize();
                    _external.SCREEN.fit(_self._cnv, _self._ctx);
                };
                _external.SCREEN.fit(this._cnv, this._ctx).dispatchMouse();
                this._needRestoreCurrentFrame = false;
                this._isAlreadySaved = false;
            },
            _saveCurrentState:function () {
                if (!this._isAlreadySaved) {
                    this._ctx.save();
                    this._isAlreadySaved = true;
                    this._needRestoreCurrentFrame = true;
                }
            },
            _restoreContext:function () {
                if (this._needRestoreCurrentFrame) {
                    this._ctx.restore();
                }
                this._isAlreadySaved = false;
                this._needRestoreCurrentFrame = false;
                _external._Context._ctx.globalCompositeOperation = _external.COMPOSITE_OPERATIONS.SOURCE_OVER;
            },
            _scaleContext:function (scale) {
                this._saveCurrentState();
                var scaleRatio = _external.SCREEN.SCALE_RATIO;
                var trX = (this._cnv.width - this._cnv.width * scale) * scaleRatio >> 1;
                var trY = (this._cnv.height - this._cnv.height * scale) * scaleRatio >> 1;
                this._ctx.translate(trX, trY);
                this._ctx.scale(scale, scale);
            },
            _rotateContext:function (x, y, centerX, centerY, angle) {
                this._saveCurrentState();
                var centerXcurrent = x + centerX;
                var centerYcurrent = y + centerY;
                this._ctx.translate(centerXcurrent, centerYcurrent);
                this._ctx.rotate(angle);
                this._ctx.translate(-centerXcurrent, -centerYcurrent);
            },
            _setCompositeOperation:function (op) {
                this._ctx.globalCompositeOperation = op;
            },
            _defaultOptions:{_opacity:1, fillStyle:'#000000', _angle:0, _scale:1},
            _drawSprite:function (sprite, x, y, options) {
                options = options || this._emptyOptions;
                var frameRect = sprite._frameRect;
                this._ctx.globalAlpha = options._opacity == undefined ? this._defaultOptions._opacity : options._opacity;
                var scale = options._scale;
                if (scale != 1) {
                    this._scaleContext(scale);
                }
                var angle = options._angle;
                if (angle != 0) {
                    this._rotateContext(x, y, options.centerX, options.centerY, angle);
                }
                this._setCompositeOperation(options._compositeOperation);
                this._ctx.drawImage(
                    sprite._image,
                    frameRect._x, frameRect._y,
                    frameRect._width, frameRect._height,
                    x, y,
                    frameRect._width, frameRect._height
                );
                this._restoreContext();
            },
            _drawImg:function (img, x, y, w, h, x1, y1, w1, h1, options) {
                options = options || this._emptyOptions;
                this._ctx.globalAlpha = options._opacity == undefined ? this._defaultOptions._opacity : options._opacity;
                this._ctx.drawImage(
                    img,
                    x1, y1,
                    w, h,
                    x, y,
                    w1, h1
                );
            },
            fillRect:function (x, y, w, h, fillStyle) {
                this._ctx.fillStyle = fillStyle;
                this._ctx.globalAlpha = this._defaultOptions._opacity;
                this._ctx.fillRect(x, y, w, h);
                this._ctx.fillStyle = this._defaultOptions.fillStyle;
            }
        });

        this.Scene = _external._ClickableObject.extend({
            _objects:null,
            _particleGroups:null,
            _backGround:null,
            _backGroundColor:null,
            init:function () {
                this._objects = [];
                this._particleGroups = {};
                this._particleGroups.uids = {};
                this._particleGroups.stopDrawing = true;
                this._backGround = null;
                this._backGroundColor = _external._Context._defaultOptions._opacity;
                ENGINE.SceneManager.setCurrentScene(this);
            },
            _addObject:function (obj, options) {
                if (options && options.isParticle) {
                    if (!this._particleGroups['uids'][options.uid]) {
                        this._particleGroups['uids'][options.uid] = {};
                        this._particleGroups['uids'][options.uid]['particles'] = [];
                        this._particleGroups['uids'][options.uid]['stopDrawing'] = true;
                    }
                    ;
                    this._particleGroups['uids'][options.uid]['particles'].push(obj);
                }
                else this._objects.push(obj);
                _external.SceneManager._processLoadingSprite(obj);
            },
            _getObjects:function () {
                return this._objects;
            },
            loadBackGround:function (strUrl) {
                this._backGround = new _external.GameObject(strUrl, this);
                _external.SceneManager._processLoadingSprite(this._backGround);
                return this._backGround;
            },
            setBackGroundColor:function (r, g, b, a) {
                a = (a == undefined) ? 1 : a;
                this._backGroundColor = 'rgba(' + r + ',' + g + ',' + b + ',' + a + ')';
            },
            createKeyFrames:function () {
                var kfh = new _external._KeyFramesHolder();
                return kfh;
            }
        });

        this.SceneManager = Class.extend({}, {
            _currentScene:null,
            _context:null,
            _deffered:null,
            _fontSprite:null,
            _fontData:null,
            _setContext:function (cnv) {
                _external._Context.init(cnv);
                this._context = _external._Context;
            },
            onComplete:function (onCompleteFn) {
                this._initDefferedIfNeed();
                this._deffered.setOnCompleteFn(function () {
                    _external.SceneManager._start();
                    if (onCompleteFn) onCompleteFn();
                });
            },
            onProgress:function (onProgressFn) {
                this._initDefferedIfNeed();
                var _self = this;
                GLOBAL._onDOMReady(function () {
                    _self._deffered.setOnProgressFn(onProgressFn);
                }, 20);
            },
            _initDefferedIfNeed:function () {
                if (this._deffered == null) this._deffered = new GLOBAL.Deffered();
            },
            _processLoadingSprite:function (obj) {
                this._initDefferedIfNeed();
                if (!obj._sprite) return;
                this._deffered.addEvent(obj._sprite._image, function () {
                    obj._sprite._width = obj._sprite._image.width;
                    obj._sprite._height = obj._sprite._image.height;
                    if (obj._rect._width == 0 && obj._rect._height == 0) {
                        obj.setFrameSize(obj._sprite._width, obj._sprite._height);
                    }
                    obj._sprite._revalidateFrame(obj._rect._width, obj._rect._height, obj._frameCurrent);
                    if (obj._onloadFn) obj._onloadFn();
                });
            },
            setCurrentScene:function (scene) {
                this._currentScene = scene;
            },
            _getDeffered:function () {
                this._initDefferedIfNeed();
                return this._deffered;
            },
            setFont:function (strUrlImg, fontData) {
                this._initDefferedIfNeed();
                this._fontSprite = new Sprite(strUrlImg);
                this._deffered.addEvent(this._fontSprite._image, function () {
                    var allLabels = _external.UI.TextLabel.allTextLabels;
                    if (allLabels && allLabels.length > 0) {
                        for (var i = 0, max = allLabels.length; i < max; i++) {
                            allLabels[i]._calcRect();
                        }
                    }
                    _external.UI.TextLabel.allTextLabels = null;
                });
                this._fontData = fontData;
            },
            _start:function () {
                var _self = this;
                var doRender = function (callBack) {
                    if (window.requestAnimationFrame) {
                        console.log('requestAnimationFrame is supported.');
                        var drawFn = function () {
                            callBack();
                            requestAnimationFrame(drawFn);
                        }
                        drawFn();
                    } else {
                        console.log('requestAnimationFrame is NOT SUPPORTED.');
                        setInterval(callBack, 10);
                    }
                }
                var doInRender = function () {
                    //draw background
                    var backGround = _self._currentScene._backGround;
                    _self._context.fillRect(
                        0, 0, _external.SCREEN.IDEAL_WIDTH, _external.SCREEN.IDEAL_HEIGHT,
                        _self._currentScene._backGroundColor);
                    if (backGround) backGround._draw();
                    // draw rest objects
                    var objects = _self._currentScene._getObjects();
                    for (var i = 0, max = objects.length; i < max; i++) {
                        var obj = objects[i];
                        obj._draw();
                    }
                    // draw particles
                    var pgs = _self._currentScene._particleGroups;
                    if (pgs['stopDrawing']) return;
                    var stopDrawingAll = true;
                    var uids = pgs['uids'];
                    for (var uid in uids) {
                        var particlesArr = uids[uid]['particles'];
                        if (uids[uid]['stopDrawing']) continue;
                        var stopDrawing = true;
                        for (i = 0, max = particlesArr.length; i < max; i++) {
                            var particle = particlesArr[i];
                            if (_isRectInScreen(particle._rect)) {
                                if (particle._free == false) particle._draw();
                            } else {
                                particle._free = true;
                                particle.hide();
                            }
                            (particle._free == false) && (stopDrawingAll = stopDrawing = false);
                        }
                        pgs['stopDrawing'] = uids[uid]['stopDrawing'] = stopDrawing;
                    }
                    pgs['stopDrawing'] = stopDrawingAll;
                }
                GLOBAL._onDOMReady(function () {
                    doRender(doInRender);
                }, 40);
            },
            getContext:function () {
                return this._context;
            },
            setIdealScreenSize: function(w,h) {
                _external.SCREEN.IDEAL_WIDTH=w;
                _external.SCREEN.IDEAL_HEIGHT=h;
                if(_external._Context._cnv && _external._Context._ctx) {
                    _external.SCREEN.fit(_external._Context._cnv,_external._Context._ctx);
                }
            }
        });


        this.EaseFunctions = {
            LINEAR: 'linear',
            EASE_IN_QUAD: 'easeInQuad', EASE_OUT_QUAD: 'easeOutQuad', EASE_IN_OUT_QUAD: 'easeInOutQuad',
            EASE_IN_CUBIC : 'easeInCubic', EASE_OUT_CUBIC: 'easeOutCubic', EASE_IN_OUT_CUBIC: 'easeInOutCubic',
            EASE_IN_SINE: 'easeInSine', EASE_OUT_SINE: 'easeOutSine', EASE_IN_OUT_SINE: 'easeInOutSine',
            EASE_IN_EXPO: 'easeInExpo', EASE_OUT_EXPO: 'easeOutExpo', EASE_IN_OUT_EXPO: 'easeInOutExpo',
            EASE_IN_CIRC: 'easeInCirc', EASE_OUT_CIRC: 'easeOutCirc', EASE_IN_OUT_CIRC: 'easeInOutCirc'
        }

        // t - current time
        // b - start value
        // c - delta value
        // d - duration
        var _EaseFunctions = {
            linear: function(t, b, c, d) {
                //return  - t* (b - c)/d + b;
                return c*t/d+b;
            },
            easeInQuad: function (t, b, c, d) {
                t /= d;
                return c*t*t + b;
            },
            easeOutQuad: function (t, b, c, d) {
                t /= d;
                return -c * t*(t-2) + b;
            },
            easeInOutQuad: function (t, b, c, d) {
                t /= d/2;
                if (t < 1) return c/2*t*t + b;
                t--;
                return -c/2 * (t*(t-2) - 1) + b;
            },
            easeInCubic: function (t, b, c, d) {
                t /= d;
                return c*t*t*t + b;
            },
            easeOutCubic: function (t, b, c, d) {
                t /= d;
                t--;
                return c*(t*t*t + 1) + b;
            },
            easeInOutCubic: function (t, b, c, d) {
                t /= d/2;
                if (t < 1) return c/2*t*t*t + b;
                t -= 2;
                return c/2*(t*t*t + 2) + b;
            },
            easeInSine: function (t, b, c, d) {
                return -c * Math.cos(t/d * (Math.PI/2)) + c + b;
            },
            easeOutSine: function (t, b, c, d) {
                return c * Math.sin(t/d * (Math.PI/2)) + b;
            },
            easeInOutSine: function (t, b, c, d) {
                return -c/2 * (Math.cos(Math.PI*t/d) - 1) + b;
            },
            easeInExpo: function (t, b, c, d) {
                return c * Math.pow( 2, 10 * (t/d - 1) ) + b;
            },
            easeOutExpo: function (t, b, c, d) {
                return c * ( -Math.pow( 2, -10 * t/d ) + 1 ) + b;
            },
            easeInOutExpo: function (t, b, c, d) {
                t /= d/2;
                if (t < 1) return c/2 * Math.pow( 2, 10 * (t - 1) ) + b;
                t--;
                return c/2 * ( -Math.pow( 2, -10 * t) + 2 ) + b;
            },
            easeInCirc: function (t, b, c, d) {
                t /= d;
                return -c * (Math.sqrt(1 - t*t) - 1) + b;
            },
            easeOutCirc: function (t, b, c, d) {
                t /= d;
                t--;
                return c * Math.sqrt(1 - t*t) + b;
            },
            easeInOutCirc: function (t, b, c, d) {
                t /= d/2;
                if (t < 1) return -c/2 * (Math.sqrt(1 - t*t) - 1) + b;
                t -= 2;
                return c/2 * (Math.sqrt(1 - t*t) + 1) + b;
            }
        }

        var TransitionResolver = {
            resolveGameObjectTransitions:function (gObj) {
                var currentTime = new Date().getTime();
                //--движение объекта
                if (gObj._free === false) {
                    if (!gObj._t0) gObj._t0 = currentTime;
                    var deltaTime = currentTime - gObj._t0;
                    var posY = gObj._y0 + (gObj._v0 * deltaTime * Math.sin(gObj._alpha) + 0.01 * deltaTime * deltaTime / 2) * gObj._mu;
                    var posX = gObj._x0 + (gObj._v0 * deltaTime * Math.cos(gObj._alpha)) * gObj._mu;
                    gObj.setPos(posX, posY);
                    if (gObj._desappearing == false && deltaTime > gObj._timeOfLive) {
                        gObj._desappearing = true;
                        gObj.hide(gObj._timeOfDesappear, function () {
                            gObj._free = true;
                        });
                    }
                }
                //--анимации
                //obj       объект, у которого будет вызываться функция
                //fn        функция, которая вызывается для изменения значения поля
                //started   время начала анимации
                //initial   начальное значение анимации
                //target    конечное значение поля
                //duration  длительность анимации
                //easeFn    функция сглаживания
                //callBack  оповещение об окончании анимации
                var isTargetReached = false;
                var delta;
                GLOBAL._each(gObj._animations, function (currentAnim, i) {
                    if (currentAnim) {
                        var passed = (currentTime - currentAnim.started);
                        var deltaValue = currentAnim.target - currentAnim.initial;
                        var currentVal = _EaseFunctions[currentAnim.easeFn](passed,currentAnim.initial,deltaValue,currentAnim.duration);
                        isTargetReached = false;
                        if (passed>currentAnim.duration) {
                            currentVal = currentAnim.target;
                            isTargetReached = true;
                        }
                        currentAnim.fn.apply(currentAnim.obj, [currentVal]);
                        if (isTargetReached) {
                            if (currentAnim.callBack) currentAnim.callBack();
                            delete gObj._animations[i];
                        }
                    }
                });
            }
        };

        this._Particle = _external.GameObject.extend({
            _free:null,
            _v0:0,
            _m:null,
            _f:null,
            _x0:null,
            _y0:null,
            _posDispersionXinPx:null,
            _posDispersionYinPx:null,
            _t0:null,
            _mu:null,
            _desappearing:null,
            _alpha:null,
            _timeOfLive:null,
            _timeOfAppear:null,
            _timeOfDesappear:null,
            init:function (strUrl, scene, uid) {
                this._super(strUrl, scene, {isParticle:true, uid:uid});
                this._free = true;
                this._desappearing = false;
            },
        });

        var DEFAULT_PARTICLE_SYSTEM_OPTIONS = {
            compositeOperation:_external.COMPOSITE_OPERATIONS.SOURCE_OVER,
            particlesInBundle:100,
            particlesPerSplash:1,
            posDispersion:0.1,
            velocity:1,
            velocityDispersion:1,
            timeOfParticleLiveMlsc:1000,
            timeOfParticleLiveDispersion:0.5,
            timeOfParticleAppear:100,
            timeOfParticleAppearDispersion:0.5,
            timeOfParticleDesappear:500,
            timeOfParticleDesappearDispersion:0.5,
            force:5,
            forceDispersion:0.1,
            mass:1,
            massDispersion:0.1,
            alpha:Math.PI + Math.PI / 2,
            alphaDispersion:0.1
        }

        this.ParticleSystem = Class.extend({
            _uid:null,
            _iteratorIndex:null,
            _options:null,
            /*
             options {
             particlesInBundle
             strUrl
             scene
             }
             */
            init:function (options) {
                GLOBAL._merge(options, DEFAULT_PARTICLE_SYSTEM_OPTIONS);
                this._options = options;
                this._uid = new Date().getTime() + Math.random();
                var _particlesBundle = new Array(options.particlesInBundle);
                this._iteratorIndex = 0;
                var _opts = this._options;
                var DEFAULT_DISPERSION_POS_COEF = 50;
                var deffered = _external.SceneManager._getDeffered();
                for (var i = 0; i < _particlesBundle.length; i++) {
                    var particle = new _external._Particle(options.strUrl, options.scene, this._uid);
                    particle.setCompositeOperation(options.compositeOperation);
                    particle._mu = 0.01;
                    particle._m = getDispersedValue(_opts.mass, _opts.massDispersion);
                    particle._f = getDispersedValue(_opts.force, _opts.forceDispersion);
                    particle._v0 = particle._f / particle._m;
                    particle._alpha = getDispersedValue(_opts.alpha, _opts.alphaDispersion);
                    var deviationX = DEFAULT_DISPERSION_POS_COEF * _opts.posDispersion;
                    var deviationY = DEFAULT_DISPERSION_POS_COEF * _opts.posDispersion;
                    particle._posDispersionXinPx = getRandom(-deviationX, deviationX);
                    particle._posDispersionYinPx = getDispersedValue(-deviationY, deviationY);
                    particle._timeOfLive = getDispersedValue(_opts.timeOfParticleLiveMlsc, _opts.timeOfParticleLiveDispersion);
                    particle._timeOfAppear = getDispersedValue(_opts.timeOfParticleAppear, _opts.timeOfParticleAppearDispersion);
                    particle._timeOfDesappear = getDispersedValue(_opts.timeOfParticleDesappear, _opts.timeOfParticleDesappearDispersion);
                }
            },
            splash:function (x, y, n) {
                var _opts = this._options;
                var flag = true;
                var numOfIterated = 0;
                var numOfInvolved = 0;
                var allParticlesGroups = _opts.scene._particleGroups;
                var myParticleGroup = allParticlesGroups['uids'][this._uid];
                var myParticles = myParticleGroup['particles'];
                n = n || this._options.particlesPerSplash;
                while (flag) {
                    var particle = myParticles[this._iteratorIndex];
                    if (particle._free) {
                        particle._t0 = null;
                        particle.setPos(particle._x0, particle._y0).show(particle._timeOfAppear);
                        particle._free = false;
                        particle._desappearing = false;
                        myParticleGroup['stopDrawing'] = false;
                        allParticlesGroups['stopDrawing'] = false;
                        particle._x0 = x - particle._center._x + particle._posDispersionXinPx;
                        particle._y0 = y - particle._center._y + particle._posDispersionYinPx;
                        ++numOfInvolved;
                        this._needDrawing = true;
                    }
                    ++numOfIterated;
                    var l = myParticles.length;
                    (numOfIterated == l || numOfInvolved == n) && (flag = false);
                    ++this._iteratorIndex;
                    if (this._iteratorIndex == l) this._iteratorIndex = 0;
                }
            }
        });

        this.UI = (function () {

            return new function () {

                this.TextLabel = _external.GameObject.extend({
                    _for:null,
                    _text:null,
                    _fontScale:null,
                    setFontScale:function (fontScale) {
                        this._fontScale = fontScale;
                        this._calcRect();
                        return this;
                    },
                    getFontScale:function () {
                        return this._fontScale;
                    },
                    _calcRect:function () {
                        if (!this._text) return;
                        var currWidth = 0;
                        var fntData = _external.SceneManager._fontData;
                        var text = this._text;
                        for (var i = 0, max = this._text.length; i < max; i++) {
                            var ch = text[i];
                            var fntCharData = fntData[ch];
                            currWidth += fntCharData.width * this._fontScale;
                        }
                        this._rect._width = currWidth;
                        this._rect._height = fntData.height * this._fontScale;
                        this._center._x = this._rect._width >> 1;
                        this._center._y = this._rect._height >> 1;
                    },
                    init:function (scene, text, options) {
                        this._doCommonInitOperations(null, scene, options);
                        this._text = text || '';
                        this._fontScale = 1;
                        _external.UI.TextLabel.allTextLabels.push(this);
                    },
                    setFor:function (_forElement) {
                        this._for = _forElement;
                    },
                    _dispatchClick:function (e) {
                        if (this._for) {
                            this._for._dispatchClick(e);
                            if (this._for._onClickFn) this._for._onClickFn(e);
                        }
                    },
                    setText:function (text) {
                        this._text = text;
                        this._calcRect();
                    },
                    getText:function () {
                        return this._text;
                    },
                    _draw:function () {
                        TransitionResolver.resolveGameObjectTransitions(this);
                        var currX = this._rect._x;
                        var currY = this._rect._y;
                        var fntSpr = _external.SceneManager._fontSprite;
                        var fntData = _external.SceneManager._fontData;
                        var text = this._text;
                        var _options = {};
                        _options._opacity = this._opacity;
                        var scale = this._scale;
                        if (scale != 1) {
                            _external._Context._scaleContext(scale);
                        }
                        if (this._angle != 0) {
                            _external._Context._rotateContext(currX, currY, this._center._x, this._center._y, this._angle);
                        }
                        for (var i = 0, max = text.length; i < max; i++) {
                            var ch = text[i];
                            var fntCharData = fntData[ch];
                            _external._Context._setCompositeOperation(this._compositeOperation);
                            _external._Context._drawImg(fntSpr._image,
                                currX, currY, fntCharData.width, fntData.height,
                                fntCharData.x, fntCharData.y, fntCharData.width * this._fontScale, fntData.height * this._fontScale,
                                _options);
                            //_thatMain._Context._ctx.fillRect(currX,currY,fntCharData.width*this._fontScale,fntData.height*this._fontScale);
                            currX += fntCharData.width * this._fontScale;
                        }

                        _external._Context._restoreContext();

                    }
                }, {
                    allTextLabels:[]
                });
                this.SpriteLabel = _external.GameObject.extend({
                    _for:null,
                    _textContainer:null,
                    init:function (strUrl, scene, options) {
                        this._super(strUrl, scene, options);
                        this.onload(function () {
                        });
                    },
                    setFor:function (_forElement) {
                        this._for = _forElement;
                    },
                    _dispatchClick:function (e) {
                        if (this._for) {
                            this._for._dispatchClick(e);
                            if (this._for._onClickFn) this._for._onClickFn(e);
                        }
                    },
                    setText:function (text) {
                        if (this._textContainer == null) this._textContainer = new TextContainer();
                        this._textContainer.setText();
                    },
                    getText:function () {
                        if (this._textContainer) return this._textContainer._text;
                        else return null;
                    }
                });
                this.CheckBox = _external.GameObject.extend({
                    _isChecked:false,
                    _groupBox:null,
                    init:function (strUrl, scene, options) {
                        this._super(strUrl, scene, options);
                        var _self = this;
                        this.onload(function () {
                            var sprWidth = _self._sprite._width;
                            var sprHeight = _self._sprite._height;
                            _self.setFrameSize(sprWidth / 2, sprHeight);
                            _self.setFrameCurrent(+!!_self._isChecked);
                        });
                    },
                    setChecked:function (bChecked) {
                        this._isChecked = bChecked;
                        this.setFrameCurrent(+!!bChecked);
                        return this;
                    },
                    _dispatchClick:function (e) {
                        if (this._groupBox == null) {
                            this.setChecked(!this._isChecked);
                        } else {
                            if (this._isChecked) return;
                            this.setChecked(true);
                            for (var i = 0, max = this._groupBox._elements.length; i < max; i++) {
                                var element = this._groupBox._elements[i];
                                if (element != this) {
                                    element.setChecked(false);
                                }
                            }
                        }
                    }
                });
                this.GroupBox = Class.extend({
                    _elements:null,
                    init:function () {
                        this._elements = [];
                    },
                    addElement:function (element) {
                        this._elements.push(element);
                        element._groupBox = this;
                        return this;
                    }
                });
                this.Button = _external.GameObject.extend({
                    init:function (strUrl, scene, options) {
                        this._super(strUrl, scene, options);
                    }
                });
            }
        })();


        // initialization when DOM ready
        GLOBAL._onDOMReady(function () {
            var metaTagViewport = document.createElement('meta');
            metaTagViewport.name='viewport';
            metaTagViewport.content = 'width=device-width, '+
                ' minimum-scale=1, '+
                ' initial-scale=1, '+
                ' maximum-scale=1, '+
                ' user-scalable=no, '+
                ' target-densityDpi=device-dpi';
            document.getElementsByTagName('head')[0].appendChild(metaTagViewport);
            var metaTagCharSet = document.createElement('meta');
            var cnv = document.createElement('canvas');
            document.getElementsByTagName('body')[0].appendChild(cnv);
            _external.SceneManager._setContext(cnv);
            setTimeout(function(){
                // Hide the address bar!
                window.scrollTo(0, 1);
            }, 0);
        }, 50);

    }

})();
