var request = require('request');
var fs = require('fs');
var https = require('https');

var express = require('express');
var app = express();

var routes = JSON.parse(fs.readFileSync(__dirname + '/files/config/routes.json', 'utf8'));
var config = JSON.parse(fs.readFileSync(__dirname + '/files/config/config.json', 'utf8'));

var options = {
  key: fs.readFileSync(config.web.tls_key_file),
  cert: fs.readFileSync(config.web.tls_cert_file)
};
var serverPortTLS = config.web.tls_port;

const WEBSITE_DOMAIN = config.web.domain;

var server = https.createServer(options, app);
var io = require('socket.io')(server);

var clients = [];
var sockets = [];
var sessions = [];

var client = {
        socket: undefined,
        token: "",
        pseudo: "",
        balance: 0.00,
        sessid: undefined,
        pubkey: undefined
};

app.get(/.*css$/, function (req, res) {
    var css_filename = extractFileName(req.url);
    res.sendFile(__dirname + '/client/css/' + css_filename);
});
app.get(/.*js$/, function (req, res) {
    var js_filename = extractFileName(req.url);
    res.sendFile(__dirname + '/client/js/' + js_filename);
});
app.get(/.*otf$/, function (req, res) {
    var js_filename = extractFileName(req.url);
    res.sendFile(__dirname + '/client/fonts/' + js_filename);
});
app.get(/.*eot2$/, function (req, res) {
    var js_filename = extractFileName(req.url);
    res.sendFile(__dirname + '/client/fonts/' + js_filename);
});
app.get(/.*svg$/, function (req, res) {
    var js_filename = extractFileName(req.url);
    res.sendFile(__dirname + '/client/fonts/' + js_filename);
});
app.get(/.*ttf$/, function (req, res) {
    var js_filename = extractFileName(req.url);
    res.sendFile(__dirname + '/client/fonts/' + js_filename);
});
app.get(/.*woff2$/, function (req, res) {
    var js_filename = extractFileName(req.url);
    res.sendFile(__dirname + '/client/fonts/' + js_filename);
});
app.get(/.*woff$/, function (req, res) {
    var js_filename = extractFileName(req.url);
    res.sendFile(__dirname + '/client/fonts/' + js_filename);
});
app.get('*', function(req, res) {
    res.sendFile(__dirname + '/files/html/layout.html');
});

var io = require("socket.io")(server, {'pingInterval': 2000, 'pingTimeout': 5000});
var global = io
        .of('/global')
        .on('connection', function(socket) {

                if(getSessid(socket) !== false && getSessid(socket) !== undefined) {
                    sessions[getSessid(socket)] = socket;
                    sockets.push(socket);
                    var index = sockets.indexOf(socket);

                    var newClient = Object.create(client);
                    newClient.socket = socket;
                    newClient.sessid = getSessid(socket);
                    clients[index] = newClient;
                    console.log("Client : " + newClient.sessid + " connected");
                    socket.emit("init", { 'cookie':config.web.session_cookie });
                } else {
                    sockets.push(socket);
                    var index = sockets.indexOf(socket);

                    var newClient = Object.create(client);
                    newClient.socket = socket;
                    newClient.sessid = getSessid(socket);
                    clients[index] = newClient;
                    socket.emit("initSession", { 'cookie':config.web.session_cookie });
                    console.log("NEW Client : " + socket.id + " connected");
                }   

                socket.on('setSessId', function(data) {
                    console.log('Set SessId : ' + data.sessid);
                    var index = sockets.indexOf(socket);
                    clients[index].sessid = data.sessid;
                    sessions[getSessid(socket)] = socket;
                    socket.emit('registered');
                });

                socket.on('getLink', function(data) {
                    routeLink(socket, data.iolink.substr(1));
                });

                socket.on('disconnect', function() {
                        var i = sockets.indexOf(socket);
                        delete sockets[i];
                        delete clients[i];
                });
        }
);

/* Fonctions web server */

