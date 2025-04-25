using System.Security.Cryptography;
using System.Text;

namespace Air_Quality_Index_WebApp.Models
{
    public static class AuthHelper
    {
        // Hash password using SHA256 (for demo; use a stronger method in production)
        public static string HashPassword(string password)
        {
            using (var sha = SHA256.Create())
            {
                var bytes = Encoding.UTF8.GetBytes(password);
                var hash = sha.ComputeHash(bytes);
                return BitConverter.ToString(hash).Replace("-", "").ToLower();
            }
        }
    }
}
