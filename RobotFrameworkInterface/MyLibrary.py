import requests
import time
import psutil
	
def CreateProfile(path):
    from selenium import webdriver
	
    fp =webdriver.FirefoxProfile()
    fp.set_preference("xpinstall.signatures.required",False)
    fp.set_preference("dom.disable_open_during_load", True)
    fp.set_preference("app.update.enabled", False)
    fp.set_preference("extensions.firebug.allPagesActivation", "on");
    fp.set_preference("extensions.firebug.showFirstRunPage ", True);
    fp.set_preference("extensions.firebug.delayLoad ", "false");
    fp.update_preferences()
    return fp.path
	
def SetDomainList(domainList):
    r = requests.get('http://localhost:8080/domainlist=' + domainList);
    return 1;
    
def ResetFFCounters(domainList):
    r = requests.get('http://localhost:8080/reset');
    return 1;
    
def WaitForNetwork(maxTimeWaitTime, waitTimeAfterDownload):
    ' funcao teste'
    for x in range(0, int(maxTimeWaitTime)):
        time.sleep( 1 );
        try:
            r = requests.get('http://localhost:8080');
            result = r.json();
            if int(result['Counter']) == 0 and int(result['Elapsed'] > int(waitTimeAfterDownload)*1000):
                return 0;
        except:
            print "Erro"
    return 1;
	
def KillFirefox():
    PROCNAME = "firefox.exe"
    for proc in psutil.process_iter():
        # check whether the process name matches
        if proc.name() == PROCNAME:
            proc.kill();
    return;