function extractFileName(url) {
    url = url.split('/');
    if(url[1] == "css") {
        var css_file = url[2];
        var regex = /([a-zA-Z0-9._-])+/g;
        var res = css_file.match(regex);
        return res[0];
    }
    if(url[1] == "js") {
        var css_file = url[2];
        var regex = /([a-zA-Z0-9._-])+/g;
        var res = css_file.match(regex);
        return res[0];
    }
    return false;
}

/* Fonctions socket */
function updateHTMLContent(socket, ref, data) {
    socket.emit('updateHTMLContent', {'ref':ref, 'data':data});
}
function createCookie(socket, name, data, time) {
    socket.emit('createCookie', {'name':name,'data':data,'time':time});
}
function removeCookie(socket, name) {
    socket.emit('removeCookie', {'name':name});
}
function updateMainContent(socket, data) {
    socket.emit('updateMainContent', {'data':data});
}
function updateAttribut(socket, ref, attr, data) {
    socket.emit('updateAttribut', {'ref':ref, 'attr':attr, 'data':data});
}
function updateTitle(socket, title) {
    socket.emit('updateTitle', {'title':title});
}
function updateStyle(socket, style) {
    socket.emit('updateStyle', {'html':style});
}
function changePage(socket, urlPath, css, html, title) {
    socket.emit('changePage', {'urlPath':urlPath, 'css':css, 'html':html, 'title':title});
}
function updateHistory(socket, urlPath, html, title) {
    socket.emit('updateHistory', {'urlPath':urlPath, 'html':html, 'title':title});
}
function getRequest(socket, url) {
    var sessid = getSessid(socket);
    request(WEBSITE_DOMAIN +'/'+sessid+'/'+ url, function(error, response, body) {
            if(!error && response.statusCode == 200) {
                    socket.emit("getResponse", {'body':body, 'url':WEBSITE_DOMAIN +''+ url,'code':response.statusCode});
            } else {
                socket.emit("getResponse", {'error':error, 'code':response.statusCode});
            }
    });
}
function postRequest(socket, url, data) {
    request.post({url: WEBSITE_DOMAIN +'/'+sessid+'/'+ url, form: data}, function(error, response, body) {
            if(!error && response.statusCode == 200) {
                    socket.emit("postResponse", {'body':body, 'url':WEBSITE_DOMAIN +''+ url,'code':response.statusCode});
            } else {
                socket.emit("postResponse", {'error':error, 'code':response.statusCode});
            }
    });
}


function getSessid(socket) {
    var cookie = socket.handshake.headers.cookie;
    var sessid = undefined;
    if(cookie != undefined) {
        var cookies = cookie.split("; ");
        cookies.forEach(function(el) {
            var cookieName = (el.split('='))[0];
            var cookieValue = (el.split('='))[1];
            if(config.web.session_cookie == cookieName)
            {
                sessid = cookieValue;
            }
        });
    } else {
        return false;
    }
    return sessid;
}

function routeLink(socket, iolink) {
    var page = routes[iolink];
    console.log(iolink);
    if(page !== undefined && iolink.length > 1) {
        console.log(page.title);
        loadPage(socket, page.title, page.css_file, page.html_file, page.route);
    } else {
        page = routes.error_404;
        loadPage(socket, page.title, page.css_file, page.html_file, page.route);
    }
}
function loadPage(socket, pageTitle, stylePath, htmlPath, iolink) {
    fs.readFile( __dirname + '/files/' + stylePath, function (err, filedatastyle) {
        fs.readFile( __dirname + '/files/' + htmlPath, function (err, filedata) {
            if (err) {
                throw err; 
            }
            changePage(socket, iolink, filedatastyle.toString(), filedata.toString(), pageTitle);
        });
    });
}

var http = require('http');
http.createServer(function (req, res) {
    res.writeHead(301, { "Location": "https://" + req.headers['host'] + req.url });
    res.end();
}).listen(config.web.port);

server.listen(serverPortTLS, function() {
  console.log('server up and running at %s port', serverPortTLS);
});
