import electron = require('electron');
import path = require('path');
import url = require('url');

const app = electron.app;//控制应用生命周期的模块
const BrowserWindow = electron.BrowserWindow;
//指向窗口对象的全局引用，如果没有这个引用，那么当该javascript对象被垃圾回收的时候窗口会自动关闭

let mainWindow :Electron.BrowserWindow;

function createWindow(){//创建一个新的浏览器窗口
    mainWindow = new BrowserWindow({width: 800, height: 600})
    //装载应用的index.html页面
    mainWindow.loadURL(url.format({
        pathname: path.join(__dirname, '../html/index.html'),
        protocol: "file:",
        slashes: true,
    }))

    //mainWindow.webContents.openDevTools()

    mainWindow.on('closed', () => {
        mainWindow = null;
    })//窗口关闭时的调用方法，解除窗口对象的引用，
}
//当electron完成初始化并创建了浏览器窗口，则该方法将会被调用，有些API只能在该事件发生后才能被使用
app.on('ready', createWindow);

//所有的窗口被关闭时退出应用
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin'){
        app.quit()
    }
})

app.on('activate', () => {
    if (mainWindow === null){//对于OS X系统，当dock图标被点击后会重新创建一个app窗口，并且不会有其他窗口打开
        createWindow()
    }
})