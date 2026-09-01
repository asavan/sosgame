import { MDNS } from 'mdns-local'

const mdns = new MDNS()

mdns.on('ready', () => {
  const host = mdns.claimHost('pp')
	console.log(host.fqdn)   // 'myrpi.local'

	host.on('announced', () => {
	  console.log('You can now ping ' + host.fqdn);
	});
});
