const { exec } = require('child_process');
const { promisify } = require('util');
const os = require('os');

const execAsync = promisify(exec);
const port = process.argv[2] || 3000;
const platform = os.platform();

async function killPort() {
  let command;
  let pids = [];

  if (platform === 'win32') {
    // Windows
    try {
      const { stdout } = await execAsync(`netstat -ano | findstr :${port}`);
      const lines = stdout.trim().split('\n').filter(line => line.trim());
      
      lines.forEach(line => {
        const parts = line.trim().split(/\s+/);
        if (parts.length > 0) {
          const pid = parts[parts.length - 1];
          if (pid && !isNaN(pid) && pid !== '0') {
            pids.push(pid);
          }
        }
      });
    } catch (error) {
      // Port not in use
      console.log(`Port ${port} is not in use.`);
      return;
    }
  } else {
    // Linux/Mac
    try {
      const { stdout } = await execAsync(`lsof -ti:${port}`);
      pids = stdout.trim().split('\n').filter(pid => pid);
    } catch (error) {
      // Port not in use
      console.log(`Port ${port} is not in use.`);
      return;
    }
  }

  if (pids.length === 0) {
    console.log(`Port ${port} is not in use.`);
    return;
  }

  // Kill all processes
  const killPromises = pids.map(async (pid) => {
    try {
      if (platform === 'win32') {
        await execAsync(`taskkill /F /PID ${pid}`);
        console.log(`✓ Killed process ${pid} on port ${port}`);
      } else {
        await execAsync(`kill -9 ${pid}`);
        console.log(`✓ Killed process ${pid} on port ${port}`);
      }
    } catch (err) {
      // Process might already be killed, ignore error
      if (!err.message.includes('not found') && !err.message.includes('no running instance')) {
        console.log(`⚠ Could not kill process ${pid}: ${err.message}`);
      }
    }
  });

  await Promise.all(killPromises);
  
  // Wait a bit for port to be released
  await new Promise(resolve => setTimeout(resolve, 500));
}

killPort().catch(console.error);
