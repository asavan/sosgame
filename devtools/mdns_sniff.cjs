const mDnsSd = require('node-dns-sd');

mDnsSd.ondata = (packet) => {
  console.log(JSON.stringify(packet, null, '  '));
};

mDnsSd.startMonitoring().then(() => {
  console.log('Started.');
}).catch((error) => {
  console.error(error);
});
