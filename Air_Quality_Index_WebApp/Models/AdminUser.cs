using System.ComponentModel.DataAnnotations;

namespace Air_Quality_Index_WebApp.Models
{
    public class AdminUser
    {
        [Key]
        public int AdminUserId { get; set; }

        [Required]
        [StringLength(50)]
        public string Username { get; set; } = string.Empty;

        [Required]
        [StringLength(256)]
        public string PasswordHash { get; set; } = string.Empty;

        [Required]
        [StringLength(100)]
        [EmailAddress]
        public string Email { get; set; } = string.Empty;
    }
}
