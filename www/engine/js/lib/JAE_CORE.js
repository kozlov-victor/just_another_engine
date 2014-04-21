var GLOBAL = window.GLOBAL || {};

(function () {

    var _onDomReadyObjects = [];

    GLOBAL._onDOMReady = function (fn, priority) {
        if (GLOBAL._isDOMReady) {
            if (fn) fn();
        } else {
            _onDomReadyObjects.push({fn:fn, priority:priority});
        }
    }
    GLOBAL._isDOMReady = false;
    GLOBAL._each = function (arr, fnEach) {
        if (arr && arr.length > 0) {
            for (var i = 0, max = arr.length; i < max; i++) {
                var res = fnEach(arr[i], i);
                if (res === false) break;
            }
        }
    }

    window.addEventListener('load', function () {
        GLOBAL._isDOMReady = true;
        _onDomReadyObjects.sort(function (a, b) {
            var prA = a.priority || 0;
            var prB = b.priority || 0;
            return prA < prB ? 1 : -1;
        });
        GLOBAL._each(_onDomReadyObjects, function (item) {
            if (item && item.fn) item.fn();
        });
    });

    GLOBAL._merge = function (currentObj, defaultObj) {
        for (var i in defaultObj) {
            currentObj[i] || (currentObj[i] = defaultObj[i]);
        }
    }

    GLOBAL.context = (function () {
        var beans = {};
        this.getBean = function (name, fnRef) {
            return beans[name] || new fnRef();
        }
        this.registerBean = function (name, fnRef) {
            beans[name] = new fnRef();
        }
        return this;
    })();

    GLOBAL.ACTIONS = {
        START:(window.ontouchstart !== undefined ?
            'touchstart' : 'mousedown'),
        MOVE:(window.ontouchmove !== undefined ?
            'touchmove' : 'mousemove'),
        END:(window.ontouchend !== undefined ?
            'touchend' : 'mouseup')
    }

    GLOBAL.BASE_URL = (function () {
        var realHref = document.location.href;
        var relativeHref = '';
        var rootFolder = 'www';
        var relativeHrefArr = realHref.split(rootFolder);
        if (relativeHrefArr.length > 0) {
            relativeHref = relativeHrefArr[0] + rootFolder + '/';
        }
        return relativeHref;
    })();

    GLOBAL.Deffered = Class.extend({
        _events:null,
        _callBackFn:null,
        _progressFn:null,
        init:function () {
            this._events = [];
            this.t = 1000;
        },
        checkForCallBack:function () {
            var maxEvents = this._events.length;
            if (maxEvents == 0) {
                return;
            }
            var isNeedInvokation = true;
            for (var i = 0; i < maxEvents; i++) {
                if (!this._events[i].flagLoaded) return;
            }
            if (this._callBackFn) {
                this._callBackFn();
            }
        },
        getCompletedEvents:function () {
            var res = 0;
            GLOBAL._each(this._events, function (item) {
                if (item.flagLoaded) res++;
            });
            return res;
        },
        addEvent:function (ev, onCompleteFn) {
            var _self = this;
            _self._events.push(ev);
            _self.t += 10;
            /*ev.onload = setTimeout(function () {
             GLOBAL._onDOMReady(function () {
             ev.flagLoaded = true;
             if (onCompleteFn) {
             onCompleteFn();
             }
             _self.checkForCallBack();
             if (_self._progressFn) {
             var completed;
             if (_self._events.length == 0) {
             completed = 0;
             }
             else {
             var completedEvents = _self.getCompletedEvents();
             var allEvents = _self._events.length;
             completed = completedEvents / allEvents;
             _self._progressFn(completed);
             }
             }
             }, 10);
             },_self.t);*/
            ev.onload = function () {
                GLOBAL._onDOMReady(function () {
                    ev.flagLoaded = true;
                    if (onCompleteFn) {
                        onCompleteFn();
                    }
                    _self.checkForCallBack();
                    if (_self._progressFn) {
                        var completed;
                        if (_self._events.length == 0) {
                            completed = 0;
                        }
                        else {
                            var completedEvents = _self.getCompletedEvents();
                            var allEvents = _self._events.length;
                            completed = completedEvents / allEvents;
                            _self._progressFn(completed);
                        }
                    }
                }, 10);
            };
        },
        setOnCompleteFn:function (fn) {
            this._callBackFn = fn;
        },
        setOnProgressFn:function (fn) {
            this._progressFn = fn;
        }
    });


    GLOBAL.readTextFile = function (file, callback) {
        var s = document.createElement('script');
        s.id = 'id';
        s.type = 'text/html';
        s.src = file;
        s.sandbox = "allow-same-origin allow-scripts";
        document.getElementsByTagName('head')[0].appendChild(s);
        s.onload = function () {
            //var iFrameDoc = s.contentDocument || s.contentWindow.document || s.document;
            console.log(s)
//               var textPlain = '';
//                console.log('textPlain', iFrameDoc);
//               if (callback) callback(textPlain);
//               //s.parentNode.removeChild(s);
        };
    }

})();



