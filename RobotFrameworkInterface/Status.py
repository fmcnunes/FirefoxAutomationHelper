import requests
import time
import psutil

for x in range(0, 3000):
    time.sleep( 1 );
    try:
        r = requests.get('http://localhost:8080');
        result = r.json();
        if result['Counter'] == 0 and result['Elapsed'] > 5000:
            print "Download terminado !";
        print "Counter: " + str(result['Counter']) + ", Elapsed: " + str(result['Elapsed']) + ", Domain List: " + str(result['DomainList'])
    except: 
	    print "Erro"
