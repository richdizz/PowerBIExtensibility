using Microsoft.AspNet.SignalR;
using Newtonsoft.Json.Linq;
using System;
using System.Collections.Generic;
using System.Configuration;
using System.IO;
using System.Linq;
using System.Net;
using System.Text;
using System.Web;
using System.Web.Mvc;

namespace YammerPowerBI.Controllers
{
    public class OAuthController : Controller
    {
        // GET: OAuth
        public ActionResult Authorize(string uid)
        {
            return Redirect("https://www.yammer.com/dialog/oauth?client_id=" +
                ConfigurationManager.AppSettings["yam:ClientID"] +
                "&redirect_uri=" +
                HttpUtility.UrlEncode(Request.Url.AbsoluteUri.ToLower().Replace("authorize", "authorizeresponse")));
        }

        public ActionResult AuthorizeResponse(string uid, string code)
        {
            if (code == null)
                return RedirectToAction("Error", "Home", new { error = "Authorization of the Yammer Group Explorer app failed" });

            //get the access token and send to the user
            var url = String.Format("https://www.yammer.com/oauth2/access_token.json?client_id={0}&client_secret={1}&code={2}",
                    ConfigurationManager.AppSettings["yam:ClientID"], ConfigurationManager.AppSettings["yam:Password"], code);
            HttpWebRequest request = WebRequest.Create(url) as HttpWebRequest;
            using (HttpWebResponse response = request.GetResponse() as HttpWebResponse)
            {
                Encoding encode = System.Text.Encoding.GetEncoding("utf-8");
                StreamReader reader = new StreamReader(response.GetResponseStream(), encode);
                string responseString = reader.ReadToEnd();
                JObject oResponse = JObject.Parse(responseString);
                JToken oAccess_Token = oResponse.SelectToken("access_token.token");
                string access_token = oAccess_Token.ToString();
                IHubContext hub = GlobalHost.ConnectionManager.GetHubContext<TokenHub>();
                hub.Clients.Client(uid).sendToken(access_token);
            }

            return View();
        }
    }
}