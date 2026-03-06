const { app, BrowserWindow } = require('electron');
const path = require('path');
const isDev = !app.isPackaged;

function createWindow() {
  const win = new BrowserWindow({
    width: 1400,
    height: 900,
    title: "Talk Plan OS - Tactical Workspace",
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
    // 상단 메뉴바를 완전히 제거하여 전용 프로그램 느낌을 준다.
    autoHideMenuBar: true 
  });

  if (isDev) {
    // 개발 중에는 Vite 서버(5173)를 연결한다.
    win.loadURL('http://localhost:5173');
  } else {
    // 빌드 후에는 생성된 index.html 파일을 직접 연다.
    win.loadFile(path.join(__dirname, 'dist/index.html'));
  }
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});