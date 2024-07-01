import cluster from 'cluster'
import os from 'os'
import express from 'express'
import fetch from 'node-fetch'
import fs from 'fs'
import path from 'path'
import cors from 'cors';
// import http2 from 'http2';
// import https from 'https'; // 引入https模块
const numCPUs = os.cpus().length;

if (cluster.isMaster) {
  console.log(`主进程 ${process.pid} 正在运行`);

  // 根据CPU核心数量，创建工作进程
  for (let i = 0; i < numCPUs; i++) {
    cluster.fork();
  }

  cluster.on('exit', (worker, code, signal) => {
    console.log(`工作进程 ${worker.process.pid} 已退出`);
    // 自动重启崩溃的工作进程
    cluster.fork();
  });
} else {
  const app = express();
  app.use(express.json());
  app.use(cors());
  
  // getBatteryInfo 路由
  app.post('/api/getBatteryInfo', async (req, res) => {
    try {
      const { token, dcbhurl } = req.body;
      const response = await fetch(`https://jgjfjdcgl.gat.zj.gov.cn:5102/inf_zpm/hz_mysql_api/BatteryBinding/dcinfoquery?token=${token}&dcbhurl=${dcbhurl}`, {
        method: 'GET',
        headers: {
          authority: 'jgjfjdcgl.gat.zj.gov.cn:5102',
          scheme: 'https',
          'accept-encoding': 'gzip',
          'user-agent': 'okhttp/4.9.3',
        },
      });
      const data = await response.json();
      res.status(200).json({ ...data, url: `https://jgjfjdcgl.gat.zj.gov.cn:5102/inf_zpm/hz_mysql_api/BatteryBinding/dcinfoquery?token=${token}&dcbhurl=${dcbhurl}` });
    } catch (error) {
      res.status(200).json({ code: 1 });
    }
  });

  // getBatteryInfoByCarNum 路由
  app.post('/api/getBatteryInfoByCarNum', async (req, res) => {
    try {
      const { cardNum } = req.body;
      const response = await fetch(`https://www.pzcode.cn/vin/${cardNum}`, {
        redirect: 'follow',
      });
      const text = await response.text();
      res.status(200).json({ text, url: `https://www.pzcode.cn/vin/${cardNum}` });
    } catch (error) {
      res.status(200).json({ text: '' });
    }
  });

  // getBatteryInfoByNo 路由
  app.post('/api/getBatteryInfoByNo', async (req, res) => {
    try {
      const { batteryNo } = req.body;
      const response = await fetch(`https://www.pzcode.cn/pwb/${batteryNo}`, {
        redirect: 'follow',
      });
      const text = await response.text();
      const 销售单位未入库 = text.includes('销售单位未入库');
      const 车辆制造商 = text.includes('车辆制造商');

      res.status(200).json({ code: 销售单位未入库 && !车辆制造商 ? 0 : 1, url: `https://www.pzcode.cn/pwb/${batteryNo}` });
    } catch (error) {
      res.status(200).json({ code: 1 });
    }
  });

  // getCarNum 路由
  app.post('/api/getCarNum', async (req, res) => {
    try {
      const { token, cjhurl } = req.body;
      const response = await fetch(`https://jgjfjdcgl.gat.zj.gov.cn:5102/inf_zpm/hz_mysql_api/BatteryBinding/hgzinfoquery?token=${token}&cjhurl=${cjhurl}`, {
        method: 'GET',
        headers: {
          authority: 'jgjfjdcgl.gat.zj.gov.cn:5102',
          scheme: 'https',
          'accept-encoding': 'gzip',
          'user-agent': 'okhttp/4.9.3',
        },
      });
      const data = await response.json();
      res.status(200).json({ ...data, url: `https://jgjfjdcgl.gat.zj.gov.cn:5102/inf_zpm/hz_mysql_api/BatteryBinding/hgzinfoquery?token=${token}&cjhurl=${cjhurl}` });
    } catch (error) {
      res.status(200).json({ code: 1 });
    }
  });

  // login 路由
  app.post('/api/login', async (req, res) => {
    try {
      const { usercode, password } = req.body;
      const response = await fetch(`https://jgjfjdcgl.gat.zj.gov.cn:5102/inf_zpm/hz_mysql_api/BatteryBinding/login?usercode=${usercode}&password=${password}&city=0573`, {
        method: 'GET',
        headers: {
          authority: 'jgjfjdcgl.gat.zj.gov.cn:5102',
          scheme: 'https',
          'accept-encoding': 'gzip',
          'user-agent': 'okhttp/4.9.3',
        },
      });
      const data = await response.json();
      res.status(200).json({ ...data });
    } catch (error) {
      res.status(200).json({ code: 1 });
    }
  });

  // verifyBattery 路由
  app.post('/api/verifyBattery', async (req, res) => {
    try {
      const { token, dcbhurl, cjhurl } = req.body;
      const response = await fetch(`https://jgjfjdcgl.gat.zj.gov.cn:5102/inf_zpm/hz_mysql_api/BatteryBinding/checkCjhDc?city=0573&token=${token}&cjhurl=${cjhurl}&dcbhurl=${dcbhurl}`, {
        method: 'GET',
        headers: {
          authority: 'jgjfjdcgl.gat.zj.gov.cn:5102',
          scheme: 'https',
          'accept-encoding': 'gzip',
          'user-agent': 'okhttp/4.9.3',
        },
      });
      const data = await response.json();
      res.status(200).json({ ...data, url: `/checkCjhDc?dcbhurl=${dcbhurl}&city=0573&token=${token}&cjhurl=${cjhurl}` });
    } catch (error) {
      res.status(200).json({ code: 1 });
    }
  });

  // devices 路由
  const dataFilePath = path.join(process.cwd(), 'data', 'devices.json');

  const readData = () => {
    try {
      if (!fs.existsSync(path.dirname(dataFilePath))) {
        fs.mkdirSync(path.dirname(dataFilePath), { recursive: true });
      }
      const data = fs.readFileSync(dataFilePath, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      return [];
    }
  };

  const writeData = (data) => {
    fs.writeFileSync(dataFilePath, JSON.stringify(data, null, 2));
  };

  app.get('/api/devices', (req, res) => {
    const devices = readData() ?? [];
    res.status(200).json({ code: 0, devices });
  });

  app.post('/api/devices', (req, res) => {
    try {
      const { deviceId, enabled } = req.body;
      const currentData = readData();
      const newDevice = { deviceId, enabled };
      currentData.push(newDevice);
      writeData(currentData);
      res.status(200).json({ code: 0, devices: currentData });
    } catch (error) {
      res.status(500).json({ code: 1, message: 'Error processing POST request' });
    }
  });

  app.put('/api/devices', (req, res) => {
    try {
      const { deviceId: updateDeviceId, enabled: updateEnabled } = req.body;
      let dataToUpdate = readData();
      dataToUpdate = dataToUpdate.map((device) =>
        device.deviceId === updateDeviceId ? { ...device, enabled: updateEnabled } : device
      );
      writeData(dataToUpdate);
      res.status(200).json({ code: 0, devices: dataToUpdate });
    } catch (error) {
      res.status(500).json({ code: 1, message: 'Error processing PUT request' });
    }
  });

  app.delete('/api/devices', (req, res) => {
    try {
      const { deviceId: deleteDeviceId } = req.body;
      let dataToDelete = readData();
      dataToDelete = dataToDelete.filter((device) => device.deviceId !== deleteDeviceId);
      writeData(dataToDelete);
      res.status(200).json({ code: 0, devices: dataToDelete });
    } catch (error) {
      res.status(500).json({ code: 1, message: 'Error processing DELETE request' });
    }
  });

  const PORT = process.env.PORT || 3001;
  app.listen(PORT, () => {
    console.log(`工作进程 ${process.pid} 正在监听 ${PORT} 端口`);
  });
}
