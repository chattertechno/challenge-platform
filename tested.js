const Dash = require('dash')

const client = new Dash.Client({ network: 'testnet' })

async function connect() {
  return await client.getDAPIClient().core.getBestBlockHash()
}

connect()
  .then((d) => console.log('Connected. Best block hash:\n', d))
  .catch((e) => console.error('Something went wrong:\n', e))
  .finally(() => client.disconnect())
