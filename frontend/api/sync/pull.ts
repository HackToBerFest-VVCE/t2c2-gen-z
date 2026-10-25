export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json');

  res.status(200).json({
    tasks: [],
    server_timestamp: new Date().toISOString(),
    total_count: 0
  });
}
