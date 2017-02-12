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

var HttpRequests = new Array();

var serverSocket;

var gCounter = 0;

var gCounterTotal = 0;

var gLastRequest = new Date();

var gLastReset = new Date();

var channelId = 0;

var WebSiteDomainList = "webmon"

var activityDistributor = Cc["@mozilla.org/network/http-activity-distributor;1"]
                                    .getService(Ci.nsIHttpActivityDistributor);

var nsIHttpActivityObserver = Ci.nsIHttpActivityObserver;

/************************************************************************
 *
 * Logger
 *
 *************************************************************************/
function LogMessage(msg)
{
    console.info(msg);
}

/************************************************************************
 *
 * Load and Unload functions
 *
 *************************************************************************/

exports.main = function() {
    LogMessage("FirefoxAutomationHelper loading");

    webServer.onLoad();

    httpRequestObserver.register();
    
    activityDistributor.addObserver(httpObserver);

    LogMessage("FirefoxAutomationHelper up and running.");
}

exports.onUnload = function() {
    LogMessage("FirefoxAutomationHelper unloading");

    httpRequestObserver.unregister();

    webServer.onUnLoad();

    LogMessage("FirefoxAutomationHelper unloaded.");
}

/************************************************************************
 *
 * HTTP Request Observers 
 *
 ************************************************************************/
 // Define a reference to the interfacevar nsIHttpActivityObserver = Components.interfaces.nsIHttpActivityObserver;

var httpObserver =
{
    observeActivity: function(aHttpChannel, aActivityType, aActivitySubtype, aTimestamp, aExtraSizeData, aExtraStringData)
    {
        try
        {
            if (aActivityType == nsIHttpActivityObserver.ACTIVITY_TYPE_HTTP_TRANSACTION)
            {
                switch(aActivitySubtype)
                {
                    case nsIHttpActivityObserver.ACTIVITY_SUBTYPE_RESPONSE_HEADER:
                    // received response header
                    break;
                    case nsIHttpActivityObserver.ACTIVITY_SUBTYPE_RESPONSE_COMPLETE:
                    // received complete HTTP response
                    break;
                }
            }
      	}
        catch (ex)
        {
            LogMessage("httpObserver::observeActivity(): Exception= " + ex);
        }
    }
};
/************************************************************************
 *
 * HTTP Request Observers 
 *
 ************************************************************************/

