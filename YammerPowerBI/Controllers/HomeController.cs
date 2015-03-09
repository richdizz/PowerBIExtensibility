using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using System.Web;
using System.Web.Mvc;
using YammerPowerBI.Models;

namespace YammerPowerBI.Controllers
{
    public class HomeController : Controller
    {
        //this is really a single page app, but we mark home with Authorize to ensure logged in 
        [Authorize]
        public ActionResult Index()
        {
            return View();
        }

        [Authorize]
        public ActionResult Tester()
        {
            return View();
        }

        public ActionResult Error(string error)
        {
            return View(error);
        }
    }
}