using System;
using System.Net.Http;
using System.Threading.Tasks;
using Newtonsoft.Json.Linq;
using Air_Quality_Index_WebApp.Models;

namespace Air_Quality_Index_WebApp.Services
{
    public class WaqiService
    {
        private readonly HttpClient _httpClient;
        private readonly string _token = "97a4a9a0f2d60fd9d574e606047f1022f12aa8a7";

        public WaqiService(HttpClient httpClient)
        {
            _httpClient = httpClient;
        }

        public async Task<JObject> FetchCityFeedAsync(string city)
        {
            var url = $"https://api.waqi.info/feed/{city}/?token={_token}";
            var response = await _httpClient.GetAsync(url);
            response.EnsureSuccessStatusCode();
            var content = await response.Content.ReadAsStringAsync();
            return JObject.Parse(content);
        }
    }
}
