export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json');

  res.status(200).json({
    status: 'healthy',
    server_time: new Date().toISOString(),
    database: 'connected',
    version: '1.0.0'
  });
}
