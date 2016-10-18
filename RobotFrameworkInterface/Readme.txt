
Status.py

Function: Displays Extension counters.

To execute: cmd> Python Status.py
This directory contains 2 Python Scripts:

1. MyLibrary.py

Contains 2 functions:

 - SetDomainList(domainList)

  Sets the domain list of all Urls to account requests in the browser.

  Example:

  The RobotFramework is testing the urls:

      - http://www.mycompany.pt
      - http://corp.buyWine.pt

   Then the Robot script should execute the instruction:

        
      SetDomainList(".mycomany.,.buyWine.") or
      SetDomainList(".mycomany.pt,.buyWine.pt") or 
      SetDomainList("www.mycomany.pt,corp.buyWine.pt")


 - WaitForNetwork(maxTimeWaitTime, waitTimeAfterDownload):

 This functions waits until 'waitTimeAfterDownload' seconds pass since the number 
 of pending http requests in the browser reached zero.

  maxTimeWaitTime is the total maximum wait time.