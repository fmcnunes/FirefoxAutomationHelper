using System;
using System.Text;
using System.Net;
using System.IO;
using System.Threading;

namespace FireFoxHelperLib
{
    public class BrowserCounters
    {

        public int Counter { get; set; }
        public int CounterTotal { get; set; }
        public int LastReset { get; set; }
        public int LastEvent { get; set; }
        public string Version { get; set; }
        public string DomainList { get; set; }

        public BrowserCounters ()
        {
            Counter = 0;
            CounterTotal = 0;
            LastReset = 0;
            LastEvent = 0;
            Version = "?";
            DomainList = "?";
        }
    }

    public class FireFoxHelper
    {
        private String FirefoxUrl = @"http://localhost:8080";
        private static object oLock = new object();

        public FireFoxHelper(String ffUrl)
        {
            FirefoxUrl = ffUrl;
        }

        public FireFoxHelper()
        {
        }

        public String SetUrlfilter(String filter)
        {
            BrowserCounters browserCounters = new BrowserCounters();

            try
            {
                browserCounters = GetData(@"/domainlist=" + filter);
                browserCounters = GetData(@"/domainlist=" + filter);
                if (browserCounters.DomainList.Equals(filter))
                    return "OK";

            }
            catch (Exception ex)
            {
                return ex.Message;
            }
            return "FAIL";
        }

        public String ResetBrowserCounters(out BrowserCounters BrowserCounters)
        {
            BrowserCounters = new BrowserCounters();

            try
            {
                GetData(@"/reset");
                BrowserCounters = GetData(@"/reset");
            }
            catch (Exception ex)
            {
                return ex.Message;
            }
            return "OK";
        }

        public BrowserCounters GetData()
        {
            return GetData("");
        }

        public BrowserCounters GetData(String url)
        {
            BrowserCounters browserCounters = new BrowserCounters();
            lock (oLock)
            {
                for (int i = 0; i < 10; i++)
                {
                    try
                    {
                        String json = GET(FirefoxUrl + url);

                        if (json.Contains("{"))
                        {
                            browserCounters = new System.Web.Script.Serialization.JavaScriptSerializer().Deserialize<BrowserCounters>(json);
                            return browserCounters;
                        }
                    }
                    catch (Exception) { }
                    Thread.Sleep(200);
                }
            }
            return browserCounters;
        }


        private string GET(string url)
        {
            HttpWebRequest request = (HttpWebRequest)WebRequest.Create(url);
            request.Timeout = 450000;
            try
            {
                WebResponse response = request.GetResponse();
                using (Stream responseStream = response.GetResponseStream())
                {
                    StreamReader reader = new StreamReader(responseStream, Encoding.UTF8);
                    return reader.ReadToEnd();
                }
            }
            catch (WebException ex)
            {
                WebResponse errorResponse = ex.Response;

                try
                {
                    using (Stream responseStream = errorResponse.GetResponseStream())
                    {
                        StreamReader reader = new StreamReader(responseStream, Encoding.GetEncoding("utf-8"));
                        String errorText = reader.ReadToEnd();
                        // log errorText
                    }
                }
                catch (Exception) { }
                return "";
            }
        }


    }
}
