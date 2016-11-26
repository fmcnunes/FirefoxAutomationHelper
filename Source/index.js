var self = require("sdk/self");
const {
    Cc,
    Cu,
    Ci
} = require("chrome");
Cu.import("resource://gre/modules/XPCOMUtils.jsm");
Cu.import("resource://gre/modules/Console.jsm");

/************************************************************************
 *
 * Global variables
 *
 *************************************************************************/

var gWebServerListener;

var serverSocket;

var gCounter = 0;

var gCounterTotal = 0;

var gLastRequest = new Date();

var gLastReset = new Date();

var WebSiteDomainList = "mozilla.org,google.pt"

/************************************************************************
 *
 * Logger
 *
 *************************************************************************/
function LogMessage(msg)
{
    /*console.error(msg);*/
}

/************************************************************************
 *
 * Load and Unload functions
 *
 *************************************************************************/

exports.main = function() {
    LogMessage("FirefoxAutimationHelper loading");

    webServer.onLoad();

    httpRequestObserver.register();

    LogMessage("FirefoxAutimationHelper up and running.");
}

exports.onUnload = function() {
    LogMessage("FirefoxAutimationHelper unloading");

    httpRequestObserver.unregister();

    webServer.onUnLoad();

    LogMessage("FirefoxAutimationHelper unloaded.");
}

/************************************************************************
 *
 * HTTP Request Observers 
 *
 ************************************************************************/

var httpRequestObserver = {
    observe: function(subject, topic, data) {
        subject.QueryInterface(Ci.nsIHttpChannel);
        url = subject.URI.spec;

        var domainList = WebSiteDomainList.split(',');
        for (var i = 0; i < domainList.length; i++) {
            if (url.indexOf(domainList[i]) !== -1) {
                if (topic == "http-on-modify-request") {
                    gCounter++;
                    gCounterTotal++;
                    gLastRequest = new Date();
                    LogMessage("Request (" + gCounter + "): " + topic + " -> " + url);
                } else {
                    gCounter--;
                    gLastRequest = new Date();
                    LogMessage("Resposta (" + gCounter + "): " + topic + " -> " + url);
                }
            }
        }
    },

    get observerService() {
        return Cc["@mozilla.org/observer-service;1"]
            .getService(Ci.nsIObserverService);
    },

    register: function() {
        this.observerService.addObserver(this, "http-on-modify-request", false);
        this.observerService.addObserver(this, "http-on-examine-response", false);
        this.observerService.addObserver(this, 'http-on-examine-cached-response', false);
    },

    unregister: function() {
        this.observerService.removeObserver(this, "http-on-modify-request");
        this.observerService.removeObserver(this, "http-on-examine-response");
        this.observerService.removeObserver(this, "http-on-examine-cached-response");
    }
};

/************************************************************************
 *
 * WebServer 
 *
 ************************************************************************/

var webServer = {
    onLoad: function() {

        LogMessage("Listening for HTTP command requests");
        gWebServerListener = {
            onSocketAccepted: function(socket, transport) {
                LogMessage("> Request received.");
                try {
                    var endTime = new Date();
                    var lastEvent = 0;
                    var LastReset = 0;

                    lastEvent = endTime - gLastRequest;
                    LastReset = endTime - gLastReset;

                    var stream = transport.openOutputStream(0, 0, 0);
                    var streamInput = transport.openInputStream(0, 0, 0);

                    var sin = Cc["@mozilla.org/scriptableinputstream;1"].createInstance(Ci.nsIScriptableInputStream);

                    sin.init(streamInput);


                    var resp = "{ \"Counter\": " + gCounter + ", \"CounterTotal\": " + gCounterTotal + ",\"LastEvent\": " + lastEvent + ",\"LastReset\": " + LastReset + ", \"Version\": 1, \"DomainList\": \"" + WebSiteDomainList + "\"}";
                    var outputString = "HTTP/1.1 200 OK\r\nContent-Length: " + resp.length + "\r\nContent-Type: text/html\r\n\r\n" + resp;

                    LogMessage("> Send response: " + outputString);

                    stream.write(outputString, outputString.length);

                    var request = '';

                    while (sin.available()) {
                        request = request + sin.read(512);
                    }
                    LogMessage('Received: ' + request);

                    var re = new RegExp(/Get\s+\/domainlist=(\S+)\s+HTTP/igm);
                    var match = re.exec(request);

                    LogMessage("Testing received text");

                    if (match !== null) {
                        LogMessage("Match is not null");
                        gCounter = 0;
                        gCounterTotal = 0;
                        gLastRequest = new Date();
                        WebSiteDomainList = match[1];
                        LogMessage("Setting WebSiteDomainList to " + WebSiteDomainList);
                    } else
                        LogMessage("Match is null");

                    var re = new RegExp(/Get\s+\/reset\s+HTTP/igm);
                    var match = re.exec(request);

                    LogMessage("Testing received text");

                    if (match !== null) {
                        LogMessage("Reset counters command received.");
                        gCounter = 0;
                        gCounterTotal = 0;
                        gLastRequest = new Date();
                        gLastReset = new Date();
                    } else
                        LogMessage("Match is null");

                    stream.close();
                    streamInput.close();
                } catch (ex2) {
                    LogMessage("> Error processing Webserver http request" + ex2);
                    dump("::" + ex2);
                }
            },

            onStopListening: function(socket, status) {}
        };


        // Inicia o WebServer
        LogMessage("Starting WebServer on port 8080");
        try {
            const {
                Cc,
                Ci
            } = require("chrome");
            serverSocket = Cc["@mozilla.org/network/server-socket;1"].createInstance(Ci.nsIServerSocket);


            serverSocket.init(8080, false, -1);
            serverSocket.asyncListen(gWebServerListener);
        } catch (ex) {
            LogMessage("Error in WebServer: " + ex);
            dump(ex);
        }
        LogMessage("WebServer is running.");

        this.initialized = true;

    },

    onUnLoad: function() {

        LogMessage("UnLoading WebServer");
        
        serverSocket.close();
    }
};