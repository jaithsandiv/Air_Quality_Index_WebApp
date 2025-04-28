using Microsoft.Extensions.Hosting;

namespace Air_Quality_Index_WebApp.Services
{
    public class SimulationServiceAccessor
    {
        private readonly IEnumerable<IHostedService> _hostedServices;

        public SimulationServiceAccessor(IEnumerable<IHostedService> hostedServices)
        {
            _hostedServices = hostedServices;
        }

        public SimulationService GetSimulationService()
        {
            return _hostedServices.OfType<SimulationService>().FirstOrDefault();
        }
    }
}