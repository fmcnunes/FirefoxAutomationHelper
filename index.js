var self = require("sdk/self");
const {Cc, Cu, Ci} = require("chrome");
Cu.import("resource://gre/modules/XPCOMUtils.jsm");1

var gCounter = 0;

var gLastRequest = new Date();

var WebSiteDomainList = "mozilla.org,google.pt"

console.log("Extension executed");

StartServer();

console.log("Adding Listener");


/************************************************************************/

var httpRequestObserver =
{
  observe: function(subject, topic, data)
  {
	subject.QueryInterface(Ci.nsIHttpChannel);
    url = subject.URI.spec;
    
    var domainList = WebSiteDomainList.split(',');
    for (var i = 0; i < domainList.length; i++)
    {
        if (url.indexOf(domainList[i]) !== -1)
        {
            if (topic == "http-on-modify-request")
            {
                gCounter++;
                gLastRequest = new Date();
                console.log("Request (" + gCounter + "): " + topic + " -> " + url);
            }
            else
            {
                gCounter--;
                gLastRequest = new Date();
                console.log("Resposta (" + gCounter + "): " + topic + " -> " + url);
            }
        }
    }
  },

  get observerService() {
    return Cc["@mozilla.org/observer-service;1"]
                     .getService(Ci.nsIObserverService);
  },

  register: function()
  {
    this.observerService.addObserver( this, "http-on-modify-request", false);
	this.observerService.addObserver( this, "http-on-examine-response", false);
    this.observerService.addObserver( this, 'http-on-examine-cached-response', false );
    this.observerService.addObserver( this, 'http-on-examine-merged-response', false );
  },

  unregister: function()
  {
    this.observerService.removeObserver(this, "http-on-modify-request");
  }
};

httpRequestObserver.register();

/*************************************************************************************************************/


function StartServer()
{
  console.log("Starting WebServer....");
  var listener =
  {
    onSocketAccepted : function(socket, transport)
    {
	  console.log("> Request received.");
      try {
	    var endTime = new Date();
		var elapsed = 0;
		
		elapsed = endTime-gLastRequest;

        var stream = transport.openOutputStream(0,0,0);
		var streamInput  = transport.openInputStream(0, 0, 0);
        
        var sin = Cc["@mozilla.org/scriptableinputstream;1"].createInstance(Ci.nsIScriptableInputStream);

        sin.init(streamInput);

	
		var resp= "{ \"Counter\": " + gCounter + ", \"Elapsed\": " + elapsed + ", \"Version\": 1, \"DomainList\": \"" + WebSiteDomainList + "\"}";
		var outputString = "HTTP/1.1 200 OK\r\nContent-Length: "+resp.length+"\r\nContent-Type: text/html\r\n\r\n"+resp;
		
        console.log("> Send response: " + outputString);
		
        stream.write(outputString,outputString.length);
        
        var request = '';

        while (sin.available())
        {
          request = request + sin.read(512);
        }
        console.log('Received: ' + request);
        
        var re = new RegExp(/Get\s+\/domainlist=(\S+)\s+HTTP/igm);
        var match = re.exec(request);
        
        console.log("Testing received text");

        if (match !== null)
        {
          console.log("Match is not null");
          gCounter=0;
          gLastRequest = new Date();
          WebSiteDomainList=match[1];
          console.log("Setting WebSiteDomainList to " + WebSiteDomainList);
        }
        else
            console.log("Match is null");
        
        var re = new RegExp(/Get\s+\/reset\s+HTTP/igm);
        var match = re.exec(request);
        
        console.log("Testing received text");

        if (match !== null)
        {
          console.log("Reset counters command received.");
          gCounter=0;
          gLastRequest = new Date();
        }
        else
            console.log("Match is null");
        
        stream.close();
		streamInput.close();
      } catch(ex2){ console.log("> Error processing Webserver http request" + ex2); dump("::"+ex2); }
    },

    onStopListening : function(socket, status){}
  };

  console.log("Starting WebServer on port 8080");
  try {
	const {Cc, Ci} = require("chrome");
    var serverSocket = Cc["@mozilla.org/network/server-socket;1"].createInstance(Ci.nsIServerSocket);


    serverSocket.init(8080,false,-1);
    serverSocket.asyncListen(listener);
  }
  catch(ex)
  { 
    console.log("Error in WebServer: " + ex);
	dump(ex);
  }
  console.log("WebServer is running.");
}



var AutomationHelper = {
  onLoad: function() {
    
	console.log("Starting WebServer");
	// Inicia o WebServer
	StartServer();
	
    this.initialized = true;

  }
};

function getMainWindow() {
	const {Cc, Ci} = require("chrome");
  var windowManager = Cc['@mozilla.org/appshell/window-mediator;1'].getService();
  var windowManagerInterface = windowManager.QueryInterface(Ci.nsIWindowMediator);
  var eb = windowManagerInterface.getEnumerator("navigator:browser");
  if (eb.hasMoreElements()) {
    return eb.getNext().QueryInterface(Ci.nsIDOMWindow);
  }
  return null;
}

function getBrowser() {
  return getMainWindow().getBrowser();
}

