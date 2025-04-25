using Air_Quality_Index_WebApp.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;
using System.Security.Claims;
using System.Threading.Tasks;
using System.Linq;
using Air_Quality_Index_WebApp.Data;

namespace Air_Quality_Index_WebApp.Controllers
{
    public class AccountController : Controller
    {
        private readonly AirQualityContext _context;
        public AccountController(AirQualityContext context)
        {
            _context = context;
        }

        [HttpPost]
        public async Task<IActionResult> Login([FromForm] string username, [FromForm] string password)
        {
            var user = _context.AdminUsers.FirstOrDefault(u => u.Username == username);
            if (user != null && AuthHelper.VerifyPassword(password, user.PasswordHash))
            {
                var claims = new[]
                {
                    new Claim(ClaimTypes.Name, user.Username),
                    new Claim(ClaimTypes.Role, "Admin")
                };
                var identity = new ClaimsIdentity(claims, CookieAuthenticationDefaults.AuthenticationScheme);
                var principal = new ClaimsPrincipal(identity);
                await HttpContext.SignInAsync(CookieAuthenticationDefaults.AuthenticationScheme, principal);
                return Json(new { success = true });
            }
            return Json(new { success = false, error = "Invalid username or password." });
        }

        [HttpPost]
        public async Task<IActionResult> Logout()
        {
            await HttpContext.SignOutAsync(CookieAuthenticationDefaults.AuthenticationScheme);
            return RedirectToAction("Index", "Home");
        }
    }
}