var httpRequestObserver = {
    observe: function(subject, topic, data) {
        subject.QueryInterface(Ci.nsIHttpChannel);
        var url = subject.URI.spec;
		
		var httpChannel = subject.QueryInterface(Ci.nsIHttpChannel);


        if (IsTargetUrl(url))
			{
                if (topic == "http-on-modify-request")
				{
					if (httpChannel instanceof Ci.nsIWritablePropertyBag)
						httpChannel.setProperty("myExtension-channelId", ++channelId);
					
					updateHttpRequest(httpChannel.getProperty("myExtension-channelId"), url, "http-on-examine-request");

                    gCounter++;
                    gCounterTotal++;
                    gLastRequest = new Date();
                    LogMessage("Request (" + gCounter + "): " + topic + " -> " + url);
                } else {
					
					if (httpChannel instanceof Ci.nsIPropertyBag)
						LogMessage("Channel: " + httpChannel.getProperty("myExtension-channelId"));

					updateHttpRequest(httpChannel.getProperty("myExtension-channelId"), url, "http-on-examine-response");
					
                    gCounter--;
                    gLastRequest = new Date();
                    LogMessage("Resposta (" + gCounter + "): " + topic + " -> " + url);
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
        this.observerService.addObserver(this, "http-on-examine-cached-response", false);
        this.observerService.addObserver(this, 'http-on-examine-merged-response', false);
    },

    unregister: function() {
        this.observerService.removeObserver(this, "http-on-modify-request");
        this.observerService.removeObserver(this, "http-on-examine-response");
        this.observerService.removeObserver(this, "http-on-examine-cached-response");
    }
};

/************************************************************************
 *
 * IsTargetUrl
 *
 *************************************************************************/

function IsTargetUrl(url)
{
	var domainList = WebSiteDomainList.split(',');
	for (var i = 0; i < domainList.length; i++)
	{
        if (url.indexOf(domainList[i]) !== -1)
		{
			return true;
		}
	}
	return false;
}

/*********************************************************
*
* HttpRequest Object
*
**********************************************************/

// HttpFoxRequest
function HttpRequestEvent(requestId, httpEvent, url)
{
	try 
	{
		this.requestId = requestId;
		this.lastEvent = httpEvent;
		this.url = url;
	}
	catch (ex)
	{
		LogMessage("HttpRequest::init(): Exception= " + ex);
	}
}
	
HttpRequestEvent.prototype.update = function(httpEvent)
	{
		this.lastEvent = httpEvent;		
	}
	
/*********************************************************
*
* Requests
*
**********************************************************/


function addHttpRequest(requestId, httpEvent, url)
	{
		try
		{
			var request = new HttpRequestEvent(requestId, httpEvent, url);
			HttpRequests.push(request);
		}
		catch (ex)
		{
			LogMessage("HttpRequest::init(): Exception= " + ex);
		}
	}
	
function getHttpRequest(url, requestId)
	{
		try
		{
			for (var i = 0; i < HttpRequests.length; i++) 
			{
				//if (url == HttpRequests[i].url)
                if(requestId == HttpRequests[i].requestId)
				{
					return i;
				}
			}
		}
		catch (ex)
		{
			LogMessage("HttpRequest::init(): Exception= " + ex);
		}
		// no match found
		return -1;
	}
	
    
 function getPendingHttpRequest()
 {
     resp="";
     
     for (var i = 0; i < HttpRequests.length; i++) 
		{
	 	  if (HttpRequests[i].lastEvent == "http-on-examine-request")
				{
					resp = "," + HttpRequests[i].url;
				}
		}
     
     return resp;
 }
function countPendingHttpRequest()
	{
		var cnt = 0;
		try
		{
			LogMessage("PendingHttpRequest....");
			for (var i = 0; i < HttpRequests.length; i++) 
			{
				if (HttpRequests[i].lastEvent == "http-on-examine-request")
				{
					LogMessage("PendingHttpRequest (+) (" + i + "), " + HttpRequests[i].requestId + " , " + HttpRequests[i].url + " , " + HttpRequests[i].lastEvent);
					cnt++;
				}
                else
                   LogMessage("PendingHttpRequest (" + i + "), " + HttpRequests[i].requestId + " , " + HttpRequests[i].url + " , " + HttpRequests[i].lastEvent); 
			}
			LogMessage("PendingHttpRequest..,done cnt=" + cnt + " in " + HttpRequests.length );
		}
		catch (ex)
		{
			LogMessage("updateCount: Exception= " + ex);
		}
		// no match found
		return cnt;
	}
	

function updateHttpRequest(requestId, url, httpEvent)
	{
		try
		{			
			if (IsTargetUrl(url))
			{
		
				LogMessage("updateHttpRequest, " + requestId + " , " + url + " , " + httpEvent);
			
				var index = getHttpRequest(url, requestId);
		
				if (index >= 0)
					HttpRequests[index].update(httpEvent);
				else
					addHttpRequest(requestId, httpEvent, url);
			}
		}
		catch (ex)
		{
			LogMessage("HttpRequest::init(): Exception= " + ex);
		}
	}	


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

					gCounter = countPendingHttpRequest();
                    
				
                    var resp = "{ \"Counter\": " + gCounter + ", \"CounterTotal\": " + gCounterTotal + ",\"LastEvent\": " + lastEvent + ",\"LastReset\": " + LastReset + ", \"Version\": 2.2, \"DomainList\": \"" + WebSiteDomainList + "\", \"PendingRequests\": \"" + getPendingHttpRequest() + "\"}";
                                     
                    
                    
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
						HttpRequests = new Array();
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