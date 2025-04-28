using System.Diagnostics;
using Microsoft.AspNetCore.Mvc;
using Air_Quality_Index_WebApp.Models;

namespace Air_Quality_Index_WebApp.Controllers;

public class HomeController : Controller
{
    private readonly ILogger<HomeController> _logger;
    private readonly Air_Quality_Index_WebApp.Data.AirQualityContext _context;

    public HomeController(ILogger<HomeController> logger, Air_Quality_Index_WebApp.Data.AirQualityContext context)
    {
        _logger = logger;
        _context = context;
    }

    [ResponseCache(Duration = 0, Location = ResponseCacheLocation.None, NoStore = true)]
    public IActionResult Error()
    {
        return View(new ErrorViewModel { RequestId = Activity.Current?.Id ?? HttpContext.TraceIdentifier });
    }
}
