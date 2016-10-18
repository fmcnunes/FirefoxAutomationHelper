#Automation Helper
Provides information regarding browser network activity

This Extension implements a simple Web interface that provides network activity information:

 - Number of pending HTTP requests.
 - The elapsed time in ms from the last change of the HTTP requests counter.
 
This information can be used by a Test Framework to determine when the browser finished all network activities:

 - The pending http request count is zero.
 - The http counter is at zero for some amount of time, for example 2 seconds.
 
This Extension is interface is an internal WebServer running on port 8080:

- GET http://localhost/Reset - Resets all counters

- GET http://localhost/domainlist=<comma separated list of domains>' - Set the list of internet domains or Sites to account.
 
- GET http://localhost/ - Returns a JSON response with all metrics collected. Example:

 { "Counter": 0, "Elapsed": 3525, "Version": 1, "DomainList": "mozilla.org,google.pt"}
 
Example of use: RobotFramework with selenium2Library

A Python Library provides the interface:

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
 
 Example of a Robot script using the interface:
 
 
 *** Test Cases ***
HomePage e Login
    KillFirefox
    ${profile_dir}    CreateProfile    ${FF_PROFILE}
    open browser    ${SERVER}    ff    ff_profile_dir=${FF_PROFILE}
    Maximize Browser Window
    SetDomainList    .amazon.
    WaitForNetwork    30    ${waitTimeAfterDownload}
    Input Text    iUserCode    ${UserAccount}
    Click Element    aLogin
 

