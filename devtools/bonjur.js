import { Bonjour } from 'bonjour-service';
const instance = new Bonjour();

// Publish an HTTP service on port 3000 named "My Webserver"
instance.publish({ name: 'ppp', type: 'http', port: 8080, host: 'ppp.local', disableIPv6: true });

// Browse for all HTTP services
instance.find({ type: 'http' }, (service) => {
    console.log('Found HTTP service:', service.name, service.referer.address);
});
