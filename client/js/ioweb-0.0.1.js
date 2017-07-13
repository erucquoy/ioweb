var ioweb = {
    statusbar: {
        init: function()
        {
            $(".app-statusbar-open, .app-statusbar-close").on("click",function () {
                ioweb.statusbar.open($(this).attr('href'));
                return false;
            });   
        },
        open: function(id)
        {            
            $(".app-statusbar").fadeOut("slow");           
            if($(id).is(":hidden")) $(id).fadeIn();            
        },
        close: function(){            
            $(".app-statusbar").fadeOut("slow");
        }
    },
    socket: io('https://localhost/global',{secure: true}),
    socket_init: function() {
        io('https://localhost/global',{secure: true});

        ioweb.socket.on('updateHTMLContent', function(data) {
            $(data.ref).html(data.data);
        });
        ioweb.socket.on('updateMainContent', function(data) {
            $('#content').html(data.data);
        });
        ioweb.socket.on('updateAttribut', function(data) {
            $(data.ref).attr(data.attr, data.data);
        });
        ioweb.socket.on('createCookie', function(data) {
            Cookies.set(data.name, data.data, {expires: data.time});
        });
        ioweb.socket.on('removeCookie', function(data) {
            Cookies.remove(data.name);
        });
        ioweb.socket.on('updateTitle', function(data) {
            document.title = data.title;
        });
        ioweb.socket.on('getResponse', function(data) {

        });
        ioweb.socket.on('postResponse', function(data) {

        });
        ioweb.socket.on('updateStyle', function(data) {
            $('#style').html(data.html);
        });
        ioweb.socket.on('changePage', function(data) {
            changePage(data);
        });
        ioweb.socket.on('initSession', function(data) {
            ioweb.statusbar.close();
            if(Cookies.get(data.cookie) != undefined) {
                this.socket.emit('setSessId', {'sessid':Cookies.get(data.cookie)});
            } else {
                var val = randomString(32);
                Cookies.set(data.cookie, val , {expires: 365});
                this.socket.emit('setSessId', {'sessid':val});
            }
            var linkBrowser = (document.URL.split(".tech/")[1]);
            if(linkBrowser != undefined && linkBrowser.length > 1) {
                getIOLink('/' + linkBrowser);
            } else {
                getIOLink('/default');
            }
        });
        ioweb.socket.on('init', function(data) {
            ioweb.statusbar.close();
            var linkBrowser = (document.URL.split(".tech/")[1]);
            if(linkBrowser != undefined && linkBrowser.length > 1) {
                getIOLink('/' + linkBrowser);
            } else {
                getIOLink('/default');
            }
        });
        ioweb.socket.on('disconnect', function(data) {
            ioweb.statusbar.open('#statusbar_disconnect');
        });
    }
};
/*
var socket = io('https://ercq.tech/global',{secure: true});

socket.on('updateHTMLContent', function(data) {
    $(data.ref).html(data.data);
});
socket.on('updateMainContent', function(data) {
    $('#content').html(data.data);
});
socket.on('updateAttribut', function(data) {
    $(data.ref).attr(data.attr, data.data);
});
socket.on('createCookie', function(data) {
    Cookies.set(data.name, data.data, {expires: data.time});
});
socket.on('removeCookie', function(data) {
    Cookies.remove(data.name);
});
socket.on('updateTitle', function(data) {
    document.title = data.title;
});
socket.on('getResponse', function(data) {

});
socket.on('postResponse', function(data) {

});
socket.on('updateStyle', function(data) {
	$('#style').html(data.html);
});
socket.on('changePage', function(data) {
	changePage(data);
});
socket.on('initSession', function(data) {
    ioweb.statusbar.close();
    if(Cookies.get(data.cookie) != undefined) {
        socket.emit('setSessId', {'sessid':Cookies.get(data.cookie)});
    } else {
        var val = randomString(32);
        Cookies.set(data.cookie, val , {expires: 365});
        socket.emit('setSessId', {'sessid':val});
    }
    var linkBrowser = (document.URL.split(".tech/")[1]);
    if(linkBrowser != undefined && linkBrowser.length > 1) {
        getIOLink('/' + linkBrowser);
    } else {
	    getIOLink('/default');
    }
});
socket.on('init', function(data) {
    ioweb.statusbar.close();
    var linkBrowser = (document.URL.split(".tech/")[1]);
    if(linkBrowser != undefined && linkBrowser.length > 1) {
        getIOLink('/' + linkBrowser);
    } else {
	    getIOLink('/default');
    }
});
socket.on('disconnect', function(data) {
    ioweb.statusbar.open('#statusbar_disconnect');
});*/

function getIOLink(iolink) {
	ioweb.socket.emit('getLink', {'iolink':iolink});
}

var randomString = function(length) {
    var text = "";
    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    for(var i = 0; i < length; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
}

$('body').click(function(e) {
	var target = e.target;
	var iolink = $(target).attr('io-link');
	if(iolink !== undefined) {
		getIOLink(iolink);
	}
});

function changePage(data){
	$('#style').html(data.css);
	$('#content').html(data.html);
	document.title = data.title;
    window.history.pushState({"html":data.html,"pageTitle":data.title},"", data.urlPath);
}

ioweb.statusbar.init(); 
ioweb.socket_init();