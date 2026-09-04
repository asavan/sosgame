import { MDNS } from 'mdns-local'

const mdns = new MDNS()

// mdns.on('ready', () => {
//   const host = mdns.claimHost('ppp')
// 	console.log(host.fqdn)   // 'myrpi.local'
//
// 	host.on('announced', () => {
// 	  console.log('You can now ping ' + host.fqdn);
// 	});
// });


mdns.on('ready', () => {
	// Announce a service
	mdns.advertise({ name: 'ppp', type: '_http._tcp', port: 8080 })
	console.log('ready1');
	// Discover others
	const browser = mdns.discover({ type: '_http._tcp' })
	browser.on('up', (svc) => console.log('found:', svc.name, svc.host, svc.port))
});