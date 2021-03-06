import Xsync from './Xsync';
import ProxySandbox from './ProxySandbox';
import { LifeCycle } from './type';

// 获取hml
const ImportHTML = async (url: string) => {
    const htmlText = await Xsync(url);
    const template = document.createElement('div');
    template.innerHTML = htmlText;

    // 获取所有scripts
    const getExternalScripts = () => Promise.all(
        Array.from(template.querySelectorAll('script')).map((script) => {
            const src = script.getAttribute('src');
            if (src) return Xsync(src.startsWith('http') ? src : `${url}${src}`);
            return Promise.resolve(script.textContent);
        })
    );
    const execScripts = async (name: string, appSandbox: any) => {
        // 代理上下文
        const context = { ...window };
        // const context = { window, document: window.document, history: window.history, location: window.location, navigator: window.navigator, top: window.top };
        // 创建沙箱
        const sandbox = appSandbox ?? new ProxySandbox(name, context);
        sandbox.active();
        const proxyWindow = sandbox.proxy;
        const scripts = await getExternalScripts();
        const instance = ((window) => {
            // 构造CommonJs模块环境
            const module = { exports: {} as LifeCycle }, exports = module.exports;
            scripts.forEach(code => {
                // code && eval(code);
                code && new Function('context', 'module', 'exports', code)(window, module, exports);
            });
            return module.exports;
        })(proxyWindow);
        return { instance, sandbox };
    };

    return { template, execScripts };
};

export default ImportHTML;
