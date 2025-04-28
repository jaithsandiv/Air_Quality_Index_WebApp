using System.Security.Cryptography;
using System;
using System.Text;

namespace Air_Quality_Index_WebApp.Services
{
    public class PasswordHashService
    {
        // Hashes a plain password using SHA256
        public static string HashPassword(string password)
        {
            if (string.IsNullOrEmpty(password))
                return string.Empty;
            using (var sha256 = SHA256.Create())
            {
                var bytes = Encoding.UTF8.GetBytes(password);
                var hash = sha256.ComputeHash(bytes);
                return BitConverter.ToString(hash).Replace("-", "").ToLowerInvariant();
            }
        }

        // Verifies a plain password against a SHA256 hash
        public static bool VerifyPassword(string password, string passwordHash)
        {
            if (string.IsNullOrEmpty(password) || string.IsNullOrEmpty(passwordHash))
                return false;
            using (var sha256 = SHA256.Create())
            {
                var bytes = Encoding.UTF8.GetBytes(password);
                var hash = sha256.ComputeHash(bytes);
                var hashString = BitConverter.ToString(hash).Replace("-", "").ToLowerInvariant();
                return hashString == passwordHash.ToLowerInvariant();
            }
        }
    }
